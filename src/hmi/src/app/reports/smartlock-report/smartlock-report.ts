import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, startWith, map, switchMap, of, combineLatest } from 'rxjs';
import { Equipamento } from '../../models/equipamento.model';
import { EquipamentoService } from '../../services/equipamento.service';
import { UnidadeService } from '../../services/unidade.service';
import { SmartlockService } from '../../services/smartlock.service';
import { Unidade } from '../../pages/unidade/lista-unidade/lista-unidade';
import { Smartlock } from '../../pages/smartlock/lista-smartlock/lista-smartlock';
import { SystemNotificationService } from '../../services/system-notification.service';

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
  ],
  templateUrl: './smartlock-report.html',
  styleUrls: ['./smartlock-report.scss'],
})
export class SmartlockReport implements OnInit {
  unidadeCtrl = new FormControl();
  smartlockCtrl = new FormControl();

  unidades: Unidade[] = [];
  smartlocks: Smartlock[] = [];

  filteredUnidades = signal<Unidade[]>([]);
  filteredSmartlocks = signal<Smartlock[]>([]);

  equipamentos: Equipamento[] = [];
  carregando = signal<boolean>(false);

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
        this.buscaSmartlock(val.id);
      }
    });

    this.smartlockCtrl.valueChanges.subscribe((val: string | Smartlock) => {
      this.filteredSmartlocks.set(this._filterSmartlock(val || ''));
      if (val && typeof val !== 'string') {
        this.buscarRelatorio(val.id);
      }
    });
  }

  buscaSmartlock(unidade_id: number) {
    this.carregando.set(true);
    this.smartlockService.listByUnidade(unidade_id).subscribe({
      next: (res) => {
        this.carregando.set(false);
        this.smartlocks = res;
        this.filteredSmartlocks.set(res);
      },
      error: (e) => {
        this.carregando.set(false);
        this.sns.notificar('Erro ao buscar Smartlocks da Unidade', 'erro');
        console.error(e);
      },
    });
  }

  buscarRelatorio(smartlock_id: number) {
    this.carregando.set(true);
    this.equipamentoService.buscarRelatorioDisponibilidade(smartlock_id).subscribe({
      next: (res) => {
        
        this.equipamentos = res;
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
    if(!valor) return ''
    return typeof valor === 'string' ? valor : valor.nome;
  }

  public _displayWithSmartlock(valor: string | Smartlock): string {
    if(!valor) return ''
    return typeof valor === 'string' ? valor : valor.apelido;
  }
}
