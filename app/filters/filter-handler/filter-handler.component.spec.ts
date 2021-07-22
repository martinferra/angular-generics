import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterHandlerComponent } from './filter-handler.component';

describe('FilterHandlerComponent', () => {
  let component: FilterHandlerComponent;
  let fixture: ComponentFixture<FilterHandlerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FilterHandlerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FilterHandlerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
