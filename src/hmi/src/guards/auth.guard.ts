// guards/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, of } from 'rxjs';
import { AuthService } from '../app/services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Se a sessão já foi verificada nesta navegação (ex: no bootstrap do app),
  // evita chamar a API de novo a cada troca de rota.
  if (authService.usuarioAtual) {
    return of(true);
  }

  return authService.verificarSessao().pipe(
    map((autenticado) => autenticado ? true : router.createUrlTree(['/login'])),
  );
};