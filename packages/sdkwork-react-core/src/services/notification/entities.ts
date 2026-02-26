
import { BaseEntity } from '@sdkwork/react-types';

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'system';

export interface AppNotification extends BaseEntity {
    title: string;
    message: string;
    type: NotificationType;
    isRead: boolean;

    // Optional metadata
    actionUrl?: string;
    actionLabel?: string;
}
