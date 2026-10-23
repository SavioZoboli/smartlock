import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';

import { CadastroReserva } from './cadastro-reserva';
import { UnidadeService } from '../../../services/unidade.service';
import { SmartlockService } from '../../../services/smartlock.service';
import { EquipamentoService } from '../../../services/equipamento.service';
import { ReservaService } from '../../../services/reserva.service';
import { SystemNotificationService } from '../../../services/system-notification.service';

/** Aguarda as promises/microtasks da inicialização assíncrona do componente. */
const aguardar = () => new Promise((r) => setTimeout(r));

/** Data de amanhã (meia-noite local) + `dias`, para garantir período no futuro. */
function diaFuturo(dias = 1): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + dias);
  return d;
}

describe('CadastroReserva', () => {
  let component: CadastroReserva;
  let fixture: ComponentFixture<CadastroReserva>;
  let navigate: ReturnType<typeof vi.spyOn>;

  const unidadeA = { id: 1, nome: 'Matriz', regional: 'Sul' };
  const unidadeB = { id: 2, nome: 'Filial', regional: 'Norte' };
  const smartlockA = { id: 10, apelido: 'Armário TI', unidade_id: 1 };
  const smartlockB = { id: 11, apelido: 'Recepção', unidade_id: 1 };

  const equipamentosApi = [
    { id: 100, apelido: 'Notebook 1', patrimonio: 'P100', reservas: [] },
    { id: 101, apelido: 'Notebook 2', patrimonio: 'P101', reservas: [] },
    {
      id: 102,
      apelido: 'Projetor',
      patrimonio: 'P102',
      reservas: [
        {
          reserva_inicio: '2030-01-01T10:00:00.000Z',
          reserva_fim: '2030-01-01T12:00:00.000Z',
          usuario: { nome: 'Outro', sobrenome: 'Usuário' },
        },
      ],
    },
  ];

  let unidadeMock: { listAll: ReturnType<typeof vi.fn> };
  let smartlockMock: { listByUnidade: ReturnType<typeof vi.fn> };
  let equipamentoMock: { buscarDisponveisData: ReturnType<typeof vi.fn> };
  let reservaMock: {
    getById: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  let snsMock: { notificar: ReturnType<typeof vi.fn>; notificarErro: ReturnType<typeof vi.fn> };

  async function montar(reservaId?: number) {
    const providers: any[] = [
      { provide: UnidadeService, useValue: unidadeMock },
      { provide: SmartlockService, useValue: smartlockMock },
      { provide: EquipamentoService, useValue: equipamentoMock },
      { provide: ReservaService, useValue: reservaMock },
      { provide: SystemNotificationService, useValue: snsMock },
    ];
    if (reservaId) {
      providers.push({
        provide: ActivatedRoute,
        useValue: { snapshot: { paramMap: convertToParamMap({ id: String(reservaId) }) } },
      });
    }

    await TestBed.configureTestingModule({ imports: [CadastroReserva], providers }).compileComponents();

    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(CadastroReserva);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await aguardar();
    await fixture.whenStable();
  }

  /** Preenche unidade, smartlock e um período válido no futuro (amanhã 10:00 → 12:00). */
  async function preencherFormularioValido() {
    component.reservaForm.get('unidade')!.setValue(unidadeA);
    await aguardar();
    component.reservaForm.patchValue({
      smartlock: smartlockA,
      data_emprestimo: diaFuturo(),
      hora_emprestimo: '10:00',
      data_devolucao: diaFuturo(),
      hora_devolucao: '12:00',
    });
    await aguardar();
  }

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    unidadeMock = { listAll: vi.fn(() => of([unidadeA, unidadeB])) };
    smartlockMock = { listByUnidade: vi.fn(() => of([smartlockA, smartlockB])) };
    equipamentoMock = { buscarDisponveisData: vi.fn(() => of(equipamentosApi)) };
    reservaMock = {
      getById: vi.fn(),
      create: vi.fn(() => of({})),
      update: vi.fn(() => of({})),
    };
    snsMock = { notificar: vi.fn(), notificarErro: vi.fn() };
  });

  afterEach(() => vi.restoreAllMocks());

  describe('nova reserva', () => {
    beforeEach(async () => await montar());

    it('carrega as unidades e habilita o formulário, com smartlock desabilitado', () => {
      expect(component.reserva_id).toBeNull();
      expect(unidadeMock.listAll).toHaveBeenCalled();
      expect(component.unidades).toEqual([unidadeA, unidadeB]);
      expect(component.isLoading()).toBe(false);
      expect(component.reservaForm.get('unidade')!.enabled).toBe(true);
      expect(component.reservaForm.get('smartlock')!.disabled).toBe(true);
      expect(reservaMock.getById).not.toHaveBeenCalled();
    });

    it('exibe o título "Nova Reserva" e o botão "Cadastrar Reserva"', () => {
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('h2')!.textContent).toContain('Nova Reserva');
      expect(el.querySelector('button[type=submit]')!.textContent).toContain('Cadastrar Reserva');
    });

    describe('seleção de unidade e smartlock', () => {
      it('ao selecionar uma unidade, carrega seus smartlocks e habilita o campo', async () => {
        component.reservaForm.get('unidade')!.setValue(unidadeA);
        await aguardar();

        expect(smartlockMock.listByUnidade).toHaveBeenCalledWith(1);
        expect(component.smartlocks).toEqual([smartlockA, smartlockB]);
        expect(component.reservaForm.get('smartlock')!.enabled).toBe(true);
      });

      it('unidade digitada como texto (sem selecionar) mantém smartlock desabilitado e é inválida', async () => {
        component.reservaForm.get('unidade')!.setValue('Matr');
        await aguardar();

        expect(smartlockMock.listByUnidade).not.toHaveBeenCalled();
        expect(component.reservaForm.get('smartlock')!.disabled).toBe(true);
        expect(component.reservaForm.get('unidade')!.hasError('objetoInvalido')).toBe(true);
      });

      it('trocar a unidade limpa o smartlock e a seleção de equipamentos', async () => {
        await preencherFormularioValido();
        component.toggleEquipamento(component.equipamentosDisponiveis()[0]);
        expect(component.equipamentosSelecionados.size).toBe(1);

        component.reservaForm.get('unidade')!.setValue(unidadeB);
        await aguardar();

        expect(component.reservaForm.get('smartlock')!.value).toBe('');
        expect(component.equipamentosSelecionados.size).toBe(0);
        expect(smartlockMock.listByUnidade).toHaveBeenLastCalledWith(2);
      });

      // BUG conhecido: em initReacaoUnidade, `smartlockControl.enable()` roda antes de
      // `setValue('')`. O enable() faz o form emitir valueChanges ainda com o smartlock
      // ANTIGO e válido, disparando uma busca de equipamentos do smartlock anterior.
      // Com HTTP real, essa resposta pode chegar depois da busca do novo smartlock e
      // sobrescrever a lista. Quando o bug for corrigido, remova o `.fails`.
      it.fails('trocar a unidade não busca equipamentos do smartlock anterior', async () => {
        await preencherFormularioValido();
        const chamadasAntes = equipamentoMock.buscarDisponveisData.mock.calls.length;

        component.reservaForm.get('unidade')!.setValue(unidadeB);
        await aguardar();

        expect(equipamentoMock.buscarDisponveisData.mock.calls.length).toBe(chamadasAntes);
        expect(component.equipamentosDisponiveis()).toEqual([]);
      });

      it('limpar a unidade desabilita o smartlock', async () => {
        component.reservaForm.get('unidade')!.setValue(unidadeA);
        await aguardar();
        component.reservaForm.get('unidade')!.setValue('');
        await aguardar();

        expect(component.reservaForm.get('smartlock')!.disabled).toBe(true);
      });

      it('erro ao carregar smartlocks notifica o usuário', async () => {
        smartlockMock.listByUnidade.mockReturnValue(throwError(() => new Error('x')));

        component.reservaForm.get('unidade')!.setValue(unidadeA);
        await aguardar();

        expect(snsMock.notificarErro).toHaveBeenCalledWith(
          expect.anything(),
          'Erro ao carregar smartlocks da unidade.',
        );
      });
    });

    describe('validação do período', () => {
      it.each(['25:00', '12:60', 'ab:cd'])('hora "%s" é inválida', (hora) => {
        const ctrl = component.reservaForm.get('hora_emprestimo')!;
        ctrl.setValue(hora);
        expect(ctrl.valid).toBe(false);
      });

      it.each(['00:00', '09:30', '23:59'])('hora "%s" é válida', (hora) => {
        const ctrl = component.reservaForm.get('hora_emprestimo')!;
        ctrl.setValue(hora);
        expect(ctrl.valid).toBe(true);
      });

      it('a máscara HH:mm formata horas digitadas sem ":" (ex: 0930 → 09:30)', () => {
        const ctrl = component.reservaForm.get('hora_emprestimo')!;
        ctrl.setValue('0930');
        expect(ctrl.value).toBe('09:30');
        expect(ctrl.valid).toBe(true);
      });

      it('devolução antes do empréstimo (no futuro) marca periodoInvalido', () => {
        component.reservaForm.patchValue({
          data_emprestimo: diaFuturo(),
          hora_emprestimo: '15:00',
          data_devolucao: diaFuturo(),
          hora_devolucao: '10:00',
        });

        expect(component.reservaForm.hasError('periodoInvalido')).toBe(true);
      });

      it('devolução em dia posterior com hora menor é válida', () => {
        component.reservaForm.patchValue({
          data_emprestimo: diaFuturo(1),
          hora_emprestimo: '15:00',
          data_devolucao: diaFuturo(2),
          hora_devolucao: '10:00',
        });

        expect(component.reservaForm.hasError('periodoInvalido')).toBe(false);
      });
    });

    describe('equipamentos disponíveis', () => {
      it('só busca equipamentos quando o formulário inteiro está válido', async () => {
        component.reservaForm.get('unidade')!.setValue(unidadeA);
        await aguardar();
        component.reservaForm.patchValue({ smartlock: smartlockA, data_emprestimo: diaFuturo() });
        await aguardar();

        expect(equipamentoMock.buscarDisponveisData).not.toHaveBeenCalled();
      });

      it('busca com o id do smartlock e as datas/horas combinadas', async () => {
        await preencherFormularioValido();

        const [smartlockId, inicio, fim] = equipamentoMock.buscarDisponveisData.mock.lastCall!;
        const esperadoInicio = diaFuturo();
        esperadoInicio.setHours(10, 0);
        const esperadoFim = diaFuturo();
        esperadoFim.setHours(12, 0);

        expect(smartlockId).toBe(10);
        expect((inicio as Date).getTime()).toBe(esperadoInicio.getTime());
        expect((fim as Date).getTime()).toBe(esperadoFim.getTime());
      });

      it('normaliza as datas das reservas dos equipamentos para Date', async () => {
        await preencherFormularioValido();

        const lista = component.equipamentosDisponiveis();
        expect(lista.length).toBe(3);
        expect(lista[2].reservas[0].reserva_inicio).toBeInstanceOf(Date);
        expect(component.carregandoEquipamentos()).toBe(false);
      });

      it('erro na busca notifica o usuário e encerra o carregamento', async () => {
        equipamentoMock.buscarDisponveisData.mockReturnValue(throwError(() => new Error('x')));

        await preencherFormularioValido();

        expect(snsMock.notificarErro).toHaveBeenCalledWith(
          expect.anything(),
          'Erro ao carregar equipamentos disponíveis.',
        );
        expect(component.carregandoEquipamentos()).toBe(false);
      });

      it('renderiza um card por equipamento, marcando o reservado por outro', async () => {
        await preencherFormularioValido();
        fixture.detectChanges();

        const cards = fixture.nativeElement.querySelectorAll('.equipamento-card');
        expect(cards.length).toBe(3);
        expect(cards[2].classList.contains('reservado')).toBe(true);
      });
    });

    describe('seleção de equipamentos', () => {
      beforeEach(async () => await preencherFormularioValido());

      it('toggleEquipamento seleciona e desseleciona', () => {
        const notebook = component.equipamentosDisponiveis()[0];

        component.toggleEquipamento(notebook);
        expect(component.isSelecionado(notebook)).toBe(true);

        component.toggleEquipamento(notebook);
        expect(component.isSelecionado(notebook)).toBe(false);
      });

      it('não permite selecionar equipamento reservado por outra reserva', () => {
        const projetor = component.equipamentosDisponiveis()[2];

        expect(component.isReservadoPorOutro(projetor)).toBe(true);
        component.toggleEquipamento(projetor);
        expect(component.isSelecionado(projetor)).toBe(false);
      });

      it('selecionarTodos ignora os reservados por outros e marca todosSelecionados', () => {
        component.selecionarTodos();

        expect([...component.equipamentosSelecionados]).toEqual([100, 101]);
        expect(component.todosSelecionados).toBe(true);
      });

      it('limparSelecao remove todos os selecionados', () => {
        component.selecionarTodos();
        component.limparSelecao();

        expect(component.nenhumEquipamentoSelecionado).toBe(true);
        expect(component.todosSelecionados).toBe(false);
      });

      it('alterar o período recarrega os equipamentos e limpa a seleção', async () => {
        component.selecionarTodos();
        const chamadasAntes = equipamentoMock.buscarDisponveisData.mock.calls.length;

        component.reservaForm.get('hora_devolucao')!.setValue('13:00');
        await aguardar();

        // Observação: hoje são feitas 2 chamadas por alteração de hora (o ngx-mask
        // reemite o valor), por isso o teste não fixa a quantidade exata.
        expect(equipamentoMock.buscarDisponveisData.mock.calls.length).toBeGreaterThan(chamadasAntes);
        expect(component.nenhumEquipamentoSelecionado).toBe(true);
      });
    });

    describe('salvar', () => {
      it('formulário vazio não envia e pede para verificar os campos', async () => {
        await preencherFormularioValido();
        component.selecionarTodos();
        component.reservaForm.get('hora_emprestimo')!.setValue('');

        component.salvar();

        expect(reservaMock.create).not.toHaveBeenCalled();
        expect(snsMock.notificar).toHaveBeenCalledWith('Por favor, verifique os campos.', 'erro');
        expect(component.reservaForm.get('hora_emprestimo')!.touched).toBe(true);
      });

      it('sem equipamento selecionado não envia e avisa o usuário', async () => {
        await preencherFormularioValido();

        component.salvar();

        expect(reservaMock.create).not.toHaveBeenCalled();
        expect(component.tentouSalvarSemEquipamento).toBe(true);
        expect(snsMock.notificar).toHaveBeenCalledWith('Selecione ao menos um equipamento.', 'erro');
      });

      it('período invertido não envia e avisa o usuário', async () => {
        await preencherFormularioValido();
        component.reservaForm.patchValue({ hora_emprestimo: '15:00', hora_devolucao: '10:00' });

        component.salvar();

        expect(reservaMock.create).not.toHaveBeenCalled();
        expect(snsMock.notificar).toHaveBeenCalledWith(
          'A devolução deve ser depois do empréstimo.',
          'erro',
        );
      });

      it('botão de envio fica desabilitado sem equipamento selecionado', async () => {
        await preencherFormularioValido();
        await fixture.whenStable();
        const botao = () =>
          fixture.nativeElement.querySelector('button[type=submit]') as HTMLButtonElement;
        expect(botao().disabled).toBe(true);

        component.selecionarTodos();
        // equipamentosSelecionados é um Set (não signal): é preciso marcar a view.
        fixture.changeDetectorRef.markForCheck();
        await fixture.whenStable();
        expect(botao().disabled).toBe(false);
      });

      it('cria a reserva com smartlock, datas combinadas e equipamentos selecionados', async () => {
        await preencherFormularioValido();
        component.selecionarTodos();

        component.salvar();

        expect(reservaMock.create).toHaveBeenCalledTimes(1);
        const [smartlockId, inicio, fim, equipamentos] = reservaMock.create.mock.lastCall!;
        expect(smartlockId).toBe(10);
        expect((inicio as Date).getHours()).toBe(10);
        expect((fim as Date).getHours()).toBe(12);
        expect(equipamentos).toEqual([100, 101]);
        expect(reservaMock.update).not.toHaveBeenCalled();
        expect(snsMock.notificar).toHaveBeenCalledWith('Reserva cadastrada com sucesso!', 'sucesso');
        expect(navigate).toHaveBeenCalledWith(['/reservas/lista']);
      });

      it('erro da API notifica, encerra o loading e reabilita o formulário', async () => {
        const erro = { status: 409, message: 'Conflito' };
        reservaMock.create.mockReturnValue(throwError(() => erro));
        await preencherFormularioValido();
        component.selecionarTodos();

        component.salvar();

        expect(snsMock.notificarErro).toHaveBeenCalledWith(erro);
        expect(component.isLoading()).toBe(false);
        expect(component.reservaForm.enabled).toBe(true);
        expect(navigate).not.toHaveBeenCalled();
      });
    });

    it('cancelar volta para a lista de reservas', () => {
      component.onCancelar();
      expect(navigate).toHaveBeenCalledWith(['/reservas/lista']);
    });
  });

  describe('erro ao carregar unidades', () => {
    it('notifica o usuário e mantém o formulário utilizável', async () => {
      // O UnidadeService real (CachedResource) nunca propaga erro; aqui simulamos só
      // a primeira chamada falhando para cobrir o catch de carregarUnidades.
      unidadeMock.listAll
        .mockReturnValueOnce(throwError(() => new Error('offline')))
        .mockReturnValue(of([]));

      await montar();

      expect(snsMock.notificarErro).toHaveBeenCalledWith(
        expect.anything(),
        'Erro ao carregar unidades.',
      );
      expect(component.isLoading()).toBe(false);
      expect(component.reservaForm.get('unidade')!.enabled).toBe(true);
    });
  });

  describe('edição de reserva', () => {
    const inicio = diaFuturo();
    inicio.setHours(9, 30);
    const fim = diaFuturo();
    fim.setHours(17, 15);

    const reservaApi = {
      id: 7,
      unidade_id: 1,
      smartlock_id: 11,
      data_hora_emprestimo: inicio.toISOString(),
      data_hora_devolucao_prevista: fim.toISOString(),
      // O Projetor (102) aparece com reserva, mas é DESTA reserva
      equipamentos: [{ id: 101 }, { id: 102 }],
    };

    beforeEach(() => reservaMock.getById.mockReturnValue(of(reservaApi)));

    it('carrega a reserva e preenche unidade, smartlock e período', async () => {
      await montar(7);
      const form = component.reservaForm;

      expect(component.reserva_id).toBe(7);
      expect(reservaMock.getById).toHaveBeenCalledWith(7);
      expect(form.get('unidade')!.value).toEqual(unidadeA);
      expect(form.get('smartlock')!.value).toEqual(smartlockB);
      expect(form.get('hora_emprestimo')!.value).toBe('09:30');
      expect(form.get('hora_devolucao')!.value).toBe('17:15');
      expect(form.enabled).toBe(true);
    });

    it('marca como selecionados os equipamentos já vinculados à reserva', async () => {
      await montar(7);

      expect([...component.equipamentosSelecionados].sort()).toEqual([101, 102]);
    });

    it('equipamento com reserva da própria reserva não é tratado como "reservado por outro"', async () => {
      await montar(7);
      const projetor = component.equipamentosDisponiveis().find((e) => e.id === 102)!;

      expect(component.isReservadoPorOutro(projetor)).toBe(false);
    });

    it('busca os equipamentos uma única vez durante o carregamento', async () => {
      await montar(7);

      expect(equipamentoMock.buscarDisponveisData).toHaveBeenCalledTimes(1);
      expect(equipamentoMock.buscarDisponveisData.mock.lastCall![0]).toBe(11);
    });

    it('exibe o título "Editar Reserva"', async () => {
      await montar(7);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('h2').textContent).toContain('Editar Reserva');
    });

    it('salvar chama update com o id da reserva e notifica "atualizada"', async () => {
      await montar(7);

      component.salvar();

      expect(reservaMock.update).toHaveBeenCalledTimes(1);
      const [id, dtInicio, dtFim, equipamentos] = reservaMock.update.mock.lastCall!;
      expect(id).toBe(7);
      expect((dtInicio as Date).getTime()).toBe(inicio.getTime());
      expect((dtFim as Date).getTime()).toBe(fim.getTime());
      expect([...equipamentos].sort()).toEqual([101, 102]);
      expect(reservaMock.create).not.toHaveBeenCalled();
      expect(snsMock.notificar).toHaveBeenCalledWith('Reserva atualizada com sucesso!', 'sucesso');
      expect(navigate).toHaveBeenCalledWith(['/reservas/lista']);
    });

    it('reserva inexistente notifica o usuário', async () => {
      reservaMock.getById.mockReturnValue(throwError(() => ({ status: 404 })));

      await montar(7);

      expect(snsMock.notificarErro).toHaveBeenCalledWith(
        expect.anything(),
        'Erro ao carregar reserva. Ela pode não existir.',
      );
      expect(component.isLoading()).toBe(false);
    });
  });
});
