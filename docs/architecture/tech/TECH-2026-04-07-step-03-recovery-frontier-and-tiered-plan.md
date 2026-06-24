> Migrated from `docs/review/2026-04-07-step-03-recovery-frontier-and-tiered-plan.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 2026-04-07 Step 03 recovery frontier and tiered plan

## Step / Wave

- Current Step: `Step 03`
- Current Wave: `Wave A / 工具链阻塞项治理`
- Review Scope: �?`repair:deps` 从“可分类缺口”继续推进到“可执行恢复计划”，明确根级目标、transitive frontier、deferred 关系和并行恢�?tier

## 本轮目标

- �?`repair-workspace-node-modules.mjs` 增加结构�?`recoveryPlan`
- 让脚本直接输出：
  - 哪些是根�?production 缺口
  - 哪些是根�?dev 缺口
  - 哪些�?transitive frontier 缺口
  - 哪些�?deferred 缺口
  - 当前缺口可以按哪�?tier 并行恢复

## 实际变更

### 代码

- `scripts/repair-workspace-node-modules.mjs`
  - 新增 `buildMissingDependencyRecoveryPlan(...)`
  - 基于 `missingSummary.actionableDependencies` 推导�?    - `directRootDependencies`
    - `directRootDevDependencies`
    - `transitiveFrontierDependencies`
    - `deferredDependencies`
    - `recoveryTiers`
  - `repairWorkspaceNodeModules(...)` 结果新增 `recoveryPlan`

### 测试

- `scripts/__tests__/repair-workspace-node-modules.test.ts`
  - 新增 tiered recovery plan 断言
  - 新增零缺口场景下 `recoveryPlan` 输出断言

## 运行命令与结果摘�?
### 单测

- `node node_modules/vitest/vitest.mjs run --config tests/vitest.codex.config.mjs --configLoader native --pool threads --maxWorkers 1 --exclude ".worktrees/**" scripts/__tests__/repair-workspace-node-modules.test.ts`
  - 结果：`1 file, 5 tests passed`

### 安全回归�?
- `pnpm.cmd run test:vitest:safe -- scripts/__tests__/run-vitest-safe.test.ts scripts/__tests__/ensure-workspace-node-modules.test.ts scripts/__tests__/repair-workspace-node-modules.test.ts tests/testRunnerBoundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/VoiceLeftGeneratorPanel.boundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/voicespeaker/VoiceLabModal.boundary.test.ts packages/sdkwork-magic-studio-character/src/components/CharacterLeftGeneratorPanel.boundary.test.ts`
  - 结果：`7 files, 19 tests passed`

### 正式工作流入�?
- `pnpm.cmd --silent run repair:deps`
  - 结果：入口成功执行，输出包含新的 `recoveryPlan`

## 新鲜事实

当前真实 workspace 结果为：

- `actionableUniqueCount: 21`
- `frontierUniqueCount: 21`
- `deferredUniqueCount: 0`
- `directRootDependencyCount: 3`
- `directRootDevDependencyCount: 5`
- `transitiveFrontierCount: 13`
- `transitiveDeferredCount: 0`
- `recoveryTierCount: 1`

### 当前根级恢复目标

#### Production

- `jszip@3.10.1`
- `mediabunny@1.40.1`
- `tippy.js@6.3.7`

#### Dev

- `@eslint/js@10.0.1`
- `archiver@7.0.1`
- `png-to-ico@3.0.1`
- `sharp@0.34.5`
- `typescript-eslint@8.58.0`

### 当前 transitive frontier 目标

- `protobufjs`
- `ecdsa-sig-formatter`
- `extend`
- `fast-xml-parser`
- `gcp-metadata`
- `google-logging-utils`
- `jwa`
- `node-fetch`
- `rxjs`
- `safe-buffer`
- `shell-quote`
- `zod`
- `zod-validation-error`

## 评审结论

### 已关闭的缺口

- `repair:deps` 已不只是“可分类缺口”，还可以直接输出恢复前沿与并行恢复 tier
- 根级 production / dev 目标已经�?transitive 噪声中明确拆�?- 当前 actionable 缺口不存在需要等待上游缺口先恢复�?deferred 子集
- 下一轮可以直接把缺口恢复工作拆成并行车道，而不需要继续人工分析依赖嵌套关�?
### 仍未关闭的缺�?
- `21` �?frontier 缺口仍然存在
- 本轮没有真正恢复这些�?- 更大范围�?`test / typecheck / build` 仍未恢复

## Blocker / 风险

- 当前 blocker 等级：`B4`
- 理由：仍然是依赖缺失，直接阻塞更大范围测试和构建
- 风险：如果下一轮不基于 `recoveryPlan` 直接恢复 tier-1 frontier，而继续反复做统计，本 step 会进入平台期

## Bar 判定

- 当前是否达到 `解锁最�?bar`：`部分达到`
  - 说明：当�?blocker 治理链路已进入“可执行恢复计划”状态，�?Step 03 的统一资产能力并未因此闭环
- 当前是否达到 `能力完工 bar`：`未达到`
  - 说明：缺包尚未恢复，整库验证尚未恢复，Step 03 不能宣告完成

## 回写状�?
- `docs/review`：已更新
- `docs/release/CHANGELOG.md`：已更新
- `docs/release/VERSION.md`：已更新
- `docs/release/2026-04-07-v0.1.38-迭代记录.md`：已新增
- `docs/架构`：本轮无需回写
- `docs/step`：本轮无需回写

## 是否允许继续推进

- 允许进入下一�?blocker 治理
- 不允许宣�?Step 03 完成
- 不允许宣布整库恢�?
## 下一轮建�?
1. �?`recoveryPlan.recoveryTiers[0]` 直接恢复当前 `21` �?frontier 缺口，不再重复做依赖嵌套分析�?2. 把当前恢复工作拆成两条并行车道：
   - 车道 A：`3` 个根�?production + `5` 个根�?dev 目标
   - 车道 B：`13` �?transitive frontier 目标
3. 恢复后立即重新执行：
   - `pnpm.cmd --silent run repair:deps`
   - `pnpm.cmd run test:vitest:safe -- ...`
4. 如果当前环境仍不能恢复这�?tier-1 frontier 目标，应将其升级为明确的 `environmental / external` blocker，而不是继续在 repo-local relink 上消耗迭代�?
