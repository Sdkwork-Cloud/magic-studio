import {
  configurePlatformRuntime,
  createRuntimeMagicStudioServerClient,
  createServerPlatform,
  getPlatformRuntime,
  isBrowserHostedRuntimeKind,
  isDesktopShellRuntimeKind,
  waitForMagicStudioServerReady,
  writeWindowPlatformRuntime,
} from '@sdkwork/magic-studio-core/platform';
import { uploadHelper } from '@sdkwork/magic-studio-core/services';
import { SDKWORK_PC_REACT_DEFAULT_APP_CLIENT_COMPAT_ALIASES } from '@sdkwork/core-pc-react/app';
import { configurePcReactRuntime } from '@sdkwork/core-pc-react/runtime';
import { defaultI18nConfig as authI18nConfig } from '@sdkwork/magic-studio-auth/i18n';
import { defaultI18nConfig as userI18nConfig } from '@sdkwork/magic-studio-user/i18n';
import {
  getPackageI18nConfig,
  getRequestedLocaleFromSearch,
  i18nService,
  type PackageI18nConfig,
  registerPackageI18n,
} from '@sdkwork/magic-studio-i18n';

type DeferredWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
};

let bootstrapPromise: Promise<void> | null = null;

const DEFERRED_I18N_CONFIG_LOADERS: Array<() => Promise<PackageI18nConfig>> = [
  () => import('@sdkwork/magic-studio-video/i18n').then((module) => module.defaultI18nConfig),
  () => import('@sdkwork/magic-studio-image/i18n').then((module) => module.defaultI18nConfig),
  () => import('@sdkwork/magic-studio-music/i18n').then((module) => module.defaultI18nConfig),
  () => import('@sdkwork/magic-studio-audio/i18n').then((module) => module.defaultI18nConfig),
  () => import('@sdkwork/magic-studio-sfx/i18n').then((module) => module.defaultI18nConfig),
  () => import('@sdkwork/magic-studio-voicespeaker/i18n').then((module) => module.defaultI18nConfig),
  () => import('@sdkwork/magic-studio-character/i18n').then((module) => module.defaultI18nConfig),
  () => import('@sdkwork/magic-studio-assets/i18n').then((module) => module.defaultI18nConfig),
  () => import('@sdkwork/magic-studio-chat/i18n').then((module) => module.defaultI18nConfig),
  () => import('@sdkwork/magic-studio-film/i18n').then((module) => module.defaultI18nConfig),
  () => import('@sdkwork/magic-studio-prompt/i18n').then((module) => module.defaultI18nConfig),
];

/**
 * Inject shared runtime and upload globals for packages that depend on them.
 */
const injectGlobalAPI = () => {
  if (typeof window === 'undefined') {
    return;
  }

  const runtime = getPlatformRuntime();

  writeWindowPlatformRuntime(runtime);
  (window as any).__sdkworkUploadHelper = uploadHelper;
};

const promoteServerHostedRuntime = async () => {
  const runtime = getPlatformRuntime();
  if (!isBrowserHostedRuntimeKind(runtime.system.kind())) {
    return;
  }

  try {
    const summary = (await createRuntimeMagicStudioServerClient(runtime).readRuntimeSummary()).data;
    if (summary.mode !== 'server') {
      return;
    }

    configurePlatformRuntime(createServerPlatform());
  } catch {
    // Same-origin canonical rust server is optional for pure web delivery.
  }
};

/**
 * Configure the shared pc-react runtime once at the application boundary.
 */
const initializeSdk = () => {
  try {
    configurePcReactRuntime({
      appClientCompatAliases: SDKWORK_PC_REACT_DEFAULT_APP_CLIENT_COMPAT_ALIASES,
    });
  } catch (error) {
    console.warn('[Magic Studio] Failed to initialize SDK:', error);
  }
};

const registerPackageI18nSafely = (config: PackageI18nConfig) => {
  try {
    if (getPackageI18nConfig(config.namespace)) {
      return;
    }
    registerPackageI18n(config);
  } catch (error) {
    console.warn(`[Magic Studio] Failed to register i18n namespace: ${config.namespace}`, error);
  }
};

