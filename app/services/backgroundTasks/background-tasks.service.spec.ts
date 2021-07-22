import { TestBed } from '@angular/core/testing';

import { BackgroundTasksService } from './background-tasks.service';

describe('BackgroundTasksService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: BackgroundTasksService = TestBed.get(BackgroundTasksService);
    expect(service).toBeTruthy();
  });
});
