import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { Observable, startWith, map } from 'rxjs';

// Interface do Equipamento
export interface Equipamento {
  id: string;
  tipo: string;
  patrimonio: string;
  disponivel: boolean;
  retiradoPor?: string;
}

@Component({
  selector: 'app-smartlock-report',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatFormFieldModule, 
    MatInputModule, MatAutocompleteModule, MatCardModule, 
    MatIconModule, MatChipsModule
  ],
  templateUrl: './smartlock-report.html',
  styleUrls: ['./smartlock-report.scss']
})
export class SmartlockReport implements OnInit {
  // Controles do Formulário
  unidadeCtrl = new FormControl('');
  smartlockCtrl = new FormControl('');

  // Arrays de Autocomplete (mockados para exemplo)
  unidades: string[] = ['Indaial', 'Blumenau', 'Florianópolis'];
  smartlocks: string[] = ['GAV-01 (Recepção)', 'GAV-02 (TI)', 'ARM-01 (Laboratório)'];

  filteredUnidades!: Observable<string[]>;
  filteredSmartlocks!: Observable<string[]>;

  // Dados mockados de equipamentos (Simulando o retorno do Node.js)
  equipamentos: Equipamento[] = [
    { id: '1', tipo: 'NOTEBOOK', patrimonio: '102934', disponivel: true },
    { id: '2', tipo: 'MULTIMETRO', patrimonio: '99281', disponivel: false, retiradoPor: 'Sávio Zoboli' },
    { id: '3', tipo: 'PROJETOR', patrimonio: '77362', disponivel: true },
    { id: '4', tipo: 'NOTEBOOK', patrimonio: '102935', disponivel: false, retiradoPor: 'Maria Silva' },
    { id: '5', tipo: 'ALICATE', patrimonio: '11223', disponivel: true },
    { id: '6', tipo: 'OSCILOSCÓPIO', patrimonio: '44556', disponivel: false, retiradoPor: 'João Souza' },
  ];

  ngOnInit() {
    this.filteredUnidades = this.unidadeCtrl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || '', this.unidades))
    );

    this.filteredSmartlocks = this.smartlockCtrl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || '', this.smartlocks))
    );
  }

  private _filter(value: string, list: string[]): string[] {
    const filterValue = value.toLowerCase();
    return list.filter(option => option.toLowerCase().includes(filterValue));
  }
}