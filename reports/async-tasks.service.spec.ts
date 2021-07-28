import { TestBed } from '@angular/core/testing';

import { AsyncTasksService } from './async-tasks.service';

describe('AsyncTasksService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: AsyncTasksService = TestBed.get(AsyncTasksService);
    expect(service).toBeTruthy();
  });
});
