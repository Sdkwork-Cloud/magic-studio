# Magic Studio V2 性能复盘与执行方�?Round 9

日期�?026-04-06  
范围：`apps/magic-studio-v2`  
本轮目标：继续清理高频运行时模块�?`@sdkwork/magic-studio-assets` 根入口的消费，缩小真实依赖面，保证前端模块边界和构建分析结果一致�? 
排除范围：`packages/sdkwork-magic-studio-notes`

---

## 1. 当前阶段结论

Round 8 已经证明�?
1. `magiccut` 的运行时 root import 是边界问题，但不是当�?`feature-assets-center` 过大的主因�?2. 下一轮更值得继续推进的是其他高频消费包�?
因此 Round 9 选择进入以下四组模块�?
1. `sdkwork-magic-studio-browser`
2. `sdkwork-magic-studio-prompt`
3. `sdkwork-magic-studio-portal-video`
4. `sdkwork-magic-studio-character`

本轮策略保持不变�?
1. 先写失败�?node 边界测试，锁死运行时文件不得继续 `from '@sdkwork/magic-studio-assets'`
2. 再做最小导入切�?3. 如果测试失败，先分析 mock 或模块边界的真实根因，再修复
4. 最后跑定向测试、全�?node tests、构建，并复核产�?
---

## 2. 问题列表

### P1. 高频运行时模块继续消�?`@sdkwork/magic-studio-assets` 根入�?
影响�?
1. `feature-assets-center` 的真实消费来源继续被 root facade 掩盖
2. 运行时代码和测试 mock 的导入边界不一�?3. 后续继续�?chunk 归因分析时，无法判断具体能力来自 `services / generation / asset-center / creation-chat / choose-asset`

根因�?
1. `browserDownloadService.ts` 仍从 root �?`assetBusinessService`、`ASSET_CATEGORIES`
2. `PromptOptimizerPage.tsx` 仍从 root �?`StyleSelector`
3. `portal-video` 页面与工具文件同时从 root 混用 chat input、portal session、asset resolver、capability service
4. `character` 页面、chat 页、导入映射和左侧生成面板都仍直接�?root facade

### P2. 测试 mock 仍然拦截�?root 入口，和生产代码导入路径脱节

影响�?
1. 生产代码改成子路径后，旧 mock 会失�?2. 测试可能意外加载真实模块
3. 测试失败不再反映业务问题，而是反映 mock 边界陈旧

本轮实际暴露的真实案例：

1. `characterLeftGeneratorPanel.test.tsx` 继续 mock `@sdkwork/magic-studio-image` �?`@sdkwork/magic-studio-voicespeaker` 根入�?2. 生产代码实际使用的是 `@sdkwork/magic-studio-image/modals`、`@sdkwork/magic-studio-image/constants`、`@sdkwork/magic-studio-image/selectors`、`@sdkwork/magic-studio-image/services` 以及 `@sdkwork/magic-studio-voicespeaker/picker`、`@sdkwork/magic-studio-voicespeaker/constants`
3. 导致 vitest 回落到真�?`magic-studio-image` 服务模块，并触发 `@sdkwork/magic-studio-core` mock 缺少 `LocalStorageService` 的报�?
---

## 3. 本轮处理输入与输�?
### 3.1 `browserDownloadService.ts`

输入�?
1. `assetBusinessService`
2. `ASSET_CATEGORIES`
3. 来源：`@sdkwork/magic-studio-assets`

输出�?
1. `assetBusinessService`
2. `ASSET_CATEGORIES`
3. 来源改为：`@sdkwork/magic-studio-assets/services`

### 3.2 `PromptOptimizerPage.tsx`

输入�?
1. `StyleSelector`
2. 来源：`@sdkwork/magic-studio-assets`

输出�?
1. `StyleSelector`
2. 来源改为：`@sdkwork/magic-studio-assets/creation-chat`

### 3.3 `PortalPage.tsx`

