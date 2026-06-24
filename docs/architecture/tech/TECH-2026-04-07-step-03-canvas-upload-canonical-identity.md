> Migrated from `docs/review/2026-04-07-step-03-canvas-upload-canonical-identity.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 2026-04-07 Step 03 Canvas 本地上传 canonical identity 收敛

## Step / Wave

- 当前 Step: `03-资产中心与本地存储闭环`
- 当前 Wave: `Wave A / 共享主干收敛`

## 本轮目标

继续执行 `docs/prompts/反复执行Step指令.md`，保持在 `Step 03`，聚�?Canvas 导入侧的一个真实缺口：

1. 修复 `CanvasNode` 本地上传入口在资产落盘后，只�?canonical identity 留在 `metadata` 中，却没有提升到 Canvas 资源 top-level `assetId / assetUuid / primaryResourceId / resourceViewId` 的问题�?2. 统一 Canvas 本地上传入口与参考图导入入口的资产投影逻辑，确保两条入口对已落盘资产的身份表达一致�?
## 背景与问�?
上一轮已经完成了 Canvas 生成引用链路�?identity 收敛�?
- �?Canvas 资源 top-level 身份字段缺失�?- `canvasGenerationService` 已经会从 `metadata` 回退复用 canonical identity

�?Canvas 导入侧仍有一个残留断点：

- `CanvasNode.tsx` 中的本地上传 `toCanvasResource(...)` 只返回：
  - `id`
  - `uuid`
  - `metadata`
  - 尺寸、时长、缩略图等展示字�?- 却没有把 `assetId / assetUuid / primaryResourceId / primaryResourceUuid / resourceViewId / resourceViewUuid` 提升�?Canvas 资源顶层

这带来两个问题：

- Step 03 所要求的“统一 `assetId` 主引用”在 Canvas 本地上传入口仍未兑现
- 导入侧与引用侧表达不一致，后续消费方仍需要额外依�?`metadata` 兼容回填

## 实际变更

### 1. 先为 uploaded asset -> Canvas resource 投影逻辑补失败用�?
- 新增 `packages/sdkwork-magic-studio-canvas/src/utils/canvasImportedAssetResource.test.ts`
- 新增用例�?  - `promotes canonical asset identity from uploaded metadata into top-level canvas fields`
  - `falls back to runtime asset identity when resource-view metadata is unavailable`

首次执行时，RED 表现为：

- `Cannot find module './canvasImportedAssetResource'`

这证明当前仓库中还不存在统一�?uploaded asset 投影入口�?
### 2. 新增统一投影 util

- 新增 `packages/sdkwork-magic-studio-canvas/src/utils/canvasImportedAssetResource.ts`
- 新增 `toCanvasImportedAssetResource(...)`

�?util 统一负责�?
- 读取 uploaded asset �?canonical identity
- �?canonical identity 提升�?Canvas 资源 top-level�?  - `assetId`
  - `assetUuid`
  - `primaryResourceId`
  - `primaryResourceUuid`
  - `resourceViewId`
  - `resourceViewUuid`
- 统一 `uuid` 选择优先级：
  1. `resourceViewUuid`
  2. `primaryResourceUuid`
  3. `resolveAssetRecordClientUuid(uploaded)`
  4. `assetId`
- 保留展示相关字段�?  - `url / path`
  - `width / height / duration / size`
  - `thumbnailUrl`
  - `format`
  - `metadata`

### 3. �?Canvas 本地上传入口切换到统一投影 util

- 更新 `packages/sdkwork-magic-studio-canvas/src/components/CanvasNode.tsx`
- 删除组件内分散的 `toCanvasResource(...)`
- 本地上传成功后，改为调用 `toCanvasImportedAssetResource(...)`

结果是：

- Canvas 本地上传导入入口不再只保�?`metadata`
- 已落盘资产的 canonical identity 会立即投影到 Canvas 资源顶层
- 后续引用、导出、转换链路可以优先读取顶�?canonical 字段

### 4. 让参考图导入入口也复用同一套逻辑

- 更新 `packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.ts`
- 改为调用 `toCanvasImportedAssetResource(...)`

这样 Canvas 当前两条导入类入口：

- 本地上传到节�?- 上传参考图到生成面�?
现在都走同一�?canonical asset identity 投影逻辑�?
## 测试与验�?
### Red

执行�?
- `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-canvas/src/utils/canvasImportedAssetResource.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`

结果�?
- `0 test`
- `Cannot find module './canvasImportedAssetResource'`

### Green

实现后执行：

- `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-canvas/src/utils/canvasImportedAssetResource.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`

结果�?
- `2 files, 3 tests passed`

### Regression

执行主题回归包：

- `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-canvas/src/utils/canvasImportedAssetResource.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.test.ts packages/sdkwork-magic-studio-canvas/src/services/canvasGenerationService.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasGeneratedOutcomeResource.test.ts packages/sdkwork-magic-studio-canvas/src/services/canvasToCutConverter.test.ts packages/sdkwork-magic-studio-magiccut/tests/generatedSelectionImport.test.ts packages/sdkwork-magic-studio-film/tests/generatedSelectionAssetImport.test.ts packages/sdkwork-magic-studio-assets/tests/generatedSelectionAsset.test.ts packages/sdkwork-magic-studio-assets/tests/generatedSelectionAssetPersistence.test.ts packages/sdkwork-magic-studio-assets/tests/generatedOutcomeAssetPersistence.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`

结果�?
- `10 files, 39 tests passed`

## 检查点结果

### CP03-1 统一资产 identity 主引�?
- 结果：`PARTIAL`
- 说明：Canvas 本地上传与参考图导入入口现在都已�?canonical identity 提升�?top-level；但 Step 03 的删除前反向引用治理与更大范围消费侧验证仍未闭环�?
### CP03-2 三大引擎主引用切换到 canonical asset

- 结果：`PARTIAL`
- 说明：共享层、Film、MagicCut、Canvas 生成引用�?Canvas 本地上传导入入口都已具备 canonical 主引用收敛能力；但还不能宣称三大引擎所有入口全部完成�?
### CP03-3 资产测试与跨模式读取通过

- 结果：`PARTIAL`
- 说明：当前主题回归已覆盖共享资产、Film、MagicCut �?Canvas 的主要身份收敛主干；更大范围 node/web 平台隔离问题仍是独立 blocker�?
### CP03-4 是否允许进入下一�?
- 结果：`NO`
- 说明：本轮只能定义为 `Step 03 第八轮局部闭环`，仍不能宣称 `Step 03 完成`�?
## 风险 / Blocker

- `ChooseAsset` 相关更大范围 node/web 平台隔离问题仍未关闭�?  - `indexedDB is not defined`
  - `retired generic app SDK` 子导出缺�?  - node 环境误触�?web 初始�?- Step 03 仍未完成删除前反向引用治理�?- Canvas 更大范围跨入口消费侧是否全部优先�?top-level canonical identity，仍需继续审计�?
## 下一轮建�?
优先级建议：

1. 继续停留�?`Step 03`
2. 下一轮优先处理删除前反向引用治理，或继续清理 Canvas/ChooseAsset 的消费侧资产读取断点
3. 保持每轮只关闭一个真实缺口，不把 node/web 平台隔离和资产身份治理混成同一轮成�?
## 自我反证结论

- 本轮不是“只重构 util”，因为它真实改变了 Canvas 本地上传与参考图导入两条入口�?canonical identity 表达方式�?- 本轮也不是“Canvas 全量闭环”，因为当前关闭的是本地上传导入投影入口，而不�?Step 03 的全部缺口�?- 本轮更不�?`Step 03 完成`，只能定义为 `Step 03 第八轮局部闭环`�?- 本轮的真实增量是：把 Canvas 导入侧的本地上传入口从“canonical identity 仅存�?metadata”推进到“canonical identity 同时提升�?top-level 主引用”，进一步逼近 Step 03 的统一 `assetId` 主干目标�?
