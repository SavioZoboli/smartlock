import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { IUnidade } from '../interfaces/unidade.interface';
import { SystemNotificationService } from './system-notification.service';
import { CachedResource } from './cache/cached-resource';
import { UnidadeComRegionalDTO } from '../dto/UnidadeComRegional.dto';

@Injectable({
  providedIn: 'root',
})
export class UnidadeService {
  private api_url: string = environment.api_url;
  private headers = {
    'content-type': 'application/json',
  };

  private sns = inject(SystemNotificationService);

  private cache = new CachedResource<UnidadeComRegionalDTO[]>(
    () => this.consultaUnidades(),
    [],
    30 * 60 * 1000,
    (v) => v.length === 0,
    () => this.sns.notificar('Erro ao buscar unidades', 'erro'),
  );

  /** Signal com a lista de unidades. Leitura direta, sem subscribe. */
  public readonly unidades = this.cache.data;

  constructor(private http: HttpClient) {}

  private consultaUnidades():Observable<UnidadeComRegionalDTO[]>{
    console.log("Buscando Unidades");
    return this.http.get<UnidadeComRegionalDTO[]>(`${this.api_url}/api/unidade`)
  }

  public create(nome: string, regiao_id: string, entidade: string): Observable<IUnidade> {
    return this.http
      .post<IUnidade>(`${this.api_url}/api/unidade`, { nome, regiao_id, entidade }, { headers: this.headers })
      .pipe(tap(() => this.cache.invalidate()));
  }

  public update(id: number, nome: string, regiao_id: string, entidade: string): Observable<IUnidade> {
    return this.http
      .put<IUnidade>(
        `${this.api_url}/api/unidade`,
        { id, nome, regiao_id, entidade },
        { headers: this.headers },
      )
      .pipe(tap(() => this.cache.invalidate()));
  }

  public getById(id: number): Observable<IUnidade> {
    return this.http.get<IUnidade>(`${this.api_url}/api/unidade/${id}`);
  }

  /** Dispara a busca (se cache vazio/expirado) e atualiza o signal `unidades`. */
  public listAll(): Observable<IUnidade[]> {
    return this.cache.get();
  }

  public delete(id: number): Observable<any> {
    return this.http.delete(`${this.api_url}/api/unidade/${id}`).pipe(tap(() => this.cache.invalidate()));
  }
}