import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaUnidade } from './lista-unidade';

describe('ListaUnidade', () => {
  let component: ListaUnidade;
  let fixture: ComponentFixture<ListaUnidade>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaUnidade]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListaUnidade);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
