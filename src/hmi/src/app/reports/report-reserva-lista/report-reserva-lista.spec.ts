import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportReservaLista } from './report-reserva-lista';

describe('ReportReservaLista', () => {
  let component: ReportReservaLista;
  let fixture: ComponentFixture<ReportReservaLista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportReservaLista]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportReservaLista);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('deve formatar a classe da situação corretamente', () => {
    expect(component.obterClasseSituacao('EM USO')).toBe('em-uso');
    expect(component.obterClasseSituacao('FINALIZADO')).toBe('finalizado');
    expect(component.obterClasseSituacao('AGENDADO')).toBe('agendado');
    expect(component.obterClasseSituacao('PENDENTE')).toBe('pendente');
    expect(component.obterClasseSituacao(undefined)).toBe('');
  });

  it('deve exibir o botão de editar apenas se o status for AGENDADO', () => {
    fixture.componentRef.setInput('reservas', [
      {
        id: 1,
        situacao: 'AGENDADO',
        reserva_inicio: new Date().toISOString(),
        reserva_fim: new Date().toISOString(),
        smartlock: 'Locker 1',
        unidade: 'Unidade 1',
        regional: 'Regional 1',
        equipamentos: [],
      } as any,
      {
        id: 2,
        situacao: 'EM USO',
        reserva_inicio: new Date().toISOString(),
        reserva_fim: new Date().toISOString(),
        smartlock: 'Locker 1',
        unidade: 'Unidade 1',
        regional: 'Regional 1',
        equipamentos: [],
      } as any,
      {
        id: 3,
        situacao: 'FINALIZADO',
        reserva_inicio: new Date().toISOString(),
        reserva_fim: new Date().toISOString(),
        smartlock: 'Locker 1',
        unidade: 'Unidade 1',
        regional: 'Regional 1',
        equipamentos: [],
      } as any,
    ]);

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const rows = compiled.querySelectorAll('tr.custom-row');

    expect(rows.length).toBe(3);

    // Linha 1: AGENDADO -> possui botão edit
    const editBtnRow1 = rows[0].querySelector('.edit-btn');
    expect(editBtnRow1).toBeTruthy();

    // Linha 2: EM USO -> NÃO possui botão edit
    const editBtnRow2 = rows[1].querySelector('.edit-btn');
    expect(editBtnRow2).toBeNull();

    // Linha 3: FINALIZADO -> NÃO possui botão edit
    const editBtnRow3 = rows[2].querySelector('.edit-btn');
    expect(editBtnRow3).toBeNull();

    // Total de botões de editar na tabela inteira deve ser exatamente 1
    const allEditBtns = compiled.querySelectorAll('.edit-btn');
    expect(allEditBtns.length).toBe(1);
  });
});
