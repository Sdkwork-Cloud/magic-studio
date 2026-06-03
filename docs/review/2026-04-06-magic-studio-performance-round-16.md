# Magic Studio V2 性能复盘与执行方�?Round 16

日期�?026-04-06  
范围：`apps/magic-studio-v2`  
本轮目标：继续收�?`sdkwork-magic-studio-assets` 热路径对 `@sdkwork/magic-studio-core` 根入口的依赖，推�?`feature-assets-center` 从“共享杂糅业务块”回到“资产中心特征块”，并补�?review / 测试 / 构建闭环�? 
排除范围：`packages/sdkwork-magic-studio-notes`

---

## 1. 当前阶段结论

上一轮已经完成两件事�?1. `vite manualChunks` 已能识别外部 app sdk / sdk-common 源码路径�?2. `magic-studio-core` 已暴�?`router / platform / services / sdk` 子路径别名与路径映射�?
但构建结果显示：
1. `feature-assets-center` 仍约 `1237 kB`，没有实质下降�?2. 没有生成 `shared-magic-studio-core-*`、`shared-app-sdk-*`、`shared-sdk-common-*`�?3. `PromptOptimizerPage`、`AuthOAuthCallbackPage`、`feature-drive` 仍然�?`feature-assets-center` 拉取大量共享符号�?
当前根因已经确认�?1. `sdkwork-magic-studio-assets` 的高热路径文件仍�?`@sdkwork/magic-studio-core` 根入口导入运行时能力�?2. 即使�?manual chunk 规则，运行时依赖图仍会把大块重新挂回 `feature-assets-center`�?
---

## 2. 问题列表

### P1. 资产中心热路径仍依赖 `@sdkwork/magic-studio-core` 根入�?
影响�?1. `feature-assets-center` 持续吸附 `sdk / platform / services` 的大范围导出�?2. prompt、asset picker、cover generation、asset infrastructure 无法�?Vite 正确切到更细粒度共享块�?3. manual chunk 规则只能“命名”，不能改变错误的运行时依赖边界�?
根因�?1. `generatedSelectionAssetPersistence.ts` 仍从根入口取 `inlineDataService`
2. `generatedOutcomeAssetPersistence.ts` 仍从根入口取 `inlineDataService` �?`resolveGenerationOutcomePrimaryUrl`
3. `coverGenerationService.ts` 仍从根入口取 `getAppSdkClientWithSession`
4. `assetService.ts` 仍从根入口取 `platform` �?`mediaAnalysisService`
5. `PromptTextInput.tsx` 仍从根入口混合取 `platform + prompt sdk types/service`
6. `PromptPickerDialog.tsx` / `PromptHistoryDialog.tsx` / `promptCapabilityProps.ts` 仍从根入口取 prompt sdk 类型与服�?7. `ChooseAsset.tsx` 仍从根入口取 `uploadHelper`
8. `ChooseAssetModalContent.tsx` / `DefaultAssetUrlResolver.ts` 仍从根入口取 `platform`
9. `CoreMediaAnalysisAdapter.ts` 仍从根入口取 `mediaAnalysisService`

### P2. 测试 mock 仍绑定根入口

影响�?1. 源码改到子路径后，既�?vitest 会因�?mock 路径不匹配而误报�?2. 无法形成稳定的红�?-> 绿灯闭环�?
根因�?1. `generatedSelectionAssetPersistence.test.ts`
2. `generatedOutcomeAssetPersistence.test.ts`
3. `coverGenerationService.test.ts`
4. `assetServiceMagicStudioRoot.test.ts`
5. `assetServiceIdentity.test.ts`
6. `chooseAssetIdentity.test.tsx`

---

## 3. 本轮处理对象输入与输�?
### 3.1 `tests/reactCoreFocusedSubpathBoundary.node.test.mjs`

