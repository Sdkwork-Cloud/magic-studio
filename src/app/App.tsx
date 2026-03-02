
import { useRouter } from '@sdkwork/react-core'
import React, { Suspense, useEffect, useMemo } from 'react';
import { AppProvider } from './AppProvider';
;
import { bootstrap } from './bootstrap';
import { APP_ROUTES } from '../router/registry';
import { scheduleRoutePreload } from '../router/routePreload';

import { MainLayout } from '../layouts/MainLayout/MainLayout';
import { GenerationLayout } from '../layouts/GenerationLayout/GenerationLayout';
import { CreationLayout } from '../layouts/CreationLayout/CreationLayout';
import { VibeLayout } from '../layouts/VibeLayout/VibeLayout';
import { MagicCutLayout } from '../layouts/MagicCutLayout/MagicCutLayout';
import { NotesLayout } from '../layouts/NotesLayout/NotesLayout';
import { BlankLayout } from '../layouts/BlankLayout/BlankLayout';

const LAYOUT_COMPONENTS: Record<string, React.ComponentType<{ children: React.ReactNode; leftPane?: React.ComponentType<any> }>> = {
    main: MainLayout,
    generation: GenerationLayout,
    creation: CreationLayout,
    vibe: VibeLayout,
    'magic-cut': MagicCutLayout,
    notes: NotesLayout,
    none: BlankLayout,
};

const RouteLoadingFallback: React.FC = () => (
  <div className="w-full h-screen flex items-center justify-center bg-[#050505] text-gray-500 gap-3">
    <div className="w-6 h-6 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
    <span className="text-xs font-medium">Loading Route...</span>
  </div>
);
const HomePage = React.lazy(() => import('../pages/HomePage'));

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
  useEffect(() => {
      return scheduleRoutePreload(currentPath);
  }, [currentPath]);

  const { route, params } = useMemo(() => {
      for (const r of APP_ROUTES) {
          const result = matchRoute(r.path, currentPath);
          if (result.matched) {
              return { route: r, params: result.params };
          }
      }
      return { route: undefined, params: {} };
  }, [currentPath]);

  if (!route) {
      return (
        <Suspense fallback={<RouteLoadingFallback />}>
          <HomePage />
        </Suspense>
      );
  }

  const { component: Component, layout, leftPane: LeftPaneComponent, provider: RouteProvider } = route;

  const LayoutComponent = LAYOUT_COMPONENTS[layout] || BlankLayout;

  const contentWithLayout = (
    <Suspense fallback={<RouteLoadingFallback />}>
      <LayoutComponent key={`${currentPath}-layout`} leftPane={LeftPaneComponent || undefined}>
        <Component key={`${currentPath}-component`} {...params} />
      </LayoutComponent>
    </Suspense>
  );

  if (RouteProvider) {
      return (
          <Suspense fallback={<RouteLoadingFallback />}>
            <RouteProvider key={`${currentPath}-provider`}>
                {contentWithLayout}
            </RouteProvider>
          </Suspense>
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
