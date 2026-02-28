import { AppNotification, NotificationType } from '../entities';
import { notificationService } from '../services/notificationService';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';


interface NotificationStoreContextType {
    notifications: AppNotification[];
    unreadCount: number;
    isLoading: boolean;

    notify: (title: string, message: string, type?: NotificationType, options?: { actionUrl?: string; actionLabel?: string }) => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    clearAll: () => Promise<void>;
    refresh: () => Promise<void>;
}

const NotificationStoreContext = createContext<NotificationStoreContextType | undefined>(undefined);

export const NotificationStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const refresh = useCallback(async () => {
        const res = await notificationService.findAll({ page: 0, size: 50 });
        if (res.success && res.data) {
            setNotifications(res.data.content);
            setUnreadCount(res.data.content.filter(n => !n.isRead).length);
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            setIsLoading(true);
            await notificationService.prune();
            await refresh();
            setIsLoading(false);
        };
        init();
    }, [refresh]);

    const notify = useCallback(async (title: string, message: string, type: NotificationType = NotificationType.INFO, options?: { actionUrl?: string; actionLabel?: string }) => {
        const res = await notificationService.notify(title, message, type, options);
        if (res.success && res.data) {
            setNotifications(prev => [res.data!, ...prev]);
            setUnreadCount(prev => prev + 1);
        }
    }, []);

    const markAsRead = useCallback(async (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
        await notificationService.markAsRead(id);
    }, []);

    const markAllAsRead = useCallback(async () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        await notificationService.markAllAsRead();
    }, []);

    const clearAll = useCallback(async () => {
        setNotifications([]);
        setUnreadCount(0);
        await notificationService.deleteAll(notifications.map(n => n.id));
    }, [notifications]);

    return (
        <NotificationStoreContext.Provider value={{
            notifications, unreadCount, isLoading,
            notify, markAsRead, markAllAsRead, clearAll, refresh
        }}>
            {children}
        </NotificationStoreContext.Provider>
    );
};

export const useNotificationStore = () => {
    const context = useContext(NotificationStoreContext);
    if (!context) throw new Error('useNotificationStore must be used within a NotificationStoreProvider');
    return context;
};
