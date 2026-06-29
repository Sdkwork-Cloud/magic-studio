import type {
  MagicStudioApiEnvelope,
  MagicStudioApiListEnvelope,
  MagicStudioOperationOkResult,
  MagicStudioServerClient,
  MagicStudioUserAddressCreateRequest,
  MagicStudioUserAddressUpdateRequest,
  MagicStudioUserAvatarUploadRequest,
  MagicStudioUserBindEmailRequest,
  MagicStudioUserBindPhoneRequest,
  MagicStudioUserHistoryQuery,
  MagicStudioUserPasswordChangeRequest,
  MagicStudioUserProfileUpdateRequest,
  MagicStudioUserSettingsUpdateRequest,
  MagicStudioUserThirdPartyBindRequest,
  UserAddress,
  UserBinding,
  UserGenerationHistoryEntry,
  UserLoginHistoryEntry,
  UserProfile,
  UserSettings,
} from '@sdkwork/magic-studio-server';

type AssertAssignable<T extends U, U> = true;

type RuntimeReadProfileEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['readUserProfile']>
>;
type RuntimeUpdateProfileRequest =
  Parameters<MagicStudioServerClient['updateUserProfile']>[0];
type RuntimeUpdateProfileEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['updateUserProfile']>
>;
type RuntimeAvatarUploadRequest =
  Parameters<MagicStudioServerClient['uploadUserAvatar']>[0];
type RuntimeAvatarUploadEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['uploadUserAvatar']>
>;
type RuntimeReadSettingsEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['readUserSettings']>
>;
type RuntimeUpdateSettingsRequest =
  Parameters<MagicStudioServerClient['updateUserSettings']>[0];
type RuntimeUpdateSettingsEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['updateUserSettings']>
>;
type RuntimePasswordChangeRequest =
  Parameters<MagicStudioServerClient['changeUserPassword']>[0];
type RuntimePasswordChangeEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['changeUserPassword']>
>;
type RuntimeAddressList = Awaited<
  ReturnType<MagicStudioServerClient['listUserAddresses']>
>;
type RuntimeDefaultAddressEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['readDefaultUserAddress']>
>;
type RuntimeAddressCreateRequest =
  Parameters<MagicStudioServerClient['createUserAddress']>[0];
type RuntimeAddressCreateEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['createUserAddress']>
>;
type RuntimeAddressUpdateRequest =
  Parameters<MagicStudioServerClient['updateUserAddress']>[1];
type RuntimeAddressUpdateEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['updateUserAddress']>
>;
type RuntimeAddressDeleteEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['deleteUserAddress']>
>;
type RuntimeSetDefaultAddressEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['setDefaultUserAddress']>
>;
type RuntimeHistoryQuery = NonNullable<
  Parameters<MagicStudioServerClient['readUserLoginHistory']>[0]
>;
type RuntimeLoginHistoryList = Awaited<
  ReturnType<MagicStudioServerClient['readUserLoginHistory']>
>;
type RuntimeGenerationHistoryList = Awaited<
  ReturnType<MagicStudioServerClient['readUserGenerationHistory']>
>;
type RuntimeBindingList = Awaited<
  ReturnType<MagicStudioServerClient['listUserBindings']>
>;
type RuntimeBindEmailRequest =
  Parameters<MagicStudioServerClient['bindUserEmail']>[0];
type RuntimeBindEmailEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['bindUserEmail']>
>;
type RuntimeBindPhoneRequest =
  Parameters<MagicStudioServerClient['bindUserPhone']>[0];
type RuntimeBindPhoneEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['bindUserPhone']>
>;
type RuntimeThirdPartyBindRequest =
  Parameters<MagicStudioServerClient['bindUserPlatform']>[1];
type RuntimeThirdPartyBindEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['bindUserPlatform']>
>;
type RuntimeThirdPartyUnbindEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['unbindUserPlatform']>
>;

const runtimeReadProfileEnvelopeMatchesServerType: AssertAssignable<
  RuntimeReadProfileEnvelope,
  MagicStudioApiEnvelope<UserProfile>
> = true;
const runtimeUpdateProfileRequestMatchesServerType: AssertAssignable<
  RuntimeUpdateProfileRequest,
  MagicStudioUserProfileUpdateRequest
> = true;
const serverUpdateProfileRequestMatchesRuntimeType: AssertAssignable<
  MagicStudioUserProfileUpdateRequest,
  RuntimeUpdateProfileRequest
> = true;
const runtimeUpdateProfileEnvelopeMatchesServerType: AssertAssignable<
  RuntimeUpdateProfileEnvelope,
  MagicStudioApiEnvelope<UserProfile>
> = true;
const runtimeAvatarUploadRequestMatchesServerType: AssertAssignable<
  RuntimeAvatarUploadRequest,
  MagicStudioUserAvatarUploadRequest
