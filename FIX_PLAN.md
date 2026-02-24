# Magic Studio v2 - 全面修复计划

## 执行摘要

- **总错误数**: 1,748 个 TypeScript 编译错误
- **影响范围**: 32 个包中的 28 个
- **预计修复时间**: 8-12 个工作日

---

## 错误分类统计

| 错误类型 | 数量 | 占比 | 描述 |
|---------|------|------|------|
| TS2339 | 829 | 47.4% | 属性不存在 |
| TS2305 | 732 | 41.9% | 模块无导出成员 |
| TS2353 | 73 | 4.2% | 对象字面量类型错误 |
| TS2307 | 23 | 1.3% | 无法找到模块 |
| 其他 | 91 | 5.2% | 类型兼容性等 |

---

## 第一阶段：核心导出修复（优先级最高）

### 1.1 sdkwork-react-commons 导出修复

**目标文件**: `packages/sdkwork-react-commons/src/index.ts`

需要补充的导出：

#### UI 组件
- Button, Popover, Tabs, TabItem, Card
- ImageUpload, VideoUpload, AudioUpload
- InputAttachment, WindowControls
- Confirm, useConfirm
- AspectRatioSelector, TreeItem
- ErrorBoundary, GalleryCard, GalleryItem

#### Hook
- useAssetUrl, useTheme

#### 工具函数
- generateUUID, getAssetLabel, useAssetUrl
- getIconComponent, markdownUtils, audioUtils
- createLogger, Logger, LogLevel, LoggerConfig

#### 类型定义
- BaseEntity, MediaResource, MediaResourceType
- VideoMediaResource, ImageMediaResource, AudioMediaResource
- FileMediaResource, AnyMediaResource, AssetMediaResource
- ObjectRef

#### 服务接口
- IBaseService, ServiceResult, Result
- Page, PageRequest, DEFAULT_PAGE_SIZE
- logger

#### 配置类型
- AspectRatio, Resolution
- MediaType, AssetType
- ImageStyle, StyleOption
- GenerationConfig, GeneratedResult, GenerationTask
- GenerationProduct, GenerationType
- ImageTask, VideoTask, MusicTask, VoiceTask, SfxTask, AudioTask
- ModelSelector, ModelProvider, GenerationMode

#### 业务实体
- Asset, Note, NoteFolder, NoteSummary, NoteType
- FilmProject, FilmShot, FilmCharacter, FilmLocation
- FilmProp, FilmScene, FilmDialogueItem, FilmSettings, FilmViewMode
- MediaScene, GalleryCard, GalleryItem, PortalTab
- AppNotification, NotificationType
- ThemeMode, ServerStorageProtocol, UploadIntentResponse, AccessUrlResponse
- IStorageProvider, StorageObject, UploadResult
- DragContext, TrackIntervalIndex
- EditorSession, User, ArticlePayload, PublishResult, PublishTarget
- ProjectType, StudioWorkspace, StudioProject
- CutProject, CutTimeline, CutTrack, CutClip, CutLayer, CutTemplate
- CharacterTask, ChatSession, Presentation, Bookmark
- HistoryItem, DriveMetadata, CanvasBoard, Effect
- UploadedFile, QuadTree, Rect

### 1.2 sdkwork-react-core 导出修复

**目标文件**: `packages/sdkwork-react-core/src/index.ts`

需要补充的导出：

#### 服务
- genAIService, uploadHelper, mediaService
- downloadService, thumbnailGenerator, storageManager
- remixService, modelInfoService, mediaAnalysisService
- aspectRatioService

#### Router
- useRouter, useNavigate, useCurrentPath, useRouteParams
- RouterProvider, ROUTES

#### 存储
- LocalStorageService

#### 事件
- EventBus, useEventSubscription

#### 类型
- FileEntry, FileStat

#### 存储提供者
- S3Provider, ServerProvider

---

## 第二阶段：实体定义修复

### 2.1 BaseEntity 定义

```typescript
// packages/sdkwork-react-commons/src/entities/base.entity.ts
export interface BaseEntity {
  id: string;
  uuid?: string;
  createdAt: number;
  updatedAt: number;
}
```

### 2.2 User 实体修复

```typescript
// packages/sdkwork-react-commons/src/entities/user.entity.ts
import { BaseEntity } from './base.entity';

export interface User extends BaseEntity {
  username: string;
  email: string;
  avatar?: string;  // 注意：不是 avatarUrl
  isVip: boolean;
  bio?: string;
  location?: string;
  website?: string;
}
```

### 2.3 Asset 实体修复

