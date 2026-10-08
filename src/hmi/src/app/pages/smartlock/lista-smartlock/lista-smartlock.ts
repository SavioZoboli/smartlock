import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { SmartlockService } from '../../../services/smartlock.service';
import { ConfirmDeleteService } from '../../../services/confirm-delete.service';
import { normalizarTexto } from '../../../shared/util/normalizar-texto.util';
import { sincronizarFiltroTabela } from '../../../shared/util/tabela-filtro.util';

export interface Smartlock {
  id: number;
  mac_address: string;
  apelido: string;
  unidade_id: number;
  unidade: string;
  regional: string;
  is_online: boolean;
  has_equipamentos: boolean;
}

@Component({
  selector: 'app-lista-smartlock',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './lista-smartlock.html',
  styleUrl: './lista-smartlock.scss',
})
export class ListaSmartlock {
  displayedColumns: string[] = ['apelido', 'mac', 'unidade', 'regional', 'status', 'equipamentos', 'acoes'];

  dataSource = new MatTableDataSource<Smartlock>([]);

  // Filtros: apelido é texto livre, unidade e regional são selects
  // populados dinamicamente com os valores presentes na lista carregada.
  filtros: FormGroup = new FormGroup({
    apelido: new FormControl(''),
    unidade: new FormControl(''),
    regional: new FormControl(''),
    apenasOnline: new FormControl(false),
    provisionando: new FormControl(false),
    apenasComEquipamentos: new FormControl(false),
  });

  unidadesDisponiveis: string[] = [];
  regionaisDisponiveis: string[] = [];

  private readonly destroyRef = inject(DestroyRef);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private router: Router,
    private smartlockService: SmartlockService,
    private confirmDelete: ConfirmDeleteService,
  ) {}

  ngOnInit(): void {
    this.carregarSmartlocks();
    this.initFiltro();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  carregarSmartlocks(): void {
    // TODO: mesmo ponto de atenção da lista-unidade — este `any` esconde que o
    // shape real (com unidade/regional resolvidos) difere de ISmartlock puro.
    this.smartlockService.listAll().subscribe({
      next: (res: any) => {
        this.dataSource.data = res;
        this.unidadesDisponiveis = [...new Set(res.map((s: any) => s.unidade))].sort() as string[];
        this.regionaisDisponiveis = [...new Set(res.map((s: any) => s.regional))].sort() as string[];
      },
    });
  }

  private initFiltro(): void {
    sincronizarFiltroTabela(
      this.dataSource,
      this.filtros,
      (data: Smartlock, filtro: any) => {
        const apelidoConfere = normalizarTexto(data.apelido).includes(
          normalizarTexto((filtro.apelido || '').trim()),
        );
        const unidadeConfere = !filtro.unidade || data.unidade === filtro.unidade;
        const regionalConfere = !filtro.regional || data.regional === filtro.regional;
        const onlineConfere = !filtro.apenasOnline || data.is_online;
        const provisionandoConfere = !filtro.provisionando || data.unidade != '';
        const equipamentosConfere = !filtro.apenasComEquipamentos || data.has_equipamentos;

        return (
          apelidoConfere &&
          unidadeConfere &&
          regionalConfere &&
          onlineConfere &&
          provisionandoConfere &&
          equipamentosConfere
        );
      },
      this.destroyRef,
    );
  }

  limparFiltros(): void {
    this.filtros.reset({
      apelido: '',
      unidade: '',
      regional: '',
      apenasOnline: false,
      apenasComEquipamentos: false,
    });
  }

  onNovoSmartlock(): void {
    this.router.navigate(['/smartlocks/cadastro']);
  }

  onEditar(smartlock: Smartlock): void {
    this.router.navigate(['/smartlocks/editar', smartlock.id]);
  }

  onExcluir(smartlock: Smartlock): void {
    this.confirmDelete
      .confirmarEExcluir({
        titulo: 'Excluir smartlock',
        mensagem: `Tem certeza que deseja excluir o smartlock "${smartlock.apelido}"? Esta ação não pode ser desfeita.`,
        excluir$: this.smartlockService.delete(smartlock.id),
        mensagemSucesso: 'Smartlock removido com sucesso',
      })
      .subscribe((excluido) => {
        if (excluido) {
          this.dataSource.data = this.dataSource.data.filter((s) => s.id !== smartlock.id);
        }
      });
  }
}