> = true;
const runtimeAvatarUploadEnvelopeMatchesServerType: AssertAssignable<
  RuntimeAvatarUploadEnvelope,
  MagicStudioApiEnvelope<UserProfile>
> = true;
const runtimeReadSettingsEnvelopeMatchesServerType: AssertAssignable<
  RuntimeReadSettingsEnvelope,
  MagicStudioApiEnvelope<UserSettings>
> = true;
const runtimeUpdateSettingsRequestMatchesServerType: AssertAssignable<
  RuntimeUpdateSettingsRequest,
  MagicStudioUserSettingsUpdateRequest
> = true;
const runtimeUpdateSettingsEnvelopeMatchesServerType: AssertAssignable<
  RuntimeUpdateSettingsEnvelope,
  MagicStudioApiEnvelope<UserSettings>
> = true;
const runtimePasswordChangeRequestMatchesServerType: AssertAssignable<
  RuntimePasswordChangeRequest,
  MagicStudioUserPasswordChangeRequest
> = true;
const runtimePasswordChangeEnvelopeMatchesServerType: AssertAssignable<
  RuntimePasswordChangeEnvelope,
  MagicStudioApiEnvelope<MagicStudioOperationOkResult>
> = true;
const runtimeAddressListMatchesServerType: AssertAssignable<
  RuntimeAddressList,
  MagicStudioApiListEnvelope<UserAddress>
> = true;
const runtimeDefaultAddressEnvelopeMatchesServerType: AssertAssignable<
  RuntimeDefaultAddressEnvelope,
  MagicStudioApiEnvelope<UserAddress | null>
> = true;
const runtimeAddressCreateRequestMatchesServerType: AssertAssignable<
  RuntimeAddressCreateRequest,
  MagicStudioUserAddressCreateRequest
> = true;
const runtimeAddressCreateEnvelopeMatchesServerType: AssertAssignable<
  RuntimeAddressCreateEnvelope,
  MagicStudioApiEnvelope<UserAddress>
> = true;
const runtimeAddressUpdateRequestMatchesServerType: AssertAssignable<
  RuntimeAddressUpdateRequest,
  MagicStudioUserAddressUpdateRequest
> = true;
const runtimeAddressUpdateEnvelopeMatchesServerType: AssertAssignable<
  RuntimeAddressUpdateEnvelope,
  MagicStudioApiEnvelope<UserAddress>
> = true;
const runtimeAddressDeleteEnvelopeMatchesServerType: AssertAssignable<
  RuntimeAddressDeleteEnvelope,
  MagicStudioApiEnvelope<MagicStudioOperationOkResult>
> = true;
const runtimeSetDefaultAddressEnvelopeMatchesServerType: AssertAssignable<
  RuntimeSetDefaultAddressEnvelope,
  MagicStudioApiEnvelope<UserAddress>
> = true;
const runtimeHistoryQueryMatchesServerType: AssertAssignable<
  RuntimeHistoryQuery,
  MagicStudioUserHistoryQuery
> = true;
const runtimeLoginHistoryListMatchesServerType: AssertAssignable<
  RuntimeLoginHistoryList,
  MagicStudioApiListEnvelope<UserLoginHistoryEntry>
> = true;
const runtimeGenerationHistoryListMatchesServerType: AssertAssignable<
  RuntimeGenerationHistoryList,
  MagicStudioApiListEnvelope<UserGenerationHistoryEntry>
> = true;
const runtimeBindingListMatchesServerType: AssertAssignable<
  RuntimeBindingList,
  MagicStudioApiListEnvelope<UserBinding>
> = true;
const runtimeBindEmailRequestMatchesServerType: AssertAssignable<
  RuntimeBindEmailRequest,
  MagicStudioUserBindEmailRequest
> = true;
const runtimeBindEmailEnvelopeMatchesServerType: AssertAssignable<
  RuntimeBindEmailEnvelope,
  MagicStudioApiEnvelope<UserProfile>
> = true;
const runtimeBindPhoneRequestMatchesServerType: AssertAssignable<
  RuntimeBindPhoneRequest,
  MagicStudioUserBindPhoneRequest
> = true;
const runtimeBindPhoneEnvelopeMatchesServerType: AssertAssignable<
  RuntimeBindPhoneEnvelope,
  MagicStudioApiEnvelope<UserProfile>
> = true;
const runtimeThirdPartyBindRequestMatchesServerType: AssertAssignable<
  RuntimeThirdPartyBindRequest,
  MagicStudioUserThirdPartyBindRequest
> = true;
const runtimeThirdPartyBindEnvelopeMatchesServerType: AssertAssignable<
  RuntimeThirdPartyBindEnvelope,
  MagicStudioApiEnvelope<UserBinding>
