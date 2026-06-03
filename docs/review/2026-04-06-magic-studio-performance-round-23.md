# Magic Studio V2 性能复盘与执行方�?Round 23

日期�?026-04-06  
范围：`apps/magic-studio-v2`  
目标：在 round-22 完成 i18n runtime 与基础 locale 文案分离后，继续处理 `index-*` 仍然直接携带 `feature-magiccut-shell-*` 的问题，�?Magic Cut 壳层从首屏同步路径中剥离�?
---

## 1. 当前阶段结论

round-22 完成后：

1. `shared-magic-studio-i18n-*` 已从 `182.92 kB` 压到 `6.65 kB`
2. �?`index-DN-Y3uYu.js` 仍有 `504.93 kB`
3. 构建产物显示 `index-*` 顶层直接引入�?`feature-magiccut-shell-*`

进一步排查确认：

1. `src/app/App.tsx` 静态导�?`MagicCutLayout`
2. `MagicCutLayoutHeader.tsx` �?`@sdkwork/magic-studio-magiccut` broad root 获取 `useMagicCutStore`
3. 路由层对 `MagicCutPage` / `MagicCutStoreProvider` 也仍使用 broad root lazy import

这意味着�?
1. Magic Cut 虽然在路由层�?feature
2. 但其 layout/store 边界仍被壳层静态提前触�?
---

## 2. 根因分析

### 2.1 `App.tsx` 同步装载 `MagicCutLayout`

`App.tsx` 之前直接�?
1. `import { MagicCutLayout } from '../layouts/MagicCutLayout/MagicCutLayout'`
2. 并把它放�?`LAYOUT_COMPONENTS`

这样即使当前路由不是 Magic Cut�?
1. layout 代码仍进入首屏主�?2. layout 内部依赖图也会跟着进入 `index-*`

### 2.2 `MagicCutLayoutHeader.tsx` 通过 broad root 获取 store

`MagicCutLayoutHeader.tsx` 之前�?
1. `import { useMagicCutStore } from '@sdkwork/magic-studio-magiccut'`

�?`packages/sdkwork-magic-studio-magiccut/src/index.ts` �?re-export�?
1. `pages`
2. `store`
3. `services`
4. `components`
5. `engine`

这会把大量不属于壳层�?Magic Cut shell 能力暴露给首屏图谱�?
### 2.3 路由层仍使用 broad root

以下路径此前都还在用 `@sdkwork/magic-studio-magiccut`�?
1. `src/router/registry.tsx`
2. `src/router/packageRoutes.tsx`
3. `src/router/packageRouteLoader.tsx`
4. `src/router/routePreload.ts`

即使其中大多数是 lazy import，也仍然不能准确表达“只�?page/store”�?
---

## 3. 问题列表

### P1. `MagicCutLayout` 被壳层同步引�?
影响�?
1. route-specific layout 进入首屏主包
2. Magic Cut header 相关依赖提前进入壳层

### P2. `MagicCutLayoutHeader` 使用 broad root store import

影响�?
1. `feature-magiccut-shell` 被首屏直接触�?2. package 根入口的页面、服务、引擎、组件全部暴露到错误边界

### P3. 路由层缺�?focused Magic Cut subpath

影响�?
1. 无法表达 page/store 的最小边�?2. preload �?lazy route loader 粒度不准

---

## 4. 本轮执行方案

### 4.1 方案选择

候选方案：

1. 只修�?`MagicCutLayoutHeader.tsx`
   - 缺点：`App.tsx` 仍然同步装载 layout
2. 只把 `MagicCutLayout` 改成 lazy
   - 缺点：路由层仍然 broad root，不够完�?3. 同时处理 layout lazy boundary + focused `pages/store` subpath
   - 优点：根因直接、边界完整、收益可验证

本轮采用方案 3�?
### 4.2 目标边界

1. `@sdkwork/magic-studio-magiccut/pages`
2. `@sdkwork/magic-studio-magiccut/store`
3. `MagicCutLayout` 仅在 `magic-cut` layout 真实命中时才被加�?
---

## 5. 逐项处理对象输入 / 输出 / 变更属�?
### 5.1 `tests/magiccutShellBoundary.node.test.mjs`

输入�?
1. 壳层与路由仍使用 broad Magic Cut 路径
2. `App.tsx` 仍同步导�?`MagicCutLayout`

输出�?
1. 新增红绿测试
2. 强制�?   - `App.tsx` 不再静态导�?`MagicCutLayout`
   - header / router / preload 全部改用 `pages/store` focused subpath

变更属性：新增

### 5.2 `tests/magiccutFeatureSubpathBoundary.node.test.mjs`

输入�?
1. `vite.config.ts`
2. `tsconfig.json`

输出�?
1. 强制暴露�?   - `@sdkwork/magic-studio-magiccut/pages`
   - `@sdkwork/magic-studio-magiccut/store`

变更属性：新增

### 5.3 `packages/sdkwork-magic-studio-magiccut/package.json`

输入�?
1. 仅有根入口导�?
输出�?
1. 增加 `./pages`
2. 增加 `./store`

变更属性：修改

### 5.4 `vite.config.ts`

输入�?
1. 仅有 `@sdkwork/magic-studio-magiccut` �?alias

输出�?
1. 增加 `@sdkwork/magic-studio-magiccut/pages`
2. 增加 `@sdkwork/magic-studio-magiccut/store`

变更属性：修改

### 5.5 `tsconfig.json`

输入�?
1. 仅有 `@sdkwork/magic-studio-magiccut` �?path mapping

