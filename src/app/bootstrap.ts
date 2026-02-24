
import { platform } from 'sdkwork-react-core';
import { uploadHelper } from 'sdkwork-react-core';
import { initializeAssetServices } from 'sdkwork-react-assets';

/**
 * 注入全局 Platform API 和 Upload Helper
 * 这是 sdkwork-react-commons 和 sdkwork-react-fs 包运行所必需的
 */
const injectGlobalAPI = () => {
  if (typeof window !== 'undefined') {
    // 注入 Platform API
    (window as any).__sdkworkPlatform = platform;
    
    // 注入 Upload Helper
    (window as any).__sdkworkUploadHelper = uploadHelper;
    
    console.log('[Magic Studio] Global APIs injected: platform, uploadHelper');
  }
};

export const bootstrap = async () => {
  // 首先注入全局 API
  injectGlobalAPI();

  console.log('[Magic Studio] Bootstrapping...');

  // Initialize asset services for the asset center
  initializeAssetServices();

  const platformName = platform.getPlatform();
  console.log(`[Magic Studio] Initialized on ${platformName} platform.`);

  // Log environment info
  try {
      const theme = await platform.getSystemTheme();
      console.log(`[Magic Studio] System Theme: ${theme}`);

      const home = await platform.getPath('home');
      console.log(`[Magic Studio] Home Directory: ${home}`);
  } catch (e) {
      console.warn('[Magic Studio] Failed to retrieve environment info:', e);
  }

  // Automatic Update Check
  if (platformName === 'desktop') {
      try {
          console.log('[Magic Studio] Checking for updates...');
          const update = await platform.checkForUpdates();
          if (update) {
              const shouldUpdate = await platform.confirm(
                  `New version ${update.version} is available.\n\n${update.body || 'Bug fixes and performance improvements.'}\n\nUpdate now?`,
                  'Update Available',
                  'info'
              );

              if (shouldUpdate) {
                  await platform.notify('Updating...', 'Magic Studio is downloading updates and will restart shortly.');
                  await platform.installUpdate();
              }
          }
      } catch (e) {
          console.error('[Magic Studio] Update check failed:', e);
      }
  }

  return Promise.resolve();
};
