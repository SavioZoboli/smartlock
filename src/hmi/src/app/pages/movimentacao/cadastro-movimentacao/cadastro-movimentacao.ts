import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { SmartlockService } from '../../../services/smartlock.service';
import { EquipamentoService } from '../../../services/equipamento.service';
import { SystemNotificationService } from '../../../services/system-notification.service';
import { filtrarAutocomplete } from '../../../shared/util/autocomplete-filtro.util';
import { displayUnidadeComRegional } from '../../../shared/util/autocomplete-display.util';
import { UnidadeService } from '../../../services/unidade.service';
import { MovimentacaoService } from '../../../services/movimentacao.service';
import { obterIconeTipoEquipamento } from '../../../shared/tipoEquipamentos.constant';
import { ISmartlock } from '../../../interfaces/smartlock.interface';
import { UnidadeComRegionalDTO } from '../../../dto/UnidadeComRegional.dto';
import {
  desmarcarTodosEquipamentos,
  EquipamentoMovimentacao,
  filtrarEquipamentosPorMovimento,
} from './movimentacao.util';

@Component({
  selector: 'app-cadastro-movimentacao',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './cadastro-movimentacao.html',
  styleUrls: ['./cadastro-movimentacao.scss'],
})
export class CadastroMovimentacao implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly unidadeService = inject(UnidadeService);
  private readonly smartlockService = inject(SmartlockService);
  private readonly equipamentoService = inject(EquipamentoService);
  private readonly movimentacaoService = inject(MovimentacaoService);
  private readonly sns = inject(SystemNotificationService);
  private readonly cdr = inject(ChangeDetectorRef);

  movForm: FormGroup;
  filteredUnidades!: Observable<UnidadeComRegionalDTO[]>;
  smartlocks: ISmartlock[] = [];
  equipamentos: EquipamentoMovimentacao[] = [];

  isLoading = false;
  isLoadingSmartlocks = false;
  isLoadingEquipamentos = false;

  readonly displayUnidade = displayUnidadeComRegional;

  constructor() {
    this.movForm = this.fb.group({
      unidade: ['', Validators.required],
      smartlock: [{ value: '', disabled: true }, Validators.required],
      tipo_movimento: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.inicializaUnidades();
    this.observarUnidade();
    this.observarSmartlock();
    this.observarTipoMovimento();
  }

  private inicializaUnidades(): void {
    this.unidadeService.listAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.filteredUnidades = filtrarAutocomplete(
      this.movForm.get('unidade')!,
      this.unidadeService.listAll() as Observable<UnidadeComRegionalDTO[]>,
      'nome',
    );
  }

  // Quando a unidade muda: reseta smartlock e equipamentos, e busca as novas smartlocks
  private observarUnidade(): void {
    this.movForm
      .get('unidade')!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((unidade) => {
        this.smartlocks = [];
        this.equipamentos = [];
        this.movForm.get('smartlock')!.reset({ value: '', disabled: true });

        if (unidade && typeof unidade === 'object' && unidade.id) {
          this.carregarSmartlocks(unidade.id);
        }
      });
  }

  private carregarSmartlocks(unidadeId: number): void {
    this.isLoadingSmartlocks = true;
    this.smartlockService
      .listByUnidade(unidadeId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (val) => {
          this.smartlocks = val;
          this.movForm.get('smartlock')!.enable();
          this.isLoadingSmartlocks = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isLoadingSmartlocks = false;
          this.sns.notificarErro(err, 'Erro ao carregar SmartLocks da unidade.');
          this.cdr.detectChanges();
        },
      });
  }

  // Quando a smartlock muda: reseta equipamentos e busca os novos
  private observarSmartlock(): void {
    this.movForm
      .get('smartlock')!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((smartlockId) => {
        this.equipamentos = [];
        if (smartlockId) {
          this.carregarEquipamentos(smartlockId);
        }
      });
  }

  private carregarEquipamentos(smartlockId: number): void {
    this.isLoadingEquipamentos = true;
    this.equipamentoService
      .listBySmartlock(smartlockId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any[]) => {
          this.equipamentos = res.map((e) => ({
            ...e,
            selecionado: false,
            icone: obterIconeTipoEquipamento(e.tipo),
          }));
          this.isLoadingEquipamentos = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isLoadingEquipamentos = false;
          this.sns.notificarErro(err, 'Erro ao carregar equipamentos do SmartLock.');
          this.cdr.detectChanges();
        },
      });
  }

  // Ao trocar o tipo de movimento, desmarca as seleções (a lista visível muda)
  private observarTipoMovimento(): void {
    this.movForm
      .get('tipo_movimento')!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.equipamentos = desmarcarTodosEquipamentos(this.equipamentos);
      });
  }

  // Lista filtrada exibida na tela, de acordo com o tipo de movimento escolhido
  get equipamentosVisiveis(): EquipamentoMovimentacao[] {
    return filtrarEquipamentosPorMovimento(
      this.equipamentos,
      this.movForm.get('tipo_movimento')?.value,
    );
  }

  get equipamentosSelecionados(): EquipamentoMovimentacao[] {
    return this.equipamentos.filter((e) => e.selecionado);
  }

  toggleEquipamento(equipamento: EquipamentoMovimentacao): void {
    equipamento.selecionado = !equipamento.selecionado;
  }

  salvar(): void {
    if (this.movForm.invalid) {
      this.movForm.markAllAsTouched();
      this.sns.notificar('Por favor, verifique os campos.', 'erro');
      return;
    }

    if (this.equipamentosSelecionados.length === 0) {
      this.sns.notificar('Selecione ao menos um equipamento.', 'erro');
      return;
    }

    const { smartlock, tipo_movimento } = this.movForm.value;
    const equipamentoIds = this.equipamentosSelecionados.map((e) => e.id);

    this.isLoading = true;
    this.movForm.disable();

    this.movimentacaoService
      .create(smartlock, tipo_movimento, equipamentoIds)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.sns.notificar('Movimentação registrada com sucesso!', 'sucesso');
          this.router.navigate(['/movimentacoes/lista']);
        },
        error: (err: any) => {
          this.sns.notificarErro(err, 'Erro ao registrar movimentação.');
          this.isLoading = false;
          this.movForm.enable();
        },
      });
  }

  onCancelar(): void {
    this.router.navigate(['/movimentacoes/lista']);
  }
}
