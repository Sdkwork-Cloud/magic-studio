import { access } from 'node:fs/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockCreateRuntimeMagicStudioServerClient,
  mockIsMagicStudioServerRuntimeSupported,
  mockReadDefaultPlatformRuntime,
  mockServerClient,
} = vi.hoisted(() => {
  const mockServerClient = {
    createNotification: vi.fn(),
    deleteNotifications: vi.fn(),
    listNotifications: vi.fn(),
    markAllNotificationsAsRead: vi.fn(),
    markNotificationAsRead: vi.fn(),
    readNotificationUnreadCount: vi.fn(),
  };

  return {
    mockCreateRuntimeMagicStudioServerClient: vi.fn(() => mockServerClient),
    mockIsMagicStudioServerRuntimeSupported: vi.fn(() => true),
    mockReadDefaultPlatformRuntime: vi.fn(),
    mockServerClient,
  };
});

vi.mock('@sdkwork/magic-studio-core/sdk', () => ({
  createRuntimeMagicStudioServerClient: mockCreateRuntimeMagicStudioServerClient,
  isMagicStudioServerRuntimeSupported: mockIsMagicStudioServerRuntimeSupported,
  readDefaultPlatformRuntime: mockReadDefaultPlatformRuntime,
}));

describe('notificationService canonical server bridge', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockReadDefaultPlatformRuntime.mockReturnValue({
      system: {
        kind: () => 'web',
      },
    });
    mockCreateRuntimeMagicStudioServerClient.mockReturnValue(mockServerClient);
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('loads notifications through the canonical runtime server client', async () => {
    mockServerClient.listNotifications.mockResolvedValue({
      items: [
        {
          id: 'notification-1',
          uuid: 'client-entity:notification-1',
          title: 'Render finished',
          message: 'Your preview render is ready.',
          type: 'INFO',
          isRead: false,
          createdAt: '2026-04-05T12:00:00.000Z',
          updatedAt: '2026-04-05T12:00:00.000Z',
        },
      ],
      total: 1,
    });

    const { notificationService } = await import('../src/services/notificationService');

    const result = await notificationService.findAll({ page: 0, size: 20 });

    expect(mockReadDefaultPlatformRuntime).toHaveBeenCalledWith('NotificationService');
    expect(mockCreateRuntimeMagicStudioServerClient).toHaveBeenCalledWith({
      system: {
        kind: expect.any(Function),
      },
    });
    expect(mockServerClient.listNotifications).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      content: [
        expect.objectContaining({
          id: 'notification-1',
          uuid: 'client-entity:notification-1',
          title: 'Render finished',
          message: 'Your preview render is ready.',
          isRead: false,
        }),
      ],
      total: 1,
    });
  });

  it('fails closed when creating a notification fails', async () => {
    mockServerClient.createNotification.mockRejectedValue(new Error('notification backend unavailable'));

    const { notificationService } = await import('../src/services/notificationService');

    const result = await notificationService.notify('Build', 'Backend should own notifications');

    expect(result).toMatchObject({
      success: false,
      message: 'notification backend unavailable',
    });
  });

  it('ships a notification contract typecheck guard for Magic Studio server drift', async () => {
    await expect(
      access(
        new URL('../src/services/notificationService.contract-typecheck.ts', import.meta.url),
      ),
    ).resolves.toBeUndefined();
  });

  it('ships a dedicated notification contract tsconfig', async () => {
    await expect(
      access(
        new URL('../tsconfig.contract.json', import.meta.url),
      ),
    ).resolves.toBeUndefined();
  });
});
