# Magic Studio V2 性能复盘与执行方�?Round 10

日期�?026-04-06  
范围：`apps/magic-studio-v2`  
本轮目标：继续清�?`sdkwork-magic-studio-film` 运行时模块对 `@sdkwork/magic-studio-assets` 根入口的消费，并�?film 方向的测�?mock 同步到真实子路径�? 
排除范围：`packages/sdkwork-magic-studio-notes`

---

## 1. 当前阶段结论

Round 9 完成后，最优先的剩余高频运行时 root-import 消费包是�?
1. `sdkwork-magic-studio-film`
2. `sdkwork-magic-studio-canvas`
3. `sdkwork-magic-studio-drive`
4. `sdkwork-magic-studio-magiccut` 的剩余资源组�?
本轮优先处理 `sdkwork-magic-studio-film`，原因是它同时更接近�?
1. `feature-film-core`
2. `feature-assets-center`

Round 10 继续沿用相同闭环�?
1. 先写失败边界测试
2. 再做最小导入切�?3. 如测试失败，先查 mock 与真实导入路径是否脱�?4. �?film 定向测试
5. 跑全�?node tests
6. 跑构建并复查 chunk

---

## 2. 问题列表

### P1. `sdkwork-magic-studio-film` 运行时文件仍继续消费 `@sdkwork/magic-studio-assets` 根入�?
影响�?
1. film 运行时依赖面继续�?root facade 混合掩盖
2. 无法精确判断 `feature-film-core` �?`feature-assets-center` 的真实耦合来源
3. `ChooseAssetModal / PromptTextInput / createInputAttachment / detectAssetTypeByFilename / portal capability` 等能力仍然被宽入口聚�?
根因�?
1. `filmModalAssetImport.ts` 同时�?root 获取导入能力�?asset url resolver
2. `filmHomeAttachment.ts` �?root 获取 chat attachment helper
3. `filmAssetUrlResolver.ts` �?root 获取 asset-center resolver helper
4. `FilmHomePage.tsx` �?root 混用 chat input 能力�?capability service
5. `ShotModal.tsx` �?root 混用 choose-asset、generation、creation-chat、asset-center 能力
6. `CharacterModal.tsx` / `PropModal.tsx` / `LocationModal.tsx` 继续�?root 混用 modal、prompt、asset type

### P2. film 测试继续 mock 旧媒体包根入口，和生产导入路径不一�?
本轮实际暴露的测试问题：

1. `filmPromptService.test.ts` 继续 mock `@sdkwork/magic-studio-image`
2. `filmService.test.ts` 继续 mock `@sdkwork/magic-studio-image`、`@sdkwork/magic-studio-video`
3. `filmStoreProjectGraph.test.tsx` 继续 mock `@sdkwork/magic-studio-audio`

症状�?
1. `filmPromptService.test.ts` 直接打到真实网络请求
2. `filmService.test.ts` 回落加载真实 image 模块，报 `@sdkwork/magic-studio-core` mock 缺少 `LocalStorageService`
3. `filmStoreProjectGraph.test.tsx` 没有拦住真实 `audioService.generateAudio`，报 `getAppSdkClientWithSession` 缺失

真实根因�?
1. 生产代码已经统一�?`@sdkwork/magic-studio-image/services`
2. 生产代码已经统一�?`@sdkwork/magic-studio-video/services` �?`@sdkwork/magic-studio-video/entities`
3. 生产代码已经统一�?`@sdkwork/magic-studio-audio/services`
4. 测试仍在 mock 旧根入口，导�?mock 失效

---

## 3. 本轮处理输入与输�?
### 3.1 `filmModalAssetImport.ts`

输入�?
1. `importAssetBySdk`
2. `importAssetFromUrlBySdk`
3. `resolveAssetPrimaryUrlBySdk`
4. `resolveAssetUrlByAssetIdFirst`
5. 来源统一为：`@sdkwork/magic-studio-assets`

输出�?
1. `importAssetBySdk` / `importAssetFromUrlBySdk` / `resolveAssetPrimaryUrlBySdk`
2. 来源改为：`@sdkwork/magic-studio-assets/services`
3. `resolveAssetUrlByAssetIdFirst`
4. 来源改为：`@sdkwork/magic-studio-assets/asset-center`

### 3.2 `filmHomeAttachment.ts`

输入�?
1. `createInputAttachment`
2. `InputAttachment`
3. 来源：`@sdkwork/magic-studio-assets`

