> Migrated from `docs/review/2026-04-07-step-03-canvas-reference-image-review-hardening.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 2026-04-07 Step 03 Canvas reference image review hardening

## Step / Wave

- 当前 Step: `03-资产中心与本地存储闭环`
- 当前 Wave: `Wave A / 共享主干收敛`

## 本轮目标

�?`v0.1.17` 已完�?Canvas reference image persisted reference 落地的基础上，继续执行 `docs/prompts/反复执行Step指令.md`，对 code review 发现的问题做第二轮真实收敛，只修被代码与测试直接证明的问题：

1. 修复 reference image attachment 删除回归�?2. 修复 `registerExistingAsset(...)` 丢失上传资产 identity metadata 的一致性风险�?3. 对“同一 project 下重复绑定同一 asset �?metadata 固化”做代码级验证，若确认属于当�?asset-center 去重模型的既有限制，则登记为已知风险，不在本轮冒进扩边界�?
## review 结论核验

本轮先对 review 意见逐条验真�?
### 1. attachment 删除回归

核验结果：`成立`

- `CanvasNode` 生成 attachment id 时已经改为稳定资�?key
- 但删除逻辑仍按 `ref-{index}` 解析
- �?persisted resource 会得�?`NaN`，从而无法删掉任�?attachment

这是明确的功能回归，必须在本轮修复�?
### 2. registerExistingAsset 丢失 identity metadata

核验结果：`成立`

- `registerExistingAsset(...)` �?canonical identity 生成依赖 `input.metadata`
- 之前 helper 只透传�?`boardId / boardUuid / elementId / source`
- 上传资产已有�?`assetUuid / primaryResourceId / primaryResourceUuid / resourceViewId / resourceViewUuid` 没有进入持久化记�?
这会造成 Canvas 内存资源�?asset-center 持久化记�?identity 偏差，必须在本轮修复�?
### 3. �?project 重复绑定�?metadata 固化

核验结果：`成立，但属于当前模型限制`

- `AssetCenterService.bindReference(...)` �?`(domain, entityType, entityId, relation, slot)` 去重
- 同一 `project-level reference` 下，重复绑定不会刷新 metadata
- 这说明当前模型无法表达“同一 project 内多�?board/element 对同一 asset 的多份细粒度上下文�?
但这个问题不是本轮新回归，而是当前 asset-center reference 唯一键设计的边界。若在本轮强行修改，将扩展到 asset-center 核心模型与全链路兼容性，不适合在当前闭环中冒进处理，因此登记为已知风险�?
## 实际变更

### 1. �?attachment 删除路径补统一稳定 key helper

新增 `packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageAttachment.ts`�?
- `resolveCanvasReferenceImageAttachmentId(...)`
- `removeCanvasReferenceImageByAttachmentId(...)`

目的�?
- �?attachment id 生成与删除匹配使用同一规则
- 删除时优先使用稳定资�?key，不再依�?index 位置

### 2. �?CanvasNode 使用统一 attachment helper

更新 `packages/sdkwork-magic-studio-canvas/src/components/CanvasNode.tsx`�?
- attachment id 改为通过 `resolveCanvasReferenceImageAttachmentId(...)` 统一生成
- 删除逻辑改为通过 `removeCanvasReferenceImageByAttachmentId(...)` 基于稳定 key 删除

这修复了 review 发现的高风险回归�?
### 3. registerExistingAsset 合并上传资产 metadata

更新 `packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.ts`�?
- 新增 `normalizePersistedMetadata(...)`
- �?`registerExistingAsset(...)` 时合并：
  - 上传资产既有 metadata
  - `boardId / boardUuid / elementId / source`

这样可以把上传资产已有的 canonical identity 信息写回 asset-center，避免持久化记录重新生成不一�?identity�?
### 4. 补强测试

- 更新 `packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.test.ts`
  - 注册用例现在断言 `registerExistingAsset.metadata` 必须保留上传资产 identity metadata
- 新增 `packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageAttachment.test.ts`
  - 验证 persisted resource 通过稳定 key 删除
  - 验证�?asset-level identity 时仍可通过 runtime uuid 删除

## 测试与验�?
### Red

执行�?
- `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageAttachment.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`

结果�?
- `2 files`
- `1 failed test + 1 failed suite`
- 失败原因�?  - 缺少 `./canvasReferenceImageAttachment` 模块，说�?attachment 删除路径尚未统一
  - `registerExistingAsset(...)` 缺少上传资产 identity metadata

### Green

实现后执行：

- `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageAttachment.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`

结果�?
- `2 files, 5 tests passed`

### Regression

执行扩展后的 Step 03 回归包：

- `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-magiccut/tests/magicCutStoreIdentity.test.tsx packages/sdkwork-magic-studio-magiccut/tests/generatedSelectionImport.test.ts packages/sdkwork-magic-studio-magiccut/tests/magicCutAssetState.test.ts packages/sdkwork-magic-studio-magiccut/tests/trackCoverImport.test.ts packages/sdkwork-magic-studio-assets/tests/assetCenterDeleteSafety.test.ts packages/sdkwork-magic-studio-assets/tests/assetCenterProjectManagedImport.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasImportedAssetResource.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageAttachment.test.ts packages/sdkwork-magic-studio-canvas/src/services/canvasGenerationService.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasGeneratedOutcomeResource.test.ts packages/sdkwork-magic-studio-canvas/src/services/canvasToCutConverter.test.ts packages/sdkwork-magic-studio-film/tests/generatedSelectionAssetImport.test.ts packages/sdkwork-magic-studio-assets/tests/generatedSelectionAsset.test.ts packages/sdkwork-magic-studio-assets/tests/generatedSelectionAssetPersistence.test.ts packages/sdkwork-magic-studio-assets/tests/generatedOutcomeAssetPersistence.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`

结果�?
- `16 files, 76 tests passed`

### Typecheck 尝试

执行�?
- `pnpm.cmd exec tsc --skipLibCheck --ignoreConfig --noEmit --jsx react-jsx --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageAttachment.ts packages/sdkwork-magic-studio-canvas/src/components/CanvasNode.tsx`

结果�?
- `FAIL`
- blocker�?  - `packages/sdkwork-magic-studio-core/src/sdk/assetCenterClient.ts`
  - 缺少 `retired generic app SDK/api/asset-center`
  - 缺少 `retired generic app SDK/api/upload`
  - 缺少 `retired generic app SDK/http/client`
  - 缺少 `retired generic app SDK/types/common`

判定�?
- 本轮新增代码未再引入新的本地类型错误
- 当前剩余失败仍然来自既有共享 SDK 类型声明缺失

## 检查点结果

### CP03-1 统一资产 identity 与目录策略冻�?
- 结果：`IMPROVED`
- 说明：本轮在不改 asset-center 核心模型的前提下，补齐了注册路径对上传资�?identity metadata 的保留能力�?
### CP03-2 三大引擎主引用切换到 canonical asset

- 结果：`IMPROVED`
- 说明：Canvas reference image 不仅接入�?persisted reference 主干，还修复了持久化记录与运行时资源 identity 可能漂移的问题�?
### CP03-3 删除前引用阻断能力是否真实可落地

- 结果：`IMPROVED`
- 说明：reference image 现在既能被正确登记，也能被正确移除，Canvas 节点参考图主链路不再存在“可加不可删”的回归�?
### CP03-4 是否允许进入下一�?
- 结果：`NO`
- 说明：本轮只能定义为 `Step 03 第十四轮局部闭环`，不能宣�?`Step 03 完成`，也不满�?`alpha` 升级条件�?
## 残余风险 / Blocker

- 同一 project 下同一 asset 被多�?board/element 复用时，当前 `bindReference(...)` 的唯一键模型无法表达多份细粒度上下文；这是既有架构限制，不是本轮新回归
- Canvas 其他导入入口�?`ChooseAsset` 消费链仍可能存在同类 persisted reference 盲区
- `ChooseAsset` �?node/web 平台隔离尚未完成
- 共享 `retired generic app SDK/*` 类型声明缺失仍阻塞定�?`tsc`

## 下一轮建�?
1. 继续停留�?`Step 03`
2. 优先审计 Canvas 其他入口�?`ChooseAsset` 消费�?3. 若要解决“同 project 多上下文复用同一 asset”的问题，应单独开�?asset-center reference 唯一键模型调整，不与当前局部闭环混�?
## 自我反证结论

- 本轮不是简单跟�?review 意见机械改动，而是对每条意见做了代码级验真后再修复
- 本轮修掉的是已被证实的功能回归与 identity 一致性问�?- 对于重复绑定 metadata 固化问题，本轮明确将其识别为现有模型约束并登记风险，而不是误报为“已解决�?
