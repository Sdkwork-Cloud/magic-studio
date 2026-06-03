export interface LoginRequest {
  captcha?: string;
  password: string;
  username: string;
}

export interface RegisterRequest {
  confirmPassword: string;
  email?: string;
  password: string;
  phone?: string;
  type?: 'DEFAULT' | 'EMAIL' | 'PHONE';
  username: string;
  verificationCode?: string;
}

export interface UserInfo {
  avatar?: string;
  createdAt?: string;
  email?: string;
  id?: number;
  nickname?: string;
  phone?: string;
  role?: string;
  status?: string;
  updatedAt?: string;
  username?: string;
}

export interface LoginVO {
  accessToken?: string;
  authToken: string;
  createdAt?: string;
  expiresIn?: number;
  refreshToken?: string;
  tokenType?: string;
  updatedAt?: string;
  userInfo?: UserInfo;
}
