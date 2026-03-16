# Magic Studio V2 - 前端SDK接入执行规范

## 项目概述

**应用名称**: magic-studio-v2 (Magic Studio)  
**技术栈**: React + TypeScript + Vite + Tauri + pnpm Workspace  
**SDK接入**: `@sdkwork/app-sdk` (基于 OpenAPI 生成的 TypeScript SDK)  
**目标平台**: Windows / macOS / Linux 桌面应用

---

## 核心原则

### 1. SDK架构理解

```
后端服务 (端口: 8080)
    ↓ OpenAPI 3.x Schema
SDK生成器 (sdkwork-sdk-generator)
    ↓ 生成多语言SDK
@sdkwork/app-sdk (TypeScript SDK包)
    ↓ workspace 依赖
packages/sdkwork-react-core/sdk (前端SDK层)
    ↓ 业务封装
src/modules/*/services (业务Service层)
    ↓ Tauri桥接
桌面原生应用 (Windows/macOS/Linux)
```

### 2. 目录结构规范

```
magic-studio-v2/
├── src/                               # 应用壳 (App Shell)
│   ├── app/                           # 应用入口、路由配置
│   ├── components/                    # 全局共享UI组件
│   ├── modules/                       # 业务模块实现
│   │   ├── auth/                      # 认证模块
│   │   │   ├── components/            # 登录/注册组件
│   │   │   ├── entities/              # 用户实体定义
│   │   │   ├── pages/                 # 登录页
│   │   │   └── services/              # 认证服务
│   │   ├── chat/                      # 聊天模块
│   │   ├── image/                     # 图像生成模块
│   │   ├── video/                     # 视频生成模块
│   │   ├── audio/                     # 音频生成模块
│   │   ├── music/                     # 音乐生成模块
│   │   ├── sfx/                       # 音效生成模块
│   │   ├── drive/                     # 云盘模块
│   │   ├── notes/                     # 笔记模块
│   │   ├── film/                      # 分镜模块
│   │   ├── canvas/                    # 画布模块
│   │   ├── editor/                    # 代码编辑器模块
│   │   ├── magic-cut/                 # 剪辑模块
│   │   ├── settings/                  # 设置模块
│   │   ├── vip/                       # 会员模块
│   │   └── user/                      # 用户中心模块
│   ├── platform/                      # 平台适配层 (Tauri桥接)
│   └── styles/                        # 全局样式
├── packages/                          # 可复用包 (pnpm workspace)
│   ├── sdkwork-react-core/            # 核心层：SDK客户端、状态管理
│   │   └── src/
│   │       ├── sdk/                   # SDK客户端配置
│   │       │   ├── hooks.ts           # SDK Hooks (useSdkwork, useAppSdkClient等)
│   │       │   ├── index.ts           # SDK客户端初始化与导出
│   │       │   └── uploadViaPresignedUrl.ts
│   │       └── ai/                    # AI相关功能
│   ├── sdkwork-react-commons/         # 共享组件库
│   ├── sdkwork-react-types/           # 共享类型定义
│   ├── sdkwork-react-i18n/            # 国际化
│   ├── sdkwork-react-fs/              # 文件系统抽象
│   ├── sdkwork-react-auth/            # 认证包 (对外导出)
│   ├── sdkwork-react-chat/            # 聊天包
│   ├── sdkwork-react-image/           # 图像生成包
│   ├── sdkwork-react-video/           # 视频生成包
│   ├── sdkwork-react-audio/           # 音频生成包
│   ├── sdkwork-react-music/           # 音乐生成包
│   ├── sdkwork-react-sfx/             # 音效生成包
│   ├── sdkwork-react-drive/           # 云盘包
│   ├── sdkwork-react-notes/           # 笔记包
│   ├── sdkwork-react-film/            # 分镜包
│   ├── sdkwork-react-canvas/          # 画布包
│   ├── sdkwork-react-editor/          # 编辑器包
│   ├── sdkwork-react-magiccut/        # 剪辑包
│   ├── sdkwork-react-settings/        # 设置包
│   ├── sdkwork-react-vip/             # 会员包
│   ├── sdkwork-react-user/            # 用户中心包
│   ├── sdkwork-react-trade/           # 交易包
│   ├── sdkwork-react-assets/          # 资产包
│   └── ...                            # 其他业务包
├── src-tauri/                         # Tauri原生层 (Rust)
│   ├── src/
│   │   ├── commands/                  # Tauri命令
│   │   ├── framework/                 # 框架服务
│   │   └── ...
│   ├── Cargo.toml
│   └── tauri.conf.json
├── scripts/                           # 构建/验证脚本
└── prompt/execute.md                  # 本执行规范
```

