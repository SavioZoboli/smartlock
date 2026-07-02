import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SystemNotificationService } from '../../services/system-notification.service';
import { Unidade } from '../unidade/lista-unidade/lista-unidade';
import { firstValueFrom, map, Observable, startWith } from 'rxjs';
import { UnidadeService } from '../../services/unidade.service';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-concluir-cadastro',
  templateUrl: './concluir-cadastro.html',
  styleUrls: ['./concluir-cadastro.scss'],
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    AsyncPipe
  ],
})
export class ConcluirCadastro implements OnInit {
  userForm: FormGroup;
  dadosGoogle: any;

  unidades!: Unidade[];
  filteredUnidades!: Observable<Unidade[]>;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private sns: SystemNotificationService,
    private unidadeService:UnidadeService,
    private cdr:ChangeDetectorRef
  ) {

    this.buscarUnidades()
    // Captura os dados invisíveis vindos da rota de Login
    const navigation = this.router.currentNavigation();
    this.dadosGoogle = navigation?.extras?.state;

    // Inicializa o formulário
    this.userForm = this.fb.group({
      nome: ['', Validators.required],
      sobrenome: ['', Validators.required],
      email: [{ value: '', disabled: true }], // Desabilitado por segurança
      uuid: [''],
      matricula: ['', [Validators.required, Validators.pattern('^[0-9]{5}$')]],
      unidade: ['', Validators.required],
    });
  }

  ngOnInit(): void {

    
    console.log(this.dadosGoogle)

    // Se não há token temporário, expulsa para o login
    if (!this.dadosGoogle || !this.dadosGoogle.signupToken) {
      this.router.navigate(['/login']);
      return;
    }

    this.inicializaUnidades()

    let nomeQuebrado = this.dadosGoogle.nome.split(' ');
    let sobrenome = nomeQuebrado[nomeQuebrado.length - 1];

    let nomeSemSobrenome = this.dadosGoogle.nome.replace(sobrenome, '');

    // Pré-preenche os dados recebidos do Google
    this.userForm.patchValue({
      nome: nomeSemSobrenome,
      sobrenome: sobrenome,
      email: this.dadosGoogle.email,
    });
  }

  salvar(): void {
    if (this.userForm.invalid) return;

    // getRawValue pega também os campos 'disabled' (como o email)
    const {nome,sobrenome,uuid,matricula,email} = this.userForm.getRawValue();
    const unidade_id = this.userForm.value.unidade.id

    // Anexa o token de segurança para o backend validar
    const payload = {
      nome,
      sobrenome,
      uuid,
      matricula,
      unidade_id,
      email,
      signupToken: this.dadosGoogle.signupToken,
      avatar:this.dadosGoogle.avatar
    };

    this.authService.finalizarCadastro(payload).subscribe({
      next: (res) => {
        this.sns.notificar('Cadastro concluído com sucesso!', 'sucesso');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error(err);
        this.sns.notificar('Erro ao finalizar cadastro', 'erro');
      },
    });
  }

  private async inicializaUnidades(){
    const unidadesCarregadas = await this.buscarUnidades();
    if (!unidadesCarregadas) {
      return;
    }

    this.initAutocompleteFilter();

    this.cdr.detectChanges();
  }


  private async buscarUnidades(): Promise<boolean> {
    try {
      this.unidades = await firstValueFrom(this.unidadeService.listAll());
      console.log(this.unidades)
      return true;
    } catch {
      this.sns.notificar('Não foi possível buscar as unidades', 'erro');
      return false;
    }
  }

  private initAutocompleteFilter() {
    this.filteredUnidades = this.userForm.get('unidade')!.valueChanges.pipe(
      startWith(''),
      map((value) => this._filter(value || '')),
    );
  }

  private _filter(value: any): Unidade[] {
    if (!this.unidades) return [];

    const stringValue = typeof value === 'string' ? value : value?.nome || '';
    const filterValue = stringValue.toLowerCase();

    return this.unidades.filter((option) => option.nome.toLowerCase().includes(filterValue));
  }

  // Usado pelo [displayWith] do mat-autocomplete: define o texto exibido
  // no input quando uma Unidade é selecionada (ou carregada via patchValue).
  displayUnidade = (unidade: Unidade | string): string => {
    if (!unidade) return '';
    if (typeof unidade === 'string') return unidade;
    return `${unidade.nome} / ${unidade.regional}`;
  };
}
