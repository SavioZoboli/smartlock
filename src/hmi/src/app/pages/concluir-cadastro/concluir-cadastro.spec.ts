import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConcluirCadastro } from './concluir-cadastro';

describe('ConcluirCadastro', () => {
  let component: ConcluirCadastro;
  let fixture: ComponentFixture<ConcluirCadastro>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConcluirCadastro]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConcluirCadastro);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
