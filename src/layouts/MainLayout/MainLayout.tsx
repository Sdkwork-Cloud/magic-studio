
import React, { ReactNode } from 'react';
import MainSidebar from './MainSidebar';
import MainGlobalHeader from './MainGlobalHeader';

export interface MainLayoutProps {
  children: ReactNode;
  leftPane?: React.ComponentType<any>;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children, leftPane: LeftPane }) => {
  return (
    <div className="app-shell layout-container select-none">
      <div className="app-shell-content">
        <div className="sidebar-panel flex-none z-20">
          <MainSidebar />
        </div>

        {LeftPane && (
          <div className="flex-none min-h-0 overflow-hidden border-r border-[var(--border-color)] bg-[var(--bg-panel-subtle)] relative z-10">
            <LeftPane />
          </div>
        )}

        <div className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">
          <MainGlobalHeader />
          <div className="app-shell-main">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
