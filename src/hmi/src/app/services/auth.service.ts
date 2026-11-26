import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, finalize, map, Observable, of, shareReplay, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { clearAllSessionCaches } from './cache/cached-resource';

export interface UsuarioLogado {
  id?: number;
  nome: string;
  email: string;
  avatar: string;
  is_admin: boolean;
  regiao_id?: number;
  unidade_id?: number;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth_url = environment.api_url

  private usuarioSubject = new BehaviorSubject<UsuarioLogado | null>(null);
  usuario$ = this.usuarioSubject.asObservable();
  private refreshInflight$: Observable<boolean> | null = null;

  constructor(private http:HttpClient){}

  public validarGoogleAuth(token:string):Observable<any>{
    return this.http.post(`${this.auth_url}/api/auth`,{token},{withCredentials:true})
  }

  public finalizarCadastro(payload:any):Observable<any>{
    return this.http.post(`${this.auth_url}/api/usuario/finaliza-cadastro`,payload)
  }

   get usuarioAtual(): UsuarioLogado | null {
    return this.usuarioSubject.value;
  }

  // Chama a API para confirmar se o cookie HTTPOnly ainda é válido.
  // withCredentials é obrigatório para o navegador enviar o cookie.
  verificarSessao(): Observable<boolean> {
    return this.http.get<UsuarioLogado>(`${this.auth_url}/api/auth/me`, { withCredentials: true }).pipe(
      tap((usuario) => this.usuarioSubject.next(usuario)),
      map(() => true),
      catchError(() => {
        this.usuarioSubject.next(null);
        return of(false);
      }),
    );
  }

  obterUsuarioAtual(): Observable<UsuarioLogado | null> {
    if (this.usuarioSubject.value && this.usuarioSubject.value.unidade_id !== undefined) {
      return of(this.usuarioSubject.value);
    }
    return this.http.get<UsuarioLogado>(`${this.auth_url}/api/auth/me`, { withCredentials: true }).pipe(
      tap((usuario) => this.usuarioSubject.next(usuario)),
      catchError(() => of(this.usuarioSubject.value)),
    );
  }

  /**
   * Renova o access token usando o cookie HttpOnly `refresh_token`.
   * Deduplica chamadas simultâneas (ex.: múltiplas requisições recebendo 401 ao mesmo tempo).
   */
  renovarSessao(): Observable<boolean> {
    if (this.refreshInflight$) {
      return this.refreshInflight$;
    }

    this.refreshInflight$ = this.http
      .post<{ ok: boolean }>(`${this.auth_url}/api/auth/refresh`, {}, { withCredentials: true })
      .pipe(
        map(() => true),
        catchError(() => of(false)),
        finalize(() => (this.refreshInflight$ = null)),
        shareReplay(1),
      );

    return this.refreshInflight$;
  }

  limparSessao(): void {
    this.usuarioSubject.next(null);
    this.refreshInflight$ = null;
    clearAllSessionCaches();
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.auth_url}/api/auth/logout`, {}, { withCredentials: true }).pipe(
      finalize(() => this.limparSessao()),
    );
  }

}
