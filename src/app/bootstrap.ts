import { platform } from '@sdkwork/react-core';
import { getPlatformRuntime, getPlatformRuntimeApi, uploadHelper } from '@sdkwork/react-core';
import { initializeAssetServices, assetCenterService } from '@sdkwork/react-assets';
import { i18nService, registerPackageI18n } from '@sdkwork/react-i18n';
import { initSdkworkFromEnv } from '@sdkwork/react-core';

// Import all package i18n configs
import { defaultI18nConfig as authI18nConfig } from '@sdkwork/react-auth';
import { defaultI18nConfig as videoI18nConfig } from '@sdkwork/react-video';
import { defaultI18nConfig as imageI18nConfig } from '@sdkwork/react-image';
import { defaultI18nConfig as musicI18nConfig } from '@sdkwork/react-music';
import { defaultI18nConfig as audioI18nConfig } from '@sdkwork/react-audio';
import { defaultI18nConfig as sfxI18nConfig } from '@sdkwork/react-sfx';
import { defaultI18nConfig as voiceI18nConfig } from '@sdkwork/react-voicespeaker';
import { defaultI18nConfig as characterI18nConfig } from '@sdkwork/react-character';
import { defaultI18nConfig as assetsI18nConfig } from '@sdkwork/react-assets';
import { defaultI18nConfig as chatI18nConfig } from '@sdkwork/react-chat';
import { defaultI18nConfig as filmI18nConfig } from '@sdkwork/react-film';
import { defaultI18nConfig as promptI18nConfig } from '@sdkwork/react-prompt';

type DeferredWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
};

/**
 * 注入全局 Platform API �?Upload Helper
 * 这是 sdkwork-react-commons �?sdkwork-react-fs 包运行所必需�?
 */
const injectGlobalAPI = () => {
  if (typeof window !== 'undefined') {
    const runtime = getPlatformRuntime();
    const runtimeApi = getPlatformRuntimeApi();
    // 注入 Platform API
    (window as any).__sdkworkPlatform = runtimeApi;
    (window as any).__sdkworkPlatformRuntime = runtime;
    
    // 注入 Upload Helper
    (window as any).__sdkworkUploadHelper = uploadHelper;
    
    console.log('[Magic Studio] Global APIs injected: platform, uploadHelper');
  }
};

/**
 * 初始�?SDK
 * 从环境变量加载配置并初始�?SDKWork 客户�?
 */
const initializeSdk = () => {
  console.log('[Magic Studio] Initializing SDK...');
  
  try {
    // Initialize SDK from environment variables
    initSdkworkFromEnv();
    console.log('[Magic Studio] SDK initialized successfully');
  } catch (e) {
    console.warn('[Magic Studio] Failed to initialize SDK:', e);
    console.log('[Magic Studio] SDK will be initialized on first API call');
  }
};

/**
 * 初始化国际化
 * 注册所有包的翻译资�?
 */
const initializeI18n = () => {
  console.log('[Magic Studio] Initializing i18n...');
  
  // Register all package i18n configs
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
  
  configs.forEach(config => {
    try {
      registerPackageI18n(config);
      console.log(`[Magic Studio] Registered i18n namespace: ${config.namespace}`);
    } catch (e) {
      console.warn(`[Magic Studio] Failed to register i18n namespace: ${config.namespace}`, e);
    }
  });
  
  // Set initial locale from browser or localStorage
  const savedLocale = localStorage.getItem('sdkwork_locale');
  if (savedLocale) {
    i18nService.setLocale(savedLocale as any);
  }
  
  console.log(`[Magic Studio] i18n initialized with locale: ${i18nService.locale}`);
};

const scheduleDeferredTask = (
  label: string,
  task: () => Promise<void> | void,
  delayMs = 0
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
  } catch (e) {
    console.warn('[Magic Studio] Asset center initialization failed:', e);
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
  } catch (e) {
    console.warn('[Magic Studio] Failed to retrieve environment info:', e);
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
      'info'
    );

    if (shouldUpdate) {
      await runtime.dialog.notify('Updating...', 'Magic Studio is downloading updates and will restart shortly.');
      await runtime.app.installUpdate();
    }
  } catch (e) {
    console.error('[Magic Studio] Update check failed:', e);
  }
};

export const bootstrap = async () => {
  // 首先注入全局 API
  injectGlobalAPI();

  console.log('[Magic Studio] Bootstrapping...');

  // Initialize SDK
  initializeSdk();

  // Initialize i18n
  initializeI18n();

  const platformName = platform.getPlatform();
  console.log(`[Magic Studio] Platform detected: ${platformName}`);

  // Non-critical work is deferred to reduce startup contention on first render.
  scheduleDeferredTask('asset-center-init', initializeAssetCenter, 200);
  scheduleDeferredTask('environment-info', () => logEnvironmentInfo(platformName), 600);

  if (platformName === 'desktop') {
    scheduleDeferredTask('desktop-update-check', checkForDesktopUpdates, 1400);
  }

  return Promise.resolve();
};
