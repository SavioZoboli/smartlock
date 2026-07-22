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
});
