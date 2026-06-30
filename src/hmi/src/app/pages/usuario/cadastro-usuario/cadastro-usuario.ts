import { Component } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipOption, MatChipsModule } from "@angular/material/chips";
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { map, Observable, startWith } from 'rxjs';

@Component({
  selector: 'app-cadastro-usuario',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatChipsModule,
    MatAutocompleteModule,
    AsyncPipe
],
  templateUrl: './cadastro-usuario.html',
  styleUrl: './cadastro-usuario.scss',
})
export class CadastroUsuario {
userForm!: FormGroup;
  unidades: string[] = ['Unidade Timbó', 'Unidade Indaial', 'Unidade Blumenau', 'SENAI CETI'];
  filteredUnidades!: Observable<string[]>;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.userForm = this.fb.group({
      nome: ['', Validators.required],
      sobrenome: ['', Validators.required],
      uid: ['', Validators.required],
      matricula: ['', [Validators.required, Validators.pattern('^[0-9]{5}$')]],
      unidade: ['', Validators.required]
    });

    this.filteredUnidades = this.userForm.get('unidade')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || ''))
    );
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.unidades.filter(option => option.toLowerCase().includes(filterValue));
  }

  salvar(): void {
    if (this.userForm.valid) {
      console.log('Dados do Usuário:', this.userForm.value);
    }
  }
}
