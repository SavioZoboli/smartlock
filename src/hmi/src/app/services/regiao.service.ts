import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class RegiaoService {
  
  private http = inject(HttpClient)

  private base_url = `${environment.api_url}/api/regiao`


  public listAll():Observable<any>{
    return this.http.get(`${this.base_url}`)
  }
}
