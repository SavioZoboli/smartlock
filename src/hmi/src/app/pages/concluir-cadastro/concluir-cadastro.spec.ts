import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ConcluirCadastro } from './concluir-cadastro';
import { AuthService } from '../../services/auth.service';
import { UnidadeService } from '../../services/unidade.service';
import { SystemNotificationService } from '../../services/system-notification.service';

describe('ConcluirCadastro', () => {
  let component: ConcluirCadastro;
  let fixture: ComponentFixture<ConcluirCadastro>;
  let router: Router;
  let navigate: ReturnType<typeof vi.spyOn>;

  const unidade = { id: 5, nome: 'Matriz', regiao: { nome: 'Sul' } };
  const authMock = { finalizarCadastro: vi.fn(), logout: vi.fn() };
  const unidadeMock = { listAll: vi.fn(() => of([unidade])) };
  const snsMock = { notificar: vi.fn(), notificarErro: vi.fn() };

  const dadosGoogle = {
    nome: 'Ana Maria Souza',
    email: 'ana@empresa.com',
    avatar: 'avatar.png',
    signupToken: 'signup-123',
  };

  async function montar(state: any) {
    await TestBed.configureTestingModule({
      imports: [ConcluirCadastro],
      providers: [
        { provide: AuthService, useValue: authMock },
        { provide: UnidadeService, useValue: unidadeMock },
        { provide: SystemNotificationService, useValue: snsMock },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'currentNavigation').mockReturnValue(
      state ? ({ extras: { state } } as any) : null,
    );
    navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(ConcluirCadastro);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  }

  beforeEach(() => vi.clearAllMocks());

  it('sem signupToken, redireciona para /login', async () => {
    await montar({ nome: 'Ana' });

    expect(navigate).toHaveBeenCalledWith(['/login']);
    expect(unidadeMock.listAll).not.toHaveBeenCalled();
  });

  it('sem state de navegação, redireciona para /login', async () => {
    await montar(null);

    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  describe('com dados do Google', () => {
    beforeEach(async () => await montar(dadosGoogle));

    it('pré-preenche nome, sobrenome (último nome) e e-mail', () => {
      const raw = component.userForm.getRawValue();
      expect(raw.nome).toBe('Ana Maria');
      expect(raw.sobrenome).toBe('Souza');
      expect(raw.email).toBe('ana@empresa.com');
    });

    it('mantém o e-mail desabilitado', () => {
      expect(component.userForm.get('email')!.disabled).toBe(true);
    });

    it('carrega as unidades para o autocomplete', () => {
      expect(unidadeMock.listAll).toHaveBeenCalled();
    });

    it.each([
      ['1234', false],
      ['123456', false],
      ['12a45', false],
      ['12345', true],
    ])('matrícula "%s" válida = %s', (valor, valido) => {
      const ctrl = component.userForm.get('matricula')!;
      ctrl.setValue(valor);
      expect(ctrl.valid).toBe(valido);
    });

    it('unidade digitada como texto (não selecionada) é inválida', () => {
      const ctrl = component.userForm.get('unidade')!;
      ctrl.setValue('Matriz');
      expect(ctrl.valid).toBe(false);

      ctrl.setValue(unidade);
      expect(ctrl.valid).toBe(true);
    });

    it('formulário inválido não envia e notifica o usuário', () => {
      component.salvar();

      expect(authMock.finalizarCadastro).not.toHaveBeenCalled();
      expect(snsMock.notificar).toHaveBeenCalledWith('Por favor, verifique os campos.', 'erro');
      expect(component.userForm.get('matricula')!.touched).toBe(true);
    });

    it('envia payload com campos aparados, unidade_id, signupToken e avatar', () => {
      authMock.finalizarCadastro.mockReturnValue(of({}));
      component.userForm.patchValue({
        nome: '  Ana Maria ',
        sobrenome: ' Souza ',
        matricula: '12345',
        uuid: ' ABC ',
        unidade,
      });

      component.salvar();

      expect(authMock.finalizarCadastro).toHaveBeenCalledWith({
        nome: 'Ana Maria',
        sobrenome: 'Souza',
        uuid: 'ABC',
        matricula: '12345',
        unidade_id: 5,
        email: 'ana@empresa.com',
        signupToken: 'signup-123',
        avatar: 'avatar.png',
      });
      expect(navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('erro ao finalizar cadastro notifica e permanece na página', () => {
      const erro = { status: 400 };
      authMock.finalizarCadastro.mockReturnValue(throwError(() => erro));
      component.userForm.patchValue({ matricula: '12345', unidade });

      component.salvar();

      expect(snsMock.notificarErro).toHaveBeenCalledWith(erro, 'Erro ao finalizar cadastro');
      expect(navigate).not.toHaveBeenCalledWith(['/dashboard']);
    });

    it('cancelar efetua logout na API e volta ao login', () => {
      authMock.logout.mockReturnValue(of(undefined));

      component.cancelar();

      expect(authMock.logout).toHaveBeenCalled();
      expect(navigate).toHaveBeenCalledWith(['/login']);
    });

    it('cancelar volta ao login mesmo se o logout falhar', () => {
      authMock.logout.mockReturnValue(throwError(() => new Error('offline')));

      component.cancelar();

      expect(navigate).toHaveBeenCalledWith(['/login']);
    });
  });
});
