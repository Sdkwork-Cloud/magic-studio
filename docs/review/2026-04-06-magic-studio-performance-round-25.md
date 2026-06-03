# Magic Studio V2 性能复盘与执行方�?Round 25

日期�?026-04-06  
范围：`apps/magic-studio-v2`  
目标：继续清�?app-entry hot path 上的 broad package root import，让首屏入口完全脱离 `vendor-ui-*`�?
---

## 1. 当前阶段结论

round-24 完成后：

1. route-specific layouts 已独立出�?2. `index-*` 已从 `466.48 kB` 降到 `431.38 kB`
3. 但构建后�?`index-*` 顶层仍直�?import `vendor-ui-*`

进一步追踪发现，问题已经�?layout 层收敛到 app-entry provider/store/i18n 边界�?
---

## 2. 问题列表

### P1. `AppProvider.tsx` 仍使�?broad root provider import

影响�?
1. `@sdkwork/magic-studio-auth` root 同时导出 pages、theme、store
2. `@sdkwork/magic-studio-settings` root 同时导出 page、widgets、sidebar settings、services
3. `@sdkwork/magic-studio-workspace` root 同时导出 modals、selector、store
4. `@sdkwork/magic-studio-notifications` root 同时导出 center 组件�?store

### P2. `ThemeManager.ts` 仍使�?settings root

影响�?
1. 入口只需�?`DEFAULT_SETTINGS` �?`settingsService`
2. �?root export 会把 settings page �?UI 组件一起暴露给入口图谱

### P3. `bootstrap.ts` 仍使�?auth/user root 读取 i18n

影响�?
1. 入口只需�?package i18n config
2. broad root 会把 page / section / theme 等非首屏必要代码带入入口图谱

### P4. layout 内部�?auth/settings/workspace 仍使�?broad root

影响�?
1. 虽然这些 layout 已经懒加�?2. �?chunk 仍不够干净，focused boundary 无法被标准化复用

---

## 3. 根因分析

问题不是 Vite 手工分块失效，而是 import 边界本身不够细：

1. 入口同步文件仍在引用 broad root export
2. broad root export �?re-export 页面、modal、selector、widgets
3. 这些 UI 依赖里包�?`lucide-react`、Radix、表单等 `vendor-ui` 家族

因此只做 chunk 拆分不够，必须把入口 import 改成 focused subpath�?
---

## 4. 本轮执行方案

本轮采用 focused subpath 收口方案�?
1. 先新增边界测试，锁定 app-entry hot path 不得再使�?broad root import
2. 为相�?package 增加 subpath export
3. �?`tsconfig.json` �?`vite.config.ts` 增加对应 alias
4. �?`AppProvider.tsx`、`bootstrap.ts`、`ThemeManager.ts`、`MainSidebar.tsx`、`MainGlobalHeader.tsx`、`NotesHeader.tsx`、`MagicCutLayoutHeader.tsx` 全部切到 focused subpath

---

## 5. 逐项处理对象

### 5.1 `tests/appEntryFocusedSubpathBoundary.node.test.mjs`

输入�?
1. app-entry hot path 仍使�?broad root import
2. tooling �?package exports 尚未暴露 focused subpath

输出�?
1. 新增边界测试
2. 强制源码、tsconfig、vite alias、package exports 对齐

变更属性：新增

### 5.2 `src/app/AppProvider.tsx`

输入�?
1. `@sdkwork/magic-studio-auth`
2. `@sdkwork/magic-studio-settings`
3. `@sdkwork/magic-studio-workspace`
4. `@sdkwork/magic-studio-notifications`

输出�?
1. 改为 `@sdkwork/magic-studio-auth/store`
2. 改为 `@sdkwork/magic-studio-settings/store`
3. 改为 `@sdkwork/magic-studio-workspace/store`
4. 改为 `@sdkwork/magic-studio-notifications/store`

变更属性：修改

### 5.3 `src/app/bootstrap.ts`

输入�?
1. root auth/user i18n import

输出�?
1. `@sdkwork/magic-studio-auth/i18n`
2. `@sdkwork/magic-studio-user/i18n`

变更属性：修改

### 5.4 `src/app/theme/ThemeManager.ts`

输入�?
1. root settings import

输出�?
1. `@sdkwork/magic-studio-settings/constants`
2. `@sdkwork/magic-studio-settings/services`

变更属性：修改

### 5.5 `src/layouts/MainLayout/MainGlobalHeader.tsx`

输入�?
1. broad root auth/settings/workspace

输出�?
1. `@sdkwork/magic-studio-auth/store`
2. `@sdkwork/magic-studio-settings/store`
3. `@sdkwork/magic-studio-workspace/store`
4. `@sdkwork/magic-studio-workspace/components`

变更属性：修改

### 5.6 `src/layouts/MainLayout/MainSidebar.tsx`

输入�?
1. broad root auth/settings

输出�?
1. `@sdkwork/magic-studio-auth/store`
2. `@sdkwork/magic-studio-settings/store`
3. `@sdkwork/magic-studio-settings/entities`
4. `@sdkwork/magic-studio-settings/constants`

