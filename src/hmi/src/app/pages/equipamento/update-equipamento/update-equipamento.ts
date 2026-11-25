import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Observable, firstValueFrom } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { EquipamentoService } from '../../../services/equipamento.service';
import { SmartlockService } from '../../../services/smartlock.service';
import { SystemNotificationService } from '../../../services/system-notification.service';
import {
  ITipoEquipamento,
  TipoEquipamentoService,
} from '../../../services/tipo-equipamento.service';
import {
  CadastroTipoEquipamentoDialog,
  GerenciarTiposDialogResult,
} from '../../../shared/components/cadastro-tipo-equipamento-dialog/cadastro-tipo-equipamento-dialog';
import { ConfirmDeleteService } from '../../../services/confirm-delete.service';
import { ISmartlock } from '../../../interfaces/smartlock.interface';
import { filtrarAutocomplete } from '../../../shared/util/autocomplete-filtro.util';
import { displayPorCampo } from '../../../shared/util/autocomplete-display.util';
import { objetoSelecionadoValidator } from '../../../shared/validators/objeto-selecionado.validator';


@Component({
  selector: 'app-update-equipamento',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule,
  ],
  templateUrl: './update-equipamento.html',
  styleUrls: ['./update-equipamento.scss'],
})
export class UpdateEquipamento implements OnInit {
  private tipoEquipamentoService = inject(TipoEquipamentoService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  eqForm: FormGroup;
  smartlocks!: ISmartlock[];
  filteredSmartlocks!: Observable<ISmartlock[]>;
  tipos: ITipoEquipamento[] = [];

  equipamento_id!: number;
  isLoading = false;
  ativo = true;
  hasPatrimonio = true;
  hasCredencial = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private equipamentoService: EquipamentoService,
    private smartlockService: SmartlockService,
    private sns: SystemNotificationService,
    private cdr: ChangeDetectorRef,
    private confirmDelete: ConfirmDeleteService,
  ) {
    this.eqForm = this.fb.group({
      smartlock: ['', [Validators.required, objetoSelecionadoValidator]],
      patrimonio: ['', Validators.required],
      tag: ['', Validators.required],
      tipo: ['', Validators.required],
      apelido: [''],
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');

    if (!idParam) {
      this.sns.notificar('Equipamento não informado.', 'erro');
      this.router.navigate(['/equipamentos/lista']);
      return;
    }

    this.equipamento_id = Number(idParam);

    this.eqForm
      .get('tipo')!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((tipoId) => this.aplicarRegrasDoTipo(tipoId));

    this.inicializarFormulario();
  }

  private async inicializarFormulario(): Promise<void> {
    this.isLoading = true;
    this.eqForm.disable({ emitEvent: false });

    await Promise.all([this.inicializaSmartlocks(), this.inicializaTipos()]);
    await this.carregarDadosEquipamento();

    this.isLoading = false;
    this.cdr.detectChanges();
  }

  private async inicializaTipos(): Promise<void> {
    try {
      this.tipos = await firstValueFrom(this.tipoEquipamentoService.listAll());
    } catch (err) {
      this.sns.notificarErro(err, 'Erro ao carregar tipos de equipamento');
    }
  }

  private async inicializaSmartlocks(): Promise<void> {
    try {
      this.smartlocks = await firstValueFrom(this.smartlockService.listAll());
      this.initAutocompleteFilter();
    } catch (err) {
      this.sns.notificarErro(err, 'Erro ao carregar lista de smartlocks');
    }
  }

  private initAutocompleteFilter(): void {
    this.filteredSmartlocks = filtrarAutocomplete(
      this.eqForm.get('smartlock')!,
      this.smartlockService.listAll(),
      'apelido',
    );
  }

  readonly displaySmartlock = displayPorCampo<ISmartlock>('apelido');

  private async carregarDadosEquipamento(): Promise<void> {
    try {
      const dados = await firstValueFrom(this.equipamentoService.getById(this.equipamento_id));

      this.ativo = dados.ativo;

      this.eqForm.enable({ emitEvent: false });
      this.eqForm.patchValue(
        {
          patrimonio: dados.patrimonio ?? '',
          tag: dados.tag,
          tipo: Number(dados.tipo_id),
          apelido: dados.apelido ?? '',
        },
        { emitEvent: false },
      );

      this.aplicarRegrasDoTipo(Number(dados.tipo_id));

      // Smartlocks já garantidos carregados neste ponto (await em inicializaSmartlocks)
      this.eqForm
        .get('smartlock')
        ?.setValue(this.smartlocks.find((s) => s.id === dados.smartlock_id));
    } catch (err) {
      this.sns.notificarErro(err, 'Erro ao carregar Equipamento. Ele pode não existir.');
      this.router.navigate(['/equipamentos/lista']);
    }
  }

  private aplicarRegrasDoTipo(tipoId: unknown): void {
    const tipoEncontrado = this.tipos.find((t) => t.id === Number(tipoId));
    this.hasPatrimonio = tipoEncontrado ? tipoEncontrado.has_patrimonio : true;
    this.hasCredencial = tipoEncontrado ? tipoEncontrado.has_credencial : false;

    const patrimonioCtrl = this.eqForm.get('patrimonio');
    if (!patrimonioCtrl) return;

    if (this.hasPatrimonio) {
      if (this.eqForm.enabled) {
        patrimonioCtrl.enable({ emitEvent: false });
      }
      patrimonioCtrl.setValidators([Validators.required]);
    } else {
      patrimonioCtrl.setValue('', { emitEvent: false });
      patrimonioCtrl.clearValidators();
      patrimonioCtrl.disable({ emitEvent: false });
    }
    patrimonioCtrl.updateValueAndValidity({ emitEvent: false });
  }

  abrirModalGerenciarTipos(): void {
    const ref = this.dialog.open<
      CadastroTipoEquipamentoDialog,
      unknown,
      GerenciarTiposDialogResult | undefined
    >(CadastroTipoEquipamentoDialog, {
      width: '540px',
      maxWidth: '95vw',
    });

    ref
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(async (resultado) => {
        if (!resultado?.alterou) return;
        await this.inicializaTipos();
        if (resultado.ultimoTipoCriado) {
          this.eqForm.get('tipo')?.setValue(resultado.ultimoTipoCriado.id);
        } else {
          this.aplicarRegrasDoTipo(this.eqForm.get('tipo')?.value);
        }
        this.cdr.detectChanges();
      });
  }

  salvar(): void {
    if (this.eqForm.valid) {
      const { smartlock, patrimonio, tag, tipo, apelido } = this.eqForm.getRawValue();
      const patrimonioTrimmed = typeof patrimonio === 'string' ? patrimonio.trim() : '';
      const patrimonioLimpo = patrimonioTrimmed.length > 0 ? patrimonioTrimmed : null;
      const tagTrimmed = typeof tag === 'string' ? tag.trim() : tag;
      const apelidoTrimmed = typeof apelido === 'string' ? apelido.trim() : apelido;

      this.isLoading = true;
      this.eqForm.disable({ emitEvent: false });

      this.equipamentoService
        .update(
          this.equipamento_id,
          patrimonioLimpo,
          tagTrimmed,
          Number(tipo),
          smartlock.id,
          apelidoTrimmed,
        )
        .subscribe({
          next: () => {
            this.sns.notificar('Equipamento atualizado com sucesso!', 'sucesso');
            this.router.navigate(['/equipamentos/lista']);
          },
          error: (err: any) => {
            this.sns.notificarErro(err);
            this.isLoading = false;
            this.eqForm.enable({ emitEvent: false });
            this.aplicarRegrasDoTipo(this.eqForm.get('tipo')?.value);
          },
        });
    } else {
      this.eqForm.markAllAsTouched();
      this.sns.notificar('Por favor, verifique os campos.', 'erro');
    }
  }

  onExcluir(): void {
    this.confirmDelete
      .confirmarEExcluir({
        titulo: 'Excluir equipamento',
        mensagem: `Tem certeza que deseja excluir o equipamento de patrimônio "${this.eqForm.value.patrimonio}"? Esta ação não pode ser desfeita.`,
        excluir$: this.equipamentoService.delete(this.equipamento_id),
        mensagemSucesso: 'Equipamento removido com sucesso',
      })
      .subscribe((excluido) => {
        if (excluido) {
          this.router.navigate(['/equipamentos/lista']);
        }
      });
  }

  onCancelar(): void {
    this.router.navigate(['/equipamentos/lista']);
  }

  onCredenciais(): void {
    this.router.navigate(['/equipamentos/credencial', this.equipamento_id]);
  }
}
