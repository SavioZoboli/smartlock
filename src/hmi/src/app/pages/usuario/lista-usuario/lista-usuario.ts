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
import { UsuarioService } from '../../../services/usuario.service';
import { ConfirmDeleteService } from '../../../services/confirm-delete.service';
import { normalizarTexto } from '../../../shared/util/normalizar-texto.util';
import { sincronizarFiltroTabela } from '../../../shared/util/tabela-filtro.util';

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
  displayedColumns: string[] = ['nome', 'email', 'unidade', 'regional', 'acoes'];
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

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private router: Router,
    private usuarioService: UsuarioService,
    private confirmDelete: ConfirmDeleteService,
  ) {}

  ngOnInit(): void {
    this.carregarUsuarios();
    this.initFiltro();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  carregarUsuarios(): void {
    this.usuarioService.listAll().subscribe({
      next: (res: any) => {
        this.dataSource.data = res;
        this.unidadesDisponiveis = [...new Set(res.map((u: any) => u.unidade))].sort() as string[];
        this.regionaisDisponiveis = [...new Set(res.map((u: any) => u.regional))].sort() as string[];
      },
    });
  }

  private readonly destroyRef = inject(DestroyRef);

  private initFiltro(): void {
    sincronizarFiltroTabela(
      this.dataSource,
      this.filtros,
      (data: Usuario, filtro: any) => {
        const nomeConfere = normalizarTexto(data.nome).includes(
          normalizarTexto((filtro.nome || '').trim()),
        );
        const unidadeConfere = !filtro.unidade || data.unidade === filtro.unidade;
        const regionalConfere = !filtro.regional || data.regional === filtro.regional;

        return nomeConfere && unidadeConfere && regionalConfere;
      },
      this.destroyRef,
    );
  }

  limparFiltros(): void {
    this.filtros.reset({ nome: '', unidade: '', regional: '' });
  }

  onNovoUsuario(): void {
    this.router.navigate(['/usuarios/cadastro']);
  }

  onEditar(usuario: Usuario): void {
    this.router.navigate(['/usuarios/editar', usuario.id]);
  }

  onExcluir(usuario: Usuario): void {
    this.confirmDelete
      .confirmarEExcluir({
        titulo: 'Excluir usuario',
        mensagem: `Tem certeza que deseja excluir o usuario "${usuario.nome}"? Esta ação não pode ser desfeita.`,
        excluir$: this.usuarioService.delete(usuario.id),
        mensagemSucesso: 'Usuario removido com sucesso',
      })
      .subscribe((excluido) => {
        if (excluido) {
          this.dataSource.data = this.dataSource.data.filter((u) => u.id !== usuario.id);
        }
      });
  }
}