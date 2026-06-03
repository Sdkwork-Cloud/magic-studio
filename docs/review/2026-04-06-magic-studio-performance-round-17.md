# Magic Studio V2 性能复盘与执行方�?Round 17

日期�?026-04-06  
范围：`apps/magic-studio-v2`  
本轮目标：继续收�?`magic-studio-assets` 的消费入口，�?`PromptOptimizerPage` �?`Drive FilePreviewModal` 从过宽的 assets barrel 入口切到 focused entry，并验证这次收口是否改变真实构建产物�?
---

## 1. 当前阶段结论

Round 16 已经完成�?1. `sdkwork-magic-studio-assets` 热路径文件不再从 `@sdkwork/magic-studio-core` 根入口取运行时能力�?2. `tests/reactCoreFocusedSubpathBoundary.node.test.mjs` 已由红转绿�?3. �?`build:test` 显示 `feature-assets-center` 仍为 `1,237.27 kB`，几乎没有下降�?
因此本轮要解决的不是 `magic-studio-core` 根入口问题，而是第二层问题：
1. 某些上游消费者虽然已经避开 `@sdkwork/magic-studio-assets` 根入口，但仍在使用过宽的 assets 子路�?barrel�?2. 这些 barrel 仍可能把无关模块与重依赖一起带�?chunk�?
---

## 2. 问题列表

### P1. `PromptOptimizerPage` 仍通过 `@sdkwork/magic-studio-assets/creation-chat` 获取 `StyleSelector`

影响�?1. `creation-chat` �?barrel 入口，同时导�?`CreationChatInput`、`AttachmentGrid`、`StyleSelector` 等多个组件�?2. 即使只使�?`StyleSelector`，仍可能�?bundler 按入口整体处理，扩大依赖范围�?
### P2. `FilePreviewModal` 仍通过 `@sdkwork/magic-studio-assets/services` 获取 `assetService`

影响�?1. `services` 是大 barrel，包�?`assetService`、`assetBusinessService`、`creationCapabilityService`、`generatedOutcomeAssetPersistence` 等多个服务出口�?2. drive 仅需�?`assetService.resolveAssetUrl`，继续走�?services 入口会扩�?`feature-drive` 的资产侧依赖面�?
### P3. 构建结果提示真正大头已经不只�?import 路径错误

证据�?1. focused entry 改造后，构建已经生成新�?`feature-assets-services-*.js` �?chunk�?2. �?`PromptOptimizerPage` 仍直接导�?`feature-assets-center-*`�?3. 说明当前真正的下一层问题已转为更高层的 chunk/route 设计，不再只是简单的 import alias 收口�?
---

## 3. 本轮处理对象输入与输�?
### 3.1 `tests/assetsConsumerSubpathBoundary.node.test.mjs`

输入�?1. `packages/sdkwork-magic-studio-prompt/src/pages/PromptOptimizerPage.tsx`

输出�?1. 不再允许 `PromptOptimizerPage.tsx` 通过 `@sdkwork/magic-studio-assets/creation-chat` 获取 `StyleSelector`
2. 改为要求使用 `@sdkwork/magic-studio-assets/style-selector`

### 3.2 `tests/driveAssetsSubpathBoundary.node.test.mjs`

输入�?1. `packages/sdkwork-magic-studio-drive/src/components/FilePreviewModal.tsx`

输出�?1. 不再允许 `FilePreviewModal.tsx` �?`@sdkwork/magic-studio-assets/services` 引入 `assetService`
2. 改为要求使用 `@sdkwork/magic-studio-assets/asset-service`

### 3.3 `tests/assetsFeatureSubpathBoundary.node.test.mjs`

输入�?1. `vite.config.ts`
2. `tsconfig.json`

输出�?1. 新增 focused assets alias 校验�?   - `@sdkwork/magic-studio-assets/style-selector`
   - `@sdkwork/magic-studio-assets/asset-service`

### 3.4 `tests/viteManualChunks.node.test.mjs`

输入�?1. `scripts/vite-manual-chunks.mjs`

输出�?1. 要求 `src/style-selector/index.ts` 归入 `feature-assets-generation`
2. 要求 `src/asset-service/index.ts` 归入 `feature-assets-services`

