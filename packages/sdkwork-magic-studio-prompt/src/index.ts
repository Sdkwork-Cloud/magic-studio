export { default as PromptOptimizerPage } from './pages/PromptOptimizerPage';

export { 
    PromptOptimizerStoreProvider, 
    usePromptOptimizerStore,
    usePromptOptimizerStoreContext 
} from './store/index.tsx';
export type { PromptOptimizerStore } from './store/promptOptimizerStore';

export type {
    PromptType,
    OptimizationMode,
    PromptOptimizationConfig,
    PromptOptimizationResult,
    PromptTemplate,
    PromptTemplateVariable,
    PromptOptimizerState,
    ChatContext,
    ChatMessage,
    ChatAttachment,
} from './types';

export * from './constants';

export { 
    defaultRoutes, 
    createRoutes, 
    getRoutes 
} from './router/routes.tsx';
export type { 
    PackageRouteConfig, 
    RouteGuard, 
    RouteMeta 
} from './router/types';

export { 
    defaultI18nConfig, 
    createI18nConfig, 
    getResources, 
    getNamespace,
    getI18nKey
} from './i18n';
export type { 
    PackageI18nConfig, 
    I18nNamespaceResource, 
    SupportedLocale 
} from './i18n';
export * from './services';
