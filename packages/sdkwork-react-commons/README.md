# sdkwork-react-commons

> Common UI components and utilities for SDKWork React applications

This package provides shared UI components, utilities, constants, and types used across all SDKWork React packages.

## Installation

```bash
pnpm add sdkwork-react-commons
```

## Usage

```typescript
import { Button, Card, generateUUID, MediaResourceType } from 'sdkwork-react-commons';
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
- `useAssetUrl` - Get asset URL from resource
- `useTheme` - Theme management hook
- `useConfirm` - Confirmation dialog hook

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