输入�?1. `packages/sdkwork-magic-studio-assets/src/services/generatedSelectionAssetPersistence.ts`
2. `packages/sdkwork-magic-studio-assets/src/services/generatedOutcomeAssetPersistence.ts`
3. `packages/sdkwork-magic-studio-assets/src/services/coverGenerationService.ts`
4. `packages/sdkwork-magic-studio-assets/src/services/assetService.ts`
5. `packages/sdkwork-magic-studio-assets/src/components/generate/PromptTextInput.tsx`
6. `packages/sdkwork-magic-studio-assets/src/components/generate/PromptPickerDialog.tsx`
7. `packages/sdkwork-magic-studio-assets/src/components/generate/PromptHistoryDialog.tsx`
8. `packages/sdkwork-magic-studio-assets/src/components/generate/promptCapabilityProps.ts`
9. `packages/sdkwork-magic-studio-assets/src/components/ChooseAsset.tsx`
10. `packages/sdkwork-magic-studio-assets/src/components/ChooseAssetModalContent.tsx`
11. `packages/sdkwork-magic-studio-assets/src/asset-center/infrastructure/DefaultAssetUrlResolver.ts`
12. `packages/sdkwork-magic-studio-assets/src/asset-center/infrastructure/CoreMediaAnalysisAdapter.ts`

输出�?1. 所有目标文件停止从 `@sdkwork/magic-studio-core` 根入口导入运行时能力�?2. 每个文件改为仅导入实际需要的子路径：
   - `@sdkwork/magic-studio-core/services`
   - `@sdkwork/magic-studio-core/platform`
   - `@sdkwork/magic-studio-core/sdk`

### 3.2 `generatedSelectionAssetPersistence.ts`

输入�?1. `sourceUrl`
2. `selection`
3. `type`
4. `domain`
5. `name`

输出�?1. 已有 canonical `assetId` 时直接复用并解析最�?URL�?2. �?canonical `assetId` 时通过 `inlineDataService` 判断是否内联数据，再�?sdk 导入�?3. 仅从 `@sdkwork/magic-studio-core/services` 导入 `inlineDataService`�?
改动性质：修�?
### 3.3 `generatedOutcomeAssetPersistence.ts`

输入�?1. `outcome`
2. `type`
3. `domain`
4. `name`

输出�?1. 解析 generation delivery url�?2. �?canonical `assetId` 时走 sdk 导入�?3. 仅从 `@sdkwork/magic-studio-core/services` 导入 `inlineDataService` �?`resolveGenerationOutcomePrimaryUrl`�?
改动性质：修�?
### 3.4 `coverGenerationService.ts`

输入�?1. `generateAssetCoverImage({ prompt, negativePrompt, aspectRatio, model })`
2. `suggestAssetCoverPrompts({ context, count, styleHints, language })`

输出�?1. 生成封面图后持久化到 asset-center�?2. 通过 `client.generation.getCoverPromptSuggestions` 获取提示词建议�?3. 仅从 `@sdkwork/magic-studio-core/sdk` 导入 `getAppSdkClientWithSession`�?
改动性质：修�?
### 3.5 `assetService.ts`

输入�?1. 资产导入、解析、索引、删除流�?2. `platform`
3. `mediaAnalysisService`

输出�?1. 仅从 `@sdkwork/magic-studio-core/platform` 导入 `platform`
2. 仅从 `@sdkwork/magic-studio-core/services` 导入 `mediaAnalysisService`
3. 保持资产中心、缩略图、MagicStudio root 行为不变

改动性质：修�?
### 3.6 `PromptTextInput.tsx`

输入�?1. `PromptTextInputProps`
2. prompt 历史 / prompt �?/ copy / enhance / asset mention

输出�?1. `platform` �?`@sdkwork/magic-studio-core/platform`
2. `promptLibraryService` �?prompt 类型�?`@sdkwork/magic-studio-core/sdk`

改动性质：修�?
### 3.7 `PromptPickerDialog.tsx`

输入�?1. prompt 查询参数
2. prompt 选择回调

输出�?1. `promptLibraryService` 与相关类型全部来�?`@sdkwork/magic-studio-core/sdk`

改动性质：修�?
### 3.8 `PromptHistoryDialog.tsx`

输入�?1. 历史查询条件
2. 历史选择回调

输出�?1. `promptLibraryService` 与相关类型全部来�?`@sdkwork/magic-studio-core/sdk`

改动性质：修�?
### 3.9 `promptCapabilityProps.ts`

输入�?1. `promptBizType`
2. capability override

输出�?1. prompt 类型定义仅从 `@sdkwork/magic-studio-core/sdk` 导入

改动性质：修�?
### 3.10 `ChooseAsset.tsx`

输入�?1. 资产选择�?props
2. 本地上传动作

输出�?1. `uploadHelper` 仅从 `@sdkwork/magic-studio-core/services`

改动性质：修�?
### 3.11 `ChooseAssetModalContent.tsx`

