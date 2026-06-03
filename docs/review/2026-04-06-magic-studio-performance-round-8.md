# Magic Studio V2 性能复盘与执行方�?Round 8

日期�?026-04-06  
范围：`apps/magic-studio-v2`  
排除范围：`packages/sdkwork-magic-studio-notes`

---

## 1. 当前阶段结论

Round 8 围绕一个明确假设展开�?
1. `feature-assets-center` 长期过大
2. `magiccut` 仍有多处运行时文件直�?`from '@sdkwork/magic-studio-assets'`
3. 这些宽入口导入可能让 asset �?public facade 继续把不必要的资产中心依赖带�?`magiccut` 链路

本轮先不改业务逻辑，只做导入边界收口实验�?
实验结果�?
1. `magiccut` 运行时入口已经不再消�?`@sdkwork/magic-studio-assets` 根入�?2. 相关 vitest / node 测试 / build 均通过
3. 但关�?chunk 体积基本保持不变�?   - `feature-assets-center` 仍约 `1377.47 KiB`
   - `feature-assets-generation` 仍约 `593.39 KiB`
   - `feature-magiccut-panels` 仍约 `112.37 KiB`

结论�?
1. `magiccut` 根入口导入确实是一个架构边界问题，已经被修�?2. 但它不是当前 `feature-assets-center` 过大的主�?3. 下一轮应该继续转向其他高频根入口消费者，而不是继续在 `magiccut` 这一条线上追加症状修�?
---

## 2. 问题列表

### P1. `magiccut` 运行时文件仍消费 `@sdkwork/magic-studio-assets` 宽入�?
影响�?
1. 资产能力边界不清�?2. 测试 mock 难以对齐真实导入路径
3. 后续继续分析 chunk 归属时，root facade 会掩盖真实依赖来�?
根因�?
1. `magiccut` 内多个运行时文件直接�?`@sdkwork/magic-studio-assets` 根入口取�?   - `assetCenterService`
   - `queryAssetsBySdk`
   - `PromptTextInput`
   - `persistGenerationOutcomeAsset`
   - `useAssetUrl`
   - `GenerationResultSelection`
   - 以及多个 asset 实体类型

### P2. 测试�?mock 宽入口，和真实生产导入边界脱�?
现象�?
1. 本轮切换生产代码到子路径�?2. 若测试仍 mock 根入口，会导致：
   - mock 失效
   - 测试走到真实网络或真实依�?   - 误判为业务回�?
根因�?
1. `generatedSelectionImport.test.ts`
2. `trackCoverImport.test.ts`
3. `magicCutPromptPanels.test.tsx`
4. `magicCutStoreIdentity.test.tsx`

仍基于旧�?root import 进行 mock�?
---

## 3. 本轮处理输入与输�?
### 3.1 `MagicCutResourcePanel.tsx`

输入�?
1. `@sdkwork/magic-studio-assets` 根入�?
输出�?
1. `@sdkwork/magic-studio-assets/asset-center`
2. `@sdkwork/magic-studio-assets/services`
3. `@sdkwork/magic-studio-assets/entities`

### 3.2 `magicCutStore.tsx`

输入�?
1. `@sdkwork/magic-studio-assets` 根入�?
输出�?
1. `@sdkwork/magic-studio-assets/asset-center`
2. `@sdkwork/magic-studio-assets/services`

### 3.3 `VoiceSettingsPanel.tsx`

输入�?
1. `PromptTextInput`
2. `createPromptTextInputCapabilityProps`
3. `persistGenerationOutcomeAsset`

输出�?
1. UI 输入组件来自 `@sdkwork/magic-studio-assets/generation`
2. 产物持久化来�?`@sdkwork/magic-studio-assets/services`

### 3.4 `TextSettingsPanel.tsx`

输入�?
1. `PromptTextInput` 从根入口导入

输出�?
1. `PromptTextInput` 改为�?`@sdkwork/magic-studio-assets/generation` 导入

### 3.5 `MagicCutTimelineToolbar.tsx`

输入�?
1. `GenerationResultSelection` 从根入口导入

