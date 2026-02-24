
import React, { ReactNode } from 'react';
import MainSidebar from './MainSidebar';
import MainGlobalHeader from './MainGlobalHeader';

export interface MainLayoutProps {
  children: ReactNode;
  leftPane?: React.ComponentType<any>;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children, leftPane: LeftPane }) => {
  return (
    // 'layout-container' class is targeted by index.css to flip direction if data-sidebar-position="right"
    <div className="layout-container flex w-full h-screen bg-white dark:bg-[#020202] overflow-hidden select-none transition-colors duration-200">

      {/* Sidebar - Fixed Class for CSS targeting */}
      <div className="sidebar-panel flex-none z-50">
          <MainSidebar />
      </div>

      {/* Left Pane */}
      {LeftPane && (
          <div className="flex-none border-r border-[#1a1a1a] bg-[#050505] flex flex-col h-full overflow-hidden z-10 relative">
              <LeftPane />
          </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative z-0">
          <MainGlobalHeader />
          <div className="flex-1 overflow-hidden">
              {children}
          </div>
      </div>
    </div>
  );
};

export default MainLayout;
