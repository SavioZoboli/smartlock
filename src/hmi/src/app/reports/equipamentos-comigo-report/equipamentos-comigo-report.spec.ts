import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EquipamentosComigoReport } from './equipamentos-comigo-report';

describe('EquipamentosComigoReport', () => {
  let component: EquipamentosComigoReport;
  let fixture: ComponentFixture<EquipamentosComigoReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EquipamentosComigoReport]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EquipamentosComigoReport);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
