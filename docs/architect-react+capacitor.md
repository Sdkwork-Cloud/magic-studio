# SDKWork React 移动端技术架构文档

## 目录

1. [架构概述](#一架构概述)
2. [技术栈](#二技术栈)
3. [四模式包架构](#三四模式包架构)
4. [独立应用模块清单](#四独立应用模块清单)
5. [Capacitor 移动应用架构](#五capacitor-移动应用架构)
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

SDKWork React 移动端是一个基于 Monorepo 架构的前端应用框架，采用分层模块化设计，将业务功能拆分为独立的 npm 包。**每个包同时支持四种使用模式**：独立移动端 Web 应用部署、独立 Capacitor 原生移动应用部署、作为 Node.js 依赖包引入、作为 Capacitor 依赖包引入。

### 1.1 架构设计原则

| 原则 | 描述 | 实践方式 |
|------|------|----------|
| **分层架构** | 基础层 → 核心层 → 服务层 → 业务层，单向依赖 | 严格遵循层级依赖规则，禁止反向依赖 |
| **职责单一** | 每个包专注于单一功能领域 | 按功能域划分包边界 |
| **高内聚低耦合** | 包内部高内聚，包之间低耦合 | 通过接口和类型定义解耦 |
| **可复用性** | 通用功能下沉到基础包 | 公共组件、工具、类型统一管理 |
| **四模式统一** | 每个包支持四种使用模式 | 统一包结构，一套代码多场景使用 |
| **移动优先** | 以移动端体验为核心设计 | 响应式布局、触控优化、性能优化 |

### 1.2 四模式包架构

每个业务包同时支持以下四种使用模式：

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              四模式包架构                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        sdkwork-react-mobile-xxx 包                             │   │
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
│  │  │ 移动端 Web 应用 │    │Capacitor 原生应用│    │  依赖包引入     │    │   │
│  │  │                 │    │                 │    │                 │    │   │
│  │  │  apps/xxx-app/  │    │  capacitor/     │    │  npm publish    │    │   │
│  │  │  vite 构建      │    │  ios/android/   │    │  或 Capacitor   │    │   │
│  │  │  部署到 CDN     │    │  原生构建       │    │  依赖           │    │   │
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
│  │ 模式一: 移动端 Web 应用                                                    │ │
│  ├───────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                           │ │
│  │  使用场景: 移动端 H5、微信公众号、移动浏览器、PWA 应用                     │ │
│  │                                                                           │ │
│  │  运行方式:                                                                │ │
│  │    pnpm --filter sdkwork-mobile-xxx dev          # 开发模式              │ │
│  │    pnpm --filter sdkwork-mobile-xxx build        # 构建生产版本          │ │
│  │    pnpm --filter sdkwork-mobile-xxx preview      # 预览生产版本          │ │
│  │                                                                           │ │
│  │  部署方式:                                                                │ │
│  │    - 静态文件部署到 CDN (Cloudflare, Vercel, Netlify)                    │ │
│  │    - Docker 容器化部署                                                    │ │
│  │    - Nginx 反向代理部署                                                   │ │
│  │    - PWA 离线缓存支持                                                     │ │
│  │                                                                           │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │ 模式二: Capacitor 原生移动应用                                             │ │
│  ├───────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                           │ │
│  │  使用场景: App Store 发布、Google Play 发布、企业应用分发                 │ │
│  │                                                                           │ │
│  │  运行方式:                                                                │ │
│  │    pnpm --filter sdkwork-mobile-xxx cap:sync     # 同步原生平台          │ │
│  │    pnpm --filter sdkwork-mobile-xxx cap:ios      # iOS 开发              │ │
│  │    pnpm --filter sdkwork-mobile-xxx cap:android  # Android 开发          │ │
│  │                                                                           │ │
│  │  输出格式:                                                                │ │
│  │    - iOS: .ipa (App Store), .app (开发)                                  │ │
│  │    - Android: .apk, .aab (Google Play)                                   │ │
│  │                                                                           │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │ 模式三: Node.js 依赖包引入                                                 │ │
│  ├───────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                           │ │
│  │  使用场景: 集成到现有移动 Web 应用、模块化开发、按需加载                   │ │
│  │                                                                           │ │
│  │  安装方式:                                                                │ │
│  │    pnpm install sdkwork-mobile-xxx                                       │ │
│  │    npm install sdkwork-mobile-xxx                                        │ │
│  │    yarn add sdkwork-mobile-xxx                                           │ │
│  │                                                                           │ │
│  │  使用示例:                                                                │ │
│  │    import { XxxPage, XxxComponent, useXxxStore } from 'sdkwork-mobile-xxx'│
│  │                                                                           │ │
│  │  发布方式:                                                                │ │
│  │    pnpm --filter sdkwork-mobile-xxx publish                              │ │
│  │                                                                           │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │ 模式四: Capacitor 依赖包引入                                               │ │
│  ├───────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                           │ │
│  │  使用场景: 集成到现有 Capacitor 应用、移动应用模块化开发                   │ │
│  │                                                                           │ │
│  │  前端依赖 (package.json):                                                 │ │
│  │    {                                                                      │ │
│  │      "dependencies": {                                                    │ │
│  │        "sdkwork-mobile-xxx": "^1.0.0"                                     │ │
│  │      }                                                                    │ │
│  │    }                                                                      │ │
│  │                                                                           │ │
│  │  Capacitor 配置 (capacitor.config.ts):                                    │ │
│  │    import { CapacitorConfig } from '@capacitor/cli';                     │ │
│  │    const config: CapacitorConfig = {                                     │ │
│  │      plugins: [                                                          │ │
│  │        // 插件配置                                                        │ │
│  │      ]                                                                   │ │
│  │    };                                                                    │ │
│  │                                                                           │ │
│  │  使用示例:                                                                │ │
│  │    // 前端使用                                                            │ │
│  │    import { XxxPage } from 'sdkwork-mobile-xxx'                          │ │
│  │                                                                           │ │
│  │    // 平台能力调用                                                        │ │
│  │    import { Camera, Photo } from '@capacitor/camera';                    │ │
│  │                                                                           │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 1.4 四模式对比

| 特性 | 移动端 Web 应用 | Capacitor 原生应用 | Node.js 依赖包 | Capacitor 依赖包 |
|------|----------------|-------------------|----------------|------------------|
| **部署方式** | CDN/服务器 | App Store/Google Play | npm 发布 | npm 发布 |
| **运行环境** | 移动浏览器 | 原生 WebView | 宿主应用 | 宿主 Capacitor 应用 |
| **文件系统** | 受限 | 完整访问 | 受限 | 完整访问 |
| **设备 API** | 受限 | 完整支持 | 受限 | 完整支持 |
| **离线使用** | 需配置 PWA | 原生支持 | 取决于宿主 | 原生支持 |
| **推送通知** | 需第三方服务 | 原生支持 | 无 | 原生支持 |
| **更新方式** | 热更新 | 应用更新 | 包更新 | 包更新 |
| **应用商店** | 无需 | 需要 | 无需 | 无需 |
| **适用场景** | 移动 H5 | 原生 App | 模块集成 | 移动应用集成 |

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
pnpm --filter sdkwork-mobile-xxx add <package>

# 运行脚本
pnpm --filter sdkwork-mobile-xxx dev

# Capacitor 相关命令
pnpm --filter sdkwork-mobile-xxx cap:sync
pnpm --filter sdkwork-mobile-xxx cap:ios
pnpm --filter sdkwork-mobile-xxx cap:android
```

#### Vite 构建工具

本项目使用 **Vite** 作为构建工具，具有以下优势：

| 特性 | 描述 |
|------|------|
| **极速启动** | 原生 ESM 开发服务器，无需打包即可启动 |
| **即时热更新** | HMR 热更新速度快，无论项目规模 |
| **双模式构建** | 支持库模式和应用模式，一套配置两种输出 |
| **PWA 支持** | 通过 vite-plugin-pwa 支持 PWA 功能 |
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
      name: 'MyMobilePackage',
      formats: ['es', 'cjs'],
    },
  },
});

// vite.app.config.ts - 应用模式配置 (含 PWA)
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'My Mobile App',
        display: 'standalone',
      },
    }),
  ],
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

### 2.3 移动应用技术栈

| 技术 | 版本 | 用途 | 说明 |
|------|------|------|------|
| **Capacitor** | ^7.0.0 | 移动应用框架 | 跨平台原生运行时 |
| **Capacitor Plugins** | ^7.0.0 | 设备能力扩展 | 相机、文件系统、通知等 |
| **Ionic Native** | ^7.0.0 | 原生插件封装 | 更丰富的原生能力 |

### 2.3 移动端 UI 技术栈

| 技术 | 版本 | 用途 | 说明 |
|------|------|------|------|
| **Ionic Framework** | ^8.0.0 | 移动端 UI 组件 | 原生风格 UI 组件 |
| **Framer Motion** | ^12.0.0 | 动画库 | 流畅的手势动画 |
| **React Spring** | ^10.0.0 | 物理动画 | 自然的动画效果 |

### 2.4 编辑器技术栈

| 技术 | 版本 | 用途 | 说明 |
|------|------|------|------|
| **Monaco Editor** | ^0.47.0 | 代码编辑器 | VS Code 同款编辑器 |
| **TipTap** | ^2.0.0 | 富文本编辑器 | 可扩展，ProseMirror 内核 |

### 2.5 云服务技术栈

| 技术 | 版本 | 用途 | 说明 |
|------|------|------|------|
| **AWS SDK S3** | ^3.994.0 | 对象存储 | 文件上传、下载、预签名 |
| **Google GenAI** | ^1.42.0 | AI 服务 | Gemini API 集成 |
| **Firebase** | ^11.0.0 | 移动后端 | 推送通知、分析、认证 |

### 2.6 工具库

| 技术 | 版本 | 用途 | 说明 |
|------|------|------|------|
| **Lucide React** | ^0.475.0 | 图标库 | 1000+ 精美图标 |
| **classnames** | ^2.5.0 | 类名拼接 | 条件类名处理 |
| **immer** | ^11.0.0 | 不可变数据 | 简化状态更新 |
| **JSZip** | ^3.10.0 | ZIP 处理 | 文件压缩解压 |
| **markdown-it** | ^14.0.0 | Markdown 解析 | 高性能解析器 |
| **date-fns** | ^4.0.0 | 日期处理 | 轻量级日期库 |

### 2.7 开发工具

| 工具 | 版本 | 用途 |
|------|------|------|
| **pnpm** | ^8.0.0 | 包管理器 |
| **ESLint** | ^9.0.0 | 代码检查 |
| **Prettier** | ^3.0.0 | 代码格式化 |
| **Sharp** | ^0.34.0 | 图像处理 |

### 2.8 技术栈架构图

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              技术栈架构                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                            应用层                                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │   │
│  │  │   React     │  │  Zustand    │  │  Tailwind   │  │  TypeScript │    │   │
│  │  │   19.2.x    │  │   5.0.x     │  │   4.2.x     │  │   5.9.x     │    │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                            移动端 UI 层                                   │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                      │   │
│  │  │   Ionic     │  │   Framer    │  │   React     │                      │   │
│  │  │   8.x       │  │   Motion    │  │   Spring    │                      │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                      │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                            平台层                                         │   │
│  │  ┌─────────────────────────────┐  ┌─────────────────────────────┐       │   │
│  │  │       Mobile Web (PWA)      │  │      Capacitor Native       │       │   │
│  │  │    (Vite 7.3.x + React)     │  │    (iOS WebView/Android)    │       │   │
│  │  └─────────────────────────────┘  └─────────────────────────────┘       │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                            服务层                                         │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │   │
│  │  │  AWS S3     │  │ Google GenAI│  │  Firebase   │  │   JSZip     │    │   │
│  │  │  3.994.x    │  │   1.42.x    │  │   11.x      │  │   3.10.x    │    │   │
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
sdkwork-mobile-xxx/
├── src/                          # 统一源码 (四种模式共用)
│   ├── index.ts                  # 公共 API 导出
│   ├── components/               # UI 组件
│   │   ├── mobile/               # 移动端专用组件
│   │   └── shared/               # 共享组件
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
│   │       │   ├── action.ts     # 操作文案 (移动端特有)
│   │       │   └── error.ts      # 错误文案
│   │       └── en-US/            # 英文 (按业务模块拆分)
│   │           ├── index.ts      # 语言包入口
│   │           ├── common.ts     # Common
│   │           ├── page.ts       # Page
│   │           ├── form.ts       # Form
│   │           ├── message.ts    # Message
│   │           ├── action.ts     # Action
│   │           └── error.ts      # Error
│   └── platform/                 # 平台适配层
│       ├── index.ts              # 平台抽象入口
│       ├── web.ts                # Web 平台实现
│       └── capacitor.ts          # Capacitor 平台实现
│
├── capacitor/                    # Capacitor 配置 (可选)
│   ├── config.ts                 # Capacitor 配置
│   ├── ios/                      # iOS 原生代码
│   │   └── App/
│   │       └── App.swift
│   └── android/                  # Android 原生代码
│       └── app/src/main/
│           └── java/.../
│
├── app/                          # 独立应用入口 (模式一/二)
│   ├── main.tsx                  # 应用入口
│   ├── App.tsx                   # 根组件
│   ├── index.html                # HTML 模板
│   ├── manifest.json             # PWA 清单
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
├── capacitor.config.ts           # Capacitor 配置
└── README.md                     # 包文档
```

### 3.2 package.json 配置

```json
{
  "name": "sdkwork-mobile-xxx",
  "version": "1.0.0",
  "description": "XXX 移动端模块 - 支持移动端 Web 和 Capacitor 原生应用两种使用方式",
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
    "cap:sync": "cap sync",
    "cap:ios": "cap open ios",
    "cap:android": "cap open android",
    "cap:run:ios": "cap run ios",
    "cap:run:android": "cap run android",
    "cap:build:ios": "cap build ios",
    "cap:build:android": "cap build android",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src",
    "test": "vitest",
    "prepublishOnly": "pnpm build && pnpm build:types"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@capacitor/core": "^7.0.0",
    "@capacitor/app": "^7.0.0",
    "@capacitor/haptics": "^7.0.0",
    "@capacitor/keyboard": "^7.0.0",
    "@capacitor/status-bar": "^7.0.0",
    "sdkwork-mobile-core": "workspace:*",
    "sdkwork-mobile-commons": "workspace:*"
  },
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0",
    "@capacitor/core": ">=6.0.0"
  },
  "devDependencies": {
    "@capacitor/cli": "^7.0.0",
    "@capacitor/ios": "^7.0.0",
    "@capacitor/android": "^7.0.0",
    "@vitejs/plugin-react": "^5.0.0",
    "typescript": "^5.9.0",
    "vite": "^7.0.0",
    "vite-plugin-pwa": "^1.0.0",
    "vitest": "^1.0.0"
  },
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  },
  "keywords": [
    "react",
    "sdkwork",
    "capacitor",
    "mobile",
    "ios",
    "android",
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
      name: 'SdkworkMobileXxx',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', '@capacitor/core'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          '@capacitor/core': 'Capacitor',
        },
      },
    },
    sourcemap: true,
    minify: 'esbuild',
  },
});
```

#### 应用模式配置 (支持 PWA)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'SDKWork XXX',
        short_name: 'XXX',
        description: 'SDKWork XXX Mobile App',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24,
              },
            },
          },
        ],
      },
    }),
  ],
  root: 'app',
  publicDir: '../public',
  build: {
    outDir: '../dist-app',
    emptyOutDir: true,
    target: 'esnext',
    minify: 'esbuild',
  },
  server: {
    port: 3000,
    host: true,
  },
  resolve: {
    alias: {
      'sdkwork-mobile-xxx': resolve(__dirname, 'src/index.ts'),
    },
  },
});
```

### 3.4 Capacitor 配置

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sdkwork.xxx',
  appName: 'SDKWork XXX',
  webDir: 'dist-app',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#ffffff',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: false,
    scrollEnabled: true,
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
```

