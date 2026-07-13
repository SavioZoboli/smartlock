import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { KpiValor } from '../models/kpi.model';

@Injectable({ providedIn: 'root' })
export class KpiService {
  private readonly baseUrl = `${environment.api_url}/api/kpi`;

  constructor(private http: HttpClient) {}

  /** Busca o valor atual de cada KPI selecionado */
  buscarKpi(kpi:string): Observable<string|number> {
    // TODO: implementar chamada real à API
    return this.http.get<string|number>(`${this.baseUrl}/${kpi}`,);
  }
}