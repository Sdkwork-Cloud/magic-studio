> Migrated from `docs/review/2026-04-06-magic-studio-performance-round-20.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Magic Studio V2 性能复盘与执行方�?Round 20

日期�?026-04-06  
范围：`apps/magic-studio-v2`  
目标：在 round-19 完成 vendor 分桶之后，继续追�?`index-*` 过大�?`vendor-editor` 仍被壳层静态依赖的问题，优先处�?editor / drive �?root-entry 泄漏�?
---

## 1. 当前阶段结论

round-19 完成后：

1. `vendor` 单桶已拆开
2. �?`index-DqT56kS2.js` 仍有 `506.67 kB`
3. `index` 仍然静态依�?`vendor-editor`

进一步排查得到两个关键证据：

1. `src/layouts/MainLayout/EditorProjectActions.tsx` 同步�?`@sdkwork/magic-studio-editor` 根入口取 `useEditorStore` 与两�?modal
2. `src/router/packageRoutes.tsx` 同步/广域使用 `@sdkwork/magic-studio-drive`、`@sdkwork/magic-studio-editor` 根入�?3. `packages/sdkwork-magic-studio-drive/src/components/DriveGrid.tsx` �?`FilePreviewModal.tsx` �?`@sdkwork/magic-studio-editor` 根入口取 `FileIcon`
4. `packages/sdkwork-magic-studio-editor/src/index.ts` 明确 re-export �?`CodeEditor`，这会把 Monaco 路径暴露到错误边�?
结论�?
1. editor / drive �?root-entry 泄漏是真实问�?2. 但它不是 `index` 过大的唯一根因

---

## 2. 根因分析

### 2.1 editor 根入口的结构问题

`packages/sdkwork-magic-studio-editor/src/index.ts` 现状�?
1. 导出 `EditorPage`
2. 导出 `EditorStoreProvider`
3. 导出 `CodeEditor`
4. 导出 modal 与工具函�?
这意味着�?
1. 任何只想�?store、modal、file icon 的消费方
2. 只要�?`@sdkwork/magic-studio-editor` 根入口取�?3. 就会落入�?`CodeEditor` 同一个边�?
### 2.2 drive �?editor 根入口的反向放大

`DriveGrid` �?`FilePreviewModal` 只是�?`FileIcon`，但通过 `@sdkwork/magic-studio-editor` 根入口获取，导致 drive 也继承了 editor 根入口的膨胀风险�?
### 2.3 壳层同步路径仍有 root-entry 消费

1. `EditorProjectActions` 在同步布局路径里消�?editor root
2. `packageRoutes.tsx` 在路由配置阶段直接消�?drive root

这会让不该进入壳层的 editor 依赖有机会被提前拉入�?
---

## 3. 问题列表

### P1. `EditorProjectActions` 通过 editor root 引入项目动作能力

影响�?
1. 头部同步渲染路径承受 editor 根入口耦合

### P2. `DriveGrid` / `FilePreviewModal` 通过 editor root 获取 `FileIcon`

影响�?
1. drive feature 继承 editor 根入口的重量

### P3. 路由配置层仍使用 broad root entry

影响�?
1. `registry` / `packageRoutes` / `packageRouteLoader` / `routePreload` 不能准确表达只要 page/store

---

## 4. 本轮执行方案

### 4.1 方案选择

候选方案：

1. 继续保留根入口不�?   - 缺点：问题持�?2. 直接重构 editor / drive 包内部结�?   - 缺点：改动过大，风险�?3. 新增 focused entry，仅把壳层真正需要的 page/store/component 提出�?   - 优点：最小、清晰、可�?
本轮采用方案 3�?
### 4.2 focused entry 设计

新增�?
1. `@sdkwork/magic-studio-drive/pages`
2. `@sdkwork/magic-studio-editor/pages`
3. `@sdkwork/magic-studio-editor/store`
4. `@sdkwork/magic-studio-editor/project-actions`
5. `@sdkwork/magic-studio-editor/file-icon`

说明�?
1. 不展开 notes 内部业务改�?2. notes 仅在 app 侧避免同�?root import，不深入处理 note editor 逻辑

---

## 5. 逐项处理对象输入 / 输出 / 变更属�?
### 5.1 `tests/editorDriveConsumerSubpathBoundary.node.test.mjs`

输入�?
1. 现有壳层文件仍在使用 editor / drive root entry

输出�?
1. 新增边界测试
2. 强制以下文件改为 focused subpath�?   - `src/layouts/MainLayout/EditorProjectActions.tsx`
   - `src/router/registry.tsx`
   - `src/router/packageRouteLoader.tsx`
   - `src/router/packageRoutes.tsx`
   - `src/router/routePreload.ts`
   - `packages/sdkwork-magic-studio-drive/src/components/DriveGrid.tsx`
   - `packages/sdkwork-magic-studio-drive/src/components/FilePreviewModal.tsx`

变更属性：新增

### 5.2 `tests/editorDriveFeatureSubpathBoundary.node.test.mjs`

输入�?
1. `vite.config.ts`
2. `tsconfig.json`

输出�?
1. 强制 alias / path 暴露以下 subpath�?   - `@sdkwork/magic-studio-drive/pages`
   - `@sdkwork/magic-studio-editor/pages`
   - `@sdkwork/magic-studio-editor/store`
   - `@sdkwork/magic-studio-editor/project-actions`
   - `@sdkwork/magic-studio-editor/file-icon`

变更属性：新增

### 5.3 `packages/sdkwork-magic-studio-drive/src/pages/index.ts`

输入�?
1. `DrivePage`

输出�?
1. focused page entry，仅导出 `DrivePage`

变更属性：新增

### 5.4 `packages/sdkwork-magic-studio-editor/src/pages/index.ts`

输入�?
1. `EditorPage`

输出�?
1. focused page entry，仅导出 `EditorPage`

变更属性：新增

### 5.5 `packages/sdkwork-magic-studio-editor/src/project-actions/index.ts`

输入�?
1. `useEditorStore`
2. `GitHubSyncModal`
3. `PublishAppModal`

输出�?
1. focused actions entry，仅暴露项目动作需要的 store + modal

变更属性：新增

### 5.6 `packages/sdkwork-magic-studio-editor/src/file-icon/index.ts`

输入�?
1. `FileIcon`

输出�?
1. focused component entry，仅暴露 `FileIcon`

变更属性：新增

### 5.7 `src/layouts/MainLayout/EditorProjectActions.tsx`

输入�?
1. `useEditorStore`
2. `GitHubSyncModal`
3. `PublishAppModal`
4. 旧来源：`@sdkwork/magic-studio-editor`

输出�?
1. 改为统一�?`@sdkwork/magic-studio-editor/project-actions` 获取

变更属性：修改

### 5.8 `src/router/registry.tsx`

输入�?
1. `DrivePage`
2. `EditorPage`
3. `EditorStoreProvider`

输出�?
1. `DrivePage` -> `@sdkwork/magic-studio-drive/pages`
2. `EditorPage` -> `@sdkwork/magic-studio-editor/pages`
3. `EditorStoreProvider` -> `@sdkwork/magic-studio-editor/store`

变更属性：修改

### 5.9 `src/router/packageRouteLoader.tsx`

输入�?
1. `DrivePage`
2. `EditorPage`

输出�?
1. 改为 focused page subpath 动态导�?
变更属性：修改

### 5.10 `src/router/packageRoutes.tsx`

输入�?
1. `DrivePage` 原为同步 root import
2. `NotesPage` 原为同步 root import
3. `EditorPage` 原为 broad root lazy import

输出�?
1. `DrivePage` -> focused page lazy import
2. `NotesPage` -> 改成 lazy import，避免同�?root import
3. `EditorPage` -> focused page lazy import

变更属性：修改

### 5.11 `src/router/routePreload.ts`

输入�?
1. `editor` 预加载走 `@sdkwork/magic-studio-editor`
2. `drive` 预加载走 `@sdkwork/magic-studio-drive`

输出�?
1. `editor` -> `pages + store`
2. `drive` -> `pages`

变更属性：修改

### 5.12 `packages/sdkwork-magic-studio-drive/src/components/DriveGrid.tsx`

输入�?
1. `FileIcon` from `@sdkwork/magic-studio-editor`

输出�?
1. `FileIcon` from `@sdkwork/magic-studio-editor/file-icon`

变更属性：修改

### 5.13 `packages/sdkwork-magic-studio-drive/src/components/FilePreviewModal.tsx`

输入�?
1. `FileIcon` from `@sdkwork/magic-studio-editor`

输出�?
1. `FileIcon` from `@sdkwork/magic-studio-editor/file-icon`

变更属性：修改

### 5.14 `vite.config.ts`

输入�?
1. 仅有 editor / drive root alias

输出�?
1. 新增 focused subpath alias�?   - `@sdkwork/magic-studio-drive/pages`
   - `@sdkwork/magic-studio-editor/pages`
   - `@sdkwork/magic-studio-editor/store`
   - `@sdkwork/magic-studio-editor/project-actions`
   - `@sdkwork/magic-studio-editor/file-icon`

变更属性：修改

### 5.15 `tsconfig.json`

输入�?
1. 仅有 editor / drive root path

输出�?
1. 同步新增 TS path�?   - `@sdkwork/magic-studio-drive/pages`
   - `@sdkwork/magic-studio-editor/pages`
   - `@sdkwork/magic-studio-editor/store`
   - `@sdkwork/magic-studio-editor/project-actions`
   - `@sdkwork/magic-studio-editor/file-icon`
2. 同步 legacy `sdkwork-magic-studio-*/*` path

变更属性：修改

---

## 6. 红灯 -> 绿灯闭环

### 6.1 红灯

命令�?
```powershell
node --test tests/editorDriveConsumerSubpathBoundary.node.test.mjs tests/editorDriveFeatureSubpathBoundary.node.test.mjs
```

结果�?
1. 失败
2. 失败点：
   - `EditorProjectActions.tsx` 仍从 `@sdkwork/magic-studio-editor` 根入口导�?   - `vite.config.ts` 尚未暴露 `@sdkwork/magic-studio-drive/pages`

结论�?
1. 测试准确命中本轮缺口

### 6.2 绿灯

实现后命令：

```powershell
node --test tests/editorDriveConsumerSubpathBoundary.node.test.mjs tests/editorDriveFeatureSubpathBoundary.node.test.mjs
```

结果�?
1. 2/2 通过

---

## 7. 验证

### 7.1 Node 验证

命令�?
```powershell
node --test tests/viteManualChunks.node.test.mjs tests/viteChunkIsolation.node.test.mjs tests/viteReactAlias.node.test.mjs tests/editorDriveConsumerSubpathBoundary.node.test.mjs tests/editorDriveFeatureSubpathBoundary.node.test.mjs
```

结果�?
1. 11/11 通过

### 7.2 构建验证

命令�?
```powershell
pnpm run build:test
```

结果�?
1. 构建成功
2. 无构建报�?
---

## 8. 构建结果对比

### 8.1 round-19 �?
1. `feature-drive-BjH4Xx5F.js`: `69.71 kB`
2. `feature-editor-BI8pBh42.js`: `43.54 kB`
3. `index-DqT56kS2.js`: `506.67 kB`
4. `vendor-editor-CtWQa_eF.js`: `382.08 kB`

### 8.2 round-20 �?
1. `feature-drive-B8_9TF10.js`: `67.48 kB`
2. `feature-editor-Dml21zG6.js`: `43.29 kB`
3. `index-B3x5M9ET.js`: `506.77 kB`
4. `vendor-editor-DMB6Tl48.js`: `382.08 kB`

### 8.3 本轮结论

1. drive / editor root-entry 泄漏已经收窄
2. `EditorProjectActions` 已被切成独立小块：`EditorProjectActions-BZFYHj_7.js`
3. `feature-drive` 有轻微下�?4. �?`index` 仍然静态依�?`vendor-editor`

这说明：

1. round-20 解决的是“已确认的一部分壳层泄漏�?2. 不是 `vendor-editor` 静态依赖的唯一来源

---

## 9. 残留问题

### R1. `index` 仍静�?import `vendor-editor`

构建产物证据�?
1. `dist/assets/index-B3x5M9ET.js` 仍有�?   - `import { L as o } from "./vendor-editor-DMB6Tl48.js";`

### R2. 仍引�?`vendor-editor` �?chunk

当前产物中引�?`vendor-editor` 的块包括�?
1. `index-B3x5M9ET.js`
2. `feature-editor-Dml21zG6.js`
3. `feature-notes-BujHXvuz.js`
4. `feature-assets-generation-BZ2cgR5M.js`
5. `feature-drive-B8_9TF10.js`

结论�?
1. 下一轮不能再只看 editor / drive
2. 还需要继续追 notes / assets-generation / 壳层依赖�?
---

## 10. 下一步计�?
### round-21 目标

1. 直接�?`index -> vendor-editor` 的真实同步依赖链
2. 优先排查�?   - notes 入口边界
   - assets generation 的编辑器依赖
   - home / shell 是否间接触发 editor 相关能力

### round-22 候�?
1. 继续处理 `shared-magic-studio-i18n`
2. 分离语言资源或延迟注册策�?
---

## 11. 本轮结论

本轮完成了一个完整但“部分收敛”的闭环�?
1. 用测试锁�?editor / drive root-entry 泄漏
2. 通过 focused entry 收紧 page / store / file-icon / project-actions 边界
3. 构建验证确认没有回归
4. 同时明确了一个更重要的新事实�?   - `index` 静态依�?`vendor-editor` 仍未解除
   - 后续必须转向 notes / assets-generation / 壳层同步路径的更深层排查

