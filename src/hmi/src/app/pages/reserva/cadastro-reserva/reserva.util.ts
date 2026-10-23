import { AbstractControl, ValidationErrors } from '@angular/forms';
import { HORA_PATTERN, combinarDataHora } from '../../../shared/util/data-hora.util';

export interface ReservaItemEquipamento {
  id?: number;
  reserva_inicio: Date;
  reserva_fim: Date;
  usuario?: {
    nome?: string;
    sobrenome?: string;
  };
  [key: string]: any;
}

export interface EquipamentoComReservas {
  id: number;
  apelido: string;
  patrimonio: string;
  reservas: ReservaItemEquipamento[];
  [key: string]: any;
}

/**
 * Só valida a ordem cronológica quando os 4 campos já têm valor —
 * evita marcar erro antes do usuário terminar de preencher o período.
 */
export function periodoValidoValidator(group: AbstractControl): ValidationErrors | null {
  const dataEmprestimo = group.get('data_emprestimo')?.value;
  const horaEmprestimo = group.get('hora_emprestimo')?.value;
  const dataDevolucao = group.get('data_devolucao')?.value;
  const horaDevolucao = group.get('hora_devolucao')?.value;

  if (!dataEmprestimo || !horaEmprestimo || !dataDevolucao || !horaDevolucao) {
    return null;
  }

  if (!HORA_PATTERN.test(horaEmprestimo) || !HORA_PATTERN.test(horaDevolucao)) {
    return null;
  }

  const inicio = combinarDataHora(dataEmprestimo, horaEmprestimo);
  const fim = combinarDataHora(dataDevolucao, horaDevolucao);
  const agora = new Date();

  return fim > inicio ? null : fim < agora || inicio < agora ? null : { periodoInvalido: true };
}

/**
 * Checa se um equipamento está com reserva ativa pertencente a outro usuário/reserva.
 */
export function isEquipamentoReservadoPorOutro(
  equipamento: EquipamentoComReservas,
  equipamentosDaReservaAtual: number[],
): boolean {
  return (
    (equipamento.reservas?.length ?? 0) > 0 &&
    !equipamentosDaReservaAtual.includes(equipamento.id)
  );
}

/**
 * Normaliza as datas de início e fim das reservas de cada equipamento para instâncias de Date.
 */
export function normalizarEquipamentoReservas(equipamentos: any[]): EquipamentoComReservas[] {
  return (equipamentos ?? []).map((e) => {
    if (!e.reservas || e.reservas.length === 0) {
      return { ...e, reservas: [] };
    }
    return {
      ...e,
      reservas: e.reservas.map((r: any) => ({
        ...r,
        reserva_inicio: r.reserva_inicio instanceof Date ? r.reserva_inicio : new Date(r.reserva_inicio),
        reserva_fim: r.reserva_fim instanceof Date ? r.reserva_fim : new Date(r.reserva_fim),
      })),
    };
  });
}

