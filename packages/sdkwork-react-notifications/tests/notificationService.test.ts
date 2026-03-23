import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockListNotifications = vi.fn();

vi.mock('@sdkwork/react-core', () => ({
  getSdkworkClient: () => ({
    notification: {
      listNotifications: mockListNotifications,
      sendTest: vi.fn(),
      markAsRead: vi.fn(),
      markAllAsRead: vi.fn(),
      getUnreadCount: vi.fn(),
      deleteNotification: vi.fn(),
    },
  }),
}));

describe('notificationService pagination contract', () => {
  beforeEach(() => {
    vi.resetModules();
    mockListNotifications.mockReset();
  });

  it('sends backend-safe 1-based page values when loading notifications', async () => {
    mockListNotifications.mockResolvedValue({
      code: '2000',
      msg: 'ok',
      data: {
        content: [
          {
            id: 'n-1',
            title: 'Hello',
            message: 'World',
            isRead: false,
          },
        ],
        total: 1,
      },
    });

    const { notificationService } = await import('../src/services/notificationService');

    const result = await notificationService.findAll({ page: 0, size: 20 });

    expect(result.success).toBe(true);
    expect(mockListNotifications).toHaveBeenCalledWith({
      page: 1,
      pageNo: 1,
      pageIndex: 0,
      size: 20,
      pageSize: 20,
    });
  });
});
