import { CommonModule } from '@angular/common';
import { Component, signal, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { MovimentacaoService } from '../../../services/movimentacao.service';
import { SystemNotificationService } from '../../../services/system-notification.service';
import { EquipamentoService } from '../../../services/equipamento.service';

// TODO: ajustar para as interfaces reais do projeto
export interface Movimentacao {
  id: number;
  timestamp: string; // ISO
  tipo: 'emprestimo' | 'devolucao';
  usuario_id: number;
  smartlock: string; // apelido
  unidade: string;
  regional: string;
  equipamentos: {
    id: number;
    apelido: string;
    patrimonio: string;
  }[];
}

// Resumo de um ciclo de empréstimo de um equipamento (emprestimo -> devolucao)
export interface EmprestimoResumo {
  equipamentoId: number;
  apelido: string;
  patrimonio: string;
  smartlock: string;
  unidade: string;
  data_movimentacao: string;
  dataDevolucao: string | null;
  pendente: boolean;
}

@Component({
  selector: 'app-lista-movimentacao',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatCheckboxModule,
    MatChipsModule,
    MatIconModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './lista-movimentacao.html',
  styleUrl: './lista-movimentacao.scss',
})
export class ListaMovimentacao {
  displayedColumns: string[] = ['timestamp', 'tipo', 'smartlock', 'unidade', 'equipamentos'];

  dataSource = new MatTableDataSource<Movimentacao>([]);

  filtros: FormGroup = new FormGroup({
    patrimonio: new FormControl(''),
    unidade: new FormControl(''),
    tipo: new FormControl(''),
  });

  unidadesDisponiveis: string[] = [];

  emprestimosDoUsuario = signal<EmprestimoResumo[]>([]);

  // TODO: substituir pelo id do usuário logado (AuthService/token)
  private usuarioLogadoId = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private router: Router,
    private movimentacaoService: MovimentacaoService,
    private sns: SystemNotificationService,
    private equipamentoService: EquipamentoService,
  ) {}

  ngOnInit(): void {
    this.carregarMovimentacoes();
    this.carregaEquipamentosComigo();
    this.initFiltro();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  carregaEquipamentosComigo() {
    this.equipamentoService.buscarEquipamentosComigo().subscribe({
      next: (res: EmprestimoResumo[]) => {
        console.log(res)
        this.emprestimosDoUsuario.set(res);
        this.unidadesDisponiveis = [...new Set(res.map((m) => m.unidade))].sort();
      },
      error: (err) => {
        console.log(err);
        this.dataSource.data = [];
      },
    });
  }

  carregarMovimentacoes(): void {
    this.movimentacaoService.listaMovimentacaoUltimosDias(7).subscribe({
      next: (res: Movimentacao[]) => {
        this.dataSource.data = res;
        this.unidadesDisponiveis = [...new Set(res.map((m) => m.unidade))].sort();
      },
      error: (err) => {
        console.log(err);
        this.dataSource.data = [];
      },
    });
  }

  // Remove acentos para busca por patrimônio (mesmo padrão do lista-smartlock)
  private normalizarTexto(valor: string): string {
    return valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  private initFiltro(): void {
    this.dataSource.filterPredicate = (data: Movimentacao, filtro: string): boolean => {
      const { patrimonio, unidade, tipo } = JSON.parse(filtro);

      const patrimonioConfere =
        !patrimonio ||
        data.equipamentos.some((e) =>
          this.normalizarTexto(e.patrimonio).includes(this.normalizarTexto(patrimonio.trim())),
        );
      const unidadeConfere = !unidade || data.unidade === unidade;
      const tipoConfere = !tipo || data.tipo === tipo;

      return patrimonioConfere && unidadeConfere && tipoConfere;
    };

    this.filtros.valueChanges.subscribe((valores) => {
      this.dataSource.filter = JSON.stringify(valores);

      if (this.dataSource.paginator) {
        this.dataSource.paginator.firstPage();
      }
    });
  }

  limparFiltros(): void {
    this.filtros.reset({ patrimonio: '', unidade: '', tipo: '' });
  }

  get totalPendentes(): number {
    return this.emprestimosDoUsuario().filter((e) => e.pendente).length;
  }

  onNovaMovimentacao(): void {
    this.router.navigate(['/movimentacoes/cadastro']);
  }
}
