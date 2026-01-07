// User “chuẩn” dùng trong app OM'E
export interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
}

// Token lưu trong localStorage
export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
}

// Cấu trúc phần "data" trong response E5
export interface ApiAuthData {
  user: {
    id: number;
    email: string;
    full_name: string | boolean | null;
    phone?: string;
  };
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

// Response tổng thể khi register/login
export interface ApiAuthResponse {
  code: number;           // 200 = success
  message: string;
  data: ApiAuthData | null;
  error: any;             // nếu có lỗi backend custom
}
