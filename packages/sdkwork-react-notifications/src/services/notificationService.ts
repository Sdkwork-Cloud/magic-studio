import { AppNotification, NotificationType } from '@sdkwork/react-commons';
import { getSdkworkClient } from '@sdkwork/react-core';

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  message?: string;
}

type ApiEnvelope<T> = {
  code?: string | number;
  msg?: string;
  message?: string;
  data?: T;
};

type AnyRecord = Record<string, unknown>;

const Result = {
  success: <T>(data: T): ServiceResult<T> => ({ success: true, data }),
  error: <T>(message: string): ServiceResult<T> => ({ success: false, message }),
};

const SUCCESS_CODE = '2000';
const NOTIFICATION_STORAGE_KEY = 'magic_studio_notifications_v1';
const LEGACY_NOTIFICATION_STORAGE_KEYS = ['open_studio_notifications_v1'] as const;
const MAX_CACHE_SIZE = 50;

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.random() * 16 | 0;
    const value = char === 'x' ? random : (random & 0x3 | 0x8);
    return value.toString(16);
  });
}

function isDevMode(): boolean {
  const env = (import.meta as ImportMeta & { env?: Record<string, unknown> }).env;
  const mode = typeof env?.MODE === 'string' ? env.MODE.toLowerCase() : '';
  return Boolean(env?.DEV) || mode === 'development' || mode === 'dev' || mode === 'test';
}

function normalizeCode(code: unknown): string {
  if (typeof code === 'number' && Number.isFinite(code)) {
    return String(code);
  }
  if (typeof code === 'string') {
    return code.trim();
  }
  return '';
}

function isSuccessCode(code: unknown): boolean {
  const normalized = normalizeCode(code);
  if (!normalized) {
    return true;
  }
  return normalized === SUCCESS_CODE || normalized.startsWith('2');
}

