import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
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
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { MatDialog } from '@angular/material/dialog';
import { SystemNotificationService } from '../../../services/system-notification.service';
import { EquipamentoService } from '../../../services/equipamento.service';

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
    private dialog: MatDialog,
    private sns: SystemNotificationService,
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

  // Remove acentos: decompõe caracteres acentuados em base + diacrítico (NFD)
  // e usa uma regex para eliminar os diacríticos (faixa Unicode \u0300-\u036f).
  private normalizarTexto(valor: string): string {
    return valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  private initFiltro(): void {
    this.dataSource.filterPredicate = (data: Equipamento, filtro: string): boolean => {
      const { geral, unidade, smartlock, status } = JSON.parse(filtro);

      const geralNormalizado = this.normalizarTexto(geral.trim());
      const geralConfere =
        !geralNormalizado ||
        this.normalizarTexto(data.usuario_atual ?? '').includes(geralNormalizado) ||
        this.normalizarTexto(data.patrimonio).includes(geralNormalizado) ||
        this.normalizarTexto(data.tipo).includes(geralNormalizado);

      const unidadeConfere = !unidade || data.unidade === unidade;
      const smartlockConfere = !smartlock || data.smartlock === smartlock;
      const statusConfere = !status || data.status === status;

      return geralConfere && unidadeConfere && smartlockConfere && statusConfere;
    };

    this.filtros.valueChanges.subscribe((valores) => {
      this.dataSource.filter = JSON.stringify(valores);

      if (this.dataSource.paginator) {
        this.dataSource.paginator.firstPage();
      }
    });
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
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        titulo: 'Excluir equipamento',
        mensagem: `Tem certeza que deseja excluir o equipamento de patrimônio "${equipamento.patrimonio}"? Esta ação não pode ser desfeita.`,
        textoConfirmar: 'Excluir',
        textoCancelar: 'Cancelar',
      },
    });

    dialogRef.afterClosed().subscribe((confirmado: boolean) => {
      if (confirmado) {
        this.executarExclusao(equipamento);
      }
    });
  }

  private executarExclusao(equipamento: Equipamento): void {
    this.equipamentoService.delete(equipamento.id).subscribe({
      next: () => {
        this.dataSource.data = this.dataSource.data.filter((e) => e.id !== equipamento.id);
        this.sns.notificar('Equipamento removido com sucesso', 'sucesso');
      },
      error: (err) => {
        console.log(err);
        this.sns.notificar(err.message, 'erro');
      },
    });
  }
}