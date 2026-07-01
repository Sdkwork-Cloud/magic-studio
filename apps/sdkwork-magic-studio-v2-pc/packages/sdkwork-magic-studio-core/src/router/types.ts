export interface RouteConfig {
    path: string;
    name: string;
    component?: React.ComponentType<any>;
    layout?: string;
    children?: RouteConfig[];
    meta?: Record<string, any>;
}

export type RoutePath = string;

export interface RouterState {
    currentPath: RoutePath;
    currentQuery: string;
    previousPath?: RoutePath;
}

export interface RouterContextValue {
    currentPath: RoutePath;
    currentQuery: string;
    navigate: (path: RoutePath, query?: string) => void;
    goBack: () => void;
    getRouteParams: <T extends Record<string, string>>() => T;
}
