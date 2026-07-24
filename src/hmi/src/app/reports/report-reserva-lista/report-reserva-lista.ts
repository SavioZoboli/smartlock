import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Reserva } from '../../models/reserva.model';

@Component({
  selector: 'app-report-reserva-lista',
  imports: [CommonModule, MatTableModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './report-reserva-lista.html',
  styleUrl: './report-reserva-lista.scss',
})
export class ReportReservaLista {
  private _reservas: Reserva[] = [];

  @Input()
  set reservas(value: Reserva[]) {
    this._reservas = value ?? [];
    this.linhaExpandida = null;
  }
  get reservas(): Reserva[] {
    return this._reservas;
  }

  @Output() editar = new EventEmitter<Reserva>();
  @Output() excluir = new EventEmitter<Reserva>();

  // Coluna "detalhe" é renderizada em uma segunda <tr> (multiTemplateDataRows),
  // por isso não entra em displayedColumns.
  displayedColumns: string[] = ['data_hora', 'smartlock', 'unidade', 'equipamentos','situacao', 'acoes'];

  linhaExpandida: Reserva | null = null;

  toggleExpandir(reserva: Reserva): void {
    this.linhaExpandida = this.linhaExpandida === reserva ? null : reserva;
  }

  onEditar(reserva: Reserva, event: Event): void {
    event.stopPropagation();
    this.editar.emit(reserva);
  }

  onExcluir(reserva: Reserva, event: Event): void {
    event.stopPropagation();
    this.excluir.emit(reserva);
  }
}