import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtratoEmprestimosComponent } from './extrato-emprestimos';

describe('ExtratoEmprestimosComponent', () => {
  let component: ExtratoEmprestimosComponent;
  let fixture: ComponentFixture<ExtratoEmprestimosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExtratoEmprestimosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExtratoEmprestimosComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
