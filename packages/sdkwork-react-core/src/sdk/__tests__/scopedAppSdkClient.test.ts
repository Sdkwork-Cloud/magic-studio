import { afterEach, describe, expect, it, vi } from 'vitest';

const createClientMock = vi.fn((config: { baseUrl: string; tenantId?: string; tokenManager?: unknown }) => ({
  prompt: {},
  generation: {},
  setAuthToken: vi.fn(),
  setAccessToken: vi.fn(),
  __config: config,
}));

vi.mock('@sdkwork/app-sdk', () => ({
  createClient: createClientMock,
}));

describe('createScopedAppSdkClient', () => {
  afterEach(() => {
    vi.resetModules();
    createClientMock.mockClear();
  });

  it('creates a scoped client without mutating the global singleton config', async () => {
    const sdkClientModule = await import('../useAppSdkClient');

    sdkClientModule.initAppSdkClient({
      baseUrl: 'https://default.example.com',
      tenantId: 'tenant-a',
    });

    const scopedClient = sdkClientModule.createScopedAppSdkClient({
      baseUrl: 'https://tenant-b.example.com',
      tenantId: 'tenant-b',
    });

    expect(scopedClient).toBeTruthy();
    expect(sdkClientModule.getAppSdkClientConfig()?.baseUrl).toBe('https://default.example.com');
    expect(sdkClientModule.getAppSdkClientConfig()?.tenantId).toBe('tenant-a');
    expect(createClientMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        baseUrl: 'https://tenant-b.example.com',
        tenantId: 'tenant-b',
      })
    );
  });

  it('reuses the same token manager for singleton and scoped clients', async () => {
    const sdkClientModule = await import('../useAppSdkClient');

    sdkClientModule.initAppSdkClient({
      baseUrl: 'https://default.example.com',
      tenantId: 'tenant-a',
    });

    sdkClientModule.createScopedAppSdkClient({
      baseUrl: 'https://tenant-b.example.com',
      tenantId: 'tenant-b',
    });

    expect(createClientMock).toHaveBeenCalledTimes(2);
    expect(createClientMock.mock.calls[0]?.[0]?.tokenManager).toBeTruthy();
    expect(createClientMock.mock.calls[1]?.[0]?.tokenManager).toBe(createClientMock.mock.calls[0]?.[0]?.tokenManager);
  });
});
