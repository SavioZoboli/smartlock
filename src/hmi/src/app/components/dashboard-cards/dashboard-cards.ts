import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { KPI_CATALOGO, KPI_PADRAO, KpiDefinicao } from '../../models/kpi.model';
import { KpiService } from '../../services/kpi.service';
import { SystemNotificationService } from '../../services/system-notification.service';

@Component({
  selector: 'app-dashboard-cards',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatMenuModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatCardModule,
    MatIconModule,
  ],
  templateUrl: './dashboard-cards.html',
  styleUrls: ['./dashboard-cards.scss'],
})
export class DashboardCards implements OnInit {
  // catalogo nunca é mutado - é só a fonte de metadados (label, icon, formato)
  catalogo: KpiDefinicao[] = KPI_CATALOGO;

  // TODO: substituir KPI_PADRAO pela preferência salva do usuário, quando existir
  kpisSelecionados: string[] = [...KPI_PADRAO];

  // kpisExibidos guarda cópias próprias do componente, nunca referências do catalogo
  kpisExibidos = signal<KpiDefinicao[]>([]);
  carregando = false;

  constructor(
    private kpiService: KpiService,
    private sns: SystemNotificationService,
  ) {}

  ngOnInit() {
    this.atualizarExibicao(this.kpisSelecionados);
  }

  isSelecionado(id: string): boolean {
    return this.kpisSelecionados.includes(id);
  }

  toggleKpi(id: string) {
    this.kpisSelecionados = this.isSelecionado(id)
      ? this.kpisSelecionados.filter((k) => k !== id)
      : [...this.kpisSelecionados, id];

    // TODO: persistir a preferência do usuário
    this.atualizarExibicao(this.kpisSelecionados);
  }

  private atualizarExibicao(ids: string[]) {
    // exibe os cards imediatamente, sem valor, enquanto a busca roda
    let kpis = this.catalogo
      .filter((k) => ids.includes(k.id))
      .map((k) => ({ ...k, valor: undefined }));

    this.kpisExibidos.set(kpis)
    
    void this.carregarValores(ids);
  }

  private async carregarValores(ids: string[]) {
    this.carregando = true;

    // uma consulta por vez, em sequência - contagens simples no backend, sem custo real
    for (const id of ids) {
      try {
        console.log(`Consultando ${id}`);
        const res = await firstValueFrom(this.kpiService.buscarKpi(id));
        console.log(`Resposta ${res}`);
        this.atualizarValorKpi(id, res);
      } catch (err: any) {
        this.sns.notificar(`KPI ${id} - ${err.status ?? err.message}`, 'erro');
      }
    }

    this.carregando = false;
  }

  private atualizarValorKpi(id: string, valor: number | string | undefined) {
    let kpis = this.kpisExibidos().map((k) => (k.id === id ? { ...k, valor } : k));
    this.kpisExibidos.set(kpis)
  }
}
