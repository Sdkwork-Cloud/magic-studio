import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPersistTokens = vi.fn();
const mockApplyTokens = vi.fn();
const mockClearTokens = vi.fn();
const mockReadTokens = vi.fn();
const mockResolveAccessToken = vi.fn();
const mockGetClient = vi.fn();

vi.mock('../src/services/useAppSdkClient', () => ({
  getAppSdkClientWithSession: mockGetClient,
  persistAppSdkSessionTokens: mockPersistTokens,
  applyAppSdkSessionTokens: mockApplyTokens,
  clearAppSdkSessionTokens: mockClearTokens,
  readAppSdkSessionTokens: mockReadTokens,
  resolveAppSdkAccessToken: mockResolveAccessToken,
}));

describe('appAuthService', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockResolveAccessToken.mockReturnValue('access-from-env');
    mockReadTokens.mockReturnValue({});
  });

  it('maps login responses into a persisted app session', async () => {
    const login = vi.fn(async () => ({
      code: '200',
      data: {
        authToken: 'auth-token',
        refreshToken: 'refresh-token',
        userInfo: {
          id: 7,
          username: 'demo',
          nickname: 'Demo User',
        },
      },
    }));

    mockGetClient.mockReturnValue({
      auth: { login },
      user: { getUserProfile: vi.fn() },
    });

    const { appAuthService } = await import('../src/services/appAuthService');
    const session = await appAuthService.login({ username: 'demo', password: 'secret' });

    expect(login).toHaveBeenCalledWith({ username: 'demo', password: 'secret' });
    expect(session).toMatchObject({
      userId: '7',
      username: 'demo',
      displayName: 'Demo User',
      authToken: 'auth-token',
      accessToken: 'access-from-env',
      refreshToken: 'refresh-token',
    });
    expect(mockPersistTokens).toHaveBeenCalledWith({
      authToken: 'auth-token',
      accessToken: 'access-from-env',
      refreshToken: 'refresh-token',
    });
    expect(mockApplyTokens).toHaveBeenCalledWith({
      authToken: 'auth-token',
      accessToken: 'access-from-env',
    });
  });

  it('returns null from getCurrentSession when profile lookup fails for a persisted token', async () => {
    mockReadTokens.mockReturnValue({
      authToken: 'persisted-auth',
      refreshToken: 'persisted-refresh',
    });
    mockGetClient.mockReturnValue({
      user: {
        getUserProfile: vi.fn(async () => {
          throw new Error('unauthorized');
        }),
      },
    });

    const { appAuthService } = await import('../src/services/appAuthService');
    await expect(appAuthService.getCurrentSession()).resolves.toBeNull();
  });
});
