import { useMemo, useSyncExternalStore } from 'react';
import type {
  CreateSdkworkAuthControllerOptions,
  CreateSdkworkAuthServiceOptions,
  SdkworkAuthClient,
  SdkworkAuthController,
  SdkworkAuthControllerState,
  SdkworkAuthLoginQrCode,
  SdkworkAuthLoginQrCodeStatusResult,
  SdkworkAuthOAuthAuthorizationInput,
  SdkworkAuthOAuthLoginInput,
  SdkworkAuthService,
  SdkworkAuthSession,
  SdkworkAuthSessionBridgeLoginInput,
  SdkworkAuthUser,
} from '@sdkwork/auth-pc-react';
import { appAuthService, type AppAuthQrStatusResult, type AppAuthSession } from './appAuthService.ts';
import { normalizeAuthDeviceType } from '../runtime/authDeviceType.ts';

function readText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function readErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function unsupportedCapability(message: string): never {
  throw new Error(message);
}

function toSdkworkAuthUser(session: AppAuthSession): SdkworkAuthUser {
  const displayName = readText(session.displayName) || readText(session.username) || readText(session.userId);
  const nameParts = displayName.split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] || displayName;
  const lastName = nameParts.slice(1).join(' ');
  const initials = nameParts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || displayName.slice(0, 1).toUpperCase() || 'U';

  return {
    avatarUrl: readText(session.avatarUrl) || readText(session.avatar) || undefined,
    displayName,
    email: readText(session.email),
    firstName,
    id: readText(session.userId) || undefined,
    initials,
    lastName,
    username: readText(session.username) || undefined,
  };
}

function toSdkworkAuthSession(session: AppAuthSession): SdkworkAuthSession {
  return {
    accessToken: readText(session.accessToken),
    authToken: readText(session.authToken),
    refreshToken: readText(session.refreshToken) || undefined,
    user: toSdkworkAuthUser(session),
  };
}

function toSdkworkQrCodeStatus(
  result: AppAuthQrStatusResult,
): SdkworkAuthLoginQrCodeStatusResult {
  return {
    ...(result.session ? { session: toSdkworkAuthSession(result.session) } : {}),
    status: result.status,
    ...(result.session ? { user: toSdkworkAuthUser(result.session) } : {}),
  };
}

export function bindSdkworkAuthClient<TClient extends SdkworkAuthClient>(
  client: TClient,
): TClient {
  return client;
}

export function createMagicAuthService(
  _options: CreateSdkworkAuthServiceOptions = {},
): SdkworkAuthService {
  return {
    async checkLoginQrCodeStatus(qrKey: string) {
      return toSdkworkQrCodeStatus(await appAuthService.checkQrCodeStatus(qrKey));
    },
    async generateLoginQrCode() {
      const payload = await appAuthService.generateQrCode();
      return {
        description: undefined,
        expireTime: payload.expireTime,
        qrContent: payload.qrContent,
        qrKey: payload.qrKey,
        qrUrl: payload.qrUrl,
        title: undefined,
        type: undefined,
      } satisfies SdkworkAuthLoginQrCode;
    },
    async getCurrentSession() {
      const session = await appAuthService.getCurrentSession();
      return session ? toSdkworkAuthSession(session) : null;
    },
    async getCurrentUser() {
      const session = await appAuthService.getCurrentSession();
      return session ? toSdkworkAuthUser(session) : null;
    },
    async getOAuthAuthorizationUrl(_input: SdkworkAuthOAuthAuthorizationInput) {
      return unsupportedCapability(
        'OAuth authorization is not implemented in the canonical Magic Studio auth API.',
      );
    },
    async register(input) {
      return toSdkworkAuthSession(
        await appAuthService.register({
          confirmPassword: input.confirmPassword,
          email: input.email,
          password: input.password,
          phone: input.phone,
          username: input.username,
          verificationCode: input.verificationCode,
        }),
      );
    },
    async requestPasswordReset(input) {
      await appAuthService.requestPasswordReset(input);
    },
    async resetPassword(input) {
      await appAuthService.resetPassword(input);
    },
    async sendVerifyCode(input) {
      await appAuthService.sendVerifyCode(input);
    },
    async signIn(input) {
      return toSdkworkAuthSession(
        await appAuthService.login({
          password: input.password,
          username: input.username,
        }),
      );
    },
    async signInWithEmailCode(_input) {
      return unsupportedCapability(
        'Email code login is not implemented in the canonical Magic Studio auth API.',
      );
    },
    async signInWithOAuth(_input: SdkworkAuthOAuthLoginInput) {
      return unsupportedCapability(
        'OAuth login is not implemented in the canonical Magic Studio auth API.',
      );
    },
    async signInWithPhoneCode(input) {
      return toSdkworkAuthSession(
        await appAuthService.loginWithPhone({
          code: input.code,
          deviceType: normalizeAuthDeviceType(input.deviceType),
          phone: input.phone,
        }),
      );
    },
    async signInWithSessionBridge(_input: SdkworkAuthSessionBridgeLoginInput) {
      return unsupportedCapability(
        'Unified user center session bridge is not implemented in the canonical Magic Studio auth API.',
      );
    },
    async signOut() {
      await appAuthService.logout();
    },
    async verifyCode(input) {
      return appAuthService.verifyCode(input);
    },
  };
}

