import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ListaReserva } from './lista-reserva';
import { ReservaService } from '../../../services/reserva.service';
import { ConfirmDeleteService } from '../../../services/confirm-delete.service';

describe('ListaReserva', () => {
  let component: ListaReserva;
  let fixture: ComponentFixture<ListaReserva>;

  const mockReservas = [
    {
      id: 1,
      reserva_inicio: '2026-10-09T10:00:00.000Z',
      reserva_fim: '2026-10-09T12:00:00.000Z',
      situacao: 'PENDENTE',
      smartlock: 'Armário TI',
      unidade: 'Matriz',
      regional: 'Sul',
      equipamentos: [{ id: 1, nome: 'Notebook', patrimonio: '123' }],
    },
    {
      id: 2,
      reserva_inicio: '2026-10-09T14:00:00.000Z',
      reserva_fim: '2026-10-09T16:00:00.000Z',
      situacao: 'FINALIZADO',
      smartlock: 'Recepção',
      unidade: 'Filial 1',
      regional: 'Norte',
      equipamentos: [],
    },
  ];

  const mockReservaService = {
    listAll: () => of(mockReservas),
    delete: () => of(undefined),
  };

  const mockConfirmDelete = {
    confirmarEExcluir: () => of(true),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaReserva],
      providers: [
        provideRouter([]),
        provideAnimationsAsync(),
        { provide: ReservaService, useValue: mockReservaService },
        { provide: ConfirmDeleteService, useValue: mockConfirmDelete },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ListaReserva);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load reservas on init', () => {
    expect(component).toBeTruthy();
    expect(component.reservasFiltradas().length).toBe(2);
    expect(component.unidadesDisponiveis).toEqual(['Filial 1', 'Matriz']);
    expect(component.situacoesDisponiveis).toEqual(['FINALIZADO', 'PENDENTE']);
  });

  it('deve filtrar por apelido de smartlock', () => {
    component.filtros.patchValue({ smartlock: 'recep' });
    expect(component.reservasFiltradas().length).toBe(1);
    expect(component.reservasFiltradas()[0].smartlock).toBe('Recepção');
  });

  it('deve filtrar por unidade', () => {
    component.filtros.patchValue({ unidade: 'Matriz' });
    expect(component.reservasFiltradas().length).toBe(1);
    expect(component.reservasFiltradas()[0].unidade).toBe('Matriz');
  });

  it('deve filtrar por situacao', () => {
    component.filtros.patchValue({ situacao: 'FINALIZADO' });
    expect(component.reservasFiltradas().length).toBe(1);
    expect(component.reservasFiltradas()[0].situacao).toBe('FINALIZADO');
  });

  it('deve limpar filtros e restaurar lista completa', () => {
    component.filtros.patchValue({ smartlock: 'Armário' });
    expect(component.reservasFiltradas().length).toBe(1);

    component.limparFiltros();
    expect(component.filtros.value.smartlock).toBe('');
    expect(component.reservasFiltradas().length).toBe(2);
  });
});
