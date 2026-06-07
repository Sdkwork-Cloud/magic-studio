# 2026-04-07 Step 03 Canvas reference image 项目级引用登记补�?
## Step / Wave

- 当前 Step: `03-资产中心与本地存储闭环`
- 当前 Wave: `Wave A / 共享主干收敛`

## 本轮目标

继续执行 `docs/prompts/反复执行Step指令.md`，保持停留在 `Step 03`，关�?`Canvas reference image` 本地上传 helper 绕开 asset-center persisted reference 主干的真实缺口�?
本轮目标聚焦三点�?
1. 修复 `importCanvasReferenceImageFile(...)` 在本地参考图上传后只完成 SDK 导入、却没有登记项目�?persisted reference 的问题�?2. 让已经存在于 asset-center 的参考图资产在再次导入时�?`bindReference(...)`，而不是重复停留在“仅返回 URL”层�?3. �?`CanvasNode` 在上传参考图时显式透传 `board / element / source` 上下文，避免后续引用审计只有项目级粗粒度信息�?
## 背景与问�?
此前 `packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.ts` 的行为非常轻�?
- 只调�?`importAssetBySdk(...)`
- 只调�?`resolveAssetPrimaryUrlBySdk(...)`
- 只返�?`CanvasMediaResource`
- 完全没有 `assetCenterService.initialize(...)`
- 完全没有 `findById(...)`
- 完全没有 `registerExistingAsset(...)`
- 完全没有 `bindReference(...)`

这导致：

- Canvas 节点能显示参考图
- �?asset-center 不知道这些参考图已经被当前项目持久化引用
- 删除前引用阻断能力无法真实覆�?Canvas reference image 入口
- 后续引用审计缺少 `board / element / source` 级别的消费线�?
## 设计决策

本轮没有新开抽象，也没有改全局 SDK 签名，而是沿用 `Film` / `MagicCut TrackCover` 已验证过的最小模式：

1. persisted reference 继续采用 `project-level reference`
   - `domain: 'canvas'`
   - `entityType: 'project'`
   - `entityId: workspaceScope.projectId`
   - `relation: 'reference'`
   - `slot: 'reference-image'`
2. 业务细节通过 metadata 落地
   - `boardId`
   - `boardUuid`
   - `elementId`
   - `source`
3. UI 层只负责透传上下�?   - helper 内部统一处理 `scope / reference / locator / timestamp`
4. 不扩到其�?Canvas 导入入口
   - 只关�?`reference image` 这一条真实缺�?
这个设计保持了：

- 高内聚：引用持久化逻辑全部收敛�?helper
- 低耦合：UI 不感�?asset-center 细节
- 可扩展：后续其他 Canvas 入口可沿用相同模�?- 可审计：引用记录具备项目级与节点级上下文

## 实际变更

### 1. 测试先行，锁定真实失败点

更新 `packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.test.ts`，新增两�?RED 用例�?
- `registers project-level persisted references for uploaded canvas reference images that are not yet indexed`
- `binds project-level persisted references for uploaded canvas reference images that already exist in asset center`

两条用例分别验证�?
- 资产未入索引时必�?`registerExistingAsset(...)` 并附�?`references`
- 资产已入索引时必�?`bindReference(...)`

首轮 RED 失败原因是统一且干净的：

- `assetCenterService.initialize(...)` 调用次数�?`0`

这证明原 helper 完全没有进入 persisted reference 主干�?
### 2. �?helper 内补齐持久化引用闭环

更新 `packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.ts`�?
- 新增 `CanvasReferenceImageImportContext`
- 新增 context metadata 归一化逻辑
- 新增 Canvas 引用 scope / project reference / locator / timestamp 解析
- 新增 `persistCanvasReferenceImage(...)`
  - 资产已入索引：`bindReference(...)`
  - 资产未入索引：`registerExistingAsset(...)` 并附�?`references`
- `importCanvasReferenceImageFile(...)` 在返回资源前统一执行上述持久化逻辑

### 3. �?CanvasNode 调用侧补业务上下�?
更新 `packages/sdkwork-magic-studio-canvas/src/components/CanvasNode.tsx`�?
- �?store 读取 `activeBoard`
- 上传参考图时透传�?  - `boardId`
  - `boardUuid`
  - `elementId`
  - `source: 'canvas-reference-image-upload'`

这样生成�?persisted reference 不再只有粗粒度项目信息，而能追溯到当�?board �?node�?
## 测试与验�?
### Red

执行�?
- `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`

