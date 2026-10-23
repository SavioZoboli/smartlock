import { Signal, signal, WritableSignal } from '@angular/core';
import { catchError, finalize, Observable, of, shareReplay, tap } from 'rxjs';

const DEFAULT_TTL_MS = 30 * 60 * 1000; // 30 minutos

/**
 * Cache genérico para um único recurso (ex: lista de unidades, lista de regiões).
 * Guarda o valor num signal (leitura direta, sem subscribe) e só chama `fetcher`
 * de novo quando o cache expira (TTL) ou ainda não foi carregado.
 *
 * Uso dentro de um service:
 *
 *   private cache = new CachedResource<IUnidade[]>(
 *     () => this.http.get<IUnidade[]>(url),
 *     [],
 *   );
 *   public readonly unidades = this.cache.data;
 *   public listAll() { return this.cache.get(); }
 */
export class CachedResource<T> {
  private readonly _data: WritableSignal<T>;
  public readonly data: Signal<T>;

  private lastFetch = 0;
  private inflight$: Observable<T> | null = null;

  constructor(
    private readonly fetcher: () => Observable<T>,
    private readonly defaultValue: T,
    private readonly ttlMs: number = DEFAULT_TTL_MS,
    private readonly isEmpty: (value: T) => boolean = (v) => Array.isArray(v) ? v.length === 0 : !v,
    private readonly onError?: (err: unknown) => void,
  ) {
    this._data = signal<T>(defaultValue);
    this.data = this._data.asReadonly();
  }

  /** Dispara a busca (se o cache estiver vazio/expirado) e atualiza o signal. */
  public get(): Observable<T> {
    if (this.cacheValido()) {
      return of(this._data());
    }

    if (this.inflight$) {
      return this.inflight$;
    }

    this.inflight$ = this.fetcher().pipe(
      tap((res) => {
        this._data.set(res);
        this.lastFetch = Date.now();
      }),
      catchError((err) => {
        console.error(err);
        this.onError?.(err);
        return of(this.defaultValue);
      }),
      shareReplay(1),
      finalize(() => (this.inflight$ = null)),
    );

    return this.inflight$;
  }

  /** Força a próxima chamada a `get()` buscar dado novo na API. */
  public invalidate(): void {
    this.lastFetch = 0;
  }

  private cacheValido(): boolean {
    return !this.isEmpty(this._data()) && Date.now() - this.lastFetch < this.ttlMs;
  }
}

/**
 * Mesma ideia de `CachedResource`, mas para recursos parametrizados por chave
 * (ex: smartlocks por unidade_id). Cada chave tem seu próprio TTL e inflight.
 *
 *   private cacheByUnidade = new CachedResourceMap<number, ISmartlock[]>(
 *     (unidadeId) => this.http.get<ISmartlock[]>(`${url}/${unidadeId}`),
 *     [],
 *   );
 *   public listByUnidade(id: number) { return this.cacheByUnidade.get(id); }
 */
export class CachedResourceMap<K, T> {
  private readonly _data: WritableSignal<Map<K, T>> = signal<Map<K, T>>(new Map());
  public readonly data: Signal<Map<K, T>> = this._data.asReadonly();

  private readonly lastFetch = new Map<K, number>();
  private readonly inflight = new Map<K, Observable<T>>();

  constructor(
    private readonly fetcher: (key: K) => Observable<T>,
    private readonly defaultValue: T,
    private readonly ttlMs: number = DEFAULT_TTL_MS,
    private readonly onError?: (err: unknown) => void,
  ) {}

  public get(key: K): Observable<T> {
    if (this.cacheValido(key)) {
      return of(this._data().get(key) as T);
    }

    const emAndamento = this.inflight.get(key);
    if (emAndamento) {
      return emAndamento;
    }

    const request$ = this.fetcher(key).pipe(
      tap((res) => {
        const atual = new Map(this._data());
        atual.set(key, res);
        this._data.set(atual);
        this.lastFetch.set(key, Date.now());
      }),
      catchError((err) => {
        console.error(err);
        this.onError?.(err);
        return of(this.defaultValue);
      }),
      shareReplay(1),
      finalize(() => this.inflight.delete(key)),
    );

    this.inflight.set(key, request$);
    return request$;
  }

  /** Invalida uma chave específica. */
  public invalidate(key: K): void {
    this.lastFetch.delete(key);
  }

  /** Invalida todas as chaves (útil após create/update/delete que não sabe a quem pertencia). */
  public invalidateAll(): void {
    this.lastFetch.clear();
  }

  private cacheValido(key: K): boolean {
    const timestamp = this.lastFetch.get(key);
    return this._data().has(key) && !!timestamp && Date.now() - timestamp < this.ttlMs;
  }
}