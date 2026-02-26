# Magic Studio v2 - Project Context

## Project Overview

**Magic Studio** (also known as **Open Studio** or **SDKWork React**) is a comprehensive AI-powered media generation and editing platform built as a React + TypeScript monorepo. The project supports both web and desktop (Tauri) deployments and provides various AI media generation capabilities including image, video, audio, music, and voice synthesis.

### Key Technologies

| Category | Technology | Version |
|----------|------------|---------|
| **Frontend Framework** | React | 19.x |
| **Language** | TypeScript | 5.9.x |
| **Build Tool** | Vite | 7.x |
| **Desktop Framework** | Tauri | 2.x |
| **State Management** | Zustand | 5.x |
| **Styling** | Tailwind CSS | 4.x |
| **Package Manager** | pnpm (workspaces) | - |
| **AI Integration** | Google Generative AI SDK | - |
| **Cloud Storage** | AWS S3 SDK | - |

### Architecture

The project follows a **monorepo structure** with ~32 packages under `packages/`:

```
magic-studio-v2/
├── src/                    # Main application source
│   ├── app/                # App bootstrap, providers, theme
│   ├── layouts/            # Layout components
│   ├── pages/              # Page components (fallback)
│   ├── platform/           # Platform abstraction
│   ├── platform-impl/      # Platform implementations
│   ├── router/             # Routing configuration
│   └── workers/            # Web workers
├── src-tauri/              # Tauri desktop app (Rust)
├── packages/               # Shared packages (~32)
│   ├── sdkwork-react-core        # Core utilities, router, platform
│   ├── sdkwork-react-commons     # Shared types, components, utils
│   ├── sdkwork-react-fs          # File system abstraction
│   ├── sdkwork-react-assets      # Asset management components
│   ├── sdkwork-react-image       # Image generation module
│   ├── sdkwork-react-video       # Video generation module
│   ├── sdkwork-react-audio       # Audio generation module
│   ├── sdkwork-react-music       # Music generation module 
│   ├── sdkwork-react-magiccut    # AI video editing module
│   ├── sdkwork-react-editor      # Code editor module
│   ├── sdkwork-react-notes       # Notes application
│   ├── sdkwork-react-drive       # Cloud storage module
│   └── ... (more feature packages)
├── docs/                   # Architecture documentation
├── scripts/                # Build and utility scripts
└── ...
```

### Dual-Mode Architecture

Each business module supports two operation modes:
1. **Component Mode**: Import as components into the main app
2. **Standalone Mode**: Run as independent web/Tauri applications

## Building and Running

### Prerequisites

- Node.js 18+
- pnpm 8+ (or npm)
- For Tauri builds: Rust toolchain

### Installation

```bash
# Install dependencies
npm install  # or pnpm install

# Set up environment variables
# Create .env.local with:
GEMINI_API_KEY=your_api_key_here
```

### Development

```bash
# Main app development server (port 9000)
npm run dev

# Tauri desktop development
npm run tauri

# Preview production build
npm run preview
```

### Building

```bash
# TypeScript check + Vite build
npm run build

# Build Tauri desktop app
npm run tauri build
```

### Package-Level Commands

Each package in `packages/*` supports:
```bash
# From package directory
npm run dev          # Watch mode build
npm run build        # Vite build + emit .d.ts
npm run typecheck    # TypeScript check only
```

### Utility Scripts

```bash
npm run cdn:download    # Download CDN resources
npm run zip             # Create zip package
npm run zip:code        # Zip source code with report
npm run zip:report      # Generate zip report only
npm run zip:tgz         # Create .tgz archive
```

## Project Structure

### Main Application (`src/`)

```
src/
├── app/                  # App bootstrap
│   ├── App.tsx           # Root component
│   ├── AppProvider.tsx   # Global providers
│   ├── bootstrap.ts      # Initialization logic
│   ├── env.ts            # Environment config
│   └── theme/            # Theme configuration
├── layouts/              # Layout components
├── pages/                # Page components (fallback)
│   ├── HomePage.tsx
│   ├── LoginPage.tsx
│   ├── ProfilePage.tsx
│   └── SettingsPage.tsx
├── platform/             # Platform abstraction layer
├── platform-impl/        # Platform implementations
├── router/               # Routing configuration
└── workers/              # Web workers
```