输出�?
1. 类型改为�?`@sdkwork/magic-studio-assets/generation` 导入

### 3.6 `generatedSelectionImport.ts`

输入�?
1. `assetCenterService`
2. `importAssetBySdk`
3. `importAssetFromUrlBySdk`
4. `resolveAssetPrimaryUrlBySdk`

输出�?
1. 资产中心能力来自 `@sdkwork/magic-studio-assets/asset-center`
2. 上传与持久化能力来自 `@sdkwork/magic-studio-assets/services`

### 3.7 `magicCutTrackCoverImport.ts`

输入�?
1. root assets import

输出�?
1. 统一改为 `@sdkwork/magic-studio-assets/services`

### 3.8 `assetUrlResolver.ts`

输入�?
1. root assets import

输出�?
1. 统一改为 `@sdkwork/magic-studio-assets/asset-center`

### 3.9 `useResourceUrl.ts`

输入�?
1. root assets import

输出�?
1. 改为 `@sdkwork/magic-studio-assets/hooks`

### 3.10 资源面板文件

处理文件�?
1. `EffectResourcePanel.tsx`
2. `MusicResourcePanel.tsx`
3. `TransitionResourcePanel.tsx`

输入�?
1. root assets import

输出�?
1. 运行�?hook 使用 `@sdkwork/magic-studio-assets/hooks`
2. 类型使用 `@sdkwork/magic-studio-assets/entities`

### 3.11 测试 mock

输入�?
1. �?root assets / root voicespeaker 的旧 mock

输出�?
1. mock 对齐到真实子路径�?   - `@sdkwork/magic-studio-assets/asset-center`
   - `@sdkwork/magic-studio-assets/services`
   - `@sdkwork/magic-studio-assets/generation`
   - `@sdkwork/magic-studio-voicespeaker/constants`
   - `@sdkwork/magic-studio-voicespeaker/services`

---

## 4. 实施清单

### 4.1 先补失败边界测试

新增�?
1. `tests/magiccutAssetsSubpathBoundary.node.test.mjs`

约束�?
1. 指定�?`magiccut` 运行时文件不能再�?`@sdkwork/magic-studio-assets` 根入口导�?2. 每个文件必须使用对应�?focused subpath

### 4.2 最小实�?
修改�?
1. `packages/sdkwork-magic-studio-magiccut/src/components/Resources/MagicCutResourcePanel.tsx`
2. `packages/sdkwork-magic-studio-magiccut/src/store/magicCutStore.tsx`
3. `packages/sdkwork-magic-studio-magiccut/src/components/Properties/panels/VoiceSettingsPanel.tsx`
4. `packages/sdkwork-magic-studio-magiccut/src/components/Properties/panels/TextSettingsPanel.tsx`
5. `packages/sdkwork-magic-studio-magiccut/src/components/Timeline/MagicCutTimelineToolbar.tsx`
6. `packages/sdkwork-magic-studio-magiccut/src/utils/generatedSelectionImport.ts`
7. `packages/sdkwork-magic-studio-magiccut/src/utils/magicCutTrackCoverImport.ts`
8. `packages/sdkwork-magic-studio-magiccut/src/utils/assetUrlResolver.ts`
9. `packages/sdkwork-magic-studio-magiccut/src/hooks/useResourceUrl.ts`
10. `packages/sdkwork-magic-studio-magiccut/src/components/Resources/panels/EffectResourcePanel.tsx`
11. `packages/sdkwork-magic-studio-magiccut/src/components/Resources/panels/MusicResourcePanel.tsx`
12. `packages/sdkwork-magic-studio-magiccut/src/components/Resources/panels/TransitionResourcePanel.tsx`

### 4.3 回补测试 mock

修改�?
1. `packages/sdkwork-magic-studio-magiccut/tests/trackCoverImport.test.ts`
2. `packages/sdkwork-magic-studio-magiccut/tests/generatedSelectionImport.test.ts`
3. `packages/sdkwork-magic-studio-magiccut/tests/magicCutPromptPanels.test.tsx`
4. `packages/sdkwork-magic-studio-magiccut/tests/magicCutStoreIdentity.test.tsx`

