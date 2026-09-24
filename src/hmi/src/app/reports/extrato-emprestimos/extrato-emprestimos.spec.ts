import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtratoEmprestimos } from './extrato-emprestimos';

describe('ExtratoEmprestimos', () => {
  let component: ExtratoEmprestimos;
  let fixture: ComponentFixture<ExtratoEmprestimos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExtratoEmprestimos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExtratoEmprestimos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
