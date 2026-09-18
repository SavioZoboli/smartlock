import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Equipamento } from '../../models/equipamento.model';
import { EquipamentoService } from '../../services/equipamento.service';
import { UnidadeService } from '../../services/unidade.service';
import { SmartlockService } from '../../services/smartlock.service';
import { Unidade } from '../../pages/unidade/lista-unidade/lista-unidade';
import { Smartlock } from '../../pages/smartlock/lista-smartlock/lista-smartlock';
import { SystemNotificationService } from '../../services/system-notification.service';
import { TIPO_EQUIPAMENTOS } from '../../shared/tipoEquipamentos.constant';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatButtonToggleGroup, MatButtonToggle } from '@angular/material/button-toggle';
import { MatTooltip } from '@angular/material/tooltip';

interface GrupoSmartlock {
  smartlockId: number;
  smartlockApelido: string;
  itens: Equipamento[];
}

@Component({
  selector: 'app-smartlock-report',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatButtonToggleGroup,
    MatButtonToggle,
    MatTooltip
],
  templateUrl: './smartlock-report.html',
  styleUrls: ['./smartlock-report.scss'],
})
export class SmartlockReport implements OnInit {
  unidadeCtrl = new FormControl();
  smartlockCtrl = new FormControl();
  statusCtrl = new FormControl('todos');

  unidades: Unidade[] = [];
  smartlocks: Smartlock[] = [];

  filteredUnidades = signal<Unidade[]>([]);
  filteredSmartlocks = signal<Smartlock[]>([]);

  equipamentos = signal<Equipamento[]>([]);
  smartlockFiltro = signal<Smartlock | null>(null);
  status = signal<string>('todos');

  carregando = signal<boolean>(false);

  tiposEquipamentos = TIPO_EQUIPAMENTOS;

  // Agrupamento por smartlock, recalculado em memória a cada mudança
  // do filtro — sem nova chamada ao backend.
  grupos = computed<GrupoSmartlock[]>(() => {
    const filtro = this.smartlockFiltro();
    const status = this.status();

    console.log(this.equipamentos())

    const lista: any = filtro
      ? this.equipamentos().filter(
          (item: any) =>
            item.smartlockId === filtro.id && this.checkStatus(item.disponivel, status),
        )
      : this.equipamentos().filter((item: any) => this.checkStatus(item.disponivel, status));

    const mapa = new Map<number, GrupoSmartlock>();
    for (const item of lista) {
      const grupo: any = mapa.get(item.smartlockId) ?? {
        smartlockId: item.smartlockId,
        smartlockApelido: item.smartlockApelido,
        itens: [],
      };
      grupo.itens.push(item);
      mapa.set(item.smartlockId, grupo);
    }
    return Array.from(mapa.values()).sort((a, b) =>
      a.smartlockApelido.localeCompare(b.smartlockApelido),
    );
  });

  private checkStatus(disponivel: boolean, status: string) {
    if (status == 'todos') {
      return true;
    }

    if (status == 'disponiveis' && disponivel) {
      return true;
    }

    if (status == 'emprestados' && !disponivel) {
      return true;
    }

    return false;
  }

  constructor(
    private equipamentoService: EquipamentoService,
    private unidadeService: UnidadeService,
    private smartlockService: SmartlockService,
    private sns: SystemNotificationService,
  ) {}

  ngOnInit() {
    this.carregando.set(true);
    this.unidadeService.listAll().subscribe({
      next: (res) => {
        this.carregando.set(false);
        this.unidades = res;
        this.filteredUnidades.set(res);
      },
      error: (e) => {
        this.sns.notificar('Erro ao buscar unidades', 'erro');
        this.carregando.set(false);
        console.error(e);
      },
    });

    this.unidadeCtrl.valueChanges.subscribe((val: string | Unidade) => {
      this.filteredUnidades.set(this._filterUnidade(val || ''));

      if (val && typeof val !== 'string') {
        this.smartlocks = [];
        this.filteredSmartlocks.set([]);
        this.smartlockCtrl.reset();
        this.smartlockFiltro.set(null);

        this.buscaSmartlock(val.id);
        this.buscarRelatorio(val.id);
      } else {
        this.equipamentos.set([]);
      }
    });

    // Agora só filtra o array já carregado — não dispara requisição.
    this.smartlockCtrl.valueChanges.subscribe((val: string | Smartlock) => {
      this.filteredSmartlocks.set(this._filterSmartlock(val || ''));
      this.smartlockFiltro.set(val && typeof val !== 'string' ? val : null);
    });

    this.statusCtrl.valueChanges.subscribe((val: string | null) => {
      if (!val) return;
      this.status.set(val);
    });
  }

  buscaSmartlock(unidade_id: number) {
    this.smartlockService.listByUnidade(unidade_id).subscribe({
      next: (res) => {
        this.smartlocks = res;
        this.filteredSmartlocks.set(res);
      },
      error: (e) => {
        this.sns.notificar('Erro ao buscar Smartlocks da Unidade', 'erro');
        console.error(e);
      },
    });
  }

  buscarRelatorio(unidade_id: number) {
    this.carregando.set(true);
    this.equipamentoService.buscarRelatorioDisponibilidadePorUnidade(unidade_id).subscribe({
      next: (res) => {
        this.equipamentos.set(
          res.map((linha: any) => ({
            ...linha,
            icone: this.tiposEquipamentos.find((t) => t.descricao == linha.tipo)?.icone,
          })),
        );
        this.carregando.set(false);
      },
      error: (e) => {
        this.sns.notificar('Erro ao buscar equipamentos', 'erro');
        this.carregando.set(false);
        console.error(e);
      },
    });
  }

  private _filterUnidade(value: string | Unidade): Unidade[] {
    return this.unidades.filter((option) =>
      option.nome.toLowerCase().includes(typeof value == 'string' ? value : value.nome),
    );
  }

  private _filterSmartlock(value: string | Smartlock): Smartlock[] {
    return this.smartlocks.filter((option) =>
      option.apelido.toLowerCase().includes(typeof value == 'string' ? value : value.apelido),
    );
  }

  public _displayWithUnidade(valor: string | Unidade): string {
    if (!valor) return '';
    return typeof valor === 'string' ? valor : valor.nome;
  }

  public _displayWithSmartlock(valor: string | Smartlock): string {
    if (!valor) return '';
    return typeof valor === 'string' ? valor : valor.apelido;
  }
}
