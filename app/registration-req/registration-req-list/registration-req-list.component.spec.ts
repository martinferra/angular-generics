import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrationReqListComponent } from './registration-req-list.component';

describe('RegistrationReqListComponent', () => {
  let component: RegistrationReqListComponent;
  let fixture: ComponentFixture<RegistrationReqListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RegistrationReqListComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RegistrationReqListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
