import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockClearAppSdkSessionTokens,
  mockCreateRuntimeMagicStudioServerClient,
  mockPersistAppSdkSessionTokens,
  mockReadAppSdkSessionTokens,
  mockReadDefaultPlatformRuntime,
} = vi.hoisted(() => ({
  mockClearAppSdkSessionTokens: vi.fn(),
  mockCreateRuntimeMagicStudioServerClient: vi.fn(),
  mockPersistAppSdkSessionTokens: vi.fn(),
  mockReadAppSdkSessionTokens: vi.fn(),
  mockReadDefaultPlatformRuntime: vi.fn(),
}));

vi.mock('@sdkwork/magic-studio-core/sdk', () => ({
  clearAppSdkSessionTokens: mockClearAppSdkSessionTokens,
  createRuntimeMagicStudioServerClient: mockCreateRuntimeMagicStudioServerClient,
  persistAppSdkSessionTokens: mockPersistAppSdkSessionTokens,
  readAppSdkSessionTokens: mockReadAppSdkSessionTokens,
  readDefaultPlatformRuntime: mockReadDefaultPlatformRuntime,
}));

import { appAuthService } from '../src/services/appAuthService';

const mockServerClient = {
  checkVerifyCode: vi.fn(),
  createLoginQrCode: vi.fn(),
  login: vi.fn(),
  loginWithPhone: vi.fn(),
  logout: vi.fn(),
  readAuthSession: vi.fn(),
  readLoginQrCodeStatus: vi.fn(),
  refreshSession: vi.fn(),
  register: vi.fn(),
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
  sendVerifyCode: vi.fn(),
};

describe('appAuthService canonical server bridge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReadDefaultPlatformRuntime.mockReturnValue({
      system: {
        kind: () => 'web',
      },
    });
    mockCreateRuntimeMagicStudioServerClient.mockReturnValue(mockServerClient);
    mockReadAppSdkSessionTokens.mockReturnValue({
      authToken: 'stale-auth-token',
      refreshToken: 'stored-refresh-token',
    });
  });

  it('refreshes the canonical auth session through the runtime server client', async () => {
    mockServerClient.refreshSession.mockResolvedValue({
      data: {
        accessToken: 'fresh-access-token',
        authToken: 'fresh-auth-token',
        refreshToken: 'next-refresh-token',
        expiresAt: '2026-04-20T23:59:59Z',
        user: {
          displayName: 'Alice',
          email: 'alice@example.com',
          userId: 'user-1',
          username: 'alice',
        },
      },
    });

    const session = await appAuthService.refreshToken();

    expect(mockReadDefaultPlatformRuntime).toHaveBeenCalledWith('AppAuthService');
    expect(mockServerClient.refreshSession).toHaveBeenCalledWith({
      refreshToken: 'stored-refresh-token',
    });
    expect(mockPersistAppSdkSessionTokens).toHaveBeenCalledWith({
      accessToken: 'fresh-access-token',
      authToken: 'fresh-auth-token',
      refreshToken: 'next-refresh-token',
    });
    expect(session).toEqual({
      accessToken: 'fresh-access-token',
      authToken: 'fresh-auth-token',
      displayName: 'Alice',
      email: 'alice@example.com',
      refreshToken: 'next-refresh-token',
      userId: 'user-1',
      username: 'alice',
    });
  });

  it('reads the canonical session state and clears persisted tokens when the user is anonymous', async () => {
    mockServerClient.readAuthSession.mockResolvedValue({
      data: {
        isAuthenticated: false,
        session: null,
      },
    });

    await expect(appAuthService.getCurrentSession()).resolves.toBeNull();
    expect(mockClearAppSdkSessionTokens).toHaveBeenCalledTimes(1);
  });
});
