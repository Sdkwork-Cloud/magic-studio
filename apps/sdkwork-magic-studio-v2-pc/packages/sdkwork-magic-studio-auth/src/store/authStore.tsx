import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  type SdkworkAuthController,
  type SdkworkAuthUser,
} from '@sdkwork/auth-pc-react';
import {
  clearAppSdkSessionTokens,
} from '@sdkwork/magic-studio-core/sdk';
import {
  i18nService,
} from '@sdkwork/magic-studio-i18n';
import {
  resolveCompatAuthUser,
  type CompatAuthUser,
} from '../authCompatibility';
import {
  appAuthService,
} from '../services/appAuthService';
import {
  createMagicAuthController,
  useMagicAuthControllerState,
} from '../services/sdkworkAuthBridge.ts';
import { resolveAuthDeviceType } from '../runtime/authDeviceType.ts';
import {
  refreshAuthStoreSession,
} from './authSessionRefresh';

export type User = CompatAuthUser;

export interface AuthStoreContextType {
  accessToken: string | null;
  authToken: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithPhone: (phone: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  refreshAuthToken: () => Promise<void>;
  refreshToken: string | null;
  register: (
    username: string,
    password: string,
    email?: string,
    phone?: string,
    verificationCode?: string,
  ) => Promise<void>;
  syncCurrentSession: () => Promise<boolean>;
  user: User | null;
}

const AuthControllerContext = createContext<SdkworkAuthController | null>(null);
const AuthStoreContext = createContext<AuthStoreContextType | null>(null);

function mapAuthUser(user: SdkworkAuthUser | null | undefined): User | null {
  return resolveCompatAuthUser(user);
}

export const AuthStoreProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [controller] = useState(() => createMagicAuthController());
  const state = useMagicAuthControllerState(controller);

  useEffect(() => {
    void controller.bootstrap().catch(() => {
      return undefined;
    });
  }, [controller]);

  const login = useCallback(
    async (username: string, password: string) => {
      await controller.signIn({
        password,
        username: username.trim(),
      });
    },
    [controller]
  );

  const loginWithEmail = useCallback(
    async (email: string, password: string) => {
      await controller.signIn({
        password,
        username: email.trim(),
      });
    },
    [controller]
  );

  const loginWithPhone = useCallback(
    async (phone: string, code: string) => {
      await controller.signInWithPhoneCode({
        code: code.trim(),
        deviceType: resolveAuthDeviceType(),
        phone: phone.trim(),
      });
    },
    [controller]
  );

  const logout = useCallback(async () => {
    await controller.signOut();
  }, [controller]);

  const register = useCallback(
    async (
      username: string,
      password: string,
      email?: string,
      phone?: string,
      verificationCode?: string,
    ) => {
      await controller.register({
        channel: email ? 'EMAIL' : phone ? 'PHONE' : undefined,
        confirmPassword: password,
        email: email?.trim() || undefined,
        password,
        phone: phone?.trim() || undefined,
        username: username.trim(),
        verificationCode: verificationCode?.trim() || undefined,
      });
    },
    [controller]
  );

  const syncCurrentSession = useCallback(async (): Promise<boolean> => {
    const nextState = await controller.bootstrap();
    return nextState.isAuthenticated;
  }, [controller]);
  const currentRefreshToken = state.session?.refreshToken ?? null;

  const refreshAuthToken = useCallback(async () => {
    try {
      await refreshAuthStoreSession({
        clearSession: () => clearAppSdkSessionTokens(),
        controller,
        refreshSession: (refreshToken) => appAuthService.refreshToken(refreshToken),
        refreshToken: currentRefreshToken,
      });
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : i18nService.t('auth.error.token_refresh_failed'),
        { cause: error }
      );
    }
  }, [controller, currentRefreshToken]);

  const refreshAccessToken = refreshAuthToken;

  const value = useMemo<AuthStoreContextType>(
    () => ({
      accessToken: state.session?.accessToken ?? null,
      authToken: state.session?.authToken ?? null,
      isAuthenticated: state.isAuthenticated,
      login,
      loginWithEmail,
      loginWithPhone,
      logout,
      refreshAccessToken,
      refreshAuthToken,
      refreshToken: currentRefreshToken,
      register,
      syncCurrentSession,
      user: mapAuthUser(state.user),
    }),
    [
      login,
      loginWithEmail,
      loginWithPhone,
      logout,
      refreshAccessToken,
      refreshAuthToken,
      register,
      state.isAuthenticated,
      currentRefreshToken,
      state.session,
      state.user,
      syncCurrentSession,
    ]
  );

  return (
    <AuthControllerContext.Provider value={controller}>
      <AuthStoreContext.Provider value={value}>
        {children}
      </AuthStoreContext.Provider>
    </AuthControllerContext.Provider>
  );
};

export function useAuthController(): SdkworkAuthController {
  const controller = useContext(AuthControllerContext);
  const [fallbackController] = useState(() => createMagicAuthController());

  return controller ?? fallbackController;
}

export const useAuthStore = (): AuthStoreContextType => {
  const context = useContext(AuthStoreContext);
  if (context === null) {
    throw new Error('useAuthStore must be used within a AuthStoreProvider');
  }
  return context;
};

