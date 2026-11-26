import { Component, inject, Input, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { SystemStatusService } from '../../services/system-status.service';
import { SystemNotificationService } from '../../services/system-notification.service';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';

type StatusServidor = 'ok' | 'erro' | 'carregando';
type Modules = 'all' | 'mqtt' | 'api';

const INTERVALO_VERIFICACAO_MS = 30000;

@Component({
  selector: 'app-server-status',
  standalone: true,
  imports: [CommonModule, MatIcon, MatTooltip],
  templateUrl: './server-status.html',
  styleUrls: ['./server-status.scss'],
})
export class ServerStatus implements OnInit, OnDestroy {
  worker_mqtt = signal<StatusServidor>('carregando');
  broker_mqtt = signal<StatusServidor>('carregando');
  api = signal<StatusServidor>('carregando');
  database = signal<StatusServidor>('carregando');

  @Input() searchedModule: Modules = 'all';

  private intervalId?: ReturnType<typeof setInterval>;
  private erroNotificado = false;

  private systemStatusService = inject(SystemStatusService);
  private sns = inject(SystemNotificationService);

  ngOnInit(): void {
    this.verificarStatus(this.searchedModule);
    this.intervalId = setInterval(
      () => this.verificarStatus(this.searchedModule),
      INTERVALO_VERIFICACAO_MS,
    );
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  private mapStatus(valor: unknown): StatusServidor {
    return valor === 'online' ? 'ok' : 'erro';
  }

  private notificarErroUnico(): void {
    if (!this.erroNotificado) {
      this.erroNotificado = true;
      this.sns.notificar('Erro ao buscar status', 'erro');
    }
  }

  private verificarStatus(module: Modules): void {
    switch (module) {
      case 'all':
        this.systemStatusService.getAllStatus().subscribe({
          next: (val) => {
            this.erroNotificado = false;
            this.worker_mqtt.set(this.mapStatus(val?.worker_mqtt));
            this.broker_mqtt.set(this.mapStatus(val?.broker_mqtt));
            this.database.set(this.mapStatus(val?.database));
            this.api.set('ok');
          },
          error: () => {
            this.database.set('erro');
            this.api.set('erro');
            this.worker_mqtt.set('erro');
            this.broker_mqtt.set('erro');
            this.notificarErroUnico();
          },
        });
        break;
      case 'api':
        this.systemStatusService.getApiStatus().subscribe({
          next: (val) => {
            this.erroNotificado = false;
            this.database.set(this.mapStatus(val?.database));
            this.api.set('ok');
          },
          error: () => {
            this.database.set('erro');
            this.api.set('erro');
            this.notificarErroUnico();
          },
        });
        break;
      case 'mqtt':
        this.systemStatusService.getMqttStatus().subscribe({
          next: (val) => {
            this.erroNotificado = false;
            this.worker_mqtt.set(this.mapStatus(val?.worker_mqtt));
            this.broker_mqtt.set(this.mapStatus(val?.broker_mqtt));
            this.api.set('ok');
          },
          error: () => {
            this.worker_mqtt.set('erro');
            this.broker_mqtt.set('erro');
            this.api.set('erro');
            this.notificarErroUnico();
          },
        });
        break;
    }
  }
}
