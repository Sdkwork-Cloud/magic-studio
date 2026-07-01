# @sdkwork/magic-studio-commons

> Common UI components and utilities for Magic Studio applications

This package provides shared UI components, utilities, constants, and types used across all Magic Studio packages.

## Installation

```bash
pnpm add @sdkwork/magic-studio-commons
```

## Usage

```typescript
import { Button, Card, generateUUID, MediaResourceType } from '@sdkwork/magic-studio-commons';
```

## Exports

### Components
- `AspectRatioSelector` - Aspect ratio selection component
- `Button` - Button component with variants
- `Card` - Card container component
- `Confirm` - Confirmation dialog
- `ErrorBoundary` - React error boundary
- `GalleryCard` - Gallery item card
- `InputAttachment` - File attachment input
- `MarketLayout`, `MarketCard` - Market layout components
- `ModelSelector` - AI model selector
- `PageContainer` - Page layout container
- `Popover` - Popover component
- `PromptText` - Prompt text display
- `Tabs`, `TabItem` - Tab navigation
- `Tree`, `TreeItem` - Tree view
- `WindowControls` - Desktop window controls
- `ImageUpload`, `VideoUpload`, `AudioUpload`, `FileUpload` - File upload components

### Hooks
- `useTheme` - Theme management hook
- `useConfirm` - Confirmation dialog hook

Low-level renderable asset helpers are exposed from `@sdkwork/magic-studio-commons/hooks`:
- `useRenderableAssetUrl` - Resolve renderable URLs for generic UI surfaces

### Utilities
- `generateUUID` - Generate unique ID
- `getAssetLabel` - Get human-readable asset label
- `getIconComponent` - Get icon by name
- `markdownUtils` - Markdown utilities
- `audioUtils` - Audio utilities
- `pathUtils` - Path utilities
- `logger` - Logging utility
- `cn` - Class name utility
- `formatBytes`, `formatDuration`, `formatNumber`, `formatDate` - Format utilities
- `debounce`, `throttle` - Function utilities
- `deepClone`, `deepMerge` - Object utilities

### Types
- `BaseEntity` - Base entity interface
- `Asset`, `User`, `Note` - Entity types
- `MediaResourceType`, `MediaType` - Media types
- `Page`, `PageRequest` - Pagination types
- And many more...

## License

MIT

## SDKWork Documentation Contract

Domain: platform
Capability: component
Package type: react-package
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

- `pnpm --filter @sdkwork/magic-studio-commons typecheck`

### Owner And Status

Owner and lifecycle status are tracked in `specs/component.spec.json`.
