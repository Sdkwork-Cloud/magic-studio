import { describe, expect, it } from 'vitest';

import {
  createAppSdkClientConfigFromEnv,
  resolveAppSdkAccessTokenFromEnv,
} from '../appSdkEnv';

describe('createAppSdkClientConfigFromEnv', () => {
  it('prefers primary vite keys over compatibility fallbacks', () => {
    const config = createAppSdkClientConfigFromEnv({
      VITE_APP_ENV: 'development',
      VITE_API_BASE_URL: 'https://primary.example.com///',
      VITE_APP_API_BASE_URL: 'https://legacy-app.example.com',
      SDKWORK_API_BASE_URL: 'https://legacy-sdk.example.com',
      VITE_ACCESS_TOKEN: 'primary-token',
      SDKWORK_ACCESS_TOKEN: 'legacy-token',
      VITE_TIMEOUT: '15000',
      SDKWORK_TIMEOUT: '9000',
      VITE_TENANT_ID: 'tenant-primary',
      SDKWORK_TENANT_ID: 'tenant-legacy',
      VITE_ORGANIZATION_ID: 'org-primary',
      SDKWORK_ORGANIZATION_ID: 'org-legacy',
      VITE_PLATFORM: 'tauri',
      SDKWORK_PLATFORM: 'web',
    });

    expect(config).toMatchObject({
      env: 'development',
      baseUrl: 'https://primary.example.com',
      accessToken: 'primary-token',
      timeout: 15000,
      tenantId: 'tenant-primary',
      organizationId: 'org-primary',
      platform: 'tauri',
    });
  });

  it('falls back to compatibility keys and supports test mode', () => {
    const config = createAppSdkClientConfigFromEnv({
      VITE_APP_ENV: 'test',
      SDKWORK_API_BASE_URL: 'https://compat.example.com/',
      SDKWORK_ACCESS_TOKEN: 'compat-token',
      SDKWORK_TIMEOUT: '32000',
      SDKWORK_TENANT_ID: 'tenant-test',
      SDKWORK_ORGANIZATION_ID: 'org-test',
      SDKWORK_PLATFORM: 'desktop',
    });

    expect(config).toMatchObject({
      env: 'test',
      baseUrl: 'https://compat.example.com',
      accessToken: 'compat-token',
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
        VITE_ACCESS_TOKEN: 'env-token',
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
});

describe('resolveAppSdkAccessTokenFromEnv', () => {
  it('returns the primary token before compatibility fallbacks', () => {
    expect(
      resolveAppSdkAccessTokenFromEnv({
        VITE_ACCESS_TOKEN: 'primary-token',
        SDKWORK_ACCESS_TOKEN: 'compat-token',
      })
    ).toBe('primary-token');
  });

  it('falls back to compatibility token when primary token is absent', () => {
    expect(
      resolveAppSdkAccessTokenFromEnv({
        SDKWORK_ACCESS_TOKEN: 'compat-token',
      })
    ).toBe('compat-token');
  });
});
