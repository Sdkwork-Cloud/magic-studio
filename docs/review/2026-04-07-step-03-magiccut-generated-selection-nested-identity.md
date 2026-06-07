# 2026-04-07 Step 03 MagicCut 生成结果导入嵌套身份收敛

## Step / Wave

- 当前 Step: `03-资产中心与本地存储闭环`
- 当前 Wave: `Wave A / 共享主干收敛`

## 本轮目标

继续执行 `docs/prompts/反复执行Step指令.md`，本轮保持在 `Step 03`，聚�?MagicCut 导入链路的一个真实缺口：

1. 修复 `resolveMagicCutGeneratedSelectionResource(...)` �?top-level `assetId / assetUuid / primaryResourceId / resourceViewId` 缺失时，无法从嵌�?`resource.metadata` 复用 canonical identity 的问题�?2. 防止 MagicCut 在上述场景下误判为“仅�?URL 的未持久化结果”，并错误进入重新导入分支�?
## 背景与问�?
前几轮已经连续完成了�?
- 共享生成结果投影入口的嵌�?canonical identity 收敛
- 共享持久化入口的嵌套 canonical identity 收敛
- Film 导入链路的嵌�?canonical identity 收敛

�?MagicCut 导入链路仍只�?top-level 字段作为 canonical identity 的主来源�?
- 当生成结果只�?`resource.metadata` 中携�?`assetId / assetUuid / primaryResourceId / primaryResourceUuid / resourceViewId / resourceViewUuid`
- MagicCut 不会把这些字段识别为 canonical 身份
- 代码会继续走 URL 导入分支

本轮新增失败用例后，实际红灯表现为：

- 没有复用嵌套 canonical identity
- 掉入重新导入分支
- 由于 mock 导入结果不带 `key`，最后在 `resolveEntityKey(...)` �?`Entity key missing`

这说明问题根源不是测试本身，而是 MagicCut 主分支没有读取嵌�?identity�?
## 实际变更

### 1. �?MagicCut 导入链路补充嵌套 canonical identity 回归测试

- 更新 `packages/sdkwork-magic-studio-magiccut/tests/generatedSelectionImport.test.ts`
- 新增回归用例�?  - `reuses nested canonical identity from resource metadata instead of importing generated selections again`

该用例固定了以下行为�?
- top-level identity 可以全部缺失
- 只要 `resource.metadata` 已经携带 canonical identity
- MagicCut 必须直接复用 canonical 资产与资源身�?- 不允许再次触�?`importAssetFromUrlBySdk(...)` �?`importAssetBySdk(...)`

### 2. 收敛 MagicCut 选择结果�?identity 读取逻辑

- 更新 `packages/sdkwork-magic-studio-magiccut/src/utils/generatedSelectionImport.ts`
- �?`GeneratedSelectionLike.resource` 从“只承载 URL”扩展为可承载：
  - `assetId`
  - `assetUuid`
  - `primaryResourceId`
  - `primaryResourceUuid`
  - `resourceViewId`
  - `resourceViewUuid`
  - `metadata`
- 新增以下解析逻辑�?  - `readSelectionResourceMetadataValue(...)`
  - `resolveSelectionAssetId(...)`
  - `resolveSelectionAssetUuid(...)`
  - `resolveSelectionPrimaryResourceId(...)`
  - `resolveSelectionPrimaryResourceUuid(...)`
  - `resolveSelectionResourceViewId(...)`
  - `resolveSelectionResourceViewUuid(...)`

解析优先级保持统一且克制：

1. top-level 字段
2. `resource` 直挂字段
3. `resource.metadata`

### 3. MagicCut 主分支改为复用统一解析结果

- `resolveMagicCutGeneratedSelectionResource(...)` 不再只判�?`selection.assetId`
- 改为统一解析后再决定是否�?canonical 资产分支
- `buildSelectionBackedResource(...)` 也同步改为复用解析后�?identity，而不是只依赖 top-level 字段

这让 MagicCut 在“顶层字段缺失、嵌�?metadata 已有 canonical identity”的情况下，能够直接回到资产中心主干，而不是重新导入临�?URL�?
## 测试与验�?
### Red 证据

新增失败用例后执行：

- `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-magiccut/tests/generatedSelectionImport.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`

结果�?
- `1 failed`

失败现象�?
- 预期直接复用 `asset-10`
- 实际进入导入分支并在 `resolveEntityKey(...)` �?`Entity key missing`

这证明问题确实来�?MagicCut 没有识别嵌套 canonical identity�?
### Green / Regression

修复后执行：

- `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-magiccut/tests/generatedSelectionImport.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`

结果�?
- `1 file, 4 tests passed`

继续执行主题回归包：

- `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-magiccut/tests/generatedSelectionImport.test.ts packages/sdkwork-magic-studio-film/tests/generatedSelectionAssetImport.test.ts packages/sdkwork-magic-studio-assets/tests/generatedSelectionAsset.test.ts packages/sdkwork-magic-studio-assets/tests/generatedSelectionAssetPersistence.test.ts packages/sdkwork-magic-studio-assets/tests/generatedOutcomeAssetPersistence.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`

结果�?
- `5 files, 27 tests passed`

## 检查点结果

### CP03-1 统一资产 identity 主引�?
- 结果：`PARTIAL`
- 说明：MagicCut 生成结果导入链路现在已经能复用嵌�?canonical `assetId / assetUuid / primaryResourceId / resourceViewId`；但 Canvas 与更大范围消费链路仍未完全收敛�?
### CP03-2 三大引擎主引用切换到 canonical asset

- 结果：`PARTIAL`
- 说明：Film �?MagicCut 两条导入链路都已减少临时 URL 和重复导入对主引用的污染；Canvas 仍待继续对齐�?
### CP03-3 资产测试与跨模式读取通过

- 结果：`PARTIAL`
- 说明：MagicCut + Film + 共享资产主干回归已通过；更大范围消费侧仍受 node/web 平台隔离 blocker 影响�?
### CP03-4 是否允许进入下一�?
- 结果：`NO`
- 说明：本轮只�?Step 03 第六轮局部闭环，仍不能宣�?Step 03 完成�?
## 风险 / Blocker

- `packages/sdkwork-magic-studio-canvas` 仍未完成同类嵌套 canonical identity 收敛�?- `ChooseAsset` 相关验证仍暴露：
  - `indexedDB is not defined`
  - `retired generic app SDK` 子导出缺�?  - node 环境触发 web 平台初始�?- Step 03 仍未完成删除前反向引用治理与更完整的跨引擎主引用切换�?
## 下一轮建�?
优先级建议：

1. 继续留在 `Step 03`
2. 下一轮优先处�?`Canvas` 导入/引用链路的同类嵌�?canonical identity 收敛
3. �?`ChooseAsset` �?node/web 平台隔离问题保留为并�?lane 候选，但不要与资产 identity 主线混成同一轮成�?
## 自我反证结论

- 本轮不是“只补测试”，因为生产代码已经真实收敛 MagicCut 导入主分支�?- 本轮也不是“Step 03 完工”，因为 Canvas、删除治理和平台隔离仍未闭环�?- 本轮的真实增量是：把 canonical identity 收敛从共享层、Film 引擎继续推进到了 MagicCut 引擎导入链路，进一步降低了重复导入与身份漂移风险�?