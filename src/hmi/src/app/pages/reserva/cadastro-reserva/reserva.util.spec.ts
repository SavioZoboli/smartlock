import { describe, it, expect } from 'vitest';
import type { AbstractControl } from '@angular/forms';
import {
  periodoValidoValidator,
  isEquipamentoReservadoPorOutro,
  normalizarEquipamentoReservas,
  EquipamentoComReservas,
} from './reserva.util';

describe('reserva.util', () => {
  describe('periodoValidoValidator', () => {
    function criarMockControl(valores: Record<string, any>): AbstractControl {
      return {
        get: (field: string) => ({
          value: valores[field] ?? null,
        }),
      } as unknown as AbstractControl;
    }

    it('deve retornar null se algum campo estiver vazio', () => {
      const form = criarMockControl({
        data_emprestimo: new Date(),
        hora_emprestimo: '10:00',
        data_devolucao: null,
        hora_devolucao: '12:00',
      });
      expect(periodoValidoValidator(form)).toBeNull();
    });

    it('deve retornar null se formato de hora for inválido', () => {
      const form = criarMockControl({
        data_emprestimo: new Date(),
        hora_emprestimo: '99:99',
        data_devolucao: new Date(),
        hora_devolucao: '12:00',
      });
      expect(periodoValidoValidator(form)).toBeNull();
    });

    it('deve retornar null se data/hora de devolução for posterior ao empréstimo', () => {
      const inicio = new Date();
      inicio.setDate(inicio.getDate() + 1);
      const fim = new Date(inicio);

      const form = criarMockControl({
        data_emprestimo: inicio,
        hora_emprestimo: '10:00',
        data_devolucao: fim,
        hora_devolucao: '14:00',
      });
      expect(periodoValidoValidator(form)).toBeNull();
    });

    it('deve retornar { periodoInvalido: true } se devolução for anterior ao empréstimo', () => {
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);

      const form = criarMockControl({
        data_emprestimo: amanha,
        hora_emprestimo: '15:00',
        data_devolucao: amanha,
        hora_devolucao: '10:00',
      });
      expect(periodoValidoValidator(form)).toEqual({ periodoInvalido: true });
    });
  });

  describe('isEquipamentoReservadoPorOutro', () => {
    it('deve retornar false se o equipamento não possui reservas', () => {
      const equip: EquipamentoComReservas = {
        id: 1,
        apelido: 'Notebook',
        patrimonio: '123456',
        reservas: [],
      };
      expect(isEquipamentoReservadoPorOutro(equip, [])).toBe(false);
    });

    it('deve retornar false se o equipamento possui reservas mas pertence à reserva atual', () => {
      const equip: EquipamentoComReservas = {
        id: 2,
        apelido: 'Tablet',
        patrimonio: '654321',
        reservas: [
          {
            reserva_inicio: new Date(),
            reserva_fim: new Date(),
          },
        ],
      };
      expect(isEquipamentoReservadoPorOutro(equip, [2])).toBe(false);
    });

    it('deve retornar true se o equipamento possui reservas e não está na reserva atual', () => {
      const equip: EquipamentoComReservas = {
        id: 3,
        apelido: 'Projetor',
        patrimonio: '112233',
        reservas: [
          {
            reserva_inicio: new Date(),
            reserva_fim: new Date(),
          },
        ],
      };
      expect(isEquipamentoReservadoPorOutro(equip, [1, 2])).toBe(true);
    });
  });

  describe('normalizarEquipamentoReservas', () => {
    it('deve converter datas em string para Date', () => {
      const dataRaw = [
        {
          id: 1,
          apelido: 'Mouse',
          patrimonio: '998877',
          reservas: [
            {
              reserva_inicio: '2026-10-10T10:00:00Z',
              reserva_fim: '2026-10-10T12:00:00Z',
            },
          ],
        },
      ];

      const resultado = normalizarEquipamentoReservas(dataRaw);
      expect(resultado[0].reservas[0].reserva_inicio).toBeInstanceOf(Date);
      expect(resultado[0].reservas[0].reserva_fim).toBeInstanceOf(Date);
    });

    it('deve manter lista vazia se não houver reservas', () => {
      const dataRaw = [{ id: 1, apelido: 'Cabo', patrimonio: '111111', reservas: [] }];
      const resultado = normalizarEquipamentoReservas(dataRaw);
      expect(resultado[0].reservas).toEqual([]);
    });
  });
});

