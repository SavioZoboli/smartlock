import { describe, it, expect } from 'vitest';
import { Subject, firstValueFrom } from 'rxjs';
import { filtrarAutocomplete, filtrarLista } from './autocomplete-filtro.util';

describe('autocomplete-filtro.util', () => {
  const lista = [
    { id: 1, nome: 'São Paulo', sigla: 'SP' },
    { id: 2, nome: 'Curitiba', sigla: 'PR' },
    { id: 3, nome: 'Florianópolis', sigla: 'SC' },
  ];

  describe('filtrarLista', () => {
    it('deve retornar a lista completa quando o termo de busca for vazio, null ou undefined', () => {
      expect(filtrarLista(lista, '', 'nome')).toEqual(lista);
      expect(filtrarLista(lista, null, 'nome')).toEqual(lista);
      expect(filtrarLista(lista, undefined, 'nome')).toEqual(lista);
    });

    it('deve retornar lista vazia se a lista fonte for nula ou indefinida', () => {
      expect(filtrarLista(null, 'teste', 'nome')).toEqual([]);
      expect(filtrarLista(undefined, 'teste', 'nome')).toEqual([]);
    });

    it('deve filtrar ignorando caixa alta/baixa e acentuação', () => {
      const res = filtrarLista(lista, 'sao', 'nome');
      expect(res.length).toBe(1);
      expect(res[0].nome).toBe('São Paulo');

      const resFloripa = filtrarLista(lista, 'florianopolis', 'nome');
      expect(resFloripa.length).toBe(1);
      expect(resFloripa[0].nome).toBe('Florianópolis');
    });

    it('deve extrair o campo correto quando o valor for o próprio objeto selecionado', () => {
      const res = filtrarLista(lista, { id: 2, nome: 'Curitiba' } as any, 'nome');
      expect(res.length).toBe(1);
      expect(res[0].nome).toBe('Curitiba');
    });
  });

  describe('filtrarAutocomplete', () => {
    it('deve emitir a lista filtrada reativamente com base no valueChanges do controle', () => {
      const valueChanges$ = new Subject<any>();
      const controlMock = {
        valueChanges: valueChanges$,
      } as any;

      const fonte$ = new Subject<any[]>();

      const resultado$ = filtrarAutocomplete(controlMock, fonte$, 'nome');
      const emissoes: any[][] = [];
      const sub = resultado$.subscribe((val) => emissoes.push(val));

      fonte$.next(lista);
      expect(emissoes.length).toBe(1);
      expect(emissoes[0].length).toBe(3);

      valueChanges$.next('curi');
      expect(emissoes.length).toBe(2);
      expect(emissoes[1].length).toBe(1);
      expect(emissoes[1][0].nome).toBe('Curitiba');

      sub.unsubscribe();
    });
  });
});