输入�?
1. `CreationChatInput`
2. `InputFooterButton`
3. `StyleSelector`
4. `ChooseAssetModal`
5. `clearPortalLaunchSession`
6. `removeInputAttachmentByKey`
7. `savePortalLaunchSession`
8. `fetchCreationCapabilities`
9. `toCreationModelProviders`
10. `resolveCreationStyleOptions`
11. `resolveCreationEntryCapabilityOptions`
12. `PortalTab`
13. 来源统一为：`@sdkwork/magic-studio-assets`

输出�?
1. `CreationChatInput` / `InputFooterButton` / `StyleSelector` / `removeInputAttachmentByKey` / `PortalTab`
2. 来源改为：`@sdkwork/magic-studio-assets/creation-chat`
3. `ChooseAssetModal`
4. 来源改为：`@sdkwork/magic-studio-assets/choose-asset`
5. `clearPortalLaunchSession` / `savePortalLaunchSession`
6. 来源改为：`@sdkwork/magic-studio-assets/asset-center`
7. `fetchCreationCapabilities` / `toCreationModelProviders` / `resolveCreationStyleOptions` / `resolveCreationEntryCapabilityOptions`
8. 来源改为：`@sdkwork/magic-studio-assets/services`

### 3.4 `portalAttachmentImport.ts`

输入�?
1. `createInputAttachment`
2. `InputAttachment`
3. `PortalTab`
4. `importAssetBySdk`
5. `resolveAssetPrimaryUrlBySdk`
6. `resolveAssetUrlByAssetIdFirst`
7. 来源统一为：`@sdkwork/magic-studio-assets`

输出�?
1. `createInputAttachment` / `InputAttachment` / `PortalTab`
2. 来源改为：`@sdkwork/magic-studio-assets/creation-chat`
3. `importAssetBySdk` / `resolveAssetPrimaryUrlBySdk`
4. 来源改为：`@sdkwork/magic-studio-assets/services`
5. `resolveAssetUrlByAssetIdFirst`
6. 来源改为：`@sdkwork/magic-studio-assets/asset-center`

### 3.5 `portalGenerationSelection.ts`

输入�?
1. `PortalTab`
2. 来源：`@sdkwork/magic-studio-assets`

输出�?
1. `PortalTab`
2. 来源改为：`@sdkwork/magic-studio-assets/creation-chat`

### 3.6 `StickyHeroBar.tsx`

输入�?
1. `PortalTab`
2. 来源：`@sdkwork/magic-studio-assets`

输出�?
1. `PortalTab`
2. �?type import 形式改为：`@sdkwork/magic-studio-assets/creation-chat`

### 3.7 `CharacterPage.tsx`

输入�?
1. `ImportData`
2. `GenerationHistoryListPane`
3. `GENERATION_TABS`
4. `consumePortalLaunchSession`
5. `resolvePortalLaunchAttachmentRef`
6. `toPortalLaunchAttachmentAssetUrlSource`
7. `resolveAssetUrlByAssetIdFirst`
8. `PortalLaunchAttachmentRef`
9. 来源统一为：`@sdkwork/magic-studio-assets`

输出�?
1. `ImportData` / `GenerationHistoryListPane` / `GENERATION_TABS`
2. 来源改为：`@sdkwork/magic-studio-assets/generation`
3. `consumePortalLaunchSession` / `resolvePortalLaunchAttachmentRef` / `toPortalLaunchAttachmentAssetUrlSource` / `resolveAssetUrlByAssetIdFirst` / `PortalLaunchAttachmentRef`
4. 来源改为：`@sdkwork/magic-studio-assets/asset-center`

### 3.8 `CharacterChatPage.tsx`

输入�?
1. `GenerationChatWindow`
2. `importAssetBySdk`
3. 来源统一为：`@sdkwork/magic-studio-assets`

输出�?
1. `GenerationChatWindow`
2. 来源改为：`@sdkwork/magic-studio-assets/generation`
3. `importAssetBySdk`
4. 来源改为：`@sdkwork/magic-studio-assets/services`

