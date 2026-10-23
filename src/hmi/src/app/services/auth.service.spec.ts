import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { AuthService, UsuarioLogado } from './auth.service';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  const api = environment.api_url;

  const usuario: UsuarioLogado = {
    id: 1,
    nome: 'Ana',
    email: 'ana@empresa.com',
    avatar: '',
    is_admin: false,
    unidade_id: 10,
  };

  beforeEach(() => {
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('validarGoogleAuth envia o token para /api/auth com credenciais', () => {
    service.validarGoogleAuth('tok').subscribe();

    const req = http.expectOne(`${api}/api/auth`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ token: 'tok' });
    expect(req.request.withCredentials).toBe(true);
    req.flush({ cadastrado: true });
  });

  it('finalizarCadastro envia o payload para /api/usuario/finaliza-cadastro', () => {
    service.finalizarCadastro({ nome: 'Ana' }).subscribe();

    const req = http.expectOne(`${api}/api/usuario/finaliza-cadastro`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ nome: 'Ana' });
    req.flush({});
  });

  it('verificarSessao retorna true e guarda o usuário quando /me responde', async () => {
    const promessa = firstValueFrom(service.verificarSessao());

    const req = http.expectOne(`${api}/api/auth/me`);
    expect(req.request.withCredentials).toBe(true);
    req.flush(usuario);

    expect(await promessa).toBe(true);
    expect(service.usuarioAtual).toEqual(usuario);
  });

  it('verificarSessao retorna false e limpa o usuário quando /me falha', async () => {
    const promessa = firstValueFrom(service.verificarSessao());
    http.expectOne(`${api}/api/auth/me`).flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(await promessa).toBe(false);
    expect(service.usuarioAtual).toBeNull();
  });

  it('obterUsuarioAtual usa o valor em memória se já houver unidade_id', async () => {
    const p1 = firstValueFrom(service.verificarSessao());
    http.expectOne(`${api}/api/auth/me`).flush(usuario);
    await p1;

    const res = await firstValueFrom(service.obterUsuarioAtual());

    expect(res).toEqual(usuario);
    http.expectNone(`${api}/api/auth/me`);
  });

  it('obterUsuarioAtual consulta a API quando não há usuário em memória', async () => {
    const promessa = firstValueFrom(service.obterUsuarioAtual());
    http.expectOne(`${api}/api/auth/me`).flush(usuario);

    expect(await promessa).toEqual(usuario);
  });

  it('logout chama a API e limpa o usuário', async () => {
    const p1 = firstValueFrom(service.verificarSessao());
    http.expectOne(`${api}/api/auth/me`).flush(usuario);
    await p1;

    const promessa = firstValueFrom(service.logout(), { defaultValue: undefined });
    const req = http.expectOne(`${api}/api/auth/logout`);
    expect(req.request.method).toBe('POST');
    req.flush(null);
    await promessa;

    expect(service.usuarioAtual).toBeNull();
  });
});

