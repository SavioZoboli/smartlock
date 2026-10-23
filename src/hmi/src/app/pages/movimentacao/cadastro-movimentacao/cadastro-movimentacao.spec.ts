import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideRouter, Router } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatDialog } from '@angular/material/dialog';
import { CadastroMovimentacao } from './cadastro-movimentacao';
import { UnidadeService } from '../../../services/unidade.service';
import { SmartlockService } from '../../../services/smartlock.service';
import { EquipamentoService } from '../../../services/equipamento.service';
import { MovimentacaoService } from '../../../services/movimentacao.service';
import { ReservaService } from '../../../services/reserva.service';
import { SystemNotificationService } from '../../../services/system-notification.service';

describe('CadastroMovimentacao', () => {
  let component: CadastroMovimentacao;
  let fixture: ComponentFixture<CadastroMovimentacao>;
  let mockMovimentacaoService: any;
  let mockReservaService: any;
  let mockEquipamentoService: any;
  let mockSmartlockService: any;
  let mockUnidadeService: any;
  let mockDialog: any;
  let mockSns: any;

  const mockEquipamentos = [
    {
      id: 1,
      apelido: 'Notebook Dell',
      patrimonio: 'PAT-001',
      tipo: 'NOTEBOOK',
      status_atual: 'DISPONIVEL',
    },
    {
      id: 2,
      apelido: 'Mouse Logitech',
      patrimonio: 'PAT-002',
      tipo: 'MOUSE',
      status_atual: 'DISPONIVEL',
    },
    {
      id: 3,
      apelido: 'Tablet iPad',
      patrimonio: 'PAT-003',
      tipo: 'TABLET',
      status_atual: 'DISPONIVEL',
    },
  ];

  const mockReservaVigente = {
    id: 10,
    usuario_id: 1,
    smartlock_id: 5,
    reserva_inicio: new Date().toISOString(),
    reserva_fim: new Date(Date.now() + 3600000).toISOString(),
    situacao: 'AGENDADO',
    equipamentos: [
      { id: 1, apelido: 'Notebook Dell', patrimonio: 'PAT-001' },
      { id: 2, apelido: 'Mouse Logitech', patrimonio: 'PAT-002' },
    ],
  };

  beforeEach(async () => {
    mockUnidadeService = {
      listAll: vi.fn().mockReturnValue(of([{ id: 1, nome: 'Unidade Matriz' }])),
    };
    mockSmartlockService = {
      listByUnidade: vi.fn().mockReturnValue(of([{ id: 5, apelido: 'Armário TI' }])),
    };
    mockEquipamentoService = {
      listBySmartlock: vi.fn().mockReturnValue(of(mockEquipamentos)),
    };
    mockReservaService = {
      getReservaVigente: vi.fn().mockReturnValue(
        of({
          reservaUsuario: mockReservaVigente,
          equipamentosReservadosOutros: [3],
        }),
      ),
    };
    mockMovimentacaoService = {
      create: vi.fn().mockReturnValue(of({ id_movimento: 99 })),
    };
    mockSns = {
      notificar: vi.fn(),
      notificarErro: vi.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [CadastroMovimentacao],
      providers: [
        provideRouter([{ path: 'movimentacoes/lista', component: class {} }]),
        provideAnimationsAsync(),
        { provide: UnidadeService, useValue: mockUnidadeService },
        { provide: SmartlockService, useValue: mockSmartlockService },
        { provide: EquipamentoService, useValue: mockEquipamentoService },
        { provide: ReservaService, useValue: mockReservaService },
        { provide: MovimentacaoService, useValue: mockMovimentacaoService },
        { provide: SystemNotificationService, useValue: mockSns },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CadastroMovimentacao);
    component = fixture.componentInstance;
    vi.spyOn((component as any).dialog, 'open').mockReturnValue({
      afterClosed: () => of(true),
    } as any);
    fixture.detectChanges();
  });

  it('deve ser instanciado corretamente', () => {
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
