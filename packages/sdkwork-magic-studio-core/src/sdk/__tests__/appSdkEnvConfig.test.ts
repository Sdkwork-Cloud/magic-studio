import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createAppSdkClientConfigFromEnv,
  resolveAppSdkAccessTokenFromEnv,
} from '../appSdkEnv';

function createTestAccessToken(claims: Record<string, unknown>): string {
  const body = btoa(JSON.stringify(claims)).replace(/=+$/g, '');
  return `header.${body}.signature`;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createAppSdkClientConfigFromEnv', () => {
  it('derives tenant and organization identity from access token claims instead of env ids', () => {
    const accessToken = createTestAccessToken({
      tenant_id: 'tenant-from-token',
      organization_id: 'org-from-token',
    });
    const config = createAppSdkClientConfigFromEnv({
      VITE_APP_ENV: 'development',
      VITE_API_BASE_URL: 'https://primary.example.com///',
      SDKWORK_ACCESS_TOKEN: accessToken,
      VITE_TIMEOUT: '15000',
      VITE_TENANT_ID: 'tenant-env-ignored',
      SDKWORK_TENANT_ID: 'tenant-legacy-ignored',
      VITE_ORGANIZATION_ID: 'org-env-ignored',
      SDKWORK_ORGANIZATION_ID: 'org-legacy-ignored',
      VITE_PLATFORM: 'web',
    });

    expect(config).toMatchObject({
      env: 'development',
      baseUrl: 'https://primary.example.com',
      accessToken,
      timeout: 15000,
      tenantId: 'tenant-from-token',
      organizationId: 'org-from-token',
      platform: 'web',
    });
  });

  it('falls back to compatibility keys and supports test mode', () => {
    const accessToken = createTestAccessToken({
      tenant_id: 'tenant-test',
      organization_id: 'org-test',
    });
    const config = createAppSdkClientConfigFromEnv({
      VITE_APP_ENV: 'test',
      SDKWORK_API_BASE_URL: 'https://compat.example.com/',
      SDKWORK_ACCESS_TOKEN: accessToken,
      SDKWORK_TIMEOUT: '32000',
      SDKWORK_PLATFORM: 'desktop',
    });

    expect(config).toMatchObject({
      env: 'test',
      baseUrl: 'https://compat.example.com',
      accessToken,
      timeout: 32000,
      tenantId: 'tenant-test',
      organizationId: 'org-test',
      platform: 'desktop',
    });
  });

  it('lets explicit overrides win over environment values', () => {
    const config = createAppSdkClientConfigFromEnv(
      {
        VITE_APP_ENV: 'production',
        VITE_API_BASE_URL: 'https://env.example.com',
        SDKWORK_ACCESS_TOKEN: 'env-token',
        VITE_TIMEOUT: '5000',
      },
      {
        baseUrl: 'https://override.example.com',
        accessToken: 'override-token',
        timeout: 7000,
      }
    );

    expect(config).toMatchObject({
      env: 'production',
      baseUrl: 'https://override.example.com',
      accessToken: 'override-token',
      timeout: 7000,
    });
  });

  it('uses the resolved browser runtime instead of defaulting to desktop when no platform env is provided', () => {
    const config = createAppSdkClientConfigFromEnv({
      VITE_APP_ENV: 'development',
      VITE_API_BASE_URL: 'https://browser.example.com',
    });

    expect(config).toMatchObject({
      env: 'development',
      baseUrl: 'https://browser.example.com',
      platform: 'web',
    });
  });

  it('preserves the injected server runtime kind over browser env aliases and overrides', () => {
    vi.stubGlobal('window', {
      __sdkworkPlatformRuntime: {
        system: {
          kind: () => 'server',
        },
      },
    });

    const config = createAppSdkClientConfigFromEnv(
      {
        VITE_APP_ENV: 'development',
        VITE_API_BASE_URL: 'https://server.example.com',
        VITE_PLATFORM: 'web',
        SDKWORK_PLATFORM: 'web',
      },
      {
        platform: 'web',
      }
    );

    expect(config).toMatchObject({
      env: 'development',
      baseUrl: 'https://server.example.com',
      platform: 'server',
    });
  });
});

describe('resolveAppSdkAccessTokenFromEnv', () => {
  it('returns SDKWORK_ACCESS_TOKEN from private env', () => {
    expect(
      resolveAppSdkAccessTokenFromEnv({
        SDKWORK_ACCESS_TOKEN: 'deployment-token',
      })
    ).toBe('deployment-token');
  });
});
