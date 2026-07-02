import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
 
  private api_url = 'http://localhost:3000'

  constructor(private http:HttpClient){}

  public create(nome:string,sobrenome:string,email:string,uuid:string,matricula:string,unidade_id:number):Observable<any>{
    return this.http.post(`${this.api_url}/api/usuario`,{nome,sobrenome,uuid,matricula,unidade_id,email})
  }

  public listAll():Observable<any>{
    return this.http.get(`${this.api_url}/api/usuario`)
  }

  public getById(id:number):Observable<any>{
    return this.http.get(`${this.api_url}/api/usuario/${id}`)
  }

  public update(id:number,nome:string,sobrenome:string,email:string,uuid:string,matricula:string,unidade_id:number):Observable<any>{
    return this.http.put(`${this.api_url}/api/usuario`,{id,nome,sobrenome,uuid,matricula,unidade_id,email})
  }

  public delete(id:number):Observable<any>{
    return this.http.delete(`${this.api_url}/api/usuario/${id}`)
  }

}
