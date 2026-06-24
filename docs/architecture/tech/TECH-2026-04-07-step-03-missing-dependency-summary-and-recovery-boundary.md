> Migrated from `docs/review/2026-04-07-step-03-missing-dependency-summary-and-recovery-boundary.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 2026-04-07 Step 03 missing dependency summary and recovery boundary

## Step / Wave

- Current Step: `Step 03`
- Current Wave: `Wave A / 工具链阻塞项治理`
- Review Scope: �?`repair:deps` 的缺口输出从“原�?missing 列表”升级为“可执行恢复 summary”，并验�?repo-local relink 的剩余边�?
## 当前输入

- 已存在的 `repair-workspace-node-modules.mjs`
- 已验证可用的 `test:vitest:safe`
- 当前真实工作�?`repair:deps` 输出：`missingCount=75`、`ambiguousCount=6`

## 本步非目�?
- 不在这一轮直接补齐全�?actionable 缺包
- 不宣称整�?`test / typecheck / build` 已恢�?- 不把 Step 03 提前宣布完成

## 本步最小输�?
- 脚本能把缺口分解�?actionable �?platform-optional
- 缺口项保�?`optional` 语义
- 输出能直接用于下一轮恢复优先级决策
- 给出“当�?workspace 内是否还有可继续 relink 的本地副本”的实证结论

## 问题定义

在上一轮之后，`repair:deps` 虽然已经是正式工作流入口，但仍然存在一个决策级缺口：它输出的是一长串扁平 `missing` 列表，人工需要自己区分：

1. 哪些只是当前平台无关的可选二进制噪声
2. 哪些才是真正阻塞当前 workspace �?actionable 缺口
3. 哪些依赖可能已经散落在当前仓库其�?`node_modules` 中，理论上还能继续扩大自�?relink

如果不先补这一层，后续 Step 只能停留在“继续看列表”的状态，无法进入可治理执行态�?
## 设计决策

### 决策 1：保�?`optional` 语义

- 结论：缺口项必须包含 `optional`
- 理由：transitive optional binaries �?required packages 必须从数据结构上分开，否则无法做可靠分类

### 决策 2：分类逻辑直接写入修复脚本

- 结论：不额外做一份临时分析文档脚本，而是�?`repair-workspace-node-modules.mjs` 内直接提�?`summarizeMissingDependencies(...)`
- 理由：这不是一次性分析，而是后续每轮 Step 都会复用的工程能�?
### 决策 3：先验证 repo-local relink 是否还有剩余空间

- 结论：对当前 actionable 包做工作区内部定向扫�?- 理由：如果当�?repo 已经没有这些包的本地副本，下一轮就不应该继续在 relink 自动化上浪费时间

## 实施内容

### 脚本增强

- `scripts/repair-workspace-node-modules.mjs`
  - 新增 `classifyMissingDependency(...)`
  - 新增 `summarizeMissingDependencies(...)`
  - `repairWorkspaceNodeModules(...)` 新增 `missingSummary`
  - transitive 缺口项保�?`optional`

### 测试增强

- `scripts/__tests__/repair-workspace-node-modules.test.ts`
  - 新增缺口分类测试
  - 新增 `missingSummary` 存在性断言

## 验证证据

### 单测

- `node node_modules/vitest/vitest.mjs run --config tests/vitest.codex.config.mjs --configLoader native --pool threads --maxWorkers 1 --exclude ".worktrees/**" scripts/__tests__/repair-workspace-node-modules.test.ts`
  - 结果：`1 file, 4 tests passed`

### 回归�?
- `pnpm.cmd run test:vitest:safe -- scripts/__tests__/run-vitest-safe.test.ts scripts/__tests__/ensure-workspace-node-modules.test.ts scripts/__tests__/repair-workspace-node-modules.test.ts tests/testRunnerBoundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/VoiceLeftGeneratorPanel.boundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/voicespeaker/VoiceLabModal.boundary.test.ts packages/sdkwork-magic-studio-character/src/components/CharacterLeftGeneratorPanel.boundary.test.ts`
  - 结果：`7 files, 18 tests passed`

### 真实工作区结�?
- `pnpm.cmd run repair:deps`
  - 结果�?    - `totalCount: 75`
    - `actionableCount: 23`
    - `platformOptionalCount: 52`
    - `actionableUniqueCount: 21`
    - `platformOptionalUniqueCount: 51`

### repo-local relink 边界验证

- 定向扫描当前 workspace �?`packages/**/node_modules/**`
  - 结果：`hitCount: 0`

## 评审结论

### 已关闭的缺口

- `repair:deps` 不再只给出扁平噪声列�?- 当前平台无关的可选二进制缺口已从 blocker 视角中剥�?- 下一轮恢复工作可以围�?`21` 个唯一 actionable 包展开
- 已验证当前工作区内部不存在这�?actionable 包的可复用本地副�?
### 仍未关闭的缺�?
- actionable 缺口本身仍然存在
- 这些缺口尚未被恢复到可运行状�?- Step 03 仍未达到能力完工 bar

## Blocker 等级

- 当前 blocker 等级：`B4`
- 理由：属于真实依赖缺失，直接阻塞更大范围测试和构建验证，不能通过跳过或弱化验证绕�?
## 是否允许继续推进

- 允许继续推进到下一�?blocker 治理
- 不允许宣�?Step 03 完成
- 不允许宣布整库恢�?
## 下一轮最优动�?
1. 先恢复根级直接缺包，再观�?`actionableUniqueCount` 是否下降�?2. 如果当前环境不允许补包，则应�?Step 文档中把该问题升级为明确�?external/environmental blocker，而不是继续反复重�?relink�?
