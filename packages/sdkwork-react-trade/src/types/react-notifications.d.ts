declare module '@sdkwork/react-notifications' {
  import type { ComponentType } from 'react';

  export interface TradeNotificationStore {
    unreadCount: number;
  }

  export function useNotificationStore(): TradeNotificationStore;
  export const NotificationCenter: ComponentType<{ onClose?: () => void }>;
}
