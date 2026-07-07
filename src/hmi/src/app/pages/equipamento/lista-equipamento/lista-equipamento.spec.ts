import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaEquipamento } from './lista-equipamento';

describe('ListaEquipamento', () => {
  let component: ListaEquipamento;
  let fixture: ComponentFixture<ListaEquipamento>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaEquipamento]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListaEquipamento);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