### 3.9 `importCharacterTask.ts`

输入�?
1. `resolveImportDataKey`
2. `ImportData`
3. 来源：`@sdkwork/magic-studio-assets`

输出�?
1. `resolveImportDataKey`
2. `ImportData`
3. 来源改为：`@sdkwork/magic-studio-assets/generation`

### 3.10 `CharacterLeftGeneratorPanel.tsx`

输入�?
1. `ChooseAsset`
2. `PromptTextInput`
3. `createPromptTextInputCapabilityProps`
4. `Asset`
5. `fetchCreationModelProviders`
6. 来源统一为：`@sdkwork/magic-studio-assets`

输出�?
1. `ChooseAsset`
2. 来源改为：`@sdkwork/magic-studio-assets/choose-asset`
3. `PromptTextInput` / `createPromptTextInputCapabilityProps`
4. 来源改为：`@sdkwork/magic-studio-assets/generation`
5. `Asset`
6. 来源改为：`@sdkwork/magic-studio-assets/entities`
7. `fetchCreationModelProviders`
8. 来源改为：`@sdkwork/magic-studio-assets/services`

### 3.11 测试对齐

处理文件�?
1. `packages/sdkwork-magic-studio-character/tests/characterLeftGeneratorPanel.test.tsx`
2. `packages/sdkwork-magic-studio-character/src/pages/CharacterChatPage.test.tsx`
3. `packages/sdkwork-magic-studio-character/src/pages/CharacterPage.test.tsx`
4. `packages/sdkwork-magic-studio-character/src/pages/importCharacterTask.test.ts`
5. `packages/sdkwork-magic-studio-portal-video/tests/portalAttachmentImport.test.ts`

输入�?
1. �?root mock
2. �?root import
3. �?`magic-studio-image` / `magic-studio-voicespeaker` 根入�?mock

输出�?
1. 改为真实子路�?mock
2. `importCharacterTask.test.ts` 改为�?`@sdkwork/magic-studio-assets/generation` 导入 `createImportData`
3. `characterLeftGeneratorPanel.test.tsx` 改为 mock�?   - `@sdkwork/magic-studio-assets/choose-asset`
   - `@sdkwork/magic-studio-assets/generation`
   - `@sdkwork/magic-studio-assets/services`
   - `@sdkwork/magic-studio-image/modals`
   - `@sdkwork/magic-studio-image/constants`
   - `@sdkwork/magic-studio-image/selectors`
   - `@sdkwork/magic-studio-image/services`
   - `@sdkwork/magic-studio-voicespeaker/picker`
   - `@sdkwork/magic-studio-voicespeaker/constants`

---

## 4. 红灯 -> 绿灯闭环

### 4.1 新增失败测试

新增�?
1. `tests/assetsConsumerSubpathBoundary.node.test.mjs`

约束�?
1. `browser / prompt / portal-video / character` 这批运行时文件不得继续从 `@sdkwork/magic-studio-assets` 根入口导�?2. 每个文件必须至少命中预期 focused subpath

### 4.2 红灯验证

执行�?
1. `node --test tests/assetsConsumerSubpathBoundary.node.test.mjs`

结果�?
1. 失败
2. 第一处失败文件为 `packages/sdkwork-magic-studio-browser/src/services/browserDownloadService.ts`
3. 说明测试真实锁到了当前问题，而不是假�?
### 4.3 最小实�?
改动原则�?
1. 不改业务流程
2. 不改参数语义
3. 只收导入边界

### 4.4 测试回归时暴露的新问�?
第一次运行定�?vitest 时失败：

1. `characterLeftGeneratorPanel.test.tsx` 加载到了真实 `magic-studio-image` 服务模块
2. 原因不是功能回归，而是测试 mock 的模块路径过�?3. 真实根因：生产代码已经走 `magic-studio-image/*` �?`magic-studio-voicespeaker/*` 子路径，但测试还�?mock 根入�?
处理�?
1. 按真实生产导入路径修�?mock
2. 重新运行定向 vitest
3. 所有受影响测试恢复通过

