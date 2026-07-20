import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';

const INTERVALO_MS = 50;
const TIMEOUT_MS = 10000;

@Injectable({ providedIn: 'root' })
export class GoogleIdentityService {
  private sdkPromise: Promise<void> | null = null;
  private tokenPromise: Promise<string> | null = null;

  public api_token = signal('');
  private api_url = environment.api_url;

  constructor(private http: HttpClient) {}

  /** Espera SDK carregado + token do backend, e retorna o token pronto pra usar. */
  async aguardarCarregamento(): Promise<string> {
    const [, token] = await Promise.all([
      this.aguardarSdk(),
      this.carregarToken(),
    ]);
    return token;
  }

  private carregarToken(): Promise<string> {
    if (this.tokenPromise) return this.tokenPromise;

    this.tokenPromise = new Promise((resolve, reject) => {
      this.http.get<string>(`${this.api_url}/api/auth/googleToken`).subscribe({
        next: (res) => {
          this.api_token.set(res);
          resolve(res);
        },
        error: (e) => {
          this.tokenPromise = null; // permite retry
          reject(e);
        },
      });
    });

    return this.tokenPromise;
  }

  private aguardarSdk(): Promise<void> {
    if (this.sdkPromise) return this.sdkPromise;

    this.sdkPromise = new Promise((resolve, reject) => {
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
          this.sdkPromise = null;
          reject(new Error('Timeout ao carregar o SDK do Google Identity'));
        }
      }, INTERVALO_MS);
    });

    return this.sdkPromise;
  }

  private sdkDisponivel(): boolean {
    // @ts-ignore
    return typeof google !== 'undefined' && !!google.accounts?.id;
  }
}