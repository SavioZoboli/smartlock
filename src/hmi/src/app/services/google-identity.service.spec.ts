import { TestBed } from '@angular/core/testing';

import { GoogleIdentityService } from './google-identity.service';

describe('GoogleIdentityService', () => {
  let service: GoogleIdentityService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GoogleIdentityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
