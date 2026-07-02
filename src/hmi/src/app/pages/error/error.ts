import { Component, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-error-page',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './error.html',
  styleUrls: ['./error.scss'],
})
export class ErrorPageComponent {
  private location = inject(Location);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Valores padrão cobrem o caso mais comum (404 de roteamento), mas podem
  // ser sobrescritos via "data" na definição da rota (ver exemplo de uso).
  codigo: string | number = this.route.snapshot.data['codigo'] ?? '404';
  titulo: string = this.route.snapshot.data['titulo'] ?? 'Página não encontrada';
  mensagem: string =
    this.route.snapshot.data['mensagem'] ??
    'A página que você tentou acessar não existe ou foi movida.';
  icone: string = this.route.snapshot.data['icone'] ?? 'error_outline';

  // history.length > 1 indica que existe alguma entrada anterior no histórico
  // desta aba. Não garante que ela pertence ao próprio app, mas evita mostrar
  // um botão "Voltar" que levaria o usuário pra fora do sistema sem aviso.
  podeVoltar = window.history.length > 1;

  voltar(): void {
    this.location.back();
  }

  irParaInicio(): void {
    this.router.navigate(['/']);
  }
}