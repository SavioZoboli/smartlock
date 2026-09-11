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

  private verificarStatus(module: Modules): void {
    switch (module) {
      case 'all':
        this.systemStatusService.getAllStatus().subscribe({
          next: (val) => {
            console.log(val);
            if (val.worker_mqtt == 'online') {
              this.worker_mqtt.set('ok');
            } else {
              this.worker_mqtt.set('erro');
            }

            if (val.broker_mqtt == 'online') {
              this.broker_mqtt.set('ok');
            } else {
              this.broker_mqtt.set('erro');
            }

            if (val.database == 'online') {
              this.database.set('ok');
            } else {
              this.database.set('erro');
            }

            this.api.set('ok');
          },
          error: (err) => {
            this.database.set('erro');
            this.api.set('erro');
            this.worker_mqtt.set('erro');
            this.broker_mqtt.set('erro');
            this.sns.notificar('Erro ao buscar status', 'erro');
            console.log(err);
          },
        });
        break;
      case 'api':
        this.systemStatusService.getApiStatus().subscribe({
          next: (val) => {
            this.database.set(val.database);
            this.api.set('ok');
          },
          error: (err) => {
            this.database.set('erro');
            this.api.set('erro');
            this.sns.notificar('Erro ao buscar status', 'erro');
            console.log(err);
          },
        });
        break;
      case 'mqtt':
        this.systemStatusService.getMqttStatus().subscribe({
          next: (val) => {
            this.worker_mqtt.set(val.worker_mqtt);
            this.broker_mqtt.set(val.broker_mqtt);
          },
          error: (err) => {
            this.worker_mqtt.set('erro');
            this.broker_mqtt.set('erro');
            this.sns.notificar('Erro ao buscar status', 'erro');
            console.log(err);
          },
        });
        break;
    }
  }
}