输出�?
1. `createInputAttachment`
2. `InputAttachment`
3. 来源改为：`@sdkwork/magic-studio-assets/creation-chat`

### 3.3 `filmAssetUrlResolver.ts`

输入�?
1. `getDirectLocatorCandidates`
2. `hasResolvableAssetReference`
3. `resolveAssetUrlByAssetIdFirst`
4. 来源：`@sdkwork/magic-studio-assets`

输出�?
1. `getDirectLocatorCandidates`
2. `hasResolvableAssetReference`
3. `resolveAssetUrlByAssetIdFirst`
4. 来源改为：`@sdkwork/magic-studio-assets/asset-center`

### 3.4 `FilmHomePage.tsx`

输入�?
1. `CreationChatInput`
2. `PortalTab`
3. `StyleSelector`
4. `removeInputAttachmentByKey`
5. `fetchCreationCapabilities`
6. `toCreationModelProviders`
7. `resolveCreationStyleOptions`
8. `resolveCreationEntryCapabilityOptions`
9. 来源统一为：`@sdkwork/magic-studio-assets`

输出�?
1. `CreationChatInput` / `StyleSelector` / `removeInputAttachmentByKey` / `PortalTab`
2. 来源改为：`@sdkwork/magic-studio-assets/creation-chat`
3. `fetchCreationCapabilities` / `toCreationModelProviders` / `resolveCreationStyleOptions` / `resolveCreationEntryCapabilityOptions`
4. 来源改为：`@sdkwork/magic-studio-assets/services`

### 3.5 `ShotModal.tsx`

输入�?
1. `PromptTextInput`
2. `ChooseAssetModal`
3. `createInputAttachment`
4. `createPromptTextInputCapabilityProps`
5. `detectAssetTypeByFilename`
6. `InputAttachment`
7. 来源统一为：`@sdkwork/magic-studio-assets`

输出�?
1. `ChooseAssetModal`
2. 来源改为：`@sdkwork/magic-studio-assets/choose-asset`
3. `createInputAttachment` / `InputAttachment`
4. 来源改为：`@sdkwork/magic-studio-assets/creation-chat`
5. `PromptTextInput` / `createPromptTextInputCapabilityProps`
6. 来源改为：`@sdkwork/magic-studio-assets/generation`
7. `detectAssetTypeByFilename`
8. 来源改为：`@sdkwork/magic-studio-assets/asset-center`

### 3.6 `CharacterModal.tsx`

输入�?
1. `ChooseAssetModal`
2. `PromptTextInput`
3. `createPromptTextInputCapabilityProps`
4. 来源：`@sdkwork/magic-studio-assets`

输出�?
1. `ChooseAssetModal`
2. 来源改为：`@sdkwork/magic-studio-assets/choose-asset`
3. `PromptTextInput` / `createPromptTextInputCapabilityProps`
4. 来源改为：`@sdkwork/magic-studio-assets/generation`

### 3.7 `PropModal.tsx`

输入�?
1. `ChooseAssetModal`
2. `PromptTextInput`
3. `createPromptTextInputCapabilityProps`
4. `Asset`
5. 来源：`@sdkwork/magic-studio-assets`

输出�?
1. `ChooseAssetModal`
2. 来源改为：`@sdkwork/magic-studio-assets/choose-asset`
3. `PromptTextInput` / `createPromptTextInputCapabilityProps`
4. 来源改为：`@sdkwork/magic-studio-assets/generation`
5. `Asset`
6. 来源改为：`@sdkwork/magic-studio-assets/entities`

### 3.8 `LocationModal.tsx`

输入�?
1. `ChooseAssetModal`
2. `PromptTextInput`
3. `createPromptTextInputCapabilityProps`
4. `Asset`
5. 来源：`@sdkwork/magic-studio-assets`

输出�?
1. `ChooseAssetModal`
2. 来源改为：`@sdkwork/magic-studio-assets/choose-asset`
3. `PromptTextInput` / `createPromptTextInputCapabilityProps`
4. 来源改为：`@sdkwork/magic-studio-assets/generation`
5. `Asset`
6. 来源改为：`@sdkwork/magic-studio-assets/entities`

### 3.9 测试对齐

处理文件�?
1. `packages/sdkwork-magic-studio-film/tests/generatedSelectionAssetImport.test.ts`
2. `packages/sdkwork-magic-studio-film/tests/filmPromptService.test.ts`
3. `packages/sdkwork-magic-studio-film/tests/filmStoreProjectGraph.test.tsx`
4. `packages/sdkwork-magic-studio-film/src/services/filmService.test.ts`

