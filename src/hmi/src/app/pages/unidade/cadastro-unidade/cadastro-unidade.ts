import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipOption, MatChipsModule } from "@angular/material/chips";

@Component({
  selector: 'app-cadastro-unidade',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatChipsModule
],
  templateUrl: './cadastro-unidade.html',
  styleUrl: './cadastro-unidade.scss',
})
export class CadastroUnidade {
unidadeForm: FormGroup;
  
  empresas: string[] = ['FIESC', 'SENAI', 'SESI', 'CIESC', 'IEL'];
  regionais: string[] = ['Vale do Itajaí', 'Grande Florianópolis'];

  constructor(private fb: FormBuilder, private snackBar: MatSnackBar) {
    this.unidadeForm = this.fb.group({
      empresa: ['SENAI', Validators.required],
      nome: ['', [Validators.required, Validators.minLength(3)]],
      regional: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.unidadeForm.valid) {
      this.mostrarNotificacao('Unidade cadastrada com sucesso!');
    } else {
      this.unidadeForm.markAllAsTouched();
      this.mostrarNotificacao('Por favor, verifique os campos.', 'error-snackbar');
    }
  }

  onCancelar(): void {
    // Ação do botão cancelar (ex: voltar para a página anterior)
    console.log('Cadastro cancelado.');
    this.unidadeForm.reset();
  }

  private mostrarNotificacao(mensagem: string, painelClass: string = 'success-snackbar'): void {
    this.snackBar.open(mensagem, 'Fechar', {
      duration: 4000, // Desaparece após 4 segundos
      horizontalPosition: 'right', // Canto direito
      verticalPosition: 'bottom',  // Na parte inferior
      panelClass: [painelClass]    // Classe CSS para estilizar a cor
    });
  }
}
