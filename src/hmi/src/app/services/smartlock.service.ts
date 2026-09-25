import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { CachedResource, CachedResourceMap } from './cache/cached-resource';
import { ISmartlock } from '../interfaces/smartlock.interface';
import { SystemNotificationService } from './system-notification.service';

@Injectable({
  providedIn: 'root',
})
export class SmartlockService {
  private api_url = environment.api_url;
  private sns = inject(SystemNotificationService);

  private cache = new CachedResource<ISmartlock[]>(
    () => this.http.get<ISmartlock[]>(`${this.api_url}/api/smartlock`, { withCredentials: true }),
    [],
    30 * 60 * 1000,
    (v) => v.length === 0,
    () => this.sns.notificar('Erro ao buscar smartlocks', 'erro'),
  );

  private cacheByUnidade = new CachedResourceMap<number, ISmartlock[]>(
    (unidade_id) =>
      this.http.get<ISmartlock[]>(`${this.api_url}/api/smartlock/listByUnidade/${unidade_id}`, {
        withCredentials: true,
      }),
    [],
    30 * 60 * 1000,
    () => this.sns.notificar('Erro ao buscar smartlocks da unidade', 'erro'),
  );

  /** Signal com a lista completa de smartlocks. Leitura direta, sem subscribe. */
  public readonly smartlocks = this.cache.data;
  /** Signal com o Map<unidade_id, ISmartlock[]>. */
  public readonly smartlocksByUnidade = this.cacheByUnidade.data;

  constructor(private http: HttpClient) {}

  public listAll(): Observable<ISmartlock[]> {
    return this.cache.get();
  }

  public listByUnidade(unidade_id: number): Observable<ISmartlock[]> {
    return this.cacheByUnidade.get(unidade_id);
  }

  public delete(id: number): Observable<any> {
    return this.http
      .delete(`${this.api_url}/api/smartlock/${id}`, { withCredentials: true })
      .pipe(tap(() => this.invalidateCaches()));
  }

  public getById(id: number): Observable<ISmartlock> {
    return this.http.get<ISmartlock>(`${this.api_url}/api/smartlock/${id}`, { withCredentials: true });
  }

  public create(
    apelido: string,
    mac_address: string,
    unidade_id: string,
    has_equipamentos: boolean,
  ): Observable<ISmartlock> {
    return this.http
      .post<ISmartlock>(
        `${this.api_url}/api/smartlock`,
        { apelido, mac_address, unidade_id, has_equipamentos },
        { withCredentials: true },
      )
      .pipe(tap(() => this.invalidateCaches()));
  }

  public update(
    id: number,
    apelido: string,
    mac_address: string,
    has_equipamentos: boolean,
    unidade_id: string,
  ): Observable<ISmartlock> {
    return this.http
      .put<ISmartlock>(
        `${this.api_url}/api/smartlock`,
        { id, apelido, mac_address, unidade_id, has_equipamentos },
        { withCredentials: true },
      )
      .pipe(tap(() => this.invalidateCaches()));
  }

  // create/update/delete não sabem se mudaram a unidade_id anterior de um smartlock,
  // então invalida tudo (lista geral + todas as listas por unidade) pra evitar dado velho.
  private invalidateCaches(): void {
    this.cache.invalidate();
    this.cacheByUnidade.invalidateAll();
  }
}