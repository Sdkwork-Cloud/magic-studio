
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

  // Show a loading screen instead of null to maintain RouterProvider context
  if (!themeInitialized) {
    return (
      <RouterProvider onRouteChange={() => {}}>
        <NotificationStoreProvider>
          <AuthStoreProvider>
            <VipStoreProvider>
              <SettingsStoreProvider>
                <WorkspaceStoreProvider>
                  <ChatStoreProvider>
                    <EditorStoreProvider>
                      <div className="w-full h-screen flex items-center justify-center bg-[#050505] text-gray-500 gap-3">
                        <div className="w-6 h-6 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
                        <span className="text-xs font-medium">Initializing...</span>
                      </div>
                    </EditorStoreProvider>
                  </ChatStoreProvider>
                </WorkspaceStoreProvider>
              </SettingsStoreProvider>
            </VipStoreProvider>
          </AuthStoreProvider>
        </NotificationStoreProvider>
      </RouterProvider>
    );
  }

  return (
    <RouterProvider onRouteChange={() => {}}>
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
