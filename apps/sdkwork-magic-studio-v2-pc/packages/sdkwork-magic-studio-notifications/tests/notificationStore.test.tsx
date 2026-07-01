/** @vitest-environment jsdom */

import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, waitFor } from '@/tests/support/reactTesting';
import { NotificationType } from '../src/entities';

const mocks = vi.hoisted(() => ({
  loadNotificationSnapshot: vi.fn(),
  prune: vi.fn(async () => undefined),
  notify: vi.fn(),
  markAsRead: vi.fn(async () => ({ success: true })),
  markAllAsRead: vi.fn(async () => ({ success: true })),
  deleteAll: vi.fn(async () => ({ success: true })),
}));

vi.mock('../src/services', () => ({
  loadNotificationSnapshot: mocks.loadNotificationSnapshot,
  notificationBusinessService: {
    prune: mocks.prune,
    notify: mocks.notify,
    markAsRead: mocks.markAsRead,
    markAllAsRead: mocks.markAllAsRead,
    deleteAll: mocks.deleteAll,
  },
}));

import { NotificationStoreProvider, useNotificationStore } from '../src/store/notificationStore';

describe('NotificationStoreProvider', () => {
  let latestStore: ReturnType<typeof useNotificationStore> | null = null;

  const Observer = () => {
    const store = useNotificationStore();

    React.useEffect(() => {
      latestStore = store;
    }, [store]);

    return null;
  };

  beforeEach(() => {
    latestStore = null;
    vi.clearAllMocks();
    mocks.prune.mockResolvedValue(undefined);
    mocks.markAsRead.mockResolvedValue({ success: true });
    mocks.loadNotificationSnapshot.mockResolvedValue({
      notifications: [
        {
          id: 'notification-read',
          uuid: 'notification-read-uuid',
          title: 'Read',
          message: 'Already read',
          type: NotificationType.INFO,
          isRead: true,
          createdAt: 1,
          updatedAt: 1,
        },
        {
          id: 'notification-unread',
          uuid: 'notification-unread-uuid',
          title: 'Unread',
          message: 'Needs attention',
          type: NotificationType.WARNING,
          isRead: false,
          createdAt: 2,
          updatedAt: 2,
        },
      ],
      unreadCount: 1,
    });
  });

  it('does not decrement unreadCount when markAsRead is called for an already-read notification', async () => {
    render(
      <NotificationStoreProvider>
        <Observer />
      </NotificationStoreProvider>
    );

    await waitFor(() => {
      expect(mocks.prune).toHaveBeenCalledTimes(1);
      expect(latestStore?.unreadCount).toBe(1);
    });

    await act(async () => {
      await latestStore?.markAsRead('notification-read');
    });

    expect(mocks.markAsRead).toHaveBeenCalledWith('notification-read');
    expect(latestStore?.unreadCount).toBe(1);
  });
});