> = true;
const runtimeThirdPartyUnbindEnvelopeMatchesServerType: AssertAssignable<
  RuntimeThirdPartyUnbindEnvelope,
  MagicStudioApiEnvelope<MagicStudioOperationOkResult>
> = true;

const validUserProfile = {
  id: '1',
  uuid: '1',
  createdAt: '2026-04-25T00:00:00.000Z',
  updatedAt: '2026-04-25T00:01:00.000Z',
  userId: '1',
  username: 'alice',
  nickname: 'Alice',
  email: 'alice@example.com',
  phone: '18800001111',
  avatar: 'https://example.com/avatar.png',
  bio: 'profile bio',
  gender: 'female',
  region: 'Shanghai',
} satisfies UserProfile;

const validUserSettings = {
  language: 'zh-CN',
  theme: 'light',
  autoPlay: true,
  highQuality: true,
  dataSaver: false,
  security: {
    loginAlerts: true,
  },
} satisfies UserSettings;

const validUserAddress = {
  id: 'address-1',
  uuid: 'address-1',
  createdAt: '2026-04-25T00:00:00.000Z',
  updatedAt: '2026-04-25T00:01:00.000Z',
  name: 'Alice',
  phone: '18800001111',
  cityCode: '310100',
  addressDetail: 'No. 1 Bund',
  fullAddress: 'Shanghai No. 1 Bund',
  isDefault: true,
} satisfies UserAddress;

const validUserBinding = {
  id: 'binding-1',
  uuid: 'binding-1',
  createdAt: '2026-04-25T00:00:00.000Z',
  updatedAt: '2026-04-25T00:01:00.000Z',
  platform: 'wechat',
  target: 'alice_wechat',
  displayName: 'Alice',
  boundAt: '2026-04-25T00:00:30.000Z',
} satisfies UserBinding;

const validLoginHistory = {
  id: 'login-1',
  uuid: 'login-1',
  createdAt: '2026-04-25T00:00:00.000Z',
  updatedAt: '2026-04-25T00:00:00.000Z',
  authMethod: 'password',
  status: 'success',
  loginAt: '2026-04-25T00:00:00.000Z',
} satisfies UserLoginHistoryEntry;

const validGenerationHistory = {
  id: 'generation-1',
  uuid: 'generation-1',
  createdAt: '2026-04-25T00:00:00.000Z',
  updatedAt: '2026-04-25T00:00:00.000Z',
  taskId: 'task-1',
  category: 'image',
  status: 'completed',
} satisfies UserGenerationHistoryEntry;

const validUpdateProfileRequest = {
  avatar: validUserProfile.avatar,
  bio: validUserProfile.bio,
  email: validUserProfile.email,
  gender: validUserProfile.gender,
  nickname: 'Alice Updated',
  phone: validUserProfile.phone,
  region: 'Hangzhou',
  username: validUserProfile.username,
} satisfies RuntimeUpdateProfileRequest;

const validAvatarUploadRequest = {
  file: 'data:image/png;base64,iVBORw==',
} satisfies RuntimeAvatarUploadRequest;

const validUpdateSettingsRequest = {
  language: 'zh-CN',
  theme: 'dark',
  security: {
    loginAlerts: true,
  },
} satisfies RuntimeUpdateSettingsRequest;

const validPasswordChangeRequest = {
  oldPassword: 'current-password',
  newPassword: 'next-password',
  confirmPassword: 'next-password',
} satisfies RuntimePasswordChangeRequest;

const validAddressCreateRequest = {
  name: validUserAddress.name,
  phone: validUserAddress.phone,
  addressDetail: validUserAddress.addressDetail,
  cityCode: validUserAddress.cityCode,
  isDefault: true,
} satisfies RuntimeAddressCreateRequest;

const validAddressUpdateRequest = {
  cityCode: '330100',
  addressDetail: 'No. 88 West Lake Road',
} satisfies RuntimeAddressUpdateRequest;

const validHistoryQuery = {
  page: 1,
  pageSize: 20,
} satisfies RuntimeHistoryQuery;

const validBindEmailRequest = {
  email: validUserProfile.email,
  verificationCode: '123456',
} satisfies RuntimeBindEmailRequest;

const validBindPhoneRequest = {
  phone: validUserProfile.phone,
  verificationCode: '654321',
} satisfies RuntimeBindPhoneRequest;

const validThirdPartyBindRequest = {
  code: 'oauth-code',
  state: 'oauth-state',
  metadata: {
    source: 'settings',
  },
} satisfies RuntimeThirdPartyBindRequest;

