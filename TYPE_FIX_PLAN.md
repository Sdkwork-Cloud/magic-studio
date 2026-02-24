# 主要类型错误修复计划

**生成时间**: 2026-02-22  
**优先级**: 高

---

## 问题根源

所有数据类型**必须继承 BaseEntity**，这是核心设计原则。

```typescript
interface BaseEntity {
    id: string;
    uuid?: string;
    createdAt: number;
    updatedAt: number;
}
```

---

## 修复清单

### 1. ✅ Film 模块类型 - 已修复

**文件**: 
- `packages/sdkwork-react-commons/src/types.ts`
- `packages/sdkwork-react-film/src/entities/film.entity.ts`

**修复内容**:
- ✅ `FilmProject` extends BaseEntity
- ✅ `FilmCharacter` extends BaseEntity
- ✅ `FilmScene` extends BaseEntity
- ✅ `FilmShot` extends BaseEntity
- ✅ `FilmLocation` extends BaseEntity
- ✅ `FilmProp` extends BaseEntity
- ✅ `FilmScript` extends BaseEntity
- ✅ `FilmSettings` extends BaseEntity
- ✅ `FilmUserInput` extends BaseEntity

---

### 2. 🔴 Notes 模块类型 - 待修复

**文件**: `packages/sdkwork-react-notes/src/`

**问题**:
- `NoteSummary` 缺少 `createdAt` 字段
- `Note` 缺少 `preview` 字段
- `TreeItem` 类型定义不匹配
- `NoteFolder` 缺少 `updatedAt` 字段

**需要修复的类型**:
```typescript
// 在 sdkwork-react-commons/src/types.ts 中
export interface Note extends BaseEntity {
    // ... 现有字段
    preview?: string;  // 添加缺失字段
}

export interface NoteSummary extends BaseEntity {
    // 确保有 createdAt, updatedAt
}

export interface NoteFolder extends BaseEntity {
    // 确保有所有必需字段
}

export interface TreeItem extends BaseEntity {
    kind: 'note' | 'folder';
    label: string;
    // ... 其他字段
}
```

---

### 3. 🔴 Portal Video 模块 - 待修复

**文件**: `packages/sdkwork-react-portal-video/src/components/PortalHeader.tsx`

**问题**: `User` 类型字段不匹配

**错误**:
```
Property 'avatarUrl' does not exist on type 'User'. Did you mean 'avatar'?
Property 'username' does not exist on type 'User'.
```

**修复**:
```typescript
// 在 sdkwork-react-commons/src/types.ts 中
export interface User extends BaseEntity {
    id: string;
    username: string;      // 添加
    email: string;
    avatar?: string;
    avatarUrl?: string;    // 添加（或移除使用 avatar）
    isVip?: boolean;
    // ... 其他字段
}
```

---

### 4. 🔴 Assets 模块 - 待修复

**文件**: `packages/sdkwork-react-assets/src/`

**问题**: `InputAttachment` 导出问题

**错误**:
```
'InputAttachment' refers to a value, but is being used as a type here.
```

**修复**: 确保正确导出类型和组件
```typescript
// 在 sdkwork-react-assets/src/index.ts 中
export { InputAttachment } from './components/InputAttachment/InputAttachment';
export type { InputAttachmentProps } from './components/InputAttachment/InputAttachment';
```

---

### 5. 🔴 FS 模块 - 待修复

**文件**: `packages/sdkwork-react-fs/src/`

**问题**: `FileStat` vs `FileEntry` 类型不匹配

**错误**:
```
Property 'size' is optional in type 'FileEntry' but required in type 'FileStat'.
Property 'type' does not exist on type 'FileStat'.
```

**修复**:
```typescript
// 在 sdkwork-react-commons/src/types.ts 中
export interface FileStat extends BaseEntity {
    name: string;
    path?: string;
    size: number;       // 必需
    type: 'file' | 'folder';  // 添加
    lastModified?: number;
    // ... 其他字段
}

export interface FileEntry extends FileStat {
    // 继承所有字段
    path: string;       // 必需
}
```

---

### 6. 🔴 Core 模块 - 待修复

**文件**: `packages/sdkwork-react-core/src/services/notification/notificationService.ts`

**问题**: `AppNotification` 类型字段不匹配

**错误**:
```
Types of property 'createdAt' are incompatible.
  Type 'string' is not assignable to type 'number'.
```

