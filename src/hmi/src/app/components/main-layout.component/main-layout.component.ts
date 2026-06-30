import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../nav-bar.component/nav-bar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  templateUrl:'./main-layout.component.html',
  styleUrls:['./main-layout.component.scss'],
  imports: [RouterModule, NavbarComponent ], 
})
export class MainLayoutComponent {}