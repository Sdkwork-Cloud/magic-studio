> Migrated from `docs/review/2026-04-07-step-03-offline-install-no-go-and-safe-runner-recovery.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 2026-04-07 Step 03 offline install no-go and safe runner recovery

## Step / Wave

- Current Step: `Step 03`
- Current Wave: `Wave A / 工具链阻塞项治理`
- Review Scope: 对当�?workspace root 的离线安装恢复路径做真实实证，并收回这次尝试带来�?`repair:deps` �?`test:vitest:safe` 回归

## 本轮目标

1. 验证 `CI=true + pnpm install --offline --ignore-scripts --frozen-lockfile --filter .` 是否能作为当�?Step 03 的真实恢复路径�?2. 如果失败，明确失败层级、影响范围和 No-Go 结论�?3. 把这次恢复尝试引入的回归收回到稳定状态�?
## 实际变更

### 实证动作

- 执行当前 workspace root 的离线、冻结、禁脚本、`--filter .` 安装恢复尝试
- 对尝试后�?`repair:deps` �?`test:vitest:safe` 做新鲜复�?
### 代码修复

- `scripts/repair-workspace-node-modules.mjs`
  - 修复预发布范围比较逻辑，避�?`^4.0.0-rc.1` 错误拒绝稳定�?`4.0.0`
- `scripts/run-vitest-safe.mjs`
  - 固定默认 config �?`tests/vitest.codex.config.mjs`
- `scripts/__tests__/repair-workspace-node-modules.test.ts`
  - 新增预发布范围回归用�?- `scripts/__tests__/run-vitest-safe.test.ts`
  - 新增 safe runner 默认 config 断言

## 运行命令与结果摘�?
### 失败路径验证

- `pnpm.cmd install --offline --ignore-scripts --frozen-lockfile --filter . --reporter append-only`
  - 结果：`ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`
- `$env:CI='true'; pnpm.cmd install --offline --ignore-scripts --frozen-lockfile --filter . --reporter append-only`
  - 结果：超时，进入 `node_modules` 重建阶段

### 回归影响验证

超时后立即复核发现：

- `repair:deps` �?`21` 个唯一 actionable frontier 膨胀�?`22`
- 新增缺口：`vitest -> std-env`
- `test:vitest:safe` 失败，错误链路包含：
  - `Cannot find package 'std-env'`
  - 回退到仓库根 `vite.config.ts`
  - 触发 `tailwindcss/oxide` �?`spawn EPERM`

### 根因验证

- `.pnpm` 中实际已存在�?  - `std-env@3.10.0`
  - `std-env@4.0.0`
- `node_modules/std-env` 初始缺失
- 说明问题不是“本机完全没�?std-env”，而是 `repair:deps` 的版本比较逻辑错误，导致稳定版 `4.0.0` 未被识别为满�?`^4.0.0-rc.1`

### 修复后验�?
- `node node_modules/vitest/vitest.mjs run --config tests/vitest.codex.config.mjs --configLoader native --pool threads --maxWorkers 1 --exclude ".worktrees/**" scripts/__tests__/run-vitest-safe.test.ts scripts/__tests__/repair-workspace-node-modules.test.ts tests/testRunnerBoundary.test.ts`
  - 结果：`3 files, 14 tests passed`
- `pnpm.cmd run test:vitest:safe -- scripts/__tests__/run-vitest-safe.test.ts scripts/__tests__/ensure-workspace-node-modules.test.ts scripts/__tests__/repair-workspace-node-modules.test.ts tests/testRunnerBoundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/VoiceLeftGeneratorPanel.boundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/voicespeaker/VoiceLabModal.boundary.test.ts packages/sdkwork-magic-studio-character/src/components/CharacterLeftGeneratorPanel.boundary.test.ts`
  - 结果：`7 files, 21 tests passed`
- `pnpm.cmd --silent run repair:deps`
  - 结果�?    - `actionableUniqueCount: 21`
    - `frontierUniqueCount: 21`
    - `std-env` 已退�?frontier

## 评审结论

### 已关闭的缺口

- 已完成当�?offline root install 路径的真实实证，不再停留在猜�?- 已修�?`repair:deps` 的预发布 semver 比较缺口
- 已修复本轮尝试引发的 `test:vitest:safe` 回归
- 当前测试入口已恢复到可运行状�?
### 仍未关闭的缺�?
- 当前 `21` �?frontier 缺口仍然存在
- 本轮没有实际补齐这些缺包
- 整库 `test / typecheck / build` 仍未恢复

## Blocker / 风险

- 当前 blocker 等级：`B4`
- blocker 类型�?  - `environmental`：`pnpm install` �?non-TTY / 超时问题
  - `internal`：`repair:deps` �?semver 比较缺口�?safe runner 默认入口过宽
- 当前 No-Go 结论�?  - `CI=true + pnpm install --offline --ignore-scripts --frozen-lockfile --filter .` 不是当前环境下的安全默认恢复路径
  - 继续沿该路径推进，存在再次破坏测试入口的风险

## Bar 判定

- 当前是否达到 `解锁最�?bar`：`部分达到`
  - 说明：已验证并标记一�?No-Go 路径，且已恢复测试入�?- 当前是否达到 `能力完工 bar`：`未达到`
  - 说明：frontier 缺口未补齐，Step 03 仍不能宣告完�?
## 回写状�?
- `docs/review`：已更新
- `docs/release/CHANGELOG.md`：已更新
- `docs/release/VERSION.md`：已更新
- `docs/release/2026-04-07-v0.1.39-迭代记录.md`：已新增
- `docs/架构`：本轮无需回写
- `docs/step`：本轮无需回写

## 是否允许继续推进

- 允许继续推进 Step 03 blocker 治理
- 不允许把当前 offline root install 路径继续当成默认恢复主路�?- 不允许宣�?Step 03 完成

## 下一轮建�?
1. 放弃当前离线 root install 默认路线，避免再次触�?`node_modules` 重建与测试入口回归�?2. 围绕剩余 `21` �?frontier 缺口设计更小范围、更可回滚的恢复动作�?3. 若要再次尝试恢复，必须先定义�?   - 写入边界
   - 回滚动作
   - 成功判据
   - 失败后的 blocker 升级规则

