import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { Observable, firstValueFrom } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { EquipamentoService } from '../../../services/equipamento.service';
import { SmartlockService } from '../../../services/smartlock.service';
import { SystemNotificationService } from '../../../services/system-notification.service';
import { TIPO_EQUIPAMENTOS } from '../../../shared/tipoEquipamentos.constant';
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
  ],
  templateUrl: './update-equipamento.html',
  styleUrls: ['./update-equipamento.scss'],
})
export class UpdateEquipamento implements OnInit {
  eqForm: FormGroup;
  smartlocks!: ISmartlock[];
  filteredSmartlocks!: Observable<ISmartlock[]>;
  tipos = TIPO_EQUIPAMENTOS;

  equipamento_id!: number;
  isLoading = false;
  ativo = true;

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

    this.inicializarFormulario();
  }

  private async inicializarFormulario(): Promise<void> {
    this.isLoading = true;
    this.eqForm.disable();

    await this.inicializaSmartlocks();
    await this.carregarDadosEquipamento();

    this.isLoading = false;
    this.cdr.detectChanges();
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

      this.eqForm.enable();
      this.eqForm.patchValue({
        patrimonio: dados.patrimonio,
        tag: dados.tag,
        tipo: dados.tipo,
        apelido: dados.apelido,
      });

      // Smartlocks já garantidos carregados neste ponto (await em inicializaSmartlocks)
      this.eqForm
        .get('smartlock')
        ?.setValue(this.smartlocks.find((s) => s.id === dados.smartlock_id));
    } catch (err) {
      this.sns.notificarErro(err, 'Erro ao carregar Equipamento. Ele pode não existir.');
      this.router.navigate(['/equipamentos/lista']);
    }
  }

  salvar(): void {
    if (this.eqForm.valid) {
      const { smartlock, patrimonio, tag, tipo, apelido } = this.eqForm.value;

      this.isLoading = true;
      this.eqForm.disable();

      this.equipamentoService
        .update(this.equipamento_id, patrimonio, tag, tipo, smartlock.id, apelido)
        .subscribe({
          next: () => {
            this.sns.notificar('Equipamento atualizado com sucesso!', 'sucesso');
            this.router.navigate(['/equipamentos/lista']);
          },
          error: (err: any) => {
            this.sns.notificarErro(err);
            this.isLoading = false;
            this.eqForm.enable();
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
}
