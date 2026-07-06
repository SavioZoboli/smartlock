import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
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
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { MatDialog } from '@angular/material/dialog';
import { SystemNotificationService } from '../../../services/system-notification.service';

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
  displayedColumns: string[] = [
    'apelido',
    'unidade',
    'regional',
    'status',
    'equipamentos',
    'acoes',
  ];

  dataSource = new MatTableDataSource<Smartlock>([]);

  // Filtros: apelido é texto livre, unidade e regional são selects
  // populados dinamicamente com os valores presentes na lista carregada.
  filtros: FormGroup = new FormGroup({
    apelido: new FormControl(''),
    unidade: new FormControl(''),
    regional: new FormControl(''),
    apenasOnline: new FormControl(false),
    apenasComEquipamentos: new FormControl(false),
  });

  unidadesDisponiveis: string[] = [];
  regionaisDisponiveis: string[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private router: Router,
    private smartlockService: SmartlockService,
    private dialog: MatDialog,
    private sns: SystemNotificationService,
  ) {}

  ngOnInit(): void {
    this.carregarSmartlocks();
    this.initFiltro();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  carregarSmartlocks(): void {
    this.smartlockService.listAll().subscribe({
      next: (res) => {

        console.log(res)

        this.dataSource.data = res;
        this.unidadesDisponiveis = [
          ...new Set(res.map((s: any) => s.unidade)),
        ].sort() as string[];
        this.regionaisDisponiveis = [
          ...new Set(res.map((s: any) => s.regional)),
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
    this.dataSource.filterPredicate = (data: Smartlock, filtro: string): boolean => {
      const { apelido, unidade, regional, apenasOnline, apenasComEquipamentos } =
        JSON.parse(filtro);

      const apelidoConfere = this.normalizarTexto(data.apelido).includes(
        this.normalizarTexto(apelido.trim()),
      );
      const unidadeConfere = !unidade || data.unidade === unidade;
      const regionalConfere = !regional || data.regional === regional;
      const onlineConfere = !apenasOnline || data.is_online;
      const equipamentosConfere = !apenasComEquipamentos || data.has_equipamentos;

      return (
        apelidoConfere &&
        unidadeConfere &&
        regionalConfere &&
        onlineConfere &&
        equipamentosConfere
      );
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
      apelido: '',
      unidade: '',
      regional: '',
      apenasOnline: false,
      apenasComEquipamentos: false,
    });
  }

  // --- AÇÕES DA TELA ---

  onNovoSmartlock(): void {
    this.router.navigate(['/smartlocks/cadastro']);
  }

  onEditar(smartlock: Smartlock): void {
    this.router.navigate(['/smartlocks/editar', smartlock.id]);
  }

  onExcluir(smartlock: Smartlock): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        titulo: 'Excluir smartlock',
        mensagem: `Tem certeza que deseja excluir o smartlock "${smartlock.apelido}"? Esta ação não pode ser desfeita.`,
        textoConfirmar: 'Excluir',
        textoCancelar: 'Cancelar',
      },
    });

    dialogRef.afterClosed().subscribe((confirmado: boolean) => {
      if (confirmado) {
        this.executarExclusao(smartlock);
      }
    });
  }

  private executarExclusao(smartlock: Smartlock): void {
    console.log(`Tentando excluir o smartlock ${smartlock.id}`);
    this.smartlockService.delete(smartlock.id).subscribe({
      next: () => {
        this.dataSource.data = this.dataSource.data.filter((s) => s.id !== smartlock.id);
        this.sns.notificar('Smartlock removido com sucesso', 'sucesso');
      },
      error: (err) => {
        console.log(err);
        this.sns.notificar(err.message, 'erro');
      },
    });
  }
}