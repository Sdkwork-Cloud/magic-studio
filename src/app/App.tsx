
import { useRouter } from '@sdkwork/react-core'
import React, { useEffect, Suspense, useMemo } from 'react';
import { AppProvider } from './AppProvider';
;
import { bootstrap } from './bootstrap';
import { APP_ROUTES } from '../router/registry';
import HomePage from '../pages/HomePage';
import { Loader2 } from 'lucide-react';

import { MainLayout } from '../layouts/MainLayout/MainLayout';
import { GenerationLayout } from '../layouts/GenerationLayout/GenerationLayout';
import { CreationLayout } from '../layouts/CreationLayout/CreationLayout';
import { VibeLayout } from '../layouts/VibeLayout/VibeLayout';
import { MagicCutLayout } from '../layouts/MagicCutLayout/MagicCutLayout';
import { NotesLayout } from '../layouts/NotesLayout/NotesLayout';
import { BlankLayout } from '../layouts/BlankLayout/BlankLayout';

const LoadingFallback = () => (
    <div className="w-full h-full flex items-center justify-center bg-[#050505] text-gray-500 gap-3">
        <Loader2 size={24} className="animate-spin text-blue-500" />
        <span className="text-xs font-medium">Loading Module...</span>
    </div>
);

const LAYOUT_COMPONENTS: Record<string, React.ComponentType<{ children: React.ReactNode; leftPane?: React.ComponentType<any> }>> = {
    main: MainLayout,
    generation: GenerationLayout,
    creation: CreationLayout,
    vibe: VibeLayout,
    'magic-cut': MagicCutLayout,
    notes: NotesLayout,
    none: BlankLayout,
};

const matchRoute = (routePath: string, currentPath: string): { matched: boolean; params: Record<string, string> } => {
    const routeParts = routePath.split('/');
    const pathParts = currentPath.split('/');

    if (routeParts.length !== pathParts.length) {
        return { matched: false, params: {} };
    }

    const params: Record<string, string> = {};

    for (let i = 0; i < routeParts.length; i++) {
        const routePart = routeParts[i];
        const pathPart = pathParts[i];

        if (routePart.startsWith(':')) {
            const paramName = routePart.slice(1);
            params[paramName] = pathPart;
        } else if (routePart !== pathPart) {
            return { matched: false, params: {} };
        }
    }

    return { matched: true, params };
};

const AppContent: React.FC = () => {
  const { currentPath } = useRouter();

  React.useEffect(() => {
      console.log('[AppContent] currentPath changed:', currentPath);
  }, [currentPath]);

  const { route, params } = useMemo(() => {
      for (const r of APP_ROUTES) {
          const result = matchRoute(r.path, currentPath);
          if (result.matched) {
              console.log('[AppContent] route found for', currentPath, ':', r.component?.name || 'not found', 'params:', result.params);
              return { route: r, params: result.params };
          }
      }
      console.warn('[AppContent] No route found for path:', currentPath);
      return { route: undefined, params: {} };
  }, [currentPath]);

  if (!route) {
      return <HomePage />;
  }

  const { component: Component, layout, leftPane: LeftPaneComponent, provider: RouteProvider } = route;

  console.log('[AppContent] Rendering route:', currentPath, 'with layout:', layout, 'component:', Component?.name);

  const LayoutComponent = LAYOUT_COMPONENTS[layout] || BlankLayout;

  const contentWithComponent = (
      <Component key={`${currentPath}-component`} {...params} />
  );

  const contentWithLayout = (
      <LayoutComponent key={`${currentPath}-layout`} leftPane={LeftPaneComponent || undefined}>
          {contentWithComponent}
      </LayoutComponent>
  );

  if (RouteProvider) {
      return (
          <RouteProvider key={`${currentPath}-provider`}>
              {contentWithLayout}
          </RouteProvider>
      );
  }

  return contentWithLayout;
};

const App: React.FC = () => {
  useEffect(() => {
    bootstrap();
  }, []);

  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
