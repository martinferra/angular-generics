import { TestBed } from '@angular/core/testing';

import { AuthComponentsUtilsService } from './auth-components-utils.service';

describe('AuthComponentsUtilsService', () => {
  let service: AuthComponentsUtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthComponentsUtilsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
