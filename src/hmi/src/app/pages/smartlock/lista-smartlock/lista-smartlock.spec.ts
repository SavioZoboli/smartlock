import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaSmartlock } from './lista-smartlock';

describe('ListaSmartlock', () => {
  let component: ListaSmartlock;
  let fixture: ComponentFixture<ListaSmartlock>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaSmartlock]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListaSmartlock);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
