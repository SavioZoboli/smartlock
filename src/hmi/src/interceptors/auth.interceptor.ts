import { HttpContextToken, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../app/services/auth.service';

const IS_REFRESH_RETRY = new HttpContextToken<boolean>(() => false);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const authReq = req.clone({ withCredentials: true });

  return next(authReq).pipe(
    catchError((err) => {
      if (err.status !== 401) {
        return throwError(() => err);
      }

      const isAuthFlowEndpoint =
        req.url.includes('/api/auth/refresh') ||
        req.url.includes('/api/auth/logout') ||
        (req.method === 'POST' && /\/api\/auth\/?$/.test(req.url));

      const jaTentouRenovar = req.context.get(IS_REFRESH_RETRY);

      if (!isAuthFlowEndpoint && !jaTentouRenovar) {
        return authService.renovarSessao().pipe(
          switchMap((renovado) => {
            if (renovado) {
              const retryReq = authReq.clone({
                context: authReq.context.set(IS_REFRESH_RETRY, true),
              });
              return next(retryReq);
            }

            authService.limparSessao();
            const urlAtual = router.url;
            const isAuthMe = req.url.includes('/api/auth/me');
            const emTelaPublica =
              urlAtual.startsWith('/login') || urlAtual.startsWith('/concluir-cadastro');

            if (!isAuthMe && !emTelaPublica) {
              router.navigate(['/login']);
            }
            return throwError(() => err);
          }),
        );
      }

      authService.limparSessao();
      const urlAtual = router.url;
      const isAuthMe = req.url.includes('/api/auth/me');
      const emTelaPublica =
        urlAtual.startsWith('/login') || urlAtual.startsWith('/concluir-cadastro');

      if (!isAuthMe && !emTelaPublica) {
        router.navigate(['/login']);
      }
      return throwError(() => err);
    }),
  );
};