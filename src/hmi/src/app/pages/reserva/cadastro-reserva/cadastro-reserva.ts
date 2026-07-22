import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
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
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { Observable, firstValueFrom, forkJoin, map, startWith } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { Unidade } from '../../unidade/lista-unidade/lista-unidade';
import { UnidadeService } from '../../../services/unidade.service';
import { Smartlock } from '../../smartlock/lista-smartlock/lista-smartlock';
import { SmartlockService } from '../../../services/smartlock.service';
import { Equipamento } from '../../../models/equipamento.model';
import { EquipamentoService } from '../../../services/equipamento.service';
import { ReservaService } from '../../../services/reserva.service';
import { SystemNotificationService } from '../../../services/system-notification.service';

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
    NgxMaskDirective,
  ],
  providers: [provideNgxMask(), provideNativeDateAdapter()],
  templateUrl: './cadastro-reserva.html',
  styleUrls: ['./cadastro-reserva.scss'],
})
export class CadastroReserva implements OnInit {
  reservaForm: FormGroup;

  unidades: Unidade[] = [];
  filteredUnidades!: Observable<Unidade[]>;

  private smartlocks: Smartlock[] = [];
  smartlocksDaUnidade: Smartlock[] = [];

  equipamentosDisponiveis: any = [];
  equipamentosSelecionados = new Set<number>();

  reserva_id!: number | null;
  isLoading = false;
  carregandoEquipamentos = false;
  tentouSalvarSemEquipamento = false;

