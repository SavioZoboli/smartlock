import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { LoginComponent } from './login';
import { AuthService } from '../../services/auth.service';
import { GoogleIdentityService } from '../../services/google-identity.service';
import { SystemNotificationService } from '../../services/system-notification.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let navigate: ReturnType<typeof vi.spyOn>;

  const googleMock = { accounts: { id: { initialize: vi.fn(), renderButton: vi.fn() } } };
  const authMock = { validarGoogleAuth: vi.fn() };
  const gisMock = { aguardarCarregamento: vi.fn() };
  const snsMock = { notificar: vi.fn(), notificarErro: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    (globalThis as any).google = googleMock;
    gisMock.aguardarCarregamento.mockResolvedValue('client-id');

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: authMock },
        { provide: GoogleIdentityService, useValue: gisMock },
        { provide: SystemNotificationService, useValue: snsMock },
      ],
    }).compileComponents();

    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => delete (globalThis as any).google);

  it('inicializa o Google Identity com o client_id vindo da API', () => {
    expect(googleMock.accounts.id.initialize).toHaveBeenCalledWith(
      expect.objectContaining({ client_id: 'client-id' }),
    );
    expect(component.carregandoGoogle()).toBe(false);
  });

  it('notifica erro quando o SDK/token do Google não carrega', async () => {
    gisMock.aguardarCarregamento.mockRejectedValue(new Error('timeout'));

    await component.ngOnInit();

    expect(snsMock.notificar).toHaveBeenCalledWith(
      'Não foi possível carregar o login com Google',
      'erro',
    );
    expect(component.carregandoGoogle()).toBe(false);
  });

  it('não quebra ao renderizar o botão antes do SDK do Google carregar', () => {
    delete (globalThis as any).google;

    expect(() => component.renderizarBotao('dark')).not.toThrow();
  });

  it('usuário já cadastrado é redirecionado ao dashboard', () => {
    authMock.validarGoogleAuth.mockReturnValue(of({ cadastrado: true }));

    component.handleCredentialResponse({ credential: 'jwt-google' });

    expect(authMock.validarGoogleAuth).toHaveBeenCalledWith('jwt-google');
    expect(navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('usuário novo é redirecionado para concluir cadastro com os dados do Google', () => {
    authMock.validarGoogleAuth.mockReturnValue(
      of({
        cadastrado: false,
        signupToken: 'signup-123',
        userData: { nome: 'Ana Souza', email: 'ana@empresa.com', avatar: 'a.png' },
      }),
    );

    component.handleCredentialResponse({ credential: 'jwt-google' });

    expect(navigate).toHaveBeenCalledWith(['/concluir-cadastro'], {
      state: {
        nome: 'Ana Souza',
        email: 'ana@empresa.com',
        avatar: 'a.png',
        signupToken: 'signup-123',
      },
    });
  });

  it('erro na validação do backend notifica o usuário e não navega', () => {
    const erro = { status: 500 };
    authMock.validarGoogleAuth.mockReturnValue(throwError(() => erro));

    component.handleCredentialResponse({ credential: 'jwt-google' });

    expect(snsMock.notificarErro).toHaveBeenCalledWith(erro, 'Erro ao validar a autenticação');
    expect(navigate).not.toHaveBeenCalled();
  });
});
