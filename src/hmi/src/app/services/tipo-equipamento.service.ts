import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { CachedResource } from './cache/cached-resource';
import { SystemNotificationService } from './system-notification.service';

export interface ITipoEquipamento {
  id: number;
  nome: string;
  descricao: string | null;
  has_patrimonio: boolean;
  has_credencial: boolean;
  icone: string | null;
  qtd_equipamentos?: number;
}

export interface TipoEquipamentoPayload {
  nome: string;
  descricao?: string | null;
  has_patrimonio: boolean;
  has_credencial: boolean;
  icone?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class TipoEquipamentoService {
  private http = inject(HttpClient);
  private sns = inject(SystemNotificationService);

  private base_url = `${environment.api_url}/api/tipo-equipamento`;

  private cache = new CachedResource<ITipoEquipamento[]>(
    () =>
      this.http
        .get<ITipoEquipamento[]>(this.base_url, { withCredentials: true })
        .pipe(
          map((lista) =>
            (lista ?? []).map((t) => ({
              ...t,
              id: Number(t.id),
              qtd_equipamentos:
                t.qtd_equipamentos !== undefined ? Number(t.qtd_equipamentos) : undefined,
            })),
          ),
        ),
    [],
    30 * 60 * 1000,
    (v) => v.length === 0,
    () => this.sns.notificar('Erro ao buscar tipos de equipamento', 'erro'),
  );

  /** Signal com a lista de tipos de equipamento em cache. */
  public readonly tipos = this.cache.data;

  public listAll(): Observable<ITipoEquipamento[]> {
    return this.cache.get();
  }

  public getById(id: number): Observable<ITipoEquipamento> {
    return this.http
      .get<ITipoEquipamento>(`${this.base_url}/${id}`, { withCredentials: true })
      .pipe(map((t) => ({ ...t, id: Number(t.id) })));
  }

  public create(payload: TipoEquipamentoPayload): Observable<ITipoEquipamento> {
    return this.http
      .post<ITipoEquipamento>(this.base_url, payload, { withCredentials: true })
      .pipe(
        map((t) => ({ ...t, id: Number(t.id) })),
        tap(() => this.cache.invalidate()),
      );
  }

  public update(id: number, payload: TipoEquipamentoPayload): Observable<ITipoEquipamento> {
    return this.http
      .put<ITipoEquipamento>(`${this.base_url}/${id}`, payload, { withCredentials: true })
      .pipe(
        map((t) => ({ ...t, id: Number(t.id) })),
        tap(() => this.cache.invalidate()),
      );
  }

  public delete(id: number): Observable<any> {
    return this.http
      .delete(`${this.base_url}/${id}`, { withCredentials: true })
      .pipe(tap(() => this.cache.invalidate()));
  }
}
