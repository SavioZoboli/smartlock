import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Reserva } from '../../../models/reserva.model';
import { ReportReservaLista } from '../../../reports/report-reserva-lista/report-reserva-lista';
import { ReportReservaCalendario } from '../../../reports/report-reserva-calendario/report-reserva-calendario';
import { ReservaService } from '../../../services/reserva.service';
import { ConfirmDeleteService } from '../../../services/confirm-delete.service';
import { normalizarTexto } from '../../../shared/util/normalizar-texto.util';

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
export class ListaReserva implements OnInit {
  modoVisualizacao: ModoVisualizacao = 'lista';

  private reservas = signal<any[]>([]);
  reservasFiltradas = signal<any[]>([]);

  filtros: FormGroup = new FormGroup({
    smartlock: new FormControl(''),
    unidade: new FormControl(''),
    situacao: new FormControl(''),
  });

  unidadesDisponiveis: string[] = [];
  situacoesDisponiveis: string[] = [];

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private router: Router,
    private reservaService: ReservaService,
    private confirmDelete: ConfirmDeleteService,
  ) {}

  ngOnInit(): void {
    this.filtros.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.aplicarFiltros();
      });

    this.carregarReservas();
  }

  carregarReservas(): void {
    this.reservaService.listAll().subscribe({
      next: (res: any) => {
        const lista = Array.isArray(res) ? res : [];
        this.reservas.set(lista);
        this.unidadesDisponiveis = [...new Set(lista.map((r: any) => r.unidade).filter(Boolean))].sort() as string[];
        this.situacoesDisponiveis = [...new Set(lista.map((r: any) => r.situacao).filter(Boolean))].sort() as string[];
        this.aplicarFiltros();
      },
      error: (err) => {
        console.error(err);
        this.reservas.set([]);
        this.reservasFiltradas.set([]);
      },
    });
  }

  private aplicarFiltros(): void {
    const { smartlock, unidade, situacao } = this.filtros.value;
    const termoSmartlock = normalizarTexto((smartlock || '').trim());

    const filtradas = this.reservas().filter((r: any) => {
      const apelido = r.smartlock || r.smartlock_apelido || '';
      const smartlockConfere = !termoSmartlock || normalizarTexto(apelido).includes(termoSmartlock);
      const unidadeConfere = !unidade || r.unidade === unidade;
      const situacaoConfere = !situacao || (r.situacao || '').toUpperCase() === situacao.toUpperCase();

      return smartlockConfere && unidadeConfere && situacaoConfere;
    });

    this.reservasFiltradas.set(filtradas);
  }

  limparFiltros(): void {
    this.filtros.reset({ smartlock: '', unidade: '', situacao: '' });
  }

  onNovaReserva(): void {
    this.router.navigate(['/reservas/cadastro']);
  }

  onEditarReserva(reserva: any): void {
    this.router.navigate(['/reservas/editar', reserva.id]);
  }

  onExcluirReserva(reserva: Reserva): void {
    const apelido = (reserva as any).smartlock || (reserva as any).smartlock_apelido || '';
    this.confirmDelete
      .confirmarEExcluir({
        titulo: 'Excluir reserva',
        mensagem: `Tem certeza que deseja excluir a reserva do smartlock "${apelido}"? Esta ação não pode ser desfeita.`,
        excluir$: this.reservaService.delete(reserva.id),
        mensagemSucesso: 'Reserva removida com sucesso',
      })
      .subscribe((excluido) => {
        if (excluido) {
          this.reservas.set(this.reservas().filter((r: any) => r.id !== reserva.id));
          this.aplicarFiltros();
        }
      });
  }
}