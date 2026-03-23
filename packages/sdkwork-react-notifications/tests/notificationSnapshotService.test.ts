import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockFindAll = vi.fn();
const mockGetUnreadCount = vi.fn();

vi.mock('../src/services/notificationBusinessService', () => ({
  notificationBusinessService: {
    findAll: mockFindAll,
    getUnreadCount: mockGetUnreadCount,
  },
}));

describe('loadNotificationSnapshot', () => {
  beforeEach(() => {
    vi.resetModules();
    mockFindAll.mockReset();
    mockGetUnreadCount.mockReset();
  });

  it('uses backend unread count instead of deriving unread state from the current page', async () => {
    mockFindAll.mockResolvedValue({
      success: true,
      data: {
        content: [
          { id: 'n-1', title: 'Read item', message: 'Already read', isRead: true },
          { id: 'n-2', title: 'Unread item', message: 'Still unread', isRead: false },
        ],
        total: 30,
      },
    });
    mockGetUnreadCount.mockResolvedValue(12);

    const { loadNotificationSnapshot } =
      await import('../src/services/notificationSnapshotService');

    const snapshot = await loadNotificationSnapshot({ page: 0, size: 50 });

    expect(mockFindAll).toHaveBeenCalledWith({ page: 0, size: 50 });
    expect(mockGetUnreadCount).toHaveBeenCalledTimes(1);
    expect(snapshot.unreadCount).toBe(12);
    expect(snapshot.notifications).toHaveLength(2);
  });
});