### 3.5 `packages/sdkwork-magic-studio-assets/src/style-selector/index.ts`

输入�?1. `StyleSelector`
2. `StyleAsset`
3. `StyleOption`

输出�?1. 作为 focused entry，仅导出 `StyleSelector` 及其类型

改动性质：新�?
### 3.6 `packages/sdkwork-magic-studio-assets/src/asset-service/index.ts`

输入�?1. `assetService`
2. `ASSET_CATEGORIES`
3. `setMediaAnalysisAdapter`
4. `MediaAnalysisAdapter`
5. `MediaAnalysisResult`

输出�?1. 作为 focused entry，仅导出 drive 预览等场景真正需要的 asset service �?
改动性质：新�?
### 3.7 `vite.config.ts`

输入�?1. assets 子路�?alias 配置

输出�?1. 新增 alias�?   - `@sdkwork/magic-studio-assets/style-selector`
   - `@sdkwork/magic-studio-assets/asset-service`

改动性质：修�?
### 3.8 `tsconfig.json`

输入�?1. assets 子路�?path 配置

输出�?1. 新增 path�?   - `@sdkwork/magic-studio-assets/style-selector`
   - `@sdkwork/magic-studio-assets/asset-service`
2. 同步 legacy `sdkwork-magic-studio-assets/*` 映射

改动性质：修�?
### 3.9 `scripts/vite-manual-chunks.mjs`

输入�?1. assets package 模块路径

输出�?1. `src/style-selector/` -> `feature-assets-generation`
2. `src/asset-service/` -> `feature-assets-services`

改动性质：修�?
### 3.10 `packages/sdkwork-magic-studio-prompt/src/pages/PromptOptimizerPage.tsx`

输入�?1. `StyleSelector`

输出�?1. 改为�?`@sdkwork/magic-studio-assets/style-selector` 导入

改动性质：修�?
### 3.11 `packages/sdkwork-magic-studio-drive/src/components/FilePreviewModal.tsx`

输入�?1. `assetService`

输出�?1. 改为�?`@sdkwork/magic-studio-assets/asset-service` 导入

改动性质：修�?
---

## 4. 红灯 -> 绿灯闭环

### 4.1 红灯

执行�?1. `node --test tests/assetsConsumerSubpathBoundary.node.test.mjs`
2. `node --test tests/driveAssetsSubpathBoundary.node.test.mjs`
3. `node --test tests/assetsFeatureSubpathBoundary.node.test.mjs`
4. `node --test tests/viteManualChunks.node.test.mjs`

结果�?1. `PromptOptimizerPage.tsx` 仍导�?`@sdkwork/magic-studio-assets/creation-chat`
2. `FilePreviewModal.tsx` 仍导�?`@sdkwork/magic-studio-assets/services`
3. `vite.config.ts` / `tsconfig.json` 还没有新 alias
4. `resolveAssetsFeatureChunk()` 尚未识别 `src/style-selector/index.ts`

结论�?1. 红灯失败原因正确，测试锁定的�?focused entry 收口，不是测试本身写错�?
### 4.2 绿灯

执行�?1. 新增 `src/style-selector/index.ts`
2. 新增 `src/asset-service/index.ts`
3. 增补 `vite.config.ts` / `tsconfig.json` alias
4. 调整 `scripts/vite-manual-chunks.mjs`
5. 更新 `PromptOptimizerPage.tsx`
6. 更新 `FilePreviewModal.tsx`
7. 重跑上述 4 �?node tests

结果�?1. 全部通过

---

## 5. 本轮验证结果

### 5.1 Focused entry node tests

执行�?1. `node --test tests/assetsConsumerSubpathBoundary.node.test.mjs`
2. `node --test tests/driveAssetsSubpathBoundary.node.test.mjs`
3. `node --test tests/assetsFeatureSubpathBoundary.node.test.mjs`
4. `node --test tests/viteManualChunks.node.test.mjs`

结果�?1. 全部通过

### 5.2 已有关键回归

