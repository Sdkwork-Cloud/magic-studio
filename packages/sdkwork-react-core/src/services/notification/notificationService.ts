
import { LocalStorageService } from '../base/LocalStorageService';
import { AppNotification, NotificationType } from './entities';
import { generateUUID } from '@sdkwork/react-commons';
import { ServiceResult, Result } from '@sdkwork/react-commons';

const NOTIFICATION_STORAGE_KEY = 'magic_studio_notifications_v1';
const LEGACY_NOTIFICATION_STORAGE_KEYS = ['open_studio_notifications_v1'] as const;

class NotificationService extends LocalStorageService<AppNotification> {
    constructor() {
        super(NOTIFICATION_STORAGE_KEY, LEGACY_NOTIFICATION_STORAGE_KEYS);
    }

    /**
     * Create and persist a new notification
     */
    async notify(
        title: string,
        message: string,
        type: NotificationType = 'info',
        options?: { actionUrl?: string; actionLabel?: string }
    ): Promise<ServiceResult<AppNotification>> {
        const now = new Date().toISOString();
        const notification: AppNotification = {
            id: generateUUID(),
            uuid: generateUUID(),
            createdAt: now,
            updatedAt: now,
            title,
            message,
            type,
            isRead: false,
            ...options
        };

        return await this.save(notification);
    }

    /**
     * Mark specific notification as read
     */
    async markAsRead(id: string): Promise<ServiceResult<void>> {
        await this.ensureInitialized();
        const item = this.cache?.find(n => n.id === id);
        if (item && !item.isRead) {
            await this.save({ id, isRead: true, updatedAt: new Date().toISOString() });
        }
        return Result.success(undefined);
    }

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(): Promise<ServiceResult<void>> {
        await this.ensureInitialized();
        if (!this.cache) return Result.success(undefined);

        const now = new Date().toISOString();
        const unread = this.cache.filter(n => !n.isRead);
        for (const n of unread) {
            n.isRead = true;
            n.updatedAt = now;
        }
        await this.persist();
        return Result.success(undefined);
    }

    /**
     * Get unread count
     */
    async getUnreadCount(): Promise<number> {
        await this.ensureInitialized();
        return this.cache?.filter(n => !n.isRead).length || 0;
    }

    /**
     * Prune old notifications (keep last 50)
     */
    async prune(): Promise<void> {
        await this.ensureInitialized();
        if (!this.cache || this.cache.length <= 50) return;

        this.cache.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this.cache = this.cache.slice(0, 50);
        await this.persist();
    }
}

export const notificationService = new NotificationService();
