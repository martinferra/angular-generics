import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeviceNewEditComponent } from './device-new-edit.component';

describe('DeviceNewEditComponent', () => {
  let component: DeviceNewEditComponent;
  let fixture: ComponentFixture<DeviceNewEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DeviceNewEditComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DeviceNewEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
