import { describe, it, expect } from 'vitest';
import { displayPorCampo, displayUnidadeComRegional } from './autocomplete-display.util';

describe('autocomplete-display.util', () => {
  describe('displayPorCampo', () => {
    it('deve retornar string vazia para valores nulos ou indefinidos', () => {
      const displayApelido = displayPorCampo<{ apelido: string }>('apelido');
      expect(displayApelido(null)).toBe('');
      expect(displayApelido(undefined)).toBe('');
    });

    it('deve retornar o próprio texto se o valor for string', () => {
      const displayApelido = displayPorCampo<{ apelido: string }>('apelido');
      expect(displayApelido('Texto digitado')).toBe('Texto digitado');
    });

    it('deve retornar a propriedade especificada quando o valor for um objeto', () => {
      const displayApelido = displayPorCampo<{ apelido: string }>('apelido');
      expect(displayApelido({ apelido: 'Armário A' })).toBe('Armário A');
    });
  });

  describe('displayUnidadeComRegional', () => {
    it('deve retornar string vazia para null ou undefined', () => {
      expect(displayUnidadeComRegional(null)).toBe('');
      expect(displayUnidadeComRegional(undefined)).toBe('');
    });

    it('deve retornar o próprio texto quando for string', () => {
      expect(displayUnidadeComRegional('Texto livre')).toBe('Texto livre');
    });

    it('deve formatar como "nome / regional" quando ambos existirem', () => {
      expect(displayUnidadeComRegional({ nome: 'Matriz', regional: 'Sul' })).toBe('Matriz / Sul');
    });

    it('deve retornar apenas o nome quando regional não existir', () => {
      expect(displayUnidadeComRegional({ nome: 'Filial 1' })).toBe('Filial 1');
    });
  });
});