变更属性：修改

### 5.7 `src/layouts/NotesLayout/NotesHeader.tsx`

输入�?
1. broad root workspace selector

输出�?
1. 改为 `@sdkwork/magic-studio-workspace/components`

变更属性：修改

### 5.8 `src/layouts/MagicCutLayout/MagicCutLayoutHeader.tsx`

输入�?
1. broad root workspace selector

输出�?
1. 改为 `@sdkwork/magic-studio-workspace/components`

变更属性：修改

### 5.9 `packages/sdkwork-magic-studio-workspace/src/components/index.ts`

输入�?
1. 组件子入口未显式导出 selector

输出�?
1. 导出 `WorkspaceProjectSelector`

变更属性：修改

### 5.10 package exports / tsconfig / vite alias

输入�?
1. 相关 package 尚未暴露 focused subpath

输出�?
1. `@sdkwork/magic-studio-auth`: `./store`, `./i18n`
2. `@sdkwork/magic-studio-user`: `./i18n`
3. `@sdkwork/magic-studio-settings`: `./store`, `./services`, `./entities`, `./constants`
4. `@sdkwork/magic-studio-workspace`: `./store`, `./components`
5. `@sdkwork/magic-studio-notifications`: `./store`

变更属性：修改

---

## 6. 红灯到绿灯闭�?
### 6.1 红灯

命令�?
```powershell
node --test tests/appEntryFocusedSubpathBoundary.node.test.mjs
```

结果�?
1. 失败
2. 失败原因�?   `AppProvider.tsx` 仍使�?broad root import
3. 同时 `tsconfig.json` 尚未暴露 `@sdkwork/magic-studio-auth/store`

### 6.2 绿灯

命令�?
```powershell
node --test tests/appEntryFocusedSubpathBoundary.node.test.mjs
```

结果�?
1. 2/2 通过

---

## 7. 验证

### 7.1 Node 边界回归

命令�?
```powershell
node --test tests/appEntryFocusedSubpathBoundary.node.test.mjs tests/layoutShellBoundary.node.test.mjs tests/magiccutShellBoundary.node.test.mjs tests/magiccutFeatureSubpathBoundary.node.test.mjs tests/startupPerformance.node.test.mjs tests/viteManualChunks.node.test.mjs tests/viteChunkIsolation.node.test.mjs tests/viteReactAlias.node.test.mjs tests/i18nLazyBootstrapBoundary.node.test.mjs
```

结果�?
1. 18/18 通过

### 7.2 组件测试

命令�?
```powershell
pnpm exec vitest run src/layouts/MainLayout/MainSidebar.test.tsx src/layouts/MagicCutLayout/MagicCutLayoutHeader.test.tsx
```

结果�?
1. 2 个文件通过
2. 4 个测试通过

### 7.3 构建验证

命令�?
```powershell
pnpm run build:test
```

结果�?
1. 构建成功

---

## 8. 构建结果

round-25 构建后的关键产物�?
1. `dist/assets/index-DRE_qhUp.js` `143.85 kB`
2. `dist/assets/MainLayout-Cby7IRo7.js` `12.10 kB`
3. `dist/assets/WorkspaceProjectSelector-DUesRZ_O.js` `19.65 kB`
4. `dist/assets/components-BPsEO0aB.js` `0.14 kB`
5. `dist/assets/vendor-ui-C0Mz-0NU.js` `776.45 kB`

结论�?
1. `index-*` �?round-24 �?`431.38 kB` 进一步下降到 `143.85 kB`
2. 构建后的 `index-*` 顶层 import 已不再包�?`vendor-ui-*`
3. `WorkspaceProjectSelector` 已从入口图谱中分离为独立 chunk
4. `MainLayout`、`NotesLayout`、`MagicCutLayout` 等壳�?chunk 依赖关系更清晰，focused boundary 已形成标�?
---

## 9. 仍需继续打磨的问�?
目前最优先的后续问题已经从 JS 首屏体积转向两个方向�?
### P1. 全局 CSS 仍然偏大

现状�?
1. `dist/assets/index-CUmuH37b.css` `366.04 kB`

建议�?
1. 审计 Tailwind 实际命中类与 safelist
2. 排查是否有组件级样式被错误提升到全局入口

### P2. `vendor-ui-*` 仍然很大，但已不在首屏同步路�?
现状�?
1. `vendor-ui-C0Mz-0NU.js` `776.45 kB`
2. 现在它主要通过 lazy layout / selector / modal 路径装载

建议�?
1. 继续细分 workspace / settings / notifications 的组件入�?2. 评估 `WorkspaceProjectSelector` �?modal 家族是否还能拆出更细�?focused subpath

### P3. `vendor-*` 仍然较大

现状�?
1. `vendor-BjSESfcO.js` `1,015.46 kB`
2. 已不�?`index-*` 顶层 import �?
建议�?
1. 下一轮聚�?lazy feature chunk �?vendor 依赖构成
2. 避免非首屏能力在同一路径复用过大的通用 vendor �?