### 3. Service层开发规范

所有业务Service必须遵循以下原则：

1. **SDK客户端获取**: 使用 `useAppSdkClient()` Hook 或 `getSdkworkClient()` 函数
2. **模块访问**: 使用专用 Hooks 如 `useGeneration()`, `useAuth()`, `useAssets()` 等
3. **错误处理**: 统一处理SDK调用异常，适配桌面端交互
4. **原生能力**: 通过 Tauri API 访问桌面原生功能
5. **类型安全**: 充分利用 `@sdkwork/app-sdk` 提供的类型定义

**Service模板示例**:

```typescript
import { getSdkworkClient } from '@sdkwork/react-core/sdk';
import type { GenerationRequest } from '@sdkwork/app-sdk';

export async function generateImage(params: GenerationRequest) {
  const client = getSdkworkClient();
  try {
    const response = await client.generation.generateImage(params);
    return response.data;
  } catch (error) {
    console.error('Failed to generate image:', error);
    throw error;
  }
}
```

**Hook使用示例**:

```typescript
import { useGeneration, useAssets, useUser } from '@sdkwork/react-core/sdk';

function MyComponent() {
  const { module: generation, isReady: isGenerationReady } = useGeneration();
  const { module: assets, isReady: isAssetsReady } = useAssets();
  const { client, isInitialized } = useAppSdkClient();
  
  // 使用模块
  useEffect(() => {
    if (isGenerationReady) {
      generation.generateImage({ ... });
    }
  }, [isGenerationReady]);
}
```

### 4. Tauri原生能力使用规范

```typescript
// 正确：通过Tauri API访问原生能力
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { readFile, writeFile } from '@tauri-apps/plugin-fs';
import { Command } from '@tauri-apps/plugin-shell';

// 调用Rust命令
const result = await invoke('my_command', { arg: 'value' });

// 文件选择
const selected = await open({ multiple: false, filters: [{ name: 'Images', extensions: ['png', 'jpg'] }] });

// 文件读写
const content = await readFile(filePath);
await writeFile(filePath, new Uint8Array(content));

// 执行系统命令
const output = await Command.create('echo', ['hello']).execute();
```

---

## 执行流程

### 阶段一：环境准备与基础服务

1. **确认后端服务状态**
   - 确保后端服务运行在 `http://localhost:8080`
   - 验证 OpenAPI 文档可访问: `http://localhost:8080/v3/api-docs/app`

2. **检查SDK状态**
   - 确认 `@sdkwork/app-sdk` 包已正确链接 (workspace:*)
   - 验证 SDK 类型定义与后端 API 一致

3. **桌面端环境准备**
   - 安装 Rust 工具链
   - 安装 Tauri CLI: `cargo install tauri-cli`
   - 确保 Tauri 依赖完整

4. **基础SDK配置**
   - 检查 `packages/sdkwork-react-core/src/sdk/index.ts` 客户端配置
   - 检查 `packages/sdkwork-react-core/src/sdk/hooks.ts` Hooks导出
   - 建立统一的错误处理和响应解析机制

### 阶段二：逐个模块SDK接入

按优先级顺序处理各业务模块：

#### P0 - 核心基础模块

1. **Auth (认证模块)**
   - Service: `src/modules/auth/services/authService.ts`
   - API: `/auth/**`, `/login/**`, `/register/**`, `/oauth/**`
   - 功能: 登录、注册、OAuth、Token刷新
   - SDK Hook: `useAuth()`

