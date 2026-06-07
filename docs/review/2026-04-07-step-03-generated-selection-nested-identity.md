# 2026-04-07 Step 03 生成结果嵌套身份收敛

## Step / Wave

- 当前 Step: `03-资产中心与本地存储闭环`
- 当前 Wave: `Wave A / 共享主干收敛`

## 本轮目标

继续按照 `docs/prompts/反复执行Step指令.md` 执行 `Step 03`，本轮选择一个更贴近实际用户入口的共享断点收口：

1. `ChooseAsset` 接入 AI 生成结果时，会调�?`toAssetFromGeneratedSelection(...)` 把生成结果临时投影为资产实体�?2. 如果生成结果只把 canonical 身份下沉在嵌�?`resource.metadata` 中，而顶层只保留 `selection.key / uuid / 临时 url`，当前投影逻辑会退化为临时 key 和临�?uuid�?3. 这会让后续链路继续围绕临时选择结果工作，而不是围�?canonical `assetId / assetUuid / primaryResourceId / resourceViewId` 工作，违�?`Step 03` 的主引用收敛目标�?
## 实际缺口

修复前，`packages/sdkwork-magic-studio-assets/src/components/generate/generatedSelectionAsset.ts` 只读取生成结果顶层字段：

- `selection.assetId`
- `selection.assetUuid`
- `selection.primaryResourceId`
- `selection.primaryResourceUuid`
- `selection.resourceViewId`
- `selection.resourceViewUuid`

但不会继续读取：

- `selection.resource.assetId`
- `selection.resource.assetUuid`
- `selection.resource.primaryResourceId`
- `selection.resource.primaryResourceUuid`
- `selection.resource.resourceViewId`
- `selection.resource.resourceViewUuid`
- `selection.resource.metadata.*`

因此在“顶层字段未回填、但嵌套 `resource.metadata` 已经�?canonical 身份”的真实场景下，会出现：

- `id` 退�?`selection.key`
- `uuid` 退�?`artifact uuid`
- metadata �?canonical identity 为空
- 上游 UI/后续流程继续把临�?selection 当成主对�?
## 实际变更

### 1. 共享投影入口增加嵌套身份解析

- 更新 `packages/sdkwork-magic-studio-assets/src/components/generate/generatedSelectionAsset.ts`
- 新增 `resolveSelectionIdentity(...)`
- 解析优先级保持为�?  - 顶层 canonical 字段优先
  - 其次读取 `resource` 直挂字段
  - 最后读�?`resource.metadata`

### 2. 保持原有主键语义，只�?canonical 身份来源

- `id` 仍然保持“优先使�?canonical `assetId`，否则退�?selection 自身标识”的既有设计
- 没有�?`primaryResourceId / resourceViewId` 强行提升为主资产 id
- 避免把资源视�?id 误当成资�?id

### 3. metadata �?uuid 同步收敛

- `AssetMetadata` 现在会正确带出嵌套的�?  - `assetId`
  - `assetUuid`
  - `primaryResourceId`
  - `primaryResourceUuid`
  - `resourceViewId`
  - `resourceViewUuid`
- `uuid` 生成逻辑也改为优先使用收敛后�?identity，而不是只看顶层字�?
## 测试与验�?
### Red

新增回归用例�?
- `packages/sdkwork-magic-studio-assets/tests/generatedSelectionAsset.test.ts`

修复前失败表现：

- 嵌套 `resource.metadata.assetId = asset-nested-3`
- 实际输出却是�?  - `id = selection-nested-3`
  - `uuid = artifact-uuid-3`
  - metadata �?canonical identity 全部为空

这证明共享投影入口在修复前确实丢失了嵌套 canonical 身份�?
### Green

- `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/generatedSelectionAsset.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`1 file, 3 tests passed`

### 扩展验证尝试

本轮尝试继续把同类缺口推进到持久�?消费侧验证时，撞到当前仓库已有的 Vitest 模块解析 blocker�?
- `@sdkwork/magic-studio-core/services`

表现为以下套件当前无法在本地这套最小测试配置中正常装载�?
- `packages/sdkwork-magic-studio-assets/tests/generatedSelectionAssetPersistence.test.ts`
- `packages/sdkwork-magic-studio-assets/tests/chooseAssetIdentity.test.tsx`

�?blocker 不是本轮变更引入，因此本轮未把它混入实现范围，也没有把它误报为“本轮回归失败”�?
## 检查点结果

### CP03-1 资产 identity 主引用收�?
- 结果：`PARTIAL`
- 说明：生成结果到资产实体的共享投影入口已支持嵌套 canonical identity；但持久化链路、引擎导入链路仍需继续收敛�?
### CP03-2 减少临时 URL / 临时 key 主引�?
- 结果：`PARTIAL`
- 说明：本轮已减少 AI 生成结果在共享资产投影阶段继续使�?`selection.key / artifact uuid` 作为主引用的情况，但还没有覆盖所有入口�?
### CP03-3 共享主干可复用�?
- 结果：`YES`
- 说明：修复点落在共享转换主干，而不是单个页面或单个引擎的局部兼容补丁�?
### CP03-4 Step 03 完工判定

- 结果：`NO`
- 说明：本轮只�?`Step 03` 的第三个局部闭环，距离整步完成仍有明显差距�?
## 风险 / Blocker

- `persistGeneratedSelectionAsset(...)` 同类嵌套身份缺口仍值得继续推进，但本轮没有把它和已有测试基础设施 blocker 混在一起�?- `Film / MagicCut / Canvas` 生成结果导入链路仍需继续对齐 `assetId / primaryResourceId / resourceViewId` 写回协议�?- 全仓库级 `retired generic app SDK/*` �?`@sdkwork/magic-studio-core/services` 测试/类型解析问题仍会影响更大范围的自动验证闭环�?
## 下一轮建�?
优先级建议如下：

1. 继续留在 `Step 03`�?2. 以“生成结果嵌套身份写回收敛”为下一轮主题�?3. 优先顺序�?   - 先处�?`persistGeneratedSelectionAsset(...)`
   - 再处�?`MagicCut / Film` 对生成结果的导入转换
   - 最后补消费�?页面侧更大范围回归验�?
## 自我反证结论

- 本轮不是文档层补丁，而是共享代码行为修正�?- 本轮也不�?`Step 03` 完工，只是把“生成结果嵌�?canonical 身份”这个真实缺口从共享资产投影入口处闭环�?- 这类收敛对商业化交付的直接价值在于：
  - 减少临时 selection 标识继续渗透到资产链路
  - 为后续资产中心、工程快照、引擎资源写回建立统一 identity 基线
  - 降低后续跨引擎修复时的重复兼容成�?