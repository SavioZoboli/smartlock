import { Component, OnInit, signal, computed, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonToggleGroup, MatButtonToggle } from '@angular/material/button-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';

import { EquipamentoService } from '../../services/equipamento.service';
import { UnidadeService } from '../../services/unidade.service';
import { SmartlockService } from '../../services/smartlock.service';
import { SystemNotificationService } from '../../services/system-notification.service';
import { IUnidade } from '../../interfaces/unidade.interface';
import { ISmartlock } from '../../interfaces/smartlock.interface';
import { filtrarLista } from '../../shared/util/autocomplete-filtro.util';
import { displayPorCampo, displayUnidadeComRegional } from '../../shared/util/autocomplete-display.util';
import { obterIconeTipoEquipamento } from '../../shared/tipoEquipamentos.constant';

import {
  GrupoSmartlock,
  ItemRelatorioSmartlock,
  StatusFiltroDisponibilidade,
} from './smartlock-report.model';
import { agruparEquipamentosPorSmartlock } from './smartlock-report.util';

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
    MatButtonModule,
    MatTooltip,
  ],
  templateUrl: './smartlock-report.html',
  styleUrls: ['./smartlock-report.scss'],
})
export class SmartlockReport implements OnInit {
  private destroyRef = inject(DestroyRef);
  private equipamentoService = inject(EquipamentoService);
  private unidadeService = inject(UnidadeService);
  private smartlockService = inject(SmartlockService);
  private sns = inject(SystemNotificationService);

  unidadeCtrl = new FormControl<string | IUnidade | null>(null);
  smartlockCtrl = new FormControl<string | ISmartlock | null>(null);
  statusCtrl = new FormControl<StatusFiltroDisponibilidade>('todos', { nonNullable: true });

  unidades: IUnidade[] = [];
  smartlocks: ISmartlock[] = [];

  filteredUnidades = signal<IUnidade[]>([]);
  filteredSmartlocks = signal<ISmartlock[]>([]);

  equipamentos = signal<ItemRelatorioSmartlock[]>([]);
  smartlockFiltro = signal<ISmartlock | null>(null);
  status = signal<StatusFiltroDisponibilidade>('todos');

  carregando = signal<boolean>(false);

  // Agrupamento por smartlock, recalculado de forma pura a cada mudança dos signals
  grupos = computed<GrupoSmartlock[]>(() =>
    agruparEquipamentosPorSmartlock(
      this.equipamentos(),
      this.smartlockFiltro()?.id,
      this.status(),
    ),
  );

  readonly _displayWithUnidade = displayUnidadeComRegional;
  readonly _displayWithSmartlock = displayPorCampo<ISmartlock>('apelido');

  ngOnInit(): void {
    this.smartlockCtrl.disable({ emitEvent: false });
    this.carregarUnidades();
    this.iniciarObservadoresFiltros();
  }

  private carregarUnidades(): void {
    this.carregando.set(true);
    this.unidadeService
      .listAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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
  }

  private iniciarObservadoresFiltros(): void {
    this.unidadeCtrl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => {
        this.filteredUnidades.set(filtrarLista(this.unidades, val, 'nome'));

        if (val && typeof val !== 'string' && val.id) {
          this.smartlocks = [];
          this.filteredSmartlocks.set([]);
          this.smartlockCtrl.reset('', { emitEvent: false });
          this.smartlockCtrl.enable({ emitEvent: false });
          this.smartlockFiltro.set(null);

          this.buscarSmartlocksPorUnidade(val.id);
          this.buscarRelatorio(val.id);
        } else {
          this.smartlocks = [];
          this.filteredSmartlocks.set([]);
          this.smartlockCtrl.reset('', { emitEvent: false });
          this.smartlockCtrl.disable({ emitEvent: false });
          this.smartlockFiltro.set(null);
          this.equipamentos.set([]);
        }
      });

    this.smartlockCtrl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => {
        this.filteredSmartlocks.set(filtrarLista(this.smartlocks, val, 'apelido'));
        this.smartlockFiltro.set(val && typeof val !== 'string' && val.id ? val : null);
      });

    this.statusCtrl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => {
        if (!val) return;
        this.status.set(val);
      });
  }

  limparUnidade(): void {
    this.unidadeCtrl.setValue('');
  }

  limparSmartlock(): void {
    this.smartlockCtrl.setValue('');
  }

  private buscarSmartlocksPorUnidade(unidadeId: number): void {
    this.smartlockService
      .listByUnidade(unidadeId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.smartlocks = res;
          this.filteredSmartlocks.set(res);
        },
        error: (e) => {
          this.sns.notificarErro(e, 'Erro ao buscar Smartlocks da Unidade');
        },
      });
  }

  private buscarRelatorio(unidadeId: number): void {
    this.carregando.set(true);
    this.equipamentoService
      .buscarRelatorioDisponibilidadePorUnidade(unidadeId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: ItemRelatorioSmartlock[]) => {
          const itensFormatados: ItemRelatorioSmartlock[] = res.map((linha) => ({
            ...linha,
            reservas: linha.reservas ?? [],
            icone: obterIconeTipoEquipamento(linha.tipo),
          }));
          this.equipamentos.set(itensFormatados);
          this.carregando.set(false);
        },
        error: (e) => {
          this.sns.notificarErro(e, 'Erro ao buscar equipamentos');
          this.carregando.set(false);
        },
      });
  }
}
