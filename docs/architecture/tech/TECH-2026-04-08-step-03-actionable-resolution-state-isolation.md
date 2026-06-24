> Migrated from `docs/review/2026-04-08-step-03-actionable-resolution-state-isolation.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 2026-04-08 Step 03 actionable resolution state isolation

## Step / Wave

- Current Step: `Step 03`
- Current Wave: `Wave A`
- Review Scope: `repair:deps` 诊断闭环、actionable 依赖缺口视图、平台可选二进制噪声隔离

## Review Goal

确认 `repairWorkspaceNodeModules(...)` 的输出是否已经满�?Step 03 的治理检查点�?
1. unresolved virtual store candidate 不能再被误判为“已解析成功�?2. root / transitive missing 项都必须携带可追踪诊�?3. 真实仓库�?actionable 缺口必须能直接分流为 `manifest-missing` �?`not-found`
4. 平台可选二进制噪声不能污染主修复视�?
## Findings

### 1. 调用侧闭环缺口已经补�?
- root dependency loop 现在会把 `!resolved || !resolved.targetPath` 视为 missing
- transitive dependency loop 现在会把 `!resolved || !resolved.targetPath` 视为 missing
- missing 项新�?`virtualStoreDiagnostics`

这意味着 resolver 已经不再只是内部知道“目录存在但 manifest 缺失”，而是能把该事实传递到最终治理结果�?
### 2. Step 03 诊断输出已经具备可执行边�?
- `repairWorkspaceNodeModules(...)` 现输�?`missingResolutionSummary`
- `summarizeMissingResolutionStates(...)` 默认聚焦 actionable 依赖
- `platformOptionalEntries` 单独保留平台可选噪�?
真实仓库快照结果�?
- actionable 唯一缺口: `11`
- `manifest-missing`: `7`
- `not-found-in-virtual-store`: `4`
- platform-optional 唯一缺口: `51`

### 3. 问题从“排查依赖缺口”升级为“执行缺口清除�?
本轮之后，Step 03 的主要不确定性已不再是诊断能力，而是具体缺口的修复执行策略。当前脚本已经足够支撑下一轮把 `11` �?actionable 依赖�?lane 处理�?
## Verification

### TDD 验证

- `pnpm.cmd run test:vitest:safe -- scripts/__tests__/repair-workspace-node-modules.test.ts`
- 结果: `1 file / 10 tests passed`

### Step 03 安全回归

- `pnpm.cmd run test:vitest:safe -- scripts/__tests__/run-vitest-safe.test.ts scripts/__tests__/ensure-workspace-node-modules.test.ts scripts/__tests__/repair-workspace-node-modules.test.ts tests/testRunnerBoundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/VoiceLeftGeneratorPanel.boundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/voicespeaker/VoiceLabModal.boundary.test.ts packages/sdkwork-magic-studio-character/src/components/CharacterLeftGeneratorPanel.boundary.test.ts`
- 结果: `7 files / 25 tests passed`

### 真实仓库快照

- `repairWorkspaceNodeModules({ workspaceRoot: process.cwd() })`
- 结果:
  - `actionableUniqueCount = 11`
  - `missingResolutionSummary.uniqueDependencyCount = 11`
  - `missingResolutionSummary.manifestMissingUniqueCount = 7`
  - `missingResolutionSummary.notFoundUniqueCount = 4`
  - `missingResolutionSummary.platformOptionalUniqueCount = 51`

## Checkpoint Assessment

### 已通过

- unresolved diagnostic object 能被正确回写�?missing 集合
- actionable / platform-optional 视图已经分离
- Step 03 可以直接读取 actionable 缺口类型分布
- safe Vitest 回归未被破坏

### 未通过

- `11` �?actionable 缺口尚未清零
- full typecheck / full build / Tauri packaging 尚未验证
- workspace 级依赖修复操作仍未进入串行执行阶�?
## Execution Advice

### 可以并行的工�?
- �?`7` �?`manifest-missing` 缺口做只读取证和修复方案设计
- �?`4` �?`not-found` 缺口做来源追踪和 lockfile / store 关系分析
- 为每个缺口补�?consumer map、风险等级和回归测试清单

### 只能串行的工�?
- 所�?root 级安装、重建、锁文件写操�?- `repair:deps` 的真实修复执�?- typecheck / build / package 级最终验�?
## Verdict

本轮 Step 03 结果满足“治理基线稳定、可继续实施”的要求，但不满足“依赖缺口已消除、可升级阶段门”的要求。结论维持为�?
- Release Stage: `internal`
- Step 03 Status: `治理闭环完成，缺口清除未完成`
- Next Focus: `执行 11 �?actionable 缺口的串并行修复计划`

