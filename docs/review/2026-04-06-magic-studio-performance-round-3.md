# Magic Studio V2 性能复盘与执行方�?Round 3

日期�?026-04-06
范围：`apps/magic-studio-v2`
排除范围：`packages/sdkwork-magic-studio-notes`

---

## 1. 当前阶段

上一轮已经完成：

1. `feature-magiccut` 拆分�?`engine / shared / panels`
2. `feature-film` 拆分�?`pages / core`
3. `ChooseAssetModal` 改为轻壳 + 懒加载重内容
4. 根应�?`registry / routePreload / bootstrap` 已停止从 `@sdkwork/magic-studio-assets` 根入口直接加�?`AssetsPage / AssetStoreProvider / assets i18n / asset-center bootstrap`
5. `pnpm run test:node` �?`pnpm run build:test` 已通过

当前仍然未闭环的问题�?
1. `feature-assets-center-*.js` 仍维持在�?`2.07 MB`
2. 根因已经不是 `manualChunks` 粗粒度，而是多个业务包仍在静态消�?`@sdkwork/magic-studio-assets` 根入�?3. `sdkwork-magic-studio-image / video / audio / music / sfx / voicespeaker` 仍有大量运行时导入落在根入口

---

## 2. 根因复核

本轮再次确认后的结论�?
1. `packages/sdkwork-magic-studio-assets/src/index.ts` 仍是一个“全�?re-export 聚合入口�?2. 媒体业务包从根入口同时拿 UI、聊天输入、生成历史、资源解析、导入持久化和类型，导致打包器更容易把这些能力揉进共享大�?3. 即使根应用自身已经改成子路径导入，只要高频消费包继续静�?`from '@sdkwork/magic-studio-assets'`，`feature-assets-center` 仍会长期维持过大

因此，本轮不再继续调�?`manualChunks`，而是直接收敛导入边界�?
---

## 3. 本轮执行目标

把媒体能力相关包优先改成通过聚焦子路径消�?`magic-studio-assets`，先覆盖�?
1. `sdkwork-magic-studio-image`
2. `sdkwork-magic-studio-video`
3. `sdkwork-magic-studio-audio`
4. `sdkwork-magic-studio-music`
5. `sdkwork-magic-studio-sfx`
6. `sdkwork-magic-studio-voicespeaker`

不处理：

1. `sdkwork-magic-studio-notes`
2. generated SDK
3. schema / migration / DB 结构

---

## 4. 本轮公开边界设计

### 4.1 `@sdkwork/magic-studio-assets/generation`

输入�?
1. 生成历史页、聊天页、Prompt 输入面板、导入任务映射等业务模块�?import 请求

输出�?
1. `GenerationHistoryListPane`
2. `GenerationChatWindow`
3. `GENERATION_TABS`
4. `PromptTextInput`
5. `createPromptTextInputCapabilityProps`
6. `createImportData`
7. `resolveImportDataKey`
8. `ImportData`
9. `GenerationResultSelection`
10. `GenerationTaskRecord`

用途：

1. 承接所有“生成历�?/ Prompt / 导入任务”相关能�?
### 4.2 `@sdkwork/magic-studio-assets/creation-chat`

输入�?
1. 需要多附件输入、样式选择、聊天输入组件的业务模块

输出�?
1. `CreationChatInput`
2. `StyleSelector`
3. `createInputAttachment`
4. `matchesInputAttachmentKey`
5. `removeInputAttachmentByKey`
6. `resolveInputAttachmentKey`
7. `InputAttachment`
8. `PortalTab`
9. `InputFooterButton`

用途：

1. 承接“创建聊天输入框 / style selector / 附件标识”相关能�?
### 4.3 `@sdkwork/magic-studio-assets/choose-asset`

输入�?
1. 需要资源选择器或资源库弹窗的业务模块

输出�?
1. `ChooseAsset`
2. `ChooseAssetModal`
3. `ChooseAssetModalProps`

用途：

