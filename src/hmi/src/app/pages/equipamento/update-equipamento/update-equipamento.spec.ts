import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateEquipamento } from './update-equipamento';

describe('UpdateEquipamento', () => {
  let component: UpdateEquipamento;
  let fixture: ComponentFixture<UpdateEquipamento>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateEquipamento]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateEquipamento);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
