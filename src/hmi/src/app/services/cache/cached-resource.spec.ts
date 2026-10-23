import { Subject, firstValueFrom, of, throwError } from 'rxjs';
import { CachedResource, CachedResourceMap } from './cached-resource';

describe('CachedResource', () => {
  afterEach(() => vi.useRealTimers());

  it('inicia com o valor padrão no signal', () => {
    const cache = new CachedResource(() => of([1]), [] as number[]);
    expect(cache.data()).toEqual([]);
  });

  it('busca na primeira chamada e atualiza o signal', async () => {
    const fetcher = vi.fn(() => of([1, 2]));
    const cache = new CachedResource(fetcher, [] as number[]);

    const res = await firstValueFrom(cache.get());

    expect(res).toEqual([1, 2]);
    expect(cache.data()).toEqual([1, 2]);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('não chama o fetcher novamente enquanto o cache é válido', async () => {
    const fetcher = vi.fn(() => of([1]));
    const cache = new CachedResource(fetcher, [] as number[]);

    await firstValueFrom(cache.get());
    await firstValueFrom(cache.get());

    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('busca novamente após expirar o TTL', async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn(() => of([1]));
    const cache = new CachedResource(fetcher, [] as number[], 1000);

    await firstValueFrom(cache.get());
    vi.advanceTimersByTime(1001);
    await firstValueFrom(cache.get());

    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('busca novamente após invalidate()', async () => {
    const fetcher = vi.fn(() => of([1]));
    const cache = new CachedResource(fetcher, [] as number[]);

    await firstValueFrom(cache.get());
    cache.invalidate();
    await firstValueFrom(cache.get());

    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('considera resultado vazio como cache inválido (busca de novo)', async () => {
    const fetcher = vi.fn(() => of([] as number[]));
    const cache = new CachedResource(fetcher, [] as number[]);

    await firstValueFrom(cache.get());
    await firstValueFrom(cache.get());

    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('compartilha a mesma requisição em andamento entre chamadas concorrentes', async () => {
    const resposta$ = new Subject<number[]>();
    const fetcher = vi.fn(() => resposta$.asObservable());
    const cache = new CachedResource(fetcher, [] as number[]);

    const p1 = firstValueFrom(cache.get());
    const p2 = firstValueFrom(cache.get());
    resposta$.next([7]);
    resposta$.complete();

    expect(await p1).toEqual([7]);
    expect(await p2).toEqual([7]);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('em erro, retorna o valor padrão e chama onError', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const onError = vi.fn();
    const cache = new CachedResource(
      () => throwError(() => new Error('falha')),
      ['padrao'],
      undefined,
      undefined,
      onError,
    );

    const res = await firstValueFrom(cache.get());

    expect(res).toEqual(['padrao']);
    expect(onError).toHaveBeenCalledTimes(1);
  });
});

describe('CachedResourceMap', () => {
  it('mantém cache independente por chave', async () => {
    const fetcher = vi.fn((id: number) => of([`item-${id}`]));
    const cache = new CachedResourceMap<number, string[]>(fetcher, []);

    expect(await firstValueFrom(cache.get(1))).toEqual(['item-1']);
    expect(await firstValueFrom(cache.get(2))).toEqual(['item-2']);
    await firstValueFrom(cache.get(1));

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(cache.data().get(1)).toEqual(['item-1']);
    expect(cache.data().get(2)).toEqual(['item-2']);
  });

  it('invalidate(chave) força nova busca apenas daquela chave', async () => {
    const fetcher = vi.fn((id: number) => of([id]));
    const cache = new CachedResourceMap<number, number[]>(fetcher, []);

    await firstValueFrom(cache.get(1));
    await firstValueFrom(cache.get(2));
    cache.invalidate(1);
    await firstValueFrom(cache.get(1));
    await firstValueFrom(cache.get(2));

    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(fetcher.mock.calls.filter(([id]) => id === 1).length).toBe(2);
  });

  it('invalidateAll() força nova busca de todas as chaves', async () => {
    const fetcher = vi.fn((id: number) => of([id]));
    const cache = new CachedResourceMap<number, number[]>(fetcher, []);

    await firstValueFrom(cache.get(1));
    await firstValueFrom(cache.get(2));
    cache.invalidateAll();
    await firstValueFrom(cache.get(1));
    await firstValueFrom(cache.get(2));

    expect(fetcher).toHaveBeenCalledTimes(4);
  });

  it('em erro, retorna o valor padrão e não grava a chave como válida', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetcher = vi
      .fn<(id: number) => any>()
      .mockReturnValueOnce(throwError(() => new Error('x')))
      .mockReturnValueOnce(of([1]));
    const cache = new CachedResourceMap<number, number[]>(fetcher, []);

    expect(await firstValueFrom(cache.get(1))).toEqual([]);
    expect(await firstValueFrom(cache.get(1))).toEqual([1]);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});