结果�?
- `1 file`
- `3 tests | 2 failed`
- 失败原因�?  - 未入索引的本地参考图导入路径没有进入 `assetCenterService.initialize(...)`
  - 已入索引的本地参考图导入路径没有进入 `assetCenterService.initialize(...)`

### Green

实现后执行：

- `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`

结果�?
- `1 file, 3 tests passed`

### Regression

执行 Step 03 主题回归包：

- `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-magiccut/tests/magicCutStoreIdentity.test.tsx packages/sdkwork-magic-studio-magiccut/tests/generatedSelectionImport.test.ts packages/sdkwork-magic-studio-magiccut/tests/magicCutAssetState.test.ts packages/sdkwork-magic-studio-magiccut/tests/trackCoverImport.test.ts packages/sdkwork-magic-studio-assets/tests/assetCenterDeleteSafety.test.ts packages/sdkwork-magic-studio-assets/tests/assetCenterProjectManagedImport.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasImportedAssetResource.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.test.ts packages/sdkwork-magic-studio-canvas/src/services/canvasGenerationService.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasGeneratedOutcomeResource.test.ts packages/sdkwork-magic-studio-canvas/src/services/canvasToCutConverter.test.ts packages/sdkwork-magic-studio-film/tests/generatedSelectionAssetImport.test.ts packages/sdkwork-magic-studio-assets/tests/generatedSelectionAsset.test.ts packages/sdkwork-magic-studio-assets/tests/generatedSelectionAssetPersistence.test.ts packages/sdkwork-magic-studio-assets/tests/generatedOutcomeAssetPersistence.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`

结果�?
- `15 files, 74 tests passed`

### Typecheck 尝试

执行�?
- `pnpm.cmd exec tsc --skipLibCheck --ignoreConfig --noEmit --jsx react-jsx --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.ts packages/sdkwork-magic-studio-canvas/src/components/CanvasNode.tsx`

结果�?
- `FAIL`
- blocker�?  - `packages/sdkwork-magic-studio-core/src/sdk/assetCenterClient.ts`
  - 缺少 `retired generic app SDK/api/asset-center`
  - 缺少 `retired generic app SDK/api/upload`
  - 缺少 `retired generic app SDK/http/client`
  - 缺少 `retired generic app SDK/types/common`

判定�?
- 本轮新增的本地类型错误已修复
- 当前剩余失败来自既有共享 SDK 类型声明缺失，不属于本轮新回�?
## 检查点结果

### CP03-1 统一资产 identity 与目录策略冻�?
- 结果：`PARTIAL`
- 说明：本轮没有新�?identity 规范，而是�?Canvas reference image helper 正式接入既有 asset-center 引用主干�?
### CP03-2 三大引擎主引用切换到 canonical asset

- 结果：`IMPROVED`
- 说明：Canvas reference image 入口此前只完�?SDK 导入�?URL 解析；本轮补齐项目级 persisted reference 注册/绑定，首次进入统一资产主协议�?
### CP03-3 删除前引用阻断能力是否真实可落地

- 结果：`IMPROVED`
- 说明：Canvas reference image 上传链路现在能把资产登记到项目级 persisted reference，并携带 `board / element / source` 元数据，删除前引用阻断首次真实覆盖到 Canvas 节点参考图入口�?
### CP03-4 是否允许进入下一�?
- 结果：`NO`
- 说明：本轮只能定义为 `Step 03 第十三轮局部闭环`，不能宣�?`Step 03 完成`，也不满�?`alpha` 升级条件�?
## 风险 / Blocker

- Canvas 其他导入入口�?`ChooseAsset` 消费链仍可能存在同类 persisted reference 盲区
- `ChooseAsset` �?node/web 平台隔离尚未完成
- 共享 `retired generic app SDK/*` 类型声明缺失仍阻塞定�?`tsc`

## 下一轮建�?
1. 继续停留�?`Step 03`
2. 优先审计 Canvas 其他导入入口�?`ChooseAsset` 消费链的 persisted reference 缺口
3. 若同类逻辑再次集中出现，再基于现有证据提炼通用“导入后引用持久化�?helper

## 自我反证结论

- 本轮不是只补文档，因�?helper 的生产行为已真实进入 asset-center persisted reference 主干
- 本轮也不�?Canvas 资产治理全部完成，因为当前只关闭�?`reference image` 这一条真实入�?- 本轮新增的真实能力是�?  - Canvas 本地参考图上传在资产未入索引时会完成注册并带上项目�?persisted reference
  - Canvas 本地参考图上传在资产已入索引时会补 `bindReference(...)`
  - Canvas persisted reference 具备 `board / element / source` 上下文，可支撑后续审计与删除保护
