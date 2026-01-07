import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OtpVerifyPage } from './otp-verify.page';

describe('OtpVerifyPage', () => {
  let component: OtpVerifyPage;
  let fixture: ComponentFixture<OtpVerifyPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(OtpVerifyPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
