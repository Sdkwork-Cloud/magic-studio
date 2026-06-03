import type { UserSettings } from '@sdkwork/magic-studio-types/user';

export interface MagicStudioUserProfileUpdateRequest {
  username?: string;
  nickname?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  avatarUrl?: string;
  bio?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  region?: string;
}

export interface MagicStudioUserAvatarUploadRequest {
  file: string;
}

export interface MagicStudioUserSettingsSecurityUpdateRequest {
  loginAlerts?: boolean;
}

export interface MagicStudioUserSettingsUpdateRequest extends Omit<UserSettings, 'security'> {
  security?: MagicStudioUserSettingsSecurityUpdateRequest;
}

export interface MagicStudioUserPasswordChangeRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface MagicStudioUserAddressCreateRequest {
  name: string;
  phone: string;
  addressDetail: string;
  countryCode?: string;
  provinceCode?: string;
  cityCode?: string;
  districtCode?: string;
  postalCode?: string;
  isDefault?: boolean;
}

export interface MagicStudioUserAddressUpdateRequest {
  name?: string;
  phone?: string;
  addressDetail?: string;
  countryCode?: string;
  provinceCode?: string;
  cityCode?: string;
  districtCode?: string;
  postalCode?: string;
  isDefault?: boolean;
}

export interface MagicStudioUserHistoryQuery {
  page?: number;
  pageSize?: number;
}

export interface MagicStudioUserTwoFactorSetupRequest {
  issuer?: string;
}

export interface MagicStudioUserTwoFactorVerifyRequest {
  code: string;
}

export interface MagicStudioUserBindEmailRequest {
  email: string;
  verificationCode: string;
}

export interface MagicStudioUserBindPhoneRequest {
  phone: string;
  verificationCode: string;
}

export interface MagicStudioUserThirdPartyBindRequest {
  code?: string;
  state?: string;
  accessToken?: string;
  refreshToken?: string;
  expireTime?: string;
  thirdPartyUserId?: string;
  thirdPartyUserName?: string;
  thirdPartyAvatar?: string;
  metadata?: Record<string, unknown>;
}
