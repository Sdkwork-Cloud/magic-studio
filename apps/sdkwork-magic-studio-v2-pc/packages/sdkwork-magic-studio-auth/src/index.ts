export { LoginPage as default } from './pages';
export {
  AuthOAuthCallbackPage,
  LoginPage,
} from './pages';
export * from './authStandard';
export { SdkworkIamThemeProvider } from './theme/SdkworkIamThemeProvider';
export {
  AuthStoreProvider,
  useAuthController,
  useAuthStore,
} from './store';
export * from './services';
export type {
  AuthStoreContextType,
  User,
} from './store';
export { defaultI18nConfig } from './i18n';
export * from '@sdkwork/auth-pc-react';

export type {
  LoginVO,
  LoginRequest,
  RegisterRequest,
  UserInfo,
} from './contracts/authPublicTypes';
