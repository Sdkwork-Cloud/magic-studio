> Migrated from `docs/review/2026-04-07-step-03-magiccut-project-reference-binding.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 2026-04-07 Step 03 MagicCut 项目级引用登记补�?
## Step / Wave

- 当前 Step: `03-资产中心与本地存储闭环`
- 当前 Wave: `Wave A / 共享主干收敛`

## 本轮目标

继续执行 `docs/prompts/反复执行Step指令.md`，保持在 `Step 03`，聚焦资产引用治理主线中的一个真实缺口：

1. 修复 `MagicCut` 项目导入链路在本地受管导入与服务端上传两条路径上都没有把资产登记为项目级 `persisted reference` 的问题�?2. 确保后续 `AssetCenterService.deleteById(...)` 的删除前引用阻断能力，能够真正覆�?`MagicCut` 项目导入资产，而不是只对少数已登记入口生效�?
## 背景与问�?
上一轮已经把 `AssetCenterService.deleteById(...)` 提升到“删除前校验 persisted references”的安全边界，但这项能力只有在业务入口真的完成引用登记时才成立�?
本轮审计发现 `MagicCutStoreProvider` 中的 `importMagicCutUpload(...)` 存在两个盲区�?
- 本地受管导入路径�?  - �?`assetCenterService.importAsset(...)`
  - 已经能解�?`project.uuid`
  - 但没有把项目�?`references` 传入资产中心
- 服务端上传路径：
  - �?`importAssetBySdk(...)` + `toMagiccutResource(...)`
  - 上传成功后没有补 `assetCenterService.bindReference(...)`
  - 导致 SDK 上传资产虽然能进�?`MagicCut`，但不会在资产中心形成项目级持久化绑�?
这会直接削弱 Step 03 已建立的删除前引用阻断能力，因为 `MagicCut` 项目导入出来的资产仍可能处于“被项目实际使用，但资产中心并不知道”的状态�?
## 实际变更

### 1. 先补失败测试，锁定两个真实缺�?
- 更新 `packages/sdkwork-magic-studio-magiccut/tests/magicCutStoreIdentity.test.tsx`
- 新增两个用例�?  - `registers project-level references when desktop imports enter managed-local asset storage`
  - `binds project-level references after server uploads complete`

两条用例分别验证�?
- 本地受管导入时，`assetCenterService.importAsset(...)` 必须带入项目�?`references`
- 服务端上传完成并落入资产中心后，必须调用 `assetCenterService.bindReference(...)` 绑定项目级引�?
首轮执行 RED，失败表现明确且与缺口一一对应�?
- 本地路径失败原因�?`importAsset(...)` 调用中缺�?`references`
- 上传路径失败原因�?`bindReference(...)` 根本没有被调�?
### 2. �?MagicCut 导入入口补项目级引用登记

- 更新 `packages/sdkwork-magic-studio-magiccut/src/store/magicCutStore.tsx`

本轮采取的是最小边界修复，而不是扩散到全局 SDK 签名�?
1. �?`MagicCut` 导入入口内部统一解析当前导入作用�?`scope`
2. 基于 `scope.projectId` 构造项目级引用对象�?   - `domain: 'magiccut'`
   - `entityType: 'project'`
   - `entityId: <当前项目 uuid>`
   - `relation: 'reference'`
   - `slot: 'media-resource'`
3. 本地受管导入路径�?   - 把上�?`references` 直接传给 `assetCenterService.importAsset(...)`
4. 服务端上传路径：
   - 先完�?`toMagiccutResource(...)`，确保资产进入资产中�?   - 再调�?`assetCenterService.bindReference(uploaded.id, projectReference)`

### 3. 保持修复边界收敛

本轮没有做以下事情：

- 没有修改 `importAssetBySdk(...)` 的全局函数签名
- 没有�?Film / Canvas / TrackCover 等其他入口一起混进本�?- 没有宣称全仓引用登记已经完成

这保证本轮仍然是 `Step 03` 下一个可验证、可回归、可发布的局部闭环�?
## 测试与验�?
### Red

执行�?
- `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-magiccut/tests/magicCutStoreIdentity.test.tsx --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`

结果�?
- `1 file`
- `5 tests | 2 failed`
- 失败原因�?  - 本地受管导入断言�?`importAsset(...)` 缺少 `references`
  - 服务端上传断言�?`bindReference(...)` 调用次数�?`0`

### Green

实现后执行：

- `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-magiccut/tests/magicCutStoreIdentity.test.tsx --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`

结果�?
- `1 file, 5 tests passed`

### Regression

执行 Step 03 主题回归包：

- `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-magiccut/tests/magicCutStoreIdentity.test.tsx packages/sdkwork-magic-studio-magiccut/tests/generatedSelectionImport.test.ts packages/sdkwork-magic-studio-magiccut/tests/magicCutAssetState.test.ts packages/sdkwork-magic-studio-assets/tests/assetCenterDeleteSafety.test.ts packages/sdkwork-magic-studio-assets/tests/assetCenterProjectManagedImport.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasImportedAssetResource.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.test.ts packages/sdkwork-magic-studio-canvas/src/services/canvasGenerationService.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasGeneratedOutcomeResource.test.ts packages/sdkwork-magic-studio-canvas/src/services/canvasToCutConverter.test.ts packages/sdkwork-magic-studio-film/tests/generatedSelectionAssetImport.test.ts packages/sdkwork-magic-studio-assets/tests/generatedSelectionAsset.test.ts packages/sdkwork-magic-studio-assets/tests/generatedSelectionAssetPersistence.test.ts packages/sdkwork-magic-studio-assets/tests/generatedOutcomeAssetPersistence.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`

结果�?
- `14 files, 66 tests passed`

## 检查点结果

### CP03-1 统一资产 identity 与目录策略冻�?
- 结果：`PARTIAL`
- 说明：本轮没有新�?identity 规则，而是�?`MagicCut` 项目导入入口把现�?identity 与项目级引用绑定真正接上�?
### CP03-2 三大引擎主引用切换到 canonical asset

- 结果：`PARTIAL`
- 说明：本轮只补了 `MagicCut` 项目导入的项目级 `persisted reference`，尚未覆盖全�?Canvas / Film / 其他上传入口�?
### CP03-3 删除前引用阻断能力是否真正可落地

- 结果：`IMPROVED`
- 说明：上一轮补的是资产中心删除前阻断能力，本轮补的�?`MagicCut` 项目导入资产的引用登记，因此删除安全边界首次在“登记侧 + 删除侧”形成真实闭环�?
### CP03-4 是否允许进入下一�?
- 结果：`NO`
- 说明：本轮只能定义为 `Step 03 第十轮局部闭环`，仍不能宣称 `Step 03 完成`，更不能升级�?`alpha`�?
## 风险 / Blocker

- `MagicCut` 项目导入路径已经补齐，但其他消费 `importAssetBySdk(...)` 的入口仍可能存在同类引用登记盲区�?- 服务端上传路径当前是在资产进入资产中心后再做 `bindReference(...)`，这是正确闭环，但错误反馈是否能在所�?UI 层友好呈现，仍需后续治理�?- `ChooseAsset` �?node/web 平台隔离问题仍是独立 blocker，不属于本轮成果�?
## 下一轮建�?
优先级建议：

1. 继续停留�?`Step 03`
2. 继续审计 Film / Canvas / TrackCover 等仍未登记项目级或业务级 `references` 的入�?3. 若同类问题集中出现，再考虑抽象“上传后统一绑定 reference”的共享 helper，但不建议在证据不足时提前泛�?
## 自我反证结论

- 本轮不是“只加一层测�?mock”，因为它真实改变了 `MagicCut` 资产进入资产中心时的引用登记行为�?- 本轮也不是“全仓引用治理已完成”，因为只关闭了 `MagicCut` 项目导入这个局部缺口�?- 本轮真正新增的能力是�?  - `MagicCut` 本地受管导入资产会在创建时直接落下项目级 persisted reference
  - `MagicCut` 服务端上传资产会在进入资产中心后补齐项目�?persisted reference
  - 从而使上一轮引入的删除前引用阻断，�?`MagicCut` 项目导入主干上首次具备真实落地价�?
