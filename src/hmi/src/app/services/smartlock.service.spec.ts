import { TestBed } from '@angular/core/testing';

import { SmartlockService } from './smartlock.service';

describe('SmartlockService', () => {
  let service: SmartlockService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SmartlockService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
