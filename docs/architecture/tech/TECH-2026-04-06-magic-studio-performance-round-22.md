> Migrated from `docs/review/2026-04-06-magic-studio-performance-round-22.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Magic Studio V2 性能复盘与执行方�?Round 22

日期�?026-04-06  
范围：`apps/magic-studio-v2`  
目标：在 round-21 完成 `index-*` �?`vendor-editor` 的脱钩后，继续解�?`shared-magic-studio-i18n-*` 仍高�?`182.92 kB` 的问题，确保基础语言资源真正按需分离�?
---

## 1. 当前阶段结论

round-21 完成后：

1. `index-*` 已经不再静态引�?`vendor-editor`
2. `shared-magic-studio-i18n-B0lkg4_R.js` 仍有 `182.92 kB`
3. 首屏主包虽然摆脱�?editor，但 i18n 共享块仍然过�?
进一步检查构建产物确认：

1. `packages/sdkwork-magic-studio-i18n/src/resourceLoaders.ts` 已经使用动�?`import('./resources/en')` �?`import('./resources/zh-CN')`
2. 但是构建后的 `shared-magic-studio-i18n-*` 里仍然能直接看到大量英文/中文资源文本
3. 说明问题不在 i18n 运行时逻辑，而在构建分桶策略

本轮结论�?
1. i18n lazy loader 设计本身是对�?2. `vite` / `rolldown` manual chunk classifier 把整�?`sdkwork-magic-studio-i18n` 包都强制塞进�?`shared-magic-studio-i18n`
3. 懒加载资源模块因此被重新吞回运行时共享块

---

## 2. 根因分析

### 2.1 i18n 运行时已经具备懒加载能力

代码层面已有正确设计�?
1. `I18nService.ts` 不再静�?import `resources/en` / `resources/zh-CN`
2. `resourceLoaders.ts` �?`en-US`、`zh-CN` 都使用了动态导�?3. `bootstrap.ts` 会在首屏渲染前只预热当前 locale 所需基础资源

因此，问题不是业务代码没�?lazy�?
### 2.2 manual chunk 分类把整�?i18n 包压成了一个共享块

`scripts/vite-manual-chunks.mjs` �?round-21 之前的逻辑是：

1. 只要命中 `packages/sdkwork-magic-studio-i18n`
2. 无论�?runtime、resource loader、`resources/en.ts`、`locales/en/*`，全部统一返回 `shared-magic-studio-i18n`

这会直接导致�?
1. 动�?import 资源模块虽然语义上是懒加�?2. 但产物层仍落在同一块里
3. 最终首�?runtime chunk 里保留了整包文案

### 2.3 构建产物证据

`dist/assets/shared-magic-studio-i18n-B0lkg4_R.js` 中直接包含：

1. `Magic Studio`
2. `Membership Center`
3. 资产中心、插件中心、账号中心等大量英文/中文文案对象

这说明：

1. 当前共享块不仅是 i18n runtime
2. 还包含了基础 locale 文案�?
---

## 3. 问题列表

### P1. `shared-magic-studio-i18n` 被错误聚合为 runtime + locale resource 混合�?
影响�?
1. 首屏共享块过�?2. 懒加载语义失去价�?3. 基础 locale 资源不能按需缓存和复�?
### P2. 懒加载资源模块缺少独�?chunk 命名

影响�?
1. `resourceLoaders.ts` 虽然写成动�?import
2. 但无法保证产物层真正切块

---

## 4. 本轮执行方案

### 4.1 方案选择

候选方案：

1. 保持现状，只接受 `shared-magic-studio-i18n` 偏大
   - 缺点：浪费上一�?lazy i18n 改�?2. 重写 i18n runtime 结构
   - 缺点：没必要，代码逻辑本身已正�?3. 只调�?manual chunk 分类，让 runtime 与基础 locale 资源分离
   - 优点：最小、精准、可验证

本轮采用方案 3�?
### 4.2 目标 chunk 设计

1. `shared-magic-studio-i18n`
   - 只保�?runtime、hook、formatter、registry
2. `shared-magic-studio-i18n-en`
   - 承载 `resources/en.ts` �?`locales/en/*`
3. `shared-magic-studio-i18n-zh-cn`
   - 承载 `resources/zh-CN.ts` �?`locales/zh-CN/*`

---

## 5. 逐项处理对象输入 / 输出 / 变更属�?
### 5.1 `tests/viteManualChunks.node.test.mjs`

输入�?
1. `sdkwork-magic-studio-i18n` 所有模块都统一映射�?`shared-magic-studio-i18n`

输出�?
1. 新增 red/green 断言
2. 要求�?   - `I18nService.ts` -> `shared-magic-studio-i18n`
   - `resources/en.ts`、`locales/en/*` -> `shared-magic-studio-i18n-en`
   - `resources/zh-CN.ts`、`locales/zh-CN/*` -> `shared-magic-studio-i18n-zh-cn`

变更属性：修改

### 5.2 `scripts/vite-manual-chunks.mjs`

输入�?
1. `sdkwork-magic-studio-i18n` 整包统一映射 `shared-magic-studio-i18n`

输出�?
1. 针对 `resources/en.ts` �?`locales/en/*` 返回 `shared-magic-studio-i18n-en`
2. 针对 `resources/zh-CN.ts` �?`locales/zh-CN/*` 返回 `shared-magic-studio-i18n-zh-cn`
3. 其余 runtime 模块继续返回 `shared-magic-studio-i18n`

变更属性：修改

---

## 6. 红灯 -> 绿灯闭环

### 6.1 红灯

命令�?
```powershell
node --test tests/viteManualChunks.node.test.mjs
```

结果�?
1. 失败
2. 失败原因：`/repo/packages/sdkwork-magic-studio-i18n/src/resources/en.ts` 实际仍返�?`shared-magic-studio-i18n`

### 6.2 绿灯

实现后命令：

```powershell
node --test tests/viteManualChunks.node.test.mjs tests/viteChunkIsolation.node.test.mjs
```

结果�?
1. 全部通过

---

## 7. 验证

### 7.1 Node 边界验证

命令�?
```powershell
node --test tests/i18nLazyBootstrapBoundary.node.test.mjs tests/startupPerformance.node.test.mjs tests/viteManualChunks.node.test.mjs tests/viteChunkIsolation.node.test.mjs tests/viteReactAlias.node.test.mjs
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
2. 产物新增�?   - `shared-magic-studio-i18n-en-*`
   - `shared-magic-studio-i18n-zh-cn-*`
3. `shared-magic-studio-i18n-*` 运行时块显著缩小

---

## 8. 构建结果对比

### 8.1 处理�?
1. `shared-magic-studio-i18n-B0lkg4_R.js`: `182.92 kB`
2. `index-BuDiJ7DB.js`: `504.93 kB`

### 8.2 处理�?
1. `shared-magic-studio-i18n-BfdnX4u7.js`: `6.65 kB`
2. `shared-magic-studio-i18n-en-K9Sr7Hej.js`: `89.90 kB`
3. `shared-magic-studio-i18n-zh-cn-CYajkRSN.js`: `86.30 kB`
4. `index-DN-Y3uYu.js`: `504.93 kB`

结论�?
1. i18n runtime 已从基础 locale 文案树中分离出来
2. 首屏共享块被成功压缩
3. 下一轮应继续处理仍然被壳层直接拉入的 feature 级依�?
---

## 9. 下一轮计�?
下一轮优先级�?
1. 检�?`index-*` 仍直接引用哪�?feature chunk
2. 重点排查 `feature-magiccut-shell` 是否仍被 app shell 静态引�?3. 如确认属实，则继续收�?Magic Cut 的路�?布局边界


