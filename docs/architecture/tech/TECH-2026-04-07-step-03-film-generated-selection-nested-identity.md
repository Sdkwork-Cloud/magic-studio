> Migrated from `docs/review/2026-04-07-step-03-film-generated-selection-nested-identity.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 2026-04-07 Step 03 Film 生成结果导入嵌套身份收敛

## Step / Wave

- 当前 Step: `03-资产中心与本地存储闭环`
- 当前 Wave: `Wave A / 共享主干收敛`

## 本轮目标

继续执行 `docs/prompts/反复执行Step指令.md`，本轮保持在 `Step 03`，聚�?Film 导入链路的一个真实缺口：

1. 修复 `resolveFilmGeneratedSelectionAsset(...)` �?top-level `assetId / assetUuid` 缺失时，无法从嵌�?`resource.metadata` 复用 canonical identity 的问题�?2. 防止 Film 导入链路在上述场景下误判为“尚未持久化”，并错误触发重新导入分支�?
## 背景与问�?
前两轮已经把嵌套 canonical identity 收敛推进到了�?
- 共享生成结果投影入口 `toAssetFromGeneratedSelection(...)`
- 共享持久化入�?`persistGeneratedSelectionAsset(...)`

�?Film 导入链路仍停留在只读�?top-level `selection.assetId / selection.assetUuid` 的状态：

- 当生成结果只�?`resource.metadata.assetId / assetUuid` 中携�?canonical identity �?- Film 仍会把该结果视为“仅有临�?URL 的未持久化资源�?- 于是错误进入 `importFilmAssetFromUrl(...)` 分支

这会直接导致�?
- 不必要的二次导入
- canonical `assetId / assetUuid` 丢失
- 资产中心�?Film 引擎之间�?identity 主引用不一�?
## 实际变更

### 1. �?Film 导入链路补充嵌套 canonical identity 回归测试

- 更新 `packages/sdkwork-magic-studio-film/tests/generatedSelectionAssetImport.test.ts`
- 新增回归用例�?  - `reuses nested canonical identity from resource metadata instead of re-importing generated selections`

该用例明确验证：

- 输入只有 `resource.metadata.assetId / assetUuid`
- 仍应优先复用 canonical 资产
- 不允许触�?`importAssetFromUrlBySdk(...)`

### 2. 收敛 Film 生成结果选择�?identity 读取逻辑

- 更新 `packages/sdkwork-magic-studio-film/src/utils/filmModalAssetImport.ts`
- �?`FilmGeneratedSelectionLike.resource` 从“只承载 URL”扩展为可承载：
  - `assetId`
  - `assetUuid`
  - `metadata`
- 新增以下解析逻辑�?  - `readSelectionResourceMetadataValue(...)`
  - `resolveSelectionAssetId(...)`
  - `resolveSelectionAssetUuid(...)`

解析优先级保持克制：

1. top-level `selection.assetId / selection.assetUuid`
2. `selection.resource.assetId / assetUuid`
3. `selection.resource.metadata.assetId / assetUuid`

### 3. Film 主分支改为复用统一解析结果

- `resolveFilmGeneratedSelectionAsset(...)` 不再直接判断 `selection.assetId`
- 改为先解�?`assetId / assetUuid`
- 当解析出 canonical `assetId` 时：
  - 优先�?`resolveAssetPrimaryUrlBySdk(assetId)`
  - 直接构�?`ImportedFilmAssetRef`
  - 不再误入重新导入分支

## 测试与验�?
### Red 证据

新增失败用例后执行：

- `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-film/tests/generatedSelectionAssetImport.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`

结果�?
- `1 failed`

失败现象�?
- 预期复用 `asset-selection-nested-metadata-1`
- 实际却走了重新导入分支，返回 `film-reimported-asset-1`

这证明问题确实来�?Film 导入链路未读取嵌�?canonical identity，而不是测试构造错误�?
### Green / Regression

修复后执行：

- `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-film/tests/generatedSelectionAssetImport.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`

结果�?
- `1 file, 11 tests passed`

继续执行主题回归包：

- `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-film/tests/generatedSelectionAssetImport.test.ts packages/sdkwork-magic-studio-assets/tests/generatedSelectionAsset.test.ts packages/sdkwork-magic-studio-assets/tests/generatedSelectionAssetPersistence.test.ts packages/sdkwork-magic-studio-assets/tests/generatedOutcomeAssetPersistence.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`

结果�?
- `4 files, 23 tests passed`

## 检查点结果

### CP03-1 统一资产 identity 主引�?
- 结果：`PARTIAL`
- 说明：Film 生成结果导入链路现在已经能复用嵌�?canonical `assetId / assetUuid`；但 MagicCut、Canvas 与更深层消费链路仍未完全对齐�?
### CP03-2 三大引擎主引用切换到 canonical asset

- 结果：`PARTIAL`
- 说明：Film 这一支已经减少了临时 URL 与重复导入对主引用的污染，但三大引擎整体仍未全部收敛完成�?
### CP03-3 资产测试与跨模式读取通过

- 结果：`PARTIAL`
- 说明：Film + 共享资产主干相关回归已通过；更大范围消费侧仍存�?node/web 平台隔离 blocker�?
### CP03-4 是否允许进入下一�?
- 结果：`NO`
- 说明：本轮只�?Step 03 第五轮局部闭环，仍不能宣�?Step 03 完成�?
## 风险 / Blocker

- `packages/sdkwork-magic-studio-magiccut/src/utils/generatedSelectionImport.ts` 仍未收敛同类嵌套 identity 读取逻辑�?- `ChooseAsset` 相关验证仍暴露：
  - `indexedDB is not defined`
  - `retired generic app SDK` 子导出缺�?  - node 环境触发 web 平台初始�?- Step 03 仍未完成删除前反向引用治理与更完整的跨引擎主引用切换�?
## 下一轮建�?
优先级建议：

1. 继续留在 `Step 03`
2. 下一轮优先处�?`MagicCut` 导入链路的嵌�?canonical identity 收敛
3. �?`ChooseAsset` �?node/web 平台隔离问题保留为并�?lane 候选，但不要与资产 identity 主线混成同一轮成�?
## 自我反证结论

- 本轮不是“只补测试”，因为生产代码已真实收�?Film 导入主分支�?- 本轮也不是“Step 03 完工”，因为 MagicCut、Canvas、删除治理和平台隔离仍未闭环�?- 本轮的真实增量是：把 canonical identity 收敛从共享层继续推进到了 Film 引擎导入链路，进一步降低了重复导入与身份漂移风险�?
