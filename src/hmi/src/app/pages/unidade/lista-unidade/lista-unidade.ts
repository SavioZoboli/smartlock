import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { UnidadeService } from '../../../services/unidade.service';
import { ConfirmDeleteService } from '../../../services/confirm-delete.service';

// TODO: a IUnidade (model puro) não tem `regional` — este endpoint claramente
// devolve mais que o model. Ajustar quando confirmar o DTO real do backend.
export interface Unidade {
  id: number;
  entidade: string;
  nome: string;
  regional: string;
}

@Component({
  selector: 'app-lista-unidade',
  imports: [CommonModule, MatTableModule, MatPaginatorModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './lista-unidade.html',
  styleUrl: './lista-unidade.scss',
})
export class ListaUnidade {
  displayedColumns: string[] = ['entidade', 'nome', 'regional', 'acoes'];
  dataSource = new MatTableDataSource<Unidade>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private router: Router,
    private unidadeService: UnidadeService,
    private confirmDelete: ConfirmDeleteService,
  ) {}

  ngOnInit(): void {
    this.carregarUnidades();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  carregarUnidades(): void {
    this.unidadeService.listAll().subscribe({
      next: (res) => {
        this.dataSource.data = res as unknown as Unidade[];
      },
    });
  }

  onNovaUnidade(): void {
    this.router.navigate(['/unidades/cadastro']);
  }

  onEditar(unidade: Unidade): void {
    this.router.navigate(['/unidades/editar', unidade.id]);
  }

  onExcluir(unidade: Unidade): void {
    this.confirmDelete
      .confirmarEExcluir({
        titulo: 'Excluir Unidade',
        mensagem: `Tem certeza que deseja excluir a unidade "${unidade.nome}"? Esta ação não pode ser desfeita.`,
        excluir$: this.unidadeService.delete(unidade.id),
        mensagemSucesso: 'Unidade removida com sucesso',
      })
      .subscribe((excluido) => {
        if (excluido) {
          this.dataSource.data = this.dataSource.data.filter((u) => u.id !== unidade.id);
        }
      });
  }
}