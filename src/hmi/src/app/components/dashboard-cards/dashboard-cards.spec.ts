import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardCards } from './dashboard-cards';

describe('DashboardCards', () => {
  let component: DashboardCards;
  let fixture: ComponentFixture<DashboardCards>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardCards]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardCards);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
