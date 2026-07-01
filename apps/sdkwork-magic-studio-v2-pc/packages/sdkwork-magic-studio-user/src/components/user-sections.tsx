import { useEffect, useState, type ReactNode } from 'react';
import { Bell, Lock, ShieldCheck, Sparkles, UserCircle2 } from 'lucide-react';
import { useTranslation } from '@sdkwork/magic-studio-i18n';
import { Button } from '@sdkwork/ui-pc-react/components/ui/actions';
import { Input, Label, Switch } from '@sdkwork/ui-pc-react/components/ui/data-entry';
import { StatusNotice } from '@sdkwork/ui-pc-react/components/ui/feedback';
import { SettingsSection } from '@sdkwork/ui-pc-react/components/ui/form';
import type { SdkworkUserPreferences, SdkworkUserProfile } from '@sdkwork/user-pc-react';

function Surface({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--sdk-color-border-default)] bg-[var(--sdk-color-surface-panel)] p-6 shadow-[var(--sdk-shadow-sm)]">
      {children}
    </div>
  );
}

export function SdkworkUserOverviewSection({
  preferences,
  profile,
}: {
  preferences: SdkworkUserPreferences;
  profile: SdkworkUserProfile;
}) {
  const { t } = useTranslation();
  const displayName =
    [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim()
    || profile.email
    || t('user.accountCenterTitle');
  const summaryLabel = (value: boolean) =>
    value ? t('user.overview.summaryEnabled') : t('user.overview.summaryDisabled');

  return (
    <div className="space-y-6">
      <Surface>
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--sdk-color-brand-primary-soft)] text-[var(--sdk-color-brand-primary)]">
            <UserCircle2 className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xl font-semibold text-[var(--sdk-color-text-primary)]">{displayName}</div>
            <div className="mt-1 text-sm text-[var(--sdk-color-text-secondary)]">{profile.email}</div>
            <div className="mt-3 text-sm leading-6 text-[var(--sdk-color-text-secondary)]">
              {t('user.overview.description')}
            </div>
          </div>
        </div>
      </Surface>

      <div className="grid gap-4 md:grid-cols-3">
        <Surface>
          <div className="flex items-center gap-3 text-[var(--sdk-color-text-primary)]">
            <Sparkles className="h-5 w-5 text-[var(--sdk-color-brand-primary)]" />
            <span className="font-medium">{t('user.overview.general')}</span>
          </div>
          <div className="mt-3 text-sm text-[var(--sdk-color-text-secondary)]">
            {summaryLabel(preferences.general.compactModelSelector)}
          </div>
        </Surface>
        <Surface>
          <div className="flex items-center gap-3 text-[var(--sdk-color-text-primary)]">
            <Bell className="h-5 w-5 text-[var(--sdk-color-brand-primary)]" />
            <span className="font-medium">{t('user.overview.notifications')}</span>
          </div>
          <div className="mt-3 text-sm text-[var(--sdk-color-text-secondary)]">
            {summaryLabel(preferences.notifications.newMessages)}
          </div>
        </Surface>
        <Surface>
          <div className="flex items-center gap-3 text-[var(--sdk-color-text-primary)]">
            <ShieldCheck className="h-5 w-5 text-[var(--sdk-color-brand-primary)]" />
            <span className="font-medium">{t('user.overview.security')}</span>
          </div>
          <div className="mt-3 text-sm text-[var(--sdk-color-text-secondary)]">
            {summaryLabel(preferences.security.loginAlerts)}
          </div>
        </Surface>
      </div>
    </div>
  );
}

export function SdkworkUserProfileSection({
  isSaving,
  onSubmit,
  profile,
}: {
  isSaving: boolean;
  onSubmit(profile: SdkworkUserProfile): Promise<void>;
  profile: SdkworkUserProfile;
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(profile);

  useEffect(() => {
    setDraft(profile);
  }, [profile]);

  return (
    <Surface>
      <SettingsSection
        description={t('user.profile.description')}
        title={t('user.profile.title')}
      >
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit(draft);
          }}
        >
          <div className="space-y-2">
            <Label>{t('user.profile.firstName')}</Label>
            <Input
              value={draft.firstName}
              onChange={(event) => setDraft({ ...draft, firstName: event.target.value })}
              placeholder={t('user.placeholders.firstName')}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('user.profile.lastName')}</Label>
            <Input
              value={draft.lastName}
              onChange={(event) => setDraft({ ...draft, lastName: event.target.value })}
              placeholder={t('user.placeholders.lastName')}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>{t('user.profile.email')}</Label>
            <Input
              type="email"
              value={draft.email}
              onChange={(event) => setDraft({ ...draft, email: event.target.value })}
              placeholder={t('user.placeholders.email')}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>{t('user.profile.avatarUrl')}</Label>
            <Input
              value={draft.avatarUrl || ''}
              onChange={(event) => setDraft({ ...draft, avatarUrl: event.target.value || undefined })}
              placeholder={t('user.placeholders.avatarUrl')}
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button loading={isSaving} type="submit">
              {t('user.actions.saveProfile')}
            </Button>
          </div>
        </form>
      </SettingsSection>
    </Surface>
  );
}

