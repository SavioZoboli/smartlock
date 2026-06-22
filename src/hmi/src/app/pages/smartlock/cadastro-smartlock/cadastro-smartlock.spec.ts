import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CadastroSmartlock } from './cadastro-smartlock';

describe('CadastroSmartlock', () => {
  let component: CadastroSmartlock;
  let fixture: ComponentFixture<CadastroSmartlock>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CadastroSmartlock]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CadastroSmartlock);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
