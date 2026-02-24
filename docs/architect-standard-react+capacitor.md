# 通用移动应用架构标准 (React + Capacitor)

## 目录

1. [架构概述](#一架构概述)
2. [核心设计原则](#二核心设计原则)
3. [技术栈规范](#三技术栈规范)
4. [四模式包架构](#四四模式包架构)
5. [标准包结构](#五标准包结构)
6. [分层架构设计](#六分层架构设计)
7. [平台适配层设计](#七平台适配层设计)
8. [状态管理规范](#八状态管理规范)
9. [路由系统设计](#九路由系统设计)
10. [国际化规范](#十国际化规范)
11. [移动端 UI 规范](#十一移动端-ui 规范)
12. [PWA 规范](#十二pwa 规范)
13. [Capacitor 原生集成](#十三capacitor-原生集成)
14. [开发规范](#十四开发规范)
15. [构建与发布](#十五构建与发布)
16. [快速启动模板](#十六快速启动模板)
17. [附录](#十七附录)

---

## 一、架构概述

### 1.1 目标

本架构标准旨在提供一套**面向移动端**的可复用、可扩展、标准化应用架构规范，适用于：

- ✅ 移动端 H5 应用
- ✅ 微信公众号/小程序
- ✅ iOS/Android 原生应用（Capacitor）
- ✅ PWA 渐进式 Web 应用
- ✅ 移动组件库/SDK 开发

### 1.2 架构特点

| 特点 | 描述 | 价值 |
|------|------|------|
| **四模式统一** | 每个包支持四种使用模式 | 一套代码，多场景复用 |
| **移动优先** | 以移动端体验为核心设计 | 触控优化、性能优化、响应式 |
| **原生能力** | Capacitor 原生运行时 | 访问相机、文件系统、通知等设备 API |
| **PWA 支持** | 离线缓存、可安装 | 类原生体验 |
| **类型安全** | TypeScript 严格模式 | 编译期错误检测，智能提示 |

### 1.3 四模式使用场景

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              四模式使用场景                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  模式一：移动端 Web 应用                                                         │
│  ├── 场景：移动 H5、微信公众号、移动浏览器                                      │
│  ├── 部署：CDN、Vercel、Netlify、Docker                                         │
│  └── 更新：热更新、无需用户操作                                                 │
│                                                                                  │
│  模式二：Capacitor 原生应用                                                      │
│  ├── 场景：App Store、Google Play、企业应用分发                                 │
│  ├── 部署：.ipa (iOS)、.apk/.aab (Android)                                      │
│  └── 更新：应用商店审核、版本控制                                               │
│                                                                                  │
│  模式三：Node.js 依赖包                                                          │
│  ├── 场景：集成到现有移动应用、模块化开发                                       │
│  ├── 部署：npm publish、私有仓库                                                │
│  └── 更新：包版本管理、语义化版本                                               │
│                                                                                  │
│  模式四：Capacitor 依赖包                                                        │
│  ├── 场景：集成到现有 Capacitor 应用、移动应用模块化                            │
│  ├── 部署：npm + Capacitor 插件                                                 │
│  └── 更新：包版本管理、插件同步更新                                             │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 1.4 四模式对比

| 特性 | 移动端 Web | Capacitor 原生 | Node.js 依赖包 | Capacitor 依赖包 |
|------|-----------|---------------|----------------|------------------|
| **部署方式** | CDN/服务器 | App Store/Google Play | npm 发布 | npm 发布 |
| **运行环境** | 移动浏览器 | 原生 WebView | 宿主应用 | 宿主 Capacitor 应用 |
| **文件系统** | 受限 | 完整访问 | 受限 | 完整访问 |
| **设备 API** | 受限 | 完整支持 | 受限 | 完整支持 |
| **离线使用** | 需配置 PWA | 原生支持 | 取决于宿主 | 原生支持 |
| **推送通知** | 需第三方 | 原生支持 | 无 | 原生支持 |
| **应用商店** | 无需 | 需要 | 无需 | 无需 |

---

## 二、核心设计原则

### 2.1 移动优先设计原则

| 原则 | 描述 | 实践方式 |
|------|------|----------|
| **触控友好** | 针对手指操作优化 | 按钮最小 44x44px，手势支持 |
| **响应式布局** | 适配各种屏幕尺寸 | 流式布局、媒体查询、弹性单位 |
| **性能优先** | 快速加载、流畅交互 | 代码分割、懒加载、虚拟列表 |
| **离线可用** | 网络不稳定时仍可使用 | PWA 缓存、本地存储 |
| **原生体验** | 接近原生应用的体验 | 动画流畅、转场自然、反馈及时 |

### 2.2 SOLID 原则

| 原则 | 描述 | 实践方式 |
|------|------|----------|
| **单一职责 (SRP)** | 每个模块只负责一个功能域 | 按功能划分包，每个包职责单一 |
| **开闭原则 (OCP)** | 对扩展开放，对修改关闭 | 接口抽象、策略模式、依赖注入 |
| **里氏替换 (LSP)** | 子类可替换父类 | 接口编程、多态设计 |
| **接口隔离 (ISP)** | 使用多个专用接口 | 细粒度接口设计 |
| **依赖倒置 (DIP)** | 依赖抽象而非具体实现 | 依赖注入、控制反转 |

### 2.3 架构分层原则

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              架构分层图                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                           应用层 (Application Layer)                     │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │  Pages / Layouts / Routes / Providers                           │   │   │
│  │  │  - 页面组装                                                      │   │   │
│  │  │  - 路由配置                                                      │   │   │
│  │  │  - 全局状态提供者                                                │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                           业务层 (Business Layer)                        │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │  Components / Services / Stores                                 │   │   │
│  │  │  - UI 组件                                                       │   │   │
│  │  │  - 业务逻辑服务                                                  │   │   │
│  │  │  - 状态管理                                                      │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                           领域层 (Domain Layer)                          │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │  Entities / Value Objects / Domain Services                     │   │   │
│  │  │  - 核心业务实体                                                  │   │   │
│  │  │  - 值对象                                                        │   │   │
│  │  │  - 领域服务                                                      │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                           基础设施层 (Infrastructure Layer)              │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │  Platform Adapters / Repositories / Utils                       │   │   │
│  │  │  - 平台适配器 (Web/Capacitor)                                    │   │   │
│  │  │  - 数据持久化                                                    │   │   │
│  │  │  - 工具函数                                                      │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  依赖方向：自顶向下，禁止反向依赖                                                 │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 三、技术栈规范

### 3.1 包管理与构建工具（必选）

| 技术 | 版本范围 | 用途 | 说明 |
|------|----------|------|------|
| **pnpm** | ^9.0.0 | 包管理器 | 高效磁盘利用，严格依赖管理，Monorepo 原生支持 |
| **Vite** | ^7.0.0 | 构建工具 | 支持 HMR、代码分割，双模式构建，PWA 支持 |

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
pnpm --filter <package-name> add <dependency>

# 运行脚本
pnpm --filter <package-name> dev

# Capacitor 相关命令
pnpm --filter <package-name> cap:sync
pnpm --filter <package-name> cap:ios
pnpm --filter <package-name> cap:android

# 发布包
pnpm publish
```

#### Vite 构建工具

本项目使用 **Vite** 作为构建工具，支持双模式构建：

| 模式 | 配置文件 | 用途 |
|------|----------|------|
| **库模式** | vite.config.ts | 构建 npm 包 |
| **应用模式** | vite.app.config.ts | 构建独立应用 (含 PWA) |

### 3.2 核心技术栈（必选）

| 技术 | 版本范围 | 用途 | 说明 |
|------|----------|------|------|
| **React** | ^19.0.0 | UI 框架 | 使用函数组件 + Hooks |
| **TypeScript** | ^5.9.0 | 类型系统 | 严格模式，禁止 any |

### 3.3 移动框架（必选其一）

| 方案 | 版本 | 适用场景 | 说明 |
|------|------|----------|------|
| **Ionic Framework** | ^8.0.0 | 推荐，快速开发 | 完整 UI 组件库，原生风格 |
| **Tailwind CSS** | ^4.0.0 | 自定义 UI | 原子化 CSS，灵活定制 |
| **自研组件库** | - | 品牌定制 | 完全自主控制 |

### 3.3 状态管理（必选其一）

| 方案 | 版本 | 适用场景 | 说明 |
|------|------|----------|------|
| **Zustand** | ^5.0.0 | 推荐，轻量级 | 简单 API，无样板代码 |
| **Redux Toolkit** | ^2.0.0 | 复杂状态管理 | 完整生态，DevTools |
| **Jotai** | ^2.0.0 | 原子化状态 | 细粒度更新，性能好 |

### 3.4 路由系统（按需）

| 方案 | 版本 | 适用场景 | 说明 |
|------|------|----------|------|
| **React Router** | ^7.0.0 | SPA 应用 | 完整路由功能 |
| **TanStack Router** | ^1.0.0 | 类型安全路由 | 完整类型推导 |
| **Ionic Router** | ^8.0.0 | 移动端路由 | 支持堆栈导航、转场动画 |

### 3.5 移动平台（必选）

| 技术 | 版本 | 用途 | 说明 |
|------|------|------|------|
| **Capacitor** | ^7.0.0 | 移动应用框架 | 跨平台原生运行时 |
| **Capacitor Plugins** | ^7.0.0 | 设备能力 | 相机、文件系统、通知等 |

### 3.6 动画库（推荐）

| 库 | 版本 | 用途 | 说明 |
|----|------|------|------|
| **Framer Motion** | ^12.0.0 | 手势动画 | 流畅的交互动画 |
| **React Spring** | ^10.0.0 | 物理动画 | 自然的动画效果 |
| **GSAP** | ^3.12.0 | 复杂动画 | 强大的时间轴控制 |

### 3.7 PWA 支持（推荐）

| 技术 | 版本 | 用途 |
|------|------|------|
| **vite-plugin-pwa** | ^1.0.0 | PWA 构建插件 |
| **workbox** | ^7.0.0 | 服务工作者工具 |

### 3.8 工具库（推荐）

```json
{
  "dependencies": {
    "classnames": "^2.5.0",
    "immer": "^11.0.0",
    "date-fns": "^4.0.0",
    "lodash-es": "^4.17.21",
    "uuid": "^11.0.0",
    "zod": "^3.24.0",
    "@capacitor/core": "^7.0.0",
    "@capacitor/app": "^7.0.0",
    "@capacitor/haptics": "^7.0.0",
    "@capacitor/keyboard": "^7.0.0",
    "@capacitor/status-bar": "^7.0.0",
    "@capacitor/splash-screen": "^7.0.0"
  },
  "devDependencies": {
    "eslint": "^9.0.0",
    "prettier": "^3.0.0",
    "vitest": "^2.0.0",
    "@testing-library/react": "^16.0.0",
    "@capacitor/cli": "^7.0.0",
    "@capacitor/ios": "^7.0.0",
    "@capacitor/android": "^7.0.0",
    "vite-plugin-pwa": "^1.0.0"
  }
}
```

---

## 四、四模式包架构

### 4.1 包结构总览

```
my-mobile-package/
├── src/                          # 统一源码
│   ├── index.ts                  # 公共 API 导出
│   ├── components/               # UI 组件
│   │   ├── mobile/               # 移动端专用组件
│   │   └── shared/               # 共享组件
│   ├── pages/                    # 页面组件
│   ├── services/                 # 业务服务
│   ├── store/                    # 状态管理
│   ├── entities/                 # 实体定义
│   ├── types/                    # 类型定义
│   ├── hooks/                    # 自定义 Hooks
│   ├── constants/                # 常量定义
│   ├── utils/                    # 工具函数
│   ├── platform/                 # 平台适配层
│   ├── i18n/                     # 国际化配置
│   └── router/                   # 路由配置
│
├── app/                          # 独立应用入口
│   ├── main.tsx                  # 应用入口
│   ├── App.tsx                   # 根组件
│   ├── index.html                # HTML 模板
│   └── manifest.json             # PWA 清单
│
├── capacitor/                    # Capacitor 配置
│   ├── config.ts                 # Capacitor 配置
│   ├── ios/                      # iOS 原生代码
│   └── android/                  # Android 原生代码
│
├── dist/                         # 构建产物
├── package.json                  # 包配置
├── tsconfig.json                 # TypeScript 配置
├── vite.config.ts                # Vite 配置（库模式）
├── vite.app.config.ts            # Vite 配置（应用模式，含 PWA）
├── capacitor.config.ts           # Capacitor 配置
└── README.md                     # 包文档
```

### 4.2 示例项目目录结构

以下是一个完整的移动端 Monorepo 项目示例，展示多个包的组织方式：

**包命名规范**：移动端项目统一使用 `sdkwork-react-mobile-` 前缀

| 层级 | 包名格式 | 示例 |
|------|----------|------|
| Layer 0 | `sdkwork-react-mobile-{name}` | `sdkwork-react-mobile-core` |
| Layer 1 | `sdkwork-react-mobile-{name}` | `sdkwork-react-mobile-commons` |
| Layer 2 | `sdkwork-react-mobile-{name}` | `sdkwork-react-mobile-auth` |
| Layer 3 | `sdkwork-react-mobile-{name}` | `sdkwork-react-mobile-user` |

```
sdkwork-mobile-monorepo/
├── packages/                         # 所有包目录
│   │
│   ├── sdkwork-react-mobile-core/    # 核心包 (Layer 0)
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── router/               # 路由核心
│   │   │   ├── store/                # 状态管理核心
│   │   │   ├── events/               # 事件总线
│   │   │   └── platform/             # 平台抽象
│   │   │       ├── index.ts
│   │   │       ├── types.ts
│   │   │       ├── web.ts            # Web 平台实现
│   │   │       └── capacitor.ts      # Capacitor 平台实现
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   ├── sdkwork-react-mobile-commons/ # 通用包 (Layer 1)
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── components/           # 通用组件
│   │   │   │   ├── mobile/           # 移动端专用组件
│   │   │   │   │   ├── MobileButton/
│   │   │   │   │   ├── MobileCard/
│   │   │   │   │   └── ...
│   │   │   │   └── shared/           # 共享组件
│   │   │   ├── hooks/                # 通用 Hooks
│   │   │   │   ├── useSafeArea.ts    # 安全区 Hook
│   │   │   │   ├── useKeyboard.ts    # 键盘 Hook
│   │   │   │   └── useNetwork.ts     # 网络 Hook
│   │   │   ├── utils/                # 工具函数
│   │   │   ├── types/                # 类型定义
│   │   │   └── constants/            # 常量
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   ├── sdkwork-react-mobile-i18n/    # 国际化包 (Layer 0)
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── types.ts
│   │   │   └── locales/
│   │   │       ├── zh-CN/
│   │   │       └── en-US/
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   ├── sdkwork-react-mobile-auth/    # 认证包 (Layer 2)
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   ├── store/
│   │   │   ├── router/
│   │   │   │   ├── index.ts
│   │   │   │   ├── routes.ts
│   │   │   │   └── guards.ts
│   │   │   └── i18n/
│   │   │       ├── index.ts
│   │   │       └── locales/
│   │   ├── app/                      # 独立应用入口
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── vite.app.config.ts
│   │
│   ├── sdkwork-react-mobile-user/    # 用户包 (Layer 3)
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── components/
│   │   │   │   ├── mobile/           # 移动端专用组件
│   │   │   │   └── shared/
│   │   │   ├── pages/
│   │   │   │   ├── ProfilePage.tsx
│   │   │   │   └── SettingsPage.tsx
│   │   │   ├── services/
│   │   │   ├── store/
│   │   │   ├── entities/
│   │   │   │   └── User.ts
│   │   │   ├── router/
│   │   │   │   ├── index.ts
│   │   │   │   ├── routes.ts
│   │   │   │   └── types.ts
│   │   │   └── i18n/
│   │   │       ├── index.ts
│   │   │       ├── types.ts
│   │   │       └── locales/
│   │   │           ├── zh-CN/
│   │   │           │   ├── index.ts
│   │   │           │   ├── common.ts
│   │   │           │   ├── page.ts
│   │   │           │   └── action.ts  # 移动端操作文案
│   │   │           └── en-US/
│   │   │               ├── index.ts
│   │   │               ├── common.ts
│   │   │               ├── page.ts
│   │   │               └── action.ts
│   │   ├── app/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx
│   │   │   ├── index.html
│   │   │   └── manifest.json         # PWA 清单
│   │   ├── capacitor/                # Capacitor 配置
│   │   │   ├── config.ts
│   │   │   ├── ios/
│   │   │   └── android/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   ├── vite.app.config.ts
│   │   └── capacitor.config.ts
│   │
│   ├── sdkwork-react-mobile-image/   # 图片生成包 (Layer 3)
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   │   └── ImagePage.tsx
│   │   │   ├── services/
│   │   │   ├── store/
│   │   │   ├── router/
│   │   │   └── i18n/
│   │   ├── app/
│   │   ├── capacitor/
│   │   ├── package.json
│   │   └── ...
│   │
│   ├── sdkwork-react-mobile-video/   # 视频生成包 (Layer 3)
│   │   └── ...
│   │
│   ├── sdkwork-react-mobile-audio/   # 音频生成包 (Layer 3)
│   │   └── ...
│   │
│   └── ...                           # 其他业务包
│
├── apps/                             # 独立应用目录 (可选)
│   ├── mobile-app/                   # 移动应用
│   │   ├── src/
│   │   ├── capacitor/
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── capacitor.config.ts
│   │
│   └── pwa-app/                      # PWA 应用
│       ├── src/
│       ├── package.json
│       └── vite.config.ts
│
├── pnpm-workspace.yaml               # pnpm 工作区配置
├── package.json                      # 根 package.json
├── tsconfig.json                     # 根 TypeScript 配置
├── .npmrc                            # npm 配置
└── README.md                         # 项目文档
```

#### pnpm-workspace.yaml 配置

```yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

#### 根 package.json 配置

```json
{
  "name": "sdkwork-mobile-monorepo",
  "private": true,
  "scripts": {
    "dev": "pnpm --filter sdkwork-react-mobile-user dev",
    "dev:ios": "pnpm --filter sdkwork-react-mobile-user cap:ios",
    "dev:android": "pnpm --filter sdkwork-react-mobile-user cap:android",
    "build": "pnpm -r build",
    "build:app": "pnpm -r build:app",
    "cap:sync": "pnpm -r cap:sync",
    "test": "pnpm -r test",
    "lint": "pnpm -r lint",
    "clean": "pnpm -r clean"
  },
  "devDependencies": {
    "typescript": "^5.9.0",
    "vite": "^7.0.0",
    "@vitejs/plugin-react": "^5.0.0",
    "vite-plugin-pwa": "^1.0.0",
    "@capacitor/cli": "^7.0.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=9.0.0"
  }
}
```

### 4.3 package.json 标准配置

```json
{
  "name": "@scope/my-mobile-package",
  "version": "1.0.0",
  "description": "Mobile package description",
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
    "./styles": "./dist/style.css",
    "./package.json": "./package.json"
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "sideEffects": false,
  "scripts": {
    "dev": "vite --config vite.app.config.ts",
    "build": "vite build && tsc --emitDeclarationOnly",
    "build:app": "vite build --config vite.app.config.ts",
    "preview": "vite preview --config vite.app.config.ts",
    "cap:sync": "cap sync",
    "cap:ios": "cap open ios",
    "cap:android": "cap open android",
    "cap:run:ios": "cap run ios",
    "cap:run:android": "cap run android",
    "cap:build:ios": "cap build ios",
    "cap:build:android": "cap build android",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,css,json}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,css,json}\"",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "prepublishOnly": "pnpm build && pnpm test:run"
  },
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0",
    "@capacitor/core": ">=7.0.0"
  },
  "dependencies": {
    "@capacitor/core": "^7.0.0",
    "@capacitor/app": "^7.0.0",
    "@capacitor/haptics": "^7.0.0",
    "@capacitor/keyboard": "^7.0.0",
    "@capacitor/status-bar": "^7.0.0",
    "@scope/my-core": "workspace:*"
  },
  "devDependencies": {
    "@capacitor/cli": "^7.0.0",
    "@capacitor/ios": "^7.0.0",
    "@capacitor/android": "^7.0.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^5.0.0",
    "typescript": "^5.9.0",
    "vite": "^7.0.0",
    "vite-plugin-pwa": "^1.0.0"
  },
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  },
  "keywords": ["react", "mobile", "capacitor", "ios", "android", "pwa"],
  "license": "MIT",
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### 4.3 Vite 配置标准

#### 库模式配置 (vite.config.ts)

```typescript
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
    outDir: 'dist',
  },
});
```

#### 应用模式配置 (vite.app.config.ts) - 含 PWA

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
        name: 'My Mobile App',
        short_name: 'MyApp',
        description: 'My Mobile Application',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
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
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
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
          {
            urlPattern: /^https:\/\/.*\.(png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: 'module',
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
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'app/index.html'),
      },
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  preview: {
    port: 4173,
    host: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'app/src'),
      'my-mobile-package': resolve(__dirname, 'src/index.ts'),
    },
  },
  optimizeDeps: {
    include: ['@capacitor/core'],
  },
});
```

### 4.4 Capacitor 配置标准

```typescript
// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.myapp.mobile',
  appName: 'My Mobile App',
  webDir: 'dist-app',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    // 开发时使用本地服务器
    // url: 'http://192.168.1.100:3000',
    // cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 300,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#ffffff',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
      resizeBehavior: 'native',
    },
    App: {
      exitAppOnBackground: false,
    },
  },
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: false,
    scrollEnabled: true,
    useLegacyBuild: false,
    // iOS 特定配置
    scheme: 'myapp',
    bundleId: 'com.myapp.mobile',
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    // Android 特定配置
    buildOptions: {
      keystorePath: 'release.keystore',
      keystorePassword: 'password',
      keystoreAlias: 'myapp',
    },
  },
};

export default config;
```

---

## 五、标准包结构

### 5.1 入口文件规范

```typescript
// src/index.ts - 公共 API 导出
// 导出组件
export { default as MainComponent } from './components/MainComponent';
export { Button } from './components/Button';
export { MobileCard } from './components/MobileCard';

// 导出页面
export { default as HomePage } from './pages/HomePage';
export { default as SettingsPage } from './pages/SettingsPage';

// 导出服务
export { ApiService } from './services/ApiService';
export { StorageService } from './services/StorageService';

// 导出状态管理
export { useStore, createStore } from './store/store';
export type { StoreState } from './store/store';

// 导出实体
export type { User, Product, Order } from './entities';

// 导出类型
export type { ApiResponse, PaginationParams } from './types';

// 导出 Hooks
export { useAsync } from './hooks/useAsync';
export { useDebounce } from './hooks/useDebounce';
export { useSafeArea } from './hooks/useSafeArea';
export { useKeyboard } from './hooks/useKeyboard';

// 导出常量
export { API_VERSION, DEFAULT_CONFIG } from './constants';

// 导出平台适配
export { initializePlatform, getPlatformAdapter } from './platform';
export type { PlatformAdapter } from './platform';

// 导出国际化
export { useTranslation, TranslationProvider } from './i18n';
export type { TranslationKey } from './i18n';
```

### 5.2 移动端组件规范

```typescript
// src/components/MobileButton.tsx
import React from 'react';
import classNames from 'classnames';
import { isPlatform } from '@capacitor/core';

export interface MobileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** 按钮变体 */
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  /** 按钮尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 是否加载状态 */
  loading?: boolean;
  /** 是否全宽 */
  fullWidth?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 子元素 */
  children?: React.ReactNode;
  /** 点击反馈 */
  hapticFeedback?: boolean;
}

/**
 * 移动端按钮组件
 * - 最小点击区域 44x44px
 * - 支持触觉反馈
 * - 适配 iOS/Android 风格
 * 
 * @example
 * <MobileButton variant="primary" onClick={handleClick}>
 *   点击我
 * </MobileButton>
 */
export const MobileButton: React.FC<MobileButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  className = '',
  children,
  disabled,
  hapticFeedback = true,
  ...props
}) => {
  const handleTouch = async () => {
    if (hapticFeedback && !disabled && !loading) {
      const { Haptics } = await import('@capacitor/haptics');
      await Haptics.impact({ style: 1 }); // Light impact
    }
  };

  const classes = classNames(
    'mobile-btn',
    `mobile-btn-${variant}`,
    `mobile-btn-${size}`,
    { 'mobile-btn-loading': loading },
    { 'mobile-btn-disabled': disabled || loading },
    { 'mobile-btn-full': fullWidth },
    { 'mobile-btn-ios': isPlatform('ios') },
    { 'mobile-btn-android': isPlatform('android') },
    className
  );

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      onTouchStart={handleTouch}
      {...props}
    >
      {loading && <span className="mobile-btn-spinner" />}
      {children}
    </button>
  );
};

export default MobileButton;
```

### 5.3 移动端专用 Hooks

```typescript
// src/hooks/useSafeArea.ts
import { useState, useEffect } from 'react';
import { StatusBar } from '@capacitor/status-bar';

interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export function useSafeArea(): SafeAreaInsets {
  const [insets, setInsets] = useState<SafeAreaInsets>({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });

  useEffect(() => {
    const updateInsets = async () => {
      // 获取状态栏高度
      const statusBarInfo = await StatusBar.getInfo();
      const topInset = statusBarInfo?.height ?? 0;

      // 获取底部安全区（iOS 全面屏设备）
      const isIPhoneX = /iPhone X|iPhone 1[1-4]|iPhone 1[5-6]/i.test(navigator.userAgent);
      const bottomInset = isIPhoneX ? 34 : 0;

      setInsets({
        top: topInset,
        bottom: bottomInset,
        left: 0,
        right: 0,
      });
    };

    updateInsets();

    // 监听方向变化
    window.addEventListener('orientationchange', updateInsets);
    return () => window.removeEventListener('orientationchange', updateInsets);
  }, []);

  return insets;
}
```

```typescript
// src/hooks/useKeyboard.ts
import { useState, useEffect } from 'react';
import { Keyboard, KeyboardInfo } from '@capacitor/keyboard';

interface KeyboardState {
  isOpen: boolean;
  height: number;
}

export function useKeyboard(): KeyboardState {
  const [state, setState] = useState<KeyboardState>({
    isOpen: false,
    height: 0,
  });

  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      'keyboardWillShow',
      (info: KeyboardInfo) => {
        setState({
          isOpen: true,
          height: info.keyboardHeight,
        });
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      'keyboardWillHide',
      () => {
        setState({
          isOpen: false,
          height: 0,
        });
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  return state;
}
```

```typescript
// src/hooks/useNetworkStatus.ts
import { useState, useEffect } from 'react';
import { Network } from '@capacitor/network';

interface NetworkState {
  connected: boolean;
  connectionType?: 'wifi' | 'cellular' | 'none' | 'unknown';
}

export function useNetworkStatus(): NetworkState {
  const [state, setState] = useState<NetworkState>({
    connected: navigator.onLine,
    connectionType: 'unknown',
  });

  useEffect(() => {
    const updateNetworkStatus = async () => {
      const status = await Network.getStatus();
      setState({
        connected: status.connected,
        connectionType: status.connectionType,
      });
    };

    updateNetworkStatus();

    const statusListener = await Network.addListener(
      'networkStatusChange',
      (status) => {
        setState({
          connected: status.connected,
          connectionType: status.connectionType,
        });
      }
    );

    return () => {
      statusListener.remove();
    };
  }, []);

  return state;
}
```

---

## 六、分层架构设计

### 6.1 分层职责定义

| 层级 | 职责 | 依赖方向 | 示例 |
|------|------|----------|------|
| **应用层** | 应用组装、路由、全局状态 | 依赖业务层 | App.tsx, routes.ts |
| **业务层** | 业务逻辑、UI 组件、状态管理 | 依赖领域层 | Components, Services, Stores |
| **领域层** | 核心业务实体、领域服务 | 无依赖 | Entities, Value Objects |
| **基础设施层** | 平台适配、数据持久化、工具 | 被所有层依赖 | Platform Adapters, Utils |

### 6.2 依赖规则

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              依赖规则图                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│    应用层 (Application)                                                          │
│         │                                                                        │
│         ▼                                                                        │
│    业务层 (Business)                                                             │
│         │                                                                        │
│         ▼                                                                        │
│    领域层 (Domain)                                                               │
│         │                                                                        │
│         ▼                                                                        │
│    基础设施层 (Infrastructure)                                                   │
│                                                                                  │
│  规则：                                                                           │
│  ✅ 上层可以依赖下层                                                             │
│  ❌ 下层不能依赖上层                                                             │
│  ❌ 禁止跨层依赖                                                                 │
│  ✅ 同层模块可以互相依赖                                                         │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 七、平台适配层设计

### 7.1 平台适配器接口

```typescript
// src/platform/types.ts
import type { Platform as CapacitorPlatform } from '@capacitor/core';

export type Platform = 'ios' | 'android' | 'web' | 'pwa';

export interface PlatformAdapter {
  // 平台信息
  isNative(): boolean;
  getPlatform(): Platform;
  isPlatform(platform: Platform): boolean;
  
  // 文件系统
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  deleteFile(path: string): Promise<void>;
  fileExists(path: string): Promise<boolean>;
  getDocumentsDir(): Promise<string>;
  
  // 对话框
  showOpenDialog(options: OpenDialogOptions): Promise<string[] | null>;
  showSaveDialog(options: SaveDialogOptions): Promise<string | null>;
  showMessageBox(options: MessageBoxOptions): Promise<number>;
  
  // 系统能力
  notify(title: string, body: string): Promise<void>;
  openExternal(url: string): Promise<void>;
  clipboardRead(): Promise<string>;
  clipboardWrite(text: string): Promise<void>;
  
  // 设备能力
  vibrate(pattern: number | number[]): Promise<void>;
  getDeviceInfo(): Promise<DeviceInfo>;
  
  // 应用信息
  getAppPath(): Promise<string>;
  getUserDataPath(): Promise<string>;
  exitApp(): Promise<void>;
}

export interface OpenDialogOptions {
  title?: string;
  defaultPath?: string;
  filters?: FileFilter[];
  multiple?: boolean;
}

export interface SaveDialogOptions {
  title?: string;
  defaultPath?: string;
  filters?: FileFilter[];
}

export interface MessageBoxOptions {
  type: 'info' | 'warning' | 'error' | 'question';
  title: string;
  message: string;
  buttons?: string[];
}

export interface FileFilter {
  name: string;
  extensions: string[];
}

export interface DeviceInfo {
  model: string;
  manufacturer: string;
  platform: string;
  platformVersion: string;
  osVersion: string;
}
```

### 7.2 Web 平台实现

```typescript
// src/platform/web.ts
import type { PlatformAdapter, Platform, OpenDialogOptions, SaveDialogOptions, MessageBoxOptions, DeviceInfo } from './types';

export class WebPlatformAdapter implements PlatformAdapter {
  isNative(): boolean {
    return false;
  }

  getPlatform(): Platform {
    const isPWA = window.matchMedia('(display-mode: standalone)').matches;
    return isPWA ? 'pwa' : 'web';
  }

  isPlatform(platform: Platform): boolean {
    return this.getPlatform() === platform;
  }

  async readFile(path: string): Promise<string> {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to read file: ${path}`);
    }
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

  async deleteFile(): Promise<void> {
    throw new Error('File deletion not supported in web platform');
  }

  async fileExists(): Promise<boolean> {
    throw new Error('File exists check not supported in web platform');
  }

  async getDocumentsDir(): Promise<string> {
    return 'browser-downloads';
  }

  async showOpenDialog(options: OpenDialogOptions): Promise<string[] | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = options.multiple || false;
      
      if (options.filters) {
        input.accept = options.filters
          .flatMap(f => f.extensions.map(ext => `.${ext}`))
          .join(',');
      }

      input.onchange = () => {
        const files = Array.from(input.files || []);
        resolve(files.length > 0 ? files.map(f => f.name) : null);
      };

      input.click();
    });
  }

  async showSaveDialog(options: SaveDialogOptions): Promise<string | null> {
    const fileName = prompt('Enter file name:', options.defaultPath);
    return fileName;
  }

  async showMessageBox(options: MessageBoxOptions): Promise<number> {
    const message = `${options.title}\n\n${options.message}`;
    const result = options.type === 'question' 
      ? confirm(message) 
      : alert(message);
    return result ? 0 : 1;
  }

  async notify(title: string, body: string): Promise<void> {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body });
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification(title, { body });
        }
      }
    }
  }

  async openExternal(url: string): Promise<void> {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  async clipboardRead(): Promise<string> {
    return navigator.clipboard.readText();
  }

  async clipboardWrite(text: string): Promise<void> {
    await navigator.clipboard.writeText(text);
  }

  async vibrate(pattern: number | number[]): Promise<void> {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }

  async getDeviceInfo(): Promise<DeviceInfo> {
    const ua = navigator.userAgent;
    return {
      model: 'Browser',
      manufacturer: 'Unknown',
      platform: this.getPlatform(),
      platformVersion: '',
      osVersion: '',
    };
  }

  async getAppPath(): Promise<string> {
    return window.location.origin;
  }

  async getUserDataPath(): Promise<string> {
    return 'localstorage';
  }

  async exitApp(): Promise<void> {
    window.close();
  }
}
```

### 7.3 Capacitor 平台实现

```typescript
// src/platform/capacitor.ts
import type { PlatformAdapter, Platform, OpenDialogOptions, SaveDialogOptions, MessageBoxOptions, DeviceInfo } from './types';
import { Capacitor, isPlatform } from '@capacitor/core';
import { Directory, readFile, writeFile, remove, stat } from '@capacitor/filesystem';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { FilesystemPicker } from '@capawesome/capacitor-file-picker';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Browser } from '@capacitor/browser';
import { Clipboard } from '@capacitor/clipboard';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Device } from '@capacitor/device';
import { App } from '@capacitor/app';

export class CapacitorPlatformAdapter implements PlatformAdapter {
  isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  getPlatform(): Platform {
    if (isPlatform('ios')) return 'ios';
    if (isPlatform('android')) return 'android';
    if (isPlatform('pwa')) return 'pwa';
    return 'web';
  }

  isPlatform(platform: Platform): boolean {
    return getPlatform() === platform;
  }

  async readFile(path: string): Promise<string> {
    const result = await readFile({
      path,
      directory: Directory.Documents,
      encoding: 'utf8',
    });
    return result.data;
  }

  async writeFile(path: string, content: string): Promise<void> {
    await writeFile({
      path,
      data: content,
      directory: Directory.Documents,
      recursive: true,
    });
  }

  async deleteFile(path: string): Promise<void> {
    await remove({
      path,
      directory: Directory.Documents,
    });
  }

  async fileExists(path: string): Promise<boolean> {
    try {
      await stat({
        path,
        directory: Directory.Documents,
      });
      return true;
    } catch {
      return false;
    }
  }

  async getDocumentsDir(): Promise<string> {
    return Directory.Documents;
  }

  async showOpenDialog(options: OpenDialogOptions): Promise<string[] | null> {
    const result = await FilesystemPicker.pickFiles({
      multiple: options.multiple,
      types: options.filters?.map(f => ({
        mimeTypes: f.extensions.map(ext => `.${ext}`),
      })),
    });
    return result.files?.map(f => f.path) ?? null;
  }

  async showSaveDialog(options: SaveDialogOptions): Promise<string | null> {
    // Capacitor 不直接支持保存对话框，需要自定义实现
    return options.defaultPath ?? null;
  }

  async showMessageBox(options: MessageBoxOptions): Promise<number> {
    const { Dialog } = await import('@capacitor/dialog');
    const result = await Dialog.confirm({
      title: options.title,
      message: options.message,
      okButtonLabel: options.buttons?.[0] ?? 'OK',
      cancelButtonLabel: options.buttons?.[1] ?? 'Cancel',
    });
    return result.value ? 0 : 1;
  }

  async notify(title: string, body: string): Promise<void> {
    await LocalNotifications.schedule({
      notifications: [
        {
          title,
          body,
          id: Date.now(),
          smallIcon: 'ic_notification',
        },
      ],
    });
  }

  async openExternal(url: string): Promise<void> {
    await Browser.open({ url });
  }

  async clipboardRead(): Promise<string> {
    const result = await Clipboard.read();
    return result.value || '';
  }

  async clipboardWrite(text: string): Promise<void> {
    await Clipboard.write({ string: text });
  }

  async vibrate(pattern: number | number[]): Promise<void> {
    await Haptics.impact({ style: ImpactStyle.Light });
  }

  async getDeviceInfo(): Promise<DeviceInfo> {
    const info = await Device.getInfo();
    return {
      model: info.model,
      manufacturer: info.manufacturer,
      platform: this.getPlatform(),
      platformVersion: info.platformVersion,
      osVersion: info.osVersion,
    };
  }

  async getAppPath(): Promise<string> {
    const { AppInfo } = await import('@capacitor/app');
    const info = await AppInfo.getInfo();
    return info.name;
  }

  async getUserDataPath(): Promise<string> {
    return Directory.Data;
  }

  async exitApp(): Promise<void> {
    App.exitApp();
  }
}
```

### 7.4 平台初始化

```typescript
// src/platform/index.ts
import type { PlatformAdapter } from './types';
import { Capacitor } from '@capacitor/core';

let adapter: PlatformAdapter | null = null;
let initialized = false;

/**
 * 初始化平台适配器
 * 自动检测当前运行环境并选择合适的适配器
 */
export async function initializePlatform(): Promise<void> {
  if (initialized) {
    return;
  }

  if (typeof window === 'undefined') {
    throw new Error('Platform initialization not supported in SSR');
  }

  // 检测是否为 Capacitor 环境
  if (Capacitor.isNativePlatform()) {
    const { CapacitorPlatformAdapter } = await import('./capacitor');
    adapter = new CapacitorPlatformAdapter();
  } else {
    const { WebPlatformAdapter } = await import('./web');
    adapter = new WebPlatformAdapter();
  }

  initialized = true;
}

/**
 * 获取平台适配器实例
 * 必须先调用 initializePlatform
 */
export function getPlatformAdapter(): PlatformAdapter {
  if (!adapter) {
    throw new Error('Platform adapter not initialized. Call initializePlatform() first.');
  }
  return adapter;
}

/**
 * 手动设置平台适配器（用于测试或自定义适配器）
 */
export function setPlatformAdapter(instance: PlatformAdapter): void {
  adapter = instance;
  initialized = true;
}

/**
 * 获取当前平台
 */
export function getPlatform(): 'ios' | 'android' | 'web' | 'pwa' {
  if (!adapter) {
    return 'web';
  }
  return adapter.getPlatform();
}

/**
 * 检查是否为原生平台
 */
export function isNative(): boolean {
  if (!adapter) {
    return false;
  }
  return adapter.isNative();
}

// 重新导出类型
export type { PlatformAdapter, Platform, OpenDialogOptions, SaveDialogOptions, MessageBoxOptions, DeviceInfo } from './types';
```

---

## 八、状态管理规范

### 8.1 Zustand Store 规范

```typescript
// src/store/store.ts
import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 状态接口
export interface StoreState {
  // 数据
  items: string[];
  count: number;
  
  // 操作
  addItem: (item: string) => void;
  removeItem: (index: number) => void;
  increment: () => void;
  reset: () => void;
}

// 创建 Store（带持久化）
export const store = createStore<StoreState>()(
  persist(
    (set, get) => ({
      items: [],
      count: 0,
      
      addItem: (item) => set((state) => ({ items: [...state.items, item] })),
      removeItem: (index) => set((state) => ({ 
        items: state.items.filter((_, i) => i !== index) 
      })),
      increment: () => set((state) => ({ count: state.count + 1 })),
      reset: () => set({ items: [], count: 0 }),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// React Hook
export function useStoreSelector<T>(selector: (state: StoreState) => T): T {
  return useStore(store, selector);
}

export function useStoreActions() {
  return useStore(store, (state) => ({
    addItem: state.addItem,
    removeItem: state.removeItem,
    increment: state.increment,
    reset: state.reset,
  }));
}

export { useStore };
export default store;
```

---

## 九、路由系统设计

### 9.1 路由定义（Ionic Router）

```typescript
// src/router/routes.tsx
import React from 'react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Redirect } from 'react-router-dom';

export const ROUTES = {
  HOME: '/',
  TABS: '/tabs',
  TAB_HOME: '/tabs/home',
  TAB_SEARCH: '/tabs/search',
  TAB_PROFILE: '/tabs/profile',
  DETAIL: '/detail/:id',
  SETTINGS: '/settings',
  LOGIN: '/login',
} as const;

export type RoutePath = typeof ROUTES[keyof typeof ROUTES];

export const AppRoutes: React.FC = () => {
  return (
    <IonReactRouter>
      <Route path={ROUTES.HOME} exact>
        <Redirect to={ROUTES.TABS} />
      </Route>
      
      <Route path={ROUTES.TABS} exact>
        <TabsPage />
      </Route>
      
      <Route path={ROUTES.DETAIL} exact>
        <DetailPage />
      </Route>
      
      <Route path={ROUTES.SETTINGS} exact>
        <SettingsPage />
      </Route>
      
      <Route path={ROUTES.LOGIN} exact>
        <LoginPage />
      </Route>
      
      <Route path="*" exact>
        <Redirect to={ROUTES.HOME} />
      </Route>
    </IonReactRouter>
  );
};
```

---

## 十、国际化规范

（参考通用架构标准，与 Tauri 版本相同）

---

## 十一、移动端 UI 规范

### 11.1 响应式布局

```css
/* 移动端基础样式 */
:root {
  /* 安全区域 */
  --safe-area-inset-top: env(safe-area-inset-top);
  --safe-area-inset-bottom: env(safe-area-inset-bottom);
  --safe-area-inset-left: env(safe-area-inset-left);
  --safe-area-inset-right: env(safe-area-inset-right);
  
  /* 状态栏高度 */
  --status-bar-height: 44px;
  --nav-bar-height: 56px;
  --tab-bar-height: 83px;
  
  /* 最小点击区域 */
 --min-touch-target: 44px;
}

/* 适配全面屏 */
.app-container {
  padding-top: var(--safe-area-inset-top);
  padding-bottom: var(--safe-area-inset-bottom);
}

/* 响应式断点 */
@media (max-width: 375px) {
  /* iPhone SE 等小屏设备 */
  .text-size {
    font-size: 14px;
  }
}

@media (min-width: 768px) {
  /* 平板设备 */
  .mobile-only {
    display: none;
  }
}
```

### 11.2 触控优化

```css
/* 禁用点击高亮 */
* {
  -webkit-tap-highlight-color: transparent;
}

/* 禁用长按菜单 */
.no-context-menu {
  -webkit-touch-callout: none;
  touch-callout: none;
}

/* 禁用文本选择 */
.no-select {
  -webkit-user-select: none;
  user-select: none;
}

/* 平滑滚动 */
.scroll-container {
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
}

/* 防止滚动穿透 */
.modal-open {
  position: fixed;
  overflow: hidden;
}
```

### 11.3 动画规范

```css
/* 页面转场动画 */
.page-enter {
  transform: translateX(100%);
}

.page-enter-active {
  transform: translateX(0);
  transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.page-exit {
  transform: translateX(0);
}

.page-exit-active {
  transform: translateX(-100%);
  transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* 按钮按压效果 */
.btn:active {
  transform: scale(0.98);
  opacity: 0.8;
  transition: all 100ms ease;
}
```

---

## 十二、PWA 规范

### 12.1 Manifest 配置

```json
{
  "name": "My Mobile App",
  "short_name": "MyApp",
  "description": "My Mobile Application",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#ffffff",
  "theme_color": "#007aff",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-maskable-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "categories": ["productivity", "utilities"],
  "screenshots": [
    {
      "src": "/screenshots/home.png",
      "sizes": "1080x1920",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ],
  "shortcuts": [
    {
      "name": "Home",
      "short_name": "Home",
      "url": "/tabs/home",
      "icons": [{ "src": "/icons/home-shortcut.png", "sizes": "192x192" }]
    }
  ]
}
```

### 12.2 Service Worker 缓存策略

```typescript
// vite.app.config.ts 中的 PWA 配置
VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    runtimeCaching: [
      // API 请求 - 网络优先，超时使用缓存
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
      // 图片 - 缓存优先
      {
        urlPattern: /^https:\/\/.*\.(png|jpg|jpeg|svg|gif|webp)$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'image-cache',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24 * 7,
          },
        },
      },
      // 静态资源 - 缓存优先
      {
        urlPattern: /^https:\/\/cdn\./i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'cdn-cache',
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 60 * 60 * 24 * 30,
          },
        },
      },
    ],
  },
});
```

---

## 十三、Capacitor 原生集成

### 13.1 常用插件

```json
{
  "dependencies": {
    "@capacitor/core": "^7.0.0",
    "@capacitor/cli": "^7.0.0",
    "@capacitor/app": "^7.0.0",
    "@capacitor/camera": "^7.0.0",
    "@capacitor/clipboard": "^7.0.0",
    "@capacitor/device": "^7.0.0",
    "@capacitor/dialog": "^7.0.0",
    "@capacitor/filesystem": "^7.0.0",
    "@capacitor/geolocation": "^7.0.0",
    "@capacitor/haptics": "^7.0.0",
    "@capacitor/keyboard": "^7.0.0",
    "@capacitor/local-notifications": "^7.0.0",
    "@capacitor/motion": "^7.0.0",
    "@capacitor/network": "^7.0.0",
    "@capacitor/push-notifications": "^7.0.0",
    "@capacitor/screen-reader": "^7.0.0",
    "@capacitor/share": "^7.0.0",
    "@capacitor/splash-screen": "^7.0.0",
    "@capacitor/status-bar": "^7.0.0",
    "@capacitor/text-zoom": "^7.0.0",
    "@capacitor/toast": "^7.0.0"
  }
}
```

### 13.2 原生插件使用示例

```typescript
// 相机使用
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export async function takePhoto(): Promise<string> {
  const photo = await Camera.getPhoto({
    quality: 90,
    allowEditing: false,
    resultType: CameraResultType.Uri,
    source: CameraSource.Camera,
  });
  return photo.webPath!;
}

// 分享功能
import { Share } from '@capacitor/share';

export async function shareContent(title: string, text: string, url?: string): Promise<void> {
  await Share.share({
    title,
    text,
    url,
    dialogTitle: 'Share',
  });
}

// 推送通知
import { PushNotifications } from '@capacitor/push-notifications';

export async function registerPushNotifications(): Promise<void> {
  await PushNotifications.requestPermissions();
  await PushNotifications.register();
  
  PushNotifications.addListener('registration', (token) => {
    console.log('Push registration success, token: ' + token.value);
  });
  
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Push notification received: ', notification);
  });
}
```

---

## 十四、开发规范

（参考通用架构标准，与 Tauri 版本相同）

---

## 十五、构建与发布

### 15.1 构建流程

```bash
# 开发模式
pnpm dev