### 3.5 平台适配层

```typescript
// src/platform/index.ts
export interface PlatformAdapter {
  isNative(): boolean;
  getPlatform(): 'ios' | 'android' | 'web';
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  deleteFile(path: string): Promise<void>;
  showOpenDialog(options: OpenDialogOptions): Promise<string[] | null>;
  showSaveDialog(options: SaveDialogOptions): Promise<string | null>;
  notify(title: string, body: string): Promise<void>;
  vibrate(duration: number): Promise<void>;
  getDeviceInfo(): Promise<DeviceInfo>;
  takePhoto(): Promise<PhotoResult | null>;
  pickImage(): Promise<PhotoResult | null>;
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

export interface DeviceInfo {
  platform: 'ios' | 'android' | 'web';
  model: string;
  osVersion: string;
  appVersion: string;
  deviceId: string;
}

export interface PhotoResult {
  base64String?: string;
  dataUrl?: string;
  format: string;
  saved?: boolean;
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
    const isCapacitor = 'Capacitor' in window && (window as any).Capacitor?.isNativePlatform?.();
    if (isCapacitor) {
      const { CapacitorPlatformAdapter } = await import('./capacitor');
      adapter = new CapacitorPlatformAdapter();
    } else {
      const { WebPlatformAdapter } = await import('./web');
      adapter = new WebPlatformAdapter();
    }
  }
}
```