### Tauri Desktop (`src-tauri/`)

```
src-tauri/
├── src/                  # Rust source code
├── icons/                # App icons (dev/prod)
├── capabilities/         # Tauri capabilities
├── tauri.conf.json       # Tauri configuration
└── Cargo.toml            # Rust dependencies
```

### Shared Packages (`packages/`)

#### Core Infrastructure
| Package | Description |
|---------|-------------|
| `sdkwork-react-core` | Router, store, platform API, AI services |
| `sdkwork-react-commons` | Shared types, UI components, utilities |
| `sdkwork-react-fs` | Virtual file system abstraction |
| `sdkwork-react-i18n` | Internationalization |
| `sdkwork-react-compression` | File compression utilities |
| `sdkwork-react-ide-config` | IDE configuration |
| `sdkwork-react-plugins` | Plugin system |
| `sdkwork-react-skills` | Skill definitions |

#### Feature Modules (AI Generation)
| Package | Description |
|---------|-------------|
| `sdkwork-react-image` | AI image generation |
| `sdkwork-react-video` | AI video generation |
| `sdkwork-react-audio` | AI audio generation |
| `sdkwork-react-music` | AI music generation | 
| `sdkwork-react-sfx` | Sound effects generation |
| `sdkwork-react-character` | Digital character/avatar |

#### Application Modules
| Package | Description |
|---------|-------------|
| `sdkwork-react-editor` | Code editor with Monaco |
| `sdkwork-react-notes` | Notes application with TipTap |
| `sdkwork-react-drive` | File management/cloud storage |
| `sdkwork-react-magiccut` | AI-powered video editing |
| `sdkwork-react-canvas` | Visual canvas editor |
| `sdkwork-react-browser` | Embedded browser component |
| `sdkwork-react-chat` | AI chat interface |
| `sdkwork-react-film` | Film/video production |
| `sdkwork-react-chatppt` | Chat-based PPT generation |
| `sdkwork-react-portal-video` | Video portal component |
| `sdkwork-react-trade` | **交易中心** - 任务市场、抢单大厅、订单管理、支付 |

#### User & Settings
| Package | Description |
|---------|-------------|
| `sdkwork-react-auth` | Authentication flows |
| `sdkwork-react-user` | User profile management |
| `sdkwork-react-vip` | VIP/subscription features |
| `sdkwork-react-settings` | App settings management |
| `sdkwork-react-workspace` | Workspace/project management |
| `sdkwork-react-notifications` | Notification system |

#### Assets & UI
| Package | Description |
|---------|-------------|
| `sdkwork-react-assets` | Asset management & generation UI |
| `sdkwork-react-generation-history` | Generation history components |

## Package Dependencies

### Core Packages (No Internal Dependencies)
- `sdkwork-react-commons` - Shared types, components
- `sdkwork-react-types` - Type definitions

### Infrastructure Packages (Depend on Core Only)
- `sdkwork-react-core` → commons, types
- `sdkwork-react-fs` → commons
- `sdkwork-react-i18n` → commons
- `sdkwork-react-compression` → commons
- `sdkwork-react-ide-config` → commons

### Feature Packages (Depend on Core + Commons)
- `sdkwork-react-image` → core, commons, assets
- `sdkwork-react-video` → core, commons, assets
- `sdkwork-react-audio` → core, commons
- `sdkwork-react-music` → core, commons 
- `sdkwork-react-sfx` → core, commons
- `sdkwork-react-character` → core, commons, assets
- `sdkwork-react-voicespeaker` → core, commons, audio

