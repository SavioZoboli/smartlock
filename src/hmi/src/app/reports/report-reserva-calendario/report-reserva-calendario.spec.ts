import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportReservaCalendario } from './report-reserva-calendario';

describe('ReportReservaCalendario', () => {
  let component: ReportReservaCalendario;
  let fixture: ComponentFixture<ReportReservaCalendario>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportReservaCalendario]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportReservaCalendario);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