const registerDeferredPackageI18n = async () => {
  for (const loadConfig of DEFERRED_I18N_CONFIG_LOADERS) {
    try {
      const config = await loadConfig();
      registerPackageI18nSafely(config);
    } catch (error) {
      console.warn('[Magic Studio] Deferred i18n registration failed:', error);
    }
  }
};

/**
 * Register package translations and resolve the initial locale for the runtime.
 */
const initializeI18n = async () => {
  registerPackageI18nSafely(authI18nConfig);
  registerPackageI18nSafely(userI18nConfig);

  await i18nService.initialize({
    requestedLocale: typeof window !== 'undefined'
      ? getRequestedLocaleFromSearch(window.location.search)
      : null,
  });

  scheduleDeferredTask('deferred-i18n-registration', registerDeferredPackageI18n, 120);
};

const scheduleDeferredTask = (
  label: string,
  task: () => Promise<void> | void,
  delayMs = 0,
): void => {
  const runTask = () => {
    try {
      Promise.resolve(task()).catch((error) => {
        console.warn(`[Magic Studio] Deferred task failed: ${label}`, error);
      });
    } catch (error) {
      console.warn(`[Magic Studio] Deferred task failed: ${label}`, error);
    }
  };

  if (typeof window === 'undefined') {
    runTask();
    return;
  }

  const schedule = () => {
    const win = window as DeferredWindow;
    if (typeof win.requestIdleCallback === 'function') {
      win.requestIdleCallback(runTask, { timeout: Math.max(1200, delayMs + 800) });
      return;
    }

    window.setTimeout(runTask, 0);
  };

  if (delayMs > 0) {
    window.setTimeout(schedule, delayMs);
    return;
  }

  schedule();
};

const initializeAssetCenter = async () => {
  const [
    {
      initializeAssetServices,
      setAssetCoverGenerationAdapter,
    },
    { assetCenterService },
    { imageService },
  ] = await Promise.all([
    import('@sdkwork/magic-studio-assets/services'),
    import('@sdkwork/magic-studio-assets/asset-center'),
    import('@sdkwork/magic-studio-image/services'),
  ]);
  setAssetCoverGenerationAdapter({
    generateImage: imageService.generateImage,
  });
  initializeAssetServices();

  try {
    await assetCenterService.initialize();
  } catch (error) {
    console.warn('[Magic Studio] Asset center initialization failed:', error);
  }
};

const logEnvironmentInfo = async () => {
  try {
    const runtime = getPlatformRuntime();
    await Promise.all([
      runtime.system.theme(),
      runtime.system.path('home'),
    ]);
  } catch (error) {
    console.warn('[Magic Studio] Failed to retrieve environment info:', error);
  }
};

const checkForDesktopUpdates = async () => {
  try {
    const runtime = getPlatformRuntime();
    const update = await runtime.app.checkForUpdates();

    if (!update) {
      return;
    }

    const shouldUpdate = await runtime.dialog.confirm(
      `New version ${update.version} is available.\n\n${update.body || 'Bug fixes and performance improvements.'}\n\nUpdate now?`,
      'Update Available',
      'info',
    );

    if (shouldUpdate) {
      await runtime.dialog.notify(
        'Updating...',
        'Magic Studio is downloading updates and will restart shortly.',
      );
      await runtime.app.installUpdate();
    }
  } catch (error) {
    console.error('[Magic Studio] Update check failed:', error);
  }
};

export const bootstrap = async () => {
  if (bootstrapPromise) {
    return bootstrapPromise;
  }

  bootstrapPromise = (async () => {
    await promoteServerHostedRuntime();
    injectGlobalAPI();
    const runtime = getPlatformRuntime();
    const runtimeKind = runtime.system.kind();

    if (isDesktopShellRuntimeKind(runtimeKind)) {
      await waitForMagicStudioServerReady(runtime);
    }

    initializeSdk();
    await initializeI18n();

    scheduleDeferredTask('asset-center-init', initializeAssetCenter, 900);
    scheduleDeferredTask('environment-info', logEnvironmentInfo, 600);

    if (isDesktopShellRuntimeKind(runtimeKind)) {
      scheduleDeferredTask('desktop-update-check', checkForDesktopUpdates, 1400);
    }
  })().catch((error) => {
    bootstrapPromise = null;
    throw error;
  });

  return bootstrapPromise;
};