执行�?1. `node --test tests/reactCoreFocusedSubpathBoundary.node.test.mjs`
2. `pnpm vitest run packages/sdkwork-magic-studio-assets/tests/generatedSelectionAssetPersistence.test.ts packages/sdkwork-magic-studio-assets/tests/generatedOutcomeAssetPersistence.test.ts packages/sdkwork-magic-studio-assets/tests/coverGenerationService.test.ts packages/sdkwork-magic-studio-assets/tests/assetServiceMagicStudioRoot.test.ts packages/sdkwork-magic-studio-assets/tests/assetServiceIdentity.test.ts packages/sdkwork-magic-studio-assets/tests/chooseAssetIdentity.test.tsx packages/sdkwork-magic-studio-assets/tests/promptCapabilityProps.test.ts`
3. `node --test tests/assetsFocusedSdkClientBoundary.node.test.mjs`
4. `pnpm vitest run packages/sdkwork-magic-studio-assets/tests/assetSdkQueryService.test.ts packages/sdkwork-magic-studio-assets/tests/creationCapabilityService.test.ts packages/sdkwork-magic-studio-assets/tests/remoteAssetIndexRepository.test.ts packages/sdkwork-magic-studio-prompt/src/services/promptBusinessService.test.ts packages/sdkwork-magic-studio-core/src/sdk/__tests__/uploadViaPresignedUrl.test.ts`

结果�?1. 全部通过

### 5.3 构建

执行�?1. `pnpm run build:test`

结果�?1. 构建通过
2. 新增�?`feature-assets-services-*.js` 极小 chunk，说�?focused entry 生效
3. 仍存在：
   - `PLUGIN_TIMINGS` warning
   - `Some chunks are larger than 1200 kB`

---

## 6. 产物结论

构建产物复核结果�?1. `feature-assets-center` 仍为 `1,237.27 kB`
2. `feature-assets-generation` 仍约 `607.64 kB`
3. `feature-drive` 仍约 `156.01 kB`
4. `shared-magic-studio-core-*`、`shared-app-sdk-*`、`shared-sdk-common-*` 仍未产出

进一步验尸：
1. `PromptOptimizerPage-*.js` 仍直接导�?`feature-assets-center-*`
2. `feature-drive-*.js` 现在会导入新�?`feature-assets-services-*` �?chunk，但仍同时导�?`feature-assets-center-*`
3. `AuthOAuthCallbackPage-*.js` 仍直接导�?`feature-assets-center-*`

结论�?1. focused entry 改造已经修正了消费入口的粒度，并在产物中留下了新的 services chunk 证据�?2. �?`feature-assets-center` 的真正膨胀根因已经进入下一层：更高层的 route / package / shared runtime 聚合关系�?3. 当前阶段再继续只�?import 路径，收益会明显递减�?
---

## 7. 当前剩余问题

### 7.1 `PromptOptimizerPage` 仍拉�?`feature-assets-center`

状态：
1. 不是 `StyleSelector` focused entry 本身的问题了�?2. 更像�?prompt 本地模块�?assets runtime 之间还有更高层共享依赖被 bundler 合并�?
### 7.2 `feature-drive` 仍保留对 `feature-assets-center` 的引�?
状态：
1. focused `asset-service` 已生效，但不足以�?drive �?center 大块中彻底切离�?2. 仍需继续审计 `driveBusinessService`、viewer、search/index 等共享依赖�?
### 7.3 `shared-magic-studio-core` / `shared-app-sdk` / `shared-sdk-common` 仍未产出

状态：
1. 这说明虽然边界测试正确，但还没有命中真正能改变最�?chunk 拆分的核心热点组合�?
---

## 8. 下一步计�?
1. �?`PromptOptimizerPage` 做更细的依赖追踪�?   - 检�?prompt store / service / constants 是否被并�?`feature-assets-center`
   - 评估是否需要为 `sdkwork-magic-studio-prompt` 增加显式 manual chunk �?lazy boundary
2. �?`feature-drive` 做更细的依赖追踪�?   - 分析�?`assetService` 外，是否还有别的资产中心运行时接口把 center chunk 带入
3. 在继续改代码前，先补更高层的 chunk / route 边界设计文档，再做下一轮实�?4. 保持每轮都执行：
   - 红灯测试
   - focused 修复
   - 回归验证
   - 构建验尸
   - `docs/review` 记录闭环
