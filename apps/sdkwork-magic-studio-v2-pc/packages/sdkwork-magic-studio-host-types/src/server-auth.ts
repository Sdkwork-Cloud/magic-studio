export type MagicStudioAuthVerifyType = 'EMAIL' | 'PHONE';
export type MagicStudioAuthDeviceType = 'desktop' | 'web';
export type MagicStudioAuthScene =
  | 'LOGIN'
  | 'REGISTER'
  | 'RESET_PASSWORD'
  | 'BIND_EMAIL'
  | 'BIND_PHONE';
export type MagicStudioAuthPasswordResetChannel = 'EMAIL' | 'SMS';

export interface MagicStudioAuthLoginRequest {
  deviceType?: MagicStudioAuthDeviceType;
  username: string;
  password: string;
  twoFactorCode?: string;
}

export interface MagicStudioAuthPhoneLoginRequest {
  phone: string;
  code: string;
  deviceType?: MagicStudioAuthDeviceType;
  twoFactorCode?: string;
}

export interface MagicStudioAuthRegisterRequest {
  username: string;
  password: string;
  confirmPassword?: string;
  email?: string;
  phone?: string;
  verificationCode?: string;
}

export interface MagicStudioAuthRefreshTokenRequest {
  refreshToken: string;
}

export interface MagicStudioAuthSendVerifyCodeRequest {
  verifyType: MagicStudioAuthVerifyType;
  target: string;
  scene: MagicStudioAuthScene;
}

export interface MagicStudioAuthCheckVerifyCodeRequest
  extends MagicStudioAuthSendVerifyCodeRequest {
  code: string;
}

export interface MagicStudioAuthPasswordResetRequest {
  account: string;
  channel: MagicStudioAuthPasswordResetChannel;
}

export interface MagicStudioAuthPasswordResetConfirmRequest {
  account: string;
  code: string;
  newPassword: string;
  confirmPassword?: string;
}
