import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Reserva } from '../models/reserva.model';
import { Observable } from 'rxjs';

export interface ReservaPayload {
  unidade_id: number;
  smartlock_id: number;
  data_hora_emprestimo: string;
  data_hora_devolucao_prevista: string;
  equipamentos: number[];
}

@Injectable({
  providedIn: 'root',
})
export class ReservaService {
    private readonly baseUrl = `${environment.api_url}/api/reservas`;
 
  constructor(private http: HttpClient) {}
 
  listAll(): Observable<Reserva[]> {
    return this.http.get<Reserva[]>(this.baseUrl);
  }
 
  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`);
  }
 
  create(payload: ReservaPayload): Observable<Reserva> {
    return this.http.post<Reserva>(this.baseUrl, payload);
  }
 
  update(id: number, payload: ReservaPayload): Observable<Reserva> {
    return this.http.put<Reserva>(`${this.baseUrl}/${id}`, payload);
  }
 
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
