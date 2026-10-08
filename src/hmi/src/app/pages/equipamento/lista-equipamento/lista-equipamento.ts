import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { ConfirmDeleteService } from '../../../services/confirm-delete.service';
import { EquipamentoService } from '../../../services/equipamento.service';
import { normalizarTexto } from '../../../shared/util/normalizar-texto.util';
import { sincronizarFiltroTabela } from '../../../shared/util/tabela-filtro.util';

export type StatusEquipamento = 'emprestado' | 'disponivel' | 'manutencao';

export interface Equipamento {
  id: number;
  patrimonio: string;
  tipo: string;
  smartlock: string;
  unidade: string;
  status: StatusEquipamento;
  usuario_atual: string | null;
}

@Component({
  selector: 'app-lista-equipamento',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './lista-equipamento.html',
  styleUrl: './lista-equipamento.scss',
})
export class ListaEquipamento {
  displayedColumns: string[] = [
    'patrimonio',
    'apelido',
    'tipo',
    'smartlock',
    'unidade',
    'status',
    'usuarioAtual',
    'acoes',
  ];

  dataSource = new MatTableDataSource<Equipamento>([]);

  // Filtros: geral é texto livre (usuário, patrimônio, tipo);
  // unidade, smartlock e status são selects populados dinamicamente
  // com os valores presentes na lista carregada.
  filtros: FormGroup = new FormGroup({
    geral: new FormControl(''),
    unidade: new FormControl(''),
    smartlock: new FormControl(''),
    status: new FormControl(''),
  });

  unidadesDisponiveis: string[] = [];
  smartlocksDisponiveis: string[] = [];

  statusOpcoes: { value: StatusEquipamento; label: string }[] = [
    { value: 'disponivel', label: 'Disponível' },
    { value: 'emprestado', label: 'Emprestado' },
    { value: 'manutencao', label: 'Manutenção' },
  ];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private router: Router,
    private equipamentoService: EquipamentoService,
    private confirmDelete: ConfirmDeleteService,
  ) {}

  ngOnInit(): void {
    this.carregarEquipamentos();
    this.initFiltro();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  carregarEquipamentos(): void {
    this.equipamentoService.listAll().subscribe({
      next: (res) => {
        this.dataSource.data = res;
        this.unidadesDisponiveis = [
          ...new Set(res.map((e: any) => e.unidade)),
        ].sort() as string[];
        this.smartlocksDisponiveis = [
          ...new Set(res.map((e: any) => e.smartlock)),
        ].sort() as string[];
      },
      error: (err) => {
        console.log(err);
        this.dataSource.data = [];
      },
    });
  }

  private readonly destroyRef = inject(DestroyRef);

  private initFiltro(): void {
    sincronizarFiltroTabela(
      this.dataSource,
      this.filtros,
      (data: Equipamento, filtro: any) => {
        const geralNormalizado = normalizarTexto((filtro.geral || '').trim());
        const geralConfere =
          !geralNormalizado ||
          normalizarTexto(data.usuario_atual ?? '').includes(geralNormalizado) ||
          normalizarTexto(data.patrimonio).includes(geralNormalizado) ||
          normalizarTexto(data.tipo).includes(geralNormalizado);

        const unidadeConfere = !filtro.unidade || data.unidade === filtro.unidade;
        const smartlockConfere = !filtro.smartlock || data.smartlock === filtro.smartlock;
        const statusConfere = !filtro.status || data.status === filtro.status;

        return geralConfere && unidadeConfere && smartlockConfere && statusConfere;
      },
      this.destroyRef,
    );
  }

  limparFiltros(): void {
    this.filtros.reset({
      geral: '',
      unidade: '',
      smartlock: '',
      status: '',
    });
  }

  statusLabel(status: StatusEquipamento): string {
    return this.statusOpcoes.find((s) => s.value === status)?.label ?? status;
  }

  // --- AÇÕES DA TELA ---

  onNovoEquipamento(): void {
    this.router.navigate(['/equipamentos/cadastro']);
  }

  onRedirectEquipamentos(): void {
    this.router.navigate(['/equipamentos/transferir']);
  }

  onEditar(equipamento: Equipamento): void {
    this.router.navigate(['/equipamentos/editar', equipamento.id]);
  }

  onExcluir(equipamento: Equipamento): void {
    this.confirmDelete
      .confirmarEExcluir({
        titulo: 'Excluir equipamento',
        mensagem: `Tem certeza que deseja excluir o equipamento de patrimônio "${equipamento.patrimonio}"? Esta ação não pode ser desfeita.`,
        excluir$: this.equipamentoService.delete(equipamento.id),
        mensagemSucesso: 'Equipamento removido com sucesso',
      })
      .subscribe((excluido) => {
        if (excluido) {
          this.dataSource.data = this.dataSource.data.filter((e) => e.id !== equipamento.id);
        }
      });
  }
}