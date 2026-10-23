import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SystemNotificationService } from './system-notification.service';

describe('SystemNotificationService', () => {
  let service: SystemNotificationService;
  const snackBar = { open: vi.fn() };

  beforeEach(() => {
    snackBar.open.mockReset();
    TestBed.configureTestingModule({
      providers: [{ provide: MatSnackBar, useValue: snackBar }],
    });
    service = TestBed.inject(SystemNotificationService);
  });

  it('notificação de sucesso usa a classe success-snackbar', () => {
    service.notificar('Salvo', 'sucesso');

    expect(snackBar.open).toHaveBeenCalledWith(
      'Salvo',
      'Fechar',
      expect.objectContaining({ panelClass: ['success-snackbar'], duration: 4000 }),
    );
  });

  it('notificação de erro usa a classe error-snackbar', () => {
    service.notificar('Falhou', 'erro');

    expect(snackBar.open).toHaveBeenCalledWith(
      'Falhou',
      'Fechar',
      expect.objectContaining({ panelClass: ['error-snackbar'] }),
    );
  });

  it('notificação do tipo info não lança erro', () => {
    expect(() => service.notificar('Aviso', 'info')).not.toThrow();
    expect(snackBar.open).toHaveBeenCalledTimes(1);
  });

  describe('notificarErro', () => {
    beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => {}));

    it('usa a mensagem informada', () => {
      service.notificarErro(new Error('técnica'), 'Mensagem amigável');
      expect(snackBar.open.mock.calls[0][0]).toBe('Mensagem amigável');
    });

    it('sem mensagem, usa err.message', () => {
      service.notificarErro(new Error('técnica'));
      expect(snackBar.open.mock.calls[0][0]).toBe('técnica');
    });

    it('sem mensagem e sem err.message, usa texto padrão', () => {
      service.notificarErro(null);
      expect(snackBar.open.mock.calls[0][0]).toBe('Erro inesperado');
    });
  });
});