# 类型检查
pnpm typecheck

# 代码检查
pnpm lint

# 构建库
pnpm build

# 构建 PWA 应用
pnpm build:app

# 同步原生平台
pnpm cap:sync

# 打开 iOS 项目（需要 Xcode）
pnpm cap:ios

# 打开 Android 项目（需要 Android Studio）
pnpm cap:android

# 构建 iOS
pnpm cap:build:ios

# 构建 Android
pnpm cap:build:android
```

### 15.2 iOS 发布流程

```bash
# 1. 构建 Web 资源
pnpm build:app

# 2. 同步到 iOS
pnpm cap:sync

# 3. 在 Xcode 中打开
pnpm cap:ios

# 4. 在 Xcode 中:
#    - 选择 Team
#    - 配置 Signing & Capabilities
#    - Product > Archive
#    - Distribute App > App Store Connect
```

### 15.3 Android 发布流程

```bash
# 1. 构建 Web 资源
pnpm build:app

# 2. 同步到 Android
pnpm cap:sync

# 3. 在 Android Studio 中打开
pnpm cap:android

# 4. 在 Android Studio 中:
#    - Build > Generate Signed Bundle / APK
#    - 选择 Android App Bundle
#    - 创建或选择 Keystore
#    - 上传到 Google Play Console
```

---

## 十六、快速启动模板

### 16.1 创建新包

```bash
# 1. 创建目录结构
mkdir -p my-mobile-package/{src/{components/{mobile,shared},pages,services,store,entities,types,hooks,utils,platform,i18n},app,capacitor,dist}

