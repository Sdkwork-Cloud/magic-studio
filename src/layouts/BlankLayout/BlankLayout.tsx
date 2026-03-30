
import React, { ReactNode } from 'react';

export interface BlankLayoutProps {
  children: ReactNode;
  leftPane?: React.ComponentType<any>;
}

export const BlankLayout: React.FC<BlankLayoutProps> = ({ children, leftPane: LeftPane }) => {
  return (
    <div className="w-full h-full min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] relative flex">
      {LeftPane && (
          <div className="w-80 border-r border-[var(--border-color)] overflow-hidden bg-[var(--bg-panel-subtle)]">
              <LeftPane />
          </div>
      )}
      <div className="app-shell-main flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
};
