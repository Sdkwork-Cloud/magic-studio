> Migrated from `docs/review/2026-04-07-step-03-safe-vitest-runner-and-deps-governance.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 2026-04-07 Step 03 safe vitest runner and dependency repair governance

## Step / Wave

- Current Step: `Step 03`
- Current Wave: `Wave A / 工具链阻塞项治理`
- Review Scope: 将已验证可用�?sandbox-safe Vitest 链路�?workspace 依赖修复能力沉淀为正式工程入�?
## 背景与问题定�?
本轮不是重新分析一个未知问题，而是在已有根因基础上继续推进落地治理�?
- 已知根因 1：Windows sandbox �?`vite` 在路径优化阶段会触发 `exec("net use")`，继而命�?`spawn cmd.exe EPERM`
- 已知根因 2：根�?`pnpm install` 会沿 `pnpm-workspace.yaml` 扩散到外�?workspace，不适合作为当前目录的常规修复动�?- 已知缺口 1：`preflight:deps` 只会报错，但没有把“先 relink、再 install”的处置路径产品�?- 已知缺口 2：最初内联到 `package.json` �?`test:vitest:safe` 虽然可跑，但 `pnpm run ... -- <files>` �?Windows 下会把前�?`--` 原样传入，导致文件过滤不稳定，误跑整套用�?
## 设计决策

### 决策 1：把依赖修复能力做成正式入口

- 结论：新�?`repair:deps`
- 理由：`repair-workspace-node-modules.mjs` 已经具备工程价值，继续停留在“会话级临时命令”会让后�?Step 执行不可重复

### 决策 2：preflight 保持只读，不做隐式修�?
- 结论：`preflight:deps` 只负责检测与引导
- 理由：在当前 workspace 存在大量用户修改和跨 workspace 依赖的前提下，预检阶段自动写盘会放大不可控�?
### 决策 3：用单独 Node 包装器承接安�?Vitest 入口

- 结论：新�?`scripts/run-vitest-safe.mjs`
- 理由：把安全参数、参数清洗、进程启动策略集中治理，避免继续依赖 package script 的壳层拼接行�?
### 决策 4：把参数转发问题纳入回归测试

- 结论：新�?`scripts/__tests__/run-vitest-safe.test.ts`
- 理由：如果没有针�?`pnpm --` 分隔符的回归测试，同类问题会在后续脚本演进中再次出现

## 实施内容

### 代码与脚�?
- `.gitignore`
  - 放行 `scripts/run-vitest-safe.mjs`
  - 放行 `docs/release/*.md`
- `package.json`
  - 新增 `repair:deps`
  - 新增 `test:safe`
  - 调整 `test:vitest:safe` �?`node scripts/run-vitest-safe.mjs`
- `scripts/run-vitest-safe.mjs`
  - 统一注入 safe flags
  - 统一清洗前导 `--`
  - 使用 `process.execPath` 直接启动 `vitest.mjs`
- `scripts/ensure-workspace-node-modules.mjs`
  - 异常提示升级为“先 `repair:deps`，再当前 workspace 定点 install�?
### 测试

- `scripts/__tests__/run-vitest-safe.test.ts`
  - 校验 safe flags 组装顺序
  - 校验前导 `--` 会被正确剔除
  - 校验 vitest 入口路径解析
- `scripts/__tests__/ensure-workspace-node-modules.test.ts`
  - 校验异常消息包含 `pnpm run repair:deps`
  - 校验异常消息保留 `pnpm install --frozen-lockfile`
- `tests/testRunnerBoundary.test.ts`
  - 校验仓库存在正式�?safe Vitest 运行脚本

## 验证证据

### 单测与边界测�?
- `node node_modules/vitest/vitest.mjs run --config tests/vitest.codex.config.mjs --configLoader native --pool threads --maxWorkers 1 --exclude ".worktrees/**" scripts/__tests__/run-vitest-safe.test.ts scripts/__tests__/ensure-workspace-node-modules.test.ts scripts/__tests__/repair-workspace-node-modules.test.ts tests/testRunnerBoundary.test.ts`
  - 结果：`4 files, 14 tests passed`

### 正式脚本回归

- `pnpm.cmd run test:vitest:safe -- scripts/__tests__/run-vitest-safe.test.ts scripts/__tests__/ensure-workspace-node-modules.test.ts scripts/__tests__/repair-workspace-node-modules.test.ts tests/testRunnerBoundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/VoiceLeftGeneratorPanel.boundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/voicespeaker/VoiceLabModal.boundary.test.ts packages/sdkwork-magic-studio-character/src/components/CharacterLeftGeneratorPanel.boundary.test.ts`
  - 结果：`7 files, 17 tests passed`
  - 证明：新�?`test:vitest:safe` 已能够通过正式 package script 入口稳定转发文件过滤，不再误跑整�?
### 依赖修复入口验证

- `pnpm.cmd run repair:deps`
  - 结果：命令成功执�?- `node --input-type=module -e "import { repairWorkspaceNodeModules } from './scripts/repair-workspace-node-modules.mjs'; const result = repairWorkspaceNodeModules(); console.log(JSON.stringify({ workspaceExisting: result.workspaceExisting, regularExisting: result.regularExisting, transitiveCreated: result.transitiveCreated, transitiveExisting: result.transitiveExisting, missingCount: result.missing.length, ambiguousCount: result.ambiguous.length }, null, 2));"`
  - 结果�?    - `workspaceExisting: 39`
    - `regularExisting: 101`
    - `transitiveCreated: 0`
    - `transitiveExisting: 0`
    - `missingCount: 75`
    - `ambiguousCount: 6`

### 交付可追踪性验�?
- `git status --short -- .gitignore package.json scripts/run-vitest-safe.mjs docs/release/CHANGELOG.md docs/release/VERSION.md docs/release/2026-04-07-v0.1.36-迭代记录.md`
  - 结果：本轮新增的安全运行器和 release 文档已进入版本控制候选集

## 评审结论

### 已关闭的能力缺口

- 依赖修复从“手工临时操作”升级为正式脚本入口
- 安全 Vitest 从“会话级命令”升级为正式 package script 入口
- `pnpm run ... -- <files>` 的参数转发不稳定问题已被代码和测试共同收�?- preflight 的处置建议已经具备工程治理语义，而不是单一地要�?reinstall

### 未关闭的能力缺口

- 当前 `.pnpm` 存量仍不完整，`repair:deps` 无法补齐不存在于虚拟仓的�?- 仍未恢复整库 `test / typecheck / build`
- Step 03 尚未完成，不能对外宣�?`alpha`

## 建议的下一轮并行拆�?
### 可并行执�?
1. 依赖恢复子任�?   - 基于 `missingCount=75` 生成分类清单
   - 区分“平台可选包 / 当前平台必需�?/ 真正缺失包�?2. 回归扩容子任�?   - �?`test:vitest:safe` 为统一入口，按模块逐步扩大 targeted regression 集合
3. 失败测试分流子任�?   - 针对当前整库里与本轮无关的失败测试，建立独立 blocker 清单，避免阻�?Step 主线

### 必须串行执行

1. 当前 workspace `.pnpm` 存量恢复策略确认
2. 恢复后重新执行更大范围验�?3. 基于验证结果更新 Step 03 完成度与 release 文档

## 审核结论

本轮修改专业、克制且方向正确，真正解决的是“如何把已经验证可用的手工方案沉淀为可重复执行的工程能力”。这并不等于仓库整体恢复完成，但为后续持续执�?`/docs/prompts/反复执行Step指令.md` 提供了稳定、可迭代、可审计的基础设施�?
