# Magic Studio V2 性能复盘与执行方�?Round 11

日期�?026-04-06  
范围：`apps/magic-studio-v2`  
本轮目标：继续清�?`sdkwork-magic-studio-canvas` 运行时模块对 `@sdkwork/magic-studio-assets` 根入口的直接消费，并修复因此暴露的测�?mock 漂移问题�? 
排除范围：`packages/sdkwork-magic-studio-notes`

---

## 1. 当前阶段结论

Round 9 �?Round 10 完成后，`sdkwork-magic-studio-canvas` 是剩余高频运行时 broad root import 的最高优先级模块。本轮按同样的闭环继续推进：

1. 先新增失败的 node 边界测试，锁�?`canvas` 运行时文件不允许继续 `from '@sdkwork/magic-studio-assets'`
2. 再做最小导入切换，不改业务逻辑、不改参数语�?3. 如果回归测试失败，优先检查测�?mock 是否仍指向旧根入�?4. �?`canvas` 定向 vitest、`canvas` 包级 vitest、全�?node tests 和构�?5. �?`rg` �?`dist/assets` 复核当前剩余 root import 面与产物体积

本轮结论�?
1. `sdkwork-magic-studio-canvas` �?6 个运行时文件已经全部�?`@sdkwork/magic-studio-assets` 根入口切换到 focused subpath
2. `canvas` 方向�?3 处旧测试 mock 已对齐到真实�?`services` 子路�?3. 全量 node tests 与构建均通过，说明这轮边界收口没有破坏应用构建链�?4. `feature-assets-center` 仍然维持�?`1377.47 KB`，说明“导入边界收口”仍主要用于缩小可疑面，而不是直接等价于 chunk 体积立刻下降
5. 排除 `notes` 后，当前高优先级剩余 broad root import 运行时代码已进一步收敛为 `drive` �?`magiccut`

---

## 2. 问题列表

### P1. `sdkwork-magic-studio-canvas` 运行时文件仍直接消费 `@sdkwork/magic-studio-assets` 根入�?
影响�?
1. `canvas` 的真实依赖面继续�?broad root facade 混合掩盖
2. `feature-assets-center` 的可疑来源无法进一步缩�?3. `CanvasNode` 等热路径组件仍会把资源服务、聊天输入、实体类型从同一个宽入口静态拉进来

根因�?
1. `canvasReferenceImageImport.ts` 从根入口获取 `importAssetBySdk` �?`resolveAssetPrimaryUrlBySdk`
2. `canvasGeneratedOutcomeResource.ts` 从根入口获取 `PersistedGenerationOutcomeAsset`
3. `canvasGenerationService.ts` 从根入口获取 `persistGenerationOutcomeAsset`
4. `canvasExportService.ts` �?`canvasActionService.tsx` 从根入口获取 `assetService`
5. `CanvasNode.tsx` 同时从根入口混用 `services / creation-chat / entities`

### P2. `canvas` 测试�?mock 旧根入口，和生产导入路径不一�?
影响�?
1. `canvasGenerationService.test.ts` 没有拦住真实 `imageService.generateImage`
2. `canvasGenerationService.test.ts` 没有拦住真实 `videoService.generateVideo`
3. 边界切换后会产生“假回归”，掩盖真正的生产逻辑状�?
根因�?
1. `canvasReferenceImageImport.test.ts` �?mock `@sdkwork/magic-studio-assets`
2. `canvasActionService.test.ts` �?mock `@sdkwork/magic-studio-assets`
3. `canvasGenerationService.test.ts` �?mock�?   - `@sdkwork/magic-studio-assets`
   - `@sdkwork/magic-studio-image`
   - `@sdkwork/magic-studio-video`

### P3. `feature-assets-center` 仍明显偏�?
当前状态：

1. `feature-assets-center-C0RrNib6.js` 仍为 `1377.47 KB`
2. `feature-assets-generation-DYK4aNvg.js` 仍为 `593.39 KB`

结论�?
1. 这不是本轮回归，而是当前阶段尚未完成 `drive / magiccut` 剩余清理
2. `canvas` 清理后的价值在于继续缩小真实可疑面

---

## 3. 本轮处理输入与输�?
### 3.1 `canvasReferenceImageImport.ts`

输入�?
1. `importAssetBySdk`
2. `resolveAssetPrimaryUrlBySdk`
3. 来源：`@sdkwork/magic-studio-assets`

输出�?
1. `importAssetBySdk`
2. `resolveAssetPrimaryUrlBySdk`
3. 来源改为：`@sdkwork/magic-studio-assets/services`

