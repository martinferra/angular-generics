import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BasicListEditorComponent } from './basic-list-editor.component';

describe('BasicListEditorComponent', () => {
  let component: BasicListEditorComponent;
  let fixture: ComponentFixture<BasicListEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BasicListEditorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BasicListEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
