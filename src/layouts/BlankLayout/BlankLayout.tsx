
import React, { ReactNode } from 'react';

export interface BlankLayoutProps {
  children: ReactNode;
  leftPane?: React.ComponentType<any>;
}

export const BlankLayout: React.FC<BlankLayoutProps> = ({ children, leftPane: LeftPane }) => {
  return (
    <div className="w-full h-full min-h-screen bg-[#111] text-white relative flex">
      {LeftPane && (
          <div className="w-80 border-r border-white/10 overflow-hidden">
              <LeftPane />
          </div>
      )}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
};
