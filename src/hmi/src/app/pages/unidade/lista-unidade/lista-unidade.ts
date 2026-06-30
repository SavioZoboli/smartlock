import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { UnidadeService } from '../../../services/unidade.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { MatDialog } from '@angular/material/dialog';
import { SystemNotificationService } from '../../../services/system-notification.service';

export interface Unidade {
  id: number;
  entidade: string;
  nome: string;
  regional: string;
}


@Component({
  selector: 'app-lista-unidade',
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './lista-unidade.html',
  styleUrl: './lista-unidade.scss',
})
export class ListaUnidade {
  // 2. Definição das colunas EXATAMENTE como no HTML
  displayedColumns: string[] = ['entidade', 'nome', 'regional', 'acoes'];

  // 3. DataSource do Material para gerenciar paginação e filtros automaticamente
  dataSource = new MatTableDataSource<Unidade>([]);

  // 4. Captura o Paginator do HTML
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private router: Router,
    private unidadeService: UnidadeService,
    private dialog:MatDialog,
    private sns:SystemNotificationService
  ) {}

  ngOnInit(): void {
    // Ponto de entrada para chamar seu serviço (ex: this.unidadeService.listar())
    this.carregarUnidades();
  }

  ngAfterViewInit(): void {
    // É obrigatório atrelar o paginator ao dataSource APÓS a view inicializar
    this.dataSource.paginator = this.paginator;
  }

  carregarUnidades(): void {
    this.unidadeService.listAll().subscribe({
      next: (res) => {
        this.dataSource.data = res;
      },
      error: (err) => {
        console.log(err)
        //this.dataSource.data = [];
      },
    })
  }

  // --- AÇÕES DA TELA ---

  onNovaUnidade(): void {
    // Redireciona para a rota onde está o formulário de criação
    // Ajuste o path conforme o seu app.routes.ts
    this.router.navigate(['/unidades/cadastro']);
  }

  onEditar(unidade: Unidade): void {
    // Redireciona para a rota de edição, passando o ID da unidade
    this.router.navigate(['/unidades/editar', unidade.id]);
  }

  onExcluir(unidade: Unidade): void {
    // 1. Abre o dialog passando os dados dinâmicos
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        titulo: 'Excluir Unidade',
        mensagem: `Tem certeza que deseja excluir a unidade "${unidade.nome}"? Esta ação não pode ser desfeita.`,
        textoConfirmar: 'Excluir',
        textoCancelar: 'Cancelar'
      }
    });

    // 2. Inscreve-se para aguardar a decisão do usuário
    dialogRef.afterClosed().subscribe((confirmado: boolean) => {
      if (confirmado) {
        this.executarExclusao(unidade);
      }
    });
  }
  private executarExclusao(unidade: Unidade): void {
    
    this.unidadeService.delete(unidade.id).subscribe({
      next: () => {
        // Atualiza a tabela removendo o item
        this.dataSource.data = this.dataSource.data.filter(u => u.id !== unidade.id);
        this.sns.notificar("Unidade removida com sucesso",'sucesso')
      },
      error: (err) => {
        // Opcional: mostrar um MatSnackBar de erro
        this.sns.notificar(err.message,'erro')
      }
    });
    
  }
}
