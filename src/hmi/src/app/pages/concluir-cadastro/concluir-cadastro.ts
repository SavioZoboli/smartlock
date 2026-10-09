import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SystemNotificationService } from '../../services/system-notification.service';
import { Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UnidadeService } from '../../services/unidade.service';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { AsyncPipe } from '@angular/common';
import { objetoSelecionadoValidator } from '../../shared/validators/objeto-selecionado.validator';
import { filtrarAutocomplete } from '../../shared/util/autocomplete-filtro.util';
import { displayUnidadeComRegional } from '../../shared/util/autocomplete-display.util';
import { UnidadeComRegionalDTO } from '../../dto/UnidadeComRegional.dto';

@Component({
  selector: 'app-concluir-cadastro',
  templateUrl: './concluir-cadastro.html',
  styleUrls: ['./concluir-cadastro.scss'],
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    AsyncPipe,
  ],
})
export class ConcluirCadastro implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly sns = inject(SystemNotificationService);
  private readonly unidadeService = inject(UnidadeService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  userForm: FormGroup;
  dadosGoogle: any;
  filteredUnidades!: Observable<UnidadeComRegionalDTO[]>;

  readonly displayUnidade = displayUnidadeComRegional;

  constructor() {
    // Captura os dados vindos da rota de Login
    const navigation = this.router.currentNavigation();
    this.dadosGoogle = navigation?.extras?.state;

    // Inicializa o formulário
    this.userForm = this.fb.group({
      nome: ['', Validators.required],
      sobrenome: ['', Validators.required],
      email: [{ value: '', disabled: true }], // Desabilitado por segurança
      uuid: [''],
      matricula: ['', [Validators.required, Validators.pattern('^[0-9]{5}$')]],
      unidade: ['', [Validators.required, objetoSelecionadoValidator]],
    });
  }

  ngOnInit(): void {
    // Se não há token temporário, redireciona para o login
    if (!this.dadosGoogle || !this.dadosGoogle.signupToken) {
      this.router.navigate(['/login']);
      return;
    }

    this.inicializaUnidades();

    const nomeQuebrado = (this.dadosGoogle.nome || '').trim().split(' ');
    const sobrenome = nomeQuebrado.length > 1 ? nomeQuebrado[nomeQuebrado.length - 1] : '';
    const nomeSemSobrenome = (this.dadosGoogle.nome || '').replace(new RegExp(`\\s*${sobrenome}$`), '');

    // Pré-preenche os dados recebidos do Google
    this.userForm.patchValue({
      nome: nomeSemSobrenome || this.dadosGoogle.nome,
      sobrenome: sobrenome,
      email: this.dadosGoogle.email,
    });
  }

  salvar(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      this.sns.notificar('Por favor, verifique os campos.', 'erro');
      return;
    }

    // getRawValue pega também os campos 'disabled' (como o email)
    const { nome, sobrenome, uuid, matricula, email } = this.userForm.getRawValue();
    const unidade_id = this.userForm.value.unidade.id;

    // Anexa o token de segurança para o backend validar
    const payload = {
      nome: typeof nome === 'string' ? nome.trim() : nome,
      sobrenome: typeof sobrenome === 'string' ? sobrenome.trim() : sobrenome,
      uuid: typeof uuid === 'string' ? uuid.trim() : uuid,
      matricula: typeof matricula === 'string' ? matricula.trim() : matricula,
      unidade_id,
      email: typeof email === 'string' ? email.trim() : email,
      signupToken: this.dadosGoogle.signupToken,
      avatar: this.dadosGoogle.avatar,
    };

    this.authService
      .finalizarCadastro(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.sns.notificar('Cadastro concluído com sucesso!', 'sucesso');
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.sns.notificarErro(err, 'Erro ao finalizar cadastro');
        },
      });
  }

  private inicializaUnidades(): void {
    this.unidadeService.listAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();

    this.filteredUnidades = filtrarAutocomplete(
      this.userForm.get('unidade')!,
      this.unidadeService.listAll() as Observable<UnidadeComRegionalDTO[]>,
      'nome',
    );

    this.cdr.detectChanges();
  }

  cancelar(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
