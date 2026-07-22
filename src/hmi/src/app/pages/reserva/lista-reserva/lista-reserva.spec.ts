import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaReserva } from './lista-reserva';

describe('ListaReserva', () => {
  let component: ListaReserva;
  let fixture: ComponentFixture<ListaReserva>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaReserva]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListaReserva);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