### 3.2 `canvasGeneratedOutcomeResource.ts`

输入�?
1. `PersistedGenerationOutcomeAsset`
2. 来源：`@sdkwork/magic-studio-assets`

输出�?
1. `PersistedGenerationOutcomeAsset`
2. 来源改为：`@sdkwork/magic-studio-assets/services`

### 3.3 `canvasGenerationService.ts`

输入�?
1. `persistGenerationOutcomeAsset`
2. 来源：`@sdkwork/magic-studio-assets`

输出�?
1. `persistGenerationOutcomeAsset`
2. 来源改为：`@sdkwork/magic-studio-assets/services`

### 3.4 `canvasExportService.ts`

输入�?
1. `assetService`
2. 来源：`@sdkwork/magic-studio-assets`

输出�?
1. `assetService`
2. 来源改为：`@sdkwork/magic-studio-assets/services`

### 3.5 `canvasActionService.tsx`

输入�?
1. `assetService`
2. 来源：`@sdkwork/magic-studio-assets`

输出�?
1. `assetService`
2. 来源改为：`@sdkwork/magic-studio-assets/services`

### 3.6 `CanvasNode.tsx`

输入�?
1. `assetService`
2. `importAssetBySdk`
3. `resolveAssetPrimaryUrlBySdk`
4. `CreationChatInput`
5. `createInputAttachment`
6. `InputFooterButton`
7. `InputAttachment`
8. `Asset`
9. 来源统一为：`@sdkwork/magic-studio-assets`

输出�?
1. `assetService`
2. `importAssetBySdk`
3. `resolveAssetPrimaryUrlBySdk`
4. 来源改为：`@sdkwork/magic-studio-assets/services`
5. `CreationChatInput`
6. `createInputAttachment`
7. `InputFooterButton`
8. `InputAttachment`
9. 来源改为：`@sdkwork/magic-studio-assets/creation-chat`
10. `Asset`
11. 来源改为：`@sdkwork/magic-studio-assets/entities`

### 3.7 `tests/canvasAssetsSubpathBoundary.node.test.mjs`

输入�?
1. `canvas` 6 个运行时文件源码
2. broad root import 约束

输出�?
1. 新增 node 边界测试
2. 断言 6 个运行时文件不再直接 `from '@sdkwork/magic-studio-assets'`
3. 断言每个文件都命中预期的 focused subpath

### 3.8 `canvasReferenceImageImport.test.ts`

输入�?
1. mock `@sdkwork/magic-studio-assets`

输出�?
1. mock 改为：`@sdkwork/magic-studio-assets/services`

### 3.9 `canvasActionService.test.ts`

输入�?
1. mock `@sdkwork/magic-studio-assets`

输出�?
1. mock 改为：`@sdkwork/magic-studio-assets/services`

### 3.10 `canvasGenerationService.test.ts`

输入�?
1. mock `@sdkwork/magic-studio-assets`
2. mock `@sdkwork/magic-studio-image`
3. mock `@sdkwork/magic-studio-video`

输出�?
1. mock 改为：`@sdkwork/magic-studio-assets/services`
2. mock 改为：`@sdkwork/magic-studio-image/services`
3. mock 改为：`@sdkwork/magic-studio-video/services`

---

## 4. 红灯 -> 绿灯闭环

### 4.1 失败边界测试

新增�?
1. `tests/canvasAssetsSubpathBoundary.node.test.mjs`

目标�?
1. `sdkwork-magic-studio-canvas` �?6 个运行时文件禁止继续 broad root import
2. `CanvasNode` 必须拆分�?`services / creation-chat / entities`

### 4.2 红灯验证

执行�?
1. `node --test tests/canvasAssetsSubpathBoundary.node.test.mjs`

结果�?
1. 失败
2. 第一处失败文件是 `packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.ts`
3. 失败原因正确，说明测试锁定的�?broad root import，而不是测试自身错�?
### 4.3 最小实�?
处理原则�?
1. 不修改业务流�?2. 不修改业务参�?3. 只切换模块边�?
### 4.4 回归测试中暴露的新问�?
第一次跑 `canvas` 定向 vitest 时暴�?2 个失败：

1. `canvasGenerationService.test.ts` 真实发起�?`imageService.generateImage`
2. `canvasGenerationService.test.ts` 真实进入�?`videoService.generateVideo`

