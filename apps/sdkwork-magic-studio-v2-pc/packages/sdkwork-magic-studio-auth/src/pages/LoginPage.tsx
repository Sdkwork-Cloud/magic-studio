import React, { startTransition, useEffect, useMemo, useState } from 'react';
import * as QRCode from 'qrcode';
import { KeyRound, Mail, ShieldCheck, Smartphone, Sparkles } from 'lucide-react';
import {
  getPlatformRuntime,
  isDesktopShellRuntimeKind,
} from '@sdkwork/magic-studio-core/platform';
import { ROUTES } from '@sdkwork/magic-studio-core/router';
import { WindowControls, getDesktopShellDragRegionProps } from '@sdkwork/magic-studio-commons';
import { useTranslation } from '@sdkwork/magic-studio-i18n';
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { SdkworkToaster, StatusNotice, sdkToast } from '@sdkwork/ui-pc-react/components/ui/feedback';
import type { SdkworkAuthLoginQrCode } from '@sdkwork/auth-pc-react';
import { shouldInvokeLoginSuccess } from '../authCompatibility';
import { useMagicAuthControllerState } from '../services/sdkworkAuthBridge.ts';
import { useAuthController } from '../store';
import { SdkworkIamThemeProvider } from '../theme/SdkworkIamThemeProvider';
import { resolveAuthDeviceTypeForRuntimeKind } from '../runtime/authDeviceType.ts';
import { AccountPasswordLoginForm } from '../components/auth/AccountPasswordLoginForm';
import { AuthMethodTabs } from '../components/auth/AuthMethodTabs';
import { EmailCodeLoginForm } from '../components/auth/EmailCodeLoginForm';
import { ForgotPasswordFlow } from '../components/auth/ForgotPasswordFlow';
import { OAuthProviderGrid } from '../components/auth/OAuthProviderGrid';
import { PhoneCodeLoginForm } from '../components/auth/PhoneCodeLoginForm';
import { QrLoginPanel } from '../components/auth/QrLoginPanel';
import { RegisterFlow } from '../components/auth/RegisterFlow';
import {
  DEFAULT_AUTH_LOGIN_METHODS,
  humanizeAuthProvider,
  isAuthOAuthLoginEnabled,
  isAuthQrLoginEnabled,
  readErrorMessage,
  resolveAuthLoginMethods,
  resolveNextAuthLoginMethod,
  resolveAuthMode,
  resolveAuthOAuthProviders,
  resolveAuthProviderTranslationKey,
  resolveAuthRecoveryMethods,
  resolveAuthRegisterMethods,
  type AuthLoginMethod,
  type QrPanelState,
} from '../components/auth/authConfig';
import { buildAuthPath, buildLoginPath, buildOAuthCallbackUri, resolveRedirectTarget } from './authRouteUtils';

const QR_POLL_INTERVAL_MS = 2_000;

interface LoginPageProps {
  homePath?: string;
  onLoginSuccess?: () => void;
}

interface AuthSideHighlight {
  description: string;
  icon: React.ReactElement;
  key: string;
  title: string;
}

function filterHighlights(items: Array<AuthSideHighlight | null>): AuthSideHighlight[] {
  return items.filter((item): item is AuthSideHighlight => item !== null);
}

function resolveHintedEmail(searchParams: URLSearchParams) {
  const email = (searchParams.get('email') || '').trim();
  if (email.includes('@')) {
    return email;
  }

  const account = (searchParams.get('account') || '').trim();
  return account.includes('@') ? account : '';
}

function resolveHintedPhone(searchParams: URLSearchParams) {
  const phone = (searchParams.get('phone') || '').trim();
  if (phone) {
    return phone;
  }

  const account = (searchParams.get('account') || '').trim();
  return /^[+\d][\d\s()-]*$/.test(account) ? account : '';
}

