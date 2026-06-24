> Migrated from `docs/review/2026-04-06-magic-studio-performance-round-24.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Magic Studio V2 性能复盘与执行方案 Round 24

日期：2026-04-06  
范围：`apps/magic-studio-v2`  
目标：继续压缩首屏入口体积，优先收口 route-specific layout 与路由 loading fallback 对 `vendor-ui` 的同步泄漏。

---

## 1. 当前阶段结论

round-23 完成后，首屏已经不再直接挂 `feature-magiccut-shell-*`，但仍存在两个明显问题：

1. `src/app/App.tsx` 仍同步引入 `MainLayout`、`GenerationLayout`、`CreationLayout`、`VibeLayout`、`NotesLayout`
2. `src/router/registry.tsx` 仍同步引入 `Loader2`，而 `lucide-react` 被手工归类到 `vendor-ui`

这意味着即使业务页面和 `MagicCutLayout` 已经做了懒加载，壳层路由注册仍会把一部分 UI 依赖提前拖进入口。

---

## 2. 问题列表

### P1. route-specific layout 仍在首屏主包同步装载

影响：

1. `MainLayout` 链路会把 `MainSidebar`、`MainGlobalHeader` 提前带入入口
2. `NotesLayout`、`VibeLayout`、`CreationLayout`、`GenerationLayout` 本应只在命中对应 route 时装载

### P2. registry loading fallback 仍使用 `lucide-react`

影响：

1. `registry.tsx` 位于 `App.tsx` 的同步路径上
2. 只要 `Loader2` 继续静态导入，`vendor-ui-*` 就会继续被 `index-*` 直接依赖

---

## 3. 根因分析

### 3.1 `App.tsx` 的 layout 注册表仍是同步组件

之前实现中：

1. `App.tsx` 顶部直接 `import { MainLayout } ...`
2. `LAYOUT_COMPONENTS` 直接保存同步组件引用

结果是：

1. 不管当前路由是否命中这些 layout
2. 对应 layout 依赖图都会进入首屏图谱

### 3.2 `registry.tsx` 的 fallback 图标属于 `vendor-ui`

之前实现中：

1. `registry.tsx` 直接 `import { Loader2 } from 'lucide-react'`
2. `scripts/vite-manual-chunks.mjs` 已将 `lucide-react` 归入 `vendor-ui`

结果是：

1. route registry 本身成为 `vendor-ui` 的入口级引用点

---

## 4. 本轮执行方案

本轮采用最小可验证方案：

1. 先增加边界测试，锁定 `App.tsx` 不得再同步导入上述 layout
2. 将 `MainLayout`、`GenerationLayout`、`CreationLayout`、`VibeLayout`、`NotesLayout` 改成 `lazy(() => import(...))`
3. 将 `registry.tsx` 的 `Loader2` 改成纯 CSS spinner，彻底移除对 `lucide-react` 的同步依赖

---

## 5. 逐项处理对象

### 5.1 `tests/layoutShellBoundary.node.test.mjs`

输入：

1. `App.tsx` 仍静态导入多个 route-specific layout
2. `registry.tsx` 仍静态导入 `lucide-react`

输出：

1. 新增红绿测试
2. 强制 `App.tsx` 改为 lazy layout 边界
3. 强制 `registry.tsx` 改为 CSS spinner fallback

变更属性：新增

### 5.2 `src/app/App.tsx`

输入：

1. `MainLayout`、`GenerationLayout`、`CreationLayout`、`VibeLayout`、`NotesLayout` 为同步 import

输出：

1. 上述 layout 全部改为 `lazy(() => import(...))`
2. 保留 `BlankLayout`、`NoneLayout` 作为壳层基础布局

变更属性：修改

### 5.3 `src/router/registry.tsx`

输入：

1. `PageLoadingFallback` 依赖 `Loader2`

输出：

1. 改为纯 CSS spinner
2. 移除 `lucide-react` 的同步依赖

变更属性：修改

---

## 6. 红灯到绿灯闭环

### 6.1 红灯

命令：

```powershell
node --test tests/layoutShellBoundary.node.test.mjs
```

结果：

1. 失败
2. 失败原因：
   `App.tsx` 仍静态导入 `MainLayout`

### 6.2 绿灯

命令：

```powershell
node --test tests/layoutShellBoundary.node.test.mjs
```

结果：

1. 通过

---

## 7. 验证

### 7.1 Node 边界测试

命令：

```powershell
node --test tests/layoutShellBoundary.node.test.mjs tests/magiccutShellBoundary.node.test.mjs tests/magiccutFeatureSubpathBoundary.node.test.mjs tests/startupPerformance.node.test.mjs tests/viteManualChunks.node.test.mjs tests/viteChunkIsolation.node.test.mjs tests/viteReactAlias.node.test.mjs tests/i18nLazyBootstrapBoundary.node.test.mjs
```

结果：

1. 16/16 通过

### 7.2 组件测试

命令：

```powershell
pnpm exec vitest run src/layouts/MainLayout/MainSidebar.test.tsx src/layouts/MagicCutLayout/MagicCutLayoutHeader.test.tsx
```

结果：

1. 2 个文件通过
2. 4 个测试通过

### 7.3 构建验证

命令：

```powershell
pnpm run build:test
```

结果：

1. 构建成功

---

## 8. 构建结果

round-24 构建后的关键产物：

1. `dist/assets/index-CsAy7Mxh.js` `431.38 kB`
2. `dist/assets/MainLayout-CwWmF2Ii.js` `11.98 kB`
3. `dist/assets/GenerationLayout-DVqIlWX1.js` `4.55 kB`
4. `dist/assets/CreationLayout-Ddh4jyep.js` `2.72 kB`
5. `dist/assets/VibeLayout-KOeFBgES.js` `2.97 kB`
6. `dist/assets/NotesLayout-BavEoi2z.js` `2.38 kB`

结论：

1. `index-*` 从 `466.48 kB` 下降到 `431.38 kB`
2. route-specific layouts 已经全部独立出块
3. 但 `index-*` 顶层仍直接 import `vendor-ui-*`

---

## 9. 遗留问题与下一步

round-24 证明 layout 边界收口是有效的，但没有彻底切断入口对 `vendor-ui` 的依赖。进一步排查确认：

1. `AppProvider.tsx` 仍从 `@sdkwork/magic-studio-auth`、`@sdkwork/magic-studio-settings`、`@sdkwork/magic-studio-workspace`、`@sdkwork/magic-studio-notifications` 的 broad root entry 拉 provider
2. `ThemeManager.ts` 仍从 `@sdkwork/magic-studio-settings` root 拉 `DEFAULT_SETTINGS` 与 `settingsService`
3. `bootstrap.ts` 仍从 `@sdkwork/magic-studio-auth`、`@sdkwork/magic-studio-user` root 拉 i18n

因此下一轮 round-25 的目标明确为：

1. 为 auth/settings/workspace/notifications/user 暴露 focused subpath
2. 将 app-entry hot path 全部切到 `store`、`services`、`constants`、`components`、`i18n`
3. 争取让 `index-*` 完全脱离 `vendor-ui-*` 直连

