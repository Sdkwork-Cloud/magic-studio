> Migrated from `docs/review/2026-04-07-step-03-film-project-reference-binding.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 2026-04-07 Step 03 Film 项目级引用登记补�?
## Step / Wave

- 当前 Step: `03-资产中心与本地存储闭环`
- 当前 Wave: `Wave A / 共享主干收敛`

## 本轮目标

继续执行 `docs/prompts/反复执行Step指令.md`，保持在 `Step 03`，继续关闭“删除前引用阻断已建立，但业务入口未真实登记 persisted reference”的收敛缺口�?
本轮聚焦 `Film` 导入 helper�?
1. 修复 `importFilmAssetFromUrl(...)` �?URL 导入后没有把资产登记为当前项目级 `persisted reference` 的问题�?2. 修复 `importFilmAssetFromFile(...)` 在本地文件上传后没有把资产落入资产中心项目级引用索引的缺口�?3. �?`Film` 的上传和 AI 导入链路真正进入 `Step 03` 已建立的资产中心删除保护面，而不是只复用 URL / canonical identity�?
## 背景与问�?
此前 `Film` 导入链路已经完成�?canonical identity 复用能力，但 `packages/sdkwork-magic-studio-film/src/utils/filmModalAssetImport.ts` 仍存在一个明确盲区：

- `importFilmAssetFromUrl(...)` �?`importFilmAssetFromFile(...)` 都接�?`metadata`
- 业务调用方已经持续传入：
  - `origin`
  - `source`
  - `slot / slotIndex / scene`
- �?helper 内完全没有消费这些信�?- 导入成功后既不会向资产中心注册项目级引用，也不会�?`bindReference(...)`

这意味着�?
- Film 资产虽然能被导入并在界面中使�?- 但资产中心不知道这些资产已被当前 Film 项目持久化引�?- 上一轮和前几轮建立的“引用登�?+ 删除阻断”能力无法真正覆�?Film 导入主干

## 实际变更

### 1. 先补失败测试，锁定两个真实缺�?
- 更新 `packages/sdkwork-magic-studio-film/tests/generatedSelectionAssetImport.test.ts`
- 新增两个 RED 用例�?  - `binds a project-level persisted reference after url imports land on an existing film asset`
  - `registers a project-level persisted reference when local file imports are not yet indexed in asset center`

两条用例分别验证�?
- URL 导入场景�?  - 资产已存在于 asset-center index
  - Film helper 必须调用 `assetCenterService.bindReference(...)`
- 本地文件导入场景�?  - 资产尚未进入 asset-center index
  - Film helper 必须�?`registerExistingAsset(...)`
  - 同时携带项目�?`references`

首轮 RED 失败原因非常干净�?
- `assetCenterService.initialize(...)` 调用次数�?`0`
- 说明 Film helper 完全没有进入 persisted reference 持久化逻辑

### 2. �?Film helper 内补最小持久化闭环

- 更新 `packages/sdkwork-magic-studio-film/src/utils/filmModalAssetImport.ts`

本轮保持最小边界修复，不改外部调用签名，不改全局 SDK�?
1. 新增 `FilmImportMetadata`、scope / reference / locator / status 解析 helper
2. 通过 `readWorkspaceScope()` 解析当前 `workspaceId / projectId`
3. 基于当前 `projectId` 构造项目级 persisted reference�?   - `domain: 'film'`
   - `entityType: 'project'`
   - `entityId: <当前项目 id>`
   - `relation: 'reference'`
   - `slot: 'media-resource'`
4. 将业�?metadata 作为 reference metadata 一并保留，确保 `origin / source / slot / slotIndex / scene` 等上下文不会丢失
5. 新增 `persistFilmProjectReference(...)`
   - 若资产已存在于资产中心索引：调用 `bindReference(...)`
   - 若资产尚未进入索引：调用 `registerExistingAsset(...)`，并直接带上 `references`
6. `importFilmAssetFromUrl(...)` �?`importFilmAssetFromFile(...)` 在构建返回值前统一调用上述 helper

### 3. 本轮边界控制

本轮没有做以下事情：

- 没有修改 `importAssetBySdk(...)` �?`importAssetFromUrlBySdk(...)` 的全局签名
- 没有把更细粒度的 `shot / scene / character / prop` 业务实体建模混入本轮
- 没有同时扩散�?Canvas / TrackCover / 其他上传入口

因此本轮仍然�?`Step 03` 下一个可验证、可回归、可发布的局部闭环�?
## 测试与验�?
### Red

执行�?
- `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-film/tests/generatedSelectionAssetImport.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`

结果�?
- `1 file`
- `13 tests | 2 failed`
- 失败原因�?  - URL 导入路径没有进入 `assetCenterService.initialize(...)`
  - 本地文件导入路径没有进入 `assetCenterService.initialize(...)`

### Green

实现后执行：

- `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-film/tests/generatedSelectionAssetImport.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`

结果�?
- `1 file, 13 tests passed`

### Regression

执行 Step 03 主题回归包：

- `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-magiccut/tests/magicCutStoreIdentity.test.tsx packages/sdkwork-magic-studio-magiccut/tests/generatedSelectionImport.test.ts packages/sdkwork-magic-studio-magiccut/tests/magicCutAssetState.test.ts packages/sdkwork-magic-studio-assets/tests/assetCenterDeleteSafety.test.ts packages/sdkwork-magic-studio-assets/tests/assetCenterProjectManagedImport.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasImportedAssetResource.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.test.ts packages/sdkwork-magic-studio-canvas/src/services/canvasGenerationService.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasGeneratedOutcomeResource.test.ts packages/sdkwork-magic-studio-canvas/src/services/canvasToCutConverter.test.ts packages/sdkwork-magic-studio-film/tests/generatedSelectionAssetImport.test.ts packages/sdkwork-magic-studio-assets/tests/generatedSelectionAsset.test.ts packages/sdkwork-magic-studio-assets/tests/generatedSelectionAssetPersistence.test.ts packages/sdkwork-magic-studio-assets/tests/generatedOutcomeAssetPersistence.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`

结果�?
- `14 files, 68 tests passed`

## 检查点结果

### CP03-1 统一资产 identity 与目录策略冻�?
- 结果：`PARTIAL`
- 说明：本轮没有新�?canonical identity 规则，而是�?Film 导入 helper 正式接入资产中心引用主干�?
### CP03-2 三大引擎主引用切换到 canonical asset

- 结果：`IMPROVED`
- 说明：Film 入口此前只完�?canonical identity 复用；本轮进一步补齐项目级 persisted reference 登记，使 Film 导入资产真正进入统一资产协议�?
### CP03-3 删除前引用阻断能力是否真正可落地

- 结果：`IMPROVED`
- 说明：Film URL / file 导入主干现在都能把资产登记到项目�?persisted reference，删除前引用阻断首次真实覆盖�?Film 导入链路�?
### CP03-4 是否允许进入下一�?
- 结果：`NO`
- 说明：当前只能定义为 `Step 03 第十一轮局部闭环`，仍不能宣称 `Step 03 完成`，更不满�?`alpha` 升级条件�?
## 风险 / Blocker

- 本轮只补齐了项目�?persisted reference，尚未细化到 `shot / scene / character / prop` 级别业务实体引用模型�?- Canvas、TrackCover、其�?`importAssetBySdk(...)` / `importAssetFromUrlBySdk(...)` 消费侧仍可能存在同类引用登记盲区�?- `ChooseAsset` �?node/web 平台隔离 blocker 仍未关闭，不属于本轮成果�?
## 下一轮建�?
1. 继续停留�?`Step 03`
2. 优先继续审计 Canvas / TrackCover / 其他上传 helper �?persisted reference 盲区
3. 如果同类逻辑在多个入口重复出现，再基于已收敛证据考虑抽取共享“上传后引用持久化�?helper

## 自我反证结论

- 本轮不是只修测试，因为它真实改变�?Film 导入资产进入资产中心�?persisted reference 行为
- 本轮也不是全�?Film 资产治理完成，因为目前仍只有项目�?reference，没有更细粒度业务实�?reference
- 本轮新增的真实能力是�?  - Film URL 导入后会补项目级 persisted reference
  - Film 本地文件导入后会在资产尚未入索引时完成注册并带上项目�?persisted reference
  - 从而让此前已建立的删除前引用阻断能力首次覆盖到 Film 导入主干

