export type TipoMovimento = 'emprestimo_manual' | 'devolucao_manual';

export interface EquipamentoMovimentacao {
  id: number;
  apelido: string;
  patrimonio: string;
  tipo: string;
  status_atual: 'DISPONIVEL' | 'EM USO' | string;
  emprestado_por?: number | null;
  selecionado?: boolean;
  icone?: string;
  pertenceReserva?: boolean;
  reservadoOutro?: boolean;
}

/**
 * Filtra equipamentos adequados ao tipo de movimentação:
 * - Empréstimo: equipamentos atualmente DISPONÍVEIS.
 * - Devolução: equipamentos atualmente EM USO (não disponíveis).
 */
export function filtrarEquipamentosPorMovimento(
  equipamentos: EquipamentoMovimentacao[],
  tipo: TipoMovimento | string | null | undefined,
): EquipamentoMovimentacao[] {
  if (!tipo || !equipamentos?.length) {
    return [];
  }

  if (tipo.includes('emprestimo')) {
    return equipamentos.filter((e) => e.status_atual === 'DISPONIVEL');
  }

  return equipamentos.filter((e) => e.status_atual !== 'DISPONIVEL');
}

/**
 * Retorna uma nova lista desmarcando a seleção de todos os equipamentos.
 */
export function desmarcarTodosEquipamentos(
  equipamentos: EquipamentoMovimentacao[],
): EquipamentoMovimentacao[] {
  return equipamentos.map((e) => (e.selecionado ? { ...e, selecionado: false } : e));
}

