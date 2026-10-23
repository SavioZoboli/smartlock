import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Reserva } from '../models/reserva.model';
import { Observable } from 'rxjs';


export interface ReservaVigenteResponse {
  reservaUsuario: any | null;
  equipamentosReservadosOutros: number[];
}

export interface FiltrosRelatorioReserva {
  unidade_id?: number | null;
  smartlock_id?: number | null;
  usuario_id?: number | null;
  inicio?: string | Date;
  fim?: string | Date;
}

@Injectable({
  providedIn: 'root',
})
export class ReservaService {
  private readonly baseUrl = `${environment.api_url}/api/reserva`;

  constructor(private http: HttpClient) {}

  getRelatorio(filtros: FiltrosRelatorioReserva): Observable<any[]> {
    let params = new HttpParams();
    if (filtros.unidade_id) params = params.set('unidade_id', filtros.unidade_id.toString());
    if (filtros.smartlock_id) params = params.set('smartlock_id', filtros.smartlock_id.toString());
    if (filtros.usuario_id) params = params.set('usuario_id', filtros.usuario_id.toString());
    if (filtros.inicio) {
      const inicioIso = filtros.inicio instanceof Date ? filtros.inicio.toISOString() : filtros.inicio;
      params = params.set('inicio', inicioIso);
    }
    if (filtros.fim) {
      const fimIso = filtros.fim instanceof Date ? filtros.fim.toISOString() : filtros.fim;
      params = params.set('fim', fimIso);
    }

    return this.http.get<any[]>(`${this.baseUrl}/relatorio`, {
      params,
      withCredentials: true,
    });
  }

  getReservaVigente(smartlockId: number): Observable<ReservaVigenteResponse> {
    return this.http.get<ReservaVigenteResponse>(
      `${this.baseUrl}/vigente?smartlock_id=${smartlockId}`,
      { withCredentials: true },
    );
  }

  listAll(): Observable<any> {
    return this.http.get<any>(this.baseUrl);
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }

  create(
    smartlock_id: number,
    dt_reserva: Date,
    dt_devolucao: Date,
    equipamentos: number[],
  ): Observable<any> {
    return this.http.post(
      this.baseUrl,
      { smartlock_id, dt_reserva, dt_devolucao, equipamentos },
      { withCredentials: true },
    );
  }

  update(
    id: number,
    dt_reserva: Date,
    dt_devolucao: Date,
    equipamentos: number[],
  ): Observable<any> {
    return this.http.put(
      this.baseUrl,
      { id, dt_reserva, dt_devolucao, equipamentos },
      { withCredentials: true },
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