结论�?
1. 不是 `canvasGenerationService.ts` 生产逻辑回归
2. 根因是测�?mock 仍指向旧根入�?3. �?mock 对齐�?`@sdkwork/magic-studio-image/services` �?`@sdkwork/magic-studio-video/services` 后，测试恢复通过

---

## 5. 实施清单

### 5.1 新增

1. `tests/canvasAssetsSubpathBoundary.node.test.mjs`

### 5.2 生产代码修改

1. `packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.ts`
2. `packages/sdkwork-magic-studio-canvas/src/utils/canvasGeneratedOutcomeResource.ts`
3. `packages/sdkwork-magic-studio-canvas/src/services/canvasGenerationService.ts`
4. `packages/sdkwork-magic-studio-canvas/src/services/canvasExportService.ts`
5. `packages/sdkwork-magic-studio-canvas/src/services/canvasActionService.tsx`
6. `packages/sdkwork-magic-studio-canvas/src/components/CanvasNode.tsx`

### 5.3 测试修改

1. `packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.test.ts`
2. `packages/sdkwork-magic-studio-canvas/src/services/canvasActionService.test.ts`
3. `packages/sdkwork-magic-studio-canvas/src/services/canvasGenerationService.test.ts`

---

## 6. 验证结果

### 6.1 `canvas` 边界测试

执行�?
1. `node --test tests/canvasAssetsSubpathBoundary.node.test.mjs`

结果�?
1. 通过

### 6.2 `canvas` 定向 vitest

执行�?
1. `pnpm vitest run packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasGeneratedOutcomeResource.test.ts packages/sdkwork-magic-studio-canvas/src/services/canvasGenerationService.test.ts packages/sdkwork-magic-studio-canvas/src/services/canvasActionService.test.ts`

结果�?
1. `4 passed`
2. `7 passed`

### 6.3 `canvas` 包级 vitest

执行�?
1. `pnpm vitest run packages/sdkwork-magic-studio-canvas/src/utils/viewport.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasGeneratedOutcomeResource.test.ts packages/sdkwork-magic-studio-canvas/src/store/canvasStoreIdentity.test.ts packages/sdkwork-magic-studio-canvas/src/store/canvasGroupGeometry.test.ts packages/sdkwork-magic-studio-canvas/src/services/nodeFactory.test.ts packages/sdkwork-magic-studio-canvas/src/services/index.test.ts packages/sdkwork-magic-studio-canvas/src/services/canvasToCutConverter.test.ts packages/sdkwork-magic-studio-canvas/src/services/canvasService.test.ts packages/sdkwork-magic-studio-canvas/src/services/canvasGenerationService.test.ts packages/sdkwork-magic-studio-canvas/src/services/canvasActionService.test.ts packages/sdkwork-magic-studio-canvas/src/components/nodes/VideoNode.test.tsx packages/sdkwork-magic-studio-canvas/src/components/CanvasGroupPanel.test.tsx`

结果�?
1. `13 passed`
2. `23 passed`

### 6.4 全量 node tests

执行�?
1. `pnpm run test:node`

结果�?
1. `Discovered 65 node-side test file(s).`
2. `All 65 node-side test file(s) passed.`

### 6.5 构建

执行�?
1. `pnpm run build:test`

结果�?
1. 构建通过
2. `MODULE_TYPELESS_PACKAGE_JSON` warning 仍在
3. 超大 chunk warning 仍在
4. 本轮不处理这两个既有问题

### 6.6 `canvas` 包内 root import 复核

执行�?
1. `rg -n "@sdkwork/magic-studio-assets" packages/sdkwork-magic-studio-canvas -g "*.ts" -g "*.tsx"`

结果�?
1. 运行时代码已只命中：
   - `@sdkwork/magic-studio-assets/services`
   - `@sdkwork/magic-studio-assets/creation-chat`
   - `@sdkwork/magic-studio-assets/entities`
2. broad root 命中只剩测试代码之外�?focused subpath，不再有 `from '@sdkwork/magic-studio-assets'`

### 6.7 全局 broad root import 复核

执行�?
1. `rg -n "from '@sdkwork/magic-studio-assets'|from \"@sdkwork/magic-studio-assets\"" packages -g "*.ts" -g "*.tsx" -g "!**/*.test.ts" -g "!**/*.test.tsx" -g "!**/tests/**" -g "!**/vite.config.ts" -g "!packages/sdkwork-magic-studio-notes/**" -g "!packages/sdkwork-magic-studio-assets/**"`

结果�?
1. 运行时代码高优先级命中已收敛到：
   - `packages/sdkwork-magic-studio-drive/src/components/FilePreviewModal.tsx`
   - `packages/sdkwork-magic-studio-magiccut/...`
