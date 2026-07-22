import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CadastroReserva } from './cadastro-reserva';

describe('CadastroReserva', () => {
  let component: CadastroReserva;
  let fixture: ComponentFixture<CadastroReserva>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CadastroReserva]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CadastroReserva);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
