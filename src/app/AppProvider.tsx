import { RouterProvider } from '@sdkwork/magic-studio-core/router'
import React, { ReactNode, useEffect } from 'react';
import { SettingsStoreProvider } from '@sdkwork/magic-studio-settings/store';
import { AuthStoreProvider, useAuthStore } from '@sdkwork/magic-studio-auth/store';
import { VipStoreProvider } from '@sdkwork/magic-studio-vip/store';
import { WorkspaceStoreProvider } from '@sdkwork/magic-studio-workspace/store';
import { ChatStoreProvider } from '@sdkwork/magic-studio-chat/store';
import { themeManager } from './theme/ThemeManager';
import { NotificationStoreProvider } from '@sdkwork/magic-studio-notifications/store';

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
