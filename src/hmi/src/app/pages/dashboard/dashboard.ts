import { Component } from '@angular/core';
import { DashboardCards } from "../../components/dashboard-cards/dashboard-cards";
import { EquipamentosComigoReport } from "../../reports/equipamentos-comigo-report/equipamentos-comigo-report";

@Component({
  selector: 'app-dashboard',
  imports: [ DashboardCards, EquipamentosComigoReport],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {

}
