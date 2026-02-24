# 运行时注入配置说明

## 概述

为了打破 `sdkwork-react-commons` 和 `sdkwork-react-fs` 对 `sdkwork-react-core` 的循环依赖，我们使用了**运行时注入模式**。

在应用启动时，需要将 `Platform API` 和 `Upload Helper` 注入到全局 `window` 对象，供相关包使用。

---

## 配置步骤

### 步骤 1：确认 bootstrap.ts 已配置

确保 `src/app/bootstrap.ts` 包含以下注入代码：

```typescript
import { platform } from 'sdkwork-react-core';
import { uploadHelper } from 'sdkwork-react-core';

/**
 * 注入全局 Platform API 和 Upload Helper
 * 这是 sdkwork-react-commons 和 sdkwork-react-fs 包运行所必需的
 */
const injectGlobalAPI = () => {
  if (typeof window !== 'undefined') {
    // 注入 Platform API
    (window as any).__sdkworkPlatform = platform;
    
    // 注入 Upload Helper
    (window as any).__sdkworkUploadHelper = uploadHelper;
    
    console.log('[Magic Studio] Global APIs injected: platform, uploadHelper');
  }
};

export const bootstrap = async () => {
  // 首先注入全局 API
  injectGlobalAPI();
  
  // ... 其他初始化代码
};
```

**文件位置**: `D:\sdkwork-opensource\magic-studio-v2\src\app\bootstrap.ts`

---

### 步骤 2：确认全局类型声明

确保 `src/app/global.d.ts` 存在并包含类型定义：

```typescript
/**
 * 全局 Platform API 和 Upload Helper 的类型声明
 */

interface PlatformAPI {
  // 窗口管理
  minimizeWindow(): void;
  maximizeWindow(): void;
  closeWindow(): void;
  
  // 平台信息
  getPlatform(): 'web' | 'desktop';
  getPath(name: string): Promise<string>;
  getSystemTheme(): Promise<'light' | 'dark'>;
  
  // 文件系统
  readDir(path: string): Promise<any[]>;
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  // ... 其他方法
  
  // 文件转换
  convertFileSrc(path: string): string;
  
  // 剪贴板
  copy(text: string): void;
  
  // 对话框
  confirm(message: string, title?: string, type?: string): Promise<boolean>;
  
  // 通知
  notify(message: string, title?: string): Promise<void>;
  
  // 更新
  checkForUpdates(): Promise<any>;
  installUpdate(): Promise<void>;
}

interface UploadHelper {
  pickFiles(multiple: boolean, accept: string, compress: boolean): Promise<any[]>;
}

declare global {
  interface Window {
    __sdkworkPlatform: PlatformAPI;
    __sdkworkUploadHelper: UploadHelper;
  }
}

export type { PlatformAPI, UploadHelper };
```

**文件位置**: `D:\sdkwork-opensource\magic-studio-v2\src\app\global.d.ts`

---

## 工作原理

### 依赖注入流程

```
应用启动
    ↓
执行 bootstrap.ts
    ↓
调用 injectGlobalAPI()
    ↓
将 platform 和 uploadHelper 注入到 window.__sdkworkPlatform 和 window.__sdkworkUploadHelper
    ↓
sdkwork-react-commons 和 sdkwork-react-fs 通过 window 对象访问这些 API
```

### 包内访问方式

在 `sdkwork-react-commons` 或 `sdkwork-react-fs` 包中：

```typescript
// 获取 Platform API
const getPlatformAPI = () => {
  if (typeof window !== 'undefined' && (window as any).__sdkworkPlatform) {
    return (window as any).__sdkworkPlatform;
  }
  return {
    // 默认实现（用于 SSR 或未注入环境）
    getPlatform: () => 'web' as const,
    minimizeWindow: () => {},
    // ...
  };
};

const platform = getPlatformAPI();
platform.copy(text); // 使用 API
```

---

## 验证配置

### 方法 1：检查控制台日志

启动应用后，在浏览器控制台应该看到：

```
[Magic Studio] Global APIs injected: platform, uploadHelper
```

### 方法 2：检查 window 对象

在浏览器控制台执行：

```javascript
console.log(window.__sdkworkPlatform);
console.log(window.__sdkworkUploadHelper);
```

应该看到相应的 API 对象。

### 方法 3：测试功能

测试以下功能确认注入成功：
- 复制文本到剪贴板（使用 `platform.copy`）
- 文件上传（使用 `uploadHelper.pickFiles`）
- 窗口控制（最小化、最大化、关闭）

---

## 故障排除

### 问题 1：提示 "Cannot read property '__sdkworkPlatform' of undefined"

**原因**: bootstrap.ts 未执行或注入代码被移除

**解决方案**: 
1. 确认 `bootstrap()` 在应用启动时被调用
2. 检查 `src/app/bootstrap.ts` 中是否有 `injectGlobalAPI()` 调用

### 问题 2：TypeScript 类型错误

**原因**: 全局类型声明未被识别

**解决方案**:
1. 确认 `src/app/global.d.ts` 存在
2. 确认 `tsconfig.json` 的 `include` 包含 `src/**/*`
3. 重启 TypeScript 语言服务器

### 问题 3：SSR 环境下报错

**原因**: 服务端渲染时 `window` 对象不存在

**解决方案**:
包内已经包含了检查逻辑：
```typescript
if (typeof window !== 'undefined') {
  // 只在浏览器环境注入
}
```

如果仍有问题，请确认使用了 `getPlatformAPI()` 包装函数获取 API。

---

## 架构优势

使用运行时注入模式的好处：

1. **打破循环依赖**: `sdkwork-react-commons` 和 `sdkwork-react-fs` 不再直接依赖 `sdkwork-react-core`

2. **清晰的依赖层次**: 
   ```
   sdkwork-react-types (基础)
         ↓
   sdkwork-react-i18n
         ↓
   sdkwork-react-commons
         ↓
   sdkwork-react-fs
         ↓
   sdkwork-react-core
   ```

3. **可测试性**: 可以在测试中注入 mock 实现

4. **灵活性**: 可以轻松切换不同的实现

---

## 相关文件

| 文件 | 说明 |
|------|------|
| `src/app/bootstrap.ts` | 注入逻辑入口 |
| `src/app/global.d.ts` | 全局类型声明 |
| `packages/sdkwork-react-commons/src/components/Desktop/WindowControls/WindowControls.tsx` | 使用注入 API 的示例 |
| `packages/sdkwork-react-fs/src/providers/local.ts` | 使用注入 API 的示例 |

---

## 总结

运行时注入是打破循环依赖的关键技术。通过在应用启动时注入全局 API，我们实现了：

✅ 打破了 `sdkwork-react-commons` ↔ `sdkwork-react-core` 的循环依赖
✅ 打破了 `sdkwork-react-fs` ↔ `sdkwork-react-core` 的循环依赖
✅ 保持了代码的功能完整性
✅ 提高了模块化和可维护性

**配置完成标志**:
- [x] `bootstrap.ts` 包含 `injectGlobalAPI()` 调用
- [x] `global.d.ts` 定义了类型
- [x] 应用启动时控制台显示 "Global APIs injected"
