import { Component, ElementRef, NgZone, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { GoogleIdentityService } from '../../services/google-identity.service';
import { Router } from '@angular/router';
import { SystemNotificationService } from '../../services/system-notification.service';
import { Logo } from "../../components/logo/logo";

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    Logo
],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})
export class LoginComponent {
  constructor(
    private ngZone: NgZone,
    private authService: AuthService,
    private googleIdentityService: GoogleIdentityService,
    private router: Router,
    private sns: SystemNotificationService,
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      // Aguarda o SDK do Google ficar disponível, em vez de depender do
      // window.onload (que só dispara uma vez por carregamento de página
      // e não funciona em revisitas via navegação client-side do Angular).
      await this.googleIdentityService.aguardarCarregamento();
    } catch {
      this.sns.notificar('Não foi possível carregar o login com Google', 'erro');
      return;
    }

    // @ts-ignore
    google.accounts.id.initialize({
      client_id: this.googleIdentityService.getGoogleToken(),
      callback: this.handleCredentialResponse.bind(this),
    });

    // @ts-ignore
    google.accounts.id.renderButton(
      document.getElementById('google-btn'),
      { theme: 'outline', size: 'large', width: 300 }, // width é numérico (px), não aceita string com "px"
    );
  }

  handleCredentialResponse(response: any) {
    const token = response.credential;

    this.ngZone.run(() => {
      // 1. Chama o seu backend passando o token do Google
      this.authService.validarGoogleAuth(token).subscribe({
        next: (resBackend) => {
          if (resBackend.cadastrado) {
            console.log("Cadastrado")
            // Cenário A: Usuário existe e o cookie foi setado pelo backend
            this.sns.notificar('Autenticado, redirecionando...', 'sucesso');
            this.router.navigate(['/dashboard']);
          } else {
            console.log(resBackend)
            let {nome,email,avatar,signupToken} = resBackend.userData;
            console.log("Finalizar cadastro")
            this.sns.notificar('É necessário finalizar o cadastro', 'sucesso');
            this.router.navigate(['/concluir-cadastro'], {
              state: {
                nome: nome,
                email: email,
                avatar: avatar,
                signupToken: resBackend.signupToken,
              },
            });
          }
        },
        error: (err) => {
          console.log(err)
          this.sns.notificar('Erro ao validar a autenticação', 'erro');
        },
      });
    });
  }
}