```typescript
// packages/sdkwork-react-commons/src/entities/asset.entity.ts
import { BaseEntity } from './base.entity';
import { AnyMediaResource } from './media.entity';

export interface Asset extends BaseEntity {
  id: string;
  uuid: string;
  name: string;
  type: string;
  path: string;
  media?: AnyMediaResource;
  createdAt: number;
  updatedAt: number;
  // ... 其他属性
}
```

---

## 第三阶段：平台 API 接口定义

### 3.1 PlatformAPI 接口

```typescript
// packages/sdkwork-react-core/src/platform/types.ts
export interface PlatformAPI {
  // 系统信息
  getPlatform(): 'windows' | 'macos' | 'linux';
  getOsType(): Promise<'windows' | 'macos' | 'linux'>;
  getSystemTheme(): Promise<'light' | 'dark'>;
  
  // 路径
  getPath(path: 'home' | 'appData' | 'documents' | 'downloads'): Promise<string>;
  
  // 文件
  checkCommandExists(cmd: string): Promise<boolean>;
  
  // 窗口
  minimizeWindow(): Promise<void>;
  maximizeWindow(): Promise<void>;
  closeWindow(): Promise<void>;
  restartApp(): Promise<void>;
  toggleDevTools(): Promise<void>;
  
  // 外部
  openExternal(url: string): Promise<void>;
  showItemInFolder(path: string): Promise<void>;
  saveFile(options: any): Promise<string | null>;
  selectFile(options: any): Promise<string | null>;
  selectDir(options: any): Promise<string | null>;
  
  // 剪贴板
  copy(text: string): Promise<void>;
  paste(): Promise<string>;
  
  // 通知
  notify(title: string, message: string): Promise<void>;
  
  // 对话框
  confirm(message: string): Promise<boolean>;
  
  // 更新
  checkForUpdates(): Promise<any>;
  installUpdate(): Promise<void>;
  
  // 存储
  setStorage(key: string, value: any): Promise<void>;
  getStorage(key: string): Promise<any>;
  
  // 转换
  convertFileSrc(path: string): string;
}
```

---

## 第四阶段：FS API 接口定义

### 4.1 FSAPI 接口

```typescript
// packages/sdkwork-react-fs/src/types.ts
export interface FSStat {
  type: 'file' | 'directory';
  size?: number;
  createdAt?: number;
  lastModified?: number;
}

export interface FSAPI {
  // 路径
  normalize(path: string): string;
  join(...paths: string[]): string;
  dirname(path: string): string;
  basename(path: string, ext?: string): string;
  extname(path: string): string;
  isBinary(path: string): boolean;
  detectSeparator(path: string): string;
  
  // 目录
  readDir(path: string): Promise<FSStat[]>;
  createDir(path: string, options?: { recursive: boolean }): Promise<void>;
  
  // 文件
  readFile(path: string): Promise<string>;
  readFileBinary(path: string): Promise<Uint8Array>;
  readFileBlob(path: string): Promise<Blob>;
  writeFile(path: string, content: string): Promise<void>;
  writeFileBinary(path: string, content: Uint8Array): Promise<void>;
  writeFileBlob(path: string, content: Blob): Promise<void>;
  
  // 操作
  stat(path: string): Promise<FSStat>;
  delete(path: string): Promise<void>;
  rename(oldPath: string, newPath: string): Promise<void>;
  copyFile(src: string, dest: string): Promise<void>;
}
```

---

## 修复进度跟踪

### 已完成
- [x] SkillsPage 修改为技能市场
- [x] 路由导入问题修复
- [x] Layout 组件 leftPane 问题修复
- [x] AudioLeftGeneratorPanel 临时存根修复
- [x] AudioPage 临时存根修复

### 待完成
- [ ] sdkwork-react-commons 导出修复
- [ ] sdkwork-react-core 导出修复
- [ ] 实体定义修复
- [ ] 平台 API 接口定义
- [ ] FS API 接口定义
- [ ] sdkwork-react-magiccut 修复
- [ ] sdkwork-react-assets 修复
- [ ] sdkwork-react-film 修复
- [ ] 其他包修复

---

## 修复后验证

1. 运行 `npx tsc --noEmit` 验证无类型错误
2. 运行 `npm run build` 验证构建成功
3. 运行应用验证功能正常
4. 建立 CI 流程防止新的类型错误

---

## 时间估算

| 阶段 | 任务 | 预计时间 |
|-----|------|---------|
| 第一阶段 | 核心导出修复 | 2 天 |
| 第二阶段 | 实体定义修复 | 2 天 |
| 第三阶段 | 平台 API 修复 | 2 天 |
| 第四阶段 | FS API 修复 | 2 天 |
| 第五阶段 | 包级修复 | 4 天 |
| **总计** | | **12 天** |
