import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService, UsuarioLogado } from '../../services/auth.service';
import { Observable } from 'rxjs';
import { Logo } from "../logo/logo";
import { ThemeTogglerService } from '../../services/theme-toggler.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule, MatDividerModule, RouterLink, Logo],
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.scss']
})
export class NavbarComponent{
  // Observable exposto direto no template via async pipe — sempre reflete
  // o usuário atual sem precisar de subscribe manual/unsubscribe no componente.
  usuario$:Observable<UsuarioLogado|null> = inject(AuthService).usuario$;

  themeService = inject(ThemeTogglerService);

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {
  }

  // Fallback para quando não há foto de avatar: iniciais do nome (ex: "Ana Silva" -> "AS")
  obterIniciais(nome: string): string {
    //if(!nome) return '';
    const partes = nome.trim().split(/\s+/);
    const primeira = partes[0]?.[0] ?? '';
    const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
    return (primeira + ultima).toUpperCase();
  }



  logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: (e) => {
        console.log(e)
        this.router.navigate(['/login'])
      }, // mesmo se a API falhar, garante o redirect
    });
  }
}