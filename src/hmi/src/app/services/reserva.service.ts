import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Reserva } from '../models/reserva.model';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root',
})
export class ReservaService {
  private readonly baseUrl = `${environment.api_url}/api/reserva`;

  constructor(private http: HttpClient) {}

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