# 2. 初始化 package.json
cd my-mobile-package
pnpm init

# 3. 安装依赖
pnpm add react react-dom @capacitor/core @capacitor/app @capacitor/haptics
pnpm add -D typescript @types/react @types/react-dom vite @vitejs/plugin-react vite-plugin-pwa @capacitor/cli @capacitor/ios @capacitor/android

# 4. 创建配置文件
# tsconfig.json, vite.config.ts, vite.app.config.ts, capacitor.config.ts

# 5. 创建入口文件
# src/index.ts, app/main.tsx, app/App.tsx, app/index.html
```

### 16.2 最小可运行模板

```typescript
// app/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initializePlatform } from '../src/platform';
import '../src/styles/index.css';

// 初始化平台
initializePlatform();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

```typescript
// app/App.tsx
import React from 'react';

const App: React.FC = () => {
  return (
    <div className="app">
      <h1>Hello, Mobile!</h1>
    </div>
  );
};

export default App;
```

```html
<!-- app/index.html -->
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#ffffff" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <title>My Mobile App</title>
    <link rel="manifest" href="/manifest.json" />
    <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/main.tsx"></script>
  </body>
</html>
```

---

## 十七、附录

### 17.1 检查清单

#### 新包创建检查清单

- [ ] 目录结构完整
- [ ] package.json 配置正确
- [ ] TypeScript 配置完成
- [ ] Vite 配置完成（库模式 + 应用模式含 PWA）
- [ ] Capacitor 配置完成
- [ ] 入口文件导出完整
- [ ] 平台适配层实现（Web + Capacitor）
- [ ] 移动端专用 Hooks（useSafeArea, useKeyboard, useNetworkStatus）
- [ ] 国际化配置（如需要）
- [ ] 路由配置（如需要）
- [ ] PWA Manifest 配置
- [ ] Service Worker 缓存策略
- [ ] 单元测试编写
- [ ] README 文档编写