---

## 5. 实施清单

### 5.1 生产代码

修改�?
1. `packages/sdkwork-magic-studio-browser/src/services/browserDownloadService.ts`
2. `packages/sdkwork-magic-studio-prompt/src/pages/PromptOptimizerPage.tsx`
3. `packages/sdkwork-magic-studio-portal-video/src/pages/PortalPage.tsx`
4. `packages/sdkwork-magic-studio-portal-video/src/utils/portalAttachmentImport.ts`
5. `packages/sdkwork-magic-studio-portal-video/src/utils/portalGenerationSelection.ts`
6. `packages/sdkwork-magic-studio-portal-video/src/components/StickyHeroBar.tsx`
7. `packages/sdkwork-magic-studio-character/src/pages/CharacterPage.tsx`
8. `packages/sdkwork-magic-studio-character/src/pages/CharacterChatPage.tsx`
9. `packages/sdkwork-magic-studio-character/src/pages/importCharacterTask.ts`
10. `packages/sdkwork-magic-studio-character/src/components/CharacterLeftGeneratorPanel.tsx`

### 5.2 测试与边界保�?
新增�?
1. `tests/assetsConsumerSubpathBoundary.node.test.mjs`

修改�?
1. `packages/sdkwork-magic-studio-character/tests/characterLeftGeneratorPanel.test.tsx`
2. `packages/sdkwork-magic-studio-character/src/pages/CharacterChatPage.test.tsx`
3. `packages/sdkwork-magic-studio-character/src/pages/CharacterPage.test.tsx`
4. `packages/sdkwork-magic-studio-character/src/pages/importCharacterTask.test.ts`
5. `packages/sdkwork-magic-studio-portal-video/tests/portalAttachmentImport.test.ts`

---

## 6. 验证结果

### 6.1 Round 9 边界测试

通过�?
1. `node --test tests/assetsConsumerSubpathBoundary.node.test.mjs`

### 6.2 定向 vitest

执行�?
1. `pnpm vitest run packages/sdkwork-magic-studio-character/tests/characterLeftGeneratorPanel.test.tsx packages/sdkwork-magic-studio-character/src/pages/CharacterChatPage.test.tsx packages/sdkwork-magic-studio-character/src/pages/CharacterPage.test.tsx packages/sdkwork-magic-studio-character/src/pages/importCharacterTask.test.ts packages/sdkwork-magic-studio-portal-video/tests/portalAttachmentImport.test.ts`

结果�?
1. `5 passed`
2. `8 passed`

### 6.3 全量 node tests

执行�?
1. `pnpm run test:node`

结果�?
1. `Discovered 63 node-side test file(s).`
2. `All 63 node-side test file(s) passed.`

### 6.4 构建

执行�?
1. `pnpm run build:test`

结果�?
1. 构建通过
2. 仍存�?`MODULE_TYPELESS_PACKAGE_JSON` warning
3. 仍存在超�?chunk warning
4. 本轮不处理这两个既有问题

---

## 7. 构建产物复核

使用 `Get-ChildItem dist/assets | Sort-Object Length -Descending` 复核后的关键体积�?
1. `feature-assets-center-C0RrNib6.js` `1377.47 KiB`
2. `feature-assets-generation-DYK4aNvg.js` `593.39 KiB`
3. `feature-film-core-BvRtj0md.js` `327.59 KiB`
4. `feature-notes-DHYQyHwX.js` `318.03 KiB`
5. `feature-magiccut-shared-t2nPsa7C.js` `265.50 KiB`
6. `feature-drive-DUhPdfC-.js` `152.36 KiB`
7. `feature-portal-video-fYjyTMqR.js` `119.95 KiB`
8. `feature-magiccut-panels-O6bvqlsi.js` `112.37 KiB`
9. `feature-image-DTF887ei.js` `53.86 KiB`

