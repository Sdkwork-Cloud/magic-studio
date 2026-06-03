# Magic Studio V2 性能复盘与执行方�?Round 21

日期�?026-04-06  
范围：`apps/magic-studio-v2`  
目标：在 round-20 收紧 editor / drive / notes focused entry 之后，继续追�?`index-*` 为什么仍然静态挂着 `vendor-editor`，并完成壳层�?`vendor-editor` 的彻底脱钩�?
---

## 1. 当前阶段结论

round-20 完成后，editor / drive / notes �?root-entry 泄漏已经明显收紧，但构建产物仍然显示�?
1. `index-LbOUopwU.js` 仍约 `506.77 kB`
2. `index-*` 仍然静态引�?`vendor-editor-*`
3. 说明 editor/notes focused subpath 不是唯一根因

进一步排查后，确认本轮最关键的隐藏链路是�?
1. `index.tsx` 全局引入�?`@xterm/xterm/css/xterm.css`
2. `xterm.css` 被统一归入 `vendor-editor` 依赖�?3. 即使业务层已经把 notes / editor / drive �?broad root import 收窄，首屏仍会因为这条全局 CSS 路径�?`vendor-editor` 带进 `index-*`

本轮结论�?
1. notes / editor 边界治理是必要条�?2. `@xterm/xterm/css/xterm.css` 的入口级全局引入才是 `index -> vendor-editor` 的直接根�?
---

## 2. 根因分析

### 2.1 notes 侧仍存在 editor 入口边界风险

在业务层面，notes 之前仍通过 broad entry 间接触发 editor 侧依赖扩大：

1. `NotesPage.tsx` 通过 `../index` 访问 sidebar / editor 组合导出
2. `NoteEditor.tsx` �?`BlockFloatingMenu.tsx` 通过 `@sdkwork/magic-studio-editor` 直接拿文件选择器能�?
这些路径虽然不是最终的唯一根因，但会放大首屏图谱中�?editor 关联范围�?
### 2.2 路由壳层仍有 notes broad entry

以下壳层路径此前仍直接使�?`@sdkwork/magic-studio-notes`�?
1. `src/router/registry.tsx`
2. `src/router/packageRoutes.tsx`
3. `src/router/packageRouteLoader.tsx`
4. `src/router/routePreload.ts`

这会让壳层表达不清晰，无法把 notes 页面入口限制�?focused page subpath�?
### 2.3 真正的首屏直连根因是 xterm 全局 CSS

证据链如下：

1. `index.tsx` 曾全局引入 `@xterm/xterm/css/xterm.css`
2. `@xterm/xterm` 归类�?`vendor-editor`
3. 删除该入口级全局 CSS 后重新构建，`index-*` 不再匹配 `vendor-editor`

这说明：

1. 入口级样式依赖也会改变首屏代码图�?2. 不能只盯 JS import，必须同时检查入口样式边�?
---

## 3. 问题列表

### P1. notes 页面入口仍然不够聚焦

影响�?
1. 壳层无法准确表达“只�?NotesPage�?2. notes 内部 editor 依赖容易继续放大

### P2. notes 内部文件选择器仍通过 editor broad root 获取

影响�?
1. notes feature �?editor 的依赖粒度过�?2. 容易�?editor 侧额外能力带进不需要的边界

### P3. `index.tsx` 全局引入 `@xterm/xterm/css/xterm.css`

影响�?
1. `vendor-editor` 被直接挂到首�?2. 即使 JS 入口已收窄，`index-*` 仍无法脱�?`vendor-editor`

---

## 4. 本轮执行方案

### 4.1 方案选择

候选方案：

1. 继续只改 notes / editor JS 入口
   - 缺点：无法触及入口样式根�?2. 直接大规模拆 notes/editor 包内部结�?   - 缺点：超出本轮最小闭�?3. 在现�?focused entry 基础上，继续收紧 notes 页面入口，并移除入口�?xterm 全局 CSS
   - 优点：最小、直接、可验证

