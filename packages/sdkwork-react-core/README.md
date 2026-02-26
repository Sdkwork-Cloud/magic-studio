# sdkwork-react-core

> Core functionality for SDKWork React applications

This package provides core functionality including routing, state management, platform abstraction, event bus, and AI services.

## Installation

```bash
pnpm add sdkwork-react-core
```

## Usage

```typescript
import { useRouter, ROUTES, platform, EventBus } from '@sdkwork/react-core';
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
- `platform` - Platform abstraction (web/desktop)
- `isTauri` - Check if running in Tauri
- `webPlatform` - Web platform implementation
- `createDesktopPlatform` - Desktop platform factory

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
