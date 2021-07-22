import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckCardsGroupComponent } from './check-cards-group.component';

describe('CheckCardsGroupComponent', () => {
  let component: CheckCardsGroupComponent;
  let fixture: ComponentFixture<CheckCardsGroupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CheckCardsGroupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CheckCardsGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
