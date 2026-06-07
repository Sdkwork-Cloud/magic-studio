# 2026-04-07 Step 03 Canvas 生成引用 metadata 身份收敛

## Step / Wave

- 当前 Step: `03-资产中心与本地存储闭环`
- 当前 Wave: `Wave A / 共享主干收敛`

## 本轮目标

继续执行 `docs/prompts/反复执行Step指令.md`，保持在 `Step 03`，聚�?Canvas 引用链路中的一个真实缺口：

1. 修复 `generateCanvasNodeMedia(...)` �?Canvas 资源 top-level `assetId / assetUuid / primaryResourceId / resourceViewId` 缺失时，无法�?`metadata` 复用 canonical identity 的问题�?2. �?Canvas 在把资源再次作为 image/video 引用发送给生成服务时，复用 canonical 身份，而不是退回本地临�?`uuid`�?
## 背景与问�?
前六轮已经连续完成了�?
- 共享生成结果投影入口对嵌�?canonical identity 的承�?- 共享持久化入口对嵌套 canonical identity 的承�?- Film 导入链路对嵌�?canonical identity 的承�?- MagicCut 导入链路对嵌�?canonical identity 的承�?
�?Canvas 仍有一个位于主干上的身份漂移缺口：

- Canvas 节点资源可能只在 `metadata` 中保�?canonical `assetId / assetUuid / primaryResourceId / primaryResourceUuid / resourceViewId / resourceViewUuid`
- `toCanvasImageInputRef(...)` �?`toCanvasVideoInputRef(...)` 只读�?top-level 字段
- 结果�?image/video 引用对象丢失 canonical identity
- 统一视频请求进一步退回使用本地临�?`uuid`

这会�?Canvas 成为 Step 03 共享身份主干中的一个残留断点�?
## 实际变更

### 1. �?Canvas 生成服务补充 metadata canonical identity 回退测试

- 更新 `packages/sdkwork-magic-studio-canvas/src/services/canvasGenerationService.test.ts`
- 新增回归用例�?  - `falls back to metadata canonical identity when canvas image references have no top-level asset fields`
  - `falls back to metadata canonical identity when canvas video references have no top-level asset fields`

这两条用例固定了以下行为�?
- 即使 Canvas 资源 top-level 身份字段全部缺失
- 只要 `metadata` 已经带有 canonical identity
- image/video 引用构造都必须复用 canonical 身份
- video 请求中的 `assets[].value` 也必须切�?canonical `resourceViewUuid`

### 2. 清理本测试文件的局�?mock 副作�?blocker

- 仍然更新 `packages/sdkwork-magic-studio-canvas/src/services/canvasGenerationService.test.ts`
- �?`@sdkwork/magic-studio-assets/services` / `@sdkwork/magic-studio-image/services` / `@sdkwork/magic-studio-video/services` �?mock �?`vi.importActual(...)` 调整为无副作用测试桩
- 对视频请求构造仅保留 `buildUnifiedVideoGenerationRequest` 的真实实�?
这一调整只用于让本文件能够稳定进入业�?RED�?
- 不代表仓库级 node/web 平台隔离问题已经解决
- 不代�?`ChooseAsset` �?`indexedDB is not defined` blocker 已关�?- 只是把当前用例的测试入口从基础设施噪声中剥离出�?
### 3. 收敛 Canvas 引用身份解析逻辑

- 更新 `packages/sdkwork-magic-studio-canvas/src/services/canvasGenerationService.ts`
- 新增局�?identity 解析逻辑�?  - `normalizeOptionalString(...)`
  - `pickFirstString(...)`
  - `resolveCanvasResourceIdentityValue(...)`
  - `resolveCanvasResourceIdentity(...)`

解析优先级保持统一且克制：

1. Canvas 资源 top-level 字段
2. `metadata` 中的 canonical identity

### 4. image/video 两条引用适配入口同步切到统一 identity 解析

- `toCanvasImageInputRef(...)`
- `toCanvasVideoInputRef(...)`

两处现在都会�?
- 复用 `metadata` 中的 canonical `assetId / assetUuid / primaryResourceId / primaryResourceUuid / resourceViewId / resourceViewUuid`
- �?`metadata` 同步透传�?input ref 顶层
- 保留原始 `resource` 结构和本地显示信息不�?
## 测试与验�?
### Red Blocker 证据

首次新增用例后执行：

