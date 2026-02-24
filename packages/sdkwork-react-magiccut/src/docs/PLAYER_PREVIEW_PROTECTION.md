# MagicCut 播放与预览功能保护指南

## 核心原则

### 1. 响应式状态管理

**问题**: `skimmingResource` 和 `previewEffect` 的获取方式是非响应式的，导致预览功能失效。

**解决方案**: 使用响应式 hooks 获取状态。

```tsx
// ❌ 错误: 非响应式获取
const { skimmingResource, previewEffect } = useMagicCutStore();

// ✅ 正确: 响应式获取
const { useSkimmingResource, usePreviewEffect } = useMagicCutStore();
const skimmingResource = useSkimmingResource();
const previewEffect = usePreviewEffect();
```

### 2. Store 状态分层

MagicCut 使用两层状态管理:

| 层级 | Store | 用途 | 示例状态 |
|------|-------|------|----------|
| 高频 | transientStore | 实时交互、播放控制 | `isPlaying`, `currentTime`, `skimmingResource` |
| 低频 | magicCutStore | 项目数据、编辑操作 | `project`, `state`, `clips` |

### 3. 状态获取规则

```tsx
// 高频状态 - 必须使用 useTransientState 或响应式 hooks
const isPlaying = useTransientState(s => s.isPlaying);
const skimmingResource = useSkimmingResource();

// 低频状态 - 可以直接从 context 获取
const { project, state, activeTimeline } = useMagicCutStore();
```

## 关键文件清单

### 播放核心文件 (修改需特别谨慎)

| 文件 | 职责 | 风险等级 |
|------|------|----------|
| `transientStore.ts` | 高频状态存储 | 🔴 极高 |
| `magicCutStore.tsx` | Store Provider | 🔴 极高 |
| `UniversalPlayer.tsx` | WebGL 渲染引擎 | 🔴 极高 |
| `MagicCutPlayer.tsx` | 播放器容器 | 🟠 高 |
| `PlayerController.ts` | 播放控制逻辑 | 🟠 高 |
| `WebGLEngine.ts` | 渲染引擎 | 🟠 高 |

### 预览相关文件

| 文件 | 职责 | 风险等级 |
|------|------|----------|
| `MagicCutResourcePanel.tsx` | 资源面板 (skimming) | 🟡 中 |
| `EffectResourcePanel.tsx` | 特效预览 | 🟡 中 |
| `usePlayerPreviewSync.ts` | 预览同步 hook | 🟡 中 |

## 修改检查清单

### 修改 Store 前必查

- [ ] 确认状态属于高频还是低频层
- [ ] 高频状态是否提供了响应式获取方式
- [ ] Context value 中的状态获取是否响应式

### 修改 Player 前必查

- [ ] 确认 `skimmingResource` 使用响应式获取
- [ ] 确认 `previewEffect` 使用响应式获取
- [ ] 确认 `isPlaying` 和 `currentTime` 使用 `useTransientState`

### 类型修改前必查

- [ ] 确认类型变更不影响运行时逻辑
- [ ] 确认 `AnyMediaResource` 和 `AnyAsset` 的兼容性
- [ ] 确认 `previewEffect` 的类型与渲染逻辑匹配

## 常见问题与解决方案

### 问题 1: 视频有声音无画面

**原因**: `skimmingResource` 非响应式获取，导致预览状态不更新

**解决**: 使用 `useSkimmingResource()` hook

### 问题 2: Timeline 滑动无法预览

**原因**: `skimmingResource` 状态更新后组件未重渲染

**解决**: 确保使用 `useStore` 订阅状态变化

### 问题 3: 特效预览不生效

**原因**: `previewEffect` 非响应式获取

**解决**: 使用 `usePreviewEffect()` hook

### 问题 4: WebGL INVALID_OPERATION 错误

**原因**: Singleton Engine 在组件 unmount 时被 cleanup，但渲染回调仍在执行

**解决**: 
1. `detach()` 只设置 `isDestroyed` 标志，不执行 cleanup
2. 渲染前检查 `engine.isEngineDestroyed()`
3. 只有 `destroy()` 才真正释放资源

```tsx
// WebGLEngine.ts
public detach() {
    this.isDestroyed = true;  // 只设置标志
}

public isEngineDestroyed(): boolean {
    return this.isDestroyed;
}

public destroy() {
    this.isDestroyed = true;
    this.cleanup();  // 真正释放资源
}

// UniversalPlayer.tsx
const renderFrame = (time: number, ...) => {
    if (engine.isEngineDestroyed()) return;  // 渲染前检查
    // ... 渲染逻辑
};
```

### 问题 5: AudioEngine Worklet 初始化失败

**原因**: 某些浏览器环境不支持 AudioWorklet

**解决**: 添加 audioWorklet 存在性检查，失败时降级到基础 gain 模式

```tsx
// AudioEngine.ts
try {
    if (this.ctx.audioWorklet) {
        await this.ctx.audioWorklet.addModule(url);
        this.workletNode = new AudioWorkletNode(this.ctx, 'magic-audio-processor');
        this.isWorkletReady = true;
    }
} catch (e) {
    console.warn("[AudioEngine] Worklet failed, falling back to basic gain", e);
}
```

## 资源生命周期管理

### WebGL Engine 生命周期

```
┌─────────────┐     attach()      ┌─────────────┐
│   Created   │ ───────────────► │   Attached  │
└─────────────┘                  └─────────────┘
                                      │
                               detach()│
                                      ▼
                                 ┌─────────────┐
                                 │  Detached   │
                                 │ (isDestroyed│
                                 │  = true)    │
                                 └─────────────┘
                                      │
                              destroy()│
                                      ▼
                                 ┌─────────────┐
                                 │  Destroyed  │
                                 │ (resources  │
                                 │  released)  │
                                 └─────────────┘
```

### 关键规则

1. **Singleton Engine**: `WebGLEngine` 是单例，跨组件重渲染保持状态
2. **Detach vs Destroy**: 
   - `detach()`: 组件 unmount 时调用，只设置标志
   - `destroy()`: 应用退出时调用，释放所有资源
3. **渲染保护**: 所有渲染调用前检查 `isEngineDestroyed()`

## 测试验证步骤

1. **播放测试**
   - 添加视频到 Timeline
   - 点击播放，确认画面和声音同步
   - 暂停/继续播放正常

2. **预览测试**
   - 在资源面板滑动鼠标
   - 确认 Player 区域显示预览
   - 移出鼠标后恢复正常

3. **特效预览测试**
   - 切换到 Effects 标签
   - 鼠标悬停特效卡片
   - 确认当前播放位置的特效预览生效

## 架构改进建议

### 1. 创建专门的 Preview Store

```tsx
// 建议创建独立的预览状态管理
interface PreviewState {
  skimmingResource: AnyMediaResource | null;
  previewEffect: AnyAsset | null;
  previewTime: number;
}
```

### 2. 使用 Selector 模式

```tsx
// 创建专用的 selector hooks
export const useSkimmingResource = () => 
  useMagicCutStore(s => s.skimmingResource);

export const usePreviewEffect = () => 
  useMagicCutStore(s => s.previewEffect);
```

### 3. 添加状态变更日志

```tsx
// 开发环境下记录关键状态变更
if (process.env.NODE_ENV === 'development') {
  useEffect(() => {
    console.log('[Preview] skimmingResource changed:', skimmingResource?.id);
  }, [skimmingResource]);
}
```