```typescript
// src/platform/web.ts
import type { PlatformAdapter, OpenDialogOptions, SaveDialogOptions, DeviceInfo, PhotoResult } from './index';

export class WebPlatformAdapter implements PlatformAdapter {
  isNative(): boolean {
    return false;
  }

  getPlatform(): 'web' {
    return 'web';
  }

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

  async vibrate(duration: number): Promise<void> {
    if ('vibrate' in navigator) {
      navigator.vibrate(duration);
    }
  }

  async getDeviceInfo(): Promise<DeviceInfo> {
    const ua = navigator.userAgent;
    return {
      platform: 'web',
      model: 'browser',
      osVersion: ua,
      appVersion: '1.0.0',
      deviceId: 'web-' + Date.now(),
    };
  }

  async takePhoto(): Promise<PhotoResult | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      
      input.onchange = () => {
        const file = input.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              dataUrl: reader.result as string,
              format: file.type.split('/')[1] || 'jpeg',
            });
          };
          reader.readAsDataURL(file);
        } else {
          resolve(null);
        }
      };
      
      input.click();
    });
  }

  async pickImage(): Promise<PhotoResult | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      
      input.onchange = () => {
        const file = input.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              dataUrl: reader.result as string,
              format: file.type.split('/')[1] || 'jpeg',
            });
          };
          reader.readAsDataURL(file);
        } else {
          resolve(null);
        }
      };
      
      input.click();
    });
  }
}
```

```typescript
// src/platform/capacitor.ts
import type { PlatformAdapter, OpenDialogOptions, SaveDialogOptions, DeviceInfo, PhotoResult } from './index';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Device } from '@capacitor/device';
import { Capacitor } from '@capacitor/core';

export class CapacitorPlatformAdapter implements PlatformAdapter {
  isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  getPlatform(): 'ios' | 'android' | 'web' {
    return Capacitor.getPlatform() as 'ios' | 'android' | 'web';
  }

  async readFile(path: string): Promise<string> {
    const result = await Filesystem.readFile({
      path,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    });
    return result.data as string;
  }

  async writeFile(path: string, content: string): Promise<void> {
    await Filesystem.writeFile({
      path,
      data: content,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    });
  }

  async deleteFile(path: string): Promise<void> {
    await Filesystem.deleteFile({
      path,
      directory: Directory.Data,
    });
  }

  async showOpenDialog(_options: OpenDialogOptions): Promise<string[] | null> {
    const result = await Camera.pickImages({
      quality: 90,
    });
    return result.photos.map(p => p.path || '');
  }

  async showSaveDialog(_options: SaveDialogOptions): Promise<string | null> {
    throw new Error('Save dialog not supported on mobile');
  }

  async notify(title: string, body: string): Promise<void> {
    await LocalNotifications.schedule({
      notifications: [
        {
          title,
          body,
          id: Date.now(),
          schedule: { at: new Date(Date.now() + 100) },
        },
      ],
    });
  }

  async vibrate(_duration: number): Promise<void> {
    await Haptics.impact({ style: ImpactStyle.Medium });
  }

  async getDeviceInfo(): Promise<DeviceInfo> {
    const info = await Device.getInfo();
    const appInfo = await Device.getAppInfo();
    return {
      platform: info.platform as 'ios' | 'android' | 'web',
      model: info.model || 'unknown',
      osVersion: info.osVersion || 'unknown',
      appVersion: appInfo.version || '1.0.0',
      deviceId: info.identifier || 'unknown',
    };
  }

  async takePhoto(): Promise<PhotoResult | null> {
    const photo = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
    });
    return {
      dataUrl: photo.dataUrl || undefined,
      base64String: photo.base64String || undefined,
      format: photo.format,
      saved: photo.saved,
    };
  }

  async pickImage(): Promise<PhotoResult | null> {
    const photo = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Photos,
    });
    return {
      dataUrl: photo.dataUrl || undefined,
      base64String: photo.base64String || undefined,
      format: photo.format,
    };
  }
}
```

### 3.5 独立路由配置

每个业务包拥有独立的路由配置，支持默认导出和覆盖配置能力。

#### 3.5.1 路由配置结构

