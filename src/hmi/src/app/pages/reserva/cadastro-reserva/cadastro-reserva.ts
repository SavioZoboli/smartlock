import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { provideNgxMask } from 'ngx-mask';
import { Observable, firstValueFrom } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { UnidadeService } from '../../../services/unidade.service';
import { SmartlockService } from '../../../services/smartlock.service';
import { EquipamentoService } from '../../../services/equipamento.service';
import { ReservaService } from '../../../services/reserva.service';
import { SystemNotificationService } from '../../../services/system-notification.service';
import { ISmartlock } from '../../../interfaces/smartlock.interface';
import { UnidadeComRegionalDTO } from '../../../dto/UnidadeComRegional.dto';
import { filtrarAutocomplete } from '../../../shared/util/autocomplete-filtro.util';
import { displayUnidadeComRegional } from '../../../shared/util/autocomplete-display.util';
import { objetoSelecionadoValidator } from '../../../shared/validators/objeto-selecionado.validator';
import { HORA_PATTERN, combinarDataHora, formatarHora } from '../../../shared/util/data-hora.util';
import {
  EquipamentoComReservas,
  isEquipamentoReservadoPorOutro,
  normalizarEquipamentoReservas,
  periodoValidoValidator,
} from './reserva.util';

@Component({
  selector: 'app-cadastro-reserva',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatSelectModule,
    MatDatepickerModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  providers: [provideNgxMask(), provideNativeDateAdapter()],
  templateUrl: './cadastro-reserva.html',
  styleUrls: ['./cadastro-reserva.scss'],
})
export class CadastroReserva implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly unidadeService = inject(UnidadeService);
  private readonly smartlockService = inject(SmartlockService);
  private readonly equipamentoService = inject(EquipamentoService);
  private readonly reservaService = inject(ReservaService);
  private readonly sns = inject(SystemNotificationService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  reservaForm: FormGroup;

  unidades: UnidadeComRegionalDTO[] = [];
  filteredUnidades!: Observable<UnidadeComRegionalDTO[]>;

  smartlocks: ISmartlock[] = [];

  equipamentosDisponiveis = signal<EquipamentoComReservas[]>([]);
  equipamentosSelecionados = new Set<number>();

  equipamentosDaReservaAtual: number[] = [];

  reserva_id!: number | null;
  isLoading = signal(false);
  carregandoEquipamentos = signal(false);
  tentouSalvarSemEquipamento = false;

  readonly displayUnidade = displayUnidadeComRegional;

  constructor() {
    this.reservaForm = this.fb.group(
      {
        unidade: ['', [Validators.required, objetoSelecionadoValidator]],
        smartlock: [
          { value: '', disabled: true },
          [Validators.required, objetoSelecionadoValidator],
        ],
        data_emprestimo: ['', Validators.required],
        hora_emprestimo: ['', [Validators.required, Validators.pattern(HORA_PATTERN)]],
        data_devolucao: ['', Validators.required],
        hora_devolucao: ['', [Validators.required, Validators.pattern(HORA_PATTERN)]],
      },
      { validators: periodoValidoValidator },
    );
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.reserva_id = idParam ? Number(idParam) : null;

    this.inicializarDados();
  }

  private async inicializarDados(): Promise<void> {
    this.isLoading.set(true);
    this.reservaForm.disable();

    await this.carregarUnidades();

    this.initAutocompleteFilter();
    this.initReacaoUnidade();
    this.initReacaoEquipamentos();

    if (this.reserva_id) {
      await this.carregarDadosReserva();
    } else {
      this.reservaForm.enable();
      this.reservaForm.get('smartlock')?.disable();
    }

    this.isLoading.set(false);

    // Mesmo motivo do cadastro-smartlock: patchValue dispara valueChanges
    // assincronamente e pode gerar NG0100 sem essa checagem manual.
    this.cdr.detectChanges();
  }

  private async carregarUnidades(): Promise<void> {
    try {
      this.unidades = (await firstValueFrom(
        this.unidadeService.listAll(),
      )) as UnidadeComRegionalDTO[];
    } catch (err) {
      this.sns.notificarErro(err, 'Erro ao carregar unidades.');
    }
  }

  private async carregarSmartlocks(unidade_id: number): Promise<void> {
    try {
      this.smartlocks = await firstValueFrom(this.smartlockService.listByUnidade(unidade_id));
    } catch (err) {
      this.sns.notificarErro(err, 'Erro ao carregar smartlocks da unidade.');
    }
  }

  private initAutocompleteFilter(): void {
    this.filteredUnidades = filtrarAutocomplete(
      this.reservaForm.get('unidade')!,
      this.unidadeService.listAll() as Observable<UnidadeComRegionalDTO[]>,
      'nome',
    );
  }

  // Ao trocar a unidade, refiltra os smartlocks e limpa a seleção anterior
  // (smartlock + equipamentos), já que eles não pertencem mais ao contexto.
  private initReacaoUnidade(): void {
    this.reservaForm
      .get('unidade')!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((unidade) => {
        const smartlockControl = this.reservaForm.get('smartlock')!;

        if (unidade && typeof unidade !== 'string') {
          this.smartlocks = [];
          this.carregarSmartlocks(unidade.id);
          smartlockControl.enable();
        } else {
          smartlockControl.disable();
        }

        smartlockControl.setValue('');
        this.limparEquipamentos();
      });
  }

  private initReacaoEquipamentos(): void {
    this.reservaForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (!this.reservaForm.valid) {
          return;
        }
        this.carregarEquipamentosDisponiveis();
      });
  }

  isReservadoPorOutro(equipamento: EquipamentoComReservas): boolean {
    return isEquipamentoReservadoPorOutro(equipamento, this.equipamentosDaReservaAtual);
  }

  private limparEquipamentos(): void {
    this.equipamentosDisponiveis.set([]);
    this.equipamentosSelecionados.clear();
  }

  private async carregarEquipamentosDisponiveis(): Promise<void> {
    this.carregandoEquipamentos.set(true);
    this.limparEquipamentos();

    const { smartlock, data_emprestimo, hora_emprestimo, data_devolucao, hora_devolucao } =
      this.reservaForm.value;

    const dt_reserva = combinarDataHora(data_emprestimo, hora_emprestimo);
    const dt_devolucao = combinarDataHora(data_devolucao, hora_devolucao);

    try {
      const equipamentos = await firstValueFrom(
        this.equipamentoService.buscarDisponveisData(smartlock.id, dt_reserva, dt_devolucao),
      );

      this.equipamentosDisponiveis.set(normalizarEquipamentoReservas(equipamentos));
    } catch (err) {
      this.sns.notificarErro(err, 'Erro ao carregar equipamentos disponíveis.');
    } finally {
      this.carregandoEquipamentos.set(false);
    }
  }

  toggleEquipamento(equipamento: EquipamentoComReservas): void {
    if (this.isReservadoPorOutro(equipamento)) return;
    if (this.equipamentosSelecionados.has(equipamento.id)) {
      this.equipamentosSelecionados.delete(equipamento.id);
    } else {
      this.equipamentosSelecionados.add(equipamento.id);
    }
  }

  isSelecionado(equipamento: EquipamentoComReservas): boolean {
    return this.equipamentosSelecionados.has(equipamento.id);
  }

  selecionarTodos(): void {
    this.equipamentosDisponiveis().forEach((e) => {
      if (this.isReservadoPorOutro(e)) return;
      this.equipamentosSelecionados.add(e.id);
    });
  }

  limparSelecao(): void {
    this.equipamentosSelecionados.clear();
  }

  get todosSelecionados(): boolean {
    const selecionaveis = this.equipamentosDisponiveis().filter(
      (e) => !this.isReservadoPorOutro(e),
    );

    return selecionaveis.length > 0 && this.equipamentosSelecionados.size === selecionaveis.length;
  }

  get nenhumEquipamentoSelecionado(): boolean {
    return this.equipamentosSelecionados.size === 0;
  }

  private async carregarDadosReserva(): Promise<void> {
    try {
      const dados = await firstValueFrom(this.reservaService.getById(this.reserva_id!));

      const unidade = this.unidades.find((u) => u.id === dados.unidade_id);
      this.reservaForm.enable({ emitEvent: false });

      const dataEmprestimo = new Date(dados.data_hora_emprestimo);
      const dataDevolucao = new Date(dados.data_hora_devolucao_prevista);

      // Guarda os equipamentos já vinculados a ESTA reserva, para diferenciar
      // de equipamentos reservados por outras reservas.
      this.equipamentosDaReservaAtual = (dados.equipamentos ?? []).map((e: any) => e.id);

      // emitEvent:false em tudo abaixo -> impede que initReacaoUnidade/
      // initReacaoEquipamentos disparem sozinhos com dados parciais.
      this.reservaForm.patchValue(
        {
          unidade,
          data_emprestimo: dataEmprestimo,
          hora_emprestimo: formatarHora(dataEmprestimo),
          data_devolucao: dataDevolucao,
          hora_devolucao: formatarHora(dataDevolucao),
        },
        { emitEvent: false },
      );

      // 1. Busca smartlocks da unidade selecionada
      await this.carregarSmartlocks(dados.unidade_id);

      // 2. Seleciona a smartlock vinculada à reserva
      const smartlock = this.smartlocks.find((s) => s.id === dados.smartlock_id);
      this.reservaForm.get('smartlock')?.enable({ emitEvent: false });
      this.reservaForm.get('smartlock')?.setValue(smartlock ?? '', { emitEvent: false });

      // 3. Só agora busca os equipamentos disponíveis (já com unidade/smartlock/horários prontos)
      await this.carregarEquipamentosDisponiveis();

      // 4. Compara com os equipamentos da reserva e marca como selecionado
      this.equipamentosDaReservaAtual.forEach((id) => this.equipamentosSelecionados.add(id));
    } catch (err) {
      this.sns.notificarErro(err, 'Erro ao carregar reserva. Ela pode não existir.');
    }
  }

  salvar(): void {
    this.tentouSalvarSemEquipamento = this.nenhumEquipamentoSelecionado;

    if (this.reservaForm.valid && !this.nenhumEquipamentoSelecionado) {
      const { smartlock, data_emprestimo, hora_emprestimo, data_devolucao, hora_devolucao } =
        this.reservaForm.value;

      const horaEmpTrim = typeof hora_emprestimo === 'string' ? hora_emprestimo.trim() : hora_emprestimo;
      const horaDevTrim = typeof hora_devolucao === 'string' ? hora_devolucao.trim() : hora_devolucao;

      const dh_emprestimo = combinarDataHora(data_emprestimo, horaEmpTrim);
      const dh_devolucao = combinarDataHora(data_devolucao, horaDevTrim);

      const equipamentos = Array.from(this.equipamentosSelecionados);

      this.isLoading.set(true);
      this.reservaForm.disable();

      const requisicao$ = this.reserva_id
        ? this.reservaService.update(this.reserva_id, dh_emprestimo, dh_devolucao, equipamentos)
        : this.reservaService.create(smartlock.id, dh_emprestimo, dh_devolucao, equipamentos);

      requisicao$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          const acao = this.reserva_id ? 'atualizada' : 'cadastrada';
          this.sns.notificar(`Reserva ${acao} com sucesso!`, 'sucesso');
          this.router.navigate(['/reservas/lista']);
        },
        error: (err: any) => {
          this.sns.notificarErro(err);
          this.isLoading.set(false);
          this.reservaForm.enable();
        },
      });
    } else {
      this.reservaForm.markAllAsTouched();

      if (this.reservaForm.hasError('periodoInvalido')) {
        this.sns.notificar('A devolução deve ser depois do empréstimo.', 'erro');
      } else if (this.nenhumEquipamentoSelecionado) {
        this.sns.notificar('Selecione ao menos um equipamento.', 'erro');
      } else {
        this.sns.notificar('Por favor, verifique os campos.', 'erro');
      }
    }
  }

  onCancelar(): void {
    this.router.navigate(['/reservas/lista']);
  }
}
