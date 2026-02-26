import { AppNotification, NotificationType } from '@sdkwork/react-commons';

// Simple UUID generator
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  message?: string;
}

const Result = {
  success: <T>(data: T): ServiceResult<T> => ({ success: true, data }),
  error: <T>(message: string): ServiceResult<T> => ({ success: false, message })
};

const NOTIFICATION_STORAGE_KEY = 'open_studio_notifications_v1';

class NotificationService {
    private cache: AppNotification[] | null = null;

    private async ensureInitialized(): Promise<void> {
        if (this.cache === null) {
            await this.load();
        }
    }

    private async load(): Promise<void> {
        try {
            const data = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
            this.cache = data ? JSON.parse(data) : [];
        } catch {
            this.cache = [];
        }
    }

    private async persist(): Promise<void> {
        if (this.cache !== null) {
            localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(this.cache));
        }
    }

    async findAll(options?: { page?: number; size?: number }): Promise<ServiceResult<{ content: AppNotification[]; total: number }>> {
        await this.ensureInitialized();
        const page = options?.page ?? 0;
        const size = options?.size ?? 50;
        const start = page * size;
        const content = this.cache?.slice(start, start + size) ?? [];
        return Result.success({ content, total: this.cache?.length ?? 0 });
    }

    async save(notification: Partial<AppNotification> & { id: string }): Promise<ServiceResult<AppNotification>> {
        await this.ensureInitialized();

        const now = Date.now();
        const existing = this.cache?.find(n => n.id === notification.id);

        if (existing) {
            Object.assign(existing, notification, { updatedAt: now });
            await this.persist();
            return Result.success(existing);
        } else {
            const newNotification: AppNotification = {
                id: notification.id,
                title: notification.title ?? '',
                message: notification.message ?? '',
                type: notification.type ?? NotificationType.INFO,
                isRead: notification.isRead ?? false,
                createdAt: now,
                updatedAt: now,
                actionUrl: notification.actionUrl,
                actionLabel: notification.actionLabel
            };
            (this.cache as AppNotification[]).push(newNotification);
            await this.persist();
            return Result.success(newNotification);
        }
    }

    async notify(
        title: string,
        message: string,
        type: NotificationType = NotificationType.INFO,
        options?: { actionUrl?: string; actionLabel?: string }
    ): Promise<ServiceResult<AppNotification>> {
        const notification: AppNotification = {
            id: generateUUID(),
            title,
            message,
            type,
            isRead: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            ...options
        };

        return await this.save(notification);
    }

    async markAsRead(id: string): Promise<ServiceResult<void>> {
        await this.ensureInitialized();
        const item = this.cache?.find(n => n.id === id);
        if (item && !item.isRead) {
            await this.save({ id, isRead: true });
        }
        return Result.success(undefined);
    }

    async markAllAsRead(): Promise<ServiceResult<void>> {
        await this.ensureInitialized();
        if (!this.cache) return Result.success(undefined);

        const unread = this.cache.filter(n => !n.isRead);
        for (const n of unread) {
            n.isRead = true;
            n.updatedAt = Date.now();
        }
        await this.persist();
        return Result.success(undefined);
    }

    async getUnreadCount(): Promise<number> {
        await this.ensureInitialized();
        return this.cache?.filter(n => !n.isRead).length || 0;
    }

    async prune(): Promise<void> {
        await this.ensureInitialized();
        if (!this.cache || this.cache.length <= 50) return;

        this.cache.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this.cache = this.cache.slice(0, 50);
        await this.persist();
    }

    async deleteAll(ids: string[]): Promise<ServiceResult<void>> {
        await this.ensureInitialized();
        if (!this.cache) return Result.success(undefined);

        this.cache = this.cache.filter(n => !ids.includes(n.id));
        await this.persist();
        return Result.success(undefined);
    }
}

export const notificationService = new NotificationService();
