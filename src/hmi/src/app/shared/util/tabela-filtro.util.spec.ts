import { describe, it, expect, vi } from 'vitest';
import { Subject } from 'rxjs';
import { sincronizarFiltroTabela } from './tabela-filtro.util';

describe('tabela-filtro.util', () => {
  it('deve registrar filterPredicate que faz o parse de JSON e delega para o predicado fornecido', () => {
    const mockDataSource: any = {
      filterPredicate: null,
      filter: '',
    };

    const valueChanges$ = new Subject<any>();
    const mockFormGroup: any = {
      valueChanges: valueChanges$,
    };

    const predicateMock = vi.fn((data: any, filtro: any) => data.nome === filtro.nome);

    sincronizarFiltroTabela(mockDataSource, mockFormGroup, predicateMock);

    expect(typeof mockDataSource.filterPredicate).toBe('function');

    const item = { nome: 'Item A' };
    const passa = mockDataSource.filterPredicate(item, JSON.stringify({ nome: 'Item A' }));
    expect(passa).toBe(true);
    expect(predicateMock).toHaveBeenCalledWith(item, { nome: 'Item A' });

    const naoPassa = mockDataSource.filterPredicate(item, JSON.stringify({ nome: 'Item B' }));
    expect(naoPassa).toBe(false);
  });

  it('deve atualizar dataSource.filter com JSON e resetar página quando formGroup emite novos valores', () => {
    const mockPaginator = {
      firstPage: vi.fn(),
    };

    const mockDataSource: any = {
      filterPredicate: null,
      filter: '',
      paginator: mockPaginator,
    };

    const valueChanges$ = new Subject<any>();
    const mockFormGroup: any = {
      valueChanges: valueChanges$,
    };

    sincronizarFiltroTabela(mockDataSource, mockFormGroup, () => true);

    valueChanges$.next({ busca: 'teste' });

    expect(mockDataSource.filter).toBe(JSON.stringify({ busca: 'teste' }));
    expect(mockPaginator.firstPage).toHaveBeenCalled();
  });

  it('deve desinscrever ao acionar destroyRef', () => {
    const mockDataSource: any = {
      filterPredicate: null,
      filter: '',
    };

    const valueChanges$ = new Subject<any>();
    const mockFormGroup: any = {
      valueChanges: valueChanges$,
    };

    let destroyCallback: (() => void) | null = null;
    const mockDestroyRef: any = {
      onDestroy: (cb: () => void) => {
        destroyCallback = cb;
      },
    };

    const sub = sincronizarFiltroTabela(mockDataSource, mockFormGroup, () => true, mockDestroyRef);

    expect(sub.closed).toBe(false);
    destroyCallback!();
    expect(sub.closed).toBe(true);
  });
});