2. **User (用户中心)**
   - Service: `src/modules/user/services/`
   - API: `/profile/**`, `/account/**`
   - 功能: 用户信息、个人资料、账户设置
   - SDK Hook: `useUser()`

#### P1 - 核心业务模块 (AIGC生成)

1. **Image (图像生成)**
   - Service: `src/modules/image/services/imageService.ts`
   - API: `/generation/image/**`
   - 功能: 文生图、图生图、图像编辑
   - SDK Hook: `useGeneration()`

2. **Video (视频生成)**
   - Service: `src/modules/video/services/videoService.ts`
   - API: `/generation/video/**`
   - 功能: 文生视频、图生视频
   - SDK Hook: `useGeneration()`

3. **Audio (音频生成)**
   - Service: `src/modules/audio/services/audioService.ts`
   - API: `/generation/audio/**`
   - 功能: 语音合成、语音克隆
   - SDK Hook: `useGeneration()`

4. **Music (音乐生成)**
   - Service: `src/modules/music/services/musicService.ts`
   - API: `/generation/music/**`
   - 功能: 音乐生成、风格迁移
   - SDK Hook: `useGeneration()`

5. **SFX (音效生成)**
   - Service: `src/modules/sfx/services/sfxService.ts`
   - API: `/generation/sfx/**`
   - 功能: 音效生成
   - SDK Hook: `useGeneration()`

6. **Chat (聊天模块)**
   - Service: `src/modules/chat/services/chatService.ts`
   - API: `/chat/**`, `/session/**`, `/message/**`
   - 功能: 会话列表、消息收发
   - SDK Hook: `useChat()`

#### P2 - 扩展业务模块

1. **Assets (资产中心)**
   - Service: `src/modules/assets/services/assetService.ts`
   - API: `/assets/**`
   - 功能: 资产列表、资产管理
   - SDK Hook: `useAssets()`

2. **Drive (云盘)**
   - Service: `src/modules/drive/services/driveService.ts`
   - API: `/drive/**`, `/file/**`
   - 功能: 文件上传、下载、管理
   - 原生能力: Tauri文件系统

3. **Notes (笔记)**
   - Service: `src/modules/notes/services/noteService.ts`
   - API: `/notes/**`
   - 功能: 笔记创建、编辑、管理

4. **Film (分镜)**
   - Service: `src/modules/film/services/filmService.ts`
   - API: `/film/**`
   - 功能: 分镜创建、脚本编辑

5. **Canvas (画布)**
   - Service: `src/modules/canvas/services/canvasService.ts`
   - 功能: 可视化工作流

6. **Editor (代码编辑器)**
   - Service: `src/modules/editor/services/editorService.ts`
   - 功能: 代码编辑

7. **MagicCut (剪辑)**
   - 功能: 音视频剪辑

#### P3 - 交易与增值模块

1. **VIP (会员)**
   - Service: `src/modules/vip/services/vipService.ts`
   - API: `/vip/**`, `/membership/**`
   - 功能: 会员等级、权益查询
   - SDK Hook: `useVip()`

2. **Trade (交易)**
   - Service: 交易相关服务
   - API: `/order/**`, `/cart/**`, `/payment/**`
   - 功能: 订单、购物车、支付
   - SDK Hooks: `useOrder()`, `useCart()`, `usePayment()`

3. **Settings (设置)**
   - Service: `src/modules/settings/`
   - API: `/settings/**`
   - 功能: 应用设置
   - SDK Hook: `useSettings()`

### 阶段三：SDK迭代修复流程

当发现SDK不满足业务需求时，按以下流程处理：

