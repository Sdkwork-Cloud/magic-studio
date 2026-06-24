> Migrated from `docs/review/2026-04-07-step-03-asset-center-bind-reference-metadata-refresh.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 2026-04-07 Step 03 Asset Center bindReference metadata refresh

## Step / Wave

- 当前 Step: `Step 03`
- 当前 Wave: `Wave A / 共享主干收敛`
- 当前轮次: `第十五轮局部闭环`

## 本轮目标

围绕已明确识别的 Step 03 主干缺口继续收敛�?
1. 证明 asset-center `bindReference(...)` 在同 key persisted reference 重复绑定时，仍然保留�?metadata
2. 用最小改动修复主干语义，不扩散到 Canvas / Film / MagicCut 局�?helper
3. 验证修复对现�?Step 03 链路无回�?
本轮不追�?Step 03 全量完成，只解决一条已�?review 明确指向的核心能力缺口�?
## 根因结论

`AssetCenterService.bindReference(...)` 当前逻辑先用以下 key 做去重：

- `domain`
- `entityType`
- `entityId`
- `relation`
- `slot`

一旦命中同 key reference，旧实现直接返回 `current`，不会把新的 `metadata` 写回资产�?
这意味着同一�?project 下，同一�?asset 如果被新�?`board / element / source` 再次绑定�?persisted reference，资产中心中的引用上下文会永久停留在第一次绑定时的旧值�?
## 设计约束

- 不新增第二条�?key reference，继续保持单�?persisted reference 语义
- 不修�?Canvas / Film / MagicCut 调用约定
- 不修改全局上传或共�?SDK 接口
- 只在 asset-center 主干层解�?reference metadata 刷新问题

## 实施内容

### 1. RED

�?`packages/sdkwork-magic-studio-assets/tests/assetCenterProjectManagedImport.test.ts` 新增用例�?
- 先注册一个已�?project-level reference 的资�?- reference key 固定为：
  - `domain=canvas`
  - `entityType=project`
  - `entityId=proj-1`
  - `relation=reference`
  - `slot=canvas-reference-image`
- 首次 metadata 为旧上下文：
  - `board-old`
  - `board-uuid-old`
  - `element-old`
  - `canvas-node`
- 再次 `bindReference(...)` 时传入同 key，但 metadata 改为�?  - `board-new`
  - `board-uuid-new`
  - `element-new`
  - `choose-asset-dialog`

预期�?
- `references.length === 1`
- 唯一 reference �?metadata 已更新为新上下文

RED 结果�?
- `1 file, 7 tests | 1 failed`
- 失败原因精准指向：旧 metadata 被保�?
### 2. GREEN

�?`packages/sdkwork-magic-studio-assets/src/asset-center/application/AssetCenterService.ts` 做最小修复：

- 抽出 `isSameReferenceBinding(...)`
- 抽出 `mergeReferenceBinding(...)`
- 命中�?key 时，不再保留�?reference 数组
- 改为对命中的单条 reference 做合并更�?- `metadata` 使用浅合并，新值覆盖旧�?
得到的行为：

- �?key persisted reference 不会重复追加
- 最新上下文 metadata 能落�?asset-center 主干资产记录

## 验证结果

### 定向测试

命令�?
```bash
pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/assetCenterProjectManagedImport.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"
```

结果�?
- RED：`1 file, 7 tests | 1 failed`
- GREEN：`1 file, 7 tests passed`

### Step 03 扩展回归

命令�?
```bash
pnpm.cmd exec vitest run packages/sdkwork-magic-studio-magiccut/tests/magicCutStoreIdentity.test.tsx packages/sdkwork-magic-studio-magiccut/tests/generatedSelectionImport.test.ts packages/sdkwork-magic-studio-magiccut/tests/magicCutAssetState.test.ts packages/sdkwork-magic-studio-magiccut/tests/trackCoverImport.test.ts packages/sdkwork-magic-studio-assets/tests/assetCenterDeleteSafety.test.ts packages/sdkwork-magic-studio-assets/tests/assetCenterProjectManagedImport.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasImportedAssetResource.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageAttachment.test.ts packages/sdkwork-magic-studio-canvas/src/services/canvasGenerationService.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasGeneratedOutcomeResource.test.ts packages/sdkwork-magic-studio-canvas/src/services/canvasToCutConverter.test.ts packages/sdkwork-magic-studio-film/tests/generatedSelectionAssetImport.test.ts packages/sdkwork-magic-studio-assets/tests/generatedSelectionAsset.test.ts packages/sdkwork-magic-studio-assets/tests/generatedSelectionAssetPersistence.test.ts packages/sdkwork-magic-studio-assets/tests/generatedOutcomeAssetPersistence.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"
```

结果�?
- `16 files, 77 tests passed`

### 定向 typecheck

主干文件验证�?
```bash
pnpm.cmd exec tsc --skipLibCheck --ignoreConfig --noEmit --jsx react-jsx --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-assets/src/asset-center/application/AssetCenterService.ts
```

结果�?
- `PASS`

Canvas 主题既有 blocker 复核�?
```bash
pnpm.cmd exec tsc --skipLibCheck --ignoreConfig --noEmit --jsx react-jsx --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageAttachment.ts packages/sdkwork-magic-studio-canvas/src/components/CanvasNode.tsx
```

结果�?
- `FAIL`
- blocker 固定�?`packages/sdkwork-magic-studio-core/src/sdk/assetCenterClient.ts`
- 缺失模块�?  - `retired generic app SDK/api/asset-center`
  - `retired generic app SDK/api/upload`
  - `retired generic app SDK/http/client`
  - `retired generic app SDK/types/common`

## 检查点评估

### CP03-1 资产中心是否仍然只保留单条同 key persisted reference

- 结论：`PASS`
- 说明：本轮仍维持单条 reference，不引入重复绑定膨胀

### CP03-2 最�?board / element / source 是否能刷新到 persisted reference

- 结论：`PASS`
- 说明：新�?RED/GREEN 用例已证�?asset-center 主干 metadata 能刷�?
### CP03-3 修复是否影响 MagicCut / Film / Canvas 已收敛链�?
- 结论：`PASS`
- 说明：Step 03 扩展回归 `77/77` 全绿

### CP03-4 Step 03 是否可以宣告完成

- 结论：`NO`
- 原因�?  - `ChooseAsset` node/web �?persisted reference 收口仍未闭环
  - 共享 `retired generic app SDK/*` 类型声明缺失仍阻�?Canvas 主题定向 `tsc`

## 现存风险 / Blocker

- `ChooseAsset` node/web 仍可能绕过完�?persisted reference 收口
- 共享 `retired generic app SDK/*` 缺失继续阻塞部分 UI 主题定向类型验证
- 当前 metadata 更新策略是浅合并；未来若要求显式删除 metadata 字段，需要单独补协议和测�?
## 下一轮建�?
优先保持�?`Step 03`，建议继续按“小而真实的局部闭环”推进：

1. 审计 `ChooseAsset` node/web 入口，确�?persisted reference 是否完整回写 `project-level reference`
2. 如果入口链路已打通，则继续补 UI �?RED/GREEN，验�?board / element 上下文真正贯�?3. 将共�?`retired generic app SDK/*` 缺失从主�?blocker 升级为独立治理项，避免持续阻�?Canvas 主题 `tsc`

