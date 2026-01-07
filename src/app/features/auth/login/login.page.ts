import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { AuthService, OAuthProvider } from '../../../core/services/auth.service';

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
  ) {}

  // ================= INIT =================
  ngOnInit(): void {
    this.initForms();
    this.handleOAuthCallback();
  }

  private initForms(): void {
    // ===== LOGIN FORM =====
    this.loginForm = this.fb.group({
      email: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    // ===== REGISTER FORM =====
    this.registerForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', Validators.email], // không required
      phone: ['', Validators.required],
      otp_code: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    });
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
        this.showAlert('Đăng nhập thất bại', err?.message || 'Vui lòng thử lại');
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
      this.showAlert('Thiếu OTP', 'Vui lòng gửi và nhập mã OTP');
      return;
    }

    const {
      fullName,
      email,
      phone,
      otp_code,
      password,
      confirmPassword,
    } = this.registerForm.value;

    if (password !== confirmPassword) {
      this.showAlert('Lỗi mật khẩu', 'Mật khẩu nhập lại không khớp');
      return;
    }

    this.isSubmitting = true;

    this.auth
      .register({
        fullName,
        email: email || `${phone}@phone.local`,
        phone,
        password,
        otp_code,
      })
      .subscribe({
        next: () => this.router.navigate(['/profile']),
        error: err => {
          this.showAlert('Đăng ký thất bại', err?.message || 'Vui lòng thử lại');
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

    this.auth
      .requestOtp({
        phone: phoneCtrl.value,
        purpose: 'signup',
      })
      .subscribe({
        next: async res => {
          this.otpSent = true;
          await this.showAlert(
            'Gửi OTP thành công',
            res?.message || 'Mã OTP đã được gửi',
          );
        },
        error: async err => {
          await this.showAlert(
            'Không gửi được OTP',
            err?.message || 'Vui lòng thử lại',
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

    this.auth
      .exchangeOAuthCode({
        provider,
        code,
        redirectUri: `${window.location.origin}/auth/login`,
      })
      .subscribe({
        next: () => {
          window.history.replaceState({}, document.title, '/auth/login');
          this.router.navigate(['/profile']);
        },
        error: err => {
          this.showAlert(
            'SSO thất bại',
            err?.message || `Không đăng nhập được bằng ${provider}`,
          );
          this.isSubmitting = false;
        },
      });
  }

  // ================= ALERT =================
  private async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  goToForgotPassword(): void {
    this.router.navigate(['/auth/forgot-password']);
  }
}
