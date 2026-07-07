import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RedirectEquipamento } from './redirect-equipamento';

describe('RedirectEquipamento', () => {
  let component: RedirectEquipamento;
  let fixture: ComponentFixture<RedirectEquipamento>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RedirectEquipamento]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RedirectEquipamento);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
