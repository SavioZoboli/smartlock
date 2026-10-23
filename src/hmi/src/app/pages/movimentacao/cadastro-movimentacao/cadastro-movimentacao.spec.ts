import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { CadastroMovimentacao } from './cadastro-movimentacao';
import { UnidadeService } from '../../../services/unidade.service';
import { SmartlockService } from '../../../services/smartlock.service';
import { EquipamentoService } from '../../../services/equipamento.service';
import { MovimentacaoService } from '../../../services/movimentacao.service';
import { SystemNotificationService } from '../../../services/system-notification.service';

describe('CadastroMovimentacao', () => {
  let component: CadastroMovimentacao;
  let fixture: ComponentFixture<CadastroMovimentacao>;
  let snsMock: { notificar: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    snsMock = { notificar: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [CadastroMovimentacao],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: UnidadeService, useValue: { listAll: () => of([]) } },
        { provide: SmartlockService, useValue: { listByUnidade: () => of([]) } },
        { provide: EquipamentoService, useValue: { listBySmartlock: () => of([]) } },
        { provide: MovimentacaoService, useValue: { create: () => of({}) } },
        { provide: SystemNotificationService, useValue: snsMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CadastroMovimentacao);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should disable scanner until unidade and smartlock are selected', () => {
    expect(component.isScannerDisabled).toBe(true);

    component.movForm.get('unidade')?.setValue({ id: 1, nome: 'Unidade A', regional: 'Sul' });
    component.movForm.get('smartlock')?.enable();
    component.movForm.get('smartlock')?.setValue(10);

    expect(component.isScannerDisabled).toBe(false);
  });

  it('should select equipment and infer movement type when barcode is scanned', () => {
    component.equipamentos = [
      {
        id: 1,
        apelido: 'Notebook 01',
        patrimonio: '100200',
        tipo: 'Notebook',
        status_atual: 'DISPONIVEL',
        selecionado: false,
      },
    ];

    component.onCodigoBarrasLido('100200');

    expect(component.equipamentosSelecionados.length).toBe(1);
    expect(component.equipamentosSelecionados[0].patrimonio).toBe('100200');
    expect(component.movForm.get('tipo_movimento')?.value).toBe('emprestimo_manual');
  });

  it('should allow removing equipment from review list', () => {
    const eq = {
      id: 1,
      apelido: 'Notebook 01',
      patrimonio: '100200',
      tipo: 'Notebook',
      status_atual: 'DISPONIVEL' as const,
      selecionado: true,
    };
    component.equipamentos = [eq];

    component.removerEquipamentoRevisao(eq);

    expect(component.equipamentosSelecionados.length).toBe(0);
  });
});
