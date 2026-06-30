import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { Observable, startWith, map } from 'rxjs';

@Component({
  selector: 'app-cadastro-smartlocks',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatFormFieldModule, 
    MatInputModule, MatAutocompleteModule, MatSlideToggleModule,
    MatButtonModule, MatIconModule, NgxMaskDirective
  ],
  providers: [provideNgxMask()],
  templateUrl: './cadastro-smartlock.html',
  styleUrls: ['./cadastro-smartlock.scss']
})
export class CadastroSmartlock implements OnInit {
  slForm: FormGroup;
  unidades: string[] = ['Indaial', 'Blumenau Centro', 'Blumenau Itoupava', 'Florianópolis'];
  filteredUnidades!: Observable<string[]>;

  constructor(private fb: FormBuilder) {
    this.slForm = this.fb.group({
      unidade: ['', Validators.required],
      apelido: ['', Validators.required],
      temEquipamentos: [false],
      macAddress: ['', [Validators.required]] // A máscara cuidará do formato
    });
  }

  ngOnInit() {
    this.filteredUnidades = this.slForm.get('unidade')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || ''))
    );
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.unidades.filter(u => u.toLowerCase().includes(filterValue));
  }

  salvar() {
    if (this.slForm.valid) {
      console.log('Salvando SmartLock:', this.slForm.value);
    }
  }
}