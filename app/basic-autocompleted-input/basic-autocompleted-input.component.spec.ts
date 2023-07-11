import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BasicAutocompletedInputComponent } from './basic-autocompleted-input.component';

describe('BasicAutocompletedInputComponent', () => {
  let component: BasicAutocompletedInputComponent<any>;
  let fixture: ComponentFixture<BasicAutocompletedInputComponent<any>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BasicAutocompletedInputComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BasicAutocompletedInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
