import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { Reserva } from '../../../models/reserva.model';
import { ReportReservaLista } from '../../../reports/report-reserva-lista/report-reserva-lista';
import { ReportReservaCalendario } from '../../../reports/report-reserva-calendario/report-reserva-calendario';
import { ReservaService } from '../../../services/reserva.service';
import { ConfirmDeleteService } from '../../../services/confirm-delete.service';

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
  reservasFiltradas = signal<any>([]);

  filtros: FormGroup = new FormGroup({
    smartlock: new FormControl(''),
  });

  constructor(
    private router: Router,
    private reservaService: ReservaService,
    private confirmDelete: ConfirmDeleteService,
  ) {}

  ngOnInit(): void {
    this.carregarReservas();
    // Substituiu o antigo initFiltro() que só fazia isso — não tinha mais nada
    // ali dentro, então virou uma chamada direta.
    this.filtros.disable();
  }

  carregarReservas(): void {
    this.reservaService.listAll().subscribe({
      next: (res) => {
        this.reservas.set(res);
        this.reservasFiltradas.set(res);
      },
      error: (err) => {
        console.error(err);
        this.reservas.set([]);
        this.reservasFiltradas.set([]);
      },
    });
  }

  limparFiltros(): void {
    this.filtros.reset({ smartlock: '' });
  }

  onNovaReserva(): void {
    this.router.navigate(['/reservas/cadastro']);
  }

  onEditarReserva(reserva: any): void {
    this.router.navigate(['/reservas/editar', reserva.id]);
  }

  onExcluirReserva(reserva: Reserva): void {
    this.confirmDelete
      .confirmarEExcluir({
        titulo: 'Excluir reserva',
        mensagem: `Tem certeza que deseja excluir a reserva do smartlock "${(reserva as any).smartlock}"? Esta ação não pode ser desfeita.`,
        excluir$: this.reservaService.delete(reserva.id),
        mensagemSucesso: 'Reserva removida com sucesso',
      })
      .subscribe((excluido) => {
        if (excluido) {
          this.reservas.set(this.reservas().filter((r: any) => r.id !== reserva.id));
          this.reservasFiltradas.set(this.reservasFiltradas().filter((r: any) => r.id !== reserva.id));
        }
      });
  }
}