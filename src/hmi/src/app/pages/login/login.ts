import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  hidePassword = true;

  constructor(private fb: FormBuilder) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  // Ação Principal: Login Institucional Google
  loginWithGoogle(): void {
    console.log('Iniciando fluxo de autenticação OAuth2 com o Google...');
    // Aqui você irá chamar seu serviço de autenticação Google
  }

  // Ação Secundária: Formulário manual
  onSubmit(): void {
    if (this.loginForm.valid) {
      console.log('Dados do login manual:', this.loginForm.value);
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
}