本轮采用方案 3�?
### 4.2 处理原则

1. 不修�?notes 业务功能
2. 只处理壳层入口、消费路径、文件选择器边界和入口全局样式
3. 所有变更以首屏构建产物验证为准

---

## 5. 逐项处理对象输入 / 输出 / 变更属�?
### 5.1 `tests/notesEditorConsumerSubpathBoundary.node.test.mjs`

输入�?
1. notes 消费路径仍可能使�?broad root entry

输出�?
1. 新增边界测试
2. 强制 notes 壳层与内部消费改�?focused subpath

变更属性：新增

### 5.2 `tests/notesEditorFeatureSubpathBoundary.node.test.mjs`

输入�?
1. `vite.config.ts`
2. `tsconfig.json`

输出�?
1. 强制暴露 `@sdkwork/magic-studio-notes/pages`
2. 强制暴露 `@sdkwork/magic-studio-editor/file-picker`

变更属性：新增

### 5.3 `tests/xtermGlobalCssBoundary.node.test.mjs`

输入�?
1. `index.tsx` 仍可能继续全局引入 `@xterm/xterm/css/xterm.css`

输出�?
1. 新增边界测试
2. 阻止 xterm CSS 再次回到入口级全局路径

变更属性：新增

### 5.4 `packages/sdkwork-magic-studio-notes/src/pages/index.ts`

输入�?
1. `NotesPage`

输出�?
1. focused page entry，仅导出 `NotesPage`

变更属性：新增

### 5.5 `packages/sdkwork-magic-studio-editor/src/file-picker/index.ts`

输入�?
1. `filePicker`

输出�?
1. focused file-picker entry，仅暴露文件选择器能�?
变更属性：新增

### 5.6 `packages/sdkwork-magic-studio-notes/src/pages/NotesPage.tsx`

输入�?
1. 通过 `../index` 获取 notes 组件

输出�?
1. 直接改为 `../components/NoteSidebar`
2. 直接改为 `../components/NoteEditor`

变更属性：修改

### 5.7 `packages/sdkwork-magic-studio-notes/src/components/NoteEditor.tsx`

输入�?
1. `filePicker` 来源�?`@sdkwork/magic-studio-editor`

输出�?
1. 改为 `@sdkwork/magic-studio-editor/file-picker`

变更属性：修改

### 5.8 `packages/sdkwork-magic-studio-notes/src/components/menus/BlockFloatingMenu.tsx`

输入�?
1. `filePicker` 来源�?`@sdkwork/magic-studio-editor`

输出�?
1. 改为 `@sdkwork/magic-studio-editor/file-picker`

变更属性：修改

### 5.9 `src/router/registry.tsx`

输入�?
1. notes 页面通过 broad root 路径消费

输出�?
1. 改为 `@sdkwork/magic-studio-notes/pages`

变更属性：修改

### 5.10 `src/router/packageRoutes.tsx`

输入�?
1. notes 页面通过 broad root 路径消费

输出�?
1. 改为 `@sdkwork/magic-studio-notes/pages`

变更属性：修改

### 5.11 `src/router/packageRouteLoader.tsx`

输入�?
1. notes 页面通过 broad root 路径消费

输出�?
1. 改为 `@sdkwork/magic-studio-notes/pages`

变更属性：修改

### 5.12 `src/router/routePreload.ts`

输入�?
1. notes 预加载仍可能�?broad root

输出�?
1. 改为 `@sdkwork/magic-studio-notes/pages`

变更属性：修改

### 5.13 `vite.config.ts`

输入�?
1. 缺少 notes/editor �?subpath alias

输出�?
1. 增加 `@sdkwork/magic-studio-notes/pages`
2. 增加 `@sdkwork/magic-studio-editor/file-picker`

变更属性：修改

### 5.14 `tsconfig.json`

