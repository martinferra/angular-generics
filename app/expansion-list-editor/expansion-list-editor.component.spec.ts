import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpansionListEditorComponent } from './expansion-list-editor.component';

describe('ExpansionListEditorComponent', () => {
  let component: ExpansionListEditorComponent;
  let fixture: ComponentFixture<ExpansionListEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExpansionListEditorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExpansionListEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
