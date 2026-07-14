import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, of, tap } from 'rxjs';

export interface UsuarioLogado {
  nome: string;
  email: string;
  avatar: string;
  is_admin:boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth_url = 'http://localhost:3000'

  private usuarioSubject = new BehaviorSubject<UsuarioLogado | null>(null);
  usuario$ = this.usuarioSubject.asObservable();

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

  logout(): Observable<void> {
    return this.http.post<void>(`${this.auth_url}/api/auth/logout`, {}, { withCredentials: true }).pipe(
      tap(() => this.usuarioSubject.next(null)),
    );
  }

}
