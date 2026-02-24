
import React, { ReactNode } from 'react';

// Define LayoutType
type LayoutType = 'main' | 'none' | 'generation' | 'vibe' | 'magic-cut' | 'creation' | 'notes';

interface PageContainerProps {
  children: ReactNode;
  layout: LayoutType;
  leftPane?: React.ComponentType<any>;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  layout,
  leftPane: LeftPane
}) => {
  // Debug: Log layout changes
  console.log('[PageContainer] rendering with layout:', layout, 'leftPane:', !!LeftPane);

  // Render leftPane if provided, otherwise just render children
  // The layout prop is kept for future use but currently all layouts render the same way
  const content = LeftPane ? (
      <div key={`${layout}-container`} className="h-full w-full flex">
          <div className="w-80 border-r border-white/10 overflow-hidden">
              <LeftPane />
          </div>
          <div className="flex-1 overflow-hidden">{children}</div>
      </div>
  ) : (
      <div key={`${layout}-container`} className="h-full w-full overflow-hidden">
          {children}
      </div>
  );

  return content;
};