function createAnonymousState(
  initialState: Partial<SdkworkAuthControllerState> = {},
): SdkworkAuthControllerState {
  return {
    isAuthenticated: false,
    isBootstrapped: false,
    isBusy: false,
    session: null,
    status: 'anonymous',
    user: null,
    ...initialState,
  };
}

function mergeBusyState(
  state: SdkworkAuthControllerState,
  next: Partial<SdkworkAuthControllerState>,
): SdkworkAuthControllerState {
  return {
    ...state,
    ...next,
  };
}

export function createMagicAuthController(
  options: CreateSdkworkAuthControllerOptions = {},
): SdkworkAuthController {
  const service = {
    ...createMagicAuthService(),
    ...(options.service ?? {}),
  } as SdkworkAuthService;
  const listeners = new Set<() => void>();
  let state = createAnonymousState(options.initialState);

  const emitChange = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  const setState = (nextState: SdkworkAuthControllerState) => {
    state = nextState;
    emitChange();
  };

  const setPartialState = (nextState: Partial<SdkworkAuthControllerState>) => {
    setState(mergeBusyState(state, nextState));
  };

  const applyResolvedSession = (session: SdkworkAuthSession) => {
    setState({
      ...state,
      isAuthenticated: true,
      isBootstrapped: true,
      isBusy: false,
      lastError: undefined,
      session,
      status: 'authenticated',
      user: session.user ?? null,
    });
  };

  const clearResolvedSession = () => {
    setState({
      ...state,
      isAuthenticated: false,
      isBootstrapped: true,
      isBusy: false,
      lastError: undefined,
      session: null,
      status: 'anonymous',
      user: null,
    });
  };

  const controller: SdkworkAuthController = {
    applySession(session: SdkworkAuthSession) {
      applyResolvedSession(session);
    },
    async bootstrap() {
      setPartialState({
        isBusy: true,
        lastError: undefined,
      });

      try {
        const session = await service.getCurrentSession();
        if (session) {
          applyResolvedSession(session);
        } else {
          clearResolvedSession();
        }
      } catch (error) {
        setState({
          ...state,
          isAuthenticated: false,
          isBootstrapped: true,
          isBusy: false,
          lastError: readErrorMessage(error, 'Failed to bootstrap auth session.'),
          session: null,
          status: 'anonymous',
          user: null,
        });
      }

      return state;
    },
    async checkLoginQrCodeStatus(qrKey: string) {
      const result = await service.checkLoginQrCodeStatus(qrKey);
      if (result.status === 'confirmed' && result.session) {
        applyResolvedSession(result.session);
      }
      return result;
    },
    async generateLoginQrCode() {
      return service.generateLoginQrCode();
    },
    async getOAuthAuthorizationUrl(input: SdkworkAuthOAuthAuthorizationInput) {
      return service.getOAuthAuthorizationUrl(input);
    },
    getState() {
      return state;
    },
    async register(input) {
      setPartialState({
        isBusy: true,
        lastError: undefined,
        status: 'authenticating',
      });

      try {
        const session = await service.register(input);
        applyResolvedSession(session);
        return session;
      } catch (error) {
        setState({
          ...state,
          isBootstrapped: true,
          isBusy: false,
          lastError: readErrorMessage(error, 'Failed to register account.'),
          status: state.session ? 'authenticated' : 'anonymous',
        });
        throw error;
      }
    },
    async requestPasswordReset(input) {
      setPartialState({
        isBusy: true,
        lastError: undefined,
      });

      try {
        await service.requestPasswordReset(input);
        setPartialState({
          isBusy: false,
        });
      } catch (error) {
        setState({
          ...state,
          isBusy: false,
          lastError: readErrorMessage(error, 'Failed to request password reset.'),
        });
        throw error;
      }
    },
    async resetPassword(input) {
      setPartialState({
        isBusy: true,
        lastError: undefined,
      });

      try {
        await service.resetPassword(input);
        setPartialState({
          isBusy: false,
        });
      } catch (error) {
        setState({
          ...state,
          isBusy: false,
          lastError: readErrorMessage(error, 'Failed to reset password.'),
        });
        throw error;
      }
    },
    async sendVerifyCode(input) {
      setPartialState({
        isBusy: true,
        lastError: undefined,
      });

      try {
        await service.sendVerifyCode(input);
        setPartialState({
          isBusy: false,
        });
      } catch (error) {
        setState({
          ...state,
          isBusy: false,
          lastError: readErrorMessage(error, 'Failed to send verification code.'),
        });
        throw error;
      }
    },
    service,
    async signIn(input) {
      setPartialState({
        isBusy: true,
        lastError: undefined,
        status: 'authenticating',
      });

      try {
        const session = await service.signIn(input);
        applyResolvedSession(session);
        return session;
      } catch (error) {
        setState({
          ...state,
          isBootstrapped: true,
          isBusy: false,
          lastError: readErrorMessage(error, 'Failed to sign in.'),
          status: state.session ? 'authenticated' : 'anonymous',
        });
        throw error;
      }
    },
    async signInWithEmailCode(input) {
      setPartialState({
        isBusy: true,
        lastError: undefined,
        status: 'authenticating',
      });

      try {
        const session = await service.signInWithEmailCode(input);
        applyResolvedSession(session);
        return session;
      } catch (error) {
        setState({
          ...state,
          isBootstrapped: true,
          isBusy: false,
          lastError: readErrorMessage(error, 'Failed to sign in with email code.'),
          status: state.session ? 'authenticated' : 'anonymous',
        });
        throw error;
      }
    },
    async signInWithOAuth(input) {
      setPartialState({
        isBusy: true,
        lastError: undefined,
        status: 'authenticating',
      });

      try {
        const session = await service.signInWithOAuth(input);
        applyResolvedSession(session);
        return session;
      } catch (error) {
        setState({
          ...state,
          isBootstrapped: true,
          isBusy: false,
          lastError: readErrorMessage(error, 'Failed to sign in with OAuth.'),
          status: state.session ? 'authenticated' : 'anonymous',
        });
        throw error;
      }
    },
    async signInWithPhoneCode(input) {
      setPartialState({
        isBusy: true,
        lastError: undefined,
        status: 'authenticating',
      });

      try {
        const session = await service.signInWithPhoneCode(input);
        applyResolvedSession(session);
        return session;
      } catch (error) {
        setState({
          ...state,
          isBootstrapped: true,
          isBusy: false,
          lastError: readErrorMessage(error, 'Failed to sign in with phone code.'),
          status: state.session ? 'authenticated' : 'anonymous',
        });
        throw error;
      }
    },
    async signInWithSessionBridge(input) {
      setPartialState({
        isBusy: true,
        lastError: undefined,
        status: 'authenticating',
      });

      try {
        const session = await service.signInWithSessionBridge(input);
        applyResolvedSession(session);
        return session;
      } catch (error) {
        setState({
          ...state,
          isBootstrapped: true,
          isBusy: false,
          lastError: readErrorMessage(error, 'Failed to sign in through the unified user center.'),
          status: state.session ? 'authenticated' : 'anonymous',
        });
        throw error;
      }
    },
    async signOut() {
      setPartialState({
        isBusy: true,
        lastError: undefined,
      });

      try {
        await service.signOut();
        clearResolvedSession();
      } catch (error) {
        setState({
          ...state,
          isBusy: false,
          lastError: readErrorMessage(error, 'Failed to sign out.'),
        });
        throw error;
      }
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    syncUserProfile(user: SdkworkAuthUser | null) {
      setState({
        ...state,
        session: state.session
          ? {
              ...state.session,
              ...(user ? { user } : {}),
            }
          : state.session,
        user,
      });
    },
  };

  return controller;
}

export function useMagicAuthController(
  controller?: SdkworkAuthController,
): SdkworkAuthController {
  return useMemo(
    () => controller ?? createMagicAuthController(),
    [controller],
  );
}

export function useMagicAuthControllerState(
  controller: SdkworkAuthController,
): SdkworkAuthControllerState {
  return useSyncExternalStore(
    controller.subscribe,
    controller.getState,
    controller.getState,
  );
}
