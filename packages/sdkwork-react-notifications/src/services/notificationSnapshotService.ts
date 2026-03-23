import { notificationBusinessService } from './notificationBusinessService';

export interface NotificationSnapshot {
  notifications: Awaited<ReturnType<typeof notificationBusinessService.findAll>> extends {
    data?: { content: infer T };
  }
    ? T
    : never;
  total: number;
  unreadCount: number;
}

export async function loadNotificationSnapshot(options?: {
  page?: number;
  size?: number;
}): Promise<NotificationSnapshot> {
  const result = await notificationBusinessService.findAll(options);
  if (!result.success || !result.data) {
    throw new Error(result.message || 'Failed to load notifications');
  }

  const unreadCount = await notificationBusinessService.getUnreadCount();

  return {
    notifications: result.data.content,
    total: result.data.total,
    unreadCount,
  };
}