```
sdkwork-mobile-xxx/
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
  /** 底部导航配置 (移动端特有) */
  tabBar?: TabBarConfig;
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
  hideHeader?: boolean;
  hideTabBar?: boolean;
  keepAlive?: boolean;
}

export interface TabBarConfig {
  visible: boolean;
  items: TabBarItem[];
}

export interface TabBarItem {
  path: string;
  label: string;
  icon: string;
  activeIcon: string;
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
    },
    {
      path: 'detail/:id',
      element: <XxxDetailPage />,
    },
    {
      path: 'settings',
      element: <XxxSettingsPage />,
    },
  ],
  meta: {
    '/xxx': { title: 'XXX 模块', hideHeader: false, hideTabBar: false },
    '/xxx/detail/:id': { title: '详情', hideHeader: false, hideTabBar: true },
    '/xxx/settings': { title: '设置', hideHeader: false, hideTabBar: true },
  },
  tabBar: {
    visible: true,
    items: [
      {
        path: '/xxx',
        label: '首页',
        icon: 'home-outline',
        activeIcon: 'home',
      },
    ],
  },
};

export default defaultRoutes;
```

#### 3.5.3 路由导出与合并

```typescript
// src/router/index.ts
export { defaultRoutes } from './routes';
export type { PackageRouteConfig, RouteGuard, RouteMeta, TabBarConfig, TabBarItem } from './types';

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
    tabBar: overrides.tabBar ? { ...defaultRoutes.tabBar, ...overrides.tabBar } : defaultRoutes.tabBar,
  };
}

/**
 * 获取路由列表 (用于注册到宿主应用)
 */
export function getRoutes(basePath?: string): PackageRouteConfig['routes'] {
  const prefix = basePath ?? defaultRoutes.basePath;
  return defaultRoutes.routes.map(route => ({
    ...route,
    path: `${prefix}/${route.path}`.replace(/\/+/g, '/'),
  }));
}

/**
 * 获取 TabBar 配置
 */
export function getTabBarConfig(): PackageRouteConfig['tabBar'] {
  return defaultRoutes.tabBar;
}
```

#### 3.5.4 宿主应用集成

```typescript
// 宿主应用 - 路由合并
import { createBrowserRouter } from 'react-router-dom';
import { getRoutes as getImageRoutes, createRoutes as createImageRoutes } from 'sdkwork-mobile-image';
import { getRoutes as getVideoRoutes, createRoutes as createVideoRoutes } from 'sdkwork-mobile-video';

// 方式一: 使用默认配置
const routes = [
  { path: '/', element: <HomePage /> },
  ...getImageRoutes(),
  ...getVideoRoutes(),
];

// 方式二: 覆盖配置
const imageRoutes = createImageRoutes({
  basePath: '/ai-image',  // 覆盖路由前缀
  tabBar: {
    visible: true,
    items: [
      { path: '/ai-image', label: 'AI图片', icon: 'image-outline', activeIcon: 'image' },
    ],
  },
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
sdkwork-mobile-xxx/
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
│   │       │   ├── action.ts       # 操作文案 (移动端特有)
│   │       │   └── error.ts        # 错误文案
│   │       └── en-US/              # 英文 (按业务模块拆分)
│   │           ├── index.ts        # 语言包入口
│   │           ├── common.ts       # Common
│   │           ├── page.ts         # Page
│   │           ├── form.ts         # Form
│   │           ├── message.ts      # Message
│   │           ├── action.ts       # Action
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
  /** 操作文案 (移动端特有) */
  action?: I18nActionResource;
  /** 错误文案 */
  error?: I18nErrorResource;
  /** 其他业务模块 */
  [module: string]: I18nModuleResource | undefined;
}

/** 模块资源基础接口 */
export interface I18nModuleResource {
  [key: string]: string | I18nModuleResource;
}

/** 通用文案 (移动端扩展) */
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
  pullDown: string;
  loadMore: string;
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
  networkError: string;
}

/** 操作文案 (移动端特有) */
export interface I18nActionResource extends I18nModuleResource {
  share: string;
  download: string;
  copy: string;
  preview: string;
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
  pullDown: '下拉刷新',
  loadMore: '加载更多',
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
  networkError: '网络错误，请稍后重试',
};
```

```typescript
// src/i18n/locales/zh-CN/action.ts
import type { I18nActionResource } from '../../types';

export const action: I18nActionResource = {
  share: '分享',
  download: '下载',
  copy: '复制',
  preview: '预览',
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
import { action } from './action';
import { error } from './error';

export const zhCN: I18nNamespaceResource = {
  common,
  page,
  form,
  message,
  action,
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
  pullDown: 'Pull to refresh',
  loadMore: 'Load more',
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
  networkError: 'Network error, please try again later',
};
```

```typescript
// src/i18n/locales/en-US/action.ts
import type { I18nActionResource } from '../../types';

export const action: I18nActionResource = {
  share: 'Share',
  download: 'Download',
  copy: 'Copy',
  preview: 'Preview',
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
import { action } from './action';
import { error } from './error';

export const enUS: I18nNamespaceResource = {
  common,
  page,
  form,
  message,
  action,
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
  I18nActionResource,
  I18nErrorResource,
  SupportedLocale 
} from './types';

import zhCN from './locales/zh-CN';
import enUS from './locales/en-US';
import type { PackageI18nConfig, I18nNamespaceResource, SupportedLocale } from './types';

/**
 * 包命名空间 (建议使用包名简写)
 * sdkwork-mobile-image -> image
 * sdkwork-mobile-video -> video
 * sdkwork-mobile-audio -> audio
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
} from 'sdkwork-mobile-image';
import { 
  getResources as getVideoResources,
  getNamespace as getVideoNamespace 
} from 'sdkwork-mobile-video';
import { 
  getResources as getAudioResources,
  getNamespace as getAudioNamespace 
} from 'sdkwork-mobile-audio';

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
import { NAMESPACE } from 'sdkwork-mobile-xxx/i18n';

export function XxxComponent() {
  const { t } = useTranslation(NAMESPACE);
  
  return (
    <div>
      <h1>{t('common.title')}</h1>
      <button>{t('common.create')}</button>
      <p>{t('message.createSuccess')}</p>
      <button>{t('action.share')}</button>
      <span>{t('error.networkError')}</span>
    </div>
  );
}
```

#### 3.6.7 命名空间规范

| 包名 | 命名空间 | 翻译键示例 |
|------|----------|-----------|
| sdkwork-mobile-image | `image` | `image.common.create` |
| sdkwork-mobile-video | `video` | `video.common.create` |
| sdkwork-mobile-audio | `audio` | `audio.common.create` |
| sdkwork-mobile-music | `music` | `music.common.create` |
| sdkwork-mobile-editor | `editor` | `editor.common.create` |
| sdkwork-mobile-notes | `notes` | `notes.common.create` |
| sdkwork-mobile-drive | `drive` | `drive.common.create` |
| sdkwork-mobile-chat | `chat` | `chat.common.create` |

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
  getRoutes,
  getTabBarConfig
} from './router';
export type { 
  PackageRouteConfig, 
  RouteGuard, 
  RouteMeta,
  TabBarConfig,
  TabBarItem
} from './router';

