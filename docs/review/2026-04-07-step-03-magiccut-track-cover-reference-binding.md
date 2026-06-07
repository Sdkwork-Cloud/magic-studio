# 2026-04-07 Step 03 MagicCut TrackCover 项目级引用登记补�?
## Step / Wave

- 当前 Step: `03-资产中心与本地存储闭环`
- 当前 Wave: `Wave A / 共享主干收敛`

## 本轮目标

继续执行 `docs/prompts/反复执行Step指令.md`，保持在 `Step 03`，继续关闭资产上�?helper 仍绕开 asset-center persisted reference 主干的实际缺口�?
本轮聚焦 `MagicCut TrackCover` 导入链路�?
1. 修复 `importMagicCutTrackCoverFile(...)` 在本地封面上传后没有把资产登记为当前项目�?`persisted reference` 的问题�?2. 修复 `importMagicCutTrackCoverFromUrl(...)` 在从帧图 URL 持久化封面后没有把资产绑定为当前项目�?`persisted reference` 的问题�?3. �?`TrackCover` 资产真正进入 `Step 03` 已建立的删除前引用阻断能力，而不是只完成 SDK 上传�?URL 解析�?
## 背景与问�?
前两轮已经把�?
- `MagicCut` 项目导入主干
- `Film` 导入 helper

都接入了 asset-center 的项目级 persisted reference 治理面�?
�?`packages/sdkwork-magic-studio-magiccut/src/utils/magicCutTrackCoverImport.ts` 仍然是一个明显旁路：

- 本地文件封面只做 `importAssetBySdk(...)`
- URL 封面只做 `importAssetFromUrlBySdk(...)`
- helper 只解�?`assetId / url`
- 完全没有 `assetCenterService.initialize(...)`
- 完全没有 `registerExistingAsset(...)`
- 完全没有 `bindReference(...)`

这意味着�?
- TrackCover 能在 UI 中显�?- �?asset-center 不知道这些封面资产已被当�?MagicCut 项目持久化引�?- 删除前引用阻断能力无法真实覆�?TrackCover 主链�?
## 实际变更

### 1. 先补失败测试，锁定两个真实缺�?
- 更新 `packages/sdkwork-magic-studio-magiccut/tests/trackCoverImport.test.ts`
- 新增两个 RED 用例�?  - `registers project-level references when uploaded track covers are not yet indexed in asset center`
  - `binds project-level references when selected frame covers already exist in asset center`

两条用例分别验证�?
- 本地文件导入�?  - 资产尚未进入 asset-center index
  - helper 必须 `registerExistingAsset(...)`
  - 且必须附带项目级 `references`
- URL 导入�?  - 资产已存在于 asset-center index
  - helper 必须调用 `bindReference(...)`

首轮 RED 失败原因非常干净�?
- 两条路径�?`assetCenterService.initialize(...)` 调用次数都是 `0`
- 说明 TrackCover helper 完全没有进入 persisted reference 持久化逻辑

### 2. �?TrackCover helper 内补最小持久化闭环

- 更新 `packages/sdkwork-magic-studio-magiccut/src/utils/magicCutTrackCoverImport.ts`

本轮保持最小边界修复，不改全局 SDK 签名�?
1. 新增 `MagicCutTrackCoverImportContext`
   - `projectId`
   - `trackId`
   - `source`
2. 新增 scope / project reference / locator / timestamp 解析 helper
3. 基于当前 projectId 构造项目级 persisted reference�?   - `domain: 'magiccut'`
   - `entityType: 'project'`
   - `entityId: <当前项目 id>`
   - `relation: 'reference'`
   - `slot: 'track-cover'`
4. 新增 `persistTrackCoverReference(...)`
   - 若资产已存在�?asset-center index：调�?`bindReference(...)`
   - 若资产尚未进�?index：调�?`registerExistingAsset(...)`，并附带项目�?`references`
5. `importMagicCutTrackCoverFile(...)` �?`importMagicCutTrackCoverFromUrl(...)` 在返回前统一执行上述 helper

### 3. 在调用侧补强真实上下�?
- 更新 `packages/sdkwork-magic-studio-magiccut/src/components/Timeline/MagicCutTrackHeader.tsx`

让两个调用入口都传入�?
- `project.uuid`
- `trackKey`
- 语义�?source
  - `magiccut-track-cover-upload`
  - `magiccut-track-cover-frame`

这样 TrackCover helper 不会退回只�?workspace fallback 的弱上下文�?
### 4. 本轮边界控制

本轮没有做以下事情：

- 没有修改 `importAssetBySdk(...)` / `importAssetFromUrlBySdk(...)` 的全局签名
- 没有�?TrackCover 上升�?clip / track 级独立实体引用模�?- 没有�?Canvas / 其他上传 helper 一起混入本�?
因此本轮仍然�?`Step 03` 下一个可验证、可回归、可发布的局部闭环�?
## 测试与验�?
### Red

执行�?
- `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-magiccut/tests/trackCoverImport.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`

