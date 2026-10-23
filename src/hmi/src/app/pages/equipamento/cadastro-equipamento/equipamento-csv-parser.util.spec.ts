import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { FormControl, FormGroup, FormArray } from '@angular/forms';
import {
  parseEquipamentosCsv,
  marcarPatrimoniosDuplicados,
} from './equipamento-csv-parser.util';

describe('equipamento-csv-parser.util', () => {
  describe('parseEquipamentosCsv', () => {
    it('deve retornar lista vazia se o conteúdo for vazio', () => {
      expect(parseEquipamentosCsv('')).toEqual([]);
    });

    it('deve processar CSV separado por vírgula ignorando cabeçalho', () => {
      const csv = `TAG,PATRIMONIO\nTAG1,123456\nTAG2,654321`;
      const itens = parseEquipamentosCsv(csv, 'Notebook');

      expect(itens.length).toBe(2);
      expect(itens[0]).toEqual({
        tag: 'TAG1',
        patrimonio: '123456',
        tipo: 'Notebook',
        apelido: '',
      });
      expect(itens[1]).toEqual({
        tag: 'TAG2',
        patrimonio: '654321',
        tipo: 'Notebook',
        apelido: '',
      });
    });

    it('deve processar CSV separado por ponto-e-vírgula', () => {
      const csv = `TAG;PATRIMONIO;TIPO;APELIDO\nTAG_PT;999999;;Equip 1`;
      const itens = parseEquipamentosCsv(csv, 'Tablet');

      expect(itens.length).toBe(1);
      expect(itens[0]).toEqual({
        tag: 'TAG_PT',
        patrimonio: '999999',
        tipo: 'Tablet',
        apelido: 'Equip 1',
      });
    });
  });

  describe('marcarPatrimoniosDuplicados', () => {
    it('deve marcar erro nos controles com patrimônio duplicado', () => {
      const formArray = new FormArray([
        new FormGroup({ patrimonio: new FormControl('111111') }),
        new FormGroup({ patrimonio: new FormControl('222222') }),
      ]);

      marcarPatrimoniosDuplicados(formArray, ['222222']);

      expect(formArray.at(0).get('patrimonio')?.errors).toBeNull();
      expect(formArray.at(1).get('patrimonio')?.errors).toEqual({ duplicado: true });
      expect(formArray.at(1).get('patrimonio')?.touched).toBe(true);
    });
  });
});
