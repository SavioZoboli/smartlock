import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { Reserva } from '../../../models/reserva.model';
import { SystemNotificationService } from '../../../services/system-notification.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { ReportReservaLista } from '../../../reports/report-reserva-lista/report-reserva-lista';
import { ReportReservaCalendario } from '../../../reports/report-reserva-calendario/report-reserva-calendario';
import { ReservaService } from '../../../services/reserva.service';

type ModoVisualizacao = 'lista' | 'calendario';

@Component({
  selector: 'app-lista-reserva',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReportReservaLista,
    ReportReservaCalendario,
  ],
  templateUrl: './lista-reserva.html',
  styleUrl: './lista-reserva.scss',
})
export class ListaReserva {
  modoVisualizacao: ModoVisualizacao = 'lista';

  private reservas = signal<any>([]);
  reservasFiltradas= signal<any>([]);

  filtros: FormGroup = new FormGroup({
    smartlock: new FormControl(''),
    unidade: new FormControl(''),
    regional: new FormControl(''),
  });

  unidadesDisponiveis: string[] = [];
  regionaisDisponiveis: string[] = [];

  constructor(
    private router: Router,
    private reservaService: ReservaService,
    private dialog: MatDialog,
    private sns: SystemNotificationService,
  ) {}

  ngOnInit(): void {
    this.carregarReservas();
    this.initFiltro();
  }

  carregarReservas(): void {
    this.reservaService.listAll().subscribe({
      next: (res) => {
        console.log(res)
        this.reservas.set(res);
        this.reservasFiltradas.set(res);
      },
      error: (err) => {
        console.log(err);
        this.reservas.set([]);
        this.reservasFiltradas.set([]);
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
    this.filtros.valueChanges.subscribe((valores) => {
      const { smartlock, unidade, regional } = valores;

      this.reservasFiltradas = this.reservas().filter((r:any) => {
        const smartlockConfere = this.normalizarTexto(r.smartlock_apelido).includes(
          this.normalizarTexto((smartlock ?? '').trim()),
        );
        const unidadeConfere = !unidade || r.unidade === unidade;
        const regionalConfere = !regional || r.regional === regional;

        return smartlockConfere && unidadeConfere && regionalConfere;
      });
    });
  }

  limparFiltros(): void {
    this.filtros.reset({ smartlock: '', unidade: '', regional: '' });
  }

  // --- AÇÕES DA TELA ---

  onNovaReserva(): void {
    this.router.navigate(['/reservas/cadastro']);
  }

  onEditarReserva(reserva: Reserva): void {
    this.router.navigate(['/reservas/editar', reserva.id]);
  }

  onExcluirReserva(reserva: Reserva): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        titulo: 'Excluir reserva',
        mensagem: `Tem certeza que deseja excluir a reserva do smartlock "${reserva.smartlock_apelido}"? Esta ação não pode ser desfeita.`,
        textoConfirmar: 'Excluir',
        textoCancelar: 'Cancelar',
      },
    });

    dialogRef.afterClosed().subscribe((confirmado: boolean) => {
      if (confirmado) {
        this.executarExclusao(reserva);
      }
    });
  }

  private executarExclusao(reserva: Reserva): void {
    this.reservaService.delete(reserva.id).subscribe({
      next: () => {
        this.reservas = this.reservas().filter((r:any) => r.id !== reserva.id);
        this.reservasFiltradas = this.reservasFiltradas().filter((r:any) => r.id !== reserva.id);
        this.sns.notificar('Reserva removida com sucesso', 'sucesso');
      },
      error: (err) => {
        console.log(err);
        this.sns.notificar(err.message, 'erro');
      },
    });
  }
}