import {
  createRuntimeMagicStudioServerClient,
  isMagicStudioServerRuntimeSupported,
  readDefaultPlatformRuntime,
} from '@sdkwork/magic-studio-core/sdk';
import type { MagicStudioServerClient } from '@sdkwork/magic-studio-server';
import { isMagicStudioServerClientError } from '@sdkwork/magic-studio-server';
import {
  Result,
  type ServiceResult,
} from '@sdkwork/magic-studio-types/service';
import type { AppNotification } from '@sdkwork/magic-studio-types/user';
import { NotificationType } from '@sdkwork/magic-studio-types/vocabulary';
import {
  deriveClientEntityUuidFromId,
  matchesEntityKey,
} from '@sdkwork/magic-studio-types/entity';
import { generateUUID } from '@sdkwork/magic-studio-commons/utils/helpers';

type NotificationsServerClient = Pick<
  MagicStudioServerClient,
  | 'listNotifications'
  | 'createNotification'
  | 'markNotificationAsRead'
  | 'markAllNotificationsAsRead'
  | 'readNotificationUnreadCount'
  | 'deleteNotifications'
>;

type AnyRecord = Record<string, unknown>;

const NOTIFICATION_STORAGE_KEY = 'magic_studio_notifications_v1';
const LEGACY_NOTIFICATION_STORAGE_KEYS = ['open_studio_notifications_v1'] as const;
const MAX_CACHE_SIZE = 50;
const NOTIFICATIONS_FEATURE_NAME = 'NotificationService';

function normalizeIdentityValue(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  return null;
}

function toNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }

    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      return numeric;
    }
  }

  return fallback;
}

function normalizeNotificationType(value: unknown): NotificationType {
  const text = typeof value === 'string' ? value.trim().toUpperCase() : '';
  if (text === 'SUCCESS') {
    return NotificationType.SUCCESS;
  }
  if (text === 'WARNING') {
    return NotificationType.WARNING;
  }
  if (text === 'ERROR') {
    return NotificationType.ERROR;
  }
  return NotificationType.INFO;
}

function toServerNotificationType(type: NotificationType): 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' {
  const normalized = String(type).toUpperCase();
  if (normalized === NotificationType.SUCCESS) {
    return 'SUCCESS';
  }
  if (normalized === NotificationType.WARNING) {
    return 'WARNING';
  }
  if (normalized === NotificationType.ERROR) {
    return 'ERROR';
  }
  return 'INFO';
}

function normalizeNotification(raw: unknown): AppNotification | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const source = raw as AnyRecord;
  const normalizedId = normalizeIdentityValue(source.id ?? source.notificationId);
  const normalizedUuid =
    normalizeIdentityValue(source.uuid) ||
    (normalizedId ? deriveClientEntityUuidFromId(normalizedId) : null);

  if (!normalizedId && !normalizedUuid) {
    return null;
  }

  const now = Date.now();
  const createdAt = toNumber(source.createdAt ?? source.createTime ?? source.createAt, now);
  const updatedAt = toNumber(source.updatedAt ?? source.updateTime ?? source.modifyTime, createdAt);
  const message =
    typeof source.message === 'string'
      ? source.message
      : typeof source.content === 'string'
        ? source.content
        : '';

  const readStatusRaw = source.isRead ?? source.read;
  const isRead =
    typeof readStatusRaw === 'boolean'
      ? readStatusRaw
      : String(readStatusRaw || '').toUpperCase() === 'TRUE';

  return {
    id: normalizedId,
    uuid: normalizedUuid || generateUUID(),
    title:
      typeof source.title === 'string' && source.title.trim()
        ? source.title.trim()
        : 'Notification',
    message: message.trim(),
    type: normalizeNotificationType(source.type),
    isRead,
    createdAt,
    updatedAt,
    actionUrl:
      typeof source.actionUrl === 'string'
        ? source.actionUrl
        : typeof source.link === 'string'
          ? source.link
          : undefined,
    actionLabel:
      typeof source.actionLabel === 'string'
        ? source.actionLabel
        : typeof source.actionText === 'string'
          ? source.actionText
          : undefined,
  };
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (isMagicStudioServerClientError(error)) {
    return error.message || error.detail || fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  return fallback;
}