function unwrapApiData<T>(payload: unknown, fallbackMessage: string): T {
  if (payload && typeof payload === 'object') {
    const envelope = payload as ApiEnvelope<T>;
    const code = normalizeCode(envelope.code);
    if (code && !isSuccessCode(code)) {
      throw new Error(
        (typeof envelope.msg === 'string' && envelope.msg.trim())
          || (typeof envelope.message === 'string' && envelope.message.trim())
          || fallbackMessage,
      );
    }
    if ('data' in envelope) {
      return (envelope.data as T) ?? ({} as T);
    }
  }
  return payload as T;
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

function toSdkNotificationType(type: NotificationType): string {
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
  const idValue = source.id ?? source.notificationId ?? source.uuid;
  if (idValue === undefined || idValue === null) {
    return null;
  }

  const now = Date.now();
  const createdAt = toNumber(source.createdAt ?? source.createTime ?? source.createAt, now);
  const updatedAt = toNumber(source.updatedAt ?? source.updateTime ?? source.modifyTime, createdAt);
  const message = typeof source.message === 'string'
    ? source.message
    : typeof source.content === 'string'
      ? source.content
      : '';

  const readStatusRaw = source.isRead ?? source.read;
  const isRead = typeof readStatusRaw === 'boolean'
    ? readStatusRaw
    : String(readStatusRaw || '').toUpperCase() === 'TRUE';

  return {
    id: String(idValue),
    uuid: String(source.uuid ?? idValue),
    title: (typeof source.title === 'string' && source.title.trim()) ? source.title.trim() : 'Notification',
    message: message.trim(),
    type: normalizeNotificationType(source.type),
    isRead,
    createdAt,
    updatedAt,
    actionUrl: typeof source.actionUrl === 'string'
      ? source.actionUrl
      : typeof source.link === 'string'
        ? source.link
        : undefined,
    actionLabel: typeof source.actionLabel === 'string'
      ? source.actionLabel
      : typeof source.actionText === 'string'
        ? source.actionText
        : undefined,
  };
}

function extractNotificationList(data: unknown): AnyRecord[] {
  if (Array.isArray(data)) {
    return data.filter((item): item is AnyRecord => !!item && typeof item === 'object');
  }
  if (!data || typeof data !== 'object') {
    return [];
  }

  const source = data as AnyRecord;
  const keys = ['content', 'list', 'items', 'records', 'rows'];
  for (const key of keys) {
    const value = source[key];
    if (Array.isArray(value)) {
      return value.filter((item): item is AnyRecord => !!item && typeof item === 'object');
    }
  }
  return [];
}

function resolveTotal(data: unknown, fallback: number): number {
  if (!data || typeof data !== 'object') {
    return fallback;
  }
  const source = data as AnyRecord;
  const candidates = [source.total, source.totalElements, source.totalCount, source.count];
  for (const candidate of candidates) {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return candidate;
    }
    if (typeof candidate === 'string' && candidate.trim()) {
      const parsed = Number(candidate);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return fallback;
}

class NotificationService {
  private cache: AppNotification[] | null = null;

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
      const storageKeys = [
        NOTIFICATION_STORAGE_KEY,
        ...LEGACY_NOTIFICATION_STORAGE_KEYS,
      ];

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
      // ignore storage write errors
    }
  }

  private applyRemoteSnapshot(list: AppNotification[]): void {
    this.cache = [...list].sort((left, right) => {
      const leftTime = toNumber(left.createdAt, 0);
      const rightTime = toNumber(right.createdAt, 0);
      return rightTime - leftTime;
    });
  }

  private getFallbackPage(options?: { page?: number; size?: number }): { content: AppNotification[]; total: number } {
    const page = options?.page ?? 0;
    const size = options?.size ?? MAX_CACHE_SIZE;
    const start = Math.max(0, page) * Math.max(1, size);
    const content = (this.cache || []).slice(start, start + size);
    return {
      content,
      total: this.cache?.length ?? 0,
    };
  }

  private async syncSnapshotFromSdk(options?: { page?: number; size?: number }): Promise<{ content: AppNotification[]; total: number }> {
    const page = options?.page ?? 0;
    const size = options?.size ?? MAX_CACHE_SIZE;
    const query = {
      page,
      pageNo: page + 1,
      pageIndex: page,
      size,
      pageSize: size,
    };
    const response = await getSdkworkClient().notification.listNotifications(query);
    const payload = unwrapApiData<unknown>(response, 'Failed to load notifications');
    const list = extractNotificationList(payload)
      .map((item) => normalizeNotification(item))
      .filter((item): item is AppNotification => item !== null);
    this.applyRemoteSnapshot(list);
    await this.persistToStorage();

    return {
      content: list,
      total: resolveTotal(payload, list.length),
    };
  }

  private async saveLocal(notification: Partial<AppNotification> & { id: string }): Promise<AppNotification> {
    await this.ensureInitialized();
    const now = Date.now();
    const existing = this.cache?.find((item) => item.id === notification.id);
    if (existing) {
      Object.assign(existing, notification, { updatedAt: now });
      await this.persistToStorage();
      return existing;
    }

    const created: AppNotification = {
      id: notification.id,
      uuid: notification.uuid || generateUUID(),
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

  async findAll(options?: { page?: number; size?: number }): Promise<ServiceResult<{ content: AppNotification[]; total: number }>> {
    await this.ensureInitialized();
    try {
      const pageData = await this.syncSnapshotFromSdk(options);
      return Result.success(pageData);
    } catch (error) {
      if (!isDevMode()) {
        return Result.error(error instanceof Error ? error.message : 'Failed to load notifications');
      }
      return Result.success(this.getFallbackPage(options));
    }
  }

  async save(notification: Partial<AppNotification> & { id: string }): Promise<ServiceResult<AppNotification>> {
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
      const payload = {
        title,
        content: message,
        message,
        type: toSdkNotificationType(type),
      };
      const response = await getSdkworkClient().notification.sendTest(payload);
      unwrapApiData(response, 'Failed to send notification');

      const latest = await this.findAll({ page: 0, size: MAX_CACHE_SIZE });
      if (latest.success && latest.data?.content.length) {
        return Result.success(latest.data.content[0]);
      }
    } catch (error) {
      if (!isDevMode()) {
        return Result.error(error instanceof Error ? error.message : 'Failed to send notification');
      }
    }

    const now = Date.now();
    const fallback = await this.saveLocal({
      id: generateUUID(),
      uuid: generateUUID(),
      title,
      message,
      type,
      isRead: false,
      createdAt: now,
      updatedAt: now,
      actionUrl: options?.actionUrl,
      actionLabel: options?.actionLabel,
    });
    return Result.success(fallback);
  }

  async markAsRead(id: string): Promise<ServiceResult<void>> {
    await this.ensureInitialized();
    try {
      const response = await getSdkworkClient().notification.markAsRead(id);
      unwrapApiData(response, 'Failed to mark notification as read');
      if (this.cache) {
        this.cache = this.cache.map((item) => (
          item.id === id
            ? { ...item, isRead: true, updatedAt: Date.now() }
            : item
        ));
      }
      await this.persistToStorage();
      return Result.success(undefined);
    } catch (error) {
      if (!isDevMode()) {
        return Result.error(error instanceof Error ? error.message : 'Failed to mark notification as read');
      }

      if (this.cache) {
        this.cache = this.cache.map((item) => (
          item.id === id
            ? { ...item, isRead: true, updatedAt: Date.now() }
            : item
        ));
      }
      await this.persistToStorage();
      return Result.success(undefined);
    }
  }

  async markAllAsRead(): Promise<ServiceResult<void>> {
    await this.ensureInitialized();
    try {
      const response = await getSdkworkClient().notification.markAllAsRead();
      unwrapApiData(response, 'Failed to mark all notifications as read');
    } catch (error) {
      if (!isDevMode()) {
        return Result.error(error instanceof Error ? error.message : 'Failed to mark all notifications as read');
      }
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
      const response = await getSdkworkClient().notification.getUnreadCount();
      const payload = unwrapApiData<unknown>(response, 'Failed to load unread count');
      if (typeof payload === 'number' && Number.isFinite(payload)) {
        return payload;
      }
      if (payload && typeof payload === 'object') {
        const source = payload as AnyRecord;
        const candidates = [source.unreadCount, source.count, source.total];
        for (const candidate of candidates) {
          if (typeof candidate === 'number' && Number.isFinite(candidate)) {
            return candidate;
          }
          if (typeof candidate === 'string' && candidate.trim()) {
            const parsed = Number(candidate);
            if (Number.isFinite(parsed)) {
              return parsed;
            }
          }
        }
      }
    } catch {
      // fallback to local cache
    }

    await this.ensureInitialized();
    return this.cache?.filter((item) => !item.isRead).length || 0;
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

  async deleteAll(ids: string[]): Promise<ServiceResult<void>> {
    await this.ensureInitialized();
    if (!ids.length) {
      return Result.success(undefined);
    }

    try {
      const client = getSdkworkClient();
      await Promise.all(ids.map((id) => client.notification.deleteNotification(id)));
    } catch (error) {
      if (!isDevMode()) {
        return Result.error(error instanceof Error ? error.message : 'Failed to delete notifications');
      }
    }

    if (this.cache) {
      const idSet = new Set(ids.map((id) => String(id)));
      this.cache = this.cache.filter((item) => !idSet.has(item.id));
      await this.persistToStorage();
    }
    return Result.success(undefined);
  }
}

export const notificationService = new NotificationService();