### Application Packages
- `sdkwork-react-editor` → core, commons
- `sdkwork-react-notes` → core, commons, tiptap
- `sdkwork-react-drive` → core, commons, aws-sdk
- `sdkwork-react-magiccut` → core, commons, video
- `sdkwork-react-canvas` → core, commons
- `sdkwork-react-browser` → core, commons, tauri
- `sdkwork-react-chat` → core, commons
- `sdkwork-react-film` → core, commons, video
- `sdkwork-react-chatppt` → core, commons, assets
- `sdkwork-react-portal-video` → core, commons, film, assets
- `sdkwork-react-trade` → core, commons **(独立设计，无循环依赖)**

### User & Settings Packages
- `sdkwork-react-auth` → core, commons
- `sdkwork-react-user` → core, commons, auth
- `sdkwork-react-vip` → core, commons, auth
- `sdkwork-react-settings` → core, commons, auth
- `sdkwork-react-workspace` → core, commons, auth
- `sdkwork-react-notifications` → core, commons, auth

### Plugin System
- `sdkwork-react-plugins` → core, commons
- `sdkwork-react-skills` → core, commons, plugins

## sdkwork-react-trade Module

### Overview
**sdkwork-react-trade** 是交易中心模块，提供任务市场、订单管理、支付等功能。

### Features
- **任务市场 (TaskMarketPage)**: 抢单大厅，展示可接任务
  - 统计卡片（可接任务、总预算池、活跃用户、今日完成）
  - 高级筛选（搜索、类型、难度、排序）
  - 任务网格展示
  - 分页功能
  - 任务详情弹窗

- **我的任务 (MyTasksPage)**: 个人任务管理
  - 任务状态概览（进行中、已完成、待验收、累计收益）
  - 订单管理
  - 发布任务
  - 钱包功能（余额、积分、充值、交易记录）

### Architecture
```
packages/sdkwork-react-trade/
├── src/
│   ├── components/
│   │   ├── Order/          # 订单组件 (OrderCard, OrderList, OrderDetail)
│   │   ├── Payment/        # 支付组件 (PaymentDialog, PaymentMethod)
│   │   └── Task/           # 任务组件 (TaskCard, TaskList)
│   ├── entities/           # 类型定义 (Order, Payment, Task, Wallet)
│   ├── pages/
│   │   ├── TaskMarketPage.tsx   # 任务市场页面（独立，含 Header/Sidebar）
│   │   └── MyTasksPage.tsx      # 我的任务页面（独立，含 Header/Sidebar）
│   ├── services/
│   │   ├── orderService.ts      # 订单服务
│   │   ├── paymentService.ts    # 支付服务
│   │   └── taskService.ts       # 任务服务
│   ├── hooks/
│   │   ├── useOrders.ts
│   │   ├── usePayments.ts
│   │   └── useTasks.ts
│   └── index.ts
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### Design Principles
1. **完全独立**: 页面组件包含自己的 Header 和 Sidebar，不依赖外部布局
2. **零循环依赖**: 不依赖 sdkwork-react-portal-video，避免循环依赖
3. **响应式设计**: 移动端可折叠 Sidebar，桌面端固定 Sidebar
4. **统一 UI**: 深色主题，与 Portal 页面保持一致的视觉风格

### Routes
- `/task-market` - 任务市场（抢单大厅）
- `/my-tasks` - 我的任务

### Navigation
**PortalHeader 导航栏**:
```
首页 | 社区 | 剧场 | 技能 | 插件 | 任务市场
```

**用户下拉菜单**:
```
- 个人资料
- 我的任务
- 账单与套餐
- 切换工作区
- 偏好设置
- 退出登录
```

### Usage
```typescript
// Import pages
import { TaskMarketPage, MyTasksPage } from 'sdkwork-react-trade';

// Import components
import { OrderList, OrderCard, TaskList, TaskCard } from 'sdkwork-react-trade';
import { PaymentDialog } from 'sdkwork-react-trade';

// Import services
import { orderService, paymentService, taskService } from 'sdkwork-react-trade';

// Import hooks
import { useOrders, usePayments, useTasks } from 'sdkwork-react-trade';

