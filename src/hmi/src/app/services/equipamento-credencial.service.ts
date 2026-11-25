import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

/** Credencial sem senha: a API nunca devolve a senha nas consultas. */
export interface EquipamentoCredencial {
  id: number;
  equipamento_id: number;
  login: string;
  possui_senha: boolean;
}

export interface EquipamentoCredencialListagem extends EquipamentoCredencial {
  patrimonio: string;
  apelido: string | null;
  tipo: string;
}

@Injectable({
  providedIn: 'root',
})
export class EquipamentoCredencialService {
  private api_url = environment.api_url + '/api/equipamento-credencial';

  constructor(private http: HttpClient) {}

  public listAll(): Observable<EquipamentoCredencialListagem[]> {
    return this.http.get<EquipamentoCredencialListagem[]>(`${this.api_url}`, {
      withCredentials: true,
    });
  }

  public getByEquipamento(equipamento_id: number): Observable<EquipamentoCredencial> {
    return this.http.get<EquipamentoCredencial>(`${this.api_url}/equipamento/${equipamento_id}`, {
      withCredentials: true,
    });
  }

  public create(
    equipamento_id: number,
    login: string,
    senha?: string,
  ): Observable<EquipamentoCredencial> {
    return this.http.post<EquipamentoCredencial>(
      `${this.api_url}`,
      { equipamento_id, login, senha },
      { withCredentials: true },
    );
  }

  /**
   * @param senha `undefined` mantém a senha atual; `null` remove; string substitui.
   */
  public update(
    equipamento_id: number,
    login: string,
    senha?: string | null,
  ): Observable<EquipamentoCredencial> {
    return this.http.put<EquipamentoCredencial>(
      `${this.api_url}/equipamento/${equipamento_id}`,
      { login, senha },
      { withCredentials: true },
    );
  }

  public delete(equipamento_id: number): Observable<any> {
    return this.http.delete(`${this.api_url}/equipamento/${equipamento_id}`, {
      withCredentials: true,
    });
  }

  /** Descriptografa a senha no backend. Cada chamada gera um registro de auditoria. */
  public revelarSenha(equipamento_id: number): Observable<string> {
    return this.http
      .post<{ senha: string }>(
        `${this.api_url}/equipamento/${equipamento_id}/revelar`,
        {},
        { withCredentials: true },
      )
      .pipe(map((res) => res.senha));
  }
}

