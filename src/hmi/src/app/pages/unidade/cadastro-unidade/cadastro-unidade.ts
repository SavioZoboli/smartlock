import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipOption, MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // NOVO IMPORT
import { UnidadeService } from '../../../services/unidade.service';
import { Router, ActivatedRoute } from '@angular/router'; // INJEÇÃO DA ROTA
import { REGIONAIS_SC } from '../../../shared/regionais.constant';
import { SystemNotificationService } from '../../../services/system-notification.service';

@Component({
  selector: 'app-cadastro-unidade',
  standalone: true,
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
    MatProgressSpinnerModule
  ],
  templateUrl: './cadastro-unidade.html',
  styleUrl: './cadastro-unidade.scss',
})
export class CadastroUnidade implements OnInit {
  unidadeForm: FormGroup;
  empresas: string[] = ['FIESC', 'SENAI', 'SESI', 'CIESC', 'IEL'];
  regionais: readonly string[] = REGIONAIS_SC;

  // Variáveis de controle de estado
  unidadeId: number | null = null;
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private unidadeService: UnidadeService,
    private router: Router,
    private route: ActivatedRoute,
    private sns:SystemNotificationService
  ) {
    this.unidadeForm = this.fb.group({
      entidade: ['SENAI', Validators.required],
      nome: ['', [Validators.required, Validators.minLength(3)]],
      regional: ['', Validators.required],
    });
  }

  // O lugar correto para capturar parâmetros de rota e iniciar chamadas HTTP
  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    
    if (idParam) {
      this.unidadeId = Number(idParam);
      this.carregarDadosUnidade();
    }
  }

  private carregarDadosUnidade(): void {
    this.isLoading = true;
    this.unidadeForm.disable(); // Trava o form enquanto carrega para evitar edições ansiosas

    this.unidadeService.getById(this.unidadeId!).subscribe({
      next: (dadosUnidade) => {
        this.unidadeForm.patchValue(dadosUnidade);
        this.unidadeForm.enable();
        this.isLoading = false;
      },
      error: () => {
        this.sns.notificar('Erro ao carregar unidade. Ela pode não existir.', 'erro');
        
        this.isLoading = false;
        this.router.navigate(['/unidades/lista']); // Joga de volta pra lista se der erro
      }
    });
  }

  onSubmit(): void {
    if (this.unidadeForm.valid) {
      let formObj = this.unidadeForm.value;
      
      this.isLoading = true;
      this.unidadeForm.disable(); // Trava para evitar duplo clique no botão salvar

      // Define se vai chamar a rota de criação ou atualização baseando-se na existência do ID
      const requisicao$ = this.unidadeId
        ? this.unidadeService.update(this.unidadeId, formObj.nome, formObj.regional, formObj.entidade)
        : this.unidadeService.create(formObj.nome, formObj.regional, formObj.entidade);

      requisicao$.subscribe({
        next: () => {
          const acao = this.unidadeId ? 'atualizada' : 'cadastrada';
          this.sns.notificar(`Unidade ${acao} com sucesso!`, 'sucesso');
          this.router.navigate(['/unidades/lista']);
        },
        error: (err: any) => {
          this.sns.notificar(err.message, 'erro');
          this.isLoading = false;
          this.unidadeForm.enable();
        },
      });
    } else {
      this.unidadeForm.markAllAsTouched();
      this.sns.notificar('Por favor, verifique os campos.', 'erro');
    }
  }

  onCancelar(): void {
    this.unidadeForm.reset();
    this.router.navigate(['/unidades/lista']);
  }
}