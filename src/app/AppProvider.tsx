
import { RouterProvider } from '@sdkwork/react-core'
import React, { ReactNode, useEffect } from 'react';
import { SettingsStoreProvider } from '@sdkwork/react-settings';
import { AuthStoreProvider } from '@sdkwork/react-auth';
import { VipStoreProvider } from '@sdkwork/react-vip';
import { WorkspaceStoreProvider } from '@sdkwork/react-workspace';
import { ChatStoreProvider } from '@sdkwork/react-chat';
;
import { themeManager } from './theme/ThemeManager';
import { NotificationStoreProvider } from '@sdkwork/react-notifications';

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  useEffect(() => {
    void themeManager.initialize().catch((error) => {
      console.warn('[AppProvider] Theme initialization failed:', error);
    });
  }, []);

  return (
    <RouterProvider onRouteChange={() => {}}>
      <NotificationStoreProvider>
        <AuthStoreProvider>
            <VipStoreProvider>
            <SettingsStoreProvider>
                <WorkspaceStoreProvider>
                <ChatStoreProvider>
                    {children}
                </ChatStoreProvider>
                </WorkspaceStoreProvider>
            </SettingsStoreProvider>
            </VipStoreProvider>
        </AuthStoreProvider>
      </NotificationStoreProvider>
    </RouterProvider>
  );
};
