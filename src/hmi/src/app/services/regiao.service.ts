import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { CachedResource } from './cache/cached-resource';
import { IRegiao } from '../interfaces/regiao.interface';
import { SystemNotificationService } from './system-notification.service';

@Injectable({
  providedIn: 'root',
})
export class RegiaoService {
  private http = inject(HttpClient);
  private sns = inject(SystemNotificationService);

  private base_url = `${environment.api_url}/api/regiao`;

  private cache = new CachedResource<IRegiao[]>(
    () => this.http.get<IRegiao[]>(`${this.base_url}`),
    [],
    30 * 60 * 1000,
    (v) => v.length === 0,
    () => this.sns.notificar('Erro ao buscar regiões', 'erro'),
  );

  /** Signal com a lista de regiões. Leitura direta, sem subscribe. */
  public readonly regioes = this.cache.data;

  public listAll(): Observable<IRegiao[]> {
    return this.cache.get();
  }
}