结论�?
1. Round 9 再次验证�?focused subpath 收口对边界清理是有效�?2. �?`feature-assets-center` 体积仍未出现实质性下�?3. 说明这批 `browser / prompt / portal-video / character` 不是当前超大 chunk 的主消费来源
4. 不过这轮把这批模块的真实依赖面拉清楚了，后续继续定位剩余大块会更准确

---

## 8. 当前残留问题

排除 `notes` 后，仍然可见的重点运行时 root import 包有�?
### 8.1 `sdkwork-magic-studio-film`

重点文件�?
1. `packages/sdkwork-magic-studio-film/src/utils/filmModalAssetImport.ts`
2. `packages/sdkwork-magic-studio-film/src/utils/filmHomeAttachment.ts`
3. `packages/sdkwork-magic-studio-film/src/utils/filmAssetUrlResolver.ts`
4. `packages/sdkwork-magic-studio-film/src/pages/FilmHomePage.tsx`
5. `packages/sdkwork-magic-studio-film/src/components/ShotModal.tsx`
6. `packages/sdkwork-magic-studio-film/src/components/CharacterModal.tsx`
7. `packages/sdkwork-magic-studio-film/src/components/PropModal.tsx`
8. `packages/sdkwork-magic-studio-film/src/components/LocationModal.tsx`

### 8.2 `sdkwork-magic-studio-canvas`

重点文件�?
1. `packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.ts`
2. `packages/sdkwork-magic-studio-canvas/src/services/canvasGenerationService.ts`
3. `packages/sdkwork-magic-studio-canvas/src/services/canvasExportService.ts`
4. `packages/sdkwork-magic-studio-canvas/src/services/canvasActionService.tsx`
5. `packages/sdkwork-magic-studio-canvas/src/components/CanvasNode.tsx`

### 8.3 `sdkwork-magic-studio-drive`

重点文件�?
1. `packages/sdkwork-magic-studio-drive/src/components/FilePreviewModal.tsx`

### 8.4 `sdkwork-magic-studio-magiccut`

状态：

1. Round 8 只覆盖了更关键的一�?runtime 文件
2. 仍存在若干资源面板和列表组件继续�?root 取实体类型或 `useAssetUrl`
3. 这些可以�?`film / canvas / drive` 之后继续收口

### 8.5 `notes`

状态：

1. `notes` 方向残留仍在
2. 按用户要求，继续排除，不进入本应用本轮改�?
---

## 9. 下一步计�?
Round 10 建议按以下顺序推进：

1. 优先处理 `sdkwork-magic-studio-film`
2. 第二优先级处�?`sdkwork-magic-studio-canvas`
3. 然后处理 `sdkwork-magic-studio-drive`
4. 最后回�?`sdkwork-magic-studio-magiccut` 剩余资源组件

原因�?
1. `film` 同时更接�?`feature-film-core` �?`feature-assets-center` 两个高体积块
2. `canvas` 仍有多处运行�?root import，属于第二梯�?3. `drive` 只有单点文件，可以穿插清�?
Round 10 继续沿用同一闭环�?
1. 先写失败边界测试
2. 再做最小导入切�?3. 同步修正测试 mock
4. 跑定向测�?5. �?`pnpm run test:node`
6. �?`pnpm run build:test`
7. 复核 `dist/assets`
8. 回写 `docs/review`

---

## 10. 本轮交付摘要

Round 9 已经完成一个完整闭环：

1. 写了新的运行时边界测试并确认红灯
2. 清理�?`browser / prompt / portal-video / character` 这批模块�?root import
3. 修正了被真实子路径导入打破的测试 mock
4. 重新跑通定�?vitest、全�?node tests 和构�?5. 用产物体积确认了这轮的真实收益和残留问题

这轮的核心价值不是直接把 `feature-assets-center` 压下去，而是继续把“谁在真正消费它”这个问题收窄。当前大块仍在，但无效怀疑对象又少了一批，下一轮可以更直接�?`film / canvas / drive` 这些更重的消费者�?