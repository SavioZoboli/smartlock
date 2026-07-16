import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CadastroMovimentacao } from './cadastro-movimentacao';

describe('CadastroMovimentacao', () => {
  let component: CadastroMovimentacao;
  let fixture: ComponentFixture<CadastroMovimentacao>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CadastroMovimentacao]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CadastroMovimentacao);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