export function SdkworkUserNotificationsSection({
  isSaving,
  onSubmit,
  preferences,
}: {
  isSaving: boolean;
  onSubmit(preferences: Partial<SdkworkUserPreferences>): Promise<void>;
  preferences: SdkworkUserPreferences;
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(preferences.notifications);

  useEffect(() => {
    setDraft(preferences.notifications);
  }, [preferences]);

  const notificationKeys = [
    'systemUpdates',
    'taskFailures',
    'taskCompletions',
    'newMessages',
    'securityAlerts',
  ] as const;

  return (
    <Surface>
      <SettingsSection
        description={t('user.notifications.description')}
        title={t('user.notifications.title')}
      >
        <div className="space-y-4">
          {notificationKeys.map((key) => (
            <div className="flex items-center justify-between rounded-[1rem] border border-[var(--sdk-color-border-subtle)] px-4 py-3" key={key}>
              <div className="text-sm font-medium text-[var(--sdk-color-text-primary)]">
                {t(`user.notifications.items.${key}`)}
              </div>
              <Switch checked={draft[key]} onCheckedChange={(checked) => setDraft({ ...draft, [key]: checked })} />
            </div>
          ))}
          <div className="flex justify-end">
            <Button loading={isSaving} onClick={() => void onSubmit({ notifications: draft })} type="button">
              {t('user.actions.saveNotifications')}
            </Button>
          </div>
        </div>
      </SettingsSection>
    </Surface>
  );
}

export function SdkworkUserSecuritySection({
  isSaving,
  onChangePassword,
  onSubmit,
  preferences,
}: {
  isSaving: boolean;
  onChangePassword(currentPassword: string, nextPassword: string): Promise<void>;
  onSubmit(preferences: Partial<SdkworkUserPreferences>): Promise<void>;
  preferences: SdkworkUserPreferences;
}) {
  const { t } = useTranslation();
  const [draftSecurity, setDraftSecurity] = useState(preferences.security);
  const [currentPassword, setCurrentPassword] = useState('');
  const [nextPassword, setNextPassword] = useState('');

  useEffect(() => {
    setDraftSecurity(preferences.security);
  }, [preferences]);

  return (
    <div className="space-y-6">
      <Surface>
        <SettingsSection
          description={t('user.security.description')}
          title={t('user.security.protectionTitle')}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-[1rem] border border-[var(--sdk-color-border-subtle)] px-4 py-3">
              <div className="text-sm font-medium text-[var(--sdk-color-text-primary)]">{t('user.security.loginAlerts')}</div>
              <Switch checked={draftSecurity.loginAlerts} onCheckedChange={(checked) => setDraftSecurity({ ...draftSecurity, loginAlerts: checked })} />
            </div>
            <div className="flex justify-end">
              <Button loading={isSaving} onClick={() => void onSubmit({ security: draftSecurity })} type="button">
                {t('user.actions.saveSecurity')}
              </Button>
            </div>
          </div>
        </SettingsSection>
      </Surface>

      <Surface>
        <SettingsSection
          description={t('user.security.passwordDescription')}
          title={t('user.security.passwordTitle')}
        >
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              void onChangePassword(currentPassword, nextPassword);
            }}
          >
            <div className="space-y-2">
              <Label>{t('user.security.currentPassword')}</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder={t('user.placeholders.currentPassword')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('user.security.newPassword')}</Label>
              <Input
                type="password"
                value={nextPassword}
                onChange={(event) => setNextPassword(event.target.value)}
                placeholder={t('user.placeholders.newPassword')}
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button loading={isSaving} type="submit">
                <Lock className="h-4 w-4" />
                {t('user.actions.updatePassword')}
              </Button>
            </div>
          </form>
        </SettingsSection>
      </Surface>

      <StatusNotice title={t('user.security.title')}>
        {t('user.security.reusableBoundary')}
      </StatusNotice>
    </div>
  );
}
