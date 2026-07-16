import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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
import { Observable, startWith, map } from 'rxjs';
import { Router } from '@angular/router';
import { SmartlockService } from '../../../services/smartlock.service';
import { EquipamentoService } from '../../../services/equipamento.service';
import { SystemNotificationService } from '../../../services/system-notification.service';
import { Unidade } from '../../unidade/lista-unidade/lista-unidade';
import { UnidadeService } from '../../../services/unidade.service';
import { MovimentacaoService } from '../../../services/movimentacao.service';
import { TIPO_EQUIPAMENTOS } from '../../../shared/tipoEquipamentos.constant';

export interface SmartLock {
  id: number;
  numero: number;
  apelido: string;
  unidade_id: number;
}

export interface Equipamento {
  id: number;
  apelido: string;
  patrimonio: string;
  tipo: string;
  status_atual: 'DISPONIVEL' | 'EM USO';
  emprestado_por?: number | null;
  selecionado?: boolean;
  icone?:string
}

type TipoMovimento = 'emprestimo_manual' | 'devolucao_manual';

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
  movForm: FormGroup;

  unidades!: Unidade[];
  filteredUnidades!: Observable<Unidade[]>;

  smartlocks: SmartLock[] = [];
  equipamentos: Equipamento[] = [];

  isLoading = false;
  isLoadingSmartlocks = false;
  isLoadingEquipamentos = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private unidadeService: UnidadeService,
    private smartlockService: SmartlockService,
    private equipamentoService: EquipamentoService,
    private movimentacaoService: MovimentacaoService,
    private sns: SystemNotificationService,
    private cdr: ChangeDetectorRef,
  ) {
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
    this.isLoading = true;
    this.unidadeService.listAll().subscribe({
      next: (res) => {
        this.unidades = res;
        this.initAutocompleteFilter();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.sns.notificar('Erro ao carregar unidades.', 'erro');
      },
    });
  }

  private initAutocompleteFilter(): void {
    this.filteredUnidades = this.movForm.get('unidade')!.valueChanges.pipe(
      startWith(''),
      map((value) => this._filter(value || '')),
    );
  }

  private _filter(value: any): Unidade[] {
    if (!this.unidades) return [];
    const stringValue = typeof value === 'string' ? value : value?.nome || '';
    const filterValue = stringValue.toLowerCase();
    return this.unidades.filter((option) => option.nome.toLowerCase().includes(filterValue));
  }

  displayUnidade = (unidade: Unidade | string): string => {
    if (!unidade) return '';
    if (typeof unidade === 'string') return unidade;
    return `${unidade.nome} / ${unidade.regional}`;
  };

  // Quando a unidade muda: reseta smartlock e equipamentos, e busca as novas smartlocks
  private observarUnidade(): void {
    this.movForm.get('unidade')!.valueChanges.subscribe((unidade) => {
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
    this.smartlockService.listByUnidade(unidadeId).subscribe({
      next: (res: SmartLock[]) => {
        this.smartlocks = res;
        this.movForm.get('smartlock')!.enable();
        this.isLoadingSmartlocks = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingSmartlocks = false;
        this.sns.notificar('Erro ao carregar SmartLocks da unidade.', 'erro');
      },
    });
  }

  // Quando a smartlock muda: reseta equipamentos e busca os novos
  private observarSmartlock(): void {
    this.movForm.get('smartlock')!.valueChanges.subscribe((smartlockId) => {
      this.equipamentos = [];
      if (smartlockId) {
        this.carregarEquipamentos(smartlockId);
      }
    });
  }

  private carregarEquipamentos(smartlockId: number): void {
    this.isLoadingEquipamentos = true;
    this.equipamentoService.listBySmartlock(smartlockId).subscribe({
      next: (res: Equipamento[]) => {
        this.equipamentos = res.map((e) => ({
          ...e,
          selecionado: false,
          icone: TIPO_EQUIPAMENTOS.find((t) => t.descricao == e.tipo)?.icone,
        }));
        this.isLoadingEquipamentos = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingEquipamentos = false;
        this.sns.notificar('Erro ao carregar equipamentos do SmartLock.', 'erro');
      },
    });
  }

  // Ao trocar o tipo de movimento, desmarca as seleções (a lista visível muda)
  private observarTipoMovimento(): void {
    this.movForm.get('tipo_movimento')!.valueChanges.subscribe(() => {
      this.equipamentos.forEach((e) => (e.selecionado = false));
    });
  }

  // Lista filtrada exibida na tela, de acordo com o tipo de movimento escolhido
  get equipamentosVisiveis(): Equipamento[] {
    const tipo: TipoMovimento = this.movForm.get('tipo_movimento')!.value;
    if (!tipo) return [];
    if (tipo.includes('emprestimo')) {
      return this.equipamentos.filter((e) => e.status_atual === 'DISPONIVEL');
    } else {
      return this.equipamentos.filter((e) => e.status_atual !== 'DISPONIVEL');
    }
  }

  get equipamentosSelecionados(): Equipamento[] {
    return this.equipamentos.filter((e) => e.selecionado);
  }

  toggleEquipamento(equipamento: Equipamento): void {
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

    this.movimentacaoService.create(smartlock, tipo_movimento, equipamentoIds).subscribe({
      next: () => {
        this.sns.notificar('Movimentação registrada com sucesso!', 'sucesso');
        this.router.navigate(['/movimentacoes/lista']);
      },
      error: (err: any) => {
        this.sns.notificar(err.message, 'erro');
        this.isLoading = false;
        this.movForm.enable();
      },
    });
  }

  onCancelar(): void {
    this.router.navigate(['/movimentacoes/lista']);
  }
}
