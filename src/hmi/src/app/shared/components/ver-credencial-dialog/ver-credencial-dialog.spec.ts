import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { SENHA_MASCARADA, VerCredencialDialog } from './ver-credencial-dialog';

describe('VerCredencialDialog', () => {
  let fixture: ComponentFixture<VerCredencialDialog>;
  let http: HttpTestingController;
  const dialogRef = { close: vi.fn() };

  const el = (): HTMLElement => fixture.nativeElement;
  const botao = (texto: string) =>
    Array.from(el().querySelectorAll('button')).find((b) => b.textContent?.trim().includes(texto));

  beforeEach(async () => {
    dialogRef.close.mockReset();
    await TestBed.configureTestingModule({
      imports: [VerCredencialDialog],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { equipamento_id: 7, descricao: 'Notebook 01' } },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(VerCredencialDialog);
    fixture.detectChanges();

    http
      .expectOne((r) => r.method === 'GET' && r.url.endsWith('/api/equipamento-credencial/equipamento/7'))
      .flush({ id: 1, equipamento_id: 7, login: 'admin', possui_senha: true });
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('exibe o login em texto puro e a senha mascarada por padrão', () => {
    expect(el().querySelector('[data-testid="login"]')?.textContent?.trim()).toBe('admin');
    expect(el().querySelector('[data-testid="senha"]')?.textContent?.trim()).toBe(SENHA_MASCARADA);
    expect(botao('Ver Senha')).toBeTruthy();
    expect(botao('Ok')).toBeFalsy();
  });

  it('"Ver Senha" consome o endpoint de revelação, injeta a senha e exibe "Ok" que fecha o dialog', () => {
    botao('Ver Senha')!.click();
    http
      .expectOne((r) => r.method === 'POST' && r.url.endsWith('/api/equipamento-credencial/equipamento/7/revelar'))
      .flush({ senha: 'S3nh@Secreta' });
    fixture.detectChanges();

    expect(el().querySelector('[data-testid="senha"]')?.textContent?.trim()).toBe('S3nh@Secreta');
    expect(botao('Ver Senha')).toBeFalsy();

    botao('Ok')!.click();
    expect(dialogRef.close).toHaveBeenCalled();
  });
});

