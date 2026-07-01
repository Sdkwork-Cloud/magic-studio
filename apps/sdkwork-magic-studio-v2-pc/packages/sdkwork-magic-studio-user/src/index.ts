import { getPackageI18nConfig, registerPackageI18n } from '@sdkwork/magic-studio-i18n';
import { defaultI18nConfig } from './i18n';

if (!getPackageI18nConfig(defaultI18nConfig.namespace)) {
  registerPackageI18n(defaultI18nConfig);
}

export { ProfilePage } from './pages/ProfilePage';
export { default } from './pages/ProfilePage';
export { defaultI18nConfig } from './i18n';
export * from './services';
export {
  SdkworkUserNotificationsSection,
  SdkworkUserOverviewSection,
  SdkworkUserProfileSection,
  SdkworkUserSecuritySection,
} from './components/user-sections';
export * from '@sdkwork/user-pc-react';