输出�?
1. `generatedSelectionAssetImport.test.ts` 改为 mock�?   - `@sdkwork/magic-studio-assets/services`
   - `@sdkwork/magic-studio-assets/asset-center`
2. `filmPromptService.test.ts` 改为 mock `@sdkwork/magic-studio-image/services`
3. `filmStoreProjectGraph.test.tsx` 改为 mock `@sdkwork/magic-studio-audio/services`
4. `filmService.test.ts` 改为 mock�?   - `@sdkwork/magic-studio-image/services`
   - `@sdkwork/magic-studio-video/services`
   - `@sdkwork/magic-studio-video/entities`

---

## 4. 红灯 -> 绿灯闭环

### 4.1 新增失败边界测试

新增�?
1. `tests/filmAssetsSubpathBoundary.node.test.mjs`

约束�?
1. `sdkwork-magic-studio-film` 的这批运行时文件不允许再�?`@sdkwork/magic-studio-assets` 根入口导�?2. 每个文件都必须命中对�?focused subpath

### 4.2 红灯验证

执行�?
1. `node --test tests/filmAssetsSubpathBoundary.node.test.mjs`

结果�?
1. 失败
2. 第一处失败文件是 `packages/sdkwork-magic-studio-film/src/utils/filmModalAssetImport.ts`

### 4.3 最小实�?
处理原则�?
1. 不修改业务流�?2. 不修改参数语�?3. 只做模块边界切换

### 4.4 回归测试中暴露的新问�?
第一次跑 film 定向 vitest 时暴�?3 个问题：

1. `filmPromptService.test.ts` 真实发起网络请求
2. `filmService.test.ts` 加载真实 image 历史模块，报 `LocalStorageService` 缺失
3. `filmStoreProjectGraph.test.tsx` 没有拦住真实 audio service，导�?`getAppSdkClientWithSession` 缺失

结论�?
1. 不是 film 生产逻辑回归
2. 根因是测�?mock 路径老化
3. �?mock 对齐真实子路径后，film 测试恢复通过

---

## 5. 实施清单

### 5.1 新增

1. `tests/filmAssetsSubpathBoundary.node.test.mjs`

### 5.2 生产代码修改

1. `packages/sdkwork-magic-studio-film/src/utils/filmModalAssetImport.ts`
2. `packages/sdkwork-magic-studio-film/src/utils/filmHomeAttachment.ts`
3. `packages/sdkwork-magic-studio-film/src/utils/filmAssetUrlResolver.ts`
4. `packages/sdkwork-magic-studio-film/src/pages/FilmHomePage.tsx`
5. `packages/sdkwork-magic-studio-film/src/components/ShotModal.tsx`
6. `packages/sdkwork-magic-studio-film/src/components/CharacterModal.tsx`
7. `packages/sdkwork-magic-studio-film/src/components/PropModal.tsx`
8. `packages/sdkwork-magic-studio-film/src/components/LocationModal.tsx`

### 5.3 测试修改

1. `packages/sdkwork-magic-studio-film/tests/generatedSelectionAssetImport.test.ts`
2. `packages/sdkwork-magic-studio-film/tests/filmPromptService.test.ts`
3. `packages/sdkwork-magic-studio-film/tests/filmStoreProjectGraph.test.tsx`
4. `packages/sdkwork-magic-studio-film/src/services/filmService.test.ts`

---

## 6. 验证结果

### 6.1 film 边界测试

通过�?
1. `node --test tests/filmAssetsSubpathBoundary.node.test.mjs`

### 6.2 film 定向 vitest

执行�?
1. `pnpm vitest run packages/sdkwork-magic-studio-film/tests/generatedSelectionAssetImport.test.ts packages/sdkwork-magic-studio-film/tests/filmPromptService.test.ts packages/sdkwork-magic-studio-film/tests/filmStoreProjectGraph.test.tsx packages/sdkwork-magic-studio-film/src/services/filmService.test.ts`

结果�?
1. `4 passed`
2. `31 passed`

### 6.3 film 全量 vitest

执行�?
1. `pnpm vitest run packages/sdkwork-magic-studio-film/tests/filmAssetFactories.test.ts packages/sdkwork-magic-studio-film/tests/filmAssetIdentity.test.ts packages/sdkwork-magic-studio-film/tests/filmAtomicAssetAdapters.test.ts packages/sdkwork-magic-studio-film/tests/filmHomeAttachment.test.ts packages/sdkwork-magic-studio-film/tests/filmPromptService.test.ts packages/sdkwork-magic-studio-film/tests/filmStoreProjectGraph.test.tsx packages/sdkwork-magic-studio-film/tests/generatedSelectionAssetImport.test.ts packages/sdkwork-magic-studio-film/src/services/filmProjectService.test.ts packages/sdkwork-magic-studio-film/src/services/filmService.test.ts`

