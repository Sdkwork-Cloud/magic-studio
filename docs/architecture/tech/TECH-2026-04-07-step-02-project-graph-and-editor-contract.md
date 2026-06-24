> Migrated from `docs/review/2026-04-07-step-02-project-graph-and-editor-contract.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 2026-04-07 Step 02 ProjectGraph �?Editor 工程协议收敛

## Step / Wave

- 当前 Step: `02-统一项目图谱与工程协议收敛`
- 当前 Wave: `Wave A / 共享主干收敛`

## 本轮目标

在不触碰高风险远端能力和不回退用户现有脏工作区改动的前提下，完�?Step 02 的第一轮真实代码闭环：

1. �?`magiccut` 具备可持久化、可重建、可验证�?canonical `ProjectGraph`
2. �?`editor/projectService` 停止伪�?Git 同步和发布成功，改为显式失败契约
3. 让默认工程、运行态状态、持久化快照三者在 `ProjectGraph` 语义上保持一�?
## 本轮完成�?
### 1. MagicCut canonical ProjectGraph 落地

- 新增 `packages/sdkwork-magic-studio-magiccut/src/store/projectGraph.ts`
- 新增 `buildMagicCutProjectGraph(project, state)`
- 新增 `buildMagicCutPersistedProject(project, normalizedState)`
- �?`timeline / track / clip / resource` 运行态映射为 canonical `ProjectGraphDocument`
- �?`magiccut-project / magiccut-timeline / magiccut-track / magiccut-clip` 建立显式 `surfaceBindings`
- 将资源来源链路写�?`clip.source`，保�?`assetId / primaryResourceId / resourceViewId / sourceRecipeUuid / sourceExecutionUuid / sourceArtifactUuid`

### 2. MagicCut 默认工程、状态归一化、持久化快照对齐

- 更新 `packages/sdkwork-magic-studio-magiccut/src/store/defaultProject.ts`
- 默认工程创建时即携带 canonical `projectGraph`
- 更新 `packages/sdkwork-magic-studio-magiccut/src/store/projectState.ts`
- 当持久化工程缺失 `projectGraph` 时，可基�?`normalizedState` 自动重建
- 更新 `packages/sdkwork-magic-studio-magiccut/src/store/magicCutStore.tsx`
- store �?autosave 快照改为使用 `buildMagicCutPersistedProject(...)`
- 持久化快照不再丢�?`projectGraph`

### 3. Editor 工程操作契约收敛

- 更新 `packages/sdkwork-magic-studio-editor/src/services/projectService.ts`
- 删除假成功路�?- `syncToGitHub` 改为显式抛出未实现错�?- `publishApp` 改为显式抛出未实现错�?- 消除“UI 看起来成功、实际上没有真实后端/平台执行”的虚假闭环

## 检查点结果

### CP02-1 ProjectGraph 结构闭环

- 结果: `PASS`
- 说明: `magiccut` 现在可从默认工程和运行态状态生�?canonical `ProjectGraphDocument`

### CP02-2 运行态与持久化快照一致�?
- 结果: `PASS`
- 说明: 默认工程、状态归一化、store autosave 三个入口均会输出 `projectGraph`

### CP02-3 Editor 工程操作协议真实�?
- 结果: `PASS`
- 说明: `projectService` 不再返回虚假成功结果，前台调用将收到明确未实现错�?
### CP02-4 验证链完整�?
- 结果: `PARTIAL`
- 说明: 定向单测已通过；包�?`tsc -p` 仍被仓库既有外部 SDK 类型缺失阻断，属于本轮范围外 blocker

## 验证命令与结�?
### 通过

- `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-magiccut/tests/magicCutProjectGraph.test.ts packages/sdkwork-magic-studio-magiccut/tests/defaultProject.test.ts packages/sdkwork-magic-studio-editor/src/services/projectService.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads`
  - 结果: `3 files, 6 tests passed`

- `pnpm.cmd exec tsc --ignoreConfig --noEmit --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-editor/src/services/projectService.ts`
  - 结果: `PASS`

### 阻塞

- `pnpm.cmd exec tsc --noEmit -p packages/sdkwork-magic-studio-magiccut/tsconfig.json`
  - 结果: `FAIL`
  - 阻塞原因: 仓库既有 `retired generic app SDK/*` 类型缺失，失败点位于 `packages/sdkwork-magic-studio-core/src/sdk/assetCenterClient.ts`

- `pnpm.cmd exec tsc --noEmit -p packages/sdkwork-magic-studio-editor/tsconfig.json`
  - 结果: `FAIL`
  - 阻塞原因: 同上，属于全仓共享依赖阻塞，不是本轮改动直接引入

- `pnpm.cmd exec tsc --ignoreConfig --noEmit --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-magiccut/src/store/projectGraph.ts`
  - 结果: `FAIL`
  - 阻塞原因: 仓库现有外部声明缺失�?JSX 相关解析链噪音，不是 `projectGraph.ts` 语义错误导致

## 变更文件

- `packages/sdkwork-magic-studio-magiccut/src/store/projectGraph.ts`
- `packages/sdkwork-magic-studio-magiccut/src/store/projectState.ts`
- `packages/sdkwork-magic-studio-magiccut/src/store/defaultProject.ts`
- `packages/sdkwork-magic-studio-magiccut/src/store/magicCutStore.tsx`
- `packages/sdkwork-magic-studio-editor/src/services/projectService.ts`
- `packages/sdkwork-magic-studio-magiccut/tests/magicCutProjectGraph.test.ts`
- `packages/sdkwork-magic-studio-magiccut/tests/defaultProject.test.ts`
- `packages/sdkwork-magic-studio-editor/src/services/projectService.test.ts`
- `tests/vitest.codex.config.mjs`

## 风险与未完成�?
- `magicCutProjectService` 仍是 LocalStorageService 适配，并未升级为真实远端工程服务
- `film / canvas / magiccut` �?ProjectGraph 已形成收敛趋势，但跨域统一读取服务尚未抽象成共�?facade
- `editor` 当前只是纠正了协议真实性，并未接入真实 Git / 发布平台执行�?- 全仓 `typecheck` 仍被共享 SDK 类型缺失阻塞，未满足 alpha 门槛

## 对后�?Step 的影�?
- `Step 03` 可以在真�?`ProjectGraph` 基础上推进统一资产映射和工程读�?- `Step 04` 可以在去�?editor 假成功的前提下安全接入真实工程同�?发布能力
- `Step 05` 之后�?AI、插件、桌面安全改造不再需要担�?`editor` 假闭环掩盖真实风�?
## 并行 / 串行建议

### 可并�?
- `Step 03` 资产中心与工程资源主干收�?- `Step 04` editor 真实 Git / 发布平台执行链落�?- `Step 05` AI 网关与模型调用治�?
### 必须串行

- `editor/projectService` 真实执行链接入必须在协议真实性已经收敛后继续推进，不能回退�?mock
- 任何依赖 `projectGraph` 作为单一事实源的新能力，都必须基于本�?canonical 结构继续扩展，不能再各包各自发明二次图谱

## 自我反证结论

- 本轮不是“补文档”，而是完成�?Step 02 的第一轮真实代码闭�?- 本轮也不�?Step 02 全量完成；真实工程服务、资产主干、AI 治理和桌面权限仍需继续推进
- 但本轮已经把两个最危险的假闭环点拆掉了�?  - `magiccut` 缺少 canonical ProjectGraph
  - `editor` 伪造成�?
