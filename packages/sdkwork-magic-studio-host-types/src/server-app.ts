export const MAGIC_STUDIO_NOTIFICATION_TYPES = [
  'INFO',
  'SUCCESS',
  'WARNING',
  'ERROR',
] as const;

export type MagicStudioNotificationType =
  (typeof MAGIC_STUDIO_NOTIFICATION_TYPES)[number];

export interface MagicStudioAppSettingsDocument {
  scope: 'user';
  schemaVersion: string;
  settings: Record<string, unknown>;
  updatedAt: string;
}

export interface MagicStudioAppSettingsUpdateRequest {
  settings: Record<string, unknown>;
}

export interface MagicStudioNotificationRecord {
  id: string;
  uuid: string;
  title: string;
  message: string;
  type: MagicStudioNotificationType;
  isRead: boolean;
  actionUrl?: string | null;
  actionLabel?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MagicStudioNotificationCreateRequest {
  title: string;
  message: string;
  type?: MagicStudioNotificationType;
  actionUrl?: string;
  actionLabel?: string;
}

export interface MagicStudioNotificationBatchDeleteRequest {
  notificationIds: string[];
}

export interface MagicStudioNotificationUnreadCount {
  unreadCount: number;
}
