import { RouterProvider } from '@sdkwork/react-core'
import React, { ReactNode, useEffect } from 'react';
import { SettingsStoreProvider } from '@sdkwork/react-settings';
import { AuthStoreProvider, useAuthStore } from '@sdkwork/react-auth';
import { VipStoreProvider } from '@sdkwork/react-vip';
import { WorkspaceStoreProvider } from '@sdkwork/react-workspace';
import { ChatStoreProvider } from '@sdkwork/react-chat';
import { themeManager } from './theme/ThemeManager';
import { NotificationStoreProvider } from '@sdkwork/react-notifications';

interface AppProviderProps {
  children: ReactNode;
}

const AuthenticatedProviders: React.FC<AppProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  return (
    <VipStoreProvider>
      <SettingsStoreProvider>
        <WorkspaceStoreProvider enabled={isAuthenticated}>
          <ChatStoreProvider>
            {children}
          </ChatStoreProvider>
        </WorkspaceStoreProvider>
      </SettingsStoreProvider>
    </VipStoreProvider>
  );
};

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
          <AuthenticatedProviders>
            {children}
          </AuthenticatedProviders>
        </AuthStoreProvider>
      </NotificationStoreProvider>
    </RouterProvider>
  );
};
