import { Component, signal } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  Router,
  RouterOutlet,
} from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('smart_lock_hmi');

  constructor(private router: Router) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationCancel) {
        console.log('🚫 Navegação cancelada:', event.reason);
      }
      if (event instanceof NavigationError) {
        console.log('💥 Erro de navegação:', event.error);
      }
      if (event instanceof NavigationEnd) {
        console.log('✅ Navegação concluída:', event.url);
      }
    });
  }
}
