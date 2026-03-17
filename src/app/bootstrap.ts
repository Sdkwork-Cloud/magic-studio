import { initializeAssetServices, assetCenterService } from '@sdkwork/react-assets';
import {
  getPlatformRuntime,
  getPlatformRuntimeApi,
  initSdkworkFromEnv,
  platform,
  uploadHelper,
} from '@sdkwork/react-core';
import { defaultI18nConfig as audioI18nConfig } from '@sdkwork/react-audio';
import { defaultI18nConfig as assetsI18nConfig } from '@sdkwork/react-assets';
import { defaultI18nConfig as authI18nConfig } from '@sdkwork/react-auth';
import { defaultI18nConfig as characterI18nConfig } from '@sdkwork/react-character';
import { defaultI18nConfig as chatI18nConfig } from '@sdkwork/react-chat';
import { defaultI18nConfig as filmI18nConfig } from '@sdkwork/react-film';
import { defaultI18nConfig as imageI18nConfig } from '@sdkwork/react-image';
import {
  getRequestedLocaleFromSearch,
  i18nService,
  registerPackageI18n,
} from '@sdkwork/react-i18n';
import { defaultI18nConfig as musicI18nConfig } from '@sdkwork/react-music';
import { defaultI18nConfig as promptI18nConfig } from '@sdkwork/react-prompt';
import { defaultI18nConfig as sfxI18nConfig } from '@sdkwork/react-sfx';
import { defaultI18nConfig as videoI18nConfig } from '@sdkwork/react-video';
import { defaultI18nConfig as voiceI18nConfig } from '@sdkwork/react-voicespeaker';

type DeferredWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
};

/**
 * Inject shared platform and upload globals for packages that depend on them.
 */
const injectGlobalAPI = () => {
  if (typeof window === 'undefined') {
    return;
  }

  const runtime = getPlatformRuntime();
  const runtimeApi = getPlatformRuntimeApi();

  (window as any).__sdkworkPlatform = runtimeApi;
  (window as any).__sdkworkPlatformRuntime = runtime;
  (window as any).__sdkworkUploadHelper = uploadHelper;

  console.log('[Magic Studio] Global APIs injected: platform, uploadHelper');
};

/**
 * Initialize the shared SDK client from environment variables when available.
 */
const initializeSdk = () => {
  console.log('[Magic Studio] Initializing SDK...');

  try {
    initSdkworkFromEnv();
    console.log('[Magic Studio] SDK initialized successfully');
  } catch (error) {
    console.warn('[Magic Studio] Failed to initialize SDK:', error);
    console.log('[Magic Studio] SDK will be initialized on first API call');
  }
};

/**
 * Register package translations and resolve the initial locale for the runtime.
 */
const initializeI18n = () => {
  console.log('[Magic Studio] Initializing i18n...');

  const configs = [
    authI18nConfig,
    videoI18nConfig,
    imageI18nConfig,
    musicI18nConfig,
    audioI18nConfig,
    sfxI18nConfig,
    voiceI18nConfig,
    characterI18nConfig,
    assetsI18nConfig,
    chatI18nConfig,
    filmI18nConfig,
    promptI18nConfig,
  ];

  configs.forEach((config) => {
    try {
      registerPackageI18n(config);
      console.log(`[Magic Studio] Registered i18n namespace: ${config.namespace}`);
    } catch (error) {
      console.warn(`[Magic Studio] Failed to register i18n namespace: ${config.namespace}`, error);
    }
  });

  i18nService.initialize({
    requestedLocale: typeof window !== 'undefined'
      ? getRequestedLocaleFromSearch(window.location.search)
      : null,
  });

  console.log(`[Magic Studio] i18n initialized with locale: ${i18nService.locale}`);
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
  initializeAssetServices();

  try {
    await assetCenterService.initialize();
  } catch (error) {
    console.warn('[Magic Studio] Asset center initialization failed:', error);
  }
};

const logEnvironmentInfo = async (platformName: string) => {
  console.log(`[Magic Studio] Initialized on ${platformName} platform.`);

  try {
    const runtime = getPlatformRuntime();
    const theme = await runtime.system.theme();
    console.log(`[Magic Studio] System Theme: ${theme}`);

    const home = await runtime.system.path('home');
    console.log(`[Magic Studio] Home Directory: ${home}`);
  } catch (error) {
    console.warn('[Magic Studio] Failed to retrieve environment info:', error);
  }
};

const checkForDesktopUpdates = async () => {
  try {
    console.log('[Magic Studio] Checking for updates...');
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
  injectGlobalAPI();

  console.log('[Magic Studio] Bootstrapping...');

  initializeSdk();
  initializeI18n();

  const platformName = platform.getPlatform();
  console.log(`[Magic Studio] Platform detected: ${platformName}`);

  scheduleDeferredTask('asset-center-init', initializeAssetCenter, 200);
  scheduleDeferredTask('environment-info', () => logEnvironmentInfo(platformName), 600);

  if (platformName === 'desktop') {
    scheduleDeferredTask('desktop-update-check', checkForDesktopUpdates, 1400);
  }

  return Promise.resolve();
};
