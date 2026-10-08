import { Component, effect, ElementRef, NgZone, signal, ViewChild } from '@angular/core';
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
import { Logo } from '../../components/logo/logo';
import { ThemeTogglerService } from '../../services/theme-toggler.service';
import { ServerStatus } from "../../components/server-status/server-status";
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ThemeToggler } from '../../components/theme-toggler/theme-toggler';

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
    Logo,
    ServerStatus,
    MatProgressSpinner,
    ThemeToggler
],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})
export class LoginComponent {

  carregandoGoogle = signal(false);

  constructor(
    private ngZone: NgZone,
    private authService: AuthService,
    private googleIdentityService: GoogleIdentityService,
    private router: Router,
    private sns: SystemNotificationService,
    private themeService:ThemeTogglerService
  ) {
    effect(() => {
    const isDark = this.themeService.isDarkTheme();
    this.renderizarBotao(isDark ? 'dark' : 'light');
  });
  }

  async ngOnInit(): Promise<void> {
    this.carregandoGoogle.set(true)
    let token: string;
    try {
      token = await this.googleIdentityService.aguardarCarregamento();
      
    } catch {
      this.sns.notificar('Não foi possível carregar o login com Google', 'erro');
      this.carregandoGoogle.set(false)
      return;
    }

    // @ts-ignore
    google.accounts.id.initialize({
      client_id: token,
      callback: this.handleCredentialResponse.bind(this),
    });

    const isDark = this.themeService.isDarkTheme();
    this.renderizarBotao(isDark ? 'dark' : 'light');
  }

  renderizarBotao(theme: 'light' | 'dark') {
    const container = document.getElementById('google-btn');
    if (!container) return;
    container.innerHTML = ''; // limpa o botão anterior

    // @ts-ignore
    google.accounts.id.renderButton(container, { theme, size: 'large', width: 300 });

    this.carregandoGoogle.set(false)
  }

  handleCredentialResponse(response: any) {
    const token = response.credential;

    this.ngZone.run(() => {
      // 1. Chama o seu backend passando o token do Google
      this.authService.validarGoogleAuth(token).subscribe({
        next: (resBackend) => {
          if (resBackend.cadastrado) {
            console.log('Cadastrado');
            // Cenário A: Usuário existe e o cookie foi setado pelo backend
            this.sns.notificar('Autenticado, redirecionando...', 'sucesso');
            this.router.navigate(['/dashboard']);
          } else {
            console.log(resBackend);
            let { nome, email, avatar, signupToken } = resBackend.userData;
            console.log('Finalizar cadastro');
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
          this.sns.notificarErro(err, 'Erro ao validar a autenticação');
        },
      });
    });
  }
}