// ============ 国际化配置 ============
export { 
  defaultI18nConfig, 
  createI18nConfig, 
  getResources, 
  getNamespace,
  getI18nKey,
  NAMESPACE
} from './i18n';
export type { 
  PackageI18nConfig, 
  I18nNamespaceResource,
  I18nModuleResource,
  I18nCommonResource,
  I18nPageResource,
  I18nFormResource,
  I18nMessageResource,
  I18nActionResource,
  I18nErrorResource,
  SupportedLocale 
} from './i18n';
```

---

## 四、独立应用模块清单

### 4.1 独立应用模块列表

以下业务模块支持四种使用模式：

| 模块名称 | 包名 | 移动端 Web | Capacitor App | npm 包 | Capacitor 依赖 |
|---------|------|-----------|---------------|--------|----------------|
| 图片生成 | sdkwork-mobile-image | ✅ | ✅ | ✅ | ✅ |
| 视频生成 | sdkwork-mobile-video | ✅ | ✅ | ✅ | ✅ |
| 音频生成 | sdkwork-mobile-audio | ✅ | ✅ | ✅ | ✅ |
| 音乐生成 | sdkwork-mobile-music | ✅ | ✅ | ✅ | ✅ |
| 语音合成 | sdkwork-mobile-voicespeaker | ✅ | ✅ | ✅ | ✅ |
| 智能剪辑 | sdkwork-mobile-magiccut | ✅ | ✅ | ✅ | ✅ |
| 画布编辑 | sdkwork-mobile-canvas | ✅ | ✅ | ✅ | ✅ |
| 笔记应用 | sdkwork-mobile-notes | ✅ | ✅ | ✅ | ✅ |
| 影片制作 | sdkwork-mobile-film | ✅ | ✅ | ✅ | ✅ |
| 视频门户 | sdkwork-mobile-portal-video | ✅ | ✅ | ✅ | ✅ |
| 云盘 | sdkwork-mobile-drive | ✅ | ✅ | ✅ | ✅ |
| 代码编辑器 | sdkwork-mobile-editor | ✅ | ✅ | ✅ | ✅ |
| PPT生成 | sdkwork-mobile-chatppt | ✅ | ✅ | ✅ | ✅ |
| 聊天 | sdkwork-mobile-chat | ✅ | ✅ | ✅ | ✅ |

### 4.2 模块使用示例

#### 作为移动端 Web 应用运行

```bash
# 开发模式
pnpm --filter sdkwork-mobile-image dev

# 构建生产版本
pnpm --filter sdkwork-mobile-image build:app

# 预览生产版本
pnpm --filter sdkwork-mobile-image preview
```

#### 作为 Capacitor 原生应用运行

```bash
# 同步原生平台
pnpm --filter sdkwork-mobile-image cap:sync

# iOS 开发
pnpm --filter sdkwork-mobile-image cap:ios
# 然后在 Xcode 中运行

# Android 开发
pnpm --filter sdkwork-mobile-image cap:android
# 然后在 Android Studio 中运行

# 命令行运行
pnpm --filter sdkwork-mobile-image cap:run:ios
pnpm --filter sdkwork-mobile-image cap:run:android
```

#### 作为 Node.js 依赖包使用

```bash
# 安装
pnpm install sdkwork-mobile-image

# 使用
import { ImagePage, useImageStore } from 'sdkwork-mobile-image';
```

#### 作为 Capacitor 依赖包使用

```json
// package.json
{
  "dependencies": {
    "sdkwork-mobile-image": "^1.0.0"
  }
}
```

```typescript
// 在 Capacitor 应用中使用
import { ImagePage } from 'sdkwork-mobile-image';

// 平台适配层自动检测 Capacitor 环境
import { initializePlatform } from 'sdkwork-mobile-image/platform';
await initializePlatform();
```

---

## 五、Capacitor 移动应用架构

### 5.1 Capacitor 架构概述

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            Capacitor 应用架构                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │                            前端层 (WebView)                                │ │
│  │  ┌─────────────────────────────────────────────────────────────────────┐ │ │
│  │  │  React Application                                                   │ │ │
│  │  │  ├── UI Components (from sdkwork-mobile-xxx packages)               │ │ │
│  │  │  ├── State Management (Zustand)                                     │ │ │
│  │  │  ├── Platform Adapter (自动检测 Capacitor 环境)                     │ │ │
│  │  │  └── Capacitor Plugins Bridge (@capacitor/*)                        │ │ │
│  │  └─────────────────────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                          │
│                                      │ JS Bridge                               │
│                                      ▼                                          │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │                            Capacitor 运行时                                │ │
│  │  ┌─────────────────────────────────────────────────────────────────────┐ │ │
│  │  │  Capacitor Core                                                      │ │ │
│  │  │  ├── Plugin System (插件系统)                                        │ │ │
│  │  │  ├── Event System (事件系统)                                         │ │ │
│  │  │  ├── Storage (存储)                                                  │ │ │
│  │  │  └── Platform Detection (平台检测)                                   │ │ │
│  │  └─────────────────────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                          │
│                    ┌─────────────────┴─────────────────┐                       │
│                    ▼                                   ▼                        │
│  ┌─────────────────────────────┐     ┌─────────────────────────────┐          │
│  │         iOS Native          │     │       Android Native        │          │
│  │  ┌───────────────────────┐  │     │  ┌───────────────────────┐  │          │
│  │  │  WKWebView            │  │     │  │  WebView              │  │          │
│  │  │  Swift/Kotlin Bridge  │  │     │  │  JavaScript Bridge    │  │          │
│  │  │  Native Plugins      │  │     │  │  Native Plugins       │  │          │
│  │  └───────────────────────┘  │     │  └───────────────────────┘  │          │
│  └─────────────────────────────┘     └─────────────────────────────┘          │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Capacitor 插件依赖

每个包可使用的 Capacitor 插件：

| 插件名称 | 功能描述 | 使用场景 |
|---------|---------|---------|
| @capacitor/app | 应用生命周期 | 所有应用 |
| @capacitor/camera | 相机拍照/相册 | image, canvas, notes |
| @capacitor/filesystem | 文件系统操作 | 所有应用 |
| @capacitor/haptics | 触觉反馈 | 所有应用 |
| @capacitor/keyboard | 键盘控制 | editor, notes, chat |
| @capacitor/local-notifications | 本地通知 | 所有应用 |
| @capacitor/push-notifications | 推送通知 | chat, drive |
| @capacitor/share | 系统分享 | 所有应用 |
| @capacitor/splash-screen | 启动画面 | 所有应用 |
| @capacitor/status-bar | 状态栏 | 所有应用 |
| @capacitor/geolocation | 地理位置 | browser, drive |
| @capacitor/device | 设备信息 | 所有应用 |
| @capacitor/network | 网络状态 | 所有应用 |
| @capacitor/preferences | 本地存储 | 所有应用 |
| @capacitor/browser | 浏览器打开 | browser, chat |
| @capacitor/clipboard | 剪贴板 | editor, notes |
| @capacitor/action-sheet | 操作菜单 | 所有应用 |
| @capacitor/dialog | 对话框 | 所有应用 |
| @capacitor/toast | 提示消息 | 所有应用 |

### 5.3 iOS 原生配置

```xml
<!-- ios/App/App/Info.plist -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDisplayName</key>
    <string>SDKWork XXX</string>
    <key>CFBundleIdentifier</key>
    <string>com.sdkwork.xxx</string>
    <key>NSCameraUsageDescription</key>
    <string>需要访问相机以拍摄照片</string>
    <key>NSPhotoLibraryUsageDescription</key>
    <string>需要访问相册以选择照片</string>
    <key>NSMicrophoneUsageDescription</key>
    <string>需要访问麦克风以录制音频</string>
    <key>NSLocationWhenInUseUsageDescription</key>
    <string>需要获取位置信息</string>
    <key>UIBackgroundModes</key>
    <array>
        <string>remote-notification</string>
        <string>audio</string>
    </array>
