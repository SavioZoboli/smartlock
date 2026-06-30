import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SmartlockReport } from './smartlock-report';

describe('SmartlockReport', () => {
  let component: SmartlockReport;
  let fixture: ComponentFixture<SmartlockReport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SmartlockReport]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SmartlockReport);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
