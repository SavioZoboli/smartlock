import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { Observable, firstValueFrom, isObservable, of } from 'rxjs';
import { adminGuard, authGuard } from './auth.guard';
import { AuthService } from '../app/services/auth.service';

describe('Guards de autenticação', () => {
  let authMock: { usuarioAtual: any; verificarSessao: ReturnType<typeof vi.fn> };

  const executar = async (guard: typeof authGuard) => {
    const res = TestBed.runInInjectionContext(() => guard({} as any, {} as any));
    return isObservable(res) ? firstValueFrom(res as Observable<any>) : res;
  };

  const urlDe = (res: unknown) => TestBed.inject(Router).serializeUrl(res as UrlTree);

  beforeEach(() => {
    authMock = { usuarioAtual: null, verificarSessao: vi.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: authMock }],
    });
  });

  describe('authGuard', () => {
    it('libera sem chamar a API quando já existe usuário em memória', async () => {
      authMock.usuarioAtual = { nome: 'Ana', is_admin: false };

      expect(await executar(authGuard)).toBe(true);
      expect(authMock.verificarSessao).not.toHaveBeenCalled();
    });

    it('libera quando a sessão é válida na API', async () => {
      authMock.verificarSessao.mockReturnValue(of(true));

      expect(await executar(authGuard)).toBe(true);
    });

    it('redireciona para /login quando a sessão é inválida', async () => {
      authMock.verificarSessao.mockReturnValue(of(false));

      expect(urlDe(await executar(authGuard))).toBe('/login');
    });
  });

  describe('adminGuard', () => {
    it('redireciona para /login quando não há usuário', async () => {
      expect(urlDe(await executar(adminGuard))).toBe('/login');
    });

    it('redireciona para /not-allowed quando o usuário não é admin', async () => {
      authMock.usuarioAtual = { nome: 'Ana', is_admin: false };

      expect(urlDe(await executar(adminGuard))).toBe('/not-allowed');
    });

    it('libera quando o usuário é admin', async () => {
      authMock.usuarioAtual = { nome: 'Root', is_admin: true };

      expect(await executar(adminGuard)).toBe(true);
    });
  });
});

