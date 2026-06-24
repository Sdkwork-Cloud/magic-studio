> Migrated from `docs/review/2026-04-06-magic-studio-performance-round-18.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Magic Studio V2 性能复盘与执行方�?Round 18

日期�?026-04-06  
范围：`apps/magic-studio-v2`  
目标：继续完成构建分包闭环，先修�?`feature-assets-center` 吞并共享运行时的问题，再消除 `chat` / `vip` 包根入口导致的动态导入失效�?
---

## 1. 当前阶段结论

Round 17 结束时，`magic-studio-assets` �?import 边界已经明显收窄，但真正的大问题仍然存在�?
1. `feature-assets-center` 仍达�?`1,237.27 kB`�?2. `shared-magic-studio-core-*`、`shared-app-sdk-*`、`shared-sdk-common-*` 没有真正产出�?3. 构建产物中存在：
   - `PromptOptimizerPage-* -> feature-assets-center-*`
   - `feature-drive-* -> feature-assets-center-*`
   - `AuthOAuthCallbackPage-* -> feature-assets-center-*`
4. 新增 focused entry 已证明入口边界收口有效，但还没有真正改变更高�?chunk 归并行为�?
本轮最终确认的根因有两层：

1. 当前构建链路实际走的�?`rolldown`，继续沿�?`rollupOptions.output.manualChunks` 的老语义不足以阻止共享依赖�?feature chunk 递归吞入�?2. `chat` / `vip` 的包根入口同时被静态消费和动态导入，直接触发 `INEFFECTIVE_DYNAMIC_IMPORT`，导致页面级懒加载失效并反向膨胀 app shell�?
---

## 2. 问题列表

### P1. `feature-assets-center` 把共享运行时�?SDK 依赖一起吞进大�?
影响�?
1. `PromptOptimizerPage`、`Drive`、`AuthOAuthCallbackPage` 都被迫加载并不需要的 assets-center runtime�?2. `shared-magic-studio-core`、`shared-app-sdk`、`shared-sdk-common` 虽然在分类函数中被命名，但最终没有单独落盘�?3. 说明问题已经不是 import 路径命名，而是 `rolldown` �?chunk 归并策略与旧配置不匹配�?
### P2. `chat` / `vip` 包根入口被静态消费，导致动态导入失�?
证据�?
1. `src/app/AppProvider.tsx` 静态导入：
   - `VipStoreProvider` from `@sdkwork/magic-studio-vip`
   - `ChatStoreProvider` from `@sdkwork/magic-studio-chat`
2. `src/layouts/MainLayout/MainSidebar.tsx`、`PortalHeader.tsx`、`PortalSidebar.tsx`、`TradeLayout.tsx` 静态导�?`PricingModal` from `@sdkwork/magic-studio-vip`
3. `PPTChatPane.tsx`、`AIChatPane.tsx`、`FilmChatPanel.tsx`、`NoteChatPane.tsx`、`CanvasChatPane.tsx` 静态导�?`EmbeddedChatPane` from `@sdkwork/magic-studio-chat`
4. 构建日志明确报出�?   - `sdkwork-magic-studio-vip` dynamic import ineffective
   - `sdkwork-magic-studio-chat` dynamic import ineffective

### P3. 主包仍偏大，但主矛盾已经转移

本轮结束后剩余问题：

1. `vendor-*` 仍为 `2,698.32 kB`
2. `index-*` 仍为 `506.98 kB`
3. `shared-magic-studio-i18n-*` �?`182.91 kB`

这说明下一轮的主问题将从“跨 workspace feature 误耦合”转为：

1. node_modules vendor 分组策略
2. app shell 静态组合边�?3. i18n 运行时的共享粒度

---

## 3. 本轮处理对象输入与输�?
### 3.1 `tests/viteChunkIsolation.node.test.mjs`

输入�?
1. `vite.config.ts`

输出�?
1. 不再允许仅依�?`build.rollupOptions.output.manualChunks`
2. 强制要求�?   - `build.rolldownOptions.output.strictExecutionOrder = true`
   - `build.rolldownOptions.output.codeSplitting.includeDependenciesRecursively = false`
   - `build.rolldownOptions.output.codeSplitting.groups` 使用共享 chunk classifier

改动性质：修�?
### 3.2 `vite.config.ts`

输入�?
1. �?`rollupOptions.output.manualChunks`
2. 现有 `resolveManualChunk()` 分类函数

输出�?
1. 迁移�?`build.rolldownOptions.output.codeSplitting`
2. 开启：
   - `strictExecutionOrder: true`
   - `includeDependenciesRecursively: false`
3. 使用动�?`name(moduleId)` 复用 `resolveManualChunk()`，让共享运行时和 feature chunk 真正脱钩
4. 新增 focused alias�?   - `@sdkwork/magic-studio-chat/pages`
   - `@sdkwork/magic-studio-chat/store`
   - `@sdkwork/magic-studio-chat/embedded-pane`
   - `@sdkwork/magic-studio-chat/i18n`
   - `@sdkwork/magic-studio-vip/pages`
   - `@sdkwork/magic-studio-vip/store`
   - `@sdkwork/magic-studio-vip/pricing-modal`

改动性质：修�?
### 3.3 `tests/chatConsumerSubpathBoundary.node.test.mjs`

输入�?
1. `src/app/AppProvider.tsx`
2. `src/router/registry.tsx`
3. `src/router/packageRoutes.tsx`
4. `src/router/packageRouteLoader.tsx`
5. `src/app/bootstrap.ts`
6. �?`EmbeddedChatPane` 消费�?
输出�?
1. 不再允许 runtime 文件直接�?`@sdkwork/magic-studio-chat` 根入口取 store / page / embedded pane / i18n
2. 强制改为 focused subpath�?   - `@sdkwork/magic-studio-chat/store`
   - `@sdkwork/magic-studio-chat/pages`
   - `@sdkwork/magic-studio-chat/embedded-pane`
   - `@sdkwork/magic-studio-chat/i18n`

改动性质：新�?
### 3.4 `tests/vipConsumerSubpathBoundary.node.test.mjs`

输入�?
1. `src/app/AppProvider.tsx`
2. `src/router/registry.tsx`
3. `src/router/packageRoutes.tsx`
4. `src/router/packageRouteLoader.tsx`
5. �?`PricingModal` 消费�?
输出�?
1. 不再允许 runtime 文件直接�?`@sdkwork/magic-studio-vip` 根入口取 store / page / modal
2. 强制改为 focused subpath�?   - `@sdkwork/magic-studio-vip/store`
   - `@sdkwork/magic-studio-vip/pages`
   - `@sdkwork/magic-studio-vip/pricing-modal`

改动性质：新�?
### 3.5 `tests/chatVipFeatureSubpathBoundary.node.test.mjs`

输入�?
1. `vite.config.ts`
2. `tsconfig.json`

输出�?
1. 强制要求 chat/vip �?subpath �?Vite alias �?TS path 中同时暴�?
改动性质：新�?
### 3.6 `packages/sdkwork-magic-studio-chat/src/pages/index.ts`

输入�?
1. `ChatPage`

输出�?
1. 作为 focused page entry，仅导出 `ChatPage`

改动性质：新�?
### 3.7 `packages/sdkwork-magic-studio-chat/src/embedded-pane/index.ts`

输入�?
1. `EmbeddedChatPane`

输出�?
1. 作为 focused embedded pane entry，仅导出 `EmbeddedChatPane`

改动性质：新�?
### 3.8 `packages/sdkwork-magic-studio-vip/src/pricing-modal/index.ts`

输入�?
1. `PricingModal`

输出�?
1. 作为 focused pricing modal entry，仅导出 `PricingModal`

改动性质：新�?
### 3.9 `src/app/AppProvider.tsx`

输入�?
1. `VipStoreProvider`
2. `ChatStoreProvider`

输出�?
1. 改为�?   - `VipStoreProvider` from `@sdkwork/magic-studio-vip/store`
   - `ChatStoreProvider` from `@sdkwork/magic-studio-chat/store`

改动性质：修�?
### 3.10 `src/app/bootstrap.ts`

输入�?
1. `defaultI18nConfig`

输出�?
1. 改为�?`@sdkwork/magic-studio-chat/i18n` 读取 chat i18n 配置，而不是动态导入整包根入口

改动性质：修�?
### 3.11 `src/router/registry.tsx`

输入�?
1. `PricingPage`
2. `ChatPage`

输出�?
1. 改为�?   - `@sdkwork/magic-studio-vip/pages`
   - `@sdkwork/magic-studio-chat/pages`

改动性质：修�?
### 3.12 `src/router/packageRoutes.tsx`

输入�?
1. `PricingPage`
2. `ChatPage`

输出�?
1. 改为�?   - `PricingPage` from `@sdkwork/magic-studio-vip/pages`
   - `ChatPage` from `@sdkwork/magic-studio-chat/pages`

改动性质：修�?
### 3.13 `src/router/packageRouteLoader.tsx`

输入�?
1. lazy route loader for `PricingPage` / `ChatPage`

输出�?
1. 动态导入改�?focused pages subpath�?   - `@sdkwork/magic-studio-vip/pages`
   - `@sdkwork/magic-studio-chat/pages`

改动性质：修�?
### 3.14 `src/layouts/MainLayout/MainSidebar.tsx`

输入�?
1. `PricingModal`

输出�?
1. 改为�?`@sdkwork/magic-studio-vip/pricing-modal` 导入

改动性质：修�?
### 3.15 Portal / Trade / ChatPane 消费�?
输入�?
1. `PricingModal`
2. `EmbeddedChatPane`

输出�?
1. `PortalHeader.tsx`
2. `PortalSidebar.tsx`
3. `TradeLayout.tsx`
4. `PPTChatPane.tsx`
5. `AIChatPane.tsx`
6. `FilmChatPanel.tsx`
7. `NoteChatPane.tsx`
8. `CanvasChatPane.tsx`

全部改为 focused subpath�?
1. `@sdkwork/magic-studio-vip/pricing-modal`
2. `@sdkwork/magic-studio-chat/embedded-pane`

改动性质：修�?
### 3.16 `packages/sdkwork-magic-studio-trade/src/types/magic-studio-vip.d.ts`

输入�?
1. `@sdkwork/magic-studio-vip` 类型声明

输出�?
1. 补充 `@sdkwork/magic-studio-vip/pricing-modal` 的模块声明，避免 trade 本地类型边界失配

改动性质：修�?
### 3.17 测试 mock 文件

输入�?
1. `MainSidebar.test.tsx`
2. `PortalHeader.test.tsx`
3. `PortalSidebar.test.tsx`
4. `TradeHeader.test.tsx`

输出�?
1. mock 路径同步�?`@sdkwork/magic-studio-vip` 改为 `@sdkwork/magic-studio-vip/pricing-modal`

改动性质：修�?
---

## 4. 红灯 -> 绿灯闭环

### 4.1 红灯

执行�?
1. `node --test tests/viteChunkIsolation.node.test.mjs`
2. `node --test tests/chatConsumerSubpathBoundary.node.test.mjs`
3. `node --test tests/vipConsumerSubpathBoundary.node.test.mjs`
4. `node --test tests/chatVipFeatureSubpathBoundary.node.test.mjs`

红灯结果�?
1. `vite.config.ts` 没有 `build.rolldownOptions.output`
2. `AppProvider.tsx` 仍静态导�?`@sdkwork/magic-studio-chat` / `@sdkwork/magic-studio-vip`
3. `registry.tsx` / `packageRoutes.tsx` / `packageRouteLoader.tsx` 仍从 chat/vip 根入口加载页�?4. Vite/TS 还没�?chat/vip �?focused subpath alias

结论�?
1. 红灯准确锁定了新的高价值边界缺�?2. 当前问题不是页面实现错误，而是包入口粒度与构建边界不一�?
### 4.2 绿灯

实施�?
1. `vite.config.ts` �?`rollupOptions` 切换�?`rolldownOptions.output.codeSplitting`
2. 新增 chat/vip focused entry
3. 更新 app shell、router、portal、trade、chat 嵌入消费�?4. 同步 TS path 与测�?mock

结果�?
1. 全部 node tests 通过
2. 相关 vitest 回归通过
3. 构建通过
4. `INEFFECTIVE_DYNAMIC_IMPORT` warning 消失

---

## 5. 本轮验证结果

### 5.1 边界 node tests

执行�?
1. `node --test tests/viteChunkIsolation.node.test.mjs`
2. `node --test tests/viteManualChunks.node.test.mjs`
3. `node --test tests/viteReactAlias.node.test.mjs`
4. `node --test tests/chatConsumerSubpathBoundary.node.test.mjs`
5. `node --test tests/vipConsumerSubpathBoundary.node.test.mjs`
6. `node --test tests/chatVipFeatureSubpathBoundary.node.test.mjs`

结果�?
1. 全部通过

### 5.2 相关回归 vitest

执行�?
1. `pnpm vitest run src/layouts/MainLayout/MainSidebar.test.tsx packages/sdkwork-magic-studio-portal-video/src/components/PortalHeader.test.tsx packages/sdkwork-magic-studio-portal-video/src/components/PortalSidebar.test.tsx packages/sdkwork-magic-studio-trade/src/components/Layout/TradeHeader.test.tsx`

结果�?
1. `4` 个文件全部通过
2. `12` 个测试全部通过

### 5.3 构建

执行�?
1. `pnpm run build:test`

关键结果�?
1. 构建通过
2. `INEFFECTIVE_DYNAMIC_IMPORT` warning 已消�?3. `feature-assets-center-*` �?`1,237.27 kB` 降到 `32.64 kB`
4. `feature-assets-generation-*` �?`607.64 kB` 降到 `103.73 kB`
5. `feature-drive-*` 从约 `156.01 kB` 降到 `69.63 kB`
6. `shared-magic-studio-core-*` 已产出：`107.96 kB`
7. `shared-app-sdk-*` 已产出：`102.22 kB`
8. `shared-sdk-common-*` 已产出：`39.96 kB`
9. `index-*` �?`535.36 kB` 降到 `506.98 kB`
10. 新产物出现：
    - `pages-*`
    - `embedded-pane-*`
    - `ChatInput-*`
    - `i18n-*`

---

## 6. 构建产物复核结论

### 6.1 关键入口引用关系

1. `PromptOptimizerPage-*` 已不再依�?`feature-assets-center-*`，而是依赖�?   - `shared-magic-studio-core-*`
   - `shared-magic-studio-commons-*`
   - `shared-magic-studio-i18n-*`
   - `feature-assets-generation-*`
2. `feature-drive-*` 已不再依�?`feature-assets-center-*`，改为依赖：
   - `shared-magic-studio-core-*`
   - `shared-magic-studio-commons-*`
   - `feature-assets-services-*`
3. `AuthOAuthCallbackPage-*` 已不再依�?`feature-assets-center-*`，改为依赖：
   - `shared-magic-studio-core-*`
   - `index-*`

### 6.2 产物结构变化

本轮已经把问题从“错误的大块耦合”推进到“正常但仍可继续优化的共享块”：

1. `assets-center` 已回归到真正�?assets-center 粒度
2. `chat` / `vip` 的页面级懒加载重新恢复有�?3. 共享运行时从 feature chunk 中被释放出来，转为独�?shared chunk

---

## 7. 剩余问题

### 7.1 `vendor-*` 仍然过大

当前状态：

1. `vendor-* = 2,698.32 kB`
2. 这是当前新的首要大块

疑似根因�?
1. node_modules 仍被聚合进单一 vendor
2. 缺少更细的第三方依赖分组

### 7.2 `index-*` 仍为 506.98 kB

当前状态：

1. 主壳层已经下降，但仍偏大
2. 说明还有静态组合能力集中在 app shell

疑似根因�?
1. `AppProvider`
2. 主布局
3. 入口注册与共用页面壳

### 7.3 `shared-magic-studio-i18n-*` 仍较�?
当前状态：

1. `182.91 kB`
2. 已成为最大的 shared workspace chunk 之一

疑似根因�?
1. 多包 i18n 配置仍在共享 runtime 中聚�?2. 还可以继续把极少使用�?locale/resource 延后

---

## 8. 下一步计�?
1. 针对 `vendor-*` 做下一轮分解设计：
   - 优先抽离 Monaco / TipTap / AWS SDK / UI runtime / charting or editor-heavy third-party bundles
   - �?node_modules 增加更高优先级的 codeSplitting groups
2. 针对 `index-*` 继续�?app shell 审计�?   - 排查 `AppProvider`、`AppShell`、`MainLayout`、route registry 的静态组合热�?   - 查找仍然从包根入口拿“页�?provider+modal+i18n”混合导出的模块
3. 针对 `shared-magic-studio-i18n-*` 设计延迟注册策略�?   - 仅保留首屏必需包同步注�?   - 其余包继续按进入页面或空闲时注册
4. 保持每轮闭环�?   - 先补边界红灯测试
   - 再做 focused 修复
   - 再跑 node/vitest/build
   - 最后写�?`docs/review`

---

## 9. 阶段评价

本轮已经完成一个完整执行闭环：

1. 根因从“import 不干净”提升并验证到“rolldown code splitting 策略错误�?2. 先用测试锁定，再用最小代码改动切换构建边�?3. 再顺着构建 warning 修复 `chat` / `vip` 根入口耦合
4. 最终把 `assets-center` 大块问题、`chat/vip` 动态导入失效问题一起收�?
当前阶段不再建议回到旧的 `manualChunks` 微调思路。下一轮应直接面向�?
1. vendor 拆分
2. app shell 降载
3. i18n shared chunk 收敛

