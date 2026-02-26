
import { RouterProvider } from '@sdkwork/react-core'
import React, { ReactNode, useEffect, useState } from 'react';
import { SettingsStoreProvider } from '@sdkwork/react-settings';
import { AuthStoreProvider } from '@sdkwork/react-auth';
import { VipStoreProvider } from '@sdkwork/react-vip';
import { EditorStoreProvider } from '@sdkwork/react-editor';
import { WorkspaceStoreProvider } from '@sdkwork/react-workspace';
import { ChatStoreProvider } from '@sdkwork/react-chat';
;
import { themeManager } from './theme/ThemeManager';
import { NotificationStoreProvider } from '@sdkwork/react-notifications';

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [themeInitialized, setThemeInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      await themeManager.initialize();
      setThemeInitialized(true);
    };
    init();
  }, []);

  if (!themeInitialized) {
    return null; 
  }

  return (
    <RouterProvider>
      <NotificationStoreProvider>
        <AuthStoreProvider>
            <VipStoreProvider>
            <SettingsStoreProvider>
                <WorkspaceStoreProvider>
                <ChatStoreProvider>
                    <EditorStoreProvider>
                        {children}
                    </EditorStoreProvider>
                </ChatStoreProvider>
                </WorkspaceStoreProvider>
            </SettingsStoreProvider>
            </VipStoreProvider>
        </AuthStoreProvider>
      </NotificationStoreProvider>
    </RouterProvider>
  );
};
