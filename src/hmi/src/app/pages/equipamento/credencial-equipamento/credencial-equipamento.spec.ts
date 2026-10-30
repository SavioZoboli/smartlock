import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';

import { CredencialEquipamento, senhaTamanhoBytesValidator } from './credencial-equipamento';

describe('CredencialEquipamento', () => {
  let component: CredencialEquipamento;
  let fixture: ComponentFixture<CredencialEquipamento>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CredencialEquipamento],
    }).compileComponents();

    fixture = TestBed.createComponent(CredencialEquipamento);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('senhaTamanhoBytesValidator', () => {
  it('aceita senha vazia e até 100 bytes', () => {
    expect(senhaTamanhoBytesValidator(new FormControl(''))).toBeNull();
    expect(senhaTamanhoBytesValidator(new FormControl('a'.repeat(100)))).toBeNull();
  });

  it('rejeita senha acima de 100 bytes UTF-8 (acentos contam 2 bytes)', () => {
    expect(senhaTamanhoBytesValidator(new FormControl('a'.repeat(101)))).not.toBeNull();
    expect(senhaTamanhoBytesValidator(new FormControl('ç'.repeat(51)))).not.toBeNull();
  });
});

