import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const enhanceGenerationPromptMock = vi.fn();
const createClientMock = vi.fn((config: { baseUrl: string; tenantId?: string }) => ({
  prompt: {},
  generation: {
    enhanceGenerationPrompt: enhanceGenerationPromptMock,
  },
  setAuthToken: vi.fn(),
  setAccessToken: vi.fn(),
  __config: config,
}));

async function loadSdkClientModule() {
  const runtimeModule = await import('@sdkwork/core-pc-react/runtime');
  runtimeModule.resetPcReactRuntime({
    clearStorage: false,
    clearConfiguration: true,
  });
  runtimeModule.configurePcReactRuntime({
    appClientFactory: createClientMock,
  });
  return import('../useAppSdkClient');
}

describe('createScopedAppSdkClient', () => {
  beforeEach(() => {
    enhanceGenerationPromptMock.mockReset();
  });

  afterEach(() => {
    vi.resetModules();
    createClientMock.mockClear();
    vi.unstubAllEnvs();
  });

  it('creates a scoped client without mutating the global singleton config', async () => {
    const sdkClientModule = await loadSdkClientModule();

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

  it('resolves owner-scoped tenant base urls and access tokens', async () => {
    vi.stubEnv('VITE_APP_ENV', 'development');
    vi.stubEnv('VITE_OWNER_MODE', 'tenant');
    vi.stubEnv('VITE_API_BASE_URL', 'https://api-root.sdkwork.com');
    vi.stubEnv('VITE_TENANT_API_BASE_URL', 'https://api-tenant.sdkwork.com/');
    vi.stubEnv('VITE_ACCESS_TOKEN', 'root-access-token');
    vi.stubEnv('VITE_TENANT_ACCESS_TOKEN', 'tenant-access-token');
    vi.stubEnv('VITE_PLATFORM', 'desktop');

    const sdkClientModule = await loadSdkClientModule();
    const config = sdkClientModule.createAppSdkClientConfig();

    expect(config.baseUrl).toBe('https://api-tenant.sdkwork.com');
    expect(config.accessToken).toBe('tenant-access-token');
    expect(config.platform).toBe('desktop');
  });

  it('exposes cover prompt suggestions through the shared app SDK generation wrapper', async () => {
    enhanceGenerationPromptMock.mockResolvedValue({
      code: 2000,
      message: 'ok',
      data: {
        prompt: 'Editorial cover prompt with clear hierarchy.',
      },
    });

    const sdkClientModule = await loadSdkClientModule();
    const client = sdkClientModule.initAppSdkClient({
      baseUrl: 'https://default.example.com',
    });

    const result = await client.generation.getCoverPromptSuggestions({
      context: 'AI workspace for startup founders',
      count: 3,
      language: 'en-US',
      styleHints: ['editorial', 'minimalist'],
    });

    expect(enhanceGenerationPromptMock).toHaveBeenCalledWith({
      prompt: 'AI workspace for startup founders',
      scene: 'asset-cover',
      style: 'editorial, minimalist',
      language: 'en-US',
      maxWords: 180,
    });
    expect(result).toEqual({
      code: 2000,
      message: 'ok',
      data: {
        prompts: ['Editorial cover prompt with clear hierarchy.'],
      },
    });
  });
});
