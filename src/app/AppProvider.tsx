import { RouterProvider } from '@sdkwork/react-core'
import React, { ReactNode, useEffect } from 'react';
import { SettingsStoreProvider } from '@sdkwork/react-settings';
import { AuthStoreProvider, useAuthStore } from '@sdkwork/react-auth';
import { VipStoreProvider } from '@sdkwork/react-vip';
import { WorkspaceStoreProvider } from '@sdkwork/react-workspace';
import { useSettingsStore } from '@sdkwork/react-settings';
import { themeManager } from './theme/ThemeManager';

interface AppProviderProps {
  children: ReactNode;
}

const ThemeSettingsBridge: React.FC = () => {
  const { settings } = useSettingsStore();

  useEffect(() => {
    themeManager.sync(settings.appearance as any, {
      editor: settings.editor,
      terminal: settings.terminal,
    });
  }, [settings]);

  return null;
};

const AuthenticatedProviders: React.FC<AppProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  return (
    <VipStoreProvider>
      <SettingsStoreProvider>
        <ThemeSettingsBridge />
        <WorkspaceStoreProvider enabled={isAuthenticated}>
          {children}
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
      <AuthStoreProvider>
        <AuthenticatedProviders>
          {children}
        </AuthenticatedProviders>
      </AuthStoreProvider>
    </RouterProvider>
  );
};
