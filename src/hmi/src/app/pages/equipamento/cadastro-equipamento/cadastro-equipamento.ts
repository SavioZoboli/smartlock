import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

import { SmartlockService } from '../../../services/smartlock.service';
import { SystemNotificationService } from '../../../services/system-notification.service';
import { UnidadeService } from '../../../services/unidade.service';
import { EquipamentoService } from '../../../services/equipamento.service';
import { TipoEquipamentoService } from '../../../services/tipo-equipamento.service';
import {
  CadastroTipoEquipamentoDialog,
  GerenciarTiposDialogResult,
} from '../../../shared/components/cadastro-tipo-equipamento-dialog/cadastro-tipo-equipamento-dialog';
import { IUnidade } from '../../../interfaces/unidade.interface';
import { objetoSelecionadoValidator } from '../../../shared/validators/objeto-selecionado.validator';
import { filtrarAutocomplete } from '../../../shared/util/autocomplete-filtro.util';
import { displayPorCampo } from '../../../shared/util/autocomplete-display.util';
import {
  lerArquivoComoTexto,
  marcarPatrimoniosDuplicados,
  parseEquipamentosCsv,
} from './equipamento-csv-parser.util';

export interface SmartlockOption {
  id: number;
  apelido: string;
}

@Component({
  selector: 'app-cadastro-equipamento',
  imports: [
    CommonModule,
    AsyncPipe,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatTooltipModule,
  ],
  templateUrl: './cadastro-equipamento.html',
  styleUrl: './cadastro-equipamento.scss',
})
export class CadastroEquipamento implements OnInit {
  private fb = inject(FormBuilder);
  private unidadeService = inject(UnidadeService);
  private smartlockService = inject(SmartlockService);
  private sns = inject(SystemNotificationService);
  private equipamentoService = inject(EquipamentoService);
  private tipoEquipamentoService = inject(TipoEquipamentoService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  importForm!: FormGroup;
  novoItemForm!: FormGroup;

  tiposEquipamento = this.tipoEquipamentoService.tipos;

  private smartlocksSubject = new BehaviorSubject<SmartlockOption[]>([]);

  filteredUnidades!: Observable<IUnidade[]>;
  filteredSmartlocks!: Observable<SmartlockOption[]>;

  nomeArquivoSelecionado = '';

  unidadeDisplayFn = displayPorCampo<IUnidade>('nome');
  smartlockDisplayFn = displayPorCampo<SmartlockOption>('apelido');

  ngOnInit(): void {
    this.importForm = this.fb.group({
      unidade: [null, [Validators.required, objetoSelecionadoValidator]],
      smartlock: [
        { value: null, disabled: true },
        [Validators.required, objetoSelecionadoValidator],
      ],
      tipoGlobal: [''],
      equipamentos: this.fb.array([]),
    });

    this.novoItemForm = this.fb.group({
      tag: ['', Validators.required],
      patrimonio: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      tipo: ['', Validators.required],
      apelido: [''],
    });

    // Dispara a busca (ou reaproveita o cache); o resultado atualiza o signal unidadeService.unidades
    this.unidadeService.listAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.tipoEquipamentoService.listAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();

    this.novoItemForm
      .get('tipo')!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((tipoId) => this.atualizarValidacaoPatrimonio(this.novoItemForm, tipoId));

    this.filteredUnidades = filtrarAutocomplete(
      this.importForm.get('unidade')!,
      this.unidadeService.listAll(),
      'nome',
    );

    this.filteredSmartlocks = filtrarAutocomplete(
      this.importForm.get('smartlock')!,
      this.smartlocksSubject,
      'apelido',
    );
  }

  get equipamentosArray(): FormArray {
    return this.importForm.get('equipamentos') as FormArray;
  }

  onUnidadeSelecionada(unidade: IUnidade): void {
    const smartlockControl = this.importForm.get('smartlock')!;
    smartlockControl.reset(null);
    smartlockControl.disable();

    this.smartlockService
      .listByUnidade(unidade.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (smartlocks) => {
          this.smartlocksSubject.next(
            smartlocks.map((s) => ({
              id: s.id,
              apelido: s.apelido ?? '',
            })),
          );
          smartlockControl.enable();
        },
        error: (err) => {
          this.sns.notificarErro(err, 'Erro ao carregar smartlocks da unidade');
        },
      });
  }

  limparUnidade(): void {
    this.importForm.get('unidade')?.setValue(null);
    this.limparSmartlock();
    this.importForm.get('smartlock')?.disable();
    this.smartlocksSubject.next([]);
  }

  limparSmartlock(): void {
    this.importForm.get('smartlock')?.reset(null);
  }

  // --- ITENS: adição manual ---

  adicionarItem(): void {
    if (this.novoItemForm.invalid) {
      this.novoItemForm.markAllAsTouched();
      return;
    }

    const { tag, patrimonio, tipo, apelido } = this.novoItemForm.getRawValue();
    const tagTrimmed = typeof tag === 'string' ? tag.trim() : tag;
    const patrimonioTrimmed = typeof patrimonio === 'string' ? patrimonio.trim() : '';
    const apelidoTrimmed = typeof apelido === 'string' ? apelido.trim() : apelido;

    this.equipamentosArray.push(
      this.criarItemGroup(tagTrimmed, patrimonioTrimmed, Number(tipo), apelidoTrimmed),
    );

    // Mantém o tipo selecionado para agilizar o cadastro de vários itens do mesmo tipo em sequência
    this.novoItemForm.reset({ tag: '', patrimonio: '', tipo, apelido: '' });
    this.atualizarValidacaoPatrimonio(this.novoItemForm, tipo);
  }

