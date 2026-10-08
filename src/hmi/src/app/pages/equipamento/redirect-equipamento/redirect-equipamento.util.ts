export interface EquipamentoTransferivel {
  id: number;
  patrimonio: string;
  tag: string;
  tipo: string;
  selecionado?: boolean;
}

/**
 * Move um item individual da lista de disponíveis para a lista de destino.
 */
export function transferirItemParaDestino<T extends { id: number; selecionado?: boolean }>(
  disponiveis: T[],
  paraTransferir: T[],
  item: T,
): { disponiveis: T[]; paraTransferir: T[] } {
  return {
    disponiveis: disponiveis.filter((e) => e.id !== item.id),
    paraTransferir: [...paraTransferir, { ...item, selecionado: false }],
  };
}

/**
 * Move todos os itens marcados como selecionados para a lista de destino.
 */
export function transferirSelecionadosParaDestino<T extends { id: number; selecionado?: boolean }>(
  disponiveis: T[],
  paraTransferir: T[],
): { disponiveis: T[]; paraTransferir: T[] } {
  const selecionados = disponiveis
    .filter((e) => e.selecionado)
    .map((e) => ({ ...e, selecionado: false }));
  const restantes = disponiveis.filter((e) => !e.selecionado);

  return {
    disponiveis: restantes,
    paraTransferir: [...paraTransferir, ...selecionados],
  };
}

/**
 * Remove um item da lista de destino e o devolve para a lista de disponíveis.
 */
export function devolverItemParaOrigem<T extends { id: number; selecionado?: boolean }>(
  disponiveis: T[],
  paraTransferir: T[],
  item: T,
): { disponiveis: T[]; paraTransferir: T[] } {
  return {
    disponiveis: [...disponiveis, { ...item, selecionado: false }],
    paraTransferir: paraTransferir.filter((e) => e.id !== item.id),
  };
}

