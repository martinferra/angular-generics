import { TestBed } from '@angular/core/testing';

import { ClassResolverService } from './class-resolver.service';

describe('ClassResolverService', () => {
  let service: ClassResolverService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClassResolverService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
