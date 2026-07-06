import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SmartlockService {
  private api_url = environment.api_url

  constructor(private http:HttpClient){}

  public listAll():Observable<any>{
    return this.http.get(`${this.api_url}/api/smartlock`,{withCredentials:true})
  }

  public delete(id:number):Observable<any>{
    return this.http.delete(`${this.api_url}/api/smartlock/${id}`,{withCredentials:true})
  }

  public getById(id:number):Observable<any>{
    return this.http.get(`${this.api_url}/api/smartlock/${id}`,{withCredentials:true})
  }

  public create(apelido:string,mac_address:string,unidade_id:string,has_equipamentos:boolean){
    return this.http.post(`${this.api_url}/api/smartlock`,{apelido,mac_address,unidade_id,has_equipamentos},{withCredentials:true})
  }

  public update(id:number,apelido:string,mac_address:string,has_equipamentos:boolean,unidade_id:string){
    return this.http.put(`${this.api_url}/api/smartlock`,{id,apelido,mac_address,unidade_id,has_equipamentos},{withCredentials:true})
  }
}
