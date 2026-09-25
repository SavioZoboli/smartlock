import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { provideNgxMask } from 'ngx-mask';
import { Observable, firstValueFrom } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { SmartlockService } from '../../../services/smartlock.service';
import { SystemNotificationService } from '../../../services/system-notification.service';
import { Unidade } from '../../unidade/lista-unidade/lista-unidade';
import { UnidadeService } from '../../../services/unidade.service';
import { objetoSelecionadoValidator } from '../../../shared/validators/objeto-selecionado.validator';
import { filtrarAutocomplete } from '../../../shared/util/autocomplete-filtro.util';

@Component({
  selector: 'app-cadastro-smartlocks',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  providers: [provideNgxMask()],
  templateUrl: './cadastro-smartlock.html',
  styleUrls: ['./cadastro-smartlock.scss'],
})
export class CadastroSmartlock implements OnInit {
  slForm: FormGroup;

  // TODO: mesmo ponto de atenção da IUnidade (falta `regional`). Mantendo o
  // array local só pro lookup por id depois do patchValue.
  private unidades: Unidade[] = [];
  filteredUnidades!: Observable<Unidade[]>;

  smartlock_id!: number | null;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private smartlockService: SmartlockService,
    private sns: SystemNotificationService,
    private cdr: ChangeDetectorRef,
    private unidadeService: UnidadeService,
  ) {
    this.slForm = this.fb.group({
      // Antes só tinha Validators.required, o que deixava passar texto digitado
      // sem selecionar uma opção real do autocomplete. objetoSelecionadoValidator corrige isso.
      unidade: ['', [Validators.required, objetoSelecionadoValidator]],
      apelido: ['', Validators.required],
      has_equipamentos: [false],
      mac_address: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.smartlock_id = idParam ? Number(idParam) : null;

    this.inicializarFormulario();
  }

  private async inicializarFormulario(): Promise<void> {
    this.isLoading = true;
    this.slForm.disable();

    try {
      this.unidades = (await firstValueFrom(this.unidadeService.listAll())) as unknown as Unidade[];
    } catch {
      this.sns.notificar('Não foi possível carregar as unidades', 'erro');
    }

    // listAll() de novo aqui reaproveita o cache do UnidadeService (sem HTTP extra).
    this.filteredUnidades = filtrarAutocomplete(
      this.slForm.get('unidade')!,
      this.unidadeService.listAll() as unknown as Observable<Unidade[]>,
      'nome',
    );

    if (this.smartlock_id) {
      await this.carregarDadosSmartlock();
    } else {
      this.slForm.enable();
    }

    this.isLoading = false;

    // Mesmo motivo do cadastro-usuario: patchValue dispara valueChanges
    // assincronamente e pode gerar NG0100 sem essa checagem manual.
    this.cdr.detectChanges();
  }

  displayUnidade = (unidade: Unidade | string): string => {
    if (!unidade) return '';
    if (typeof unidade === 'string') return unidade;
    return `${unidade.nome} / ${unidade.regional}`;
  };

  private async carregarDadosSmartlock(): Promise<void> {
    try {
      const dados = await firstValueFrom(this.smartlockService.getById(this.smartlock_id!));
      this.slForm.enable();
      this.slForm.patchValue(dados);
      this.slForm.get('mac_address')?.setValue(dados.mac_address);
      this.slForm.get('unidade')?.setValue(this.unidades.find((u) => u.id == dados.unidade_id));
    } catch (err) {
      console.error(err);
      this.sns.notificar('Erro ao carregar SmartLock. Ele pode não existir.', 'erro');
    }
  }

  salvar(): void {
    if (this.slForm.valid) {
      const { unidade, apelido, mac_address, has_equipamentos } = this.slForm.value;

      this.isLoading = true;
      this.slForm.disable();

      const requisicao$ = this.smartlock_id
        ? this.smartlockService.update(this.smartlock_id, apelido, mac_address, has_equipamentos, unidade.id)
        : this.smartlockService.create(apelido, mac_address, unidade.id, has_equipamentos);

      requisicao$.subscribe({
        next: () => {
          const acao = this.smartlock_id ? 'atualizado' : 'cadastrado';
          this.sns.notificar(`SmartLock ${acao} com sucesso!`, 'sucesso');
          this.router.navigate(['/smartlocks/lista']);
        },
        error: (err: any) => {
          console.error(err);
          this.sns.notificar(err.message, 'erro');
          this.isLoading = false;
          this.slForm.enable();
        },
      });
    } else {
      this.slForm.markAllAsTouched();
      this.sns.notificar('Por favor, verifique os campos.', 'erro');
    }
  }

  onCancelar(): void {
    this.router.navigate(['/smartlocks/lista']);
  }
}