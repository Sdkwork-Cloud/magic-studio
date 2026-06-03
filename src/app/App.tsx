
import { useRouter } from '@sdkwork/magic-studio-core/router'
import { useTranslation } from '@sdkwork/magic-studio-i18n';
import React, { Suspense, lazy, useEffect } from 'react';
import { AppProvider } from './AppProvider';
import { bootstrap } from './bootstrap';
import { APP_ROUTES } from '../router/registry';
import { scheduleRoutePreload } from '../router/routePreload';
import { matchRoutePath } from '../router/routeMatching';
import { BlankLayout } from '../layouts/BlankLayout/BlankLayout';

const DEFAULT_LAYOUT = 'blank';
type AppLayoutProps = {
  children: React.ReactNode;
  leftPane?: React.ComponentType<any>;
};

const NoneLayout: React.FC<AppLayoutProps> = ({
  children,
}) => <>{children}</>;
const MainLayout = lazy(() => import('../layouts/MainLayout/MainLayout').then((module) => ({
  default: module.MainLayout,
}))) as unknown as React.ComponentType<AppLayoutProps>;
const GenerationLayout = lazy(() => import('../layouts/GenerationLayout/GenerationLayout').then((module) => ({
  default: module.GenerationLayout,
}))) as unknown as React.ComponentType<AppLayoutProps>;
const CreationLayout = lazy(() => import('../layouts/CreationLayout/CreationLayout').then((module) => ({
  default: module.CreationLayout,
}))) as unknown as React.ComponentType<AppLayoutProps>;
const VibeLayout = lazy(() => import('../layouts/VibeLayout/VibeLayout').then((module) => ({
  default: module.VibeLayout,
}))) as unknown as React.ComponentType<AppLayoutProps>;
const NotesLayout = lazy(() => import('../layouts/NotesLayout/NotesLayout').then((module) => ({
  default: module.NotesLayout,
}))) as unknown as React.ComponentType<AppLayoutProps>;
const MagicCutLayout = lazy(() => import('../layouts/MagicCutLayout/MagicCutLayout').then((module) => ({
  default: module.MagicCutLayout,
}))) as unknown as React.ComponentType<AppLayoutProps>;

const LAYOUT_COMPONENTS: Record<string, React.ComponentType<AppLayoutProps>> = {
    main: MainLayout,
    generation: GenerationLayout,
    creation: CreationLayout,
    vibe: VibeLayout,
    'magic-cut': MagicCutLayout,
    notes: NotesLayout,
    blank: BlankLayout,
    none: NoneLayout,
};

const RouteLoadingFallback: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="w-full h-screen flex items-center justify-center bg-[#050505] text-gray-500 gap-3">
      <div className="w-6 h-6 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
      <span className="text-xs font-medium">{t('appShell.loading_route')}</span>
    </div>
  );
};
const HomePage = React.lazy(() => import('../pages/HomePage'));

const resolveAppRoute = (currentPath: string) => {
    for (const route of APP_ROUTES) {
        const result = matchRoutePath(route.path, currentPath);
        if (result.matched) {
            return { route, params: result.params };
        }
    }

    return { route: undefined, params: {} as Record<string, string> };
};

const AppContent: React.FC = () => {
  const { currentPath } = useRouter();
  useEffect(() => {
      return scheduleRoutePreload(currentPath);
  }, [currentPath]);

  const { route, params } = resolveAppRoute(currentPath);

  if (!route) {
      return (
        <Suspense fallback={<RouteLoadingFallback />}>
          <BlankLayout>
            <HomePage />
          </BlankLayout>
        </Suspense>
      );
  }

  const { component: Component, layout, leftPane: LeftPaneComponent, provider: RouteProvider } = route;

  const layoutKey = layout ?? DEFAULT_LAYOUT;
  const LayoutComponent = LAYOUT_COMPONENTS[layoutKey] || LAYOUT_COMPONENTS[DEFAULT_LAYOUT];

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
