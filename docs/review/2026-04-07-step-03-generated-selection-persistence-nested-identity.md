# 2026-04-07 Step 03 生成结果持久化嵌套身份收�?
## Step / Wave

- 当前 Step: `03-资产中心与本地存储闭环`
- 当前 Wave: `Wave A / 共享主干收敛`

## 本轮目标

继续执行 `docs/prompts/反复执行Step指令.md`，本轮聚焦两个强相关的共享闭环点�?
1. 修复 `persistGeneratedSelectionAsset(...)` 在顶�?identity 缺失时，无法从嵌�?`resource.metadata` 复用 canonical `assetId / assetUuid / primaryResourceId / resourceViewId` 的问题�?2. 修复 `tests/vitest.codex.config.mjs` 只支持精确包别名、不支持 `@sdkwork/magic-studio-core/services` 这类子路径别名，导致共享持久化测试无法跑到业务层的问题�?
## 背景与问�?
上一轮已经完成了共享资产投影入口 `toAssetFromGeneratedSelection(...)` 的嵌�?canonical identity 收敛，但持久化链路仍然存在相邻缺口：

- `persistGeneratedSelectionAsset(...)` 只读取顶层字�?- �?top-level `assetId / assetUuid / primaryResourceId / resourceViewId` 缺失，而嵌�?`resource.metadata` 已经�?canonical identity �?- 代码会误判为“没有持久化身份”，退回重新导入逻辑
- 进一步导致：
  - 重新导入不必要执�?  - canonical identity 无法被原地复�?  - mock 上传返回体不�?metadata 时会在测试中触发异常

与此同时，codex 专用 Vitest 配置存在另一个阻断：

- `tests/vitest.codex.config.mjs` 只配置了 `@sdkwork/magic-studio-core` 的精�?alias
- 没有覆盖 `@sdkwork/magic-studio-core/services`、`@sdkwork/magic-studio-core/platform`、`@sdkwork/magic-studio-core/sdk` 等子路径
- 导致共享资产持久化测试套件在 import 阶段直接失败，无法进入业务行为验�?
## 实际变更

### 1. 修复 codex 专用 Vitest 子路�?alias

- 更新 `tests/vitest.codex.config.mjs`
- 为以�?workspace 包同时补齐“精确路�?+ 子路径�?alias�?  - `@sdkwork/magic-studio-commons`
  - `@sdkwork/magic-studio-core`
  - `@sdkwork/magic-studio-i18n`
  - `@sdkwork/magic-studio-types`

这次变更只作用于 codex 专用测试配置，不影响生产构建链�?
### 2. 持久化链路增加嵌�?identity 解析

- 更新 `packages/sdkwork-magic-studio-assets/src/services/generatedSelectionAssetPersistence.ts`
- 新增以下解析逻辑�?  - `resolveSelectionAssetId(...)`
  - `resolveSelectionAssetUuid(...)`
  - `resolveSelectionPrimaryResourceId(...)`
  - `resolveSelectionPrimaryResourceUuid(...)`
  - `resolveSelectionResourceViewId(...)`
  - `resolveSelectionResourceViewUuid(...)`
- 解析优先级保持克制：
  - 顶层字段优先
  - 其次读取 `resource` 直挂字段
  - 最后读�?`resource.metadata`

### 3. 持久化主分支改为复用解析后的 canonical identity

- `assetId` 判断从“只�?`selection.assetId`”改为“统一 identity 解析结果�?- `artifactUuid` 构造也改为优先使用解析后的 canonical identity
- 重新导入分支仍然保留，但只在真的缺少 canonical `assetId` 时触�?
## 测试与验�?
### Red 证据一：测试基础设施 blocker

修复前执行：

- `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/generatedOutcomeAssetPersistence.test.ts packages/sdkwork-magic-studio-assets/tests/generatedSelectionAssetPersistence.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`

结果�?
- 两个 suite 都在 import 阶段失败
- 报错：`Cannot find package '@sdkwork/magic-studio-core/services'`

