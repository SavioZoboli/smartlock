import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let ctrl: HttpTestingController;
  let navigate: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    ctrl = TestBed.inject(HttpTestingController);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  afterEach(() => ctrl.verify());

  it('adiciona withCredentials em todas as requisições', () => {
    http.get('/api/x').subscribe();

    const req = ctrl.expectOne('/api/x');
    expect(req.request.withCredentials).toBe(true);
    req.flush({});
  });

  it('redireciona para /login e repassa o erro em respostas 401', () => {
    const erro = vi.fn();
    http.get('/api/x').subscribe({ error: erro });

    ctrl.expectOne('/api/x').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(navigate).toHaveBeenCalledWith(['/login']);
    expect(erro).toHaveBeenCalledTimes(1);
    expect(erro.mock.calls[0][0].status).toBe(401);
  });

  it('não redireciona em outros erros (ex: 500)', () => {
    const erro = vi.fn();
    http.get('/api/x').subscribe({ error: erro });

    ctrl.expectOne('/api/x').flush(null, { status: 500, statusText: 'Server Error' });

    expect(navigate).not.toHaveBeenCalled();
    expect(erro).toHaveBeenCalledTimes(1);
  });
});