输出�?
1. 增加 `@sdkwork/magic-studio-magiccut/pages`
2. 增加 `@sdkwork/magic-studio-magiccut/store`

变更属性：修改

### 5.6 `src/layouts/MagicCutLayout/MagicCutLayoutHeader.tsx`

输入�?
1. `useMagicCutStore` from `@sdkwork/magic-studio-magiccut`

输出�?
1. 改为 `@sdkwork/magic-studio-magiccut/store`

变更属性：修改

### 5.7 `src/layouts/MagicCutLayout/MagicCutLayoutHeader.test.tsx`

输入�?
1. �?mock 路径�?`@sdkwork/magic-studio-magiccut`

输出�?
1. 改为 mock `@sdkwork/magic-studio-magiccut/store`

变更属性：修改

### 5.8 `src/router/registry.tsx`

输入�?
1. `MagicCutPage` broad root lazy import
2. `MagicCutStoreProvider` broad root lazy import

输出�?
1. `MagicCutPage` -> `@sdkwork/magic-studio-magiccut/pages`
2. `MagicCutStoreProvider` -> `@sdkwork/magic-studio-magiccut/store`

变更属性：修改

### 5.9 `src/router/packageRoutes.tsx`

输入�?
1. `MagicCutPage` broad root lazy import
2. `MagicCutStoreProvider` broad root sync import

输出�?
1. `MagicCutPage` -> `@sdkwork/magic-studio-magiccut/pages`
2. `MagicCutStoreProvider` -> `@sdkwork/magic-studio-magiccut/store`

变更属性：修改

### 5.10 `src/router/packageRouteLoader.tsx`

输入�?
1. `MagicCutPage` broad root lazy import
2. `MagicCutStoreProvider` broad root lazy import

输出�?
1. 改为 focused `pages/store` lazy import

变更属性：修改

### 5.11 `src/router/routePreload.ts`

输入�?
1. `magiccut` preload 仍走 broad root

输出�?
1. 改为并行预加载：
   - `@sdkwork/magic-studio-magiccut/pages`
   - `@sdkwork/magic-studio-magiccut/store`

变更属性：修改

### 5.12 `src/app/App.tsx`

输入�?
1. 静态导�?`MagicCutLayout`

输出�?
1. 使用 `lazy(() => import('../layouts/MagicCutLayout/MagicCutLayout'))`
2. 仅在命中 `magic-cut` layout 时再加载

变更属性：修改

---

## 6. 红灯 -> 绿灯闭环

### 6.1 红灯

命令�?
```powershell
node --test tests/magiccutShellBoundary.node.test.mjs tests/magiccutFeatureSubpathBoundary.node.test.mjs
```

结果�?
1. 失败
2. 失败原因�?   - `vite.config.ts` / `tsconfig.json` 未暴�?`magiccut/pages|store`
   - `App.tsx` 仍静态导�?`MagicCutLayout`

### 6.2 绿灯

实现后命令：

```powershell
node --test tests/magiccutShellBoundary.node.test.mjs tests/magiccutFeatureSubpathBoundary.node.test.mjs
```

结果�?
1. 全部通过

---

## 7. 验证

### 7.1 Node 边界验证

命令�?
```powershell
node --test tests/magiccutShellBoundary.node.test.mjs tests/magiccutFeatureSubpathBoundary.node.test.mjs tests/startupPerformance.node.test.mjs tests/viteManualChunks.node.test.mjs tests/viteChunkIsolation.node.test.mjs tests/viteReactAlias.node.test.mjs tests/i18nLazyBootstrapBoundary.node.test.mjs
```

结果�?
1. 15/15 通过

### 7.2 组件测试验证

命令�?
```powershell
pnpm exec vitest run src/layouts/MagicCutLayout/MagicCutLayoutHeader.test.tsx
```

结果�?
1. 1 个测试文件通过
2. 2 个测试通过

### 7.3 构建验证

命令�?
```powershell
pnpm run build:test
```

结果�?
1. 构建成功
2. 产物新增独立 `MagicCutLayout-*` chunk
3. `index-*` 不再直接�?`feature-magiccut-shell-*`

---

## 8. 构建结果对比

### 8.1 处理�?
1. `index-DN-Y3uYu.js`: `504.93 kB`
2. `feature-magiccut-shell-BiFR1lXu.js`: `178.38 kB`
3. `index-*` 顶层直接引入 `feature-magiccut-shell-*`

### 8.2 处理�?
1. `index-DiWLeiI7.js`: `466.48 kB`
2. `MagicCutLayout-BoPPAWtd.js`: `6.28 kB`
3. `feature-magiccut-shell-k_vTqn-t.js`: `177.97 kB`
4. `shared-magic-studio-i18n-Dew5UU0K.js`: `6.65 kB`
5. `vendor-ui-DbwaIE4G.js`: `776.45 kB`
6. `vendor-D6JF7pV8.js`: `1015.46 kB`

结论�?
1. `index-*` 进一步下降约 `38.45 kB`
2. Magic Cut layout 已成为独立惰性边�?3. `feature-magiccut-shell` 仍保留为业务 chunk，但不再由首屏主包直接拖�?
---

## 9. 下一轮计�?
下一轮建议优先级�?
1. 继续检�?`vendor-ui-*` �?`vendor-*` 的可分桶空间
2. 评估 `NotesLayout`、`VibeLayout` �?route-specific layout 是否也值得迁移�?lazy boundary
3. 单独审查 `index-CUmuH37b.css` `366.04 kB` 的全局样式负担，确认是否存在可拆分的入口级 CSS