结果�?
1. `9 passed`
2. `53 passed`

### 6.4 全量 node tests

执行�?
1. `pnpm run test:node`

结果�?
1. `Discovered 64 node-side test file(s).`
2. `All 64 node-side test file(s) passed.`

### 6.5 构建

执行�?
1. `pnpm run build:test`

结果�?
1. 构建通过
2. `MODULE_TYPELESS_PACKAGE_JSON` warning 仍在
3. 超大 chunk warning 仍在
4. 本轮不处理这两个既有问题

---

## 7. 产物复核

构建后关�?chunk�?
1. `feature-assets-center-C0RrNib6.js` `1377.47 KiB`
2. `feature-assets-generation-DYK4aNvg.js` `593.39 KiB`
3. `feature-film-core-BvRtj0md.js` `327.59 KiB`
4. `feature-notes-DHYQyHwX.js` `318.03 KiB`
5. `feature-drive-DUhPdfC-.js` `152.36 KiB`
6. `feature-portal-video-fYjyTMqR.js` `119.95 KiB`

结论�?
1. `sdkwork-magic-studio-film` 运行�?root import 已清�?2. �?`feature-film-core` �?`feature-assets-center` 暂未出现明显体积下降
3. 这再次说明“导入边界收口”与“立即降 chunk 体积”不是一回事
4. 本轮价值仍然在于去除一个高频误导来源，并把 film 方向的真实依赖面拉清�?
---

## 8. 当前残留问题

排除 notes 后，当前运行�?root import 的高优先级剩余方向：

### 8.1 `sdkwork-magic-studio-canvas`

重点文件�?
1. `packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.ts`
2. `packages/sdkwork-magic-studio-canvas/src/utils/canvasGeneratedOutcomeResource.ts`
3. `packages/sdkwork-magic-studio-canvas/src/services/canvasGenerationService.ts`
4. `packages/sdkwork-magic-studio-canvas/src/services/canvasExportService.ts`
5. `packages/sdkwork-magic-studio-canvas/src/services/canvasActionService.tsx`
6. `packages/sdkwork-magic-studio-canvas/src/components/CanvasNode.tsx`

### 8.2 `sdkwork-magic-studio-drive`

重点文件�?
1. `packages/sdkwork-magic-studio-drive/src/components/FilePreviewModal.tsx`

### 8.3 `sdkwork-magic-studio-magiccut`

状态：

1. 剩余多处资源组件�?domain 类型仍在�?root 获取 `AnyAsset`、`useAssetUrl`、`RegisterExistingAssetInput`
2. 适合作为 `canvas / drive` 之后的下一轮收口目�?
### 8.4 `notes`

状态：

1. 仍有 root import
2. 按用户要求继续排�?
---

## 9. 下一步计�?
Round 11 建议顺序�?
1. 优先处理 `sdkwork-magic-studio-canvas`
2. 然后处理 `sdkwork-magic-studio-drive`
3. 再处�?`sdkwork-magic-studio-magiccut` 剩余资源组件�?domain 类型

原因�?
1. `canvas` 当前是剩�?root-import 运行时文件最多的一�?2. `drive` 是单点，适合快速收�?3. `magiccut` 剩余项更多是类型与资源组件，优先级略低于 `canvas`

继续保持同样闭环�?
1. 失败边界测试
2. 最小实�?3. mock 对齐
4. 定向测试
5. 全量 node tests
6. build:test
7. dist 复核
8. review 文档回写

---

## 10. 本轮交付摘要

Round 10 已完成完整闭环：

1. 新增 film 边界测试并确认红�?2. 收口 `sdkwork-magic-studio-film` 运行�?root import
3. 修复因真实媒体子路径导入导致失效�?film 测试 mock
4. 跑�?film 全量 vitest、全�?node tests 和构�?5. 用构建结果确�?film 已经从“高�?root-import 嫌疑对象”里被清理出�?
这一轮的直接收益不是 chunk 立刻下降，而是继续缩小真正需要怀疑的范围。当前最值得继续打的，已经收敛为 `canvas / drive / magiccut 剩余项`�?