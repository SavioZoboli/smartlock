import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
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
import { TIPO_EQUIPAMENTOS } from '../../shared/tipoEquipamentos.constant';

export interface UsuarioComEquipamento {
  id: number;
  nome: string;
  email: string;
  avatar: string;
  qtd_equipamentos: number;
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

  unidadeCtrl = new FormControl();
  usuarioCtrl = new FormControl();

  usuariosAtivos = signal<UsuarioComEquipamento[]>([]);
  usuarioSelecionado = signal<UsuarioComEquipamento | null>(null);

  equipamentoService = inject(EquipamentoService);

  carregando = signal<boolean>(false);

  equipamentosEmUso = signal<EquipamentoEmUso[]>([]);
  carregandoEmUso = signal<boolean>(false);

  historico = signal<HistoricoItem[]>([]);
  historicoPage = signal<number>(1);
  historicoTotal = signal<number>(0);
  carregandoHistorico = signal<boolean>(false);
  historicoPageSize = 10;

  ngOnInit(): void {
    this.carregarDados();
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
    this.equipamentoService.buscarQtdEmUsoPorUsuario().subscribe({
      next: (res) => {
        this.usuariosAtivos.set(res);
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

  public _displayWithUnidade(valor: any): string {
    return valor ? valor.nome : '';
  }

  public _displayWithUsuario(valor: any): string {
    return valor ? valor.nome : '';
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
