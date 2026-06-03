import React, { startTransition, useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowRight, LoaderCircle, ShieldCheck } from 'lucide-react';
import { ROUTES } from '@sdkwork/magic-studio-core/router';
import { useTranslation } from '@sdkwork/magic-studio-i18n';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@sdkwork/ui-pc-react/components/ui/actions';
import { SdkworkToaster, sdkToast } from '@sdkwork/ui-pc-react/components/ui/feedback';
import { useMagicAuthControllerState } from '../services/sdkworkAuthBridge.ts';
import { useAuthController } from '../store';
import { SdkworkIamThemeProvider } from '../theme/SdkworkIamThemeProvider';
import { resolveAuthDeviceType } from '../runtime/authDeviceType.ts';
import {
  isAuthOAuthLoginEnabled,
  isConfiguredAuthOAuthProvider,
  normalizeAuthOAuthProvider,
  readErrorMessage,
  resolveAuthOAuthProviders,
} from '../components/auth/authConfig';
import { buildLoginPath, resolveRedirectTarget } from './authRouteUtils';

interface AuthOAuthCallbackPageProps {
  homePath?: string;
  provider?: string;
}

type CallbackState = 'error' | 'loading';

const AuthOAuthCallbackPage: React.FC<AuthOAuthCallbackPageProps> = ({
  homePath = ROUTES.HOME,
  provider,
}) => {
  const { t } = useTranslation();
  const controller = useAuthController();
  const authState = useMagicAuthControllerState(controller);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTarget = resolveRedirectTarget(searchParams.get('redirect'), homePath);
  const providerError = (searchParams.get('error_description') || searchParams.get('error') || '').trim();
  const callbackCode = (searchParams.get('code') || '').trim();
  const callbackStateValue = (searchParams.get('state') || '').trim() || undefined;
  const normalizedProvider = useMemo(() => normalizeAuthOAuthProvider(provider), [provider]);
  const callbackRequestKey = useMemo(
    () => [normalizedProvider || '', callbackCode, callbackStateValue || '', providerError, redirectTarget].join('|'),
    [callbackCode, callbackStateValue, normalizedProvider, providerError, redirectTarget],
  );
  const deviceType = resolveAuthDeviceType();
  const [runtimeError, setRuntimeError] = useState<{ key: string; message: string } | null>(null);
  const resolvedConfiguredProviders = isAuthOAuthLoginEnabled() ? resolveAuthOAuthProviders() : [];
  const configuredProvidersKey = resolvedConfiguredProviders.join(',');
  const configuredProviders = useMemo(
    () => (configuredProvidersKey ? configuredProvidersKey.split(',') : []),
    [configuredProvidersKey],
  );
  const validationError = useMemo(() => {
    if (!isConfiguredAuthOAuthProvider(normalizedProvider || undefined, configuredProviders)) {
      return t('auth.oauth.invalidProvider');
    }

    if (providerError) {
      return providerError;
    }

    if (!callbackCode) {
      return t('auth.oauth.missingCode');
    }

    return '';
  }, [callbackCode, configuredProviders, normalizedProvider, providerError, t]);
  const runtimeErrorMessage = runtimeError?.key === callbackRequestKey ? runtimeError.message : '';
  const errorMessage = validationError || runtimeErrorMessage;
  const callbackState: CallbackState = errorMessage ? 'error' : 'loading';

  useEffect(() => {
    if (validationError) {
      return;
    }

    let disposed = false;

    void (async () => {
      try {
        await controller.signInWithOAuth({
          provider: normalizedProvider!,
          code: callbackCode,
          state: callbackStateValue,
          deviceType,
        });
        if (disposed) {
          return;
        }
        startTransition(() => {
          navigate(redirectTarget, { replace: true });
        });
      } catch (error) {
        if (disposed) {
          return;
        }
        const message = readErrorMessage(error, t('auth.oauth.failed'));
        sdkToast.error(message);
        setRuntimeError({ key: callbackRequestKey, message });
      }
    })();

    return () => {
      disposed = true;
    };
  }, [
    callbackCode,
    callbackRequestKey,
    callbackStateValue,
    controller,
    navigate,
    redirectTarget,
    t,
    validationError,
    normalizedProvider,
    deviceType,
  ]);

  if (authState.isAuthenticated) {
    return <Navigate to={redirectTarget} replace />;
  }

  return (
    <div data-magic-iam-screen="auth">
      <SdkworkIamThemeProvider>
        <SdkworkToaster />
        <div className="relative flex min-h-full items-center justify-center p-4 sm:p-8">
          <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-zinc-900">
            <div className="border-b border-zinc-200/80 bg-zinc-950 px-8 py-6 text-white dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-600/90">
                  {callbackState === 'loading' ? (
                    <LoaderCircle className="h-6 w-6 animate-spin" />
                  ) : (
                    <AlertCircle className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-200">
                    {t('auth.oauth.badge')}
                  </div>
                  <h1 className="mt-1 text-2xl font-black tracking-tight">
                    {callbackState === 'loading'
                      ? t('auth.oauth.processingTitle')
                      : t('auth.oauth.failedTitle')}
                  </h1>
                </div>
              </div>
            </div>

            <div className="space-y-6 px-8 py-8">
              {callbackState === 'loading' ? (
                <>
                  <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                    {t('auth.oauth.processingDesc')}
                  </p>
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
                    <div className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-200">
                      <ShieldCheck className="h-5 w-5 text-primary-500" />
                      <span>{t('auth.oauth.processingHint')}</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-300">{errorMessage}</p>
                  <Button
                    type="button"
                    onClick={() => navigate(buildLoginPath(redirectTarget, homePath), { replace: true })}
                    className="h-auto w-full py-3 font-bold"
                  >
                    {t('auth.backToLogin')}
                    <ArrowRight className="h-4 w-4 rotate-180" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </SdkworkIamThemeProvider>
    </div>
  );
};

export default AuthOAuthCallbackPage;
export { AuthOAuthCallbackPage };