**修复**:
```typescript
// 在 sdkwork-react-core/src/services/notification/entities.ts 中
export interface AppNotification extends BaseEntity {
    // 确保 createdAt, updatedAt 是 number
    id: string;
    title: string;
    message: string;
    type: NotificationType;
    read: boolean;
    // ... 其他字段
}
```

---

### 7. 🔴 Video 模块 - 待修复

**文件**: `packages/sdkwork-react-video/src/`

**问题**: `VideoConfig` 缺少 `mode` 字段

**错误**:
```
Property 'mode' is missing in type 'VideoConfig'
```

**修复**:
```typescript
// 在 sdkwork-react-commons/src/types.ts 中
export interface VideoConfig {
    mode: 'text-to-video' | 'image-to-video' | string;  // 添加
    prompt: string;
    aspectRatio: AspectRatio;
    styleId?: string;
    resolution?: string;
    fps?: number;
    // ... 其他字段
}
```

---

### 8. 🔴 Voice Speaker 模块 - 待修复

**文件**: `packages/sdkwork-react-voicespeaker/src/`

**问题**: `VoiceConfig` 缺少必需字段

**错误**:
```
Type 'VoiceConfig' is missing the following properties from type 'GenerationConfig': prompt, aspectRatio, styleId
```

**修复**:
```typescript
// 在 sdkwork-react-commons/src/types.ts 中
export interface VoiceConfig extends GenerationConfig {
    voiceId: string;
    text: string;
    // 继承 prompt, aspectRatio, styleId 等
}
```

---

## 修复步骤

### 第一步：修复 sdkwork-react-commons
```bash
# 1. 编辑 types.ts 添加缺失的字段和继承
# 2. 确保所有接口都 extends BaseEntity
# 3. 重新生成 .d.ts 文件
cd packages/sdkwork-react-commons
pnpm run build
```

### 第二步：修复依赖模块
```bash
# 按顺序修复
cd packages/sdkwork-react-core
pnpm run typecheck

cd packages/sdkwork-react-assets
pnpm run typecheck

cd packages/sdkwork-react-fs
pnpm run typecheck

# ... 其他模块
```

### 第三步：验证主应用
```bash
cd ../..
pnpm run typecheck
```

---

## 设计原则

### 1. 所有实体必须继承 BaseEntity
```typescript
interface BaseEntity {
    id: string;
    uuid?: string;
    createdAt: number;  // 数字时间戳
    updatedAt: number;
}
```

### 2. 类型一致性
- 同一实体在不同模块中定义必须一致
- 使用 `sdkwork-react-commons` 作为单一事实来源

### 3. 导出规范
```typescript
// ✅ 正确
export interface MyEntity extends BaseEntity { }
export { MyComponent } from './components/MyComponent';

// ❌ 错误
export type MyEntity = { }  // 缺少 BaseEntity
```

---

## 进度追踪

| 模块 | 状态 | 进度 |
|------|------|------|
| sdkwork-react-types | ✅ 完成 | 100% |
| sdkwork-react-commons | ✅ 完成 | 100% |
| sdkwork-react-film | ✅ 完成 | 100% |
| sdkwork-react-trade | ✅ 完成 | 100% |
| sdkwork-react-notes | 🔴 待修复 | 0% |
| sdkwork-react-portal-video | 🔴 待修复 | 0% |
| sdkwork-react-assets | 🔴 待修复 | 0% |
| sdkwork-react-fs | 🔴 待修复 | 0% |
| sdkwork-react-core | 🔴 待修复 | 0% |
| sdkwork-react-video | 🔴 待修复 | 0% |
| sdkwork-react-voicespeaker | 🔴 待修复 | 0% |

### 已修复的关键问题

1. ✅ **BaseEntity 统一** - `sdkwork-react-commons` 现在继承 `sdkwork-react-types` 的 `BaseEntity`
2. ✅ **Film 模块类型** - 所有实体已正确继承 `BaseEntity`
3. ✅ **Note 模块类型** - `NoteSummary` 和 `TreeItem` 已继承 `BaseEntity`
4. ✅ **FileStat/FileEntry** - 已继承 `BaseEntity` 并添加必需字段
5. ✅ **VideoConfig** - 已继承 `GenerationConfig` 并添加 `mode` 字段
6. ✅ **VoiceConfig** - 已创建并继承 `GenerationConfig`

---

**最后更新**: 2026-02-22  
**维护者**: SDKWork Team