输入�?
1. 缺少 notes/editor �?subpath path mapping

输出�?
1. 增加 `@sdkwork/magic-studio-notes/pages`
2. 增加 `@sdkwork/magic-studio-editor/file-picker`

变更属性：修改

### 5.15 `packages/sdkwork-magic-studio-notes/package.json`

输入�?
1. 缺少 `./pages` 导出

输出�?
1. 增加 `./pages`

变更属性：修改

### 5.16 `packages/sdkwork-magic-studio-editor/package.json`

输入�?
1. 缺少 `./file-picker` 导出

输出�?
1. 增加 `./file-picker`

变更属性：修改

### 5.17 `index.tsx`

输入�?
1. 全局引入 `@xterm/xterm/css/xterm.css`

输出�?
1. 删除该入口级全局 CSS

变更属性：修改

---

## 6. 红灯 -> 绿灯闭环

### 6.1 红灯

命令�?
```powershell
node --test tests/xtermGlobalCssBoundary.node.test.mjs tests/notesEditorConsumerSubpathBoundary.node.test.mjs tests/notesEditorFeatureSubpathBoundary.node.test.mjs
```

结果�?
1. 失败
2. 失败原因：notes focused subpath 与入口级 xterm CSS 边界尚未满足

### 6.2 绿灯

实现后命令：

```powershell
node --test tests/xtermGlobalCssBoundary.node.test.mjs tests/notesEditorConsumerSubpathBoundary.node.test.mjs tests/notesEditorFeatureSubpathBoundary.node.test.mjs tests/editorDriveConsumerSubpathBoundary.node.test.mjs tests/editorDriveFeatureSubpathBoundary.node.test.mjs tests/viteManualChunks.node.test.mjs tests/viteChunkIsolation.node.test.mjs tests/viteReactAlias.node.test.mjs
```

结果�?
1. 全部通过

---

## 7. 验证

### 7.1 Node 边界验证

命令�?
```powershell
node --test tests/xtermGlobalCssBoundary.node.test.mjs tests/notesEditorConsumerSubpathBoundary.node.test.mjs tests/notesEditorFeatureSubpathBoundary.node.test.mjs tests/editorDriveConsumerSubpathBoundary.node.test.mjs tests/editorDriveFeatureSubpathBoundary.node.test.mjs tests/viteManualChunks.node.test.mjs tests/viteChunkIsolation.node.test.mjs tests/viteReactAlias.node.test.mjs
```

结果�?
1. 全部通过

### 7.2 构建验证

命令�?
```powershell
pnpm run build:test
```

结果�?
1. 构建成功
2. `dist/assets/index-BuDiJ7DB.js` 不再匹配 `vendor-editor`

---

## 8. 构建结果对比

### 8.1 处理�?
1. `index-LbOUopwU.js`: `506.77 kB`
2. `index-*` 静态引�?`vendor-editor-*`

### 8.2 处理�?
1. `index-BuDiJ7DB.js`: `504.93 kB`
2. `shared-magic-studio-i18n-B0lkg4_R.js`: `182.92 kB`
3. `vendor-editor-OV1dwnp3.js`: `382.05 kB`
4. `vendor-ui-CRtvcQ5k.js`: `776.46 kB`
5. `vendor-DFmMhGl0.js`: `1015.46 kB`
6. `index-*` 不再匹配 `vendor-editor`

结论�?
1. `vendor-editor` 已从 app shell 脱钩
2. 下一轮主瓶颈转移�?`shared-magic-studio-i18n` 与其它仍在首屏的共享�?
---

## 9. 下一轮计�?
下一轮优先级�?
1. 追查 `shared-magic-studio-i18n` 为什么仍达到 `182.92 kB`
2. 确认 lazy locale resource 是否被分桶策略重新吞回共�?runtime
3. 如确认属实，则拆�?i18n runtime chunk �?base locale resource chunk

