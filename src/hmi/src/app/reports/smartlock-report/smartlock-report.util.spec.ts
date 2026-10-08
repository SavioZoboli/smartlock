import { describe, it, expect } from 'vitest';
import { ItemRelatorioSmartlock } from './smartlock-report.model';
import {
  agruparEquipamentosPorSmartlock,
  checarStatusDisponibilidade,
} from './smartlock-report.util';

describe('smartlock-report.util', () => {
  describe('checarStatusDisponibilidade', () => {
    it('deve retornar true para "todos" independentemente do status', () => {
      expect(checarStatusDisponibilidade(true, 'todos')).toBe(true);
      expect(checarStatusDisponibilidade(false, 'todos')).toBe(true);
    });

    it('deve validar "disponiveis" corretamente', () => {
      expect(checarStatusDisponibilidade(true, 'disponiveis')).toBe(true);
      expect(checarStatusDisponibilidade(false, 'disponiveis')).toBe(false);
    });

    it('deve validar "emprestados" corretamente', () => {
      expect(checarStatusDisponibilidade(false, 'emprestados')).toBe(true);
      expect(checarStatusDisponibilidade(true, 'emprestados')).toBe(false);
    });
  });

  describe('agruparEquipamentosPorSmartlock', () => {
    const itensMock: ItemRelatorioSmartlock[] = [
      {
        id: 1,
        patrimonio: '111111',
        tipo: 'Notebook',
        disponivel: true,
        smartlockId: 10,
        smartlockApelido: 'Armário B',
      },
      {
        id: 2,
        patrimonio: '222222',
        tipo: 'Tablet',
        disponivel: false,
        smartlockId: 10,
        smartlockApelido: 'Armário B',
      },
      {
        id: 3,
        patrimonio: '333333',
        tipo: 'Notebook',
        disponivel: true,
        smartlockId: 5,
        smartlockApelido: 'Armário A',
      },
    ];

    it('deve agrupar por smartlock e ordenar alfabeticamente', () => {
      const grupos = agruparEquipamentosPorSmartlock(itensMock, null, 'todos');
      expect(grupos.length).toBe(2);
      expect(grupos[0].smartlockApelido).toBe('Armário A');
      expect(grupos[0].itens.length).toBe(1);
      expect(grupos[1].smartlockApelido).toBe('Armário B');
      expect(grupos[1].itens.length).toBe(2);
    });

    it('deve filtrar por smartlock específica', () => {
      const grupos = agruparEquipamentosPorSmartlock(itensMock, 5, 'todos');
      expect(grupos.length).toBe(1);
      expect(grupos[0].smartlockId).toBe(5);
      expect(grupos[0].itens[0].id).toBe(3);
    });

    it('deve filtrar por status de disponibilidade', () => {
      const gruposDisponiveis = agruparEquipamentosPorSmartlock(itensMock, null, 'disponiveis');
      expect(gruposDisponiveis.length).toBe(2);
      expect(gruposDisponiveis.find((g) => g.smartlockId === 10)?.itens.length).toBe(1);

      const gruposEmprestados = agruparEquipamentosPorSmartlock(itensMock, null, 'emprestados');
      expect(gruposEmprestados.length).toBe(1);
      expect(gruposEmprestados[0].smartlockId).toBe(10);
      expect(gruposEmprestados[0].itens[0].id).toBe(2);
    });
  });
});
