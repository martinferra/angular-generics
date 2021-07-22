import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TasksDropDownViewerComponent } from './tasks-drop-down-viewer.component';

describe('TasksDropDownViewerComponent', () => {
  let component: TasksDropDownViewerComponent;
  let fixture: ComponentFixture<TasksDropDownViewerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TasksDropDownViewerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TasksDropDownViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