1. 承接“资源选择 UI”能�?
### 4.4 `@sdkwork/magic-studio-assets/hooks`

输入�?
1. 需要资�?URL 解析 Hook 的业务模�?
输出�?
1. `useAssetUrl`
2. `useAssetCenterShortcuts`

用途：

1. 承接资源 URL 和快捷键 Hook，避免从根入口拿 hook

### 4.5 `@sdkwork/magic-studio-assets/entities`

输入�?
1. 需�?`Asset / AnyAsset / AssetType / MediaResourceType` 等实体或类型的业务模�?
输出�?
1. `Asset`
2. `AnyAsset`
3. `AssetType`
4. `AssetCategory`
5. `AssetMetadata`
6. `MediaResourceType`
7. 其余实体层类型重导出

用途：

1. 承接实体和类型边界，避免业务模块从根入口捎带运行时能�?
### 4.6 `@sdkwork/magic-studio-assets/services`

输入�?
1. 需要模型能力探测、资产导入、结果持久化、资�?URL 主资源解析的业务模块

输出�?
1. `fetchCreationModelProviders`
2. `fetchCreationCapabilities`
3. `importAssetBySdk`
4. `importAssetFromUrlBySdk`
5. `persistGenerationOutcomeAsset`
6. `persistGeneratedSelectionAsset`
7. `resolveAssetPrimaryUrlBySdk`
8. `queryAssetsBySdk`
9. 其他现有服务层导�?
用途：

1. 承接生成服务和资产导入持久化服务

### 4.7 `@sdkwork/magic-studio-assets/asset-center`

输入�?
1. 需�?Portal 启动会话、资产定位解析、扩展名识别等业务模�?
输出�?
1. `resolveAssetUrlByAssetIdFirst`
2. `consumePortalLaunchSession`
3. `resolvePortalLaunchAttachmentRef`
4. `toPortalLaunchAttachmentAssetUrlSource`
5. `detectAssetTypeByFilename`
6. `resolveAcceptExtensionsByTypes`
7. `resolveDomainAssetTypes`

用途：

1. 承接资产中心应用层与定位解析能力

---

## 5. 本轮处理文件清单

### 5.1 图片能力

计划迁移�?
1. `sdkwork-magic-studio-image` �?`pages / services / model selector / generator modal / prompt panel / asset chooser`

### 5.2 视频能力

计划迁移�?
1. `sdkwork-magic-studio-video` �?`pages / services / left panel / prompt style / chat input / mode sections`

### 5.3 音频能力

计划迁移�?
1. `sdkwork-magic-studio-audio` �?`pages / services / model selector / left panel / generator modal`

### 5.4 音乐能力

计划迁移�?
1. `sdkwork-magic-studio-music` �?`pages / services / model selector / left panel / generator modal`

### 5.5 音效能力

计划迁移�?
1. `sdkwork-magic-studio-sfx` �?`pages / services / left panel / generator modal`

### 5.6 声音克隆能力

计划迁移�?
1. `sdkwork-magic-studio-voicespeaker` �?`pages / services / model selector / left panel / clone UI / persona UI`

---

## 6. 实施步骤

1. 先写失败测试，锁定“媒体包不得继续�?`@sdkwork/magic-studio-assets` 根入口导入运行时能力�?2. 增加新的聚焦子路�?alias �?public entry
3. 逐文件迁移媒体包 import
4. 跑定�?node tests
5. �?`pnpm run test:node`
6. �?`pnpm run build:test`
7. 记录新的 chunk 结果
8. 回写剩余问题和下一轮计�?
---

## 7. 验收标准

1. 新增边界测试先失败，改造后通过
2. `pnpm run test:node` 通过
3. `pnpm run build:test` 通过
4. 根级 lint 仍只�?`notes` 范围问题
5. `feature-assets-center` 相比上一轮继续下�?6. 若仍未显著下降，下一轮继续处�?`film / character / magiccut / browser / canvas / portal-video`
