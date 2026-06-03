import {
  createRuntimeMagicStudioServerClient,
  readDefaultPlatformRuntime,
} from '@sdkwork/magic-studio-core/sdk';
import { createServiceAdapterController } from '@sdkwork/magic-studio-commons/utils/serviceAdapter';
import type { UserProfileUpdateForm } from './userCenterService.contract';

export interface UserCenterProfile {
  avatar?: string;
  bio?: string;
  createdAt?: string | number;
  email?: string;
  gender?: string;
  nickname: string;
  phone?: string;
  region?: string;
  updatedAt?: string | number;
  userId: string;
}

export interface UserCenterUpdateProfileInput extends UserProfileUpdateForm {}

export interface UserCenterAvatarUploadInput {
  contentType?: string;
  data: Uint8Array;
  name: string;
}

export interface UserCenterChangePasswordInput {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UserCenterSettings extends Record<string, unknown> {
  language?: string;
  theme?: string;
  autoPlay?: boolean;
  highQuality?: boolean;
  dataSaver?: boolean;
  notificationSettings?: Record<string, unknown>;
  privacySettings?: Record<string, unknown>;
  downloadSettings?: Record<string, unknown>;
}

export type UserCenterUpdateSettingsInput = UserCenterSettings;

export interface UserCenterAddress extends Record<string, unknown> {
  id?: number | string;
  uuid?: string;
  name?: string;
  phone?: string;
  countryCode?: string;
  provinceCode?: string;
  cityCode?: string;
  districtCode?: string;
  addressDetail?: string;
  postalCode?: string;
  isDefault?: boolean;
  fullAddress?: string;
  createdAt?: string | number;
  updatedAt?: string | number;
}

export interface UserCenterCreateAddressInput extends Record<string, unknown> {
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

export interface UserCenterUpdateAddressInput extends Record<string, unknown> {
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

export interface UserCenterBinding extends Record<string, unknown> {
  avatarUrl?: string;
  boundAt?: string;
  createdAt?: string | number;
  displayName?: string;
  id?: number | string;
  metadata?: Record<string, unknown>;
  platform: string;
  target?: string;
  updatedAt?: string | number;
  uuid?: string;
}

export interface UserCenterHistoryQuery extends Record<string, unknown> {
  current?: number;
  page?: number;
  pageNum?: number;
  pageSize?: number;
  size?: number;
}

export interface UserCenterHistoryPage extends Record<string, unknown> {
  content?: Array<Record<string, unknown>>;
  current?: number;
  empty?: boolean;
  first?: boolean;
  last?: boolean;
  number?: number;
  numberOfElements?: number;
  pageNum?: number;
  pageSize?: number;
  records?: Array<Record<string, unknown>>;
  size?: number;
  total?: number;
  totalElements?: number;
  totalPages?: number;
}

export type UserCenterBindPlatform = 'wechat' | 'qq';

export interface UserCenterThirdPartyBindInput extends Record<string, unknown> {
  accessToken?: string;
  code?: string;
  expireTime?: string;
  metadata?: Record<string, unknown>;
  refreshToken?: string;
  state?: string;
  thirdPartyAvatar?: string;
  thirdPartyUserId?: string;
  thirdPartyUserName?: string;
}

export interface IUserCenterService {
  bindEmail(email: string, verifyCode?: string): Promise<UserCenterProfile>;
  bindPhone(phone: string, verifyCode?: string): Promise<UserCenterProfile>;
  bindThirdParty(platform: UserCenterBindPlatform, input?: UserCenterThirdPartyBindInput): Promise<void>;
  changePassword(input: UserCenterChangePasswordInput): Promise<void>;
  createAddress(input: UserCenterCreateAddressInput): Promise<UserCenterAddress>;
  deleteAddress(addressId: string | number): Promise<void>;
  getDefaultAddress(): Promise<UserCenterAddress | null>;
  getGenerationHistory(params?: UserCenterHistoryQuery): Promise<UserCenterHistoryPage>;
  getLoginHistory(params?: UserCenterHistoryQuery): Promise<UserCenterHistoryPage>;
  getUserProfile(): Promise<UserCenterProfile | null>;
  getUserSettings(): Promise<UserCenterSettings | null>;
  listUserAddresses(): Promise<UserCenterAddress[]>;
  listUserBindings(): Promise<UserCenterBinding[]>;
  setDefaultAddress(addressId: string | number): Promise<UserCenterAddress>;
  unbindEmail(): Promise<UserCenterProfile>;
  unbindPhone(): Promise<UserCenterProfile>;
  unbindThirdParty(platform: UserCenterBindPlatform): Promise<void>;
  updateAddress(addressId: string | number, input: UserCenterUpdateAddressInput): Promise<UserCenterAddress>;
  updateUserProfile(input: UserCenterUpdateProfileInput): Promise<UserCenterProfile>;
  updateUserSettings(input: UserCenterUpdateSettingsInput): Promise<UserCenterSettings>;
  uploadUserAvatar(input: UserCenterAvatarUploadInput): Promise<UserCenterProfile>;
}

type UserCenterServerClient = ReturnType<typeof createRuntimeMagicStudioServerClient>;
type ServerUserProfile = Awaited<ReturnType<UserCenterServerClient['readUserProfile']>>['data'];
type ServerUserAddress = NonNullable<Awaited<ReturnType<UserCenterServerClient['readDefaultUserAddress']>>['data']>;
type ServerUserBinding = Awaited<ReturnType<UserCenterServerClient['listUserBindings']>>['items'][number];
type ServerUserProfileUpdateRequest = Parameters<UserCenterServerClient['updateUserProfile']>[0];
type ServerUserAddressCreateRequest = Parameters<UserCenterServerClient['createUserAddress']>[0];
type ServerUserAddressUpdateRequest = Parameters<UserCenterServerClient['updateUserAddress']>[1];
type ServerUserHistoryQuery = NonNullable<Parameters<UserCenterServerClient['readUserLoginHistory']>[0]>;
type ServerUserSettingsUpdateRequest = Parameters<UserCenterServerClient['updateUserSettings']>[0];
type ServerUserThirdPartyBindRequest = Parameters<UserCenterServerClient['bindUserPlatform']>[1];
type ServerUserAvatarUploadRequest = Parameters<UserCenterServerClient['uploadUserAvatar']>[0];
type ServerUserHistoryEntry =
  | Awaited<ReturnType<UserCenterServerClient['readUserLoginHistory']>>['items'][number]
  | Awaited<ReturnType<UserCenterServerClient['readUserGenerationHistory']>>['items'][number];
type ServerUserHistoryEnvelope = {
  items: ServerUserHistoryEntry[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    version: string;
  };
};

function readText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function readOptionalText(value: unknown): string | undefined {
  const text = readText(value);
  return text || undefined;
}

function readPositiveInteger(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value.trim(), 10);
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return undefined;
}

function readOptionalId(value: unknown): string | number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  return readOptionalText(value);
}

function readTimestamp(value: unknown): string | number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  return readOptionalText(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stripUndefinedFields<T extends Record<string, unknown>>(value: T): T {
  const nextEntries = Object.entries(value).filter(([, entryValue]) => entryValue !== undefined);
  return Object.fromEntries(nextEntries) as T;
}

function requireText(value: unknown, message: string): string {
  const text = readText(value);
  if (!text) {
    throw new Error(message);
  }

  return text;
}

function getUserCenterServerClient(): UserCenterServerClient {
  const runtime = readDefaultPlatformRuntime('UserCenterService');
  return createRuntimeMagicStudioServerClient(runtime);
}

function mapServerProfile(profile: ServerUserProfile | null | undefined): UserCenterProfile | null {
  if (!profile) {
    return null;
  }

  const nickname =
    readText(profile.nickname)
    || readText(profile.username)
    || readText(profile.email)
    || readText(profile.phone)
    || readText(profile.id)
    || 'User';
  const userId =
    readText(profile.userId)
    || readText(profile.id)
    || readText(profile.email)
    || nickname;

  return stripUndefinedFields({
    avatar: readOptionalText(profile.avatar) || readOptionalText(profile.avatarUrl),
    bio: readOptionalText(profile.bio),
    createdAt: readTimestamp(profile.createdAt),
    email: readOptionalText(profile.email),
    gender: readOptionalText(profile.gender),
    nickname,
    phone: readOptionalText(profile.phone),
    region: readOptionalText(profile.region),
    updatedAt: readTimestamp(profile.updatedAt),
    userId,
  }) as UserCenterProfile;
}

function buildFullAddress(address: Partial<ServerUserAddress>): string | undefined {
  const fullAddress = readOptionalText(address.fullAddress);
  if (fullAddress) {
    return fullAddress;
  }

  const parts = [
    readText(address.countryCode),
    readText(address.provinceCode),
    readText(address.cityCode),
    readText(address.districtCode),
    readText(address.addressDetail),
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(' ') : undefined;
}

function mapServerAddress(address: ServerUserAddress | null | undefined): UserCenterAddress | null {
  if (!address) {
    return null;
  }

  return stripUndefinedFields({
    addressDetail: readOptionalText(address.addressDetail),
    cityCode: readOptionalText(address.cityCode),
    countryCode: readOptionalText(address.countryCode),
    createdAt: readTimestamp(address.createdAt),
    districtCode: readOptionalText(address.districtCode),
    fullAddress: buildFullAddress(address),
    id: readOptionalId(address.id),
    isDefault: Boolean(address.isDefault),
    name: readOptionalText(address.name),
    phone: readOptionalText(address.phone),
    postalCode: readOptionalText(address.postalCode),
    provinceCode: readOptionalText(address.provinceCode),
    updatedAt: readTimestamp(address.updatedAt),
    uuid: readOptionalText(address.uuid),
  }) as UserCenterAddress;
}

function mapServerBinding(binding: ServerUserBinding): UserCenterBinding {
  return stripUndefinedFields({
    avatarUrl: readOptionalText(binding.avatarUrl),
    boundAt: readOptionalText(binding.boundAt),
    createdAt: readTimestamp(binding.createdAt),
    displayName: readOptionalText(binding.displayName),
    id: readOptionalId(binding.id),
    metadata: isRecord(binding.metadata) ? binding.metadata : undefined,
    platform: requireText(binding.platform, 'User binding platform is missing.'),
    target: readOptionalText(binding.target),
    updatedAt: readTimestamp(binding.updatedAt),
    uuid: readOptionalText(binding.uuid),
  }) as UserCenterBinding;
}

function toServerProfileUpdateRequest(
  input: UserCenterUpdateProfileInput,
): ServerUserProfileUpdateRequest {
  const record = input as Record<string, unknown>;

  return stripUndefinedFields({
    avatar: readOptionalText(record.avatar),
    avatarUrl: readOptionalText(record.avatarUrl),
    bio: readOptionalText(record.bio),
    email: readOptionalText(record.email),
    firstName: readOptionalText(record.firstName),
    gender: readOptionalText(record.gender),
    lastName: readOptionalText(record.lastName),
    nickname: readOptionalText(record.nickname),
    phone: readOptionalText(record.phone),
    region: readOptionalText(record.region),
    username: readOptionalText(record.username),
  }) as ServerUserProfileUpdateRequest;
}

function toServerAddressCreateRequest(
  input: UserCenterCreateAddressInput,
): ServerUserAddressCreateRequest {
  return stripUndefinedFields({
    addressDetail: readOptionalText(input.addressDetail),
    cityCode: readOptionalText(input.cityCode),
    countryCode: readOptionalText(input.countryCode),
    districtCode: readOptionalText(input.districtCode),
    isDefault: input.isDefault,
    name: readOptionalText(input.name),
    phone: readOptionalText(input.phone),
    postalCode: readOptionalText(input.postalCode),
    provinceCode: readOptionalText(input.provinceCode),
  }) as ServerUserAddressCreateRequest;
}

function toServerAddressUpdateRequest(
  input: UserCenterUpdateAddressInput,
): ServerUserAddressUpdateRequest {
  return stripUndefinedFields({
    addressDetail: readOptionalText(input.addressDetail),
    cityCode: readOptionalText(input.cityCode),
    countryCode: readOptionalText(input.countryCode),
    districtCode: readOptionalText(input.districtCode),
    isDefault: input.isDefault,
    name: readOptionalText(input.name),
    phone: readOptionalText(input.phone),
    postalCode: readOptionalText(input.postalCode),
    provinceCode: readOptionalText(input.provinceCode),
  }) as ServerUserAddressUpdateRequest;
}

function toServerUserSettingsUpdateRequest(
  input: UserCenterUpdateSettingsInput,
): ServerUserSettingsUpdateRequest {
  const security = isRecord(input.security)
    ? stripUndefinedFields({
      ...input.security,
      twoFactorAuth: undefined,
    })
    : undefined;

  return stripUndefinedFields({
    ...input,
    security,
  }) as ServerUserSettingsUpdateRequest;
}

function normalizeHistoryQuery(params?: UserCenterHistoryQuery): {
  page?: number;
  pageSize?: number;
} | undefined {
  if (!params) {
    return undefined;
  }

  const query = stripUndefinedFields({
    page: readPositiveInteger(params.page) ?? readPositiveInteger(params.pageNum) ?? readPositiveInteger(params.current),
    pageSize: readPositiveInteger(params.pageSize) ?? readPositiveInteger(params.size),
  }) as ServerUserHistoryQuery;

  return Object.keys(query).length > 0 ? query : undefined;
}

function mapHistoryEnvelope(envelope: ServerUserHistoryEnvelope): UserCenterHistoryPage {
  const records = envelope.items.map((item) => item as unknown as Record<string, unknown>);
  const page = readPositiveInteger(envelope.meta.page) ?? 1;
  const pageSize = readPositiveInteger(envelope.meta.pageSize) ?? 20;
  const total = readPositiveInteger(envelope.meta.total) ?? records.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  const number = Math.max(0, page - 1);

  return {
    content: records,
    current: page,
    empty: records.length === 0,
    first: number === 0,
    last: totalPages === 0 || page >= totalPages,
    number,
    numberOfElements: records.length,
    pageNum: page,
    pageSize,
    records,
    size: pageSize,
    total,
    totalElements: total,
    totalPages,
  };
}

function getUploadContentType(input: UserCenterAvatarUploadInput): string {
  if (readText(input.contentType)) {
    return readText(input.contentType);
  }

  const normalizedName = readText(input.name).toLowerCase();
  if (normalizedName.endsWith('.jpg') || normalizedName.endsWith('.jpeg')) {
    return 'image/jpeg';
  }

  if (normalizedName.endsWith('.webp')) {
    return 'image/webp';
  }

  return 'image/png';
}

function encodeBase64(data: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(data).toString('base64');
  }

  if (typeof globalThis.btoa !== 'function') {
    throw new Error('Base64 encoding is not available in the current runtime.');
  }

  let binary = '';
  for (const value of data) {
    binary += String.fromCharCode(value);
  }

  return globalThis.btoa(binary);
}

function toUploadAvatarRequest(
  input: UserCenterAvatarUploadInput,
): ServerUserAvatarUploadRequest {
  const contentType = getUploadContentType(input);
  return {
    file: `data:${contentType};base64,${encodeBase64(input.data)}`,
  } as ServerUserAvatarUploadRequest;
}

function toThirdPartyBindRequest(
  input?: UserCenterThirdPartyBindInput,
): ServerUserThirdPartyBindRequest {
  const record = (input ?? {}) as Record<string, unknown>;

  return stripUndefinedFields({
    accessToken: readOptionalText(record.accessToken),
    code: readOptionalText(record.code),
    expireTime: readOptionalText(record.expireTime),
    metadata: isRecord(record.metadata) ? record.metadata : undefined,
    refreshToken: readOptionalText(record.refreshToken),
    state: readOptionalText(record.state),
    thirdPartyAvatar: readOptionalText(record.thirdPartyAvatar),
    thirdPartyUserId: readOptionalText(record.thirdPartyUserId),
    thirdPartyUserName: readOptionalText(record.thirdPartyUserName),
  }) as ServerUserThirdPartyBindRequest;
}

const localUserCenterService: IUserCenterService = {
  async bindEmail(email: string, verifyCode?: string): Promise<UserCenterProfile> {
    const client = getUserCenterServerClient();
    const response = await client.bindUserEmail({
      email: requireText(email, 'Email is required to bind the user account.'),
      verificationCode: requireText(verifyCode, 'Verification code is required to bind the email address.'),
    });

    return mapServerProfile(response.data) as UserCenterProfile;
  },

  async bindPhone(phone: string, verifyCode?: string): Promise<UserCenterProfile> {
    const client = getUserCenterServerClient();
    const response = await client.bindUserPhone({
      phone: requireText(phone, 'Phone number is required to bind the user account.'),
      verificationCode: requireText(verifyCode, 'Verification code is required to bind the phone number.'),
    });

    return mapServerProfile(response.data) as UserCenterProfile;
  },

  async bindThirdParty(platform: UserCenterBindPlatform, input?: UserCenterThirdPartyBindInput): Promise<void> {
    const client = getUserCenterServerClient();
    await client.bindUserPlatform(platform, toThirdPartyBindRequest(input));
  },

  async changePassword(input: UserCenterChangePasswordInput): Promise<void> {
    if (input.newPassword !== input.confirmPassword) {
      throw new Error('The new password confirmation does not match.');
    }

    const client = getUserCenterServerClient();
    await client.changeUserPassword({
      confirmPassword: input.confirmPassword,
      newPassword: input.newPassword,
      oldPassword: input.oldPassword,
    });
  },

  async createAddress(input: UserCenterCreateAddressInput): Promise<UserCenterAddress> {
    const client = getUserCenterServerClient();
    const response = await client.createUserAddress(toServerAddressCreateRequest(input));
    return mapServerAddress(response.data) as UserCenterAddress;
  },

  async deleteAddress(addressId: string | number): Promise<void> {
    const client = getUserCenterServerClient();
    await client.deleteUserAddress(String(addressId));
  },

  async getDefaultAddress(): Promise<UserCenterAddress | null> {
    const client = getUserCenterServerClient();
    const response = await client.readDefaultUserAddress();
    return mapServerAddress(response.data);
  },

  async getGenerationHistory(params?: UserCenterHistoryQuery): Promise<UserCenterHistoryPage> {
    const client = getUserCenterServerClient();
    const response = await client.readUserGenerationHistory(normalizeHistoryQuery(params));
    return mapHistoryEnvelope(response as ServerUserHistoryEnvelope);
  },

  async getLoginHistory(params?: UserCenterHistoryQuery): Promise<UserCenterHistoryPage> {
    const client = getUserCenterServerClient();
    const response = await client.readUserLoginHistory(normalizeHistoryQuery(params));
    return mapHistoryEnvelope(response as ServerUserHistoryEnvelope);
  },

  async getUserProfile(): Promise<UserCenterProfile | null> {
    const client = getUserCenterServerClient();
    const response = await client.readUserProfile();
    return mapServerProfile(response.data);
  },

  async getUserSettings(): Promise<UserCenterSettings | null> {
    const client = getUserCenterServerClient();
    const response = await client.readUserSettings();
    return (response.data ?? null) as UserCenterSettings | null;
  },

  async listUserAddresses(): Promise<UserCenterAddress[]> {
    const client = getUserCenterServerClient();
    const response = await client.listUserAddresses();

    return response.items
      .map((address) => mapServerAddress(address))
      .filter((address): address is UserCenterAddress => Boolean(address));
  },

  async listUserBindings(): Promise<UserCenterBinding[]> {
    const client = getUserCenterServerClient();
    const response = await client.listUserBindings();
    return response.items.map((binding) => mapServerBinding(binding));
  },

  async setDefaultAddress(addressId: string | number): Promise<UserCenterAddress> {
    const client = getUserCenterServerClient();
    const response = await client.setDefaultUserAddress(String(addressId));
    return mapServerAddress(response.data) as UserCenterAddress;
  },

  async unbindEmail(): Promise<UserCenterProfile> {
    const client = getUserCenterServerClient();
    const response = await client.unbindUserEmail();
    return mapServerProfile(response.data) as UserCenterProfile;
  },

  async unbindPhone(): Promise<UserCenterProfile> {
    const client = getUserCenterServerClient();
    const response = await client.unbindUserPhone();
    return mapServerProfile(response.data) as UserCenterProfile;
  },

  async unbindThirdParty(platform: UserCenterBindPlatform): Promise<void> {
    const client = getUserCenterServerClient();
    await client.unbindUserPlatform(platform);
  },

  async updateAddress(addressId: string | number, input: UserCenterUpdateAddressInput): Promise<UserCenterAddress> {
    const client = getUserCenterServerClient();
    const response = await client.updateUserAddress(String(addressId), toServerAddressUpdateRequest(input));
    return mapServerAddress(response.data) as UserCenterAddress;
  },

  async updateUserProfile(input: UserCenterUpdateProfileInput): Promise<UserCenterProfile> {
    const client = getUserCenterServerClient();
    const response = await client.updateUserProfile(toServerProfileUpdateRequest(input));
    return mapServerProfile(response.data) as UserCenterProfile;
  },

  async updateUserSettings(input: UserCenterUpdateSettingsInput): Promise<UserCenterSettings> {
    const client = getUserCenterServerClient();
    const response = await client.updateUserSettings(toServerUserSettingsUpdateRequest(input));
    return response.data as UserCenterSettings;
  },

  async uploadUserAvatar(input: UserCenterAvatarUploadInput): Promise<UserCenterProfile> {
    const client = getUserCenterServerClient();
    const response = await client.uploadUserAvatar(toUploadAvatarRequest(input));
    return mapServerProfile(response.data) as UserCenterProfile;
  },
};

const controller = createServiceAdapterController<IUserCenterService>(localUserCenterService);

export const userCenterService: IUserCenterService = controller.service;
export const setUserCenterServiceAdapter = controller.setAdapter;
export const getUserCenterServiceAdapter = controller.getAdapter;
export const resetUserCenterServiceAdapter = controller.resetAdapter;