</dict>
</plist>
```

### 5.4 Android 原生配置

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.VIBRATE" />
    
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme">
        
        <activity
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:name=".MainActivity"
            android:label="@string/title_activity_main"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:launchMode="singleTask"
            android:exported="true">
            
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

---

## 六、分包层级结构

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              层级 0: 基础设施层                                   │
│  (无内部依赖，提供最底层的能力抽象)                                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│  sdkwork-mobile-core         核心平台能力 (路由、状态管理、事件总线、平台抽象)      │
│  sdkwork-mobile-i18n         国际化服务                                          │
│  sdkwork-mobile-notifications 通知中心                                            │
│  sdkwork-mobile-compression  压缩服务                                            │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              层级 1: 通用基础层                                   │
│  (依赖基础设施层，提供通用组件和工具)                                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│  sdkwork-mobile-commons      通用UI组件、类型定义、工具函数、算法                  │
│  sdkwork-mobile-fs           虚拟文件系统                                        │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              层级 2: 服务层                                       │
│  (提供业务无关的基础服务)                                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│  sdkwork-mobile-assets       资产管理服务 (上传、存储、检索)                       │
│  sdkwork-mobile-settings     设置管理服务                                        │
│  sdkwork-mobile-auth         认证授权服务                                        │
│  sdkwork-mobile-vip          VIP会员服务                                         │
│  sdkwork-mobile-workspace    工作空间管理                                        │
│  sdkwork-mobile-generation-history  生成历史组件                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              层级 3: 业务功能层                                   │
│  (具体业务功能模块，支持四种使用模式)                                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─ 媒体生成模块 ─────────────────────────────────────────────────────────────┐  │
│  │  🖼️ sdkwork-mobile-image       图片生成        [四模式支持]               │  │
│  │  🎬 sdkwork-mobile-video       视频生成        [四模式支持]               │  │
│  │  🎵 sdkwork-mobile-audio       音频生成        [四模式支持]               │  │
│  │  🎶 sdkwork-mobile-music       音乐生成        [四模式支持]               │  │
│  │  🔊 sdkwork-mobile-sfx         音效生成        [四模式支持]               │  │
│  │  🎤 sdkwork-mobile-voicespeaker 语音合成       [四模式支持]               │  │
│  │  👤 sdkwork-mobile-character   数字人生成      [四模式支持]               │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
│  ┌─ 编辑器模块 ───────────────────────────────────────────────────────────────┐  │
│  │  💻 sdkwork-mobile-editor      代码编辑器      [四模式支持]               │  │
│  │  🎨 sdkwork-mobile-canvas      画布编辑器      [四模式支持]               │  │
│  │  📝 sdkwork-mobile-notes       笔记应用        [四模式支持]               │  │
│  │  📊 sdkwork-mobile-chatppt     PPT生成         [四模式支持]               │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
│  ┌─ 应用模块 ─────────────────────────────────────────────────────────────────┐  │
│  │  📁 sdkwork-mobile-drive       云盘            [四模式支持]               │  │
│  │  🎞️ sdkwork-mobile-film        影片制作        [四模式支持]               │  │
│  │  ✂️ sdkwork-mobile-magiccut    智能剪辑        [四模式支持]               │  │
│  │  📺 sdkwork-mobile-portal-video 视频门户       [四模式支持]               │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
│  ┌─ 通信模块 ─────────────────────────────────────────────────────────────────┐  │
│  │  💬 sdkwork-mobile-chat        聊天功能        [四模式支持]               │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
│  sdkwork-mobile-user         用户中心                                           │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 七、包开发指南

### 7.1 创建新包

```bash
# 创建包目录
mkdir -p packages/sdkwork-mobile-xxx/src

# 创建基础文件
touch packages/sdkwork-mobile-xxx/src/index.ts
touch packages/sdkwork-mobile-xxx/package.json
touch packages/sdkwork-mobile-xxx/tsconfig.json
touch packages/sdkwork-mobile-xxx/vite.config.ts
touch packages/sdkwork-mobile-xxx/vite.app.config.ts
touch packages/sdkwork-mobile-xxx/capacitor.config.ts
```

### 7.2 开发流程

```bash
# 1. 开发模式 (作为移动端 Web 应用)
pnpm --filter sdkwork-mobile-xxx dev

# 2. 构建库模式
pnpm --filter sdkwork-mobile-xxx build

# 3. 构建应用模式
pnpm --filter sdkwork-mobile-xxx build:app

# 4. 同步 Capacitor 平台
pnpm --filter sdkwork-mobile-xxx cap:sync

# 5. iOS 开发
pnpm --filter sdkwork-mobile-xxx cap:ios

# 6. Android 开发
pnpm --filter sdkwork-mobile-xxx cap:android

# 7. 类型检查
pnpm --filter sdkwork-mobile-xxx typecheck

# 8. 测试
pnpm --filter sdkwork-mobile-xxx test
```

### 7.3 发布流程

```bash
# 1. 确保代码质量
pnpm --filter sdkwork-mobile-xxx lint
pnpm --filter sdkwork-mobile-xxx typecheck
pnpm --filter sdkwork-mobile-xxx test

# 2. 构建产物
pnpm --filter sdkwork-mobile-xxx build

# 3. 发布到 npm
pnpm --filter sdkwork-mobile-xxx publish

# 4. 构建 Capacitor 应用 (可选)
pnpm --filter sdkwork-mobile-xxx build:app
pnpm --filter sdkwork-mobile-xxx cap:sync
pnpm --filter sdkwork-mobile-xxx cap:build:ios
pnpm --filter sdkwork-mobile-xxx cap:build:android
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
│  packages/sdkwork-mobile-xxx/package.json                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  {                                                                       │   │
│  │    "dependencies": {                                                     │   │
│  │      "sdkwork-mobile-core": "workspace:*",                               │   │
│  │      "sdkwork-mobile-commons": "workspace:*"                             │   │
│  │    },                                                                    │   │
│  │    "peerDependencies": {                                                 │   │
│  │      "react": ">=18.0.0",                                                │   │
│  │      "react-dom": ">=18.0.0",                                            │   │
│  │      "@capacitor/core": ">=6.0.0"                                        │   │
│  │    }                                                                     │   │
│  │  }                                                                       │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  宿主应用 package.json                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  {                                                                       │   │
│  │    "dependencies": {                                                     │   │
│  │      "sdkwork-mobile-xxx": "^1.0.0",                                     │   │
│  │      # 间接依赖会自动传递:                                                │   │
│  │      # - sdkwork-mobile-core                                             │   │
│  │      # - sdkwork-mobile-commons                                          │   │
│  │    },                                                                    │   │
│  │    "peerDependencies": {                                                 │   │
│  │      "react": "^19.0.0",                                                 │   │
│  │      "react-dom": "^19.0.0",                                             │   │
│  │      "@capacitor/core": "^7.0.0"                                         │   │
│  │    }                                                                     │   │
│  │  }                                                                       │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 8.3 Capacitor 依赖处理

