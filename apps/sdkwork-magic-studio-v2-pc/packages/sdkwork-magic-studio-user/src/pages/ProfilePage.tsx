import React, { useEffect, useMemo } from 'react';
import { Bell, ShieldCheck, Sparkles, UserCircle2 } from 'lucide-react';
import { useTranslation } from '@sdkwork/magic-studio-i18n';
import { SdkworkIamThemeProvider } from '@sdkwork/magic-studio-auth';
import { SettingsCenter } from '@sdkwork/ui-pc-react/components/patterns/settings';
import { LoadingBlock, StatusNotice, sdkToast } from '@sdkwork/ui-pc-react/components/ui/feedback';
import {
  createSdkworkUserController,
  useSdkworkUserController,
  useSdkworkUserControllerState,
  type SdkworkUserPreferences,
  type SdkworkUserProfile,
} from '@sdkwork/user-pc-react';
import {
  SdkworkUserNotificationsSection,
  SdkworkUserOverviewSection,
  SdkworkUserProfileSection,
  SdkworkUserSecuritySection,
} from '../components/user-sections';

type Translate = (key: string) => string;

const HOST_PRODUCT_NAME = 'Magic Studio';

function buildPageHighlights(t: Translate) {
  return [
    {
      description: t('user.highlights.accountCenter.description'),
      icon: <UserCircle2 className="h-5 w-5 text-white" />,
      title: t('user.highlights.accountCenter.title'),
    },
    {
      description: t('user.highlights.settingsSurfaces.description'),
      icon: <Bell className="h-5 w-5 text-white" />,
      title: t('user.highlights.settingsSurfaces.title'),
    },
    {
      description: t('user.highlights.securityBoundary.description'),
      icon: <ShieldCheck className="h-5 w-5 text-white" />,
      title: t('user.highlights.securityBoundary.title'),
    },
  ];
}