class NotificationService {
  private cache: AppNotification[] | null = null;
  private cachedServerClient?: NotificationsServerClient;

  private getServerClient(): NotificationsServerClient {
    if (!this.cachedServerClient) {
      const runtime = readDefaultPlatformRuntime(NOTIFICATIONS_FEATURE_NAME);
      if (!isMagicStudioServerRuntimeSupported(runtime)) {
        throw new Error(
          '[NotificationService] Notification capabilities require the canonical Magic Studio server runtime',
        );
      }
      this.cachedServerClient = createRuntimeMagicStudioServerClient(runtime);
    }

    return this.cachedServerClient;
  }

  private findCachedNotification(key: string): AppNotification | undefined {
    return this.cache?.find((item) => matchesEntityKey(item, key));
  }

  private resolveRemoteNotificationId(key: string): string {
    return this.findCachedNotification(key)?.id || key;
  }

  private async ensureInitialized(): Promise<void> {
    if (this.cache === null) {
      await this.loadFromStorage();
    }
  }

  private async loadFromStorage(): Promise<void> {
    if (typeof localStorage === 'undefined') {
      this.cache = [];
      return;
    }

    try {
      const storageKeys = [NOTIFICATION_STORAGE_KEY, ...LEGACY_NOTIFICATION_STORAGE_KEYS];

      for (const key of storageKeys) {
        const data = localStorage.getItem(key);
        if (!data) {
          continue;
        }

        const parsed = JSON.parse(data);
        if (!Array.isArray(parsed)) {
          continue;
        }

        this.cache = parsed
          .map((item) => normalizeNotification(item))
          .filter((item): item is AppNotification => item !== null);

        if (key !== NOTIFICATION_STORAGE_KEY) {
          try {
            localStorage.setItem(NOTIFICATION_STORAGE_KEY, data);
            localStorage.removeItem(key);
          } catch {
            // Keep using the recovered snapshot even if one migration attempt fails.
          }
        }
        return;
      }

      this.cache = [];
    } catch {
      this.cache = [];
    }
  }