结果�?
- `1 file`
- `4 tests | 2 failed`
- 失败原因�?  - 本地文件封面导入路径没有进入 `assetCenterService.initialize(...)`
  - URL 封面导入路径没有进入 `assetCenterService.initialize(...)`

### Green

实现后执行：

- `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-magiccut/tests/trackCoverImport.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`

结果�?
- `1 file, 4 tests passed`

### Regression

执行 Step 03 主题回归包：

- `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-magiccut/tests/magicCutStoreIdentity.test.tsx packages/sdkwork-magic-studio-magiccut/tests/generatedSelectionImport.test.ts packages/sdkwork-magic-studio-magiccut/tests/magicCutAssetState.test.ts packages/sdkwork-magic-studio-magiccut/tests/trackCoverImport.test.ts packages/sdkwork-magic-studio-assets/tests/assetCenterDeleteSafety.test.ts packages/sdkwork-magic-studio-assets/tests/assetCenterProjectManagedImport.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasImportedAssetResource.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.test.ts packages/sdkwork-magic-studio-canvas/src/services/canvasGenerationService.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasGeneratedOutcomeResource.test.ts packages/sdkwork-magic-studio-canvas/src/services/canvasToCutConverter.test.ts packages/sdkwork-magic-studio-film/tests/generatedSelectionAssetImport.test.ts packages/sdkwork-magic-studio-assets/tests/generatedSelectionAsset.test.ts packages/sdkwork-magic-studio-assets/tests/generatedSelectionAssetPersistence.test.ts packages/sdkwork-magic-studio-assets/tests/generatedOutcomeAssetPersistence.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`

结果�?
- `15 files, 72 tests passed`

### Typecheck 尝试

执行�?
- `pnpm.cmd exec tsc --skipLibCheck --ignoreConfig --noEmit --jsx react-jsx --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-magiccut/src/utils/magicCutTrackCoverImport.ts packages/sdkwork-magic-studio-magiccut/src/components/Timeline/MagicCutTrackHeader.tsx`

结果�?
- `FAIL`
- blocker�?  - `packages/sdkwork-magic-studio-core/src/sdk/assetCenterClient.ts`
  - 缺少 `retired generic app SDK/api/asset-center`
  - 缺少 `retired generic app SDK/api/upload`
  - 缺少 `retired generic app SDK/http/client`
  - 缺少 `retired generic app SDK/types/common`

判定�?
- 这是共享 SDK 类型声明 blocker，不是本轮新增回�?- 本轮不把该基础设施问题混入 TrackCover 局部闭环范围，但必须在 review / release 中登�?
## 检查点结果

### CP03-1 统一资产 identity 与目录策略冻�?
- 结果：`PARTIAL`
- 说明：本轮没有新�?identity 规则，而是�?MagicCut TrackCover helper 正式接入 asset-center 引用主干�?
### CP03-2 三大引擎主引用切换到 canonical asset

- 结果：`IMPROVED`
- 说明：TrackCover 入口此前只完�?SDK 上传�?URL 解析；本轮进一步补齐项目级 persisted reference 登记，使 TrackCover 资产真正进入统一资产协议�?
### CP03-3 删除前引用阻断能力是否真正可落地

- 结果：`IMPROVED`
- 说明：TrackCover �?file / url 两条导入主干现在都能把资产登记到项目�?persisted reference，删除前引用阻断首次真实覆盖�?TrackCover 链路�?
### CP03-4 是否允许进入下一�?
- 结果：`NO`
- 说明：当前只能定义为 `Step 03 第十二轮局部闭环`，仍不能宣称 `Step 03 完成`，更不满�?`alpha` 升级条件�?
## 风险 / Blocker

- 本轮只补齐了项目�?persisted reference，尚未细化到 Track / Clip 级业务实体引用模型�?- Canvas、其他上�?helper 仍可能存在同类引用登记盲区�?- `ChooseAsset` �?node/web 平台隔离 blocker 仍未关闭�?- 共享 `retired generic app SDK/*` 类型声明缺失仍阻塞定�?`tsc`�?
## 下一轮建�?
1. 继续停留�?`Step 03`
2. 优先继续审计 Canvas / 其他上传 helper �?persisted reference 盲区
3. 若同类逻辑再次集中出现，再基于现有证据考虑抽取共享“上传后引用持久化�?helper

## 自我反证结论

- 本轮不是只补测试，因为它真实改变�?TrackCover 资产进入 asset-center �?persisted reference 行为
- 本轮也不�?TrackCover 全链路资产治理完成，因为当前仍只有项目级 reference，没�?Track / Clip 级细粒度引用模型
- 本轮新增的真实能力是�?  - MagicCut TrackCover 本地文件导入会在资产未入索引时完成注册并带上项目�?persisted reference
  - MagicCut TrackCover URL 导入会在资产已入索引时补项目�?persisted reference
  - 从而让此前已建立的删除前引用阻断能力首次覆盖到 TrackCover 主干