输入�?1. 资产选择弹窗 UI
2. 删除确认流程

输出�?1. `platform` 仅从 `@sdkwork/magic-studio-core/platform`

改动性质：修�?
### 3.12 `DefaultAssetUrlResolver.ts`

输入�?1. `AssetLocator`
2. `AssetVfsPort`

输出�?1. `platform` 仅从 `@sdkwork/magic-studio-core/platform`

改动性质：修�?
### 3.13 `CoreMediaAnalysisAdapter.ts`

输入�?1. `url`
2. `type`

输出�?1. `mediaAnalysisService` 仅从 `@sdkwork/magic-studio-core/services`

改动性质：修�?
### 3.14 相关测试 mock

输入�?1. 现有 root-entry mock

输出�?1. �?mock 迁移�?`@sdkwork/magic-studio-core/services`
2. �?mock 迁移�?`@sdkwork/magic-studio-core/platform`
3. �?mock 迁移�?`@sdkwork/magic-studio-core/sdk`

改动性质：修�?
---

## 4. 执行方案

1. 先用现有 node 边界测试重现红灯，确认失败点仍然�?`generatedSelectionAssetPersistence.ts` 起步�?2. 逐个修复 12 个热点文件的根入口导入，不引入任何新的兼容层或回退逻辑�?3. 同步改造直接受影响�?vitest mock 路径�?4. 先跑边界测试，再跑聚�?vitest，再跑构建�?5. 二次验尸构建产物，确�?`feature-assets-center` 是否继续收敛，以及是否开始产出新的共享块�?
---

## 5. 验证矩阵

红灯�?1. `node --test tests/reactCoreFocusedSubpathBoundary.node.test.mjs`

聚焦回归�?1. `pnpm vitest run packages/sdkwork-magic-studio-assets/tests/generatedSelectionAssetPersistence.test.ts packages/sdkwork-magic-studio-assets/tests/generatedOutcomeAssetPersistence.test.ts packages/sdkwork-magic-studio-assets/tests/coverGenerationService.test.ts packages/sdkwork-magic-studio-assets/tests/assetServiceMagicStudioRoot.test.ts packages/sdkwork-magic-studio-assets/tests/assetServiceIdentity.test.ts packages/sdkwork-magic-studio-assets/tests/chooseAssetIdentity.test.tsx packages/sdkwork-magic-studio-assets/tests/promptCapabilityProps.test.ts`

已有关键回归�?1. `node --test tests/viteManualChunks.node.test.mjs`
2. `node --test tests/assetsFocusedSdkClientBoundary.node.test.mjs`
3. `pnpm vitest run packages/sdkwork-magic-studio-assets/tests/assetSdkQueryService.test.ts packages/sdkwork-magic-studio-assets/tests/creationCapabilityService.test.ts packages/sdkwork-magic-studio-assets/tests/remoteAssetIndexRepository.test.ts packages/sdkwork-magic-studio-prompt/src/services/promptBusinessService.test.ts packages/sdkwork-magic-studio-core/src/sdk/__tests__/uploadViaPresignedUrl.test.ts`

构建与产物复核：
1. `pnpm run build:test`
2. `Get-ChildItem dist/assets | Sort-Object Length -Descending | Select-Object -First 20 Name,@{Name='KB';Expression={[math]::Round($_.Length/1kb,2)}}`
3. `Get-ChildItem dist/assets/shared-magic-studio-core-*.js,dist/assets/shared-app-sdk-*.js,dist/assets/shared-sdk-common-*.js -ErrorAction SilentlyContinue | Select-Object Name,Length`

---

## 6. 预期结果

1. `tests/reactCoreFocusedSubpathBoundary.node.test.mjs` 由红转绿�?2. `sdkwork-magic-studio-assets` �?12 个热点文件不再依�?`@sdkwork/magic-studio-core` 根入口�?3. prompt / asset / media analysis / upload / sdk client 依赖图开始向子路径收敛�?4. 构建仍通过，并为下一�?chunk 收缩提供真实依赖边界�?
---

## 7. 下一步计�?
1. 若本轮后 `feature-assets-center` 仍过大，继续分析它和 `PromptOptimizerPage` / `feature-drive` 的共享导入热点�?2. 优先改运行时热点，不继续做“只有命名变化没有依赖收敛”的假拆包�?3. 每轮都继续写�?`docs/review`，并保持红灯 -> 绿灯 -> 构建 -> 验尸闭环�?