import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CadastroUnidade } from './cadastro-unidade';

describe('CadastroUnidade', () => {
  let component: CadastroUnidade;
  let fixture: ComponentFixture<CadastroUnidade>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CadastroUnidade]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CadastroUnidade);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
