import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

type StatusServidor = 'ok' | 'erro' | 'carregando';

const INTERVALO_VERIFICACAO_MS = 30000;
//Run
@Component({
  selector: 'app-server-status',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './server-status.html',
  styleUrls: ['./server-status.scss'],
})
export class ServerStatus implements OnInit, OnDestroy {
  status = signal<StatusServidor>('carregando');

  private intervalId?: ReturnType<typeof setInterval>;
  private api_url = environment.api_url;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.verificarStatus();
    this.intervalId = setInterval(() => this.verificarStatus(), INTERVALO_VERIFICACAO_MS);
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  private verificarStatus(): void {
    this.status.set('carregando');
    this.http.get(`${this.api_url}/api`).subscribe({
      next: () => this.status.set('ok'),
      error: () => this.status.set('erro'),
    });
  }
}