const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const controller = useSdkworkUserController(
    useMemo(() => createSdkworkUserController(), []),
  );
  const state = useSdkworkUserControllerState(controller);
  const accountCenterTitle = t('user.accountCenterTitle');
  const accountCenterDescription = t('user.accountCenterDescription');
  const pageHighlights = buildPageHighlights(t);

  useEffect(() => {
    void controller.load().catch(() => undefined);
  }, [controller]);

  const sections = [
    {
      title: t('user.groups.account'),
      items: [
        {
          id: 'profile',
          label: t('user.nav.profile'),
          description: t('user.nav.profileDescription'),
          keywords: ['profile', 'identity', 'avatar', HOST_PRODUCT_NAME.toLowerCase()],
        },
      ],
    },
    {
      title: t('user.groups.workspace'),
      items: [
        {
          id: 'overview',
          label: t('user.nav.overview'),
          description: t('user.nav.overviewDescription'),
          keywords: ['overview', 'workspace', 'preferences'],
        },
        {
          id: 'notifications',
          label: t('user.nav.notifications'),
          description: t('user.nav.notificationsDescription'),
          keywords: ['notifications', 'alerts', 'messages'],
        },
      ],
    },
    {
      title: t('user.groups.security'),
      items: [
        {
          id: 'security',
          label: t('user.nav.security'),
          description: t('user.nav.securityDescription'),
          keywords: ['security', 'password', 'login alerts'],
        },
      ],
    },
  ];

  async function handleProfileSubmit(profile: SdkworkUserProfile) {
    try {
      await controller.updateProfile(profile);
      sdkToast.success(t('user.toasts.profileSaved'));
    } catch (error) {
      sdkToast.error(error instanceof Error ? error.message : t('user.errors.saveProfileFailed'));
    }
  }

  async function handleNotificationsSubmit(preferences: Partial<SdkworkUserPreferences>) {
    try {
      await controller.updatePreferences(preferences);
      sdkToast.success(t('user.toasts.notificationPreferencesUpdated'));
    } catch (error) {
      sdkToast.error(error instanceof Error ? error.message : t('user.errors.saveNotificationsFailed'));
    }
  }

  async function handleSecuritySubmit(preferences: Partial<SdkworkUserPreferences>) {
    try {
      await controller.updatePreferences(preferences);
      sdkToast.success(t('user.toasts.securityPreferencesUpdated'));
    } catch (error) {
      sdkToast.error(error instanceof Error ? error.message : t('user.errors.saveSecurityFailed'));
    }
  }

  async function handlePasswordChange(currentPassword: string, nextPassword: string) {
    try {
      await controller.updatePassword(currentPassword, nextPassword);
      sdkToast.success(t('user.toasts.passwordUpdated'));
    } catch (error) {
      sdkToast.error(error instanceof Error ? error.message : t('user.errors.updatePasswordFailed'));
    }
  }

  const activeSection = (() => {
    if (state.isLoading || !state.profile || !state.preferences) {
      return <LoadingBlock label={t('user.loading')} />;
    }

    if (state.activeSectionId === 'overview') {
      return (
        <SdkworkUserOverviewSection
          preferences={state.preferences}
          profile={state.profile}
        />
      );
    }

    if (state.activeSectionId === 'notifications') {
      return (
        <SdkworkUserNotificationsSection
          isSaving={state.isSaving}
          onSubmit={handleNotificationsSubmit}
          preferences={state.preferences}
        />
      );
    }

    if (state.activeSectionId === 'security') {
      return (
        <SdkworkUserSecuritySection
          isSaving={state.isSaving}
          onChangePassword={handlePasswordChange}
          onSubmit={handleSecuritySubmit}
          preferences={state.preferences}
        />
      );
    }

    return (
      <SdkworkUserProfileSection
        isSaving={state.isSaving}
        onSubmit={handleProfileSubmit}
        profile={state.profile}
      />
    );
  })();

  return (
    <div data-magic-iam-screen="user">
      <SdkworkIamThemeProvider>
        <div className="relative flex min-h-full justify-center bg-[var(--sdk-color-surface-canvas)] px-4 py-4 sm:px-8 sm:py-8">
          <div className="relative w-full max-w-7xl overflow-hidden rounded-[2rem] border border-[var(--sdk-color-border-default)] bg-[color-mix(in_srgb,var(--sdk-color-surface-panel)_96%,white)] p-4 shadow-[0_28px_80px_rgba(24,24,27,0.10)] sm:p-6 lg:min-h-[720px] lg:p-8">
            <div className="mb-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
              <section className="rounded-[1.75rem] border border-[var(--sdk-color-border-default)] bg-[var(--sdk-color-surface-panel)] px-6 py-6 shadow-[var(--sdk-shadow-sm)] sm:px-8 sm:py-8">
                <div className="inline-flex rounded-full border border-[var(--sdk-color-border-default)] bg-[var(--sdk-color-surface-panel-muted)] px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--sdk-color-brand-primary)]">
                  {t('user.header.badge')}
                </div>
                <div className="mt-5 flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.2rem] bg-[#0f172a] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    <Sparkles className="h-7 w-7" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-3xl font-semibold tracking-tight text-[var(--sdk-color-text-primary)] sm:text-4xl">
                      {accountCenterTitle}
                    </h1>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--sdk-color-text-secondary)]">
                      {accountCenterDescription}
                    </p>
                  </div>
                </div>
              </section>

              <aside className="rounded-[1.75rem] border border-white/10 bg-[#0f172a] px-6 py-6 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                  {t('user.header.sharedStandards')}
                </div>
                <div className="grid gap-3">
                  {pageHighlights.map((item) => (
                    <div
                      className="rounded-[1.25rem] border border-white/10 bg-white/[0.06] p-4"
                      key={item.title}
                    >
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-[0.9rem] bg-white/10">
                        {item.icon}
                      </div>
                      <div className="text-sm font-semibold tracking-tight text-white">
                        {item.title}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </aside>
            </div>

            {state.lastError ? (
              <StatusNotice className="mb-4" tone="danger" title={t('user.errors.accountCenterError')}>
                {state.lastError}
              </StatusNotice>
            ) : null}

            <SettingsCenter
              activeItem={state.activeSectionId}
              description={accountCenterDescription}
              onActiveItemChange={(itemId) => controller.selectSection(itemId)}
              onSearchChange={(value) => controller.setSearchValue(value)}
              searchPlaceholder={t('user.searchPlaceholder')}
              searchValue={state.searchValue}
              sections={sections}
              title={accountCenterTitle}
            >
              {activeSection}
            </SettingsCenter>
          </div>
        </div>
      </SdkworkIamThemeProvider>
    </div>
  );
};

export default ProfilePage;
export { ProfilePage };
