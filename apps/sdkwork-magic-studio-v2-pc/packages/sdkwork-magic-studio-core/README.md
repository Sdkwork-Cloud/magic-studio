# @sdkwork/magic-studio-core

> Core functionality for Magic Studio applications

This package provides core functionality including routing, state management, platform abstraction, event bus, and AI services.

## Installation

```bash
pnpm add @sdkwork/magic-studio-core
```

## Usage

```typescript
import { ROUTES, useRouter } from '@sdkwork/magic-studio-core/router';
import { getPlatformRuntime } from '@sdkwork/magic-studio-core/platform';
import { EventBus } from '@sdkwork/magic-studio-core/eventBus';
```

## Exports

### Router
- `RouterProvider` - Router context provider
- `useRouter` - Get router context
- `useNavigate` - Navigation hook
- `useCurrentPath` - Current path hook
- `useRouteParams` - Route params hook
- `ROUTES` - Route constants

### State Management
- `createStore` - Create Zustand store
- Store utilities

### Platform
- `platform` - Platform abstraction (web/desktop/server)
- Platform and runtime selection are lazy, so the core entrypoint is safe to import in node-like build, test, and server tooling runtimes
- `isBrowserHostedRuntimeKind` - Treat `web` and `server` as the shared browser-hosted runtime family
- `isDesktopShellRuntime` - Check if running in the desktop shell runtime
- `webPlatform` - Web platform implementation
- `serverPlatform` - Browser-hosted standalone server implementation
- `createDesktopPlatform` - Desktop platform factory

### Storage
- `resolveRuntimeMagicStudioRootLayout` - Resolve the canonical MagicStudio storage tree from the active runtime
- `resolveRuntimeMagicStudioUserLayout` - Resolve the canonical per-user MagicStudio storage tree from the active runtime
- `resolveRuntimeMagicStudioDefaultUserLayout` - Resolve the canonical default local-user storage tree for runtime-local features
- `DEFAULT_LOCAL_MAGIC_STUDIO_USER_ID` - Canonical fallback user scope for runtime-local MagicStudio data

### Services
- `LocalStorageService` - Local storage wrapper
- `genAIService` - Google Generative AI service
- `uploadHelper` - File upload helper
- `downloadService` - Download service
- `mediaAnalysisService` - Media analysis service
- `modelInfoService` - Model information service

### Event Bus
- `EventBus` - Event emitter/listener
- `useEventSubscription` - Event subscription hook

## License

MIT

## SDKWork Documentation Contract

Domain: platform
Capability: component
Package type: react-tauri-package
Status: standardizing

### Public API

Public exports are declared in `specs/component.spec.json` under `contracts.publicExports`.

### Required SDK Surface

- None declared in `specs/component.spec.json`.

### Configuration

Configuration keys and runtime entrypoints are declared in `specs/component.spec.json`.

### SaaS/Private/Local Behavior

This module follows the canonical standards linked from `specs/component.spec.json`, including deployment and runtime configuration rules where applicable.

### Security

Do not add secrets, live tokens, manual auth headers, or app-local credential handling to this module.

### Extension Points

Extension points are limited to declared public exports, runtime entrypoints, SDK clients, events, and config keys.

### Verification

- `pnpm --filter @sdkwork/magic-studio-core typecheck`

### Owner And Status

Owner and lifecycle status are tracked in `specs/component.spec.json`.
