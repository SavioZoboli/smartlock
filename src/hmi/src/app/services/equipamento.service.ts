import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Equipamento } from '../models/equipamento.model';

export type EquipamentoCreateAttributes={
  rfid:string;
  patrimonio:string;
  tipo:string;
}

@Injectable({
  providedIn: 'root',
})
export class EquipamentoService {
  private api_url = environment.api_url+"/api/equipamento"

  constructor(private http:HttpClient){}

  public listAll():Observable<any>{
    return this.http.get(`${this.api_url}`,{withCredentials:true})
  }

  public bulkCreate(smartlock_id:number,equipamentos:EquipamentoCreateAttributes[]):Observable<any>{
    return this.http.post(`${this.api_url}/bulkCreate`,{smartlock_id,equipamentos},{withCredentials:true})
  }

  public getById(id:number):Observable<any>{
    return this.http.get(`${this.api_url}/${id}`,{withCredentials:true})
  }

  public update(id:number,patrimonio:string,tag:string,tipo:string,smartlock_id:string):Observable<any>{
    return this.http.put(`${this.api_url}/`,{id,patrimonio,tag,tipo,smartlock_id},{withCredentials:true})
  }

  public delete(id:number):Observable<any>{
    return this.http.delete(`${this.api_url}/${id}`,{withCredentials:true})
  }

  public listBySmartlock(smartlock_id:number):Observable<any>{
    return this.http.get(`${this.api_url}/listBySmartlock/${smartlock_id}`,{withCredentials:true})
  }

  public redirect(smartlock_destino_id:number,equipamentos:number[]):Observable<any>{
    return this.http.put(`${this.api_url}/redirect`,{smartlock_destino_id,equipamentos},{withCredentials:true})
  }

  buscarEquipamentosComigo(): Observable<any> {
    return this.http.get(`${this.api_url}/comigo`,{withCredentials:true});
  }

  buscarRelatorioDisponibilidade(smartlock_id:number):Observable<Equipamento[]>{
    return this.http.get<Equipamento[]>(`${this.api_url}/relatorio/disponibilidade/${smartlock_id}`,{withCredentials:true})
  }
}
