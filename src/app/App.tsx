import { ROUTES, useRouter } from '@sdkwork/react-core'
import { useAuthStore } from '@sdkwork/react-auth';
import { useTranslation } from '@sdkwork/react-i18n';
import React, { Suspense, lazy, useEffect, useMemo } from 'react';
import { AppProvider } from './AppProvider';
import { bootstrap } from './bootstrap';
import { APP_ROUTES } from '../router/registry';
import { scheduleRoutePreload } from '../router/routePreload';
import { dismissBootSplashAfterPaint } from './bootSplash';
import { buildLoginRedirectQuery, resolveAuthRouteAccess } from './authRouteGuard';

const DEFAULT_LAYOUT = 'blank';

type LayoutComponentProps = {
  children: React.ReactNode;
  leftPane?: React.ComponentType<any>;
};

type LayoutComponentType =
  | React.ComponentType<LayoutComponentProps>
  | React.LazyExoticComponent<React.ComponentType<LayoutComponentProps>>;

const MainLayout = lazy(() =>
  import('../layouts/MainLayout/MainLayout').then((module) => ({ default: module.MainLayout })),
);
const GenerationLayout = lazy(() =>
  import('../layouts/GenerationLayout/GenerationLayout').then((module) => ({ default: module.GenerationLayout })),
);
const CreationLayout = lazy(() =>
  import('../layouts/CreationLayout/CreationLayout').then((module) => ({ default: module.CreationLayout })),
);
const VibeLayout = lazy(() =>
  import('../layouts/VibeLayout/VibeLayout').then((module) => ({ default: module.VibeLayout })),
);
const MagicCutLayout = lazy(() =>
  import('../layouts/MagicCutLayout/MagicCutLayout').then((module) => ({ default: module.MagicCutLayout })),
);
const NotesLayout = lazy(() =>
  import('../layouts/NotesLayout/NotesLayout').then((module) => ({ default: module.NotesLayout })),
);
const BlankLayout = lazy(() =>
  import('../layouts/BlankLayout/BlankLayout').then((module) => ({ default: module.BlankLayout })),
);

const LAYOUT_COMPONENTS: Record<string, LayoutComponentType> = {
    main: MainLayout,
    generation: GenerationLayout,
    creation: CreationLayout,
    vibe: VibeLayout,
    'magic-cut': MagicCutLayout,
    notes: NotesLayout,
    blank: BlankLayout,
    none: BlankLayout,
};

const FALLBACK_ROUTE = APP_ROUTES.find((candidate) => candidate.path === '/') ?? APP_ROUTES[0];

const RouteLoadingFallback: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="w-full h-screen flex items-center justify-center bg-[var(--bg-app)] text-[var(--text-muted)] gap-3">
      <div className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      <span className="text-xs font-medium">{t('appShell.loading_route')}</span>
    </div>
  );
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
  const { currentPath, currentQuery, navigate } = useRouter();
  const { isAuthenticated, isAuthResolved } = useAuthStore();
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

  const resolvedRoute = route ?? FALLBACK_ROUTE;
  const accessDecision = resolveAuthRouteAccess({
    requiresAuth: resolvedRoute.requiresAuth,
    isAuthenticated,
    isAuthResolved,
  });
  const { component: Component, layout, leftPane: LeftPaneComponent, provider: RouteProvider } = resolvedRoute;

  const layoutKey = layout ?? DEFAULT_LAYOUT;
  const LayoutComponent = (LAYOUT_COMPONENTS[layoutKey] || LAYOUT_COMPONENTS[DEFAULT_LAYOUT]) as React.ComponentType<LayoutComponentProps>;

  useEffect(() => {
    if (accessDecision !== 'redirect') {
      return;
    }

    navigate(ROUTES.LOGIN, buildLoginRedirectQuery(currentPath, currentQuery));
  }, [accessDecision, currentPath, currentQuery, navigate]);

  if (accessDecision === 'pending' || accessDecision === 'redirect') {
    return <RouteLoadingFallback />;
  }

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
    dismissBootSplashAfterPaint();
    void bootstrap();
  }, []);

  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
