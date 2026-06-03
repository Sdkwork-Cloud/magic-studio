import type {
  AuthSession,
  AuthSessionState,
  MagicStudioApiEnvelope,
  MagicStudioAuthLoginRequest,
  MagicStudioAuthRegisterRequest,
  MagicStudioServerClient,
} from '@sdkwork/magic-studio-server';
import type {
  LoginRequest,
  LoginVO,
  RegisterRequest,
  UserInfo,
} from './contracts/authPublicTypes.ts';

type AssertAssignable<T extends U, U> = true;

type RuntimeLoginRequest = Parameters<MagicStudioServerClient['login']>[0];
type RuntimeLoginEnvelope = Awaited<ReturnType<MagicStudioServerClient['login']>>;
type RuntimeLoginData = RuntimeLoginEnvelope extends MagicStudioApiEnvelope<
  infer Data
>
  ? Data
  : never;
type RuntimeRegisterRequest = Parameters<MagicStudioServerClient['register']>[0];
type RuntimeRegisterEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['register']>
>;
type RuntimeSessionEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['readAuthSession']>
>;

const runtimeLoginRequestMatchesExportedType: AssertAssignable<
  RuntimeLoginRequest,
  MagicStudioAuthLoginRequest
> = true;
const exportedLoginRequestMatchesRuntimeType: AssertAssignable<
  MagicStudioAuthLoginRequest,
  RuntimeLoginRequest
> = true;
const runtimeLoginDataMatchesAuthSession: AssertAssignable<
  RuntimeLoginData,
  AuthSession
> = true;
const runtimeRegisterRequestMatchesExportedType: AssertAssignable<
  RuntimeRegisterRequest,
  MagicStudioAuthRegisterRequest
> = true;
const exportedRegisterRequestMatchesRuntimeType: AssertAssignable<
  MagicStudioAuthRegisterRequest,
  RuntimeRegisterRequest
> = true;

const validLoginRequest = {
  username: 'alice',
  password: 'secret',
  captcha: '1234',
} satisfies LoginRequest;

const runtimeLoginRequest = {
  username: validLoginRequest.username,
  password: validLoginRequest.password,
} satisfies RuntimeLoginRequest;

const validRegisterRequest = {
  username: 'alice',
  password: 'secret',
  confirmPassword: 'secret',
  email: 'alice@example.com',
  phone: '13800000000',
  type: 'EMAIL',
  verificationCode: '654321',
} satisfies RegisterRequest;

const runtimeRegisterRequest = {
  username: validRegisterRequest.username,
  password: validRegisterRequest.password,
  confirmPassword: validRegisterRequest.confirmPassword,
  email: validRegisterRequest.email,
  phone: validRegisterRequest.phone,
  verificationCode: validRegisterRequest.verificationCode,
} satisfies RuntimeRegisterRequest;

const runtimeAuthSession = {
  accessToken: 'access-token',
  authToken: 'auth-token',
  refreshToken: 'refresh-token',
  expiresAt: '2026-04-05T02:00:00Z',
  user: {
    userId: '1',
    username: 'alice',
    displayName: 'Alice',
    email: 'alice@example.com',
    phone: '13800000000',
    avatarUrl: 'https://example.com/avatar.png',
  },
} satisfies AuthSession;

const runtimeLoginEnvelope = {
  requestId: 'request-auth-login',
  timestamp: '2026-04-05T00:00:00Z',
  data: runtimeAuthSession,
  meta: {
    version: '2026-04-25',
  },
} satisfies RuntimeLoginEnvelope;

const runtimeRegisterEnvelope = {
  requestId: 'request-auth-register',
  timestamp: '2026-04-05T00:00:00Z',
  data: runtimeAuthSession,
  meta: {
    version: '2026-04-25',
  },
} satisfies RuntimeRegisterEnvelope;

const runtimeSessionState = {
  isAuthenticated: true,
  session: runtimeAuthSession,
} satisfies AuthSessionState;

const runtimeSessionEnvelope = {
  requestId: 'request-auth-session',
  timestamp: '2026-04-05T00:00:00Z',
  data: runtimeSessionState,
  meta: {
    version: '2026-04-25',
  },
} satisfies RuntimeSessionEnvelope;

const validUserInfo = {
  username: runtimeAuthSession.user.username,
  email: runtimeAuthSession.user.email,
  phone: runtimeAuthSession.user.phone,
  nickname: runtimeAuthSession.user.displayName,
  avatar: runtimeAuthSession.user.avatarUrl,
  role: 'USER',
  status: 'ACTIVE',
  createdAt: '2026-04-05T00:00:00Z',
  updatedAt: '2026-04-05T00:00:00Z',
} satisfies UserInfo;

const validLoginVO = {
  accessToken: runtimeLoginEnvelope.data.accessToken,
  authToken: runtimeLoginEnvelope.data.authToken,
  refreshToken: runtimeLoginEnvelope.data.refreshToken,
  tokenType: 'Bearer',
  createdAt: '2026-04-05T00:00:00Z',
  updatedAt: '2026-04-05T00:00:00Z',
  userInfo: validUserInfo,
} satisfies LoginVO;

void runtimeLoginRequestMatchesExportedType;
void exportedLoginRequestMatchesRuntimeType;
void runtimeLoginDataMatchesAuthSession;
void runtimeRegisterRequestMatchesExportedType;
void exportedRegisterRequestMatchesRuntimeType;
void validLoginRequest;
void runtimeLoginRequest;
void validRegisterRequest;
void runtimeRegisterRequest;
void runtimeLoginEnvelope;
void runtimeRegisterEnvelope;
void runtimeSessionEnvelope;
void validLoginVO;
