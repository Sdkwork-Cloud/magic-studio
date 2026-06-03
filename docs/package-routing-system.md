# Package Routing System

## Authority

This document is a routing specialization subordinate to:

- `docs/README.md`
- `docs/magic-studio-unified-host-api-standard.md`
- `docs/framework-standard-architecture.md`

It does not redefine host ownership or runtime capability boundaries.

## Overview

Magic Studio now uses a single canonical route registry. Package routes, layouts, lazy-loading boundaries, and route-level providers are owned by `src/router/registry.tsx`.

The legacy files `src/router/packageRoutes.tsx` and `src/router/packageRouteLoader.tsx` remain only as thin compatibility facades. They do not own real route definitions anymore.

This removes the previous three-way drift problem where the same route graph could diverge across multiple files.

## Canonical Structure

1. `src/router/routes.ts`
Defines stable route path constants.

2. `src/router/registry.tsx`
Owns the public `APP_ROUTES` composition root and remains the single canonical route registry import.

3. `src/router/registry/runtime.tsx`
Private runtime support module for lazy page imports, route-level providers, left-pane components, and suspense boundaries.

4. `src/router/registry/specs.ts`
Pure data route specification module. This is the canonical owner of route paths, layout intent, provider/left-pane attachment, and adjacent preload relationships.

5. `src/router/registry/sections.tsx`
Private route section module that materializes `RouteDefinition[]` from the canonical specs and runtime registries before `registry.tsx` composes them into `APP_ROUTES`.

6. `src/router/packageRoutes.tsx`
Legacy facade that re-exports the canonical registry as `PACKAGE_ROUTES`.

7. `src/router/packageRouteLoader.tsx`
Legacy facade that re-exports canonical registry aliases such as `COMPLETE_ROUTE_REGISTRY`.

## Route Contract

```ts
export type LayoutType =
  | 'main'
  | 'none'
  | 'blank'
  | 'generation'
  | 'vibe'
  | 'magic-cut'
  | 'creation'
  | 'notes';

export interface RouteDefinition {
  path: RoutePath;
  component: React.ComponentType<any>;
  layout?: LayoutType;
  leftPane?: React.ComponentType<any>;
  provider?: React.ComponentType<any>;
}
```

## Standards

- `registry.tsx` is the only public ownership point for the route graph.
- Private support modules under `src/router/registry/` may split lazy runtime details and route sections, but they must compose back through `registry.tsx`.
- Route metadata and route preload relationships must be declared in `src/router/registry/specs.ts`, then consumed by both the canonical registry and preload scheduler.
- Route composition must use focused package subpaths such as `@sdkwork/magic-studio-image/pages` and `@sdkwork/magic-studio-image/store`.
- Route-level providers must stay lazy when they gate heavy feature state.
- Desktop and server delivery share the same frontend route registry. Platform differences belong in runtime/platform boundaries, not in route ownership.
- Compatibility facades must delegate to `registry.tsx` and must not grow business logic.

## Adding Or Changing A Route

1. Add or update the path constant in `src/router/routes.ts`.
2. Add or update the canonical route entry in `src/router/registry.tsx`.
3. Keep imports on focused package subpaths such as `pages`, `store`, `panels`, `i18n`, or other public sub-entries.
4. Run the relevant route boundary tests and the app build.

## Why This Structure

- One source of truth prevents route drift.
- Shared pure-data route specs prevent route path logic and preload policy from diverging.
- Focused public subpaths keep package boundaries explicit.
- Thin legacy facades preserve internal compatibility without duplicating architecture.
- The route layer stays shell-neutral and works equally for standalone server deployment and embedded desktop delivery.
