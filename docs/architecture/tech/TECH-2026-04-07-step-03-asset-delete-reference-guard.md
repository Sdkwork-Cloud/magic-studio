> Migrated from `docs/review/2026-04-07-step-03-asset-delete-reference-guard.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 2026-04-07 Step 03 资产删除前反向引用阻�?
## Step / Wave

- 当前 Step: `03-资产中心与本地存储闭环`
- 当前 Wave: `Wave A / 共享主干收敛`

## 本轮目标

继续执行 `docs/prompts/反复执行Step指令.md`，保持在 `Step 03`，聚焦资产中心删除治理的一个真实缺口：

1. 修复 `AssetCenterService.deleteById(...)` 在删除资产前只校验“路径是否受管”，却没有校验“资产是否仍被业务引用”的问题�?2. 确保已登�?`references` 的资产在删除时会被服务层直接阻断，避免误删索引记录和本地受管文件�?
## 背景与问�?
前几轮已经持续推进了 `assetId` 主引用收敛，�?`Step 03` 的删除回收策略仍未闭环：

- `AssetCenterService.deleteById(...)` 当前会：
  - 查找资产
  - 解析本地路径
  - 删除受管文件
  - 删除索引记录
- 但它不会在删除前检�?`asset.references`

这意味着只要调用方走到了资产中心删除主干，即使该资产仍被 Film / MagicCut / Canvas 等业务对象通过已持久化引用关系绑定，也可能继续被删掉�?
这与 `Step 03` 对“统一引用关系 + 统一删除回收策略”的要求冲突，也会削弱后续删除前反向引用治理的可信度�?
## 实际变更

### 1. 先为删除前引用阻断补失败用例

- 更新 `packages/sdkwork-magic-studio-assets/tests/assetCenterDeleteSafety.test.ts`
- 新增用例�?  - `refuses to delete assets that still have persisted domain references`

该用例验证：

- 当资产存�?`references`
- 且调�?`AssetCenterService.deleteById('asset-1')`
- 服务必须拒绝删除
- 同时不能删除本地文件
- 也不能删除索引记�?
首次执行时，RED 表现为：

- Promise 被错误地 resolve
- 说明当前服务层确实缺少删除前引用阻断

### 2. 在资产中心核心服务补删除前阻�?
- 更新 `packages/sdkwork-magic-studio-assets/src/asset-center/application/AssetCenterService.ts`

新增行为�?
- 在删除前检�?`asset.references`
- 如果存在持久化引用关系：
  - 组装引用摘要
  - 抛出阻断错误
  - 终止后续文件删除与索引删�?
阻断粒度保持在资产中心核心服务层，而不是只依赖某个上层 UI 或单个引擎自行判断�?
## 测试与验�?
### Red

执行�?
- `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/assetCenterDeleteSafety.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`

结果�?
- `1 file`
- `3 tests | 1 failed`
- 失败原因�?  - `promise resolved "undefined" instead of rejecting`

### Green

实现后执行：

- `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/assetCenterDeleteSafety.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`

结果�?
- `1 file, 3 tests passed`

### Regression

执行 Step 03 主题回归包：

- `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/assetCenterDeleteSafety.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasImportedAssetResource.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.test.ts packages/sdkwork-magic-studio-canvas/src/services/canvasGenerationService.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasGeneratedOutcomeResource.test.ts packages/sdkwork-magic-studio-canvas/src/services/canvasToCutConverter.test.ts packages/sdkwork-magic-studio-magiccut/tests/generatedSelectionImport.test.ts packages/sdkwork-magic-studio-magiccut/tests/magicCutAssetState.test.ts packages/sdkwork-magic-studio-film/tests/generatedSelectionAssetImport.test.ts packages/sdkwork-magic-studio-assets/tests/generatedSelectionAsset.test.ts packages/sdkwork-magic-studio-assets/tests/generatedSelectionAssetPersistence.test.ts packages/sdkwork-magic-studio-assets/tests/generatedOutcomeAssetPersistence.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`

结果�?
- `12 files, 55 tests passed`

## 检查点结果

### CP03-1 统一资产 identity 与目录策略冻�?
- 结果：`PARTIAL`
- 说明：本轮增强了删除前对已登记引用关系的保护，但 Step 03 的目录、恢复、回收治理仍未整体闭环�?
### CP03-2 三大引擎主引用切换到 canonical asset

- 结果：`PARTIAL`
- 说明：本轮没有新增引擎资产主引用迁移，而是在资产中心核心服务补齐了删除治理安全边界�?
### CP03-3 资产测试与跨模式读取通过

- 结果：`PARTIAL`
- 说明：Step 03 主题回归已通过，但更大范围 node/web 平台隔离问题仍是独立 blocker�?
### CP03-4 是否允许进入下一�?
- 结果：`NO`
- 说明：本轮只能定义为 `Step 03 第九轮局部闭环`，仍不能宣称 `Step 03 完成`�?
## 风险 / Blocker

- 当前删除前阻断依�?`asset.references` 已经正确登记；如果某些业务入口仍未持久化引用关系，保护能力不会自动覆盖这些旁路�?- 该能力当前先落在资产中心核心服务层，部分上层调用方是否能把错误信息友好反馈到 UI，仍需后续治理�?- `ChooseAsset` 相关 node/web 平台隔离问题仍未关闭，不属于本轮成果�?
## 下一轮建�?
优先级建议：

1. 继续停留�?`Step 03`
2. 优先审计哪些业务入口尚未把引用关系登记到 `asset.references`
3. 或继续清�?Canvas / ChooseAsset 的消费侧资产读取断点

## 自我反证结论

- 本轮不是“只补一�?if 判断”，因为它真实改变了资产中心删除主干的安全边界�?- 本轮也不是“删除治理完整闭环”，因为当前只补上了服务级阻断，还没有完成全量反向引用登记与统一 UI 反馈�?- 本轮更不�?`Step 03 完成`，只能定义为 `Step 03 第九轮局部闭环`�?- 本轮的真实增量是：资产中心现在不会在已有持久化业务引用仍存在时继续删除资产文件和索引记录，从而把 Step 03 的删除回收治理从“仅校验路径安全”推进到“同时校验引用安全”�?