```
1. 分析问题
   ↓
2. 定位后端Controller代码
   (路径: spring-ai-plus-business/spring-ai-plus-server-application)
   ↓
3. 修复后端Java代码
   ↓
4. 重新编译启动后端服务
   cd spring-ai-plus-business/spring-ai-plus-server-application
   mvn clean package -DskipTests
   java -jar target/*.jar
   ↓
5. 刷新OpenAPI快照
   curl http://localhost:8080/v3/api-docs/app -o sdkwork-sdk-app/app-openapi-8080.json
   ↓
6. 重新生成SDK
   node sdk/sdkwork-sdk-generator/bin/sdkgen.js generate \
     -i sdkwork-sdk-app/app-openapi-8080.json \
     -o sdkwork-sdk-app/sdkwork-app-sdk-typescript \
     -n sdkwork-app-sdk -t app -l typescript \
     --base-url http://localhost:8080 --api-prefix /app/v3/api
   ↓
7. 桌面端重新构建
   pnpm build:packages
   ↓
8. 验证功能
   pnpm tauri
   ↓
9. 重复迭代直到功能完美
```

---

## 桌面端开发检查清单

### 每个模块接入时需检查：

- [ ] SDK API 调用是否正确
- [ ] 错误处理是否完善 (含网络错误、超时处理)
- [ ] 加载状态是否处理 (Skeleton/Loading)
- [ ] 空状态是否处理 (EmptyState)
- [ ] 分页/无限滚动是否正确实现
- [ ] Tauri原生能力调用是否正确 (文件系统/对话框等)
- [ ] 响应式布局是否正常 (桌面端适配)

### 代码质量检查：

```bash
# 运行服务封装规范检查
pnpm run audit:services

# 运行服务策略检查
pnpm run audit:services:policy

# 完整验证 (包含构建)
pnpm run verify:service-standards

# 构建验证
pnpm run build

# 类型检查
pnpm run typecheck

# 代码检查
pnpm run lint

# 格式化检查
pnpm run format:check
```

---

## 重要配置

### 环境变量

```env
# .env.development
VITE_API_BASE_URL=http://localhost:8080
VITE_ACCESS_TOKEN=your-test-token
```

### SDK客户端配置

```typescript
// 默认配置从环境变量读取
const config = createAppSdkClientConfig({
  baseUrl: import.meta.env.VITE_API_BASE_URL,
  accessToken: import.meta.env.VITE_ACCESS_TOKEN,
});
```

### Tauri配置

```json
// src-tauri/tauri.conf.json
{
  "identifier": "com.magicstudio.app",
  "build": {
    "frontendDist": "../dist",
    "devUrl": "http://localhost:5173"
  },
  "app": {
    "windows": [
      {
        "title": "Magic Studio",
        "width": 1400,
        "height": 900
      }
    ]
  }
}
```

---

## 构建与部署

### Web构建

```bash
pnpm build          # 生产构建
pnpm build:packages # 构建所有包
```

### 桌面端构建

```bash
# 开发模式
pnpm tauri          # 启动Tauri开发模式

# 构建桌面应用
pnpm tauri build    # 构建生产版本
```

### 包管理

```bash
# 安装依赖
pnpm install

# 构建所有包
pnpm build:packages

# 类型检查所有包
pnpm typecheck

# 单包命令
pnpm --filter sdkwork-react-core build
pnpm --filter sdkwork-react-core typecheck
```

---

## 调试指南

### Web调试

```bash
pnpm dev              # 启动开发服务器
```

### Tauri调试

```bash
# 启动Tauri开发模式 (含Rust调试)
pnpm tauri

# 查看Rust日志
RUST_LOG=debug pnpm tauri

# Chrome DevTools 调试
# 1. 在应用中按 F12 或 Ctrl+Shift+I
# 2. 或使用 Rust 日志查看前端输出
```

---

## 参考文档

- SDK README: `sdkwork-sdk-app/README.md`
- TypeScript SDK: `sdkwork-sdk-app/sdkwork-app-sdk-typescript/README.md`
- Tauri文档: https://tauri.app/docs
- 项目架构: `ARCHITECT.md`
- 架构文档: `docs/`

---

## 成功标准

1. 所有P0/P1模块完成功能接入
2. `pnpm run build` 构建成功
3. `pnpm run typecheck` 类型检查通过
4. `pnpm run audit:services` 服务封装检查通过
5. Tauri桌面构建成功
6. 核心业务流程端到端测试通过
7. 应用能在桌面端正常运行