---

## 5. 验证结果

### 5.1 边界测试

通过�?
1. `node --test tests/magiccutAssetsSubpathBoundary.node.test.mjs`

### 5.2 定向 vitest

通过�?
1. `pnpm vitest run packages/sdkwork-magic-studio-magiccut/tests/generatedSelectionImport.test.ts packages/sdkwork-magic-studio-magiccut/tests/trackCoverImport.test.ts packages/sdkwork-magic-studio-magiccut/tests/resourcePanelAssets.test.ts packages/sdkwork-magic-studio-magiccut/tests/magicCutPromptPanels.test.tsx packages/sdkwork-magic-studio-magiccut/tests/magicCutStoreIdentity.test.tsx`
2. 结果：`5 passed`
3. 结果：`21 passed`

### 5.3 定向 lint

执行�?
1. `pnpm exec eslint ...`

结果�?
1. �?error
2. 仅存在仓库已�?warning，未新增阻断问题

### 5.4 全量 node 测试

通过�?
1. `pnpm run test:node`
2. 结果：`Discovered 62 node-side test file(s).`
3. 结果：`All 62 node-side test file(s) passed.`

### 5.5 构建

通过�?
1. `pnpm run build:test`

构建警告�?
1. 仍存�?`MODULE_TYPELESS_PACKAGE_JSON`
2. 仍存在超�?chunk warning
3. 本轮不处理这两个已知问题

---

## 6. 产物级结�?
### 6.1 关键 chunk

本轮构建后：

1. `feature-assets-center` �?`1377.47 KiB`
2. `feature-assets-generation` �?`593.39 KiB`
3. `feature-magiccut-panels` �?`112.37 KiB`
4. `feature-film-core` �?`327.59 KiB`
5. `feature-image` �?`53.86 KiB`

### 6.2 结果判断

这轮的真实结果不是“继续降包”，而是�?
1. `magiccut` 的运行时导入边界已经干净
2. chunk 体积没有进一步恶�?3. �?`feature-assets-center` 没有因为这轮改造而实质下�?
所以这轮更像一次必要的根因排除实验�?
1. 证明 `magiccut` 宽入口导入不是当前大包的主因
2. 后续应把精力转向其他根入口消费�?
---

## 7. 残留问题

### 7.1 仍有多个高频包静态消�?`@sdkwork/magic-studio-assets` 根入�?
当前排除 notes 后，仍可见的重点运行时包包括�?
1. `sdkwork-magic-studio-canvas`
2. `sdkwork-magic-studio-browser`
3. `sdkwork-magic-studio-character`
4. `sdkwork-magic-studio-film`
5. `sdkwork-magic-studio-portal-video`
6. `sdkwork-magic-studio-prompt`

这些才是下一轮更可能继续影响 `feature-assets-center` 的候选�?
### 7.2 `notes` 方向残留继续存在

状态：

1. `VideoPage / VideoChatPage -> feature-notes` 残留仍在
2. 按用户要求，本轮不进�?`packages/sdkwork-magic-studio-notes`

---

## 8. 下一步计�?
下一轮建议顺序：

1. 优先�?`browser / prompt / portal-video / character` 这类文件数较少、根入口导入明确的包继续�?focused subpath 收口
2. 再评�?`film / canvas` 这类体量更大的包
3. 每一轮继续保持：
   - 失败测试
   - 最小实�?   - mock 对齐真实子路�?   - 全量 node tests
   - build:test
   - dist 复核
   - review 文档回写

---

## 9. 本轮交付摘要

Round 8 已完成一个完整闭环：

1. 提出关于 `magiccut` 宽入口导入的根因假设
2. 写失败边界测试锁死目标文�?3. 完成 focused subpath 改�?4. 修复失效测试 mock
5. 跑通定�?vitest、全�?node tests、build
6. �?dist 结果验证该假设不是当前大包主�?
这轮的价值不在于直接降体积，而在于把一个可能的主因排除掉，并把 `magiccut` 的资产能力边界拉回到更可维护、更可验证的状态�?