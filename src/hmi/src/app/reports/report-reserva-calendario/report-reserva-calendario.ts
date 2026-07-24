import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Reserva } from '../../models/reserva.model';

interface DiaCalendario {
  data: Date;
  numero: number;
  foraDoMes: boolean;
  hoje: boolean;
  reservas: any[];
}

@Component({
  selector: 'app-report-reserva-calendario',
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './report-reserva-calendario.html',
  styleUrl: './report-reserva-calendario.scss',
})
export class ReportReservaCalendario {
  private _reservas: any = [];

  @Input()
  set reservas(value: any) {
    this._reservas = value ?? [];
    this.gerarDias();
  }
  
  get reservas(): any {
    return this._reservas;
  }

  // Navega direto para a edição da reserva — sem modal, sem expandir a célula.
  @Output() selecionarReserva = new EventEmitter<Reserva>();

  mesReferencia = new Date();
  dias: DiaCalendario[] = [];

  readonly nomesDiasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  ngOnInit(): void {
    this.gerarDias();
  }

  get labelMes(): string {
    return this.mesReferencia.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }

  mesAnterior(): void {
    this.mesReferencia = new Date(this.mesReferencia.getFullYear(), this.mesReferencia.getMonth() - 1, 1);
    this.gerarDias();
  }

  mesSeguinte(): void {
    this.mesReferencia = new Date(this.mesReferencia.getFullYear(), this.mesReferencia.getMonth() + 1, 1);
    this.gerarDias();
  }

  mesAtual(): void {
    this.mesReferencia = new Date();
    this.gerarDias();
  }

  onClickReserva(reserva: any, event: Event): void {
    event.stopPropagation();
    this.selecionarReserva.emit(reserva);
  }

  // Monta a grade de semanas completas (dom-sáb) cobrindo o mês de referência,
  // incluindo dias de meses vizinhos para fechar as linhas.
  private gerarDias(): void {
    const ano = this.mesReferencia.getFullYear();
    const mes = this.mesReferencia.getMonth();

    const primeiroDiaMes = new Date(ano, mes, 1);
    const ultimoDiaMes = new Date(ano, mes + 1, 0);

    const inicioGrade = new Date(primeiroDiaMes);
    inicioGrade.setDate(inicioGrade.getDate() - inicioGrade.getDay());

    const fimGrade = new Date(ultimoDiaMes);
    fimGrade.setDate(fimGrade.getDate() + (6 - fimGrade.getDay()));

    const hoje = new Date();
    const dias: DiaCalendario[] = [];

    for (const d = new Date(inicioGrade); d <= fimGrade; d.setDate(d.getDate() + 1)) {
      const diaAtual = new Date(d);
      dias.push({
        data: diaAtual,
        numero: diaAtual.getDate(),
        foraDoMes: diaAtual.getMonth() !== mes,
        hoje: this.mesmoDia(diaAtual, hoje),
        reservas: this.reservasDoDia(diaAtual),
      });
    }

    this.dias = dias;
  }

  private mesmoDia(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  private reservasDoDia(dia: Date): Reserva[] {
    return this.reservas
      .filter((r:any) => this.mesmoDia(new Date(r.reserva_inicio), dia))
      .sort((a:any, b:any) => new Date(a.reserva_inicio).getTime() - new Date(b.reserva_inicio).getTime());
  }
}