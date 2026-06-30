import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UnidadeService {
  private api_url:string = "http://localhost:3000"
  private  headers = {
    "content-type":"application/json"
  }

  constructor(private http:HttpClient){}

  public create(nome:string,regional:string,entidade:string):Observable<any>{
    return this.http.post(`${this.api_url}/api/unidade`,{nome,regional,entidade},{headers:this.headers})
  }

  public update(id:number,nome:string,regional:string,entidade:string):Observable<any>{
    return this.http.put(`${this.api_url}/api/unidade`,{id,nome,regional,entidade},{headers:this.headers})
  }

  public getById(id:number):Observable<any>{
    return this.http.get(`${this.api_url}/api/unidade/${id}`)
  }

  public listAll():Observable<any>{
    return this.http.get(`${this.api_url}/api/unidade`)
  }

  public delete(id:number):Observable<any>{
    return this.http.delete(`${this.api_url}/api/unidade/${id}`)
  }


}
