import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CadastroEquipamento } from './cadastro-equipamento';

describe('CadastroEquipamento', () => {
  let component: CadastroEquipamento;
  let fixture: ComponentFixture<CadastroEquipamento>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CadastroEquipamento]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CadastroEquipamento);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
