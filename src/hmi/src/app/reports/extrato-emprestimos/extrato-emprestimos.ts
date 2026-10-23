import { Component, computed, DestroyRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule, MatDrawer } from '@angular/material/sidenav';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { EquipamentoService } from '../../services/equipamento.service';
import { UnidadeService } from '../../services/unidade.service';
import { UnidadeComRegionalDTO } from '../../dto/UnidadeComRegional.dto';
import { displayPorCampo, displayUnidadeComRegional } from '../../shared/util/autocomplete-display.util';
import { filtrarLista } from '../../shared/util/autocomplete-filtro.util';
import { normalizarTexto } from '../../shared/util/normalizar-texto.util';
import { TIPO_EQUIPAMENTOS } from '../../shared/tipoEquipamentos.constant';

export interface UsuarioComEquipamento {
  id: number;
  nome: string;
  email: string;
  avatar: string;
  qtd_equipamentos: number;
  unidade?: string;
  unidade_id?: number;
}

export interface EquipamentoResumo {
  id: number;
  apelido: string | null;
  tag: string;
  patrimonio: string;
  tipo: string;
}

export interface EquipamentoEmUso {
  id: number;
  apelido: string;
  patrimonio: string;
  tipo: string;
  icone: string | undefined;
  dataRetirada: Date;
}
export type TipoMovimento = 'emprestimo' | 'emprestimo_manual' | 'devolucao' | 'devolucao_manual';
export interface HistoricoItem {
  id: number;
  tipo_movimento: TipoMovimento;
  timestamp: string;
  equipamentos: EquipamentoResumo[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

@Component({
  selector: 'app-extrato-emprestimos',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSidenavModule,
    MatTabsModule,
    MatButtonModule,
    MatDividerModule,
  ],
  templateUrl: './extrato-emprestimos.html',
  styleUrls: ['./extrato-emprestimos.scss'],
})
export class ExtratoEmprestimosComponent implements OnInit {
  @ViewChild('drawer') drawer!: MatDrawer;

  private readonly equipamentoService = inject(EquipamentoService);
  private readonly unidadeService = inject(UnidadeService);
  private readonly destroyRef = inject(DestroyRef);

  unidadeCtrl = new FormControl<string | UnidadeComRegionalDTO | null>('');
  usuarioCtrl = new FormControl<string | UsuarioComEquipamento | null>('');

  private todosUsuarios = signal<UsuarioComEquipamento[]>([]);
  unidades = signal<UnidadeComRegionalDTO[]>([]);

  filteredUnidades = signal<UnidadeComRegionalDTO[]>([]);
  filteredUsuarios = signal<UsuarioComEquipamento[]>([]);

  private termoUsuario = signal<string>('');
  private unidadeFiltro = signal<UnidadeComRegionalDTO | string | null>(null);

  usuariosAtivos = computed<UsuarioComEquipamento[]>(() => {
    const lista = this.todosUsuarios();
    const termo = normalizarTexto((this.termoUsuario() || '').trim());
    const unid = this.unidadeFiltro();

    return lista.filter((user) => {
      const nomeMatch =
        !termo ||
        normalizarTexto(user.nome).includes(termo) ||
        normalizarTexto(user.email).includes(termo);

      let unidadeMatch = true;
      if (unid) {
        if (typeof unid === 'object' && unid && unid.id) {
          unidadeMatch =
            user.unidade_id === unid.id ||
            (!!user.unidade && normalizarTexto(user.unidade) === normalizarTexto(unid.nome));
        } else if (typeof unid === 'string' && unid.trim() !== '') {
          unidadeMatch =
            !!user.unidade && normalizarTexto(user.unidade).includes(normalizarTexto(unid.trim()));
        }
      }

      return nomeMatch && unidadeMatch;
    });
  });

  usuarioSelecionado = signal<UsuarioComEquipamento | null>(null);

  carregando = signal<boolean>(false);

  equipamentosEmUso = signal<EquipamentoEmUso[]>([]);
  carregandoEmUso = signal<boolean>(false);

  historico = signal<HistoricoItem[]>([]);
  historicoPage = signal<number>(1);
  historicoTotal = signal<number>(0);
  carregandoHistorico = signal<boolean>(false);
  historicoPageSize = 10;

