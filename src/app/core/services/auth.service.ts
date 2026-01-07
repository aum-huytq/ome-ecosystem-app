import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  UserProfile,
  AuthTokens,
  ApiAuthResponse,
  ApiAuthData,
} from '../models/auth.model';

const STORAGE_KEY_TOKENS = 'ome_auth_tokens';
const STORAGE_KEY_USER = 'ome_auth_user';

export type OAuthProvider = 'google' | 'facebook';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private api = environment.e5ApiBaseUrl;

  private currentUserSubject = new BehaviorSubject<UserProfile | null>(null);
  user$ = this.currentUserSubject.asObservable();

  private tokens: AuthTokens | null = null;

  constructor(private http: HttpClient) {
    this.loadFromStorage();
  }

  // =========================
  // STATE
  // =========================
  get currentUser(): UserProfile | null {
    return this.currentUserSubject.value;
  }

  get isLoggedIn(): boolean {
    return !!this.tokens?.accessToken;
  }

  get accessToken(): string | null {
    return this.tokens?.accessToken ?? null;
  }

  // =========================
  // NORMAL REGISTER
  // =========================
  register(payload: {
    fullName: string;
    otp_code:string;
    phone?: string;
    password: string;
  }): Observable<UserProfile> {
    return this.http
      .post<ApiAuthResponse>(`${this.api}/app/v1/register`, {
        password: payload.password,
        otp_code: payload.otp_code,
        full_name: payload.fullName,
        phone: payload.phone,
      })
      .pipe(map(res => this.handleAuthResponse(res, 'register')));
  }

  // =========================
  // OAUTH REDIRECT (GOOGLE / FB)
  // =========================
//   redirectToOAuth(provider: 'google' | 'facebook'): void {
//   const redirectUri = `${window.location.origin}/auth/register`;
//   const state = provider;

//   if (provider === 'google') {
//     const clientId = environment.googleClientId;
//     const scope = encodeURIComponent('openid email profile');

//     const authUrl =
//       'https://accounts.google.com/o/oauth2/v2/auth' +
//       `?client_id=${clientId}` +
//       `&redirect_uri=${encodeURIComponent(redirectUri)}` +
//       `&response_type=code` +
//       `&scope=${scope}` +
//       `&state=${state}`+
//       `&prompt=select_account`;

//     window.location.href = authUrl;
//   }

//   if (provider === 'facebook') {
//     const appId = environment.facebookAppId;

//     const authUrl =
//       'https://www.facebook.com/v19.0/dialog/oauth' +
//       `?client_id=${appId}` +
//       `&redirect_uri=${encodeURIComponent(redirectUri)}` +
//       `&response_type=code` +
//       `&state=${state}` +
//       `&scope=email,public_profile`;

//     window.location.href = authUrl;
//   }
// }


  redirectToOAuth(provider: 'google' | 'facebook'): void {
    const redirectUri = `${window.location.origin}/auth/login`;
    const state = provider;

    if (provider === 'google') {
      const clientId = environment.googleClientId;
      const scope = encodeURIComponent('openid email profile');

      window.location.replace(
        'https://accounts.google.com/o/oauth2/v2/auth' +
        `?client_id=${clientId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=${scope}` +
        `&state=${state}` +
        `&prompt=select_account`
      );
    }

    if (provider === 'facebook') {
        const appId = environment.facebookAppId;

        window.location.replace(
          'https://www.facebook.com/v19.0/dialog/oauth' +
          `?client_id=${appId}` +
          `&redirect_uri=${encodeURIComponent(redirectUri)}` +
          `&response_type=code` +
          `&state=${state}` +
          `&scope=email,public_profile`
        );
      }
  }


  // =========================
  // OAUTH CODE EXCHANGE
  // =========================
  exchangeOAuthCode(payload: {
    provider: OAuthProvider;
    code: string;
    redirectUri: string;
  }): Observable<UserProfile> {
    return this.http
      .post<ApiAuthResponse>(`${this.api}/app/v1/oauth/exchange`, {
        provider: payload.provider,
        code: payload.code,
        redirect_uri: payload.redirectUri,
      })
      .pipe(map(res => this.handleAuthResponse(res, 'login')));
  }


  // =========================
  // OTP REQUEST
  // =========================
  requestOtp(payload: {
    phone: string;
    purpose: 'signup' | 'login' | 'reset_password';
  }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.api}/app/v1/otp/request`,
      payload,
    );
  }

  // =========================
  // LOGIN
  // =========================
  login(phone: string, password: string): Observable<UserProfile> {
    return this.http
      .post<ApiAuthResponse>(`${this.api}/app/v1/login`, { phone, password })
      .pipe(map(res => this.handleAuthResponse(res, 'login')));
  }

  // =========================
  // LOGOUT
  // =========================
  logout(): void {
    this.tokens = null;
    this.currentUserSubject.next(null);
    localStorage.removeItem(STORAGE_KEY_TOKENS);
    localStorage.removeItem(STORAGE_KEY_USER);
  }

  // =========================
  // INTERNAL
  // =========================
  private handleAuthResponse(
    res: ApiAuthResponse,
    action: 'login' | 'register',
  ): UserProfile {
    if (res.code !== 200 || !res.data) {
      throw new Error(res.message || `${action} failed`);
    }

    this.setSessionFromData(res.data);
    return this.mapUser(res.data.user);
  }

  private setSessionFromData(data: ApiAuthData) {
    const tokens: AuthTokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      tokenType: data.token_type,
    };

    const user = this.mapUser(data.user);

    this.tokens = tokens;
    this.currentUserSubject.next(user);

    localStorage.setItem(STORAGE_KEY_TOKENS, JSON.stringify(tokens));
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
  }

  private loadFromStorage() {
    try {
      const t = localStorage.getItem(STORAGE_KEY_TOKENS);
      const u = localStorage.getItem(STORAGE_KEY_USER);

      if (t) this.tokens = JSON.parse(t);
      if (u) this.currentUserSubject.next(JSON.parse(u));
    } catch {
      this.tokens = null;
      this.currentUserSubject.next(null);
    }
  }

  private mapUser(raw: ApiAuthData['user']): UserProfile {
    return {
      id: raw.id,
      fullName:
        typeof raw.full_name === 'string'
          ? raw.full_name
          : raw.email?.split('@')[0] || 'OM’E User',
      email: raw.email,
      phone: raw.phone,
    };
  }
}
