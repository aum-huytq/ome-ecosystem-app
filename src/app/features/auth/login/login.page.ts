import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { AuthService, OAuthProvider } from '../../../core/services/auth.service';
import { TranslateService } from '@ngx-translate/core';
import { strongPasswordValidator } from '../../../shared/validators/password.validator';

type AuthMode = 'login' | 'register';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage implements OnInit {
  mode: AuthMode = 'login';

  loginForm!: FormGroup;
  registerForm!: FormGroup;

  isSubmitting = false;
  otpSending = false;
  otpSent = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private alertCtrl: AlertController,
    private translate: TranslateService,
  ) {
    this.translate.use('vi');
  }

  // ================= INIT =================
  ngOnInit(): void {
    this.initForms();
    this.handleOAuthCallback();
  }

  private initForms(): void {
    // ===== LOGIN =====
    this.loginForm = this.fb.group({
      phone: ['', Validators.required],
      password: ['', [Validators.required, strongPasswordValidator]],
    });

    // ===== REGISTER =====
    this.registerForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', Validators.email], // optional
      phone: ['', Validators.required],
      otp_code: ['', Validators.required],
      password: ['', [Validators.required, strongPasswordValidator]],
      confirmPassword: ['', Validators.required],
    });
  }

  switchMode(mode: AuthMode) {
    this.mode = mode;

    if (mode === 'login') {
      this.registerForm.reset();
    } else {
      this.loginForm.reset();
    }
  }


  // ================= LOGIN =================
  onLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    const { phone, password } = this.loginForm.value;

    this.auth.login(phone, password).subscribe({
      next: () => this.router.navigate(['/profile']),
      error: err => {
        this.showAlert(
          this.t('AUTH.LOGIN_FAILED'),
          err?.message || this.t('COMMON.TRY_AGAIN'),
        );
        this.isSubmitting = false;
      },
      complete: () => (this.isSubmitting = false),
    });
  }

  // ================= REGISTER =================
  onRegister(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    if (!this.otpSent) {
      this.showAlert(
        this.t('AUTH.OTP_REQUIRED'),
        this.t('AUTH.PLEASE_ENTER_OTP'),
      );
      return;
    }

    const {
      fullName,
      phone,
      otp_code,
      password,
      confirmPassword,
    } = this.registerForm.value;

    if (password !== confirmPassword) {
      this.showAlert(
        this.t('AUTH.PASSWORD_ERROR'),
        this.t('AUTH.PASSWORD_NOT_MATCH'),
      );
      return;
    }

    this.isSubmitting = true;

    this.auth.register({
      fullName,
      phone,
      password,
      otp_code,
    }).subscribe({
      next: () => this.router.navigate(['/profile']),
      error: err => {
        this.showAlert(
          this.t('AUTH.REGISTER_FAILED'),
          err?.message || this.t('COMMON.TRY_AGAIN'),
        );
        this.isSubmitting = false;
      },
      complete: () => (this.isSubmitting = false),
    });
  }

  // ================= OTP =================
  sendOtp(): void {
    const phoneCtrl = this.registerForm.get('phone');

    if (!phoneCtrl || phoneCtrl.invalid) {
      phoneCtrl?.markAsTouched();
      return;
    }

    this.otpSending = true;

    this.auth.requestOtp({
      phone: phoneCtrl.value,
      purpose: 'signup',
    }).subscribe({
      next: () => {
        this.otpSent = true;
        this.showAlert(
          this.t('AUTH.OTP_SENT'),
          this.t('AUTH.CHECK_PHONE'),
        );
      },
      error: err => {
        this.showAlert(
          this.t('AUTH.OTP_FAILED'),
          err?.message || this.t('COMMON.TRY_AGAIN'),
        );
      },
      complete: () => (this.otpSending = false),
    });
  }

  // ================= SOCIAL =================
  onLoginWithGoogle(): void {
    this.auth.redirectToOAuth('google');
  }

  onLoginWithFacebook(): void {
    this.auth.redirectToOAuth('facebook');
  }

  onRegisterWithGoogle(): void {
    this.auth.redirectToOAuth('google');
  }

  onRegisterWithFacebook(): void {
    this.auth.redirectToOAuth('facebook');
  }

  // ================= OAUTH CALLBACK =================
  private handleOAuthCallback(): void {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const provider = params.get('state') as OAuthProvider | null;

    if (!code || !provider) return;

    this.isSubmitting = true;

    this.auth.exchangeOAuthCode({
      provider,
      code,
      redirectUri: `${window.location.origin}/auth/login`,
    }).subscribe({
      next: () => {
        window.history.replaceState({}, document.title, '/auth/login');
        this.router.navigate(['/profile']);
      },
      error: err => {
        this.showAlert(
          this.t('AUTH.SSO_FAILED'),
          err?.message || this.t('COMMON.TRY_AGAIN'),
        );
        this.isSubmitting = false;
      },
    });
  }

  // ================= HELPERS =================
  isInvalid(form: FormGroup, control: string): boolean {
    const c = form.get(control);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  goToForgotPassword(): void {
    this.router.navigate(['/auth/forgot-password']);
  }

  private async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  private t(key: string): string {
    return this.translate.instant(key);
  }
}
