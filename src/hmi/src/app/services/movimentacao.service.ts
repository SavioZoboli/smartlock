import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class MovimentacaoService {

  private api_url = `${environment.api_url}/api/movimentacao`
  constructor(private http:HttpClient){}

  public create(smartlock_id:number,movimento:string,equipamentos:number[]):Observable<any>{
    return this.http.post(`${this.api_url}`,{smartlock_id,movimento,equipamentos},{withCredentials:true})
  }

  public listAll():Observable<any>{
    return this.http.get(this.api_url,{withCredentials:true})
  }

  public listaMovimentacaoUltimosDias(dias:number):Observable<any>{
    return this.http.get(`${this.api_url}/ultimosDias/${dias}`,{withCredentials:true})
  }
}
