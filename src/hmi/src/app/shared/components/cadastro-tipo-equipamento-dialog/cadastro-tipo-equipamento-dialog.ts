import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import {
  ITipoEquipamento,
  TipoEquipamentoService,
} from '../../../services/tipo-equipamento.service';
import { ConfirmDeleteService } from '../../../services/confirm-delete.service';
import { SystemNotificationService } from '../../../services/system-notification.service';
import {
  CategoriaIconeEquipamento,
  CATEGORIAS_ICONES_TIPO_EQUIPAMENTO,
  ICONE_TIPO_EQUIPAMENTO_PADRAO,
  ICONES_SUGERIDOS_TIPO_EQUIPAMENTO,
  obterIconeTipoEquipamento,
} from '../../tipoEquipamentos.constant';
import { normalizarTexto } from '../../util/normalizar-texto.util';

export const TAMANHO_MAX_NOME_TIPO = 30;
export const TAMANHO_MAX_DESCRICAO_TIPO = 100;
export const TAMANHO_MAX_ICONE_TIPO = 20;

const REGEX_ICONE_CUSTOM = /^[a-z0-9_]{1,20}$/;

export type ModoModalTipo = 'lista' | 'criar' | 'editar';

export interface GerenciarTiposDialogData {
  modoInicial?: ModoModalTipo;
}

export interface GerenciarTiposDialogResult {
  alterou: boolean;
  ultimoTipoCriado?: ITipoEquipamento;
}

@Component({
  selector: 'app-cadastro-tipo-equipamento-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './cadastro-tipo-equipamento-dialog.html',
  styleUrls: ['./cadastro-tipo-equipamento-dialog.scss'],
})
export class CadastroTipoEquipamentoDialog implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(
    MatDialogRef<CadastroTipoEquipamentoDialog, GerenciarTiposDialogResult>,
  );
  private data = inject<GerenciarTiposDialogData | null>(MAT_DIALOG_DATA, { optional: true });
  private tipoEquipamentoService = inject(TipoEquipamentoService);
  private confirmDelete = inject(ConfirmDeleteService);
  private sns = inject(SystemNotificationService);
  private destroyRef = inject(DestroyRef);

  readonly tamanhoMaxNome = TAMANHO_MAX_NOME_TIPO;
  readonly tamanhoMaxDescricao = TAMANHO_MAX_DESCRICAO_TIPO;
  readonly categoriasIcone = CATEGORIAS_ICONES_TIPO_EQUIPAMENTO;
  readonly iconesSugeridos = ICONES_SUGERIDOS_TIPO_EQUIPAMENTO;

  modo = signal<ModoModalTipo>(this.data?.modoInicial ?? 'lista');
  tipos = signal<ITipoEquipamento[]>([]);
  tipoEditando = signal<ITipoEquipamento | null>(null);
  carregandoLista = signal<boolean>(false);
  salvando = signal<boolean>(false);

  buscaIcone = signal<string>('');
  categoriaAtiva = signal<CategoriaIconeEquipamento>('todos');
  seletorIconeAberto = signal<boolean>(false);

  private alterou = false;
  private ultimoTipoCriado?: ITipoEquipamento;

  form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(TAMANHO_MAX_NOME_TIPO)]],
    descricao: ['', [Validators.maxLength(TAMANHO_MAX_DESCRICAO_TIPO)]],
    icone: [ICONE_TIPO_EQUIPAMENTO_PADRAO, [Validators.maxLength(TAMANHO_MAX_ICONE_TIPO)]],
    has_patrimonio: [true],
    has_credencial: [false],
  });

  podeExcluirTipoEditando = computed<boolean>(() => {
    const tipo = this.tipoEditando();
    if (!tipo) return false;
    return (tipo.qtd_equipamentos ?? 0) === 0;
  });

  tooltipExcluir = computed<string>(() => {
    const qtd = this.tipoEditando()?.qtd_equipamentos ?? 0;
    if (qtd > 0) {
      return `Não é possível excluir: há ${qtd} equipamento(s) vinculado(s) a este tipo.`;
    }
    return 'Excluir este tipo de equipamento';
  });

  iconesFiltrados = computed(() => {
    const termo = normalizarTexto(this.buscaIcone().trim());
    const categoria = this.categoriaAtiva();

    return this.iconesSugeridos.filter((item) => {
      const categoriaConfere =
        termo.length > 0 || categoria === 'todos' || item.categoria === categoria;
      if (!categoriaConfere) return false;
      if (!termo) return true;

      return (
        normalizarTexto(item.label).includes(termo) ||
        normalizarTexto(item.valor).includes(termo) ||
        item.tags.some((tag) => normalizarTexto(tag).includes(termo))
      );
    });
  });

  /** Permite usar diretamente um código válido do Material Symbols digitado na busca. */
  iconeCustomDigitado = computed<string | null>(() => {
    const bruto = this.buscaIcone().trim().toLowerCase().replace(/\s+/g, '_');
    if (!REGEX_ICONE_CUSTOM.test(bruto)) return null;
    const jaExiste = this.iconesSugeridos.some((i) => i.valor === bruto);
    return jaExiste ? null : bruto;
  });

  ngOnInit(): void {
    this.carregarTipos();
  }

  carregarTipos(): void {
    this.carregandoLista.set(true);
    this.tipoEquipamentoService
      .listAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (lista) => {
          this.tipos.set(lista ?? []);
          this.carregandoLista.set(false);
        },
        error: () => {
          this.carregandoLista.set(false);
        },
      });
  }

  obterIconeExibicao(tipo: ITipoEquipamento): string {
    return obterIconeTipoEquipamento(tipo.nome, tipo.icone);
  }

  obterLabelIcone(valor: string): string {
    return this.iconesSugeridos.find((i) => i.valor === valor)?.label ?? valor;
  }

  abrirNovoTipo(): void {
    this.tipoEditando.set(null);
    this.resetarSeletorIcone();
    this.form.enable();
    this.form.reset({
      nome: '',
      descricao: '',
      icone: ICONE_TIPO_EQUIPAMENTO_PADRAO,
      has_patrimonio: true,
      has_credencial: false,
    });
    this.modo.set('criar');
  }

  abrirEdicao(tipo: ITipoEquipamento): void {
    this.tipoEditando.set(tipo);
    this.resetarSeletorIcone();
    this.form.enable();
    this.form.reset({
      nome: tipo.nome,
      descricao: tipo.descricao ?? '',
      icone: tipo.icone || ICONE_TIPO_EQUIPAMENTO_PADRAO,
      has_patrimonio: tipo.has_patrimonio,
      has_credencial: tipo.has_credencial,
    });
    this.modo.set('editar');
  }

  voltarParaLista(): void {
    this.tipoEditando.set(null);
    this.resetarSeletorIcone();
    this.modo.set('lista');
  }

  private resetarSeletorIcone(): void {
    this.seletorIconeAberto.set(false);
    this.buscaIcone.set('');
    this.categoriaAtiva.set('todos');
  }

  alternarSeletorIcone(): void {
    this.seletorIconeAberto.update((aberto) => !aberto);
  }

  selecionarCategoria(categoria: CategoriaIconeEquipamento): void {
    this.categoriaAtiva.set(categoria);
  }

  atualizarBuscaIcone(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.buscaIcone.set(input.value ?? '');
  }

  limparBuscaIcone(): void {
    this.buscaIcone.set('');
  }

  selecionarIcone(valor: string): void {
    this.form.controls.icone.setValue(valor);
    this.seletorIconeAberto.set(false);
  }

  salvar(): void {
    if (this.form.invalid || this.salvando()) {
      this.form.markAllAsTouched();
      return;
    }

    const { nome, descricao, icone, has_patrimonio, has_credencial } = this.form.getRawValue();
    const nomeTrim = nome.trim();
    if (!nomeTrim) {
      this.form.controls.nome.setErrors({ required: true });
      this.form.controls.nome.markAsTouched();
      return;
    }

    const descricaoTrim = descricao.trim();
    const iconeTrim = icone.trim();
    const payload = {
      nome: nomeTrim,
      descricao: descricaoTrim.length > 0 ? descricaoTrim : null,
      icone: iconeTrim.length > 0 ? iconeTrim : null,
      has_patrimonio,
      has_credencial,
    };

    const editando = this.tipoEditando();
    const requisicao$ = editando
      ? this.tipoEquipamentoService.update(editando.id, payload)
      : this.tipoEquipamentoService.create(payload);

    this.salvando.set(true);
    this.form.disable();

    requisicao$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (salvo) => {
        this.salvando.set(false);
        this.form.enable();
        this.alterou = true;
        if (!editando) {
          this.ultimoTipoCriado = salvo;
        }
        this.sns.notificar(
          editando
            ? 'Tipo de equipamento atualizado com sucesso!'
            : 'Tipo de equipamento cadastrado com sucesso!',
          'sucesso',
        );
        this.voltarParaLista();
        this.carregarTipos();
      },
      error: (err: HttpErrorResponse) => {
        this.salvando.set(false);
        this.form.enable();

        if (err.status === 409) {
          this.form.controls.nome.setErrors({ duplicado: true });
          this.form.controls.nome.markAsTouched();
          this.sns.notificar(
            err.error?.message ?? 'Já existe um tipo de equipamento com este nome',
            'erro',
          );
          return;
        }

        this.sns.notificarErro(
          err,
          err.error?.message ?? 'Erro ao salvar tipo de equipamento',
        );
      },
    });
  }

  onExcluir(): void {
    const tipo = this.tipoEditando();
    if (!tipo || !this.podeExcluirTipoEditando() || this.salvando()) return;

    this.confirmDelete
      .confirmarEExcluir({
        titulo: 'Excluir tipo de equipamento',
        mensagem: `Tem certeza que deseja excluir o tipo "${tipo.nome}"? Esta ação não pode ser desfeita.`,
        excluir$: this.tipoEquipamentoService.delete(tipo.id),
        mensagemSucesso: 'Tipo de equipamento removido com sucesso',
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((excluido) => {
        if (excluido) {
          this.alterou = true;
          this.voltarParaLista();
          this.carregarTipos();
        }
      });
  }

  fechar(): void {
    this.dialogRef.close({
      alterou: this.alterou,
      ultimoTipoCriado: this.ultimoTipoCriado,
    });
  }
}
