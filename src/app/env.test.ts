import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildEnvConfig, ENV, EnvUtils } from './env';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('buildEnvConfig', () => {
  it('projects owner-scoped sdkwork-core env into the app shell config', () => {
    const config = buildEnvConfig({
      VITE_APP_ENV: 'staging',
      VITE_OWNER_MODE: 'tenant',
      VITE_TENANT_API_BASE_URL: 'https://tenant.example.com///',
      SDKWORK_ACCESS_TOKEN: 'tenant-access-token',
      VITE_TIMEOUT: '32000',
      VITE_WS_URL: 'wss://socket.example.com/ws',
      VITE_IM_API_BASE_URL: 'https://im.example.com',
      VITE_DEBUG: 'true',
      VITE_LOG_LEVEL: 'error',
      VITE_FEATURE_ANALYTICS: '1',
      VITE_FEATURE_NOTIFICATIONS: '0',
      VITE_FEATURE_WEBSOCKET: '1',
      VITE_FEATURE_CACHE: '0',
      VITE_PLATFORM: 'web',
    });

    expect(config).toMatchObject({
      appEnv: 'staging',
      isDev: false,
      isStaging: true,
      accessToken: 'tenant-access-token',
      debug: true,
      logLevel: 'error',
      platform: 'web',
      isDesktopShell: false,
      api: {
        baseUrl: 'https://tenant.example.com',
        wsUrl: 'wss://socket.example.com/ws',
        imBaseUrl: 'https://im.example.com',
        timeout: 32000,
      },
      features: {
        analytics: true,
        notifications: false,
        websocket: true,
        cache: false,
      },
    });
  });

  it('derives websocket and im endpoints from the shared base url when no app override is provided', () => {
    const config = buildEnvConfig({
      VITE_APP_ENV: 'production',
      VITE_OWNER_MODE: 'root',
      VITE_ROOT_API_BASE_URL: 'https://root.example.com/api/',
      SDKWORK_ACCESS_TOKEN: 'root-access-token',
      VITE_TIMEOUT: '18000',
    });

    expect(config).toMatchObject({
      appEnv: 'production',
      accessToken: 'root-access-token',
      api: {
        baseUrl: 'https://root.example.com/api',
        imBaseUrl: 'https://root.example.com/api',
        timeout: 18000,
      },
    });
    expect(config.api.wsUrl).toBe('wss://root.example.com/ws');
  });

  it('does not treat the legacy tauri alias as a public app platform value', () => {
    const config = buildEnvConfig({
      VITE_APP_ENV: 'development',
      VITE_OWNER_MODE: 'root',
      VITE_ROOT_API_BASE_URL: 'https://desktop.example.com/api/',
      VITE_PLATFORM: 'tauri',
    });

    expect(config).toMatchObject({
      platform: 'web',
      isDesktopShell: false,
    });
  });

  it('preserves server as the public app platform when runtime global promotes the browser host', () => {
    vi.stubGlobal('window', {
      __sdkworkPlatformRuntime: {
        system: {
          kind: () => 'server',
        },
      },
    });

    const config = buildEnvConfig({
      VITE_APP_ENV: 'development',
      VITE_OWNER_MODE: 'root',
      VITE_ROOT_API_BASE_URL: 'https://server.example.com/api/',
      VITE_PLATFORM: 'web',
    });

    expect(config).toMatchObject({
      platform: 'server',
      isDesktopShell: false,
      api: {
        baseUrl: 'https://server.example.com/api',
      },
    });
  });

  it('keeps ENV and EnvUtils runtime-aware after late server promotion', () => {
    vi.stubEnv('VITE_APP_ENV', 'development');
    vi.stubEnv('VITE_OWNER_MODE', 'root');
    vi.stubEnv('VITE_ROOT_API_BASE_URL', 'https://server.example.com/api/');
    vi.stubEnv('SDKWORK_ACCESS_TOKEN', 'server-access-token');
    vi.stubEnv('VITE_PLATFORM', 'web');
    vi.stubGlobal('window', {
      __sdkworkPlatformRuntime: {
        system: {
          kind: () => 'server',
        },
      },
    });

    expect(ENV.platform).toBe('server');
    expect(ENV.api.baseUrl).toBe('https://server.example.com/api');
    expect(EnvUtils.getApiUrl('/healthz')).toBe('https://server.example.com/api/healthz');
    expect(EnvUtils.getSdkConfig()).toMatchObject({
      baseUrl: 'https://server.example.com/api',
      timeout: 30000,
    });
  });
});
