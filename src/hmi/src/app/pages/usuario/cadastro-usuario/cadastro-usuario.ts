import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { firstValueFrom, Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { UnidadeService } from '../../../services/unidade.service';
import { SystemNotificationService } from '../../../services/system-notification.service';
import { Unidade } from '../../unidade/lista-unidade/lista-unidade';
import { UsuarioService } from '../../../services/usuario.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { objetoSelecionadoValidator } from '../../../shared/validators/objeto-selecionado.validator';
import { filtrarAutocomplete } from '../../../shared/util/autocomplete-filtro.util';
import { displayUnidadeComRegional } from '../../../shared/util/autocomplete-display.util';

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
    AsyncPipe,
    MatProgressSpinnerModule,
  ],
  templateUrl: './cadastro-usuario.html',
  styleUrl: './cadastro-usuario.scss',
})
export class CadastroUsuario implements OnInit {
  userForm: FormGroup = new FormGroup({
    nome: new FormControl('', Validators.required),
    sobrenome: new FormControl('', Validators.required),
    uuid: new FormControl('', Validators.required),
    email: new FormControl('', Validators.required),
    matricula: new FormControl('', [Validators.required, Validators.pattern('^[0-9]{5}$')]),
    // Mesmo fix do cadastro-smartlock: exige objeto selecionado, não só texto.
    unidade: new FormControl('', [Validators.required, objetoSelecionadoValidator]),
  });

  // TODO: mesmo ponto de atenção da IUnidade (falta `regional`).
  private unidades: Unidade[] = [];
  filteredUnidades!: Observable<Unidade[]>;

  usuario_id!: number | null;
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private unidadeService: UnidadeService,
    private usuarioService: UsuarioService,
    private sns: SystemNotificationService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.usuario_id = idParam ? Number(idParam) : null;

    this.inicializarFormulario();
  }

  // Orquestra a ordem de carregamento: trava o formulário, busca as unidades
  // e só então (se houver id) busca os dados do usuário, na sequência correta.
  private async inicializarFormulario(): Promise<void> {
    this.isLoading = true;
    this.userForm.disable();

    const unidadesCarregadas = await this.buscarUnidades();
    if (!unidadesCarregadas) {
      this.isLoading = false;
      return;
    }

    this.filteredUnidades = filtrarAutocomplete(
      this.userForm.get('unidade')!,
      this.unidadeService.listAll() as unknown as Observable<Unidade[]>,
      'nome',
    );

    if (this.usuario_id) {
      await this.carregarDadosUsuario();
    } else {
      this.userForm.enable();
    }

    this.isLoading = false;

    // O patchValue (dentro de carregarDadosUsuario) dispara valueChanges do
    // campo "unidade", que atualiza o filteredUnidades usado no autocomplete.
    // Como isso ocorre de forma assíncrona (após o await), força-se aqui uma
    // checagem manual para evitar o NG0100 (ExpressionChangedAfterItHasBeenCheckedError).
    this.cdr.detectChanges();
  }

  private async buscarUnidades(): Promise<boolean> {
    try {
      this.unidades = (await firstValueFrom(this.unidadeService.listAll())) as unknown as Unidade[];
      return true;
    } catch {
      this.sns.notificar('Não foi possível buscar as unidades', 'erro');
      return false;
    }
  }

  private async carregarDadosUsuario(): Promise<void> {
    try {
      const dadosUsuario = await firstValueFrom(this.usuarioService.getById(this.usuario_id!));
      const unidade_id = dadosUsuario.unidade_id;
      dadosUsuario.unidade = this.unidades.find((f) => f.id == unidade_id) || null;
      this.userForm.patchValue(dadosUsuario);
      this.userForm.enable();
    } catch (err) {
      this.sns.notificarErro(err, 'Erro ao carregar usuário. Ele pode não existir.');
    }
  }

  readonly displayUnidade = displayUnidadeComRegional;

  salvar(): void {
    if (this.userForm.valid) {
      let { nome, sobrenome, email, uuid, matricula, unidade } = this.userForm.value;
      const nomeTrimmed = typeof nome === 'string' ? nome.trim() : nome;
      const sobrenomeTrimmed = typeof sobrenome === 'string' ? sobrenome.trim() : sobrenome;
      const emailTrimmed = typeof email === 'string' ? email.trim() : email;
      const uuidTrimmed = typeof uuid === 'string' ? uuid.trim() : uuid;
      const matriculaTrimmed = typeof matricula === 'string' ? matricula.trim() : matricula;
      let unidade_id = unidade.id;

      this.isLoading = true;
      this.userForm.disable();

      const requisicao$ = this.usuario_id
        ? this.usuarioService.update(this.usuario_id, nomeTrimmed, sobrenomeTrimmed, emailTrimmed, uuidTrimmed, matriculaTrimmed, unidade_id)
        : this.usuarioService.create(nomeTrimmed, sobrenomeTrimmed, emailTrimmed, uuidTrimmed, matriculaTrimmed, unidade_id);

      requisicao$.subscribe({
        next: () => {
          const acao = this.usuario_id ? 'atualizado' : 'cadastrado';
          this.sns.notificar(`Usuário ${acao} com sucesso!`, 'sucesso');
          this.router.navigate(['/usuarios/lista']);
        },
        error: (err: any) => {
          this.sns.notificar(err.message, 'erro');
          this.isLoading = false;
          this.userForm.enable();
        },
      });
    } else {
      this.userForm.markAllAsTouched();
      this.sns.notificar('Por favor, verifique os campos.', 'erro');
    }
  }

  onCancelar() {
    this.router.navigate(['/usuarios/lista']);
  }
}