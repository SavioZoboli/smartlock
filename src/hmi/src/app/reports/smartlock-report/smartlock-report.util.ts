import {
  GrupoSmartlock,
  ItemRelatorioSmartlock,
  StatusFiltroDisponibilidade,
} from './smartlock-report.model';

/**
 * Valida se a disponibilidade do item atende ao filtro de status selecionado.
 */
export function checarStatusDisponibilidade(
  disponivel: boolean,
  status: StatusFiltroDisponibilidade | string,
): boolean {
  if (status === 'todos') {
    return true;
  }
  if (status === 'disponiveis' && disponivel) {
    return true;
  }
  if (status === 'emprestados' && !disponivel) {
    return true;
  }
  return false;
}

/**
 * Filtra e agrupa equipamentos por Smartlock, ordenando alfabeticamente pelo apelido da Smartlock.
 *
 * @param itens Lista de equipamentos retornados do relatório.
 * @param smartlockFiltroId ID opcional da Smartlock para restringir o resultado.
 * @param status Status de disponibilidade ('todos' | 'disponiveis' | 'emprestados').
 */
export function agruparEquipamentosPorSmartlock(
  itens: ItemRelatorioSmartlock[],
  smartlockFiltroId?: number | null,
  status: StatusFiltroDisponibilidade | string = 'todos',
): GrupoSmartlock[] {
  const itensFiltrados = itens.filter((item) => {
    const atendeSmartlock = smartlockFiltroId ? item.smartlockId === smartlockFiltroId : true;
    const atendeStatus = checarStatusDisponibilidade(item.disponivel, status);
    return atendeSmartlock && atendeStatus;
  });

  const mapa = new Map<number, GrupoSmartlock>();
  for (const item of itensFiltrados) {
    const grupo = mapa.get(item.smartlockId) ?? {
      smartlockId: item.smartlockId,
      smartlockApelido: item.smartlockApelido,
      itens: [],
    };
    grupo.itens.push(item);
    mapa.set(item.smartlockId, grupo);
  }

  return Array.from(mapa.values()).sort((a, b) =>
    a.smartlockApelido.localeCompare(b.smartlockApelido),
  );
}

