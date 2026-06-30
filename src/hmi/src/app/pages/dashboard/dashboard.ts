import { Component } from '@angular/core';
import { NavbarComponent } from "../../components/nav-bar.component/nav-bar.component";
import { SmartlockReport } from "../../reports/smartlock-report/smartlock-report";

@Component({
  selector: 'app-dashboard',
  imports: [NavbarComponent, SmartlockReport],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {

}
