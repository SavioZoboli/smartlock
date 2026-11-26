import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../app/services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req.clone({ withCredentials: true })).pipe(
    catchError((err) => {
      if (err.status === 401) {
        authService.limparSessao();
        const urlAtual = router.url;
        const isAuthMe = req.url.includes('/api/auth/me');
        const emTelaPublica =
          urlAtual.startsWith('/login') || urlAtual.startsWith('/concluir-cadastro');

        if (!isAuthMe && !emTelaPublica) {
          router.navigate(['/login']);
        }
      }
      return throwError(() => err);
    }),
  );
};