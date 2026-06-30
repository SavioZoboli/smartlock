import { AsyncPipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { Observable, startWith, map, of } from 'rxjs';

interface EquipamentoCSV {
  uid: string;
  tipo: string;
  patrimonio: string;
}

@Component({
  selector: 'app-cadastro-equipamento',
  imports: [
    MatTableModule,
    MatInputModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    AsyncPipe,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './cadastro-equipamento.html',
  styleUrl: './cadastro-equipamento.scss',
})
export class CadastroEquipamento implements OnInit {
  importForm!: FormGroup;

  // Dados fictícios para os autocompletes
  unidades: string[] = ['Unidade Timbó', 'Unidade Indaial', 'Unidade Blumenau', 'SENAI CETI'];
  smartlocks: string[] = ['SmartLock Recepção 01', 'SmartLock Lab 03', 'SmartLock Almoxarifado'];

  filteredUnidades!: Observable<string[]>;
  filteredSmartlocks!: Observable<string[]>;

  // Estrutura para a tabela de visualização do CSV
  dadosImportados: EquipamentoCSV[] = [];
  displayedColumns: string[] = ['uid', 'tipo', 'patrimonio'];
  nomeArquivoSelecionado: string = '';

  constructor(private fb: FormBuilder,private cdr:ChangeDetectorRef) {}

  ngOnInit(): void {
    this.importForm = this.fb.group({
      unidade: ['', Validators.required],
      smartlock: ['', Validators.required],
      file: [null, Validators.required],
    });

    this.filteredUnidades = this.importForm.get('unidade')!.valueChanges.pipe(
      startWith(''),
      map((value) => this._filter(value || '', this.unidades)),
    );

    this.filteredSmartlocks = this.importForm.get('smartlock')!.valueChanges.pipe(
      startWith(''),
      map((value) => this._filter(value || '', this.smartlocks)),
    );
  }

  private _filter(value: string, lista: string[]): string[] {
    const filterValue = value.toLowerCase();
    return lista.filter((option) => option.toLowerCase().includes(filterValue));
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.nomeArquivoSelecionado = file.name;
      this.importForm.patchValue({ file: file });

      // Leitura automática do CSV ao selecionar
      this.lerCSV(file);
    }
  }

  lerCSV(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      this.processarDadosCSV(text);
    };
    reader.readAsText(file, 'UTF-8');
  }

  processarDadosCSV(text: string): void {
    const linhas = text.split('\n');
    const resultado: EquipamentoCSV[] = [];

    // Ignora o cabeçalho (i = 1)
    for (let i = 1; i < linhas.length; i++) {
      const linha = linhas[i].trim();
      if (linha) {
        // Suporta separação por vírgula ou ponto-e-vírgula comum no Excel em PT-BR
        const colunas = linha.includes(';') ? linha.split(';') : linha.split(',');

        if (colunas.length >= 3) {
          resultado.push({
            uid: colunas[0].trim(),
            tipo: colunas[1].trim(),
            patrimonio: colunas[2].trim(),
          });
        }
      }
    }
    // Força a atualização da referência do array para disparar a mudança na tabela
    this.dadosImportados = [...resultado];

    this.cdr.detectChanges();
  }

  salvar(): void {
    if (this.importForm.valid && this.dadosImportados.length > 0) {
      const payload = {
        unidade: this.importForm.value.unidade,
        smartlock: this.importForm.value.smartlock,
        equipamentos: this.dadosImportados,
      };

      console.log('Dados prontos para envio ao servidor:', payload);
      // Aqui você injetaria seu serviço HTTP para salvar no backend
    }
  }
}
