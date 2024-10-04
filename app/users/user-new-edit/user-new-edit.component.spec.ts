import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserNewEditComponent } from './user-new-edit.component';

describe('UserNewEditComponent', () => {
  let component: UserNewEditComponent;
  let fixture: ComponentFixture<UserNewEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UserNewEditComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserNewEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