2. 其余命中主要来自�?   - `docs/review`
   - `packages/sdkwork-magic-studio-assets` 自身文档
   - 显式排除外的测试文件

---

## 7. 产物复核

构建后关�?chunk�?
1. `feature-assets-center-C0RrNib6.js` `1377.47 KB`
2. `feature-assets-generation-DYK4aNvg.js` `593.39 KB`
3. `feature-film-core-BvRtj0md.js` `327.59 KB`
4. `feature-notes-DHYQyHwX.js` `318.03 KB`
5. `feature-magiccut-shared-t2nPsa7C.js` `265.50 KB`
6. `feature-magiccut-engine-rKjuqXFY.js` `230.42 KB`
7. `feature-drive-DUhPdfC-.js` `152.36 KB`
8. `feature-portal-video-fYjyTMqR.js` `119.95 KB`

结论�?
1. `canvas` 运行�?broad root import 已清�?2. `feature-assets-center` 暂未出现明显体积下降
3. 当前最大可疑面继续收敛�?`drive` �?`magiccut`

---

## 8. 当前残留问题

### 8.1 `sdkwork-magic-studio-drive`

重点文件�?
1. `packages/sdkwork-magic-studio-drive/src/components/FilePreviewModal.tsx`

状态：

1. 仍直接从 `@sdkwork/magic-studio-assets` 根入口获取运行时能力
2. 这是下一个最适合快速收口的单点模块

### 8.2 `sdkwork-magic-studio-magiccut`

状态：

1. 仍有多处资源列表组件�?domain 类型�?`@sdkwork/magic-studio-assets` 根入口获�?`AnyAsset`、`TextAsset`、`RegisterExistingAssetInput`、`useAssetUrl`
2. �?`drive` 更分散，适合作为 `drive` 之后的下一轮重�?
### 8.3 `notes`

状态：

1. 仍有 broad root import
2. 按用户要求继续排除，不在本应用本轮处�?
### 8.4 推断风险：`@sdkwork/magic-studio-assets` 的部分子路径导出仍依�?workspace 解析

基于源码观察的事实：

1. 代码库已经大量使用：
   - `@sdkwork/magic-studio-assets/creation-chat`
   - `@sdkwork/magic-studio-assets/choose-asset`
   - `@sdkwork/magic-studio-assets/generation`
2. `packages/sdkwork-magic-studio-assets/package.json` 当前显式声明�?`exports` 仅包含：
   - `.`
   - `./components`
   - `./pages`
   - `./services`
   - `./store`
   - `./entities`
   - `./hooks`
   - `./asset-center`

推断风险�?
1. 当前 workspace 内通过别名解析仍可运行
2. 如果未来要直接依�?`@sdkwork/magic-studio-assets` �?dist 包对外消费，这组未显式暴露的 subpath 可能成为打包或运行时兼容风险
3. 本轮未处理该问题，需要单独立项验�?
---

## 9. 下一步计�?
Round 12 建议顺序�?
1. 先处�?`sdkwork-magic-studio-drive`
2. 再处�?`sdkwork-magic-studio-magiccut`
3. 收口完成后重新复�?`feature-assets-center` 的真实组�?
原因�?
1. `drive` 是单点文件，收益明确，适合快速继续缩小可疑面
2. `magiccut` 仍有较多类型与组�?root import，需要单独一轮集中收�?3. �?`canvas / drive / magiccut` 都清理完后，再看 `feature-assets-center` 是否还被其他共享层拖大，结论会更可信

继续保持同样闭环�?
1. 先写失败边界测试
2. 再做最小实�?3. 如有失败先查 mock 是否漂移
4. 跑定向测�?5. 跑全�?node tests
6. �?`build:test`
7. 复核 `dist/assets`
8. 回写 `docs/review`

---

## 10. 本轮交付摘要

Round 11 已完成完整闭环：

1. 新增 `canvas` 边界测试并确认红�?2. 收口 `sdkwork-magic-studio-canvas` 运行�?broad root import
3. 修复 `canvas` 测试 mock 与真实导入路径不一致的问题
4. 跑�?`canvas` 定向 vitest、`canvas` 包级 vitest、全�?node tests 和构�?5. 用源码检索和构建产物确认 `canvas` 已从高优先级 broad root import 可疑面中清出

这轮的直接收益仍然不�?chunk 立刻下降，而是继续让真正值得怀疑的范围�?`canvas / drive / magiccut` 收敛�?`drive / magiccut`�?