```typescript
// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sdkwork.hostapp',
  appName: 'SDKWork Host App',
  webDir: 'dist',
  plugins: {
    // 公共插件配置
  },
};

export default config;
```

---

## 九、包详细说明

### 9.1 基础设施层 (Layer 0)

#### sdkwork-mobile-core
**描述**: 核心平台能力包，提供应用运行的基础设施

**四模式支持**: ✅ 移动端Web | ✅ Capacitor应用 | ✅ npm包 | ✅ Capacitor依赖

**主要功能**:
- 路由管理 (移动端路由适配)
- 状态管理
- 事件总线
- 平台抽象 (Capacitor/Web)
- AI 服务集成
- 通用工具函数

**依赖**: 无内部依赖

---

#### sdkwork-mobile-i18n
**描述**: 国际化服务包，提供多语言支持

**四模式支持**: ✅ 移动端Web | ✅ Capacitor应用 | ✅ npm包 | ✅ Capacitor依赖

**主要功能**:
- I18nService: 国际化服务类
- 语言资源管理
- 翻译函数
- 语言切换

**依赖**: 无内部依赖

---

### 9.2 通用基础层 (Layer 1)

#### sdkwork-mobile-commons
**描述**: 通用UI组件和工具包，是所有业务包的基础

**四模式支持**: ✅ 移动端Web | ✅ Capacitor应用 | ✅ npm包 | ✅ Capacitor依赖

**主要功能**:
- 移动端通用组件: MobileButton, MobileCard, MobileGallery 等
- 工具函数: generateUUID, formatDate 等
- 类型定义: ImageTask, MediaType 等
- 平台适配层: PlatformAdapter
- 触控手势处理

**依赖**: core, i18n

---

### 9.3 服务层 (Layer 2)

#### sdkwork-mobile-assets
**描述**: 资产管理服务包，提供媒体资源的上传、存储、检索功能

**四模式支持**: ✅ 移动端Web | ✅ Capacitor应用 | ✅ npm包 | ✅ Capacitor依赖

**主要功能**:
- 资产服务: assetService
- 资产选择器: ChooseAsset, ChooseAssetModal
- 资产存储: useAssetStore, AssetStoreProvider
- 相机/相册集成

**依赖**: commons, core, fs, settings, i18n

---

### 9.4 业务功能层 (Layer 3)

#### sdkwork-mobile-image 🖼️
**描述**: 图片生成模块，提供AI图片生成功能

**四模式支持**: ✅ 移动端Web | ✅ Capacitor应用 | ✅ npm包 | ✅ Capacitor依赖