  private async persistToStorage(): Promise<void> {
    if (typeof localStorage === 'undefined' || this.cache === null) {
      return;
    }

    try {
      localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(this.cache));
    } catch {
      // Ignore storage write errors.
    }
  }

  private applyRemoteSnapshot(list: AppNotification[]): void {
    this.cache = [...list].sort((left, right) => {
      const leftTime = toNumber(left.createdAt, 0);
      const rightTime = toNumber(right.createdAt, 0);
      return rightTime - leftTime;
    });
  }

  private getFallbackPage(options?: { page?: number; size?: number }): {
    content: AppNotification[];
    total: number;
  } {
    const page = options?.page ?? 0;
    const size = options?.size ?? MAX_CACHE_SIZE;
    const start = Math.max(0, page) * Math.max(1, size);
    const content = (this.cache || []).slice(start, start + size);

    return {
      content,
      total: this.cache?.length ?? 0,
    };
  }

  private async syncSnapshotFromServer(options?: {
    page?: number;
    size?: number;
  }): Promise<{ content: AppNotification[]; total: number }> {
    const response = await this.getServerClient().listNotifications();
    const list = response.items
      .map((item) => normalizeNotification(item))
      .filter((item): item is AppNotification => item !== null);

    this.applyRemoteSnapshot(list);
    await this.persistToStorage();

    return this.getFallbackPage(options);
  }

  private async saveLocal(notification: Partial<AppNotification>): Promise<AppNotification> {
    await this.ensureInitialized();
    const now = Date.now();
    const normalizedId = normalizeIdentityValue(notification.id);
    const normalizedUuid =
      normalizeIdentityValue(notification.uuid) ||
      (normalizedId ? deriveClientEntityUuidFromId(normalizedId) : null) ||
      generateUUID();
    const existing = this.cache?.find((item) => matchesEntityKey(item, normalizedUuid));

    if (existing) {
      Object.assign(existing, notification, {
        id: normalizedId ?? existing.id ?? null,
        uuid: normalizedUuid,
        updatedAt: now,
      });
      await this.persistToStorage();
      return existing;
    }

    const created: AppNotification = {
      id: normalizedId,
      uuid: normalizedUuid,
      title: notification.title || '',
      message: notification.message || '',
      type: notification.type || NotificationType.INFO,
      isRead: notification.isRead ?? false,
      createdAt: notification.createdAt ?? now,
      updatedAt: notification.updatedAt ?? now,
      actionUrl: notification.actionUrl,
      actionLabel: notification.actionLabel,
    };

    (this.cache as AppNotification[]).unshift(created);
    await this.persistToStorage();
    return created;
  }

  async findAll(options?: {
    page?: number;
    size?: number;
  }): Promise<ServiceResult<{ content: AppNotification[]; total: number }>> {
    await this.ensureInitialized();

    try {
      const pageData = await this.syncSnapshotFromServer(options);
      return Result.success(pageData);
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to load notifications'));
    }
  }

  async save(
    notification: Partial<AppNotification>,
  ): Promise<ServiceResult<AppNotification>> {
    const data = await this.saveLocal(notification);
    return Result.success(data);
  }

  async notify(
    title: string,
    message: string,
    type: NotificationType = NotificationType.INFO,
    options?: { actionUrl?: string; actionLabel?: string },
  ): Promise<ServiceResult<AppNotification>> {
    try {
      const response = await this.getServerClient().createNotification({
        title,
        message,
        type: toServerNotificationType(type),
        actionUrl: options?.actionUrl,
        actionLabel: options?.actionLabel,
      });
      const normalized = normalizeNotification(response.data);
      if (normalized) {
        await this.saveLocal(normalized);
        return Result.success(normalized);
      }
      return Result.error('Notification create response missing notification data');
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to send notification'));
    }
  }

  async markAsRead(notificationKey: string): Promise<ServiceResult<void>> {
    await this.ensureInitialized();
    const remoteId = this.resolveRemoteNotificationId(notificationKey);

    try {
      await this.getServerClient().markNotificationAsRead(remoteId);
      if (this.cache) {
        this.cache = this.cache.map((item) =>
          matchesEntityKey(item, notificationKey)
            ? { ...item, isRead: true, updatedAt: Date.now() }
            : item,
        );
      }
      await this.persistToStorage();
      return Result.success(undefined);
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to mark notification as read'));
    }
  }

  async markAllAsRead(): Promise<ServiceResult<void>> {
    await this.ensureInitialized();

    try {
      await this.getServerClient().markAllNotificationsAsRead();
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to mark all notifications as read'));
    }

    if (this.cache) {
      const now = Date.now();
      this.cache = this.cache.map((item) => ({ ...item, isRead: true, updatedAt: now }));
      await this.persistToStorage();
    }
    return Result.success(undefined);
  }

  async getUnreadCount(): Promise<number> {
    try {
      const response = await this.getServerClient().readNotificationUnreadCount();
      if (typeof response.data?.unreadCount === 'number' && Number.isFinite(response.data.unreadCount)) {
        return response.data.unreadCount;
      }
      throw new Error('Notification unread count response missing unreadCount');
    } catch (error: unknown) {
      throw new Error(toErrorMessage(error, 'Failed to read notification unread count'));
    }
  }

  async prune(): Promise<void> {
    await this.ensureInitialized();
    if (!this.cache || this.cache.length <= MAX_CACHE_SIZE) {
      return;
    }

    this.cache.sort((left, right) => toNumber(right.createdAt, 0) - toNumber(left.createdAt, 0));
    this.cache = this.cache.slice(0, MAX_CACHE_SIZE);
    await this.persistToStorage();
  }

  async deleteAll(notificationKeys: string[]): Promise<ServiceResult<void>> {
    await this.ensureInitialized();
    if (!notificationKeys.length) {
      return Result.success(undefined);
    }

    try {
      await this.getServerClient().deleteNotifications({
        notificationIds: notificationKeys.map((key) => this.resolveRemoteNotificationId(key)),
      });
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to delete notifications'));
    }

    if (this.cache) {
      this.cache = this.cache.filter(
        (item) => !notificationKeys.some((key) => matchesEntityKey(item, key)),
      );
      await this.persistToStorage();
    }
    return Result.success(undefined);
  }
}

export const notificationService = new NotificationService();