const validUserProfileResponse = {
  requestId: 'request-user-profile',
  timestamp: '2026-04-25T00:00:00.000Z',
  data: validUserProfile,
  meta: {
    version: '2026-04-25',
  },
} satisfies RuntimeReadProfileEnvelope;

const validUserSettingsResponse = {
  requestId: 'request-user-settings',
  timestamp: '2026-04-25T00:00:00.000Z',
  data: validUserSettings,
  meta: {
    version: '2026-04-25',
  },
} satisfies RuntimeReadSettingsEnvelope;

const validUserAddressResponse = {
  requestId: 'request-user-address',
  timestamp: '2026-04-25T00:00:00.000Z',
  data: validUserAddress,
  meta: {
    version: '2026-04-25',
  },
} satisfies RuntimeAddressCreateEnvelope;

const validUserAddressListResponse = {
  requestId: 'request-user-address-list',
  timestamp: '2026-04-25T00:00:00.000Z',
  items: [validUserAddress],
  meta: {
    page: 1,
    pageSize: 20,
    total: 1,
    version: '2026-04-25',
  },
} satisfies RuntimeAddressList;

const validLoginHistoryResponse = {
  requestId: 'request-user-login-history',
  timestamp: '2026-04-25T00:00:00.000Z',
  items: [validLoginHistory],
  meta: {
    page: 1,
    pageSize: 20,
    total: 1,
    version: '2026-04-25',
  },
} satisfies RuntimeLoginHistoryList;

const validGenerationHistoryResponse = {
  requestId: 'request-user-generation-history',
  timestamp: '2026-04-25T00:00:00.000Z',
  items: [validGenerationHistory],
  meta: {
    page: 1,
    pageSize: 20,
    total: 1,
    version: '2026-04-25',
  },
} satisfies RuntimeGenerationHistoryList;

const validBindingListResponse = {
  requestId: 'request-user-bindings',
  timestamp: '2026-04-25T00:00:00.000Z',
  items: [validUserBinding],
  meta: {
    page: 1,
    pageSize: 20,
    total: 1,
    version: '2026-04-25',
  },
} satisfies RuntimeBindingList;

const validOperationResponse = {
  requestId: 'request-user-operation',
  timestamp: '2026-04-25T00:00:00.000Z',
  data: {
    ok: true,
  },
  meta: {
    version: '2026-04-25',
  },
} satisfies RuntimePasswordChangeEnvelope;

void runtimeReadProfileEnvelopeMatchesServerType;
void runtimeUpdateProfileRequestMatchesServerType;
void serverUpdateProfileRequestMatchesRuntimeType;
void runtimeUpdateProfileEnvelopeMatchesServerType;
void runtimeAvatarUploadRequestMatchesServerType;
void runtimeAvatarUploadEnvelopeMatchesServerType;
void runtimeReadSettingsEnvelopeMatchesServerType;
void runtimeUpdateSettingsRequestMatchesServerType;
void runtimeUpdateSettingsEnvelopeMatchesServerType;
void runtimePasswordChangeRequestMatchesServerType;
void runtimePasswordChangeEnvelopeMatchesServerType;
void runtimeAddressListMatchesServerType;
void runtimeDefaultAddressEnvelopeMatchesServerType;
void runtimeAddressCreateRequestMatchesServerType;
void runtimeAddressCreateEnvelopeMatchesServerType;
void runtimeAddressUpdateRequestMatchesServerType;
void runtimeAddressUpdateEnvelopeMatchesServerType;
void runtimeAddressDeleteEnvelopeMatchesServerType;
void runtimeSetDefaultAddressEnvelopeMatchesServerType;
void runtimeHistoryQueryMatchesServerType;
void runtimeLoginHistoryListMatchesServerType;
void runtimeGenerationHistoryListMatchesServerType;
void runtimeBindingListMatchesServerType;
void runtimeBindEmailRequestMatchesServerType;
void runtimeBindEmailEnvelopeMatchesServerType;
void runtimeBindPhoneRequestMatchesServerType;
void runtimeBindPhoneEnvelopeMatchesServerType;
void runtimeThirdPartyBindRequestMatchesServerType;
void runtimeThirdPartyBindEnvelopeMatchesServerType;
void runtimeThirdPartyUnbindEnvelopeMatchesServerType;
void validUpdateProfileRequest;
void validAvatarUploadRequest;
void validUpdateSettingsRequest;
void validPasswordChangeRequest;
void validAddressCreateRequest;
void validAddressUpdateRequest;
void validHistoryQuery;
void validBindEmailRequest;
void validBindPhoneRequest;
void validThirdPartyBindRequest;
void validUserProfileResponse;
void validUserSettingsResponse;
void validUserAddressResponse;
void validUserAddressListResponse;
void validLoginHistoryResponse;
void validGenerationHistoryResponse;
void validBindingListResponse;
void validOperationResponse;
