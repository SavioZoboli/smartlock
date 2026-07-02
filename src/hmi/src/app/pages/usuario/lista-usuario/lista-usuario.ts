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
import { UsuarioService } from '../../../services/usuario.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { MatDialog } from '@angular/material/dialog';
import { SystemNotificationService } from '../../../services/system-notification.service';

export interface Usuario {
  id: number;
  nome: string;
  sobrenome: string;
  email: string;
  unidade: string;
  regional: string;
}

@Component({
  selector: 'app-lista-usuario',
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
  templateUrl: './lista-usuario.html',
  styleUrl: './lista-usuario.scss',
})
export class ListaUsuario {
  // 2. Definição das colunas EXATAMENTE como no HTML
  displayedColumns: string[] = ['nome', 'email', 'unidade', 'regional', 'acoes'];

  // 3. DataSource do Material para gerenciar paginação e filtros automaticamente
  dataSource = new MatTableDataSource<Usuario>([]);

  // Filtros: nome é texto livre, unidade e regional são selects
  // populados dinamicamente com os valores presentes na lista carregada.
  filtros: FormGroup = new FormGroup({
    nome: new FormControl(''),
    unidade: new FormControl(''),
    regional: new FormControl(''),
  });

  unidadesDisponiveis: string[] = [];
  regionaisDisponiveis: string[] = [];

  // 4. Captura o Paginator do HTML
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private router: Router,
    private usuarioService: UsuarioService,
    private dialog: MatDialog,
    private sns: SystemNotificationService,
  ) {}

  ngOnInit(): void {
    // Ponto de entrada para chamar seu serviço (ex: this.usuarioService.listar())
    this.carregarusuarios();
    this.initFiltro();
  }

  ngAfterViewInit(): void {
    // É obrigatório atrelar o paginator ao dataSource APÓS a view inicializar
    this.dataSource.paginator = this.paginator;
  }

  carregarusuarios(): void {
    this.usuarioService.listAll().subscribe({
      next: (res) => {
        this.dataSource.data = res;
        this.unidadesDisponiveis = [...new Set(res.map((u: any) => u.unidade))].sort() as string[];
        this.regionaisDisponiveis = [
          ...new Set(res.map((u: any) => u.regional)),
        ].sort() as string[];
      },
      error: (err) => {
        console.log(err);
        //this.dataSource.data = [];
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
    this.dataSource.filterPredicate = (data: Usuario, filtro: string): boolean => {
      const { nome, unidade, regional } = JSON.parse(filtro);

      const nomeConfere = this.normalizarTexto(data.nome).includes(
        this.normalizarTexto(nome.trim()),
      );
      const unidadeConfere = !unidade || data.unidade === unidade;
      const regionalConfere = !regional || data.regional === regional;

      return nomeConfere && unidadeConfere && regionalConfere;
    };

    this.filtros.valueChanges.subscribe((valores) => {
      this.dataSource.filter = JSON.stringify(valores);

      if (this.dataSource.paginator) {
        this.dataSource.paginator.firstPage();
      }
    });
  }

  limparFiltros(): void {
    this.filtros.reset({ nome: '', unidade: '', regional: '' });
  }

  // --- AÇÕES DA TELA ---

  onNovoUsuario(): void {
    // Redireciona para a rota onde está o formulário de criação
    // Ajuste o path conforme o seu app.routes.ts
    this.router.navigate(['/usuarios/cadastro']);
  }

  onEditar(usuario: Usuario): void {
    // Redireciona para a rota de edição, passando o ID da usuario
    this.router.navigate(['/usuarios/editar', usuario.id]);
  }

  onExcluir(usuario: Usuario): void {
    // 1. Abre o dialog passando os dados dinâmicos
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        titulo: 'Excluir usuario',
        mensagem: `Tem certeza que deseja excluir o usuario "${usuario.nome}"? Esta ação não pode ser desfeita.`,
        textoConfirmar: 'Excluir',
        textoCancelar: 'Cancelar',
      },
    });

    // 2. Inscreve-se para aguardar a decisão do usuário
    dialogRef.afterClosed().subscribe((confirmado: boolean) => {
      if (confirmado) {
        this.executarExclusao(usuario);
      }
    });
  }
  private executarExclusao(usuario: Usuario): void {
    console.log(`Tentando excluir o usuário ${usuario.id}`);
    this.usuarioService.delete(usuario.id).subscribe({
      next: () => {
        // Atualiza a tabela removendo o item
        this.dataSource.data = this.dataSource.data.filter((u) => u.id !== usuario.id);
        this.sns.notificar('Usuario removido com sucesso', 'sucesso');
      },
      error: (err) => {
        console.log(err);
        // Opcional: mostrar um MatSnackBar de erro
        this.sns.notificar(err.message, 'erro');
      },
    });
  }
}