这证明问题首先不是业务逻辑，而是 codex 专用 vitest 子路�?alias 不完整�?
### Red 证据二：业务行为缺口

基础设施修复后，新增回归用例�?
- `packages/sdkwork-magic-studio-assets/tests/generatedSelectionAssetPersistence.test.ts`

修复前执行：

- `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/generatedSelectionAssetPersistence.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`

结果�?
- `1 failed`
- 失败点：`reuses nested canonical identity from resource metadata when top-level ids are absent`
- 实际表现�?  - 代码没有复用嵌套 canonical identity
  - 错误进入重新导入分支
  - 因上传返回体未带 `metadata`，触�?`Cannot read properties of undefined (reading 'metadata')`

### Green / Regression

执行主题回归包：

- `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/generatedSelectionAsset.test.ts packages/sdkwork-magic-studio-assets/tests/generatedSelectionAssetPersistence.test.ts packages/sdkwork-magic-studio-assets/tests/generatedOutcomeAssetPersistence.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`

结果�?
- `3 files, 12 tests passed`

### 扩展验证尝试

进一步尝试把 `ChooseAsset` 消费侧一起纳入回归：

- `packages/sdkwork-magic-studio-assets/tests/chooseAssetIdentity.test.tsx`

当前不再卡在 alias，而是暴露出更深层 blocker�?
- `@sdkwork/app-sdk` 子导�?`./http/client` 未在当前 node 条件下导�?- `indexedDB is not defined`
- `packages/sdkwork-magic-studio-core/src/platform/web.ts` �?node 环境下触�?web 平台初始�?
这说明本轮已经真实推进了测试基础设施，但消费�?node/web 平台隔离仍有后续清障空间�?
## 检查点结果

### CP03-1 统一资产 identity 主引�?
- 结果：`PARTIAL`
- 说明：生成结果共享投影入口和共享持久化入口现在都能承接嵌�?canonical identity；但导入引擎和消费侧尚未全部闭环�?
### CP03-2 减少临时 URL / 临时选择结果主引�?
- 结果：`PARTIAL`
- 说明：当生成结果已经持有 canonical identity 时，持久化链路不再误入重新导入分支，进一步削弱了临时 selection 结果继续充当主引用的情况�?
### CP03-3 共享主干可测试�?
- 结果：`YES`
- 说明：codex 专用 vitest 配置现在能解�?workspace 包子路径，至少共享持久化主干测试已能真实运行到业务层�?
### CP03-4 Step 03 完工判定

- 结果：`NO`
- 说明：本轮只是第四个局部闭环，Step 03 仍未整步完成�?
## 风险 / Blocker

- `ChooseAsset` 相关测试已暴露出新的 node/web 平台隔离问题�?  - `indexedDB` �?node 环境不可�?  - `@sdkwork/app-sdk` 某些子路径在当前条件导出不完�?- `Film / MagicCut / Canvas` 导入链路中的嵌套 identity 收敛仍待继续推进�?- `generatedOutcome` 若存在仅在更深嵌�?metadata 中持�?identity 的场景，未来也可能需要对齐同类解析�?
## 下一轮建�?
优先级建议：

1. 仍然留在 `Step 03`
2. 两条可选高价值切口：
   - A. 收敛 `Film / MagicCut / Canvas` 导入链路的嵌�?identity 写回
   - B. 处理 `ChooseAsset` 测试暴露出来�?node/web 平台隔离 blocker

如果目标是继续推进资�?identity 主链路，建议优先 A�?如果目标是扩�?codex 自动验证覆盖面，建议优先 B�?
## 自我反证结论

- 本轮不是“只修测试配置”，因为真正的业务缺口也已同时闭环�?- 本轮也不是“只修一�?service �?if 分支”，而是把生成结果持久化入口推进到与共享资产投影入口一致的 identity 承接能力�?- 本轮对商业化交付的直接价值在于：
  - 减少不必要的重新导入
  - 让持久化链路围绕 canonical asset identity 工作
  - 提高 codex 自动化验证对共享主干问题的真实发现能�?