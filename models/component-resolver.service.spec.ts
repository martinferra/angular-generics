import { TestBed } from '@angular/core/testing';

import { ComponentResolverService } from './component-resolver.service';

describe('ComponentResolverService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ComponentResolverService = TestBed.get(ComponentResolverService);
    expect(service).toBeTruthy();
  });
});
