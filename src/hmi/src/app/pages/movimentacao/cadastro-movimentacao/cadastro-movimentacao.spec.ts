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

  it('deve carregar reserva vigente e marcar equipamentos ao selecionar smartlock', () => {
    component.movForm.get('unidade')?.setValue({ id: 1, nome: 'Unidade Matriz' });
    component.movForm.get('smartlock')?.setValue(5);

    expect(mockReservaService.getReservaVigente).toHaveBeenCalledWith(5);
    expect(component.reservaVigente).toEqual(mockReservaVigente);
    expect(component.equipamentosReservadosOutros).toEqual([3]);

    const eq1 = component.equipamentos.find((e) => e.id === 1);
    const eq2 = component.equipamentos.find((e) => e.id === 2);
    const eq3 = component.equipamentos.find((e) => e.id === 3);

    expect(eq1?.pertenceReserva).toBe(true);
    expect(eq2?.pertenceReserva).toBe(true);
    expect(eq3?.pertenceReserva).toBe(false);
    expect(eq3?.reservadoOutro).toBe(true);
  });

  it('deve selecionar itens da reserva do usuário através do botão de atalho', () => {
    component.movForm.get('unidade')?.setValue({ id: 1, nome: 'Unidade Matriz' });
    component.movForm.get('smartlock')?.setValue(5);
    component.movForm.get('tipo_movimento')?.setValue('emprestimo_manual');

    component.selecionarEquipamentosDaReserva();

    const eq1 = component.equipamentos.find((e) => e.id === 1);
    const eq2 = component.equipamentos.find((e) => e.id === 2);
    const eq3 = component.equipamentos.find((e) => e.id === 3);

    expect(eq1?.selecionado).toBe(true);
    expect(eq2?.selecionado).toBe(true);
    expect(eq3?.selecionado).toBe(false);
  });

  it('deve bloquear a seleção de equipamento reservado por outro usuário em empréstimo', () => {
    component.movForm.get('unidade')?.setValue({ id: 1, nome: 'Unidade Matriz' });
    component.movForm.get('smartlock')?.setValue(5);
    component.movForm.get('tipo_movimento')?.setValue('emprestimo_manual');

    const eq3 = component.equipamentos.find((e) => e.id === 3)!;
    expect(component.isEquipamentoBloqueado(eq3)).toBe(true);

    component.toggleEquipamento(eq3);
    expect(eq3.selecionado).toBeFalsy();
    expect(mockSns.notificar).toHaveBeenCalledWith(
      'Este equipamento está reservado por outro usuário.',
      'info',
    );
  });

  it('deve abrir modal ao realizar empréstimo parcial de itens reservados e passar remover_nao_retirados: true quando confirmado', () => {
    component.movForm.get('unidade')?.setValue({ id: 1, nome: 'Unidade Matriz' });
    component.movForm.get('smartlock')?.setValue(5);
    component.movForm.get('tipo_movimento')?.setValue('emprestimo_manual');

    // Seleciona apenas eq1, deixando eq2 (que também faz parte da reserva) de fora
    const eq1 = component.equipamentos.find((e) => e.id === 1)!;
    component.toggleEquipamento(eq1);

    vi.spyOn((component as any).dialog, 'open').mockReturnValue({
      afterClosed: () => of(true), // Usuário clica "Sim"
    } as any);

    component.salvar();

    expect((component as any).dialog.open).toHaveBeenCalled();
    const dialogArgs = (vi.mocked((component as any).dialog.open) as any).mock.calls[0][1];
    expect(dialogArgs.data.mensagem).toContain(
      'Você reservou os equipamentos Mouse Logitech mas não os retirou, deseja removê-los da reserva?',
    );

    expect(mockMovimentacaoService.create).toHaveBeenCalledWith(
      5,
      'emprestimo_manual',
      [1],
      { reserva_id: 10, remover_nao_retirados: true },
    );
  });

  it('deve passar remover_nao_retirados: false quando o usuário responde Não no modal de empréstimo parcial', () => {
    component.movForm.get('unidade')?.setValue({ id: 1, nome: 'Unidade Matriz' });
    component.movForm.get('smartlock')?.setValue(5);
    component.movForm.get('tipo_movimento')?.setValue('emprestimo_manual');

    const eq1 = component.equipamentos.find((e) => e.id === 1)!;
    component.toggleEquipamento(eq1);

    vi.spyOn((component as any).dialog, 'open').mockReturnValue({
      afterClosed: () => of(false), // Usuário clica "Não"
    } as any);

    component.salvar();

    expect(mockMovimentacaoService.create).toHaveBeenCalledWith(
      5,
      'emprestimo_manual',
      [1],
      { reserva_id: 10, remover_nao_retirados: false },
    );
  });

  it('não deve abrir modal se todos os itens reservados forem selecionados', () => {
    component.movForm.get('unidade')?.setValue({ id: 1, nome: 'Unidade Matriz' });
    component.movForm.get('smartlock')?.setValue(5);
    component.movForm.get('tipo_movimento')?.setValue('emprestimo_manual');

    component.selecionarEquipamentosDaReserva();
    component.salvar();

    expect((component as any).dialog.open).not.toHaveBeenCalled();
    expect(mockMovimentacaoService.create).toHaveBeenCalledWith(
      5,
      'emprestimo_manual',
      [1, 2],
      { reserva_id: 10, remover_nao_retirados: false },
    );
  });
});
