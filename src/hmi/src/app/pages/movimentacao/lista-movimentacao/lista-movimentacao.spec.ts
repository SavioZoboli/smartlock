import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaMovimentacao } from './lista-movimentacao';

describe('ListaMovimentacao', () => {
  let component: ListaMovimentacao;
  let fixture: ComponentFixture<ListaMovimentacao>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaMovimentacao]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListaMovimentacao);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
