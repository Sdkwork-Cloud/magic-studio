
import React, { ReactNode } from 'react';
import MainLayout from '../../layouts/MainLayout/MainLayout';
import { GenerationLayout } from '../../layouts/GenerationLayout/GenerationLayout';
import { VibeLayout } from '../../layouts/VibeLayout/VibeLayout';
import { BlankLayout } from '../../layouts/BlankLayout/BlankLayout';
import { MagicCutLayout } from '../../layouts/MagicCutLayout/MagicCutLayout';
import { CreationLayout } from '../../layouts/CreationLayout/CreationLayout';
import { NotesLayout } from '../../layouts/NotesLayout/NotesLayout';
import { LayoutType } from '../../router/registry';

interface PageContainerProps {
  children: ReactNode;
  layout: LayoutType;
  leftPane?: React.ComponentType<any>;
}

const LAYOUT_MAP: Record<LayoutType, React.ComponentType<any>> = {
  main: MainLayout,
  generation: GenerationLayout,
  vibe: VibeLayout,
  'magic-cut': MagicCutLayout,
  creation: CreationLayout,
  notes: NotesLayout,
  none: BlankLayout,
};

export const PageContainer: React.FC<PageContainerProps> = ({ 
  children, 
  layout, 
  leftPane: LeftPaneComponent 
}) => {
  const LayoutComponent = LAYOUT_MAP[layout] || BlankLayout;

  // Render the left pane component if provided.
  const leftPaneNode = LeftPaneComponent ? <LeftPaneComponent /> : undefined;

  return (
    <LayoutComponent leftPane={leftPaneNode}>
      <div className="w-full h-full animate-in fade-in duration-300">
        {children}
      </div>
    </LayoutComponent>
  );
};
