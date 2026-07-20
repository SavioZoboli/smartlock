import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';

const INTERVALO_MS = 50;
const TIMEOUT_MS = 10000;

@Injectable({ providedIn: 'root' })
export class GoogleIdentityService {
  // Cacheia a Promise para não criar múltiplos polls se o método for chamado
  // várias vezes (ex: revisitas à tela de login dentro da mesma sessão do app).
  private carregamento: Promise<void> | null = null;

  private api_token = signal('')

  private api_url = environment.api_url

  constructor(private http:HttpClient){
    this.getGoogleApiToken()
  }

  public getGoogleToken():string{
    return this.api_token()
  }

  private getGoogleApiToken(){
    this.http.get<any>(`${this.api_url}/api/auth/googleToken`).subscribe({
      next:(res)=>{
        this.api_token.set(res);
      },
      error:(e)=>{
        console.error(e)
      }
    })
  }

  aguardarCarregamento(): Promise<void> {
    if (this.carregamento) {
      return this.carregamento;
    }

    this.carregamento = new Promise((resolve, reject) => {
      if (this.sdkDisponivel()) {
        resolve();
        return;
      }

      const inicio = Date.now();
      const intervalo = setInterval(() => {
        if (this.sdkDisponivel()) {
          clearInterval(intervalo);
          resolve();
          return;
        }

        if (Date.now() - inicio > TIMEOUT_MS) {
          clearInterval(intervalo);
          this.carregamento = null; // permite tentar de novo numa próxima chamada
          reject(new Error('Timeout ao carregar o SDK do Google Identity'));
        }
      }, INTERVALO_MS);
    });

    return this.carregamento;
  }

  private sdkDisponivel(): boolean {
    // @ts-ignore
    return typeof google !== 'undefined' && !!google.accounts?.id;
  }
}