#### 发布前检查清单

- [ ] 类型检查通过
- [ ] 代码检查通过
- [ ] 测试全部通过
- [ ] 构建成功
- [ ] 版本号已更新
- [ ] CHANGELOG 已更新
- [ ] 文档已更新
- [ ] iOS/Android 图标和启动图已配置
- [ ] 应用签名已配置

### 17.2 常见问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 模块找不到 | 包未构建 | 运行 `pnpm build` |
| 类型错误 | 类型未导出 | 检查 index.ts 导出 |
| 样式丢失 | 样式未引入 | 引入 `dist/style.css` |
| 平台 API 不可用 | 未初始化 | 调用 `initializePlatform()` |
| PWA 不工作 | Service Worker 未注册 | 检查 vite-plugin-pwa 配置 |
| Capacitor 插件无效 | 未同步 | 运行 `pnpm cap:sync` |
| iOS 构建失败 | 签名问题 | 检查 Xcode Signing 配置 |
| Android 构建失败 | SDK 版本 | 检查 Android SDK 配置 |

### 17.3 参考资源

- [React 官方文档](https://react.dev/)
- [TypeScript 官方文档](https://www.typescriptlang.org/)
- [Vite 官方文档](https://vitejs.dev/)
- [Capacitor 官方文档](https://capacitorjs.com/)
- [Ionic Framework](https://ionicframework.com/)
- [PWA 官方文档](https://web.dev/progressive-web-apps/)
- [Workbox 文档](https://developer.chrome.com/docs/workbox/)

---

**文档版本**: v1.0  
**最后更新**: 2026 年 2 月 20 日  
**维护者**: SDKWork Team