// Import types
import type { Order, Payment, AvailableTask, Wallet } from 'sdkwork-react-trade';
```

## Development Conventions

### TypeScript Configuration

- **Target**: ES2022
- **Module**: ESNext with bundler resolution
- **JSX**: react-jsx
- **Module Resolution**: bundler
- **Path Aliases**: Configured in `tsconfig.json` and `vite.config.ts`

### Import Path Aliases

```typescript
// Package imports
import { something } from 'sdkwork-react-core';
import { something } from 'sdkwork-react-commons';
import { something } from 'sdkwork-react-assets';

// Subpath imports
import { useRouter } from 'sdkwork-react-core/router';
import { createStore } from 'sdkwork-react-core/store';
import { useAssetUrl } from 'sdkwork-react-commons/hooks/useAssetUrl';

// Relative imports within same package
import { Component } from './components/Component';
```

### Code Style

- **Components**: PascalCase, functional components with hooks
- **Files**: 
  - PascalCase for components (`.tsx`)
  - camelCase for utilities (`.ts`)
- **Types**: Use `interface` for public APIs, `type` for unions
- **State**: Zustand stores with vanilla create
- **Icons**: lucide-react
- **Class Names**: `classnames` library for conditional classes

### React Patterns

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
  return <div className={cn('base', { disabled })}>{label}</div>;
};
```

### Zustand Store Pattern

```typescript
// Store definition
import { createStore } from 'zustand/vanilla';

interface State {
  count: number;
  increment: () => void;
}

export const useStore = create<State>((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
}));

// Usage in component
const { count, increment } = useStore();
```

### Error Handling

- Use try/catch for async operations
- Return null/undefined for silent failures
- Log errors with descriptive messages
- Consider Result types for operations that can fail

## File Organization Convention

Each package follows this structure:

```
packages/sdkwork-react-xxx/
├── src/
│   ├── components/     # React components
│   ├── pages/          # Page-level components
│   ├── services/       # Business logic services
│   ├── store/          # Zustand stores
│   ├── entities/       # Type definitions
│   ├── utils/          # Utility functions
│   ├── hooks/          # Custom React hooks
│   ├── constants.ts    # Package constants
│   └── index.ts        # Public exports
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Generative AI API key | Yes (for AI features) |

## Testing

No test framework is currently configured. To add testing:

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

Add to `package.json`:
```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

## Known Issues & Technical Debt

### Current Type Errors

The project has significant TypeScript errors (~1900+) primarily due to:
1. Missing exports in shared packages (partially fixed)
2. Entity type mismatches between packages
3. Platform API method availability issues
4. Path resolution problems for module imports

### Recent Fixes Applied (2026-02-20)

- Added missing type definitions to `sdkwork-react-commons` (Asset, User, Note, etc.)
- Fixed Card component exports with proper CardProps
- Created useConfirm hook for Confirm dialog
- Fixed import paths in `sdkwork-react-core` (genAIService, uploadHelper)
- Added downloadService and mediaAnalysisService exports
- Created GenerateHistory stub component
- Fixed circular dependency in upload components (ImageUpload, VideoUpload)

### Remaining Issues

1. **pnpm workspace linking**: Packages need proper linking to resolve workspace dependencies
2. **TypeScript cache**: May need cleanup after fixes
3. **Package builds**: Base packages need to be built for proper type resolution

### Recommended Fix Steps

```bash
# 1. Reinstall dependencies
pnpm install

# 2. Build base packages
pnpm --filter sdkwork-react-commons build
pnpm --filter sdkwork-react-core build
pnpm --filter sdkwork-react-fs build

# 3. Run TypeScript check
npx tsc --noEmit
```

## External Resources

- AI Studio App: https://ai.studio/apps/drive/1y4vCr-T8tLrgepTfFttEKC7hV0THIn_0
- Tauri Documentation: https://tauri.app/
- Vite Documentation: https://vitejs.dev/

## Related Documentation

- `docs/architect-react+tauri.md` - Detailed architecture documentation (Chinese)
- `docs/package-routing-system.md` - Package routing system
- `docs/00-technology-stack-versions.md` - Technology stack versions
- `AGENTS.md` - Development guide for contributors
- `README.md` - Quick start guide
