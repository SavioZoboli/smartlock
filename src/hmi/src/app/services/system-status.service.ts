import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';



@Injectable({
  providedIn: 'root',
})
export class SystemStatusService {
  
  private http = inject(HttpClient)

  private api_url = `${environment.api_url}/api/status`

  public getAllStatus():Observable<any>{
    return this.http.get(this.api_url)
  }

  public getApiStatus():Observable<any>{
return this.http.get(`${this.api_url}/api`)
  }

  public getMqttStatus():Observable<any>{
return this.http.get(`${this.api_url}/mqtt`)
  }


}