  private readonly horaPattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private unidadeService: UnidadeService,
    private smartlockService: SmartlockService,
    private equipamentoService: EquipamentoService,
    private reservaService: ReservaService,
    private sns: SystemNotificationService,
    private cdr: ChangeDetectorRef,
  ) {
    this.reservaForm = this.fb.group(
      {
        unidade: ['', Validators.required],
        smartlock: [{ value: '', disabled: true }, Validators.required],
        data_emprestimo: ['', Validators.required],
        hora_emprestimo: ['', [Validators.required, Validators.pattern(this.horaPattern)]],
        data_devolucao: ['', Validators.required],
        hora_devolucao: ['', [Validators.required, Validators.pattern(this.horaPattern)]],
      },
      { validators: this.periodoValidoValidator },
    );
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.reserva_id = idParam ? Number(idParam) : null;

    this.inicializarDados();
  }

  private async inicializarDados(): Promise<void> {
    this.isLoading = true;
    this.reservaForm.disable();

    await this.carregarUnidadesESmartlocks();

    this.initAutocompleteFilter();
    this.initReacaoUnidade();
    this.initReacaoSmartlock();

    if (this.reserva_id) {
      await this.carregarDadosReserva();
    } else {
      this.reservaForm.enable();
      this.reservaForm.get('smartlock')?.disable();
    }

    this.isLoading = false;

    // Mesmo motivo do cadastro-smartlock: patchValue dispara valueChanges
    // assincronamente e pode gerar NG0100 sem essa checagem manual.
    this.cdr.detectChanges();
  }

  private carregarUnidadesESmartlocks(): Promise<void> {
    return new Promise((resolve) => {
      forkJoin({
        unidades: this.unidadeService.listAll(),
        smartlocks: this.smartlockService.listAll(),
      }).subscribe({
        next: ({ unidades, smartlocks }) => {
          this.unidades = unidades;
          this.smartlocks = smartlocks;
          resolve();
        },
        error: (err) => {
          console.log(err);
          this.sns.notificar('Erro ao carregar unidades/smartlocks.', 'erro');
          resolve();
        },
      });
    });
  }

  private initAutocompleteFilter(): void {
    this.filteredUnidades = this.reservaForm.get('unidade')!.valueChanges.pipe(
      startWith(''),
      map((value) => this._filterUnidade(value || '')),
    );
  }

  private _filterUnidade(value: any): Unidade[] {
    const stringValue = typeof value === 'string' ? value : value?.nome || '';
    const filterValue = stringValue.toLowerCase();
    return this.unidades.filter((u) => u.nome.toLowerCase().includes(filterValue));
  }

  displayUnidade = (unidade: Unidade | string): string => {
    if (!unidade) return '';
    if (typeof unidade === 'string') return unidade;
    return `${unidade.nome} / ${unidade.regional}`;
  };

  // Ao trocar a unidade, refiltra os smartlocks e limpa a seleção anterior
  // (smartlock + equipamentos), já que eles não pertencem mais ao contexto.
  private initReacaoUnidade(): void {
    this.reservaForm.get('unidade')!.valueChanges.subscribe((unidade) => {
      const smartlockControl = this.reservaForm.get('smartlock')!;

      if (unidade && typeof unidade !== 'string') {
        this.smartlocksDaUnidade = this.smartlocks.filter((s) => s.unidade_id === unidade.id);
        smartlockControl.enable();
      } else {
        this.smartlocksDaUnidade = [];
        smartlockControl.disable();
      }

      smartlockControl.setValue('');
      this.limparEquipamentos();
    });
  }

  private initReacaoSmartlock(): void {
    this.reservaForm.get('smartlock')!.valueChanges.subscribe((smartlock: Smartlock | '') => {
      this.limparEquipamentos();

      if (smartlock) {
        this.carregarEquipamentosDisponiveis(smartlock.id);
      }
    });
  }

  private limparEquipamentos(): void {
    this.equipamentosDisponiveis = [];
    this.equipamentosSelecionados.clear();
  }

  private carregarEquipamentosDisponiveis(smartlockId: number): void {
    this.carregandoEquipamentos = true;

    // O backend já retorna só os equipamentos livres nesse smartlock;
    // se o período (data/hora) também entrar no filtro, passe aqui.
    this.equipamentoService.listDisponiveis(smartlockId).subscribe({
      next: (equipamentos) => {
        this.equipamentosDisponiveis = equipamentos;
        this.carregandoEquipamentos = false;
      },
      error: (err) => {
        console.log(err);
        this.sns.notificar('Erro ao carregar equipamentos disponíveis.', 'erro');
        this.carregandoEquipamentos = false;
      },
    });
  }

  toggleEquipamento(equipamento: any): void {
    if (this.equipamentosSelecionados.has(equipamento.id)) {
      this.equipamentosSelecionados.delete(equipamento.id);
    } else {
      this.equipamentosSelecionados.add(equipamento.id);
    }
  }

  isSelecionado(equipamento: any): boolean {
    return this.equipamentosSelecionados.has(equipamento.id);
  }

  selecionarTodos(): void {
    this.equipamentosDisponiveis.forEach((e:any) => this.equipamentosSelecionados.add(e.id));
  }

  limparSelecao(): void {
    this.equipamentosSelecionados.clear();
  }

  get todosSelecionados(): boolean {
    return (
      this.equipamentosDisponiveis.length > 0 &&
      this.equipamentosSelecionados.size === this.equipamentosDisponiveis.length
    );
  }

  get nenhumEquipamentoSelecionado(): boolean {
    return this.equipamentosSelecionados.size === 0;
  }

  // Só valida a ordem cronológica quando os 4 campos já têm valor —
  // evita marcar erro antes do usuário terminar de preencher o período.
  private periodoValidoValidator = (group: AbstractControl): ValidationErrors | null => {
    const dataEmprestimo = group.get('data_emprestimo')?.value;
    const horaEmprestimo = group.get('hora_emprestimo')?.value;
    const dataDevolucao = group.get('data_devolucao')?.value;
    const horaDevolucao = group.get('hora_devolucao')?.value;

    if (!dataEmprestimo || !horaEmprestimo || !dataDevolucao || !horaDevolucao) {
      return null;
    }

    if (!this.horaPattern.test(horaEmprestimo) || !this.horaPattern.test(horaDevolucao)) {
      return null;
    }

    const inicio = this.combinarDataHora(dataEmprestimo, horaEmprestimo);
    const fim = this.combinarDataHora(dataDevolucao, horaDevolucao);

    return fim > inicio ? null : { periodoInvalido: true };
  };

  private combinarDataHora(data: Date, hora: string): Date {
    const [h, m] = hora.split(':').map(Number);
    const resultado = new Date(data);
    resultado.setHours(h, m, 0, 0);
    return resultado;
  }

  private formatarHora(data: Date): string {
    return data.toTimeString().slice(0, 5);
  }

  private async carregarDadosReserva(): Promise<void> {
    try {
      const dados = await firstValueFrom(this.reservaService.getById(this.reserva_id!));

      const unidade = this.unidades.find((u) => u.id === dados.unidade_id);
      this.reservaForm.enable();

      const dataEmprestimo = new Date(dados.data_hora_emprestimo);
      const dataDevolucao = new Date(dados.data_hora_devolucao_prevista);

      this.reservaForm.patchValue({
        unidade,
        data_emprestimo: dataEmprestimo,
        hora_emprestimo: this.formatarHora(dataEmprestimo),
        data_devolucao: dataDevolucao,
        hora_devolucao: this.formatarHora(dataDevolucao),
      });

      // O patchValue de "unidade" dispara initReacaoUnidade de forma assíncrona
      // (popula smartlocksDaUnidade); só depois disso dá pra selecionar o
      // smartlock e marcar os equipamentos já reservados.
      setTimeout(() => {
        const smartlock = this.smartlocksDaUnidade.find((s) => s.id === dados.smartlock_id);
        this.reservaForm.get('smartlock')?.setValue(smartlock ?? '');

        setTimeout(() => {
          (dados.equipamentos ?? []).forEach((e: any) => this.equipamentosSelecionados.add(e.id));
        });
      });
    } catch (err) {
      console.log(err);
      this.sns.notificar('Erro ao carregar reserva. Ela pode não existir.', 'erro');
    }
  }

  salvar(): void {
    this.tentouSalvarSemEquipamento = this.nenhumEquipamentoSelecionado;

    if (this.reservaForm.valid && !this.nenhumEquipamentoSelecionado) {
      const { unidade, smartlock, data_emprestimo, hora_emprestimo, data_devolucao, hora_devolucao } =
        this.reservaForm.value;

      const payload = {
        unidade_id: unidade.id,
        smartlock_id: smartlock.id,
        data_hora_emprestimo: this.combinarDataHora(data_emprestimo, hora_emprestimo).toISOString(),
        data_hora_devolucao_prevista: this.combinarDataHora(data_devolucao, hora_devolucao).toISOString(),
        equipamentos: Array.from(this.equipamentosSelecionados),
      };

      this.isLoading = true;
      this.reservaForm.disable();

      const requisicao$ = this.reserva_id
        ? this.reservaService.update(this.reserva_id, payload)
        : this.reservaService.create(payload);

      requisicao$.subscribe({
        next: () => {
          const acao = this.reserva_id ? 'atualizada' : 'cadastrada';
          this.sns.notificar(`Reserva ${acao} com sucesso!`, 'sucesso');
          this.router.navigate(['/reservas/lista']);
        },
        error: (err: any) => {
          console.log(err);
          this.sns.notificar(err.message, 'erro');
          this.isLoading = false;
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