  readonly _displayWithUnidade = displayUnidadeComRegional;
  readonly _displayWithUsuario = displayPorCampo<UsuarioComEquipamento>('nome');

  ngOnInit(): void {
    this.carregarDados();
    this.carregarUnidades();
    this.iniciarObservadoresFiltros();
  }

  private carregarUnidades(): void {
    this.unidadeService
      .listAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (unidades) => {
          const lista = unidades as unknown as UnidadeComRegionalDTO[];
          this.unidades.set(lista);
          this.filteredUnidades.set(lista);
        },
      });
  }

  private iniciarObservadoresFiltros(): void {
    this.unidadeCtrl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => {
        this.unidadeFiltro.set(val);
        this.filteredUnidades.set(filtrarLista(this.unidades(), val, 'nome'));
      });

    this.usuarioCtrl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => {
        const texto = typeof val === 'string' ? val : (val?.nome ?? '');
        this.termoUsuario.set(texto);
        this.filteredUsuarios.set(filtrarLista(this.todosUsuarios(), val, 'nome'));
      });
  }

  limparUnidade(): void {
    this.unidadeCtrl.setValue('');
  }

  limparUsuario(): void {
    this.usuarioCtrl.setValue('');
  }

  abrirDetalhesUsuario(usuario: UsuarioComEquipamento) {
    this.usuarioSelecionado.set(usuario);
    this.drawer.open();
    this.carregarEquipamentosEmUso(usuario.id);
    this.resetHistorico();
    this.carregarHistorico(usuario.id);
  }

  fecharDrawer() {
    this.drawer.close();
    setTimeout(() => {
      this.usuarioSelecionado.set(null);
      this.equipamentosEmUso.set([]);
      this.resetHistorico();
    }, 300);
  }

  private carregarDados() {
    this.carregando.set(true);
    this.equipamentoService
      .buscarQtdEmUsoPorUsuario()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const lista = Array.isArray(res) ? res : [];
          this.todosUsuarios.set(lista);
          this.filteredUsuarios.set(lista);
          this.carregando.set(false);
        },
        error: () => {
          this.carregando.set(false);
        },
      });
  }

  private carregarEquipamentosEmUso(usuarioId: number) {
    this.carregandoEmUso.set(true);
    this.equipamentoService.buscarEquipamentosEmUso(usuarioId).subscribe({
      next: (res) => {
        this.equipamentosEmUso.set(
          res.map((e) => ({
            ...e,
            icone: TIPO_EQUIPAMENTOS.find((t) => t.descricao == e.tipo)?.icone,
          })),
        );
      },
      error: () => this.carregandoEmUso.set(false),
      complete: () => this.carregandoEmUso.set(false),
    });
  }

  private resetHistorico() {
    this.historico.set([]);
    this.historicoPage.set(1);
    this.historicoTotal.set(0);
  }

  carregarHistorico(usuarioId: number) {
    this.carregandoHistorico.set(true);
    this.equipamentoService
      .buscarHistorico(usuarioId, this.historicoPage(), this.historicoPageSize)
      .subscribe({
        next: (res) => {
          this.historico.update((atual) => [...atual, ...res.items]);
          this.historicoTotal.set(res.total);
        },
        error: () => this.carregandoHistorico.set(false),
        complete: () => this.carregandoHistorico.set(false),
      });
  }

  carregarMaisHistorico() {
    if (this.historico().length >= this.historicoTotal()) return;
    this.historicoPage.update((p) => p + 1);
    const usuario = this.usuarioSelecionado();
    if (usuario) this.carregarHistorico(usuario.id);
  }

  isRetirada(tipo: string): boolean {
    return tipo === 'emprestimo' || tipo === 'emprestimo_manual';
  }

  labelMovimento(tipo: string): string {
    const labels: Record<string, string> = {
      emprestimo: 'Retirada',
      emprestimo_manual: 'Retirada manual',
      devolucao: 'Devolução',
      devolucao_manual: 'Devolução manual',
    };
    return labels[tipo] ?? tipo;
  }

  iconeMovimento(tipo: string): string {
    return this.isRetirada(tipo) ? 'logout' : 'login';
  }
}
