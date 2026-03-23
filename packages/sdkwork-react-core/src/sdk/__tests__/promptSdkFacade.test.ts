import { afterEach, describe, expect, it, vi } from 'vitest';

const promptModule = { listPrompts: vi.fn() };
const generationModule = { enhanceGenerationPrompt: vi.fn() };

vi.mock('../useAppSdkClient', () => ({
  APP_SDK_AUTH_TOKEN_STORAGE_KEY: 'sdkwork_token',
  APP_SDK_ACCESS_TOKEN_STORAGE_KEY: 'sdkwork_access_token',
  APP_SDK_REFRESH_TOKEN_STORAGE_KEY: 'sdkwork_refresh_token',
  applyAppSdkSessionTokens: vi.fn(),
  clearAppSdkSessionTokens: vi.fn(),
  createAppSdkClientConfig: vi.fn(() => ({ baseUrl: 'https://api.example.com', env: 'development' })),
  getAppSdkClient: vi.fn(() => ({
    prompt: promptModule,
    generation: generationModule,
  })),
  getAppSdkClientConfig: vi.fn(() => ({ baseUrl: 'https://api.example.com', env: 'development' })),
  getAppSdkClientWithSession: vi.fn(() => ({
    prompt: promptModule,
    generation: generationModule,
  })),
  initAppSdkClient: vi.fn(() => ({
    prompt: promptModule,
    generation: generationModule,
  })),
  persistAppSdkSessionTokens: vi.fn(),
  readAppSdkSessionTokens: vi.fn(() => ({})),
  resetAppSdkClient: vi.fn(),
  resolveAppSdkAccessToken: vi.fn(() => ''),
}));

describe('sdk prompt facade', () => {
  afterEach(() => {
    vi.resetModules();
  });

  it('routes sdk.prompt to the official prompt module instead of generation', async () => {
    const { sdk } = await import('../index');

    expect(sdk.prompt).toBe(promptModule);
    expect(sdk.prompt).not.toBe(generationModule);
  });
});