const LoginPage: React.FC<LoginPageProps> = ({
  homePath = ROUTES.HOME,
  onLoginSuccess,
}) => {
  const { t } = useTranslation();
  const controller = useAuthController();
  const authState = useMagicAuthControllerState(controller);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const mode = resolveAuthMode(location.pathname);
  const redirectTarget = resolveRedirectTarget(searchParams.get('redirect'), homePath);
  const requestedMethod = (searchParams.get('method') || '').trim();
  const hintedAccount = (searchParams.get('account') || searchParams.get('email') || '').trim();
  const hintedEmail = resolveHintedEmail(searchParams);
  const hintedPhone = resolveHintedPhone(searchParams);
  const runtimeKind = getPlatformRuntime().system.kind();
  const isDesktop = isDesktopShellRuntimeKind(runtimeKind);
  const deviceType = resolveAuthDeviceTypeForRuntimeKind(runtimeKind);
  const resolvedLoginMethods = resolveAuthLoginMethods();
  const loginMethodsKey = resolvedLoginMethods.join(',');
  const loginMethods = useMemo(
    () => (loginMethodsKey ? loginMethodsKey.split(',') as AuthLoginMethod[] : DEFAULT_AUTH_LOGIN_METHODS),
    [loginMethodsKey],
  );
  const registerMethods = resolveAuthRegisterMethods();
  const recoveryMethods = resolveAuthRecoveryMethods();
  const qrLoginEnabled = isAuthQrLoginEnabled();
  const oauthLoginEnabled = isAuthOAuthLoginEnabled();
  const oauthProviders = oauthLoginEnabled ? resolveAuthOAuthProviders() : [];
  const oauthProviderSummary = oauthProviders
    .map((provider) => {
      const label = t(resolveAuthProviderTranslationKey(provider));
      return label.startsWith('auth.providers.')
        ? humanizeAuthProvider(provider)
        : label;
    })
    .join(' / ');
  const sideHighlights: AuthSideHighlight[] = mode === 'register'
    ? filterHighlights([
        registerMethods.includes('email')
          ? {
              key: 'register-email',
              icon: <Mail className="h-5 w-5 text-primary-200" />,
              title: t('auth.registerMethods.email'),
              description: t('auth.registerHighlights.email'),
            }
          : null,
        registerMethods.includes('phone')
          ? {
              key: 'register-phone',
              icon: <Smartphone className="h-5 w-5 text-primary-200" />,
              title: t('auth.registerMethods.phone'),
              description: t('auth.registerHighlights.phone'),
            }
          : null,
        {
          key: 'register-password',
          icon: <ShieldCheck className="h-5 w-5 text-primary-200" />,
          title: t('auth.password'),
          description: t('auth.registerHighlights.password'),
        },
      ])
    : mode === 'forgot'
      ? filterHighlights([
          recoveryMethods.includes('email')
            ? {
                key: 'reset-email',
                icon: <Mail className="h-5 w-5 text-primary-200" />,
                title: t('auth.email'),
                description: t('auth.resetHighlights.email'),
              }
            : null,
          recoveryMethods.includes('phone')
            ? {
                key: 'reset-phone',
                icon: <Smartphone className="h-5 w-5 text-primary-200" />,
                title: t('auth.phone'),
                description: t('auth.resetHighlights.phone'),
              }
            : null,
          {
            key: 'reset-password',
            icon: <KeyRound className="h-5 w-5 text-primary-200" />,
            title: t('auth.resetPassword'),
            description: t('auth.resetHighlights.password'),
          },
        ])
      : filterHighlights([
          loginMethods.includes('password')
            ? {
                key: 'login-password',
                icon: <ShieldCheck className="h-5 w-5 text-primary-200" />,
                title: t('auth.loginMethods.password'),
                description: t('auth.actions.usePassword'),
              }
            : null,
          loginMethods.includes('emailCode')
            ? {
                key: 'login-email',
                icon: <Sparkles className="h-5 w-5 text-primary-200" />,
                title: t('auth.loginMethods.emailCode'),
                description: t('auth.actions.useEmailCode'),
              }
            : null,
          loginMethods.includes('phoneCode')
            ? {
                key: 'login-phone',
                icon: <KeyRound className="h-5 w-5 text-primary-200" />,
                title: t('auth.loginMethods.phoneCode'),
                description: t('auth.actions.usePhoneCode'),
              }
            : null,
          oauthProviders.length
            ? {
                key: 'login-oauth',
                icon: <Sparkles className="h-5 w-5 text-primary-200" />,
                title: t('auth.oauth.badge'),
                description: oauthProviderSummary,
              }
            : null,
        ]);

  const [loginMethod, setLoginMethod] = useState<AuthLoginMethod>('password');
  const showForgotPasswordAction = loginMethods.includes('password') && loginMethod === 'password';
  const [activeOAuthProvider, setActiveOAuthProvider] = useState<string | null>(null);
  const [qrState, setQrState] = useState<QrPanelState>('idle');
  const [qrCode, setQrCode] = useState<SdkworkAuthLoginQrCode | null>(null);
  const [qrImageSrc, setQrImageSrc] = useState('');
  const [qrErrorMessage, setQrErrorMessage] = useState('');
  const [qrReloadNonce, setQrReloadNonce] = useState(0);
  const [qrPanelReady, setQrPanelReady] = useState(false);

  useEffect(() => {
    if (mode !== 'login') {
      return;
    }

    const nextLoginMethod = resolveNextAuthLoginMethod({
      currentMethod: loginMethod,
      loginMethods,
      requestedMethod,
    });

    if (nextLoginMethod !== loginMethod) {
      setLoginMethod(nextLoginMethod);
    }
  }, [loginMethod, loginMethods, loginMethodsKey, mode, requestedMethod]);

  useEffect(() => {
    if (mode !== 'login' || !qrLoginEnabled) {
      setQrPanelReady(false);
      return;
    }

    let disposed = false;
    let timerId: number | null = null;
    let frameId: number | null = null;

    const markReady = () => {
      timerId = window.setTimeout(() => {
        if (!disposed) {
          setQrPanelReady(true);
        }
      }, 0);
    };

    if (typeof window.requestAnimationFrame === 'function') {
      frameId = window.requestAnimationFrame(markReady);
    } else {
      markReady();
    }

    return () => {
      disposed = true;
      if (frameId !== null && typeof window.cancelAnimationFrame === 'function') {
        window.cancelAnimationFrame(frameId);
      }
      if (timerId !== null) {
        window.clearTimeout(timerId);
      }
    };
  }, [mode, qrLoginEnabled]);

  useEffect(() => {
    if (mode !== 'login' || !qrLoginEnabled) {
      setQrPanelReady(false);
      setQrState('idle');
      setQrCode(null);
      setQrImageSrc('');
      setQrErrorMessage('');
      return;
    }

    if (!qrPanelReady) {
      setQrState('idle');
      setQrCode(null);
      setQrImageSrc('');
      setQrErrorMessage('');
      return;
    }

    let disposed = false;
    let pollTimer: number | null = null;

    const clearPollTimer = () => {
      if (pollTimer !== null) {
        window.clearTimeout(pollTimer);
        pollTimer = null;
      }
    };

    const schedulePoll = (qrKey: string, delayMs = QR_POLL_INTERVAL_MS) => {
      clearPollTimer();
      pollTimer = window.setTimeout(() => {
        void pollStatus(qrKey);
      }, delayMs);
    };

    const pollStatus = async (qrKey: string) => {
      try {
        const statusResult = await controller.checkLoginQrCodeStatus(qrKey);
        if (disposed) {
          return;
        }

        if (statusResult.status === 'confirmed' && statusResult.session) {
          setQrState('confirmed');

          if (onLoginSuccess && shouldInvokeLoginSuccess(redirectTarget)) {
            onLoginSuccess();
            return;
          }

          startTransition(() => {
            navigate(redirectTarget, { replace: true });
          });
          return;
        }

        setQrState(statusResult.status);

        if (statusResult.status === 'expired') {
          clearPollTimer();
          return;
        }

        schedulePoll(qrKey);
      } catch (error) {
        if (disposed) {
          return;
        }

        setQrState('error');
        setQrErrorMessage(readErrorMessage(error, t('auth.errors.qrStatusFailed')));
        clearPollTimer();
      }
    };

    const loadQrCode = async () => {
      setQrState('loading');
      setQrCode(null);
      setQrImageSrc('');
      setQrErrorMessage('');

      try {
        const nextQrCode = await controller.generateLoginQrCode();
        if (disposed) {
          return;
        }

        let nextImageSrc = '';
        if (nextQrCode.qrUrl) {
          nextImageSrc = nextQrCode.qrUrl;
        } else if (nextQrCode.qrContent) {
          nextImageSrc = await QRCode.toDataURL(nextQrCode.qrContent, {
            errorCorrectionLevel: 'M',
            margin: 1,
            width: 320,
            color: {
              dark: '#111827',
              light: '#ffffff',
            },
          });
        } else {
          throw new Error(t('auth.errors.invalidQrPayload'));
        }

        if (disposed) {
          return;
        }

        setQrCode(nextQrCode);
        setQrImageSrc(nextImageSrc);
        setQrState('pending');
        schedulePoll(nextQrCode.qrKey);
      } catch (error) {
        if (disposed) {
          return;
        }

        setQrState('error');
        setQrErrorMessage(readErrorMessage(error, t('auth.errors.qrGenerateFailed')));
      }
    };

    void loadQrCode();

    return () => {
      disposed = true;
      clearPollTimer();
    };
  }, [controller, mode, navigate, onLoginSuccess, qrLoginEnabled, qrPanelReady, qrReloadNonce, redirectTarget, t]);

  const navigateAfterAuth = (targetPath: string) => {
    if (onLoginSuccess && shouldInvokeLoginSuccess(targetPath)) {
      onLoginSuccess();
      return;
    }

    startTransition(() => {
      navigate(targetPath, { replace: true });
    });
  };

  if (authState.isAuthenticated) {
    return <Navigate to={redirectTarget} replace />;
  }

  return (
    <div data-magic-iam-screen="auth">
      <SdkworkIamThemeProvider>
        <SdkworkToaster />
        <div
          className={`magic-auth-shell relative flex min-h-[100dvh] items-center justify-center bg-zinc-100 dark:bg-zinc-950 ${
            isDesktop
              ? 'px-4 pb-4 pt-12 sm:px-8 sm:pb-8 sm:pt-12'
              : 'p-4 sm:p-8'
          }`}
        >
          {isDesktop ? (
            <div
              className="absolute inset-x-0 top-0 z-20 flex h-10 items-stretch justify-between select-none"
              data-magic-auth-desktop-frame
            >
              <div className="flex-1" {...getDesktopShellDragRegionProps()} />
              <div className="pointer-events-auto h-full">
                <WindowControls />
              </div>
            </div>
          ) : null}

          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-[8%] top-[10%] h-56 w-56 rounded-full bg-primary-500/10 blur-3xl dark:bg-primary-500/14" />
            <div className="absolute bottom-[8%] right-[10%] h-64 w-64 rounded-full bg-white/40 blur-3xl dark:bg-zinc-900/80" />
          </div>

          <div
            className="relative z-10 flex w-full max-w-6xl flex-col overflow-hidden rounded-[32px] bg-white/92 dark:bg-zinc-950/88 md:min-h-[720px] md:flex-row"
            data-sdk-auth-card
          >
            <div className="w-full p-4 md:w-[42%] md:p-6">
              {mode === 'login' && qrLoginEnabled ? (
                <QrLoginPanel
                  qrCode={qrPanelReady ? qrCode : null}
                  qrImageSrc={qrPanelReady ? qrImageSrc : ''}
                  qrState={qrPanelReady ? qrState : 'loading'}
                  qrErrorMessage={qrPanelReady ? qrErrorMessage : ''}
                  onRefresh={() => setQrReloadNonce((value) => value + 1)}
                />
              ) : (
                <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-[28px] bg-zinc-950 p-8 text-white">
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,_rgba(255,255,255,0.05),_transparent_30%)]" />
                  <div className="relative z-10">
                    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.08]">
                      {mode === 'register' ? (
                        <Sparkles className="h-8 w-8 text-primary-200" />
                      ) : (
                        <ShieldCheck className="h-8 w-8 text-primary-200" />
                      )}
                    </div>
                    <h2 className="text-2xl font-black tracking-tight">
                      {mode === 'register'
                        ? t('auth.createAccount')
                        : mode === 'forgot'
                          ? t('auth.resetPassword')
                          : t('auth.welcomeBack')}
                    </h2>
                    <p className="mt-3 max-w-[320px] text-sm leading-7 text-zinc-300">
                      {mode === 'register'
                        ? t('auth.registerDesc')
                        : mode === 'forgot'
                          ? t('auth.resetDesc')
                          : t('auth.loginDesc')}
                    </p>
                  </div>

                  <div className="relative z-10 grid gap-4">
                    {sideHighlights.map((item) => (
                      <div
                        key={item.key}
                        className="rounded-3xl bg-white/[0.06] p-5"
                      >
                        <div className="flex items-center gap-3">
                          {item.icon}
                          <div className="text-sm font-semibold">{item.title}</div>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-zinc-300">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="w-full p-8 md:w-[58%] md:px-10 md:py-12">
              <div className="mx-auto flex h-full max-w-xl flex-col justify-center">
                <div className="mb-8">
                  {mode !== 'login' ? (
                    <div className="inline-flex rounded-full bg-primary-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary-700 dark:bg-primary-500/14 dark:text-primary-200">
                      {mode === 'register'
                        ? t('auth.createAccount')
                        : t('auth.resetPassword')}
                    </div>
                  ) : null}
                  <h1 className={`${mode === 'login' ? '' : 'mt-4 '}text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-4xl`}>
                    {mode === 'login'
                      ? t('auth.welcomeBack')
                      : mode === 'register'
                        ? t('auth.createAccount')
                        : t('auth.resetPassword')}
                  </h1>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-zinc-500 dark:text-zinc-400">
                    {mode === 'login'
                      ? t('auth.loginDesc')
                      : mode === 'register'
                        ? t('auth.registerDesc')
                        : t('auth.resetDesc')}
                  </p>
                </div>

                {authState.lastError ? (
                  <StatusNotice className="mb-6" tone="danger" title={t('auth.errors.requestFailedTitle')}>
                    {authState.lastError}
                  </StatusNotice>
                ) : null}

                {mode === 'login' ? (
                  <div className="space-y-6">
                    {loginMethods.length > 1 ? (
                      <AuthMethodTabs
                        value={loginMethod}
                        onChange={(value) => setLoginMethod(value as AuthLoginMethod)}
                        items={loginMethods.map((item) => ({
                          value: item,
                          label: t(`auth.loginMethods.${item}`),
                          icon:
                            item === 'password'
                              ? <ShieldCheck className="h-4 w-4" />
                              : item === 'phoneCode'
                                ? <KeyRound className="h-4 w-4" />
                                : <Sparkles className="h-4 w-4" />,
                        }))}
                      />
                    ) : null}

                    {loginMethods.includes('password') && loginMethod === 'password' ? (
                      <AccountPasswordLoginForm
                        initialAccount={hintedAccount}
                        onSubmit={async (payload) => {
                          await controller.signIn({
                            password: payload.password,
                            username: payload.account,
                          });
                          navigateAfterAuth(redirectTarget);
                        }}
                      />
                    ) : null}

                    {loginMethods.includes('phoneCode') && loginMethod === 'phoneCode' ? (
                      <PhoneCodeLoginForm
                        initialPhone={hintedPhone}
                        onSubmit={async (payload) => {
                          await controller.signInWithPhoneCode({
                            ...payload,
                            deviceType,
                          });
                          navigateAfterAuth(redirectTarget);
                        }}
                      />
                    ) : null}

                    {loginMethods.includes('emailCode') && loginMethod === 'emailCode' ? (
                      <EmailCodeLoginForm
                        initialEmail={hintedEmail}
                        onSubmit={async (payload) => {
                          await controller.signInWithEmailCode({
                            ...payload,
                            deviceType,
                          });
                          navigateAfterAuth(redirectTarget);
                        }}
                      />
                    ) : null}

                    <div
                      className={`flex flex-wrap items-center gap-x-4 gap-y-2 text-sm ${
                        showForgotPasswordAction ? 'justify-between' : 'justify-end'
                      }`}
                    >
                      {showForgotPasswordAction ? (
                        <button
                          type="button"
                          onClick={() => navigate(buildAuthPath(ROUTES.AUTH_FORGOT_PASSWORD, redirectTarget, homePath))}
                          className="font-medium text-zinc-500 transition-colors hover:text-primary-600 dark:text-zinc-400 dark:hover:text-primary-300"
                        >
                          {t('auth.forgotPassword')}
                        </button>
                      ) : null}

                      <div className="text-zinc-500 dark:text-zinc-400">
                        {t('auth.noAccount')}{' '}
                        <button
                          type="button"
                          onClick={() => navigate(buildAuthPath(ROUTES.AUTH_REGISTER, redirectTarget, homePath))}
                          className="font-semibold text-primary-600 transition-colors hover:text-primary-500"
                        >
                          {t('auth.signUp')}
                        </button>
                      </div>
                    </div>

                    {oauthLoginEnabled ? (
                      <OAuthProviderGrid
                        providers={oauthProviders}
                        activeProvider={activeOAuthProvider}
                        onSelect={(provider) => {
                          if (activeOAuthProvider) {
                            return;
                          }

                          setActiveOAuthProvider(provider);

                          void controller.getOAuthAuthorizationUrl({
                            provider,
                            redirectUri: buildOAuthCallbackUri(provider, redirectTarget, homePath),
                            state: redirectTarget !== homePath ? redirectTarget : undefined,
                          }).then((authUrl) => {
                            window.location.assign(authUrl);
                          }).catch((error) => {
                            setActiveOAuthProvider(null);
                            sdkToast.error(readErrorMessage(error, t('auth.errors.oauthStartFailed')));
                          });
                        }}
                      />
                    ) : null}
                  </div>
                ) : null}

                {mode === 'register' ? (
                  <RegisterFlow
                    methods={registerMethods}
                    onSubmit={async (payload) => {
                      await controller.register({
                        channel: payload.phone ? 'PHONE' : 'EMAIL',
                        confirmPassword: payload.confirmPassword,
                        email: payload.email,
                        password: payload.password,
                        phone: payload.phone,
                        username: payload.username,
                        verificationCode: payload.verificationCode,
                      });
                      navigateAfterAuth(redirectTarget);
                    }}
                  />
                ) : null}

                {mode === 'forgot' ? (
                  <ForgotPasswordFlow
                    initialAccount={hintedAccount || hintedEmail || hintedPhone}
                    methods={recoveryMethods}
                    onRequestReset={async (payload) => {
                      await controller.requestPasswordReset(payload);
                    }}
                    onSubmit={async (payload) => {
                      await controller.resetPassword(payload);
                      startTransition(() => {
                        navigate(buildLoginPath(redirectTarget, homePath), { replace: true });
                      });
                    }}
                  />
                ) : null}

                {mode === 'register' || mode === 'forgot' ? (
                  <div className="mt-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
                    {mode === 'register' ? (
                      <>
                        {t('auth.hasAccount')}{' '}
                        <button
                          type="button"
                          onClick={() => navigate(buildLoginPath(redirectTarget, homePath))}
                          className="font-bold text-primary-600 transition-colors hover:text-primary-500"
                        >
                          {t('auth.signIn')}
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => navigate(buildLoginPath(redirectTarget, homePath))}
                        className="font-bold text-primary-600 transition-colors hover:text-primary-500"
                      >
                        {t('auth.backToLogin')}
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </SdkworkIamThemeProvider>
    </div>
  );
};

export default LoginPage;
export { LoginPage };
