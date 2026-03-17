
import React from 'react';
import { formatRelativeTime } from '@sdkwork/react-commons';
import { useNotificationStore } from '../store/notificationStore';
import { Bell, Check, Trash2, Info, AlertTriangle, CheckCircle2, AlertOctagon, ExternalLink } from 'lucide-react';
import { NotificationType } from '../entities';
import type { AppNotification } from '../entities';

const getIcon = (type: NotificationType) => {
    switch (type) {
        case NotificationType.SUCCESS: return <CheckCircle2 size={16} className="text-green-500" />;
        case NotificationType.WARNING: return <AlertTriangle size={16} className="text-yellow-500" />;
        case NotificationType.ERROR: return <AlertOctagon size={16} className="text-red-500" />;
        default: return <Info size={16} className="text-blue-500" />;
    }
};
interface NotificationCenterProps {
    onClose?: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = () => {
    const { notifications, markAsRead, markAllAsRead, clearAll } = useNotificationStore();

    return (
        <div className="absolute top-16 right-8 w-80 bg-[#1e1e20] border border-[#333] rounded-xl shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#333] bg-[#252526]">
                <div className="flex items-center gap-2">
                    <Bell size={14} className="text-gray-400" />
                    <span className="text-xs font-bold text-gray-200 uppercase tracking-wider">Notifications</span>
                </div>
                <div className="flex items-center gap-2">
                    {notifications.length > 0 && (
                        <button
                            onClick={() => markAllAsRead()}
                            className="p-1.5 text-gray-500 hover:text-white hover:bg-[#333] rounded transition-colors"
                            title="Mark all as read"
                        >
                            <Check size={14} />
                        </button>
                    )}
                    {notifications.length > 0 && (
                        <button
                            onClick={() => clearAll()}
                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-[#333] rounded transition-colors"
                            title="Clear all"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* List */}
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <Bell size={24} className="opacity-20 mb-2" />
                        <p className="text-xs">No notifications</p>
                    </div>
                ) : (
                    <div className="divide-y divide-[#2a2a2d]">
                        {notifications.map((item: AppNotification) => (
                            <div
                                key={item.id}
                                onClick={() => markAsRead(item.id)}
                                className={`
                                    p-4 hover:bg-[#252528] transition-colors cursor-pointer relative group
                                    ${!item.isRead ? 'bg-[#2a2a2d]/50' : ''}
                                `}
                            >
                                {!item.isRead && (
                                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-500" />
                                )}

                                <div className="flex gap-3">
                                    <div className="mt-0.5 shrink-0">{getIcon(item.type)}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className={`text-sm font-medium ${item.isRead ? 'text-gray-400' : 'text-gray-200'}`}>
                                                {item.title}
                                            </h4>
                                            <span className="text-[10px] text-gray-600 whitespace-nowrap ml-2">
                                                {formatRelativeTime(item.createdAt)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                                            {item.message}
                                        </p>

                                        {item.actionUrl && (
                                            <a
                                                href={item.actionUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="mt-2 inline-flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 hover:underline"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {item.actionLabel || 'View Details'} <ExternalLink size={10} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
