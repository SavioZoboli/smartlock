// guards/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { asyncScheduler, map,  scheduled } from 'rxjs';
import { AuthService } from '../app/services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Se a sessão já foi verificada nesta navegação (ex: no bootstrap do app),
  // evita chamar a API de novo a cada troca de rota.
  if (authService.usuarioAtual) {
    return scheduled([true],asyncScheduler);
  }

  return authService.verificarSessao().pipe(
    map((autenticado) => autenticado ? true : router.createUrlTree(['/login'])),
  );
};

export const adminGuard:CanActivateFn = ()=>{
  const authService = inject(AuthService);
  const router = inject(Router);

  const usuario = authService.usuarioAtual
  if(!usuario){
    return router.createUrlTree(['/login'])
  }
  if(usuario.is_admin){
    return scheduled([true],asyncScheduler)
  }
  return router.createUrlTree(['/not-allowed'])
}