# AGENTS.md - Development Guide for Magic Studio

## Project Overview

Magic Studio is a React 19 + TypeScript monorepo using pnpm workspaces, Vite, Zustand for state management, and Tauri for desktop app packaging. The codebase contains ~30 packages under `packages/`.

## Build Commands

### Root Level (main app)
```bash
npm run dev          # Start Vite dev server on port 9000
npm run build        # Run TypeScript check + Vite build
npm run preview      # Preview production build
npm run tauri        # Run Tauri desktop app in dev mode
```

### Package Level (each package in packages/*)
```bash
# From package directory, e.g., packages/sdkwork-react-core/
npm run dev          # Watch mode build
npm run build        # Vite build + emit .d.ts
npm run typecheck    # TypeScript check only (tsc --noEmit)
```

### Single Test
No test framework is configured in this project. To add tests, install Vitest:
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

Then add to package.json scripts:
```json
"test": "vitest",
"test:run": "vitest run"
```

## Code Style Guidelines

### TypeScript
- Target: ES2022
- Module: ESNext with bundler resolution
- Always use explicit types for function parameters and return values
- Use `interface` for public APIs, `type` for unions/intersections
- Enable `strict: true` equivalent via tsconfig

### Imports & Path Aliases
Use path aliases defined in tsconfig.json:
```typescript
// Package imports
import { something } from 'sdkwork-react-core';
import { something } from 'sdkwork-react-commons';

// Relative imports for same package
import { Something } from './components/Something';

// Subpath imports for sdkwork-react-core
import { createStore } from 'sdkwork-react-core/store';
import { useRouter } from 'sdkwork-react-core/router';
```

### Naming Conventions
- **Files**: PascalCase for components (`.tsx`), camelCase for utilities (`.ts`)
- **Components**: PascalCase (e.g., `CanvasToolbar.tsx`)
- **Services/Utils**: PascalCase (e.g., `TimelineOperationService.ts`)
- **Store slices**: camelCase (e.g., `canvasStore.ts`)
- **Constants**: SCREAMING_SNAKE_CASE for values, PascalCase for object keys

### React Patterns
- Use functional components with FC<> or shorthand (recommended)
- Prefer hooks over class components
- Use `classnames` library for conditional class strings
- Use `lucide-react` for icons
- Destructure props with defaults in function signature

```typescript
interface Props {
  label?: string;
  className?: string;
  disabled?: boolean;
}

export const MyComponent: React.FC<Props> = ({
  label = 'Default',
  className = '',
  disabled = false,
}) => {
  return <div className={classnames('base', { disabled })}>{label}</div>;
};
```

### State Management (Zustand)
Use vanilla zustand stores with React bindings:

```typescript
// Store definition (vanilla)
import { createStore } from 'zustand/vanilla';

interface State {
  count: number;
  increment: () => void;
}

export const useStore = create<State>((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
}));

// In React component
import { useStore } from './store';
const { count, increment } = useStore();
```

### Error Handling
- Use try/catch for async operations
- Return null/undefined for optional operations that fail silently
- Log errors to console with descriptive messages
- Consider Result types for operations that can fail

```typescript
try {
  const result = await someOperation();
  return result;
} catch (error) {
  console.error('Operation failed:', error);
  return null;
}
```

### Styling
- Use Tailwind CSS (v4) for styling
- Use arbitrary values sparingly: `className="bg-[#111]"`
- Use `clsx` or `classnames` for conditional classes

### File Organization
```
packages/
  sdkwork-react-xxx/
    src/
      components/     # React components
      pages/         # Page-level components  
      services/      # Business logic services
      store/         # Zustand stores
      entities/      # Type definitions / data models
      utils/         # Utility functions
      hooks/         # Custom React hooks
      constants.ts   # Package constants
      index.ts       # Public exports
    package.json
    tsconfig.json
    vite.config.ts
```

### Component Props
- Define interfaces at top of file or in separate `types.ts`
- Use `Base` prefix for shared props (e.g., `BaseUploadProps`)
- Make callbacks optional if not always required

### Ex barrel pattern
Each package exports from index.ts:
```typescript
export * from './components';
export * from './services';
export { useXStore } from './store';
```

### Linting/Formatting
No ESLint or Prettier config found. Run TypeScript check before committing:
```bash
npx tsc --noEmit
```

### Dependencies
- **Runtime**: React 19, Zustand 5, immer, classnames, lucide-react
- **Build**: Vite 7, TypeScript 5.9, @vitejs/plugin-react
- **Desktop**: Tauri 2, @tauri-apps/api

### Common Issues
- **Type errors with Zustand**: Use `as any` for store creator typing
- **Tauri path handling**: Use `platform.convertFileSrc()` for file URLs
- **Module resolution**: Path aliases only work in Vite dev; use relative imports for builds

## Development Workflow

1. Install deps: `npm install`
2. Set `GEMINI_API_KEY` in `.env.local`
3. Run: `npm run dev` (app at localhost:9000)
4. Make changes in packages under `packages/`
5. Test in app; run typecheck before committing
