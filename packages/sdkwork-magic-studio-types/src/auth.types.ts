import type { UserProfile } from './user.types.ts';

export type AuthQrCodeStatus = 'pending' | 'scanned' | 'confirmed' | 'expired';

export interface AuthSessionUser {
  userId: string;
  username: string;
  displayName: string;
  email?: string;
  phone?: string;
  avatar?: string;
  avatarUrl?: string;
}

export interface AuthSession {
  accessToken: string;
  authToken: string;
  refreshToken?: string;
  expiresAt: string;
  user: AuthSessionUser;
}

export interface AuthSessionState {
  isAuthenticated: boolean;
  session: AuthSession | null;
}

export interface AuthQrCodePayload {
  qrKey: string;
  qrContent: string;
  qrUrl?: string;
  expireTime: number;
}

export interface AuthQrCodeStatusResult {
  status: AuthQrCodeStatus;
  session?: AuthSession;
}

export interface AuthVerificationCodeCheckResult {
  valid: boolean;
}

export interface AuthPasswordResetResult {
  ok: boolean;
}

export interface AuthIdentitySnapshot {
  session: AuthSessionState;
  profile: UserProfile | null;
}
