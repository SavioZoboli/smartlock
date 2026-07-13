import { Component, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-smartlock-report',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatFormFieldModule,
    MatInputModule, MatAutocompleteModule, MatCardModule,
    MatIconModule, MatChipsModule, MatProgressSpinnerModule
  ],
  templateUrl: './smartlock-report.html',
  styleUrls: ['./smartlock-report.scss']
})
export class SmartlockReport implements OnInit {
  unidadeCtrl = new FormControl('');
  smartlockCtrl = new FormControl('');

  unidades: string[] = [];
  smartlocks: string[] = [];

  filteredUnidades!: Observable<string[]>;
  filteredSmartlocks!: Observable<string[]>;

  equipamentos: Equipamento[] = [];
  carregando = false;

  constructor(
    private equipamentoService: EquipamentoService,
    private unidadeService:UnidadeService,
    private smartlockService:SmartlockService
  ) {}

  ngOnInit() {
    this.unidadeService.listAll().subscribe({
      next:(res)=>{
        this.unidades = res;
      }
    })

    this.filteredUnidades = this.unidadeCtrl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || '', this.unidades))
    );

    // Ao trocar de unidade, recarrega a lista de smartlocks
    this.unidadeCtrl.valueChanges.subscribe(unidade => {
      this.smartlockCtrl.setValue('');
      if (!unidade) {
        this.smartlocks = [];
        return;
      }
      //this.smartlockService.listByUnidade(unidade).subscribe({
      //  next:(res)=>{
      //    this.smartlocks = res
      //  }
      //});
    });

    this.filteredSmartlocks = this.smartlockCtrl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || '', this.smartlocks))
    );

    // Dispara a busca de disponibilidade sempre que unidade + smartlock estiverem preenchidos
    //combineLatest([
    //  this.unidadeCtrl.valueChanges.pipe(startWith('')),
    //  this.smartlockCtrl.valueChanges.pipe(startWith(''))
    //]).pipe(
    //  switchMap(([unidade, smartlock]) => {
    //    if (!unidade || !smartlock) {
    //      return of([]);
    //    }
    //    this.carregando = true;
    //    return this.equipamentoService.listBySmartlock(smartlock);
    //  })
    //).subscribe({
    //  next: (equipamentos) => {
    //    this.equipamentos = equipamentos;
    //    this.carregando = false;
    //  },
    //  error: () => {
    //    // TODO: tratar erro de carregamento da disponibilidade
    //    this.carregando = false;
    //  }
    //});
  }

  private _filter(value: string, list: string[]): string[] {
    const filterValue = value.toLowerCase();
    return list.filter(option => option.toLowerCase().includes(filterValue));
  }
}