**主要功能**:
- 图片生成页面: ImagePage, ImageChatPage
- 图片编辑器: ImageGridEditorModal, ImageCanvasEditorModal
- AI生成弹窗: AIImageGeneratorModal
- 图片存储: ImageStoreProvider, useImageStore
- 相机拍照集成

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
         generation-     editor          chat        canvas
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
sdkwork-mobile-xxx/
├── src/                          # 统一源码
│   ├── index.ts                  # 公共 API 导出
│   ├── components/               # UI 组件
│   │   ├── mobile/               # 移动端专用组件
│   │   └── shared/               # 共享组件
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
├── capacitor/                    # Capacitor 配置
├── app/                          # 独立应用入口
├── dist/                         # 构建产物
├── package.json
├── tsconfig.json
├── vite.config.ts                # 库模式配置
├── vite.app.config.ts            # 应用模式配置
├── capacitor.config.ts           # Capacitor 配置
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
  getRoutes,
  getTabBarConfig
} from './router';
export type { 
  PackageRouteConfig, 
  RouteGuard, 
  RouteMeta,
  TabBarConfig,
  TabBarItem
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

### 12.1 移动端性能优化

| 优化项 | 描述 | 实践方式 |
|--------|------|----------|
| **React.memo** | 避免不必要的重渲染 | 对纯展示组件使用 memo |
| **useMemo** | 缓存计算结果 | 复杂计算、大数组过滤等 |
| **useCallback** | 缓存回调函数 | 传递给子组件的回调 |
| **虚拟列表** | 大列表渲染优化 | 使用虚拟滚动组件 |
| **图片懒加载** | 延迟加载图片 | 使用 loading="lazy" |
| **代码分割** | 按需加载 | 路由级别懒加载 |

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
    target: 'esnext',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          capacitor: ['@capacitor/core', '@capacitor/app'],
          ui: ['lucide-react', 'classnames'],
        },
      },
    },
  },
});
```

### 12.4 PWA 缓存策略

```typescript
// vite.app.config.ts - PWA 配置
VitePWA({
  workbox: {
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/api\./i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24,
          },
        },
      },
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'image-cache',
          expiration: {
            maxEntries: 60,
            maxAgeSeconds: 60 * 60 * 24 * 30,
          },
        },
      },
    ],
  },
})
```

---

## 十三、安全开发规范

### 13.1 敏感信息处理

| 规范 | 描述 |
|------|------|
| **禁止硬编码密钥** | API Key、密钥等必须通过环境变量配置 |
| **环境变量管理** | 使用 `.env.local` 存储敏感配置 |
| **日志脱敏** | 禁止在日志中输出用户敏感信息 |
| **HTTPS 强制** | 生产环境必须使用 HTTPS |

### 13.2 Capacitor 安全配置

```typescript
// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sdkwork.xxx',
  appName: 'SDKWork XXX',
  webDir: 'dist',
  server: {
    // 生产环境禁用本地服务器
    androidScheme: 'https',
    iosScheme: 'https',
  },
  ios: {
    // iOS 安全配置
    allowsLinkPreview: false,
  },
  android: {
    // Android 安全配置
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
```

### 13.3 Content Security Policy

```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://api.example.com;
  media-src 'self' https:;
">
```

---

## 十四、测试策略

### 14.1 测试类型

| 测试类型 | 覆盖率要求 | 工具 |
|----------|------------|------|
| **单元测试** | ≥ 70% | Vitest |
| **组件测试** | ≥ 60% | Vitest + Testing Library |
| **E2E 测试** | 核心流程 | Playwright / Appium |
| **类型检查** | 100% | TypeScript |

### 14.2 测试命令

```bash
# 运行所有测试
pnpm test

# 运行特定包的测试
pnpm --filter sdkwork-mobile-xxx test

# 运行测试并生成覆盖率报告
pnpm test:coverage

# E2E 测试
pnpm test:e2e
```

### 14.3 移动端测试

```bash
# iOS 模拟器测试
pnpm --filter sdkwork-mobile-xxx cap:run:ios --target='iPhone-15'

# Android 模拟器测试
pnpm --filter sdkwork-mobile-xxx cap:run:android

# 真机测试
# iOS: 通过 Xcode 运行到真机
# Android: 通过 Android Studio 运行到真机
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

export class NetworkError extends AppError {
  constructor(message: string, details?: unknown) {
    super('NETWORK_ERROR', message, details);
    this.name = 'NetworkError';
  }
}

export class PlatformError extends AppError {
  constructor(message: string, details?: unknown) {
    super('PLATFORM_ERROR', message, details);
    this.name = 'PlatformError';
  }
}
```

### 15.2 日志规范

```typescript
class Logger {
  private isProduction = import.meta.env.PROD;
  
  debug(message: string, ...args: unknown[]) {
    if (!this.isProduction) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }
  
  info(message: string, ...args: unknown[]) {
    console.info(`[INFO] ${message}`, ...args);
  }
  
  warn(message: string, ...args: unknown[]) {
    console.warn(`[WARN] ${message}`, ...args);
  }
  
  error(message: string, error?: Error) {
    console.error(`[ERROR] ${message}`, error);
    // 生产环境可上报到错误监控服务
    if (this.isProduction) {
      this.reportError(message, error);
    }
  }
  
  private reportError(message: string, error?: Error) {
    // 上报错误到监控服务
  }
}

export const logger = new Logger();
```

---

## 十六、构建与发布

### 16.1 构建命令

```bash
# 构建库模式 (npm 包)
pnpm --filter sdkwork-mobile-xxx build

# 构建应用模式 (移动端 Web 应用)
pnpm --filter sdkwork-mobile-xxx build:app

# 同步 Capacitor 平台
pnpm --filter sdkwork-mobile-xxx cap:sync

# 构建 iOS 应用
pnpm --filter sdkwork-mobile-xxx cap:build:ios

# 构建 Android 应用
pnpm --filter sdkwork-mobile-xxx cap:build:android
```

### 16.2 发布流程

```bash
# 发布到 npm
pnpm --filter sdkwork-mobile-xxx publish

# 发布 iOS 应用 (需要 Xcode)
# 1. pnpm --filter sdkwork-mobile-xxx cap:ios
# 2. 在 Xcode 中 Archive 并上传到 App Store

# 发布 Android 应用 (需要 Android Studio)
# 1. pnpm --filter sdkwork-mobile-xxx cap:android
# 2. 在 Android Studio 中 Build Signed Bundle/APK
# 3. 上传到 Google Play Console
```

### 16.3 应用商店发布

#### iOS App Store

1. 配置 Apple Developer 账号
2. 在 Xcode 中配置签名证书
3. Archive 应用
4. 上传到 App Store Connect
5. 提交审核

#### Google Play Store

1. 配置 Google Play Developer 账号
2. 生成签名密钥
3. 构建 Signed App Bundle
4. 上传到 Google Play Console
5. 提交审核

---

## 十七、命名规范

### 17.1 包命名规范

| 类型 | 格式 | 示例 |
|------|------|------|
| React 包 | `sdkwork-mobile-xxx` | `sdkwork-mobile-image` |
| Capacitor 配置 | `capacitor.config.ts` | 包根目录 |
| 应用目录 | `app/` | 包内 app 目录 |

### 17.2 移动端组件命名

| 类型 | 格式 | 示例 |
|------|------|------|
| 移动端专用组件 | `MobileXxx` | `MobileHeader` |
| 页面组件 | `XxxPage` | `ImagePage` |
| 弹窗组件 | `XxxModal` | `ImagePickerModal` |

---

## 十八、版本管理

采用语义化版本控制：

| 版本类型 | 说明 | 示例 |
|----------|------|------|
| **MAJOR** | 不兼容的 API 变更 | 1.0.0 → 2.0.0 |
| **MINOR** | 向后兼容的功能新增 | 1.0.0 → 1.1.0 |
| **PATCH** | 向后兼容的问题修复 | 1.0.0 → 1.0.1 |

### 18.1 应用版本管理

```typescript
// capacitor.config.ts
const config: CapacitorConfig = {
  appId: 'com.sdkwork.xxx',
  appName: 'SDKWork XXX',
  webDir: 'dist',
  // 应用版本
  plugins: {
    App: {
      version: '1.0.0',
      build: '1',
    },
  },
};
```

---

## 十九、已知问题与优化方向

### 19.1 已知问题

| 问题 | 描述 | 解决方案 |
|------|------|----------|
| **iOS 键盘遮挡** | 输入框被键盘遮挡 | 使用 @capacitor/keyboard 插件处理 |
| **Android 返回键** | 需要处理返回键行为 | 监听 backbutton 事件 |
| **大文件上传** | 移动端网络不稳定 | 分片上传、断点续传 |

### 19.2 优化建议

| 优化项 | 描述 | 优先级 |
|--------|------|--------|
| **平台适配层完善** | 为所有包添加完整的平台适配层 | 高 |
| **原生插件集成** | 为需要原生能力的包添加 Capacitor 插件 | 中 |
| **测试覆盖** | 提高测试覆盖率 | 中 |
| **性能优化** | 首屏加载时间、动画流畅度 | 高 |
| **离线支持** | PWA 离线缓存策略 | 中 |
| **文档完善** | 为每个包添加详细的 API 文档 | 低 |

---

## 二十、附录

### 20.1 常用命令速查

```bash
# 开发
pnpm --filter sdkwork-mobile-xxx dev              # Web 开发
pnpm --filter sdkwork-mobile-xxx cap:ios          # iOS 开发
pnpm --filter sdkwork-mobile-xxx cap:android      # Android 开发

# 构建
pnpm --filter sdkwork-mobile-xxx build            # 构建库
pnpm --filter sdkwork-mobile-xxx build:app        # 构建 Web 应用
pnpm --filter sdkwork-mobile-xxx cap:sync         # 同步原生平台
pnpm --filter sdkwork-mobile-xxx cap:build:ios    # 构建 iOS 应用
pnpm --filter sdkwork-mobile-xxx cap:build:android # 构建 Android 应用

# 发布
pnpm --filter sdkwork-mobile-xxx publish          # 发布到 npm
```

### 20.2 目录结构速查

```
magic-studio-v2/
├── packages/                     # 所有包
│   ├── sdkwork-mobile-core/      # 核心包
│   ├── sdkwork-mobile-commons/   # 通用包
│   ├── sdkwork-mobile-image/     # 图片包 (四模式支持)
│   │   ├── src/                  # 源码
│   │   ├── capacitor/            # Capacitor 配置
│   │   ├── app/                  # 独立应用入口
│   │   ├── package.json
│   │   └── capacitor.config.ts
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
| Capacitor 文档 | https://capacitorjs.com/docs |
| Ionic Framework 文档 | https://ionicframework.com/docs |
| Zustand 文档 | https://zustand-demo.pmnd.rs |
| Tailwind CSS 文档 | https://tailwindcss.com/docs |
| PWA 文档 | https://web.dev/progressive-web-apps/ |

### 20.4 平台特性对比

| 特性 | iOS | Android | 移动端 Web |
|------|-----|---------|-----------|
| **推送通知** | ✅ APNs | ✅ FCM | ⚠️ 需第三方 |
| **相机** | ✅ 原生 | ✅ 原生 | ⚠️ 受限 |
| **文件系统** | ✅ 完整 | ✅ 完整 | ❌ 受限 |
| **后台运行** | ✅ 支持 | ✅ 支持 | ❌ 不支持 |
| **离线支持** | ✅ 原生 | ✅ 原生 | ⚠️ PWA |
| **应用商店** | App Store | Google Play | 无需 |
| **更新方式** | 应用更新 | 应用更新 | 热更新 |

---

*文档版本: 1.0.0*
*最后更新: 2026-02-20*
