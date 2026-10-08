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
import { filtrarLista } from '../../shared/util/autocomplete-filtro.util';
import { displayPorCampo } from '../../shared/util/autocomplete-display.util';
import { SystemNotificationService } from '../../services/system-notification.service';
import { TIPO_EQUIPAMENTOS } from '../../shared/tipoEquipamentos.constant';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatButtonToggleGroup, MatButtonToggle } from '@angular/material/button-toggle';
import { MatTooltip } from '@angular/material/tooltip';
import { IUnidade } from '../../interfaces/unidade.interface';
import { ISmartlock } from '../../interfaces/smartlock.interface';

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

  unidades: IUnidade[] = [];
  smartlocks: ISmartlock[] = [];

  filteredUnidades = signal<IUnidade[]>([]);
  filteredSmartlocks = signal<ISmartlock[]>([]);

  equipamentos = signal<Equipamento[]>([]);
  smartlockFiltro = signal<ISmartlock | null>(null);
  status = signal<string>('todos');

  carregando = signal<boolean>(false);

  tiposEquipamentos = TIPO_EQUIPAMENTOS;

  // Agrupamento por smartlock, recalculado em memória a cada mudança
  // do filtro — sem nova chamada ao backend.
  grupos = computed<GrupoSmartlock[]>(() => {
    const filtro = this.smartlockFiltro();
    const status = this.status();

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
        this.sns.notificarErro(e, 'Erro ao buscar unidades');
        this.carregando.set(false);
      },
    });

    this.unidadeCtrl.valueChanges.subscribe((val: string | IUnidade) => {
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
    this.smartlockCtrl.valueChanges.subscribe((val: string | ISmartlock) => {
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
        this.sns.notificarErro(e, 'Erro ao buscar Smartlocks da Unidade');
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
        this.sns.notificarErro(e, 'Erro ao buscar equipamentos');
        this.carregando.set(false);
      },
    });
  }

  private _filterUnidade(value: string | IUnidade): IUnidade[] {
    return filtrarLista(this.unidades, value, 'nome');
  }

  private _filterSmartlock(value: string | ISmartlock): ISmartlock[] {
    return filtrarLista(this.smartlocks, value, 'apelido');
  }

  public _displayWithUnidade = displayPorCampo<IUnidade>('nome');

  public _displayWithSmartlock = displayPorCampo<ISmartlock>('apelido');
}
