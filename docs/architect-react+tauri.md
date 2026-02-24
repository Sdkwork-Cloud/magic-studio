# SDKWork React 技术架构文档

## 目录

1. [架构概述](#一架构概述)
2. [技术栈](#二技术栈)
3. [四模式包架构](#三四模式包架构)
4. [独立应用模块清单](#四独立应用模块清单)
5. [Tauri 桌面应用架构](#五tauri-桌面应用架构)
6. [分包层级结构](#六分包层级结构)
7. [包开发指南](#七包开发指南)
8. [包间依赖处理](#八包间依赖处理)
9. [包详细说明](#九包详细说明)
10. [依赖关系图](#十依赖关系图)
11. [开发规范](#十一开发规范)
12. [性能优化指南](#十二性能优化指南)
13. [安全开发规范](#十三安全开发规范)
14. [测试策略](#十四测试策略)
15. [错误处理与日志规范](#十五错误处理与日志规范)
16. [构建与发布](#十六构建与发布)
17. [命名规范](#十七命名规范)
18. [版本管理](#十八版本管理)
19. [已知问题与优化方向](#十九已知问题与优化方向)
20. [附录](#二十附录)

---

## 一、架构概述

SDKWork React 是一个基于 Monorepo 架构的前端应用框架，采用分层模块化设计，将业务功能拆分为独立的 npm 包。**每个包同时支持四种使用模式**：独立 Web 应用部署、独立 Tauri 桌面应用部署、作为 Node.js 依赖包引入、作为 Tauri 依赖包引入。

### 1.1 架构设计原则

| 原则 | 描述 | 实践方式 |
|------|------|----------|
| **分层架构** | 基础层 → 核心层 → 服务层 → 业务层，单向依赖 | 严格遵循层级依赖规则，禁止反向依赖 |
| **职责单一** | 每个包专注于单一功能领域 | 按功能域划分包边界 |
| **高内聚低耦合** | 包内部高内聚，包之间低耦合 | 通过接口和类型定义解耦 |
| **可复用性** | 通用功能下沉到基础包 | 公共组件、工具、类型统一管理 |
| **四模式统一** | 每个包支持四种使用模式 | 统一包结构，一套代码多场景使用 |

### 1.2 四模式包架构

每个业务包同时支持以下四种使用模式：

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              四模式包架构                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        sdkwork-react-xxx 包                              │   │
│  │                                                                          │   │
│  │    ┌────────────────────────────────────────────────────────────────┐   │   │
│  │    │                     统一源码 (src/)                             │   │   │
│  │    │  ├── components/    UI 组件                                     │   │   │
│  │    │  ├── pages/         页面组件                                    │   │   │
│  │    │  ├── services/      服务层                                      │   │   │
│  │    │  ├── store/         状态管理                                    │   │   │
│  │    │  └── index.ts       公共 API 导出                               │   │   │
│  │    └────────────────────────────────────────────────────────────────┘   │   │
│  │                                    │                                     │   │
│  │            ┌───────────────────────┼───────────────────────┐           │   │
│  │            │                       │                       │            │   │
│  │            ▼                       ▼                       ▼            │   │
│  │  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    │   │
│  │  │   模式一        │    │   模式二        │    │   模式三/四     │    │   │
│  │  │  独立 Web 应用  │    │ 独立 Tauri 应用 │    │  依赖包引入     │    │   │
│  │  │                 │    │                 │    │                 │    │   │
│  │  │  apps/xxx-app/  │    │  apps/xxx-app/  │    │  npm publish    │    │   │
│  │  │  vite 构建      │    │  src-tauri/     │    │  或 tauri 依赖  │    │   │
│  │  │  部署到 CDN     │    │  tauri build    │    │                 │    │   │
│  │  └─────────────────┘    └─────────────────┘    └─────────────────┘    │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 四种使用模式详解

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           四种使用模式详解                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │ 模式一: 独立 Web 应用                                                      │ │
│  ├───────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                           │ │
│  │  使用场景: 独立产品发布、演示环境、测试环境                                │ │
│  │                                                                           │ │
│  │  运行方式:                                                                │ │
│  │    pnpm --filter sdkwork-react-xxx dev          # 开发模式               │ │
│  │    pnpm --filter sdkwork-react-xxx build        # 构建生产版本           │ │
│  │    pnpm --filter sdkwork-react-xxx preview      # 预览生产版本           │ │
│  │                                                                           │ │
│  │  部署方式:                                                                │ │
│  │    - 静态文件部署到 CDN (Cloudflare, Vercel, Netlify)                    │ │
│  │    - Docker 容器化部署                                                    │ │
│  │    - Nginx 反向代理部署                                                   │ │
│  │                                                                           │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │ 模式二: 独立 Tauri 桌面应用                                                │ │
│  ├───────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                           │ │
│  │  使用场景: 桌面应用发布、离线使用、系统集成                                │ │
│  │                                                                           │ │
│  │  运行方式:                                                                │ │
│  │    pnpm --filter sdkwork-react-xxx tauri dev     # 开发模式              │ │
│  │    pnpm --filter sdkwork-react-xxx tauri build   # 构建桌面应用          │ │
│  │                                                                           │ │
│  │  输出格式:                                                                │ │
│  │    - Windows: .msi, .nsis                                                 │ │
│  │    - macOS: .dmg, .app                                                    │ │
│  │    - Linux: .deb, .rpm, .AppImage                                         │ │
│  │                                                                           │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │ 模式三: Node.js 依赖包引入                                                 │ │
│  ├───────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                           │ │
│  │  使用场景: 集成到现有 Web 应用、模块化开发、按需加载                       │ │
│  │                                                                           │ │
│  │  安装方式:                                                                │ │
│  │    pnpm install sdkwork-react-xxx                                        │ │
│  │    npm install sdkwork-react-xxx                                         │ │
│  │    yarn add sdkwork-react-xxx                                            │ │
│  │                                                                           │ │
│  │  使用示例:                                                                │ │
│  │    import { XxxPage, XxxComponent, useXxxStore } from 'sdkwork-react-xxx'│ │
│  │                                                                           │ │
│  │  发布方式:                                                                │ │
│  │    pnpm --filter sdkwork-react-xxx publish                               │ │
│  │                                                                           │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │ 模式四: Tauri 依赖包引入                                                   │
│  ├───────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                           │ │
│  │  使用场景: 集成到现有 Tauri 应用、桌面应用模块化开发                       │ │
│  │                                                                           │ │
│  │  前端依赖 (package.json):                                                 │ │
│  │    {                                                                      │ │
│  │      "dependencies": {                                                    │ │
│  │        "sdkwork-react-xxx": "^1.0.0"                                      │ │
│  │      }                                                                    │ │
│  │    }                                                                      │ │
│  │                                                                           │ │
│  │  Rust 依赖 (Cargo.toml) - 如需要原生能力:                                 │ │
│  │    [dependencies]                                                         │ │
│  │    sdkwork-tauri-xxx = { path = "../packages/sdkwork-tauri-xxx" }        │ │
│  │                                                                           │ │
│  │  使用示例:                                                                │ │
│  │    // 前端使用                                                            │ │
│  │    import { XxxPage } from 'sdkwork-react-xxx'                           │ │
│  │                                                                           │ │
│  │    // Rust 端使用 (如有原生模块)                                          │ │
│  │    use sdkwork_tauri_xxx::commands::*;                                   │ │
│  │                                                                           │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 1.4 四模式对比

| 特性 | 独立 Web 应用 | 独立 Tauri 应用 | Node.js 依赖包 | Tauri 依赖包 |
|------|--------------|----------------|----------------|--------------|
| **部署方式** | CDN/服务器 | 桌面安装包 | npm 发布 | npm + crates.io |
| **运行环境** | 浏览器 | 桌面 WebView | 宿主应用 | 宿主 Tauri 应用 |
| **文件系统** | 受限 | 完整访问 | 受限 | 完整访问 |
| **系统 API** | 无 | 完整支持 | 无 | 完整支持 |
| **离线使用** | 需配置 PWA | 原生支持 | 取决于宿主 | 原生支持 |
| **更新方式** | 热更新 | 应用更新 | 包更新 | 包更新 |
| **适用场景** | Web 产品 | 桌面产品 | 模块集成 | 桌面应用集成 |

---

## 二、技术栈

### 2.1 包管理与构建工具

| 技术 | 版本 | 用途 | 说明 |
|------|------|------|------|
| **pnpm** | ^9.0.0 | 包管理器 | 高效磁盘利用，严格的依赖管理，Monorepo 原生支持 |
| **Vite** | ^7.0.0 | 构建工具 | 极速开发体验，ESM 原生支持，HMR 热更新 |

#### pnpm 包管理器

本项目使用 **pnpm** 作为包管理器，具有以下优势：

| 特性 | 描述 |
|------|------|
| **磁盘效率** | 内容寻址存储，全局去重，节省磁盘空间 |
| **严格依赖** | 避免幽灵依赖，只能访问 package.json 中声明的依赖 |
| **Monorepo 支持** | 原生支持 workspace，无需额外工具 |
| **安装速度** | 符号链接机制，安装速度快于 npm/yarn |

```bash
# 安装 pnpm
npm install -g pnpm

# 安装依赖
pnpm install

# 添加依赖
pnpm add <package>

# 添加开发依赖
pnpm add -D <package>

# 按包安装依赖
pnpm --filter sdkwork-react-xxx add <package>

# 运行脚本
pnpm --filter sdkwork-react-xxx dev
```

#### Vite 构建工具

本项目使用 **Vite** 作为构建工具，具有以下优势：

| 特性 | 描述 |
|------|------|
| **极速启动** | 原生 ESM 开发服务器，无需打包即可启动 |
| **即时热更新** | HMR 热更新速度快，无论项目规模 |
| **双模式构建** | 支持库模式和应用模式，一套配置两种输出 |
| **优化构建** | 基于 Rollup 的生产构建，代码分割优化 |

```typescript
// vite.config.ts - 库模式配置
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'MyPackage',
      formats: ['es', 'cjs'],
    },
  },
});

// vite.app.config.ts - 应用模式配置
export default defineConfig({
  plugins: [react()],
  root: 'app',
  build: {
    outDir: '../dist-app',
  },
});
```

### 2.2 核心技术栈

| 技术 | 版本 | 用途 | 说明 |
|------|------|------|------|
| **React** | ^19.0.0 | UI 框架 | 使用函数组件 + Hooks |
| **TypeScript** | ^5.9.0 | 类型系统 | 严格模式，禁止 any |
| **Zustand** | ^5.0.0 | 状态管理 | 轻量级，支持中间件 |
| **Tailwind CSS** | ^4.0.0 | 样式方案 | 原子化 CSS，JIT 编译 |

### 2.3 桌面应用技术栈

| 技术 | 版本 | 用途 | 说明 |
|------|------|------|------|
| **Tauri** | ^2.0.0 | 桌面应用框架 | Rust 后端，极小体积 |
| **Tauri Plugins** | ^2.0.0 | 系统能力扩展 | 文件系统、对话框、通知等 |
| **Rust** | 1.75+ | 原生模块开发 | 高性能系统编程 |

### 2.3 编辑器技术栈

| 技术 | 版本 | 用途 | 说明 |
|------|------|------|------|
| **Monaco Editor** | ^0.47.0 | 代码编辑器 | VS Code 同款编辑器 |
| **TipTap** | ^2.0.0 | 富文本编辑器 | 可扩展，ProseMirror 内核 |
| **xterm.js** | ^5.0.0 | 终端模拟器 | 完整终端功能支持 |

### 2.4 云服务技术栈

| 技术 | 版本 | 用途 | 说明 |
|------|------|------|------|
| **AWS SDK S3** | ^3.994.0 | 对象存储 | 文件上传、下载、预签名 |
| **Google GenAI** | ^1.42.0 | AI 服务 | Gemini API 集成 |

### 2.5 工具库

| 技术 | 版本 | 用途 | 说明 |
|------|------|------|------|
| **Lucide React** | ^0.475.0 | 图标库 | 1000+ 精美图标 |
| **classnames** | ^2.5.0 | 类名拼接 | 条件类名处理 |
| **immer** | ^11.0.0 | 不可变数据 | 简化状态更新 |
| **JSZip** | ^3.10.0 | ZIP 处理 | 文件压缩解压 |
| **markdown-it** | ^14.0.0 | Markdown 解析 | 高性能解析器 |
| **mediabunny** | ^1.34.0 | 媒体处理 | 音视频处理工具 |

### 2.6 开发工具

| 工具 | 版本 | 用途 |
|------|------|------|
| **pnpm** | ^8.0.0 | 包管理器 |
| **ESLint** | ^9.0.0 | 代码检查 |
| **Prettier** | ^3.0.0 | 代码格式化 |
| **Sharp** | ^0.34.0 | 图像处理 |

### 2.7 技术栈架构图

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              技术栈架构                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                            应用层                                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │   │
│  │  │   React     │  │  Zustand    │  │  Tailwind   │  │  TypeScript │    │   │
│  │  │  ^19.0.0    │  │  ^5.0.0     │  │  ^4.0.0     │  │  ^5.9.0     │    │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                            编辑器层                                       │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                      │   │
│  │  │   Monaco    │  │   TipTap    │  │   xterm     │                      │   │
│  │  │   Editor    │  │   3.20.x    │  │   6.0.x     │                      │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                      │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                            平台层                                         │   │
│  │  ┌─────────────────────────────┐  ┌─────────────────────────────┐       │   │
│  │  │         Web Platform        │  │       Tauri Desktop         │       │   │
│  │  │    (Vite 7.3.x + React)     │  │    (Rust + WebView)         │       │   │
│  │  └─────────────────────────────┘  └─────────────────────────────┘       │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                            服务层                                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │   │
│  │  │  AWS S3     │  │ Google GenAI│  │  mediabunny │  │   JSZip     │    │   │
│  │  │  3.994.x    │  │   1.42.x    │  │   1.34.x    │  │   3.10.x    │    │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 三、四模式包架构

### 3.1 包结构规范

每个业务包必须支持四种使用模式，统一目录结构如下：

```
sdkwork-react-xxx/
├── src/                          # 统一源码 (四种模式共用)
│   ├── index.ts                  # 公共 API 导出
│   ├── components/               # UI 组件
│   ├── pages/                    # 页面组件
│   │   └── XxxPage.tsx           # 主页面
│   ├── services/                 # 服务层
│   ├── store/                    # 状态管理
│   ├── entities/                 # 实体定义
│   ├── constants/                # 常量定义
│   ├── types/                    # 类型定义
│   ├── hooks/                    # 自定义 Hooks
│   ├── router/                   # 路由配置 (独立)
│   │   ├── index.ts              # 路由导出入口
│   │   ├── routes.ts             # 路由定义
│   │   ├── guards.ts             # 路由守卫 (可选)
│   │   └── types.ts              # 路由类型定义
│   ├── i18n/                     # 国际化配置 (独立)
│   │   ├── index.ts              # 国际化导出入口
│   │   ├── types.ts              # 国际化类型定义
│   │   └── locales/              # 语言资源目录
│   │       ├── zh-CN/            # 简体中文 (按业务模块拆分)
│   │       │   ├── index.ts      # 语言包入口
│   │       │   ├── common.ts     # 通用文案
│   │       │   ├── page.ts       # 页面文案
│   │       │   ├── form.ts       # 表单文案
│   │       │   ├── message.ts    # 消息提示文案
│   │       │   └── error.ts      # 错误文案
│   │       └── en-US/            # 英文 (按业务模块拆分)
│   │           ├── index.ts      # 语言包入口
│   │           ├── common.ts     # Common
│   │           ├── page.ts       # Page
│   │           ├── form.ts       # Form
│   │           ├── message.ts    # Message
│   │           └── error.ts      # Error
│   └── platform/                 # 平台适配层
│       ├── index.ts              # 平台抽象入口
│       ├── web.ts                # Web 平台实现
│       └── tauri.ts              # Tauri 平台实现
│
├── src-tauri/                    # Tauri 原生模块 (可选)
│   ├── src/
│   │   ├── main.rs               # Rust 入口
│   │   ├── commands/             # IPC 命令
│   │   │   ├── mod.rs
│   │   │   └── xxx_commands.rs
│   │   └── lib.rs
│   ├── Cargo.toml                # Rust 依赖
│   └── build.rs                  # 构建脚本
│
├── app/                          # 独立应用入口 (模式一/二)
│   ├── main.tsx                  # 应用入口
│   ├── App.tsx                   # 根组件
│   ├── index.html                # HTML 模板
│   └── styles/
│       └── index.css             # 全局样式
│
├── dist/                         # 构建产物
│   ├── index.js                  # npm 包入口
│   ├── index.d.ts                # 类型声明
│   └── ...
│
├── package.json                  # 包配置
├── tsconfig.json                 # TypeScript 配置
├── vite.config.ts                # Vite 配置 (库模式)
├── vite.app.config.ts            # Vite 配置 (应用模式)
└── README.md                     # 包文档
```

### 3.2 package.json 配置

```json
{
  "name": "sdkwork-react-xxx",
  "version": "1.0.0",
  "description": "XXX 模块 - 支持独立应用和依赖包两种使用方式",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./styles": "./dist/style.css"
  },
  "files": [
    "dist",
    "README.md"
  ],
  "scripts": {
    "dev": "vite --config vite.app.config.ts",
    "build": "vite build",
    "build:app": "vite build --config vite.app.config.ts",
    "build:types": "tsc --emitDeclarationOnly",
    "preview": "vite preview --config vite.app.config.ts",
    "tauri": "tauri dev",
    "tauri:build": "tauri build",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src",
    "test": "vitest",
    "prepublishOnly": "pnpm build && pnpm build:types"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "sdkwork-react-core": "workspace:*",
    "sdkwork-react-commons": "workspace:*"
  },
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0"
  },
  "devDependencies": {
    "@tauri-apps/api": "^2.10.0",
    "@tauri-apps/cli": "^2.10.0",
    "@vitejs/plugin-react": "^5.0.0",
    "typescript": "^5.9.0",
    "vite": "^7.0.0",
    "vitest": "^1.0.0"
  },
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  },
  "keywords": [
    "react",
    "sdkwork",
    "tauri",
    "xxx"
  ]
}
```

### 3.3 Vite 配置

#### 库模式配置

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'SdkworkReactXxx',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
    sourcemap: true,
    minify: 'esbuild',
  },
});
```

#### 应用模式配置

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  root: 'app',
  publicDir: '../public',
  build: {
    outDir: '../dist-app',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      'sdkwork-react-xxx': resolve(__dirname, 'src/index.ts'),
    },
  },
});
```

### 3.4 平台适配层

```typescript
// src/platform/index.ts
export interface PlatformAdapter {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  deleteFile(path: string): Promise<void>;
  showOpenDialog(options: OpenDialogOptions): Promise<string[] | null>;
  showSaveDialog(options: SaveDialogOptions): Promise<string | null>;
  notify(title: string, body: string): Promise<void>;
}

export interface OpenDialogOptions {
  title?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
  multiple?: boolean;
}

export interface SaveDialogOptions {
  title?: string;
  filters?: Array<{ name: string; extensions: string[] }>;
  defaultPath?: string;
}

let adapter: PlatformAdapter | null = null;

export function setPlatformAdapter(instance: PlatformAdapter) {
  adapter = instance;
}

export function getPlatformAdapter(): PlatformAdapter {
  if (!adapter) {
    throw new Error('Platform adapter not initialized');
  }
  return adapter;
}

export async function initializePlatform(): Promise<void> {
  if (typeof window !== 'undefined') {
    const isTauri = '__TAURI__' in window;
    if (isTauri) {
      const { TauriPlatformAdapter } = await import('./tauri');
      adapter = new TauriPlatformAdapter();
    } else {
      const { WebPlatformAdapter } = await import('./web');
      adapter = new WebPlatformAdapter();
    }
  }
}
```

```typescript
// src/platform/web.ts
import type { PlatformAdapter, OpenDialogOptions, SaveDialogOptions } from './index';

export class WebPlatformAdapter implements PlatformAdapter {
  async readFile(path: string): Promise<string> {
    const response = await fetch(path);
    return response.text();
  }

  async writeFile(path: string, content: string): Promise<void> {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = path.split('/').pop() || 'file';
    a.click();
    URL.revokeObjectURL(url);
  }

  async deleteFile(_path: string): Promise<void> {
    throw new Error('File deletion not supported in web platform');
  }

  async showOpenDialog(options: OpenDialogOptions): Promise<string[] | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = options.multiple || false;
      input.accept = options.filters
        ?.flatMap(f => f.extensions.map(ext => `.${ext}`))
        .join(',') || '';
      
      input.onchange = () => {
        const files = Array.from(input.files || []);
        resolve(files.length > 0 ? files.map(f => f.name) : null);
      };
      
      input.click();
    });
  }

  async showSaveDialog(_options: SaveDialogOptions): Promise<string | null> {
    return prompt('Enter file name:');
  }

  async notify(title: string, body: string): Promise<void> {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification(title, { body });
      }
    }
  }
}
```

```typescript
// src/platform/tauri.ts
import type { PlatformAdapter, OpenDialogOptions, SaveDialogOptions } from './index';
import { open, save } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile, remove } from '@tauri-apps/plugin-fs';
import { sendNotification } from '@tauri-apps/plugin-notification';

export class TauriPlatformAdapter implements PlatformAdapter {
  async readFile(path: string): Promise<string> {
    return readTextFile(path);
  }

  async writeFile(path: string, content: string): Promise<void> {
    await writeTextFile(path, content);
  }

  async deleteFile(path: string): Promise<void> {
    await remove(path);
  }

  async showOpenDialog(options: OpenDialogOptions): Promise<string[] | null> {
    const result = await open({
      multiple: options.multiple,
      filters: options.filters,
      title: options.title,
    });
    if (result === null) return null;
    return Array.isArray(result) ? result : [result];
  }

  async showSaveDialog(options: SaveDialogOptions): Promise<string | null> {
    return save({
      filters: options.filters,
      title: options.title,
      defaultPath: options.defaultPath,
    });
  }

  async notify(title: string, body: string): Promise<void> {
    await sendNotification({ title, body });
  }
}
```

### 3.5 独立路由配置

每个业务包拥有独立的路由配置，支持默认导出和覆盖配置能力。

#### 3.5.1 路由配置结构

```
sdkwork-react-xxx/
├── src/
│   ├── router/                    # 路由配置
│   │   ├── index.ts               # 路由导出入口
│   │   ├── routes.ts              # 路由定义
│   │   ├── guards.ts              # 路由守卫 (可选)
│   │   └── types.ts               # 路由类型定义
│   └── ...
```

#### 3.5.2 路由定义

```typescript
// src/router/types.ts
import type { RouteObject } from 'react-router-dom';

export interface PackageRouteConfig {
  /** 路由前缀，用于隔离不同包的路由 */
  basePath: string;
  /** 路由配置列表 */
  routes: RouteObject[];
  /** 路由守卫 */
  guards?: RouteGuard[];
  /** 路由元信息 */
  meta?: Record<string, RouteMeta>;
}

export interface RouteGuard {
  /** 守卫名称 */
  name: string;
  /** 前置守卫 - 返回 false 阻止导航 */
  beforeEnter?: (to: any, from: any) => boolean | Promise<boolean>;
  /** 后置守卫 */
  afterEnter?: (to: any, from: any) => void;
}

export interface RouteMeta {
  title?: string;
  requiresAuth?: boolean;
  layout?: 'full' | 'sidebar' | 'none';
  keepAlive?: boolean;
}
```

```typescript
// src/router/routes.ts
import type { PackageRouteConfig } from './types';
import { lazy } from 'react';

const XxxPage = lazy(() => import('../pages/XxxPage'));
const XxxDetailPage = lazy(() => import('../pages/XxxDetailPage'));
const XxxSettingsPage = lazy(() => import('../pages/XxxSettingsPage'));

export const defaultRoutes: PackageRouteConfig = {
  basePath: '/xxx',
  routes: [
    {
      path: '',
      element: <XxxPage />,
      children: [
        {
          path: 'detail/:id',
          element: <XxxDetailPage />,
        },
        {
          path: 'settings',
          element: <XxxSettingsPage />,
        },
      ],
    },
  ],
  meta: {
    '/xxx': { title: 'XXX 模块', layout: 'sidebar', requiresAuth: false },
    '/xxx/detail/:id': { title: '详情', layout: 'sidebar', requiresAuth: true },
    '/xxx/settings': { title: '设置', layout: 'sidebar', requiresAuth: true },
  },
};

export default defaultRoutes;
```

#### 3.5.3 路由导出与合并

```typescript
// src/router/index.ts
export { defaultRoutes } from './routes';
export type { PackageRouteConfig, RouteGuard, RouteMeta } from './types';

import { defaultRoutes } from './routes';
import type { PackageRouteConfig } from './types';

/**
 * 创建路由配置
 * @param overrides 覆盖配置
 * @returns 合并后的路由配置
 */
export function createRoutes(overrides?: Partial<PackageRouteConfig>): PackageRouteConfig {
  if (!overrides) return defaultRoutes;

  return {
    basePath: overrides.basePath ?? defaultRoutes.basePath,
    routes: overrides.routes ?? defaultRoutes.routes,
    guards: [...(defaultRoutes.guards || []), ...(overrides.guards || [])],
    meta: { ...defaultRoutes.meta, ...overrides.meta },
  };
}

/**
 * 获取路由列表 (用于注册到宿主应用)
 */
export function getRoutes(basePath?: string): PackageRouteConfig['routes'] {
  const prefix = basePath ?? defaultRoutes.basePath;
  return defaultRoutes.routes.map(route => ({
    ...route,
    path: `${prefix}${route.path}`,
  }));
}
```

#### 3.5.4 宿主应用集成

```typescript
// 宿主应用 - 路由合并
import { createBrowserRouter } from 'react-router-dom';
import { getRoutes as getImageRoutes, createRoutes as createImageRoutes } from 'sdkwork-react-image';
import { getRoutes as getVideoRoutes, createRoutes as createVideoRoutes } from 'sdkwork-react-video';

// 方式一: 使用默认配置
const routes = [
  { path: '/', element: <HomePage /> },
  ...getImageRoutes(),
  ...getVideoRoutes(),
];

// 方式二: 覆盖配置
const imageRoutes = createImageRoutes({
  basePath: '/ai-image',  // 覆盖路由前缀
  meta: {
    '/ai-image': { title: 'AI 图片生成', requiresAuth: true },
  },
});

const videoRoutes = createVideoRoutes({
  basePath: '/ai-video',
  guards: [
    {
      name: 'vip-check',
      beforeEnter: async () => {
        return await checkVipStatus();
      },
    },
  ],
});

const router = createBrowserRouter([...routes]);
```

### 3.6 独立国际化配置

每个业务包拥有独立的国际化配置，支持默认导出和覆盖配置能力。

#### 3.6.1 国际化配置结构

```
sdkwork-react-xxx/
├── src/
│   ├── i18n/                       # 国际化配置
│   │   ├── index.ts                # 国际化导出入口
│   │   ├── types.ts                # 国际化类型定义
│   │   └── locales/                # 语言资源目录
│   │       ├── zh-CN/              # 简体中文 (按业务模块拆分)
│   │       │   ├── index.ts        # 语言包入口
│   │       │   ├── common.ts       # 通用文案
│   │       │   ├── page.ts         # 页面文案
│   │       │   ├── form.ts         # 表单文案
│   │       │   ├── message.ts      # 消息提示文案
│   │       │   └── error.ts        # 错误文案
│   │       └── en-US/              # 英文 (按业务模块拆分)
│   │           ├── index.ts        # 语言包入口
│   │           ├── common.ts       # Common
│   │           ├── page.ts         # Page
│   │           ├── form.ts         # Form
│   │           ├── message.ts      # Message
│   │           └── error.ts        # Error
│   └── ...
```

#### 3.6.2 类型定义

```typescript
// src/i18n/types.ts

/** 支持的语言 */
export type SupportedLocale = 'zh-CN' | 'en-US' | 'ja-JP';

/** 包国际化配置 */
export interface PackageI18nConfig {
  /** 包命名空间 (用于区分不同包，建议使用包名简写，如 image、video) */
  namespace: string;
  /** 支持的语言列表 */
  supportedLocales: SupportedLocale[];
  /** 语言资源 */
  resources: Record<SupportedLocale, I18nNamespaceResource>;
  /** 默认语言 */
  defaultLocale?: SupportedLocale;
  /** 回退语言 */
  fallbackLocale?: SupportedLocale;
}

/** 命名空间资源 (按模块组织) */
export interface I18nNamespaceResource {
  /** 通用文案 */
  common?: I18nCommonResource;
  /** 页面文案 */
  page?: I18nPageResource;
  /** 表单文案 */
  form?: I18nFormResource;
  /** 消息提示文案 */
  message?: I18nMessageResource;
  /** 错误文案 */
  error?: I18nErrorResource;
  /** 其他业务模块 */
  [module: string]: I18nModuleResource | undefined;
}

/** 模块资源基础接口 */
export interface I18nModuleResource {
  [key: string]: string | I18nModuleResource;
}

/** 通用文案 */
export interface I18nCommonResource extends I18nModuleResource {
  title: string;
  create: string;
  edit: string;
  delete: string;
  cancel: string;
  confirm: string;
  save: string;
  loading: string;
  noData: string;
}

/** 页面文案 */
export interface I18nPageResource extends I18nModuleResource {
  list: string;
  detail: string;
  settings: string;
}

/** 表单文案 */
export interface I18nFormResource extends I18nModuleResource {
  name: string;
  description: string;
  nameRequired: string;
  descriptionPlaceholder: string;
}

/** 消息提示文案 */
export interface I18nMessageResource extends I18nModuleResource {
  createSuccess: string;
  createFailed: string;
  updateSuccess: string;
  deleteConfirm: string;
  deleteSuccess: string;
}

/** 错误文案 */
export interface I18nErrorResource extends I18nModuleResource {
  networkError: string;
  serverError: string;
  unknownError: string;
}
```

#### 3.6.3 语言资源定义 (按业务模块拆分)

```typescript
// src/i18n/locales/zh-CN/common.ts
import type { I18nCommonResource } from '../../types';

export const common: I18nCommonResource = {
  title: 'XXX 模块',
  create: '创建',
  edit: '编辑',
  delete: '删除',
  cancel: '取消',
  confirm: '确认',
  save: '保存',
  loading: '加载中...',
  noData: '暂无数据',
};
```

```typescript
// src/i18n/locales/zh-CN/page.ts
import type { I18nPageResource } from '../../types';

export const page: I18nPageResource = {
  list: '列表',
  detail: '详情',
  settings: '设置',
};
```

```typescript
// src/i18n/locales/zh-CN/form.ts
import type { I18nFormResource } from '../../types';

export const form: I18nFormResource = {
  name: '名称',
  description: '描述',
  nameRequired: '请输入名称',
  descriptionPlaceholder: '请输入描述内容',
};
```

```typescript
// src/i18n/locales/zh-CN/message.ts
import type { I18nMessageResource } from '../../types';

export const message: I18nMessageResource = {
  createSuccess: '创建成功',
  createFailed: '创建失败',
  updateSuccess: '更新成功',
  deleteConfirm: '确定要删除吗？',
  deleteSuccess: '删除成功',
};
```

```typescript
// src/i18n/locales/zh-CN/error.ts
import type { I18nErrorResource } from '../../types';

export const error: I18nErrorResource = {
  networkError: '网络错误，请稍后重试',
  serverError: '服务器错误',
  unknownError: '未知错误',
};
```

```typescript
// src/i18n/locales/zh-CN/index.ts
import type { I18nNamespaceResource } from '../../types';
import { common } from './common';
import { page } from './page';
import { form } from './form';
import { message } from './message';
import { error } from './error';

export const zhCN: I18nNamespaceResource = {
  common,
  page,
  form,
  message,
  error,
};

export default zhCN;
```

```typescript
// src/i18n/locales/en-US/common.ts
import type { I18nCommonResource } from '../../types';

export const common: I18nCommonResource = {
  title: 'XXX Module',
  create: 'Create',
  edit: 'Edit',
  delete: 'Delete',
  cancel: 'Cancel',
  confirm: 'Confirm',
  save: 'Save',
  loading: 'Loading...',
  noData: 'No Data',
};
```

```typescript
// src/i18n/locales/en-US/page.ts
import type { I18nPageResource } from '../../types';

export const page: I18nPageResource = {
  list: 'List',
  detail: 'Detail',
  settings: 'Settings',
};
```

```typescript
// src/i18n/locales/en-US/form.ts
import type { I18nFormResource } from '../../types';

export const form: I18nFormResource = {
  name: 'Name',
  description: 'Description',
  nameRequired: 'Please enter name',
  descriptionPlaceholder: 'Please enter description',
};
```

```typescript
// src/i18n/locales/en-US/message.ts
import type { I18nMessageResource } from '../../types';

export const message: I18nMessageResource = {
  createSuccess: 'Created successfully',
  createFailed: 'Creation failed',
  updateSuccess: 'Updated successfully',
  deleteConfirm: 'Are you sure to delete?',
  deleteSuccess: 'Deleted successfully',
};
```

```typescript
// src/i18n/locales/en-US/error.ts
import type { I18nErrorResource } from '../../types';

export const error: I18nErrorResource = {
  networkError: 'Network error, please try again later',
  serverError: 'Server error',
  unknownError: 'Unknown error',
};
```

```typescript
// src/i18n/locales/en-US/index.ts
import type { I18nNamespaceResource } from '../../types';
import { common } from './common';
import { page } from './page';
import { form } from './form';
import { message } from './message';
import { error } from './error';

export const enUS: I18nNamespaceResource = {
  common,
  page,
  form,
  message,
  error,
};

export default enUS;
```

#### 3.6.4 国际化导出与合并

```typescript
// src/i18n/index.ts
export type { 
  PackageI18nConfig, 
  I18nNamespaceResource,
  I18nModuleResource,
  I18nCommonResource,
  I18nPageResource,
  I18nFormResource,
  I18nMessageResource,
  I18nErrorResource,
  SupportedLocale 
} from './types';

import zhCN from './locales/zh-CN';
import enUS from './locales/en-US';
import type { PackageI18nConfig, I18nNamespaceResource, SupportedLocale } from './types';

/**
 * 包命名空间 (建议使用包名简写)
 * sdkwork-react-image -> image
 * sdkwork-react-video -> video
 * sdkwork-react-audio -> audio
 */
export const NAMESPACE = 'xxx';

export const defaultI18nConfig: PackageI18nConfig = {
  namespace: NAMESPACE,
  supportedLocales: ['zh-CN', 'en-US'],
  resources: {
    'zh-CN': zhCN,
    'en-US': enUS,
  },
  defaultLocale: 'zh-CN',
  fallbackLocale: 'en-US',
};

/**
 * 创建国际化配置
 * @param overrides 覆盖配置
 * @returns 合并后的国际化配置
 */
export function createI18nConfig(
  overrides?: Partial<PackageI18nConfig> & { 
    /** 按模块覆盖资源 */
    resourceOverrides?: Record<SupportedLocale, Partial<I18nNamespaceResource>> 
  }
): PackageI18nConfig {
  if (!overrides) return defaultI18nConfig;

  const mergedResources: PackageI18nConfig['resources'] = {} as any;
  
  for (const locale of defaultI18nConfig.supportedLocales) {
    mergedResources[locale] = {
      ...defaultI18nConfig.resources[locale],
      ...(overrides.resourceOverrides?.[locale] || {}),
    };
  }

  return {
    namespace: overrides.namespace ?? defaultI18nConfig.namespace,
    supportedLocales: overrides.supportedLocales ?? defaultI18nConfig.supportedLocales,
    resources: mergedResources,
    defaultLocale: overrides.defaultLocale ?? defaultI18nConfig.defaultLocale,
    fallbackLocale: overrides.fallbackLocale ?? defaultI18nConfig.fallbackLocale,
  };
}

/**
 * 获取语言资源 (用于注册到宿主应用)
 * @param locale 语言
 */
export function getResources(locale?: SupportedLocale): I18nNamespaceResource {
  const targetLocale = locale || defaultI18nConfig.defaultLocale!;
  return defaultI18nConfig.resources[targetLocale] || defaultI18nConfig.resources[defaultI18nConfig.fallbackLocale!];
}

/**
 * 获取命名空间
 */
export function getNamespace(): string {
  return NAMESPACE;
}

/**
 * 获取带命名空间的翻译键
 * @param module 模块名 (如 common, page, form)
 * @param key 翻译键
 * @returns 带命名空间的翻译键 (如 xxx.common.create)
 * 
 * @example
 * getI18nKey('common', 'create') // 'xxx.common.create'
 * useTranslation(NAMESPACE)('common.create') // '创建'
 */
export function getI18nKey(module: string, key: string): string {
  return `${NAMESPACE}.${module}.${key}`;
}
```

#### 3.6.5 宿主应用集成

```typescript
// 宿主应用 - 国际化合并
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { 
  getResources as getImageResources,
  getNamespace as getImageNamespace 
} from 'sdkwork-react-image';
import { 
  getResources as getVideoResources,
  getNamespace as getVideoNamespace 
} from 'sdkwork-react-video';
import { 
  getResources as getAudioResources,
  getNamespace as getAudioNamespace 
} from 'sdkwork-react-audio';

// 构建资源对象 (每个包有独立的命名空间)
const resources = {
  'zh-CN': {
    // image 包的命名空间为 'image'
    [getImageNamespace()]: getImageResources('zh-CN'),
    // video 包的命名空间为 'video'
    [getVideoNamespace()]: getVideoResources('zh-CN'),
    // audio 包的命名空间为 'audio'
    [getAudioNamespace()]: getAudioResources('zh-CN'),
  },
  'en-US': {
    [getImageNamespace()]: getImageResources('en-US'),
    [getVideoNamespace()]: getVideoResources('en-US'),
    [getAudioNamespace()]: getAudioResources('en-US'),
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'zh-CN',
  fallbackLng: 'en-US',
  interpolation: {
    escapeValue: false,
  },
});
```

#### 3.6.6 组件中使用

```typescript
// 在组件中使用翻译
import { useTranslation } from 'react-i18next';
import { NAMESPACE } from 'sdkwork-react-xxx/i18n';

export function XxxComponent() {
  const { t } = useTranslation(NAMESPACE);
  
  return (
    <div>
      <h1>{t('common.title')}</h1>
      <button>{t('common.create')}</button>
      <p>{t('message.createSuccess')}</p>
      <span>{t('error.networkError')}</span>
    </div>
  );
}
```

#### 3.6.7 命名空间规范

| 包名 | 命名空间 | 翻译键示例 |
|------|----------|-----------|
| sdkwork-react-image | `image` | `image.common.create` |
| sdkwork-react-video | `video` | `video.common.create` |
| sdkwork-react-audio | `audio` | `audio.common.create` |
| sdkwork-react-music | `music` | `music.common.create` |
| sdkwork-react-editor | `editor` | `editor.common.create` |
| sdkwork-react-notes | `notes` | `notes.common.create` |
| sdkwork-react-drive | `drive` | `drive.common.create` |
| sdkwork-react-chat | `chat` | `chat.common.create` |

### 3.7 配置导出规范

每个包必须在 `src/index.ts` 中统一导出路由和国际化配置：

```typescript
// src/index.ts

// ============ 页面组件 ============
export { default as XxxPage } from './pages/XxxPage';
export { default as XxxDetailPage } from './pages/XxxDetailPage';

// ============ UI 组件 ============
export { XxxComponent } from './components/XxxComponent';

// ============ 服务 ============
export { xxxService } from './services/xxxService';

// ============ 存储 ============
export { XxxStoreProvider, useXxxStore } from './store/xxxStore';

// ============ 类型 ============
export type { XxxEntity, XxxConfig } from './types';

// ============ 常量 ============
export * from './constants';

// ============ 平台适配 ============
export { initializePlatform, getPlatformAdapter } from './platform';
export type { PlatformAdapter } from './platform';

// ============ 路由配置 ============
export { 
  defaultRoutes, 
  createRoutes, 
  getRoutes 
} from './router';
export type { 
  PackageRouteConfig, 
  RouteGuard, 
  RouteMeta 
} from './router';

// ============ 国际化配置 ============
export { 
  defaultI18nConfig, 
  createI18nConfig, 
  getResources, 
  getNamespace 
} from './i18n';
export type { 
  PackageI18nConfig, 
  I18nResource, 
  SupportedLocale 
} from './i18n';
```

### 3.8 Tauri 原生模块 (可选)

对于需要原生能力的包，可添加 `src-tauri/` 目录：

```rust
// src-tauri/src/lib.rs
mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::xxx_command,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

```rust
// src-tauri/src/commands/mod.rs
use tauri::command;

#[command]
pub async fn xxx_command(param: String) -> Result<String, String> {
    Ok(format!("Processed: {}", param))
}
```

```toml
# src-tauri/Cargo.toml
[package]
name = "sdkwork-tauri-xxx"
version = "0.1.0"
edition = "2021"

[dependencies]
tauri = { version = "2", features = ["devtools"] }
tauri-plugin-fs = "2"
tauri-plugin-dialog = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"

[build-dependencies]
tauri-build = { version = "2", features = [] }
```

---

## 四、独立应用模块清单

### 4.1 独立应用模块列表

以下业务模块支持四种使用模式：

| 模块名称 | 包名 | Web 应用 | Tauri 应用 | npm 包 | Tauri 依赖 |
|---------|------|----------|------------|--------|------------|
| 图片生成 | sdkwork-react-image | ✅ | ✅ | ✅ | ✅ |
| 视频生成 | sdkwork-react-video | ✅ | ✅ | ✅ | ✅ |
| 音频生成 | sdkwork-react-audio | ✅ | ✅ | ✅ | ✅ |
| 音乐生成 | sdkwork-react-music | ✅ | ✅ | ✅ | ✅ |
| 语音合成 | sdkwork-react-voicespeaker | ✅ | ✅ | ✅ | ✅ |
| 智能剪辑 | sdkwork-react-magiccut | ✅ | ✅ | ✅ | ✅ |
| 画布编辑 | sdkwork-react-canvas | ✅ | ✅ | ✅ | ✅ |
| 笔记应用 | sdkwork-react-notes | ✅ | ✅ | ✅ | ✅ |
| 影片制作 | sdkwork-react-film | ✅ | ✅ | ✅ | ✅ |
| 视频门户 | sdkwork-react-portal-video | ✅ | ✅ | ✅ | ✅ |
| 云盘 | sdkwork-react-drive | ✅ | ✅ | ✅ | ✅ |
| 代码编辑器 | sdkwork-react-editor | ✅ | ✅ | ✅ | ✅ |
| PPT生成 | sdkwork-react-chatppt | ✅ | ✅ | ✅ | ✅ |
| 浏览器 | sdkwork-react-browser | ✅ | ✅ | ✅ | ✅ |
| 聊天 | sdkwork-react-chat | ✅ | ✅ | ✅ | ✅ |

### 4.2 模块使用示例

#### 作为独立 Web 应用运行

```bash
# 开发模式
pnpm --filter sdkwork-react-image dev

# 构建生产版本
pnpm --filter sdkwork-react-image build:app

# 预览生产版本
pnpm --filter sdkwork-react-image preview
```

#### 作为独立 Tauri 应用运行

```bash
# 开发模式
pnpm --filter sdkwork-react-image tauri dev

# 构建桌面应用
pnpm --filter sdkwork-react-image tauri build
```

#### 作为 Node.js 依赖包使用

```bash
# 安装
pnpm install sdkwork-react-image

# 使用
import { ImagePage, useImageStore } from 'sdkwork-react-image';
```

#### 作为 Tauri 依赖包使用

```json
// package.json
{
  "dependencies": {
    "sdkwork-react-image": "^1.0.0"
  }
}
```

```typescript
// 在 Tauri 应用中使用
import { ImagePage } from 'sdkwork-react-image';

// 平台适配层自动检测 Tauri 环境
import { initializePlatform } from 'sdkwork-react-image/platform';
await initializePlatform();
```

---

## 五、Tauri 桌面应用架构

### 5.1 Tauri 架构概述

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              Tauri 应用架构                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │                            前端层 (WebView)                                │ │
│  │  ┌─────────────────────────────────────────────────────────────────────┐ │ │
│  │  │  React Application                                                   │ │ │
│  │  │  ├── UI Components (from sdkwork-react-xxx packages)                │ │ │
│  │  │  ├── State Management (Zustand)                                     │ │ │
│  │  │  ├── Platform Adapter (自动检测 Tauri 环境)                         │ │ │
│  │  │  └── Tauri API Bridge (@tauri-apps/api)                             │ │ │
│  │  └─────────────────────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                          │
│                                      │ IPC                                      │
│                                      ▼                                          │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │                            Rust 后端层                                     │ │
│  │  ┌─────────────────────────────────────────────────────────────────────┐ │ │
│  │  │  Tauri Core                                                          │ │ │
│  │  │  ├── Commands (IPC 处理)                                             │ │ │
│  │  │  ├── Events (事件系统)                                               │ │ │
│  │  │  ├── Plugins (文件系统、对话框、通知等)                              │ │ │
│  │  │  └── Platform Abstraction (平台抽象)                                 │ │ │
│  │  └─────────────────────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Tauri 插件依赖

每个包可使用的 Tauri 插件：

| 插件名称 | 功能描述 | 使用场景 |
|---------|---------|---------|
| @tauri-apps/plugin-fs | 文件系统操作 | 所有应用 |
| @tauri-apps/plugin-dialog | 文件对话框 | 所有应用 |
| @tauri-apps/plugin-http | HTTP 请求 | 所有应用 |
| @tauri-apps/plugin-notification | 系统通知 | 所有应用 |
| @tauri-apps/plugin-clipboard-manager | 剪贴板 | 所有应用 |
| @tauri-apps/plugin-shell | Shell 命令 | editor, magiccut |
| @tauri-apps/plugin-updater | 应用更新 | 所有应用 |
| @tauri-apps/plugin-window-state | 窗口状态 | 所有应用 |
| @tauri-apps/plugin-process | 进程管理 | 所有应用 |
| @tauri-apps/plugin-os | 操作系统信息 | 所有应用 |
| @tauri-apps/plugin-opener | 打开外部链接 | 所有应用 |
| @tauri-apps/plugin-store | 本地存储 | 所有应用 |

---

## 六、分包层级结构

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              层级 0: 基础设施层                                   │
│  (无内部依赖，提供最底层的能力抽象)                                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│  sdkwork-react-core          核心平台能力 (路由、状态管理、事件总线、平台抽象)      │
│  sdkwork-react-i18n          国际化服务                                          │
│  sdkwork-react-notifications 通知中心                                            │
│  sdkwork-react-compression   压缩服务                                            │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              层级 1: 通用基础层                                   │
│  (依赖基础设施层，提供通用组件和工具)                                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│  sdkwork-react-commons       通用UI组件、类型定义、工具函数、算法                  │
│  sdkwork-react-fs            虚拟文件系统                                        │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              层级 2: 服务层                                       │
│  (提供业务无关的基础服务)                                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│  sdkwork-react-assets        资产管理服务 (上传、存储、检索)                       │
│  sdkwork-react-settings      设置管理服务                                        │
│  sdkwork-react-auth          认证授权服务                                        │
│  sdkwork-react-vip           VIP会员服务                                         │
│  sdkwork-react-workspace     工作空间管理                                        │
│  sdkwork-react-ide-config    IDE配置服务                                        │
│  sdkwork-react-generation-history  生成历史组件                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              层级 3: 业务功能层                                   │
│  (具体业务功能模块，支持四种使用模式)                                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─ 媒体生成模块 ─────────────────────────────────────────────────────────────┐  │
│  │  🖼️ sdkwork-react-image       图片生成        [四模式支持]               │  │
│  │  🎬 sdkwork-react-video       视频生成        [四模式支持]               │  │
│  │  🎵 sdkwork-react-audio       音频生成        [四模式支持]               │  │
│  │  🎶 sdkwork-react-music       音乐生成        [四模式支持]               │  │
│  │  🔊 sdkwork-react-sfx         音效生成        [四模式支持]               │  │
│  │  🎤 sdkwork-react-voicespeaker 语音合成       [四模式支持]               │  │
│  │  👤 sdkwork-react-character   数字人生成      [四模式支持]               │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
│  ┌─ 编辑器模块 ───────────────────────────────────────────────────────────────┐  │
│  │  💻 sdkwork-react-editor      代码编辑器      [四模式支持]               │  │
│  │  🎨 sdkwork-react-canvas      画布编辑器      [四模式支持]               │  │
│  │  📝 sdkwork-react-notes       笔记应用        [四模式支持]               │  │
│  │  📊 sdkwork-react-chatppt     PPT生成         [四模式支持]               │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
│  ┌─ 应用模块 ─────────────────────────────────────────────────────────────────┐  │
│  │  🌐 sdkwork-react-browser     浏览器          [四模式支持]               │  │
│  │  📁 sdkwork-react-drive       云盘            [四模式支持]               │  │
│  │  🎞️ sdkwork-react-film        影片制作        [四模式支持]               │  │
│  │  ✂️ sdkwork-react-magiccut    智能剪辑        [四模式支持]               │  │
│  │  📺 sdkwork-react-portal-video 视频门户       [四模式支持]               │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
│  ┌─ 通信模块 ─────────────────────────────────────────────────────────────────┐  │
│  │  💬 sdkwork-react-chat        聊天功能        [四模式支持]               │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
│  sdkwork-react-user          用户中心                                           │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 七、包开发指南

### 7.1 创建新包

```bash
# 创建包目录
mkdir -p packages/sdkwork-react-xxx/src

# 创建基础文件
touch packages/sdkwork-react-xxx/src/index.ts
touch packages/sdkwork-react-xxx/package.json
touch packages/sdkwork-react-xxx/tsconfig.json
touch packages/sdkwork-react-xxx/vite.config.ts
touch packages/sdkwork-react-xxx/vite.app.config.ts
```

### 7.2 开发流程

```bash
# 1. 开发模式 (作为独立应用)
pnpm --filter sdkwork-react-xxx dev

# 2. 开发模式 (作为 Tauri 应用)
pnpm --filter sdkwork-react-xxx tauri dev

# 3. 构建库模式
pnpm --filter sdkwork-react-xxx build

# 4. 构建应用模式
pnpm --filter sdkwork-react-xxx build:app

# 5. 构建 Tauri 应用
pnpm --filter sdkwork-react-xxx tauri build

# 6. 类型检查
pnpm --filter sdkwork-react-xxx typecheck

# 7. 测试
pnpm --filter sdkwork-react-xxx test
```

### 7.3 发布流程

```bash
# 1. 确保代码质量
pnpm --filter sdkwork-react-xxx lint
pnpm --filter sdkwork-react-xxx typecheck
pnpm --filter sdkwork-react-xxx test

# 2. 构建产物
pnpm --filter sdkwork-react-xxx build

# 3. 发布到 npm
pnpm --filter sdkwork-react-xxx publish

# 4. 发布 Tauri 应用 (可选)
pnpm --filter sdkwork-react-xxx tauri build
```

---

## 八、包间依赖处理

### 8.1 依赖原则

| 原则 | 描述 | 示例 |
|------|------|------|
| **单向依赖** | 低层包不依赖高层包 | commons 不依赖 assets |
| **最小依赖** | 只依赖必要的包 | 避免传递依赖膨胀 |
| **接口隔离** | 通过接口或类型定义解耦 | 使用 props 传递依赖 |
| **平台抽象** | 通过平台适配层隔离平台差异 | PlatformAdapter 接口 |

### 8.2 依赖传递机制

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              依赖传递机制                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  packages/sdkwork-react-xxx/package.json                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  {                                                                       │   │
│  │    "dependencies": {                                                     │   │
│  │      "sdkwork-react-core": "workspace:*",                                │   │
│  │      "sdkwork-react-commons": "workspace:*"                              │   │
│  │    },                                                                    │   │
│  │    "peerDependencies": {                                                 │   │
│  │      "react": ">=18.0.0",                                                │   │
│  │      "react-dom": ">=18.0.0"                                             │   │
│  │    }                                                                     │   │
│  │  }                                                                       │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  宿主应用 package.json                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  {                                                                       │   │
│  │    "dependencies": {                                                     │   │
│  │      "sdkwork-react-xxx": "^1.0.0",                                      │   │
│  │      # 间接依赖会自动传递:                                                │   │
│  │      # - sdkwork-react-core                                              │   │
│  │      # - sdkwork-react-commons                                           │   │
│  │    },                                                                    │   │
│  │    "peerDependencies": {                                                 │   │
│  │      "react": "^19.0.0",                                                 │   │
│  │      "react-dom": "^19.0.0"                                              │   │
│  │    }                                                                     │   │
│  │  }                                                                       │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 8.3 Tauri 依赖处理

```toml
# 宿主 Tauri 应用 Cargo.toml
[dependencies]
tauri = { version = "2", features = ["devtools"] }
tauri-plugin-fs = "2"
tauri-plugin-dialog = "2"

# 如果包有原生模块
sdkwork-tauri-xxx = { path = "../packages/sdkwork-react-xxx/src-tauri" }
```

---

## 九、包详细说明

### 9.1 基础设施层 (Layer 0)

#### sdkwork-react-core
**描述**: 核心平台能力包，提供应用运行的基础设施

**四模式支持**: ✅ Web应用 | ✅ Tauri应用 | ✅ npm包 | ✅ Tauri依赖

**主要功能**:
- 路由管理
- 状态管理
- 事件总线
- 平台抽象
- AI 服务集成
- 通用工具函数

**依赖**: 无内部依赖

---

#### sdkwork-react-i18n
**描述**: 国际化服务包，提供多语言支持

**四模式支持**: ✅ Web应用 | ✅ Tauri应用 | ✅ npm包 | ✅ Tauri依赖

**主要功能**:
- I18nService: 国际化服务类
- 语言资源管理
- 翻译函数

**依赖**: 无内部依赖

---

### 9.2 通用基础层 (Layer 1)

#### sdkwork-react-commons
**描述**: 通用UI组件和工具包，是所有业务包的基础

**四模式支持**: ✅ Web应用 | ✅ Tauri应用 | ✅ npm包 | ✅ Tauri依赖

**主要功能**:
- 通用组件: Button, Card, Gallery 等
- 工具函数: generateUUID, formatDate 等
- 类型定义: ImageTask, MediaType 等
- 平台适配层: PlatformAdapter

**依赖**: core, i18n

---

### 9.3 服务层 (Layer 2)

#### sdkwork-react-assets
**描述**: 资产管理服务包，提供媒体资源的上传、存储、检索功能

**四模式支持**: ✅ Web应用 | ✅ Tauri应用 | ✅ npm包 | ✅ Tauri依赖

**主要功能**:
- 资产服务: assetService
- 资产选择器: ChooseAsset, ChooseAssetModal
- 资产存储: useAssetStore, AssetStoreProvider

**依赖**: commons, core, fs, settings, i18n

---

### 9.4 业务功能层 (Layer 3)

#### sdkwork-react-image 🖼️
**描述**: 图片生成模块，提供AI图片生成功能

**四模式支持**: ✅ Web应用 | ✅ Tauri应用 | ✅ npm包 | ✅ Tauri依赖

**主要功能**:
- 图片生成页面: ImagePage, ImageChatPage
- 图片编辑器: ImageGridEditorModal, ImageCanvasEditorModal
- AI生成弹窗: AIImageGeneratorModal
- 图片存储: ImageStoreProvider, useImageStore

**依赖**: generation-history, assets, commons, core, fs, settings, i18n

---

## 十、依赖关系图

```
                                    core
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                  i18n            commons              │
                    │                 │                 │
                    └────────┬────────┘                 │
                             │                          │
                      ┌──────┴──────┐                   │
                      │             │                   │
                      fs         settings               │
                      │             │                   │
                      └──────┬──────┘                   │
                             │                          │
                         assets                        │
                             │                          │
              ┌──────────────┼──────────────┐          │
              │              │              │          │
           auth            vip         workspace       │
              │              │              │          │
              └──────┬───────┘              │          │
                     │                      │          │
                   user                     │          │
                                            │          │
              ┌─────────────────────────────┼──────────┤
              │              │              │          │
         generation-     editor          chat        browser
          history          │              │          │
              │            │              │          │
              ├────────────┴──────────────┴──────────┘
              │
    ┌─────────┼─────────┬─────────┬─────────┐
    │         │         │         │         │
  image     video     audio    voicespeaker │
    │         │         │         │         │
    ├─────────┤         │         │         │
    │         │         │         │         │
 character  sfx      music       │         │
    │         │         │         │         │
    └─────────┴─────────┴─────────┴─────────┤
                                              │
         ┌────────────────────────────────────┤
         │                    │               │
      magiccut             notes           drive
         │                    │               │
         └────────────────────┴───────────────┤
                                              │
         ┌────────────────────────────────────┤
         │                                    │
       film                               chatppt
         │
    portal-video
```

---

## 十一、开发规范

### 11.1 依赖原则

| 原则 | 描述 | 示例 |
|------|------|------|
| **单向依赖** | 低层包不依赖高层包 | commons 不依赖 assets |
| **最小依赖** | 只依赖必要的包 | 避免传递依赖膨胀 |
| **接口隔离** | 通过接口或类型定义解耦 | 使用 props 传递依赖 |
| **平台抽象** | 通过平台适配层隔离平台差异 | PlatformAdapter 接口 |

### 11.2 包结构规范

```
sdkwork-react-xxx/
├── src/                          # 统一源码
│   ├── index.ts                  # 公共 API 导出
│   ├── components/               # UI 组件
│   ├── pages/                    # 页面组件
│   ├── services/                 # 服务层
│   ├── store/                    # 状态管理
│   ├── entities/                 # 实体定义
│   ├── constants/                # 常量定义
│   ├── types/                    # 类型定义
│   ├── hooks/                    # 自定义 Hooks
│   ├── router/                   # 路由配置 (独立)
│   ├── i18n/                     # 国际化配置 (独立)
│   └── platform/                 # 平台适配层
├── src-tauri/                    # Tauri 原生模块 (可选)
├── app/                          # 独立应用入口
├── dist/                         # 构建产物
├── package.json
├── tsconfig.json
├── vite.config.ts                # 库模式配置
├── vite.app.config.ts            # 应用模式配置
└── README.md
```

### 11.3 导出规范

每个包必须在 `src/index.ts` 中统一导出所有配置和组件：

```typescript
// src/index.ts

// ============ 页面组件 ============
export { default as XxxPage } from './pages/XxxPage';
export { default as XxxDetailPage } from './pages/XxxDetailPage';

// ============ UI 组件 ============
export { XxxComponent } from './components/XxxComponent';

// ============ 服务 ============
export { xxxService } from './services/xxxService';

// ============ 存储 ============
export { XxxStoreProvider, useXxxStore } from './store/xxxStore';

// ============ 类型 ============
export type { XxxEntity, XxxConfig } from './types';

// ============ 常量 ============
export * from './constants';

// ============ 平台适配 ============
export { initializePlatform, getPlatformAdapter } from './platform';
export type { PlatformAdapter } from './platform';

// ============ 路由配置 ============
export { 
  defaultRoutes, 
  createRoutes, 
  getRoutes 
} from './router';
export type { 
  PackageRouteConfig, 
  RouteGuard, 
  RouteMeta 
} from './router';

// ============ 国际化配置 ============
export { 
  defaultI18nConfig, 
  createI18nConfig, 
  getResources, 
  getNamespace 
} from './i18n';
export type { 
  PackageI18nConfig, 
  I18nResource, 
  SupportedLocale 
} from './i18n';
```

### 11.4 命名规范

#### 文件命名
- **组件文件**: PascalCase (如 `ImagePage.tsx`)
- **工具文件**: camelCase (如 `helpers.ts`)
- **类型文件**: camelCase (如 `types.ts`)
- **常量文件**: camelCase (如 `constants.ts`)

#### 变量命名
- **组件**: PascalCase (如 `ImagePage`)
- **函数**: camelCase (如 `handleSubmit`)
- **常量**: UPPER_SNAKE_CASE (如 `API_BASE_URL`)
- **类型/接口**: PascalCase (如 `ImageTask`)

---

## 十二、性能优化指南

### 12.1 组件优化

| 优化项 | 描述 | 实践方式 |
|--------|------|----------|
| **React.memo** | 避免不必要的重渲染 | 对纯展示组件使用 memo |
| **useMemo** | 缓存计算结果 | 复杂计算、大数组过滤等 |
| **useCallback** | 缓存回调函数 | 传递给子组件的回调 |
| **虚拟列表** | 大列表渲染优化 | 使用虚拟滚动组件 |

### 12.2 代码分割

```typescript
// 路由级别懒加载
const ImagePage = lazy(() => import('./pages/ImagePage'));

// 组件级别懒加载
const HeavyComponent = lazy(() => import('./components/HeavyComponent'));
```

### 12.3 构建优化

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['lucide-react', 'classnames'],
        },
      },
    },
  },
});
```

---

## 十三、安全开发规范

### 13.1 敏感信息处理

| 规范 | 描述 |
|------|------|
| **禁止硬编码密钥** | API Key、密钥等必须通过环境变量配置 |
| **环境变量管理** | 使用 `.env.local` 存储敏感配置 |
| **日志脱敏** | 禁止在日志中输出用户敏感信息 |

### 13.2 Tauri 安全配置

```json
// tauri.conf.json
{
  "app": {
    "security": {
      "csp": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
    }
  }
}
```

---

## 十四、测试策略

### 14.1 测试类型

| 测试类型 | 覆盖率要求 | 工具 |
|----------|------------|------|
| **单元测试** | ≥ 70% | Vitest |
| **组件测试** | ≥ 60% | Vitest + Testing Library |
| **E2E 测试** | 核心流程 | Playwright |
| **类型检查** | 100% | TypeScript |

### 14.2 测试命令

```bash
# 运行所有测试
pnpm test

# 运行特定包的测试
pnpm --filter sdkwork-react-xxx test

# 运行测试并生成覆盖率报告
pnpm test:coverage
```

---

## 十五、错误处理与日志规范

### 15.1 错误处理模式

```typescript
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}
```

### 15.2 日志规范

```typescript
class Logger {
  debug(message: string, ...args: unknown[]) { /* ... */ }
  info(message: string, ...args: unknown[]) { /* ... */ }
  warn(message: string, ...args: unknown[]) { /* ... */ }
  error(message: string, error?: Error) { /* ... */ }
}
```

---

## 十六、构建与发布

### 16.1 构建命令

```bash
# 构建库模式 (npm 包)
pnpm --filter sdkwork-react-xxx build

# 构建应用模式 (Web 应用)
pnpm --filter sdkwork-react-xxx build:app

# 构建 Tauri 应用
pnpm --filter sdkwork-react-xxx tauri build
```

### 16.2 发布流程

```bash
# 发布到 npm
pnpm --filter sdkwork-react-xxx publish

# 发布 Tauri 应用
pnpm --filter sdkwork-react-xxx tauri build --target all
```

---

## 十七、命名规范

### 17.1 包命名规范

| 类型 | 格式 | 示例 |
|------|------|------|
| React 包 | `sdkwork-react-xxx` | `sdkwork-react-image` |
| Tauri 原生模块 | `sdkwork-tauri-xxx` | `sdkwork-tauri-image` |
| 应用目录 | `app/` | 包内 app 目录 |

---

## 十八、版本管理

采用语义化版本控制：

| 版本类型 | 说明 | 示例 |
|----------|------|------|
| **MAJOR** | 不兼容的 API 变更 | 1.0.0 → 2.0.0 |
| **MINOR** | 向后兼容的功能新增 | 1.0.0 → 1.1.0 |
| **PATCH** | 向后兼容的问题修复 | 1.0.0 → 1.0.1 |

---

## 十九、已知问题与优化方向

### 19.1 循环依赖

当前存在一个循环依赖：
- `sdkwork-react-film` ↔ `sdkwork-react-portal-video`

**解决方案**: 将共同依赖的部分提取到独立包

### 19.2 优化建议

| 优化项 | 描述 | 优先级 |
|--------|------|--------|
| **平台适配层完善** | 为所有包添加完整的平台适配层 | 高 |
| **Tauri 原生模块** | 为需要原生能力的包添加 Rust 模块 | 中 |
| **测试覆盖** | 提高测试覆盖率 | 中 |
| **文档完善** | 为每个包添加详细的 API 文档 | 低 |

---

## 二十、附录

### 20.1 常用命令速查

```bash
# 开发
pnpm --filter sdkwork-react-xxx dev          # Web 开发
pnpm --filter sdkwork-react-xxx tauri dev    # Tauri 开发

# 构建
pnpm --filter sdkwork-react-xxx build        # 构建库
pnpm --filter sdkwork-react-xxx build:app    # 构建 Web 应用
pnpm --filter sdkwork-react-xxx tauri build  # 构建 Tauri 应用

# 发布
pnpm --filter sdkwork-react-xxx publish      # 发布到 npm
```

### 20.2 目录结构速查

```
magic-studio-v2/
├── packages/                     # 所有包
│   ├── sdkwork-react-core/       # 核心包
│   ├── sdkwork-react-commons/    # 通用包
│   ├── sdkwork-react-image/      # 图片包 (四模式支持)
│   │   ├── src/                  # 源码
│   │   ├── src-tauri/            # Tauri 原生模块
│   │   ├── app/                  # 独立应用入口
│   │   └── package.json
│   └── ...                       # 其他包
├── docs/                         # 文档
├── package.json                  # 根 package.json
├── pnpm-workspace.yaml           # pnpm 工作区配置
└── tsconfig.json                 # TypeScript 配置
```

### 20.3 相关链接

| 资源 | 链接 |
|------|------|
| React 文档 | https://react.dev |
| TypeScript 文档 | https://www.typescriptlang.org/docs |
| Vite 文档 | https://vitejs.dev |
| Tauri 文档 | https://tauri.app |
| Zustand 文档 | https://zustand-demo.pmnd.rs |
| Tailwind CSS 文档 | https://tailwindcss.com/docs |

---

*文档版本: 4.0.0*
*最后更新: 2026-02-20*