- `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-canvas/src/services/canvasGenerationService.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`

结果�?
- `1 failed`
- 但失败原因不是业务断言，而是测试入口被现�?`vi.importActual(...)` mock 副作用阻�?
阻塞表现�?
- `0 test`
- `indexedDB is not defined`
- `EPERM: operation not permitted, open ... retry/index.js`

处理结论�?
- �?blocker 属于本测试文件的局�?mock 方式问题
- 已在测试文件中做最小清�?- 未宣称更大范围平台隔离问题已修复

### Red 业务证据

清障后再次执行同一命令�?
- `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-canvas/src/services/canvasGenerationService.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`

结果�?
- `1 file, 5 tests`
- `2 failed`

失败现象�?
- image 引用对象仍然输出本地 `uuid`
- video 请求 `assets[].value` 仍然退回本�?`uuid`
- canonical `assetId / assetUuid / primaryResourceId / resourceViewId` 没有�?`metadata` 回填�?top-level ref

这证明问题根源确实是 Canvas 引用适配入口没有复用 `metadata` 中的 canonical identity�?
### Green

修复后执行：

- `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-canvas/src/services/canvasGenerationService.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`

结果�?
- `1 file, 5 tests passed`

### Regression

执行主题回归包：

- `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-canvas/src/services/canvasGenerationService.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasGeneratedOutcomeResource.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.test.ts packages/sdkwork-magic-studio-magiccut/tests/generatedSelectionImport.test.ts packages/sdkwork-magic-studio-film/tests/generatedSelectionAssetImport.test.ts packages/sdkwork-magic-studio-assets/tests/generatedSelectionAsset.test.ts packages/sdkwork-magic-studio-assets/tests/generatedSelectionAssetPersistence.test.ts packages/sdkwork-magic-studio-assets/tests/generatedOutcomeAssetPersistence.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`

结果�?
- `8 files, 35 tests passed`

## 检查点结果

### CP03-1 统一资产 identity 主引�?
- 结果：`PARTIAL`
- 说明：Canvas 生成引用链路现在已经能复�?`metadata` 中的 canonical identity；但 Canvas 导入链路、删除前反向引用治理和更大范围消费侧验证仍未闭环�?
### CP03-2 三大引擎主引用切换到 canonical asset

- 结果：`PARTIAL`
- 说明：Film、MagicCut、Canvas 三条主干都已具备至少一条复�?canonical identity 的真实代码链路；�?Canvas 还没有完成导入侧同类缺口收敛，不能宣称整引擎完成�?
### CP03-3 资产测试与跨模式读取通过

- 结果：`PARTIAL`
- 说明：本轮主题回归已覆盖共享资产、Film、MagicCut、Canvas 的当前主干身份收敛路径；更大范围 node/web 平台隔离问题仍是独立 blocker�?
### CP03-4 是否允许进入下一�?
- 结果：`NO`
- 说明：本轮只能定义为 `Step 03 第七轮局部闭环`，仍不能宣称 `Step 03 完成`�?
## 风险 / Blocker

- Canvas 仍未完成导入链路的同�?canonical identity 收敛�?- `ChooseAsset` 相关更大范围验证仍暴露：
  - `indexedDB is not defined`
  - `retired generic app SDK` 子导出缺�?  - node 环境误触�?web 平台初始�?- Step 03 仍未完成删除前反向引用治理与更完整的跨引擎主引用切换�?
## 下一轮建�?
优先级建议：

1. 继续停留�?`Step 03`
2. 下一轮优先处�?Canvas 导入链路�?`resource / resource.metadata` canonical identity 的同类收�?3. �?`ChooseAsset` �?node/web 平台隔离问题继续保留为并行候�?lane，但不要与当前身份主干混成同一轮成�?
## 自我反证结论

- 本轮不是“只补测试”，因为生产代码已经真实收敛�?Canvas image/video 引用入口�?identity 解析逻辑�?- 本轮也不是“Canvas 全部修完”，因为当前只关闭了 Canvas 作为生成引用时的 metadata identity 缺口�?- 本轮更不是“Step 03 完成”，因为导入链路、删除治理和平台隔离 blocker 仍未闭环�?- 本轮的真实增量是：把 canonical identity 收敛从共享层、Film、MagicCut，继续推进到�?Canvas 生成引用主干，进一步降�?Canvas 侧的身份漂移和重复生成风险�?