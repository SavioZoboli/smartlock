import { describe, it, expect } from 'vitest';
import {
  EquipamentoTransferivel,
  transferirItemParaDestino,
  transferirSelecionadosParaDestino,
  devolverItemParaOrigem,
} from './redirect-equipamento.util';

describe('redirect-equipamento.util', () => {
  const item1: EquipamentoTransferivel = {
    id: 1,
    patrimonio: '111111',
    tag: 'TAG1',
    tipo: 'Notebook',
    selecionado: false,
  };
  const item2: EquipamentoTransferivel = {
    id: 2,
    patrimonio: '222222',
    tag: 'TAG2',
    tipo: 'Tablet',
    selecionado: true,
  };
  const item3: EquipamentoTransferivel = {
    id: 3,
    patrimonio: '333333',
    tag: 'TAG3',
    tipo: 'Notebook',
    selecionado: true,
  };

  it('deve transferir um item individual para o destino desmarcando a seleção', () => {
    const res = transferirItemParaDestino([item1, item2], [], item1);

    expect(res.disponiveis.length).toBe(1);
    expect(res.disponiveis[0].id).toBe(2);
    expect(res.paraTransferir.length).toBe(1);
    expect(res.paraTransferir[0].id).toBe(1);
    expect(res.paraTransferir[0].selecionado).toBe(false);
  });

  it('deve transferir todos os itens selecionados para o destino', () => {
    const res = transferirSelecionadosParaDestino([item1, item2, item3], []);

    expect(res.disponiveis.length).toBe(1);
    expect(res.disponiveis[0].id).toBe(1);
    expect(res.paraTransferir.length).toBe(2);
    expect(res.paraTransferir.map((e) => e.id)).toEqual([2, 3]);
    expect(res.paraTransferir.every((e) => !e.selecionado)).toBe(true);
  });

  it('deve devolver um item do destino de volta para os disponíveis', () => {
    const res = devolverItemParaOrigem([item1], [item2], item2);

    expect(res.disponiveis.length).toBe(2);
    expect(res.disponiveis.map((e) => e.id)).toEqual([1, 2]);
    expect(res.paraTransferir.length).toBe(0);
  });
});

