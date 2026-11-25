import { describe, it, expect } from 'vitest';
import {
  EquipamentoMovimentacao,
  filtrarEquipamentosPorMovimento,
  desmarcarTodosEquipamentos,
} from './movimentacao.util';

describe('movimentacao.util', () => {
  const mockEquipamentos: EquipamentoMovimentacao[] = [
    {
      id: 1,
      apelido: 'Notebook Dell',
      patrimonio: 'PAT-001',
      tipo: 'Notebook',
      status_atual: 'DISPONIVEL',
      selecionado: true,
    },
    {
      id: 2,
      apelido: 'Projetor Epson',
      patrimonio: 'PAT-002',
      tipo: 'Projetor',
      status_atual: 'EM USO',
      selecionado: true,
    },
    {
      id: 3,
      apelido: 'Tablet iPad',
      patrimonio: 'PAT-003',
      tipo: 'Tablet',
      status_atual: 'DISPONIVEL',
      selecionado: false,
    },
  ];

  describe('filtrarEquipamentosPorMovimento', () => {
    it('deve retornar lista vazia se tipo for nulo, indefinido ou vazio', () => {
      expect(filtrarEquipamentosPorMovimento(mockEquipamentos, null)).toEqual([]);
      expect(filtrarEquipamentosPorMovimento(mockEquipamentos, undefined)).toEqual([]);
      expect(filtrarEquipamentosPorMovimento(mockEquipamentos, '')).toEqual([]);
    });

    it('deve retornar lista vazia se a lista de equipamentos estiver vazia', () => {
      expect(filtrarEquipamentosPorMovimento([], 'emprestimo_manual')).toEqual([]);
    });

    it('deve retornar apenas equipamentos DISPONIVEL quando o tipo for emprestimo_manual', () => {
      const resultado = filtrarEquipamentosPorMovimento(mockEquipamentos, 'emprestimo_manual');
      expect(resultado.map((e) => e.id)).toEqual([1, 3]);
      expect(resultado.every((e) => e.status_atual === 'DISPONIVEL')).toBe(true);
    });

    it('deve retornar apenas equipamentos não DISPONIVEL quando o tipo for devolucao_manual', () => {
      const resultado = filtrarEquipamentosPorMovimento(mockEquipamentos, 'devolucao_manual');
      expect(resultado.map((e) => e.id)).toEqual([2]);
      expect(resultado.every((e) => e.status_atual !== 'DISPONIVEL')).toBe(true);
    });
  });

  describe('desmarcarTodosEquipamentos', () => {
    it('deve retornar novos objetos com selecionado = false', () => {
      const resultado = desmarcarTodosEquipamentos(mockEquipamentos);
      expect(resultado.every((e) => e.selecionado === false)).toBe(true);
      expect(resultado[0].selecionado).toBe(false);
      expect(resultado[1].selecionado).toBe(false);
      expect(resultado[2].selecionado).toBe(false);
    });
  });
});