  removerItem(index: number): void {
    this.equipamentosArray.removeAt(index);
  }

  private tipoExigePatrimonio(tipoId: unknown): boolean {
    if (tipoId === '' || tipoId === null || tipoId === undefined) return true;
    const idNum = Number(tipoId);
    const tipo = this.tiposEquipamento().find((t) => t.id === idNum);
    return tipo ? tipo.has_patrimonio : true;
  }

  private atualizarValidacaoPatrimonio(grupo: FormGroup, tipoId: unknown): void {
    const patrimonioCtrl = grupo.get('patrimonio');
    if (!patrimonioCtrl) return;

    if (this.tipoExigePatrimonio(tipoId)) {
      patrimonioCtrl.enable({ emitEvent: false });
      patrimonioCtrl.setValidators([Validators.required, Validators.pattern(/^\d{6}$/)]);
    } else {
      patrimonioCtrl.setValue('', { emitEvent: false });
      patrimonioCtrl.clearValidators();
      patrimonioCtrl.disable({ emitEvent: false });
    }
    patrimonioCtrl.updateValueAndValidity({ emitEvent: false });
  }

  private criarItemGroup(
    tag: string,
    patrimonio: string,
    tipo: number | string,
    apelido: string,
  ): FormGroup {
    const grupo = this.fb.group({
      tag: [tag, Validators.required],
      patrimonio: [patrimonio, [Validators.required, Validators.pattern(/^\d{6}$/)]],
      tipo: [tipo, Validators.required],
      apelido: [apelido],
    });

    this.atualizarValidacaoPatrimonio(grupo, tipo);
    grupo
      .get('tipo')!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((novoTipoId) => this.atualizarValidacaoPatrimonio(grupo, novoTipoId));

    return grupo;
  }

  // --- TIPO GLOBAL E MODAL ---

  aplicarTipoGlobal(): void {
    const tipo = this.importForm.get('tipoGlobal')!.value;
    if (!tipo) return;

    const tipoId = Number(tipo);
    this.equipamentosArray.controls.forEach((grupo) => grupo.get('tipo')!.setValue(tipoId));
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
      .subscribe((resultado) => {
        if (!resultado?.alterou) return;
        this.tipoEquipamentoService
          .listAll()
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
            if (resultado.ultimoTipoCriado) {
              this.novoItemForm.get('tipo')?.setValue(resultado.ultimoTipoCriado.id);
            } else {
              this.atualizarValidacaoPatrimonio(
                this.novoItemForm,
                this.novoItemForm.get('tipo')?.value,
              );
            }
          });
      });
  }

  // --- IMPORTAÇÃO CSV ---

  async onFileChange(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.nomeArquivoSelecionado = file.name;
      try {
        const texto = await lerArquivoComoTexto(file);
        this.processarImportacaoCsv(texto);
      } catch (err) {
        this.sns.notificarErro(err, 'Erro ao ler arquivo CSV');
      } finally {
        input.value = '';
      }
    }
  }

  private processarImportacaoCsv(texto: string): void {
    const tipoGlobal = this.importForm.get('tipoGlobal')!.value;
    const tipoPadrao = tipoGlobal ? Number(tipoGlobal) : '';
    const itens = parseEquipamentosCsv(texto, tipoPadrao);

    for (const item of itens) {
      this.equipamentosArray.push(
        this.criarItemGroup(item.tag, item.patrimonio, item.tipo, item.apelido ?? ''),
      );
    }

    this.sns.notificar(`${itens.length} equipamento(s) importado(s) do CSV`, 'sucesso');
  }

  // --- SALVAR ---

  salvar(): void {
    if (this.importForm.invalid || this.equipamentosArray.length === 0) {
      this.importForm.markAllAsTouched();
      return;
    }

    const { smartlock, equipamentos } = this.importForm.getRawValue();
    const equipamentosSanitizados = (equipamentos as any[]).map((e) => {
      const patrimonioTrimmed = typeof e.patrimonio === 'string' ? e.patrimonio.trim() : '';
      return {
        tag: typeof e.tag === 'string' ? e.tag.trim() : e.tag,
        patrimonio: patrimonioTrimmed.length > 0 ? patrimonioTrimmed : null,
        tipo_id: Number(e.tipo),
        apelido: typeof e.apelido === 'string' ? e.apelido.trim() : e.apelido,
      };
    });

    this.equipamentoService
      .bulkCreate(smartlock.id, equipamentosSanitizados)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.contagem == this.equipamentosArray.length) {
            this.router.navigate(['/equipamentos/lista']);
            this.sns.notificar(`${res.contagem} equipamentos adicionados`, 'sucesso');
            return;
          }
          this.sns.notificar(
            `Nenhum erro registrado, mas contagem não confere. ${res.contagem}`,
            'sucesso',
          );
        },
        error: (err: HttpErrorResponse) => {
          if (err.status === 409 && err.error?.duplicados) {
            marcarPatrimoniosDuplicados(this.equipamentosArray, err.error.duplicados);
            this.sns.notificar(err.error.message, 'erro');
            return;
          }
          this.sns.notificarErro(err, `Erro: ${err.error?.message ?? err.message}`);
        },
      });
  }

  onCancelar(): void {
    this.importForm.reset();
    this.router.navigate(['/equipamentos/lista']);
  }
}