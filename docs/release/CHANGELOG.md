# Changelog

## [v0.1.41] - 2026-04-08

### Added
- 新增 `docs/review/2026-04-08-step-03-actionable-resolution-state-isolation.md`
- 新增 `docs/release/2026-04-08-v0.1.41-迭代记录.md`
- �?`scripts/__tests__/repair-workspace-node-modules.test.ts` 增加“平台可选二进制缺口不得污染 actionable 诊断统计”回归用�?
### Changed
- `scripts/repair-workspace-node-modules.mjs` 完成 resolver 未落地部分的调用侧集成，root / transitive missing 分支统一接收 `virtualStoreDiagnostics`
- `repairWorkspaceNodeModules(...)` 新增稳定输出 `missingResolutionSummary`
- `summarizeMissingResolutionStates(...)` 调整为以 actionable 缺口为主视图，并单独输出 `platformOptionalEntries`

### Fixed
- 修复 resolver 返回 `{ targetPath: null, diagnostics }` 时，调用侧仍按“已解析成功”处理的问题
- 修复真实仓库中平台可选二进制缺口淹没 actionable `not-found` 统计的问�?- 修复 Step 03 诊断视图无法直接回答“剩余前沿缺口究竟是 manifest-missing 还是 not-found”的问题

### Tests
- `pnpm.cmd run test:vitest:safe -- scripts/__tests__/repair-workspace-node-modules.test.ts`
  - 结果：`1 file / 10 tests passed`
- `pnpm.cmd run test:vitest:safe -- scripts/__tests__/run-vitest-safe.test.ts scripts/__tests__/ensure-workspace-node-modules.test.ts scripts/__tests__/repair-workspace-node-modules.test.ts tests/testRunnerBoundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/VoiceLeftGeneratorPanel.boundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/voicespeaker/VoiceLabModal.boundary.test.ts packages/sdkwork-magic-studio-character/src/components/CharacterLeftGeneratorPanel.boundary.test.ts`
  - 结果：`7 files / 25 tests passed`
- `repairWorkspaceNodeModules({ workspaceRoot: process.cwd() })`
  - 结果：`actionableUniqueCount=11`
  - 结果：`missingResolutionSummary.manifestMissingUniqueCount=7`
  - 结果：`missingResolutionSummary.notFoundUniqueCount=4`
  - 结果：`missingResolutionSummary.platformOptionalUniqueCount=51`

### Docs
- 更新 `docs/release/VERSION.md`
- 更新 `docs/release/CHANGELOG.md`
- 固化本轮 review / release 迭代记录

### Release Notes
- Step 03 已从“依赖修复脚本能工作”推进到“依赖修复脚本能稳定输出可执行治理视图�?- 真实仓库剩余 actionable 缺口被精确收敛为 `11` 个，其中 `7` 个是 virtual store 目录存在�?manifest 缺失，`4` 个是 virtual store 真正缺包
- Release Stage 保持 `internal`

### Known Risks
- 剩余 `11` �?actionable 缺口尚未修复，本轮仅完成治理与诊断收敛，未执�?target install / rebuild
- `CI=true + pnpm install --offline --ignore-scripts --frozen-lockfile --filter .` 仍为 `No-Go`
- 本轮未执�?full typecheck / full build / Tauri packaging
- root `node_modules` / `pnpm-lock.yaml` 级别的任何真实安装操作仍需串行执行，不能并发写
## [v0.1.40] - 2026-04-07

### Added
- 新增 `docs/review/2026-04-07-step-03-virtual-store-permission-fallback-and-or-semver-repair.md`
- 新增 `docs/release/2026-04-07-v0.1.40-迭代记录.md`
- �?`scripts/__tests__/repair-workspace-node-modules.test.ts` 中补�?`EPERM` 候选回退�?`||` semver 两个回归用例

### Changed
- `scripts/repair-workspace-node-modules.mjs` 增强虚拟仓候选解析逻辑
- `satisfiesDependencyRange(...)` 支持 `||` 范围
- `createVirtualStoreResolver(...)` �?`EPERM / EACCES` 下允许回退使用虚拟仓目录版�?
### Fixed
- 修复 `.pnpm` 中候选包存在�?`package.json` 读取被拒绝时，`repair:deps` 直接误判缺失的问�?- 修复 `zod`、`zod-validation-error` �?OR semver 范围依赖无法被恢复的问题
- �?`repair:deps` �?actionable frontier �?`21` 收敛�?`11`

### Tests
- `pnpm.cmd run test:vitest:safe -- scripts/__tests__/repair-workspace-node-modules.test.ts`
  - 结果：`8 tests passed`
- `pnpm.cmd run test:vitest:safe -- scripts/__tests__/run-vitest-safe.test.ts scripts/__tests__/ensure-workspace-node-modules.test.ts scripts/__tests__/repair-workspace-node-modules.test.ts tests/testRunnerBoundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/VoiceLeftGeneratorPanel.boundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/voicespeaker/VoiceLabModal.boundary.test.ts packages/sdkwork-magic-studio-character/src/components/CharacterLeftGeneratorPanel.boundary.test.ts`
  - 结果：`7 files, 23 tests passed`
- `repairWorkspaceNodeModules({ workspaceRoot: process.cwd() })`
  - 结果：`actionableUniqueCount=11`、`frontierUniqueCount=11`、`deferredUniqueCount=0`

### Docs
- 更新 `docs/release/VERSION.md` �?`v0.1.40`
- 更新 `docs/release/CHANGELOG.md`
- 补充本轮 `review` �?`release` 记录

### Release Notes
- 本轮已完�?Step 03 的两类解析缺陷修复：权限回退�?OR semver
- 本轮未宣�?Step 03 完成，剩�?11 项已收敛为真实安装级缺口或虚拟仓内容缺失
- Release Stage 保持 `internal`

### Known Risks
- `@eslint/js`、`archiver`、`mediabunny`、`png-to-ico`、`protobufjs`、`sharp`、`tippy.js`、`typescript-eslint` 仍需后续安装治理
- `fast-xml-parser`、`rxjs`、`shell-quote` 当前表现为虚拟仓内容不完�?- `CI=true + offline install --filter .` 仍为 `No-Go`

## [v0.1.39] - 2026-04-07

### Added
- 新增 `docs/review/2026-04-07-step-03-offline-install-no-go-and-safe-runner-recovery.md`
- 新增 `docs/release/2026-04-07-v0.1.39-迭代记录.md`

### Changed
- `scripts/run-vitest-safe.mjs` 新增默认 `--config tests/vitest.codex.config.mjs`，把 safe runner 固定�?codex 测试配置入口
- `scripts/__tests__/run-vitest-safe.test.ts` 扩展为校�?safe runner 的默�?config 边界

### Fixed
- 修复 `repair-workspace-node-modules.mjs` �?`^4.0.0-rc.1` 这类预发布范围比较错误，避免稳定�?`4.0.0` 被误判为不满足范�?- 修复 `std-env@4.0.0` 已存在于 `.pnpm` 中却仍被 `repair:deps` 误报缺失的问�?- 修复 `test:vitest:safe` 在本轮离线恢复尝试后回退到仓库根 `vite.config.ts`，重新触�?`tailwindcss/oxide` �?`spawn EPERM` 的回归问�?
### Tests
- 离线恢复尝试�?  - `pnpm.cmd install --offline --ignore-scripts --frozen-lockfile --filter . --reporter append-only`
  - 结果：`ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`
- 离线恢复尝试（`CI=true`）：
  - `$env:CI='true'; pnpm.cmd install --offline --ignore-scripts --frozen-lockfile --filter . --reporter append-only`
  - 结果：超时，触发 `node_modules` 重建，且没有收敛 frontier 缺口
- 定向单测�?  - `node node_modules/vitest/vitest.mjs run --config tests/vitest.codex.config.mjs --configLoader native --pool threads --maxWorkers 1 --exclude ".worktrees/**" scripts/__tests__/run-vitest-safe.test.ts scripts/__tests__/repair-workspace-node-modules.test.ts tests/testRunnerBoundary.test.ts`
  - 结果：`3 files, 14 tests passed`
- 安全回归集：
  - `pnpm.cmd run test:vitest:safe -- scripts/__tests__/run-vitest-safe.test.ts scripts/__tests__/ensure-workspace-node-modules.test.ts scripts/__tests__/repair-workspace-node-modules.test.ts tests/testRunnerBoundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/VoiceLeftGeneratorPanel.boundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/voicespeaker/VoiceLabModal.boundary.test.ts packages/sdkwork-magic-studio-character/src/components/CharacterLeftGeneratorPanel.boundary.test.ts`
  - 结果：`7 files, 21 tests passed`
- `pnpm.cmd --silent run repair:deps`
  - 结果：`actionableUniqueCount=21`、`frontierUniqueCount=21`、`std-env` 已退�?frontier 清单

### Docs
- 更新 `docs/release/VERSION.md` �?`v0.1.39`
- 更新 `docs/release/CHANGELOG.md`
- 新增本轮 `review` �?`release` 记录

### Release Notes
- 已完成对“当�?workspace root 离线安装恢复”路径的真实实证，结论为当前环境�?`No-Go`
- 已恢复本轮尝试引入的 `std-env` 缺口回归�?safe Vitest runner 回归
- 当前测试入口重新回到可运行状态，�?frontier 缺口仍维持在 `21`

### Known Risks
- 当前 `21` �?frontier 缺口仍然存在，本轮没有实际补齐依�?- `CI=true + offline install --filter .` 当前不应继续作为默认恢复路径
- Step 03 仍未完成，整�?`test / typecheck / build` 仍未恢复
- 当前版本仍处�?`internal`，不得宣�?`alpha`

## [v0.1.38] - 2026-04-07

### Added
- 新增 `buildMissingDependencyRecoveryPlan(...)`，为 `repair-workspace-node-modules.mjs` 提供 frontier / deferred / tier 化恢复计划推导能�?- 新增 `repairWorkspaceNodeModules(...).recoveryPlan` 输出，直接给出根级目标、transitive frontier 和并行恢�?tier
- 新增 `docs/review/2026-04-07-step-03-recovery-frontier-and-tiered-plan.md`
- 新增 `docs/release/2026-04-07-v0.1.38-迭代记录.md`

### Changed
- `scripts/repair-workspace-node-modules.mjs` 现在会把 actionable 缺口细分为：
  - 根级 production 目标
  - 根级 dev 目标
  - transitive frontier 目标
  - deferred 目标
- `scripts/__tests__/repair-workspace-node-modules.test.ts` 扩展为覆�?tiered recovery plan 与零缺口 recovery plan 输出

### Fixed
- 修复上一轮仍需人工�?`missingSummary` 手动推导恢复顺序、根级直缺和嵌套依赖关系的问�?- 修复无法直接判断哪些 actionable 缺口可以并行恢复、哪些必须等待前置缺口解除的问题

### Tests
- `node node_modules/vitest/vitest.mjs run --config tests/vitest.codex.config.mjs --configLoader native --pool threads --maxWorkers 1 --exclude ".worktrees/**" scripts/__tests__/repair-workspace-node-modules.test.ts`
  - 结果：`1 file, 5 tests passed`
- `pnpm.cmd run test:vitest:safe -- scripts/__tests__/run-vitest-safe.test.ts scripts/__tests__/ensure-workspace-node-modules.test.ts scripts/__tests__/repair-workspace-node-modules.test.ts tests/testRunnerBoundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/VoiceLeftGeneratorPanel.boundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/voicespeaker/VoiceLabModal.boundary.test.ts packages/sdkwork-magic-studio-character/src/components/CharacterLeftGeneratorPanel.boundary.test.ts`
  - 结果：`7 files, 19 tests passed`
- `pnpm.cmd --silent run repair:deps`
  - 结果：正式工作流入口成功返回 `recoveryPlan`
  - 关键事实：`actionableUniqueCount=21`、`frontierUniqueCount=21`、`deferredUniqueCount=0`

### Docs
- 更新 `docs/release/VERSION.md` �?`v0.1.38`
- 更新 `docs/release/CHANGELOG.md`
- 新增本轮 `review` �?`release` 记录

### Release Notes
- 当前 Step 03 已从“缺口分类”推进到“恢复前沿与并行恢复计划”阶�?- 当前 `21` 个唯一 actionable 缺口全部位于 `recoveryTiers[0]`，说明下一轮可以按根级目标�?transitive frontier 两类并行恢复，而不需要继续等待嵌套缺口串行解�?
### Known Risks
- 当前 `21` �?frontier 缺口仍然存在，本轮没有实际补齐依�?- `rootInstallTargets` �?`rootDevInstallTargets` 只是恢复目标，不等于已经恢复成功
- Step 03 仍未完成，整�?`test / typecheck / build` 仍未恢复
- 当前版本仍处�?`internal`，不得宣�?`alpha`

## [v0.1.37] - 2026-04-07

### Added
- 新增 `repair-workspace-node-modules.mjs` 的缺口分类能力：`classifyMissingDependency(...)` �?`summarizeMissingDependencies(...)`
- 新增 `docs/review/2026-04-07-step-03-missing-dependency-summary-and-recovery-boundary.md`
- 新增 `docs/release/2026-04-07-v0.1.37-迭代记录.md`

### Changed
- `repairWorkspaceNodeModules(...)` 结果新增 `missingSummary`
- transitive 缺口项新�?`optional` 语义，避�?`optionalDependencies` �?required dependencies 混淆
- `scripts/__tests__/repair-workspace-node-modules.test.ts` 扩展为覆�?actionable �?platform-optional 分类

### Fixed
- 修复 `repair:deps` 只能输出扁平 missing 列表、无法直接区分真�?blocker 与平台噪声的问题
- 修复 transitive 缺口在合并依赖时丢失 `optional` 语义的问�?
### Tests
- `node node_modules/vitest/vitest.mjs run --config tests/vitest.codex.config.mjs --configLoader native --pool threads --maxWorkers 1 --exclude ".worktrees/**" scripts/__tests__/repair-workspace-node-modules.test.ts`
  - 结果：`1 file, 4 tests passed`
- `pnpm.cmd run test:vitest:safe -- scripts/__tests__/run-vitest-safe.test.ts scripts/__tests__/ensure-workspace-node-modules.test.ts scripts/__tests__/repair-workspace-node-modules.test.ts tests/testRunnerBoundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/VoiceLeftGeneratorPanel.boundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/voicespeaker/VoiceLabModal.boundary.test.ts packages/sdkwork-magic-studio-character/src/components/CharacterLeftGeneratorPanel.boundary.test.ts`
  - 结果：`7 files, 18 tests passed`
- `pnpm.cmd run repair:deps`
  - 结果：当�?summary �?`actionableCount=23`、`platformOptionalCount=52`、`actionableUniqueCount=21`
- 定向扫描当前 workspace �?`packages/**/node_modules/**`
  - 结果：`hitCount: 0`

### Docs
- 更新 `docs/release/VERSION.md` �?`v0.1.37`
- 更新 `docs/release/CHANGELOG.md`
- 新增本轮 `review` �?`release` 记录

### Known Risks
- 当前 `21` 个唯一 actionable 包仍然缺失，本轮没有直接补齐这些依赖
- repo-local relink 已基本到达边界，下一轮很可能需要转入定点补包或缓存恢复策略
- Step 03 仍未完成，整�?`test / typecheck / build` 仍未恢复
- 当前版本仍处�?`internal`，不得宣�?`alpha`

## [v0.1.36] - 2026-04-07

### Added
- 新增 `scripts/run-vitest-safe.mjs`，将 sandbox-safe Vitest 参数�?Windows 参数转发治理沉淀为正式运行器
- 新增 `scripts/__tests__/run-vitest-safe.test.ts`，覆�?safe flags、`pnpm --` 分隔符清洗和 vitest 入口路径解析
- 新增 `docs/review/2026-04-07-step-03-safe-vitest-runner-and-deps-governance.md`
- 新增 `docs/release/2026-04-07-v0.1.36-迭代记录.md`

### Changed
- `.gitignore` 新增例外规则，确�?`scripts/run-vitest-safe.mjs` �?`docs/release/*.md` 不会被忽�?- `package.json` 新增 `repair:deps`、`test:safe`，并�?`test:vitest:safe` 切换�?`scripts/run-vitest-safe.mjs`
- `scripts/ensure-workspace-node-modules.mjs` 的异常提示升级为“先 `pnpm run repair:deps`，再当前 workspace 定点 `pnpm install --frozen-lockfile`�?- `tests/testRunnerBoundary.test.ts` 扩展为校�?safe Vitest 运行器存在�?- `scripts/__tests__/ensure-workspace-node-modules.test.ts` 扩展为校验预检提示中的治理路径

### Fixed
- 修复 `pnpm run test:vitest:safe -- <files>` �?Windows / sandbox 场景下文件过滤不稳定、误跑整库的问题
- 修复 preflight 只提�?reinstall、缺�?repo-local relink 治理入口的问�?
### Tests
- `node node_modules/vitest/vitest.mjs run --config tests/vitest.codex.config.mjs --configLoader native --pool threads --maxWorkers 1 --exclude ".worktrees/**" scripts/__tests__/run-vitest-safe.test.ts scripts/__tests__/ensure-workspace-node-modules.test.ts scripts/__tests__/repair-workspace-node-modules.test.ts tests/testRunnerBoundary.test.ts`
  - 结果：`4 files, 14 tests passed`
- `pnpm.cmd run test:vitest:safe -- scripts/__tests__/run-vitest-safe.test.ts scripts/__tests__/ensure-workspace-node-modules.test.ts scripts/__tests__/repair-workspace-node-modules.test.ts tests/testRunnerBoundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/VoiceLeftGeneratorPanel.boundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/voicespeaker/VoiceLabModal.boundary.test.ts packages/sdkwork-magic-studio-character/src/components/CharacterLeftGeneratorPanel.boundary.test.ts`
  - 结果：`7 files, 17 tests passed`
- `pnpm.cmd run repair:deps`
  - 结果：命令成功执行；当前统计 `missingCount=75`、`ambiguousCount=6`

### Docs
- 修正 `.gitignore` 交付边界，确�?release 文档与安全运行器可进入版本控�?- 更新 `docs/release/VERSION.md` �?`v0.1.36`
- 更新 `docs/release/CHANGELOG.md`
- 新增本轮 `review` �?`release` 记录

### Known Risks
- `repair:deps` 当前只能重建本地虚拟仓中已经存在的链接，无法自动补齐 `.pnpm` 中不存在的包
- 整库 `test / typecheck / build` 仍未恢复，Step 03 尚未完成
- 当前版本仍处�?`internal`，不得对外宣�?`alpha`

## [v0.1.35] - 2026-04-07

### Added
- 新增 `docs/review/2026-04-07-step-03-workspace-link-recovery-and-fresh-typecheck-closure.md`，记录当前仓 `node_modules` 安全 relink �?blocker fresh 关闭证据
- 新增 `docs/release/2026-04-07-v0.1.35-迭代记录.md`

### Changed
- 更新 `docs/release/VERSION.md` �?`v0.1.35`
- 将当前轮的执行重点从“源码层 blocker 收敛”推进到“安全恢复验证环境并完成 fresh 关闭�?
### Fixed
- 修复当前�?`node_modules` 顶层链接层缺失导�?`ensure-workspace-node-modules`、`tsc`、`vitest --version` 不可执行的问�?- �?fresh 验证层面关闭 voicespeaker / character �?`GenerationResultSelection` blocker

### Refactored
- 将当前仓依赖恢复策略从“继续尝�?root install”重构为“基于既�?`.pnpm` 存储做当前仓内安�?relink”，避免再次把外�?workspace 安装风险混入当前 step 验证

### Performance
- 本轮没有引入新的业务运行时分支；通过恢复当前仓验证链路，显著降低�?blocker 定位与重复排障成�?
### Security
- 依赖恢复动作被限制在当前�?`node_modules` 内执行，避免再次对外�?workspace 产生不可控安装副作用

### Tests
- Preflight:
  - `node scripts/ensure-workspace-node-modules.mjs`
  - 结果：`PASS`
- Toolchain:
  - `node node_modules/typescript/bin/tsc -v`
  - 结果：`PASS`
  - 版本：`Version 6.0.2`
- Fresh Typecheck A:
  - `node node_modules/typescript/bin/tsc --skipLibCheck --ignoreConfig --noEmit --jsx react-jsx --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-voicespeaker/src/components/VoiceLeftGeneratorPanel.tsx`
  - 结果：`PASS`
- Fresh Typecheck B:
  - `node node_modules/typescript/bin/tsc --skipLibCheck --ignoreConfig --noEmit --jsx react-jsx --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-voicespeaker/src/components/voicespeaker/VoiceLabModal.tsx`
  - 结果：`PASS`
- Fresh Typecheck C:
  - `node node_modules/typescript/bin/tsc --skipLibCheck --ignoreConfig --noEmit --jsx react-jsx --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-character/src/components/CharacterLeftGeneratorPanel.tsx`
  - 结果：`PASS`
- Runner Probe:
  - `node node_modules/vitest/vitest.mjs --version`
  - 结果：`PASS`
  - 输出：`vitest/4.1.2 win32-x64 node-v22.20.0`
- Boundary Test Attempt:
  - `node node_modules/vitest/vitest.mjs run --config tests/vitest.codex.config.mjs packages/sdkwork-magic-studio-voicespeaker/src/components/VoiceLeftGeneratorPanel.boundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/voicespeaker/VoiceLabModal.boundary.test.ts packages/sdkwork-magic-studio-character/src/components/CharacterLeftGeneratorPanel.boundary.test.ts --exclude ".worktrees/**"`
  - 结果：`FAIL`
  - 原因：`failed to load config` / `[plugin externalize-deps] Error: spawn EPERM`

### Docs
- 更新 `docs/release/VERSION.md`
- 更新 `docs/release/CHANGELOG.md`
- 新增本轮 `review` / `release` 文档

### Release Notes
- 当前仓验证环境已从“顶层链接层损坏、无�?fresh 验证”恢复到“可完成 targeted preflight / typecheck / runner 启动�?- `GenerationResultSelection` blocker 已完�?fresh 关闭，Step 03 �?blocker 治理向前推进了一大步
- 下一轮应独立清理 `vite` / `rolldown` 配置加载阶段�?`spawn EPERM`，恢复轻量回归测试能�?
### Known Risks
- 当前 safe relink 仍是 session 级恢复动作，尚未固化为仓内正式工�?- `vitest` 用例执行仍受 `spawn EPERM` 限制
- 全仓 `test / typecheck / build` 尚未完成，当前版本仍不足以提升到 `alpha`

## [v0.1.34] - 2026-04-07

### Added
- 新增 `docs/review/2026-04-07-step-03-generation-history-import-convergence.md`，记�?`@sdkwork/magic-studio-generation-history` blocker 的根因调查与真实验证状�?- 新增 `docs/release/2026-04-07-v0.1.34-迭代记录.md`

### Changed
- 更新 `packages/sdkwork-magic-studio-voicespeaker/src/components/panel/types.ts`
- 更新 `packages/sdkwork-magic-studio-voicespeaker/src/components/voicespeaker/VoiceLabModal.tsx`
- 更新 `packages/sdkwork-magic-studio-character/src/components/CharacterLeftGeneratorPanel.tsx`
  - �?`GenerationResultSelection` 的来源统一收敛�?`@sdkwork/magic-studio-assets/generation`
- 更新 `docs/release/VERSION.md` �?`v0.1.34`

### Fixed
- 修复源码层面�?`@sdkwork/magic-studio-generation-history` 裸模块的直接依赖边界

### Refactored
- �?voicespeaker / character 的类型导入收敛到已声明依赖的稳定 re-export 边界，降低对 workspace 链接状态的直接耦合

### Performance
- 本轮仅调整类型导入边界，不引入运行时行为变化

### Security
- 无新增安全面；主要收益是降低构建与验证流程中的不确定依赖边界

### Tests
- RED:
  - `pnpm.cmd exec tsc --skipLibCheck --ignoreConfig --noEmit --jsx react-jsx --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-voicespeaker/src/components/VoiceLeftGeneratorPanel.tsx`
  - 结果：`FAIL`
  - 原因：`TS2307: Cannot find module '@sdkwork/magic-studio-generation-history'`
- Investigation:
  - `pnpm.cmd install --ignore-scripts --offline --filter @sdkwork/magic-studio-voicespeaker --filter @sdkwork/magic-studio-character`
  - 结果：`FAIL`
  - 原因：`ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`
- Investigation:
  - `$env:CI='true'; pnpm.cmd install --ignore-scripts --offline --filter @sdkwork/magic-studio-voicespeaker --filter @sdkwork/magic-studio-character`
  - 结果：`FAIL`
  - 原因：`EPERM ... openchat ... node_modules\\typescript`
- Verification:
  - `rg -n "@sdkwork/magic-studio-generation-history" packages/sdkwork-magic-studio-voicespeaker packages/sdkwork-magic-studio-character`
  - 结果：源码目录下不再存在 voicespeaker / character 对该裸模块的直接导入
- Environment:
  - `node scripts/ensure-workspace-node-modules.mjs`
  - 结果：`FAIL`
  - 原因：`Missing node_modules\.modules.yaml`

### Docs
- 更新 `docs/release/VERSION.md`
- 更新 `docs/release/CHANGELOG.md`
- 新增 blocker 调查 `review` / `release` 文档

### Release Notes
- 第一批核心消费方收口已经完成，本轮开始进�?blocker 治理
- `GenerationResultSelection` 的类型来源已完成源码层收敛，但当�?workspace `node_modules` 环境尚未恢复，不能误�?blocker �?fresh 关闭

### Known Risks
- �?`node_modules` 缺失 `.modules.yaml`
- `pnpm exec` 当前不可�?- fresh typecheck / 全仓验证仍被环境阻塞
- 当前版本仍不足以升级�?`alpha`

## [v0.1.33] - 2026-04-07

### Added
- 新增 `docs/review/2026-04-07-step-03-audio-left-source-audio-binding.md`，固�?`AudioLeftGeneratorPanel` 双路径收口的 review 结论与检查点
- 新增 `docs/release/2026-04-07-v0.1.33-迭代记录.md`，沉淀本轮音频消费方收口记�?- 新增 `packages/sdkwork-magic-studio-audio/src/components/AudioLeftGeneratorPanel.boundary.test.ts`

### Changed
- 更新 `packages/sdkwork-magic-studio-audio/src/components/AudioLeftGeneratorPanel.tsx`
  - 定义统一项目引用契约 `AUDIO_SOURCE_PROJECT_REFERENCE`
  - 为源音频 `ChooseAssetModal` 入口补齐 `projectReference`
  - 为本地上传链路补�?`persistChooseAssetProjectReference(...)`
  - 固化 `slot: 'audio-source-audio'`
  - 固化 `source: 'audio-left-generator-panel'`
- 更新 `docs/release/VERSION.md` �?`v0.1.33`

### Fixed
- 修复 `AudioLeftGeneratorPanel` 源音频模态入口缺少稳定项目级 persisted reference 语义的问�?- 修复音频本地上传链路绕过共享 persisted reference 主干的问�?
### Refactored
- 将第一批核心消费方收口策略完整复制到音频链路，形成统一的消费方治理模式

### Performance
- 本轮改动继续维持在共�?helper 复用与元数据绑定层，不引入新的重型运行时分支；回归范围保持可�?
### Security
- 源音频现在可稳定映射�?`audio-source-audio` 业务槽位，音频本地上传不再绕开项目级引用审计与删除保护

### Tests
- Red:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-audio/src/components/AudioLeftGeneratorPanel.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`1 test | 1 failed`
- Green:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-audio/src/components/AudioLeftGeneratorPanel.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`1 file, 1 test passed`
- Regression A:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/chooseAssetIdentity.test.tsx packages/sdkwork-magic-studio-assets/tests/chooseAssetProjectReference.test.tsx packages/sdkwork-magic-studio-assets/tests/chooseAssetModalProjectReference.boundary.test.ts packages/sdkwork-magic-studio-assets/tests/chooseAssetModalSelectionProjectReference.test.ts packages/sdkwork-magic-studio-assets/tests/assetStoreProjectReference.test.tsx packages/sdkwork-magic-studio-assets/tests/assetCenterProjectManagedImport.test.ts packages/sdkwork-magic-studio-assets/tests/assetCenterDeleteSafety.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`7 files, 17 tests passed`
- Regression B:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-video/src/components/modes/SubjectReferenceSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/modes/StartEndFramesSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/modes/LipSyncSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/panel/VideoPromptStyleSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/VideoLeftGeneratorPanel.boundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/panel/VoicePersonaSection.boundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/voicespeaker/VoiceLabModal.boundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/VoiceLeftGeneratorPanel.boundary.test.ts packages/sdkwork-magic-studio-character/src/components/CharacterLeftGeneratorPanel.boundary.test.ts packages/sdkwork-magic-studio-music/src/components/MusicLeftGeneratorPanel.boundary.test.ts packages/sdkwork-magic-studio-image/src/components/ImageLeftGeneratorPanel.boundary.test.ts packages/sdkwork-magic-studio-audio/src/components/AudioLeftGeneratorPanel.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`12 files, 12 tests passed`
- Typecheck:
  - `pnpm.cmd exec tsc --skipLibCheck --ignoreConfig --noEmit --jsx react-jsx --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-audio/src/components/AudioLeftGeneratorPanel.tsx packages/sdkwork-magic-studio-assets/src/choose-asset/index.ts`
  - 结果：`PASS`

### Docs
- 更新 `docs/release/VERSION.md`
- 更新 `docs/release/CHANGELOG.md`
- 新增本轮 `review` / `release` 文档

### Release Notes
- `AudioLeftGeneratorPanel` 已完成“模态选择 + 本地上传”双路径项目�?persisted reference 收口，第一批核心消费方现已全部完成真实接入
- 下一轮从新增业务面板切换到阻塞治理与更大范围验证，优先清除现有类型解析阻�?
### Known Risks
- voicespeaker / character �?`@sdkwork/magic-studio-generation-history` 解析阻塞依旧存在，不应误报为本轮新增回归
- 更大范围环境噪音 `EPERM` / `indexedDB is not defined` 仍需独立治理
- 全仓 `test / typecheck / build` 尚未完成，仍不足以提升到 `alpha`

## [v0.1.32] - 2026-04-07

### Added
- 新增 `docs/review/2026-04-07-step-03-image-left-reference-images-binding.md`，固�?`ImageLeftGeneratorPanel` 双路径收口的 review 结论与检查点
- 新增 `docs/release/2026-04-07-v0.1.32-迭代记录.md`，沉淀本轮图像消费方收口记�?- 新增 `packages/sdkwork-magic-studio-image/src/components/ImageLeftGeneratorPanel.boundary.test.ts`

### Changed
- 更新 `packages/sdkwork-magic-studio-assets/src/choose-asset/index.ts`
  - 导出 `persistChooseAssetProjectReference(...)`
- 更新 `packages/sdkwork-magic-studio-image/src/components/ImageLeftGeneratorPanel.tsx`
  - 定义统一项目引用契约 `IMAGE_REFERENCE_PROJECT_REFERENCE`
  - 为参考图�?`ChooseAssetModal` 入口补齐 `projectReference`
  - 为本地上传链路补�?`persistChooseAssetProjectReference(...)`
  - 固化 `slot: 'image-reference-images'`
  - 固化 `source: 'image-left-generator-panel'`
- 更新 `docs/release/VERSION.md` �?`v0.1.32`

### Fixed
- 修复 `ImageLeftGeneratorPanel` 参考图片模态入口缺少稳定项目级 persisted reference 语义的问�?- 修复图像本地上传链路绕过共享 persisted reference 主干的问�?
### Refactored
- 将共�?helper 正式暴露给真实业务消费方，避免图像本地上传重复实现资产治理逻辑

### Performance
- 本轮改动继续保持在资产元数据绑定与共�?helper 复用层，不引入额外重型运行时逻辑；回归范围维持可�?
### Security
- 图像参考图片现在可稳定映射�?`image-reference-images` 业务槽位，且本地上传不再绕开项目级引用审计与删除保护

### Tests
- Red:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-image/src/components/ImageLeftGeneratorPanel.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`1 test | 1 failed`
- Green:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-image/src/components/ImageLeftGeneratorPanel.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`1 file, 1 test passed`
- Regression A:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/chooseAssetIdentity.test.tsx packages/sdkwork-magic-studio-assets/tests/chooseAssetProjectReference.test.tsx packages/sdkwork-magic-studio-assets/tests/chooseAssetModalProjectReference.boundary.test.ts packages/sdkwork-magic-studio-assets/tests/chooseAssetModalSelectionProjectReference.test.ts packages/sdkwork-magic-studio-assets/tests/assetStoreProjectReference.test.tsx packages/sdkwork-magic-studio-assets/tests/assetCenterProjectManagedImport.test.ts packages/sdkwork-magic-studio-assets/tests/assetCenterDeleteSafety.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`7 files, 17 tests passed`
- Regression B:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-video/src/components/modes/SubjectReferenceSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/modes/StartEndFramesSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/modes/LipSyncSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/panel/VideoPromptStyleSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/VideoLeftGeneratorPanel.boundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/panel/VoicePersonaSection.boundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/voicespeaker/VoiceLabModal.boundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/VoiceLeftGeneratorPanel.boundary.test.ts packages/sdkwork-magic-studio-character/src/components/CharacterLeftGeneratorPanel.boundary.test.ts packages/sdkwork-magic-studio-music/src/components/MusicLeftGeneratorPanel.boundary.test.ts packages/sdkwork-magic-studio-image/src/components/ImageLeftGeneratorPanel.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`11 files, 11 tests passed`
- Typecheck:
  - `pnpm.cmd exec tsc --skipLibCheck --ignoreConfig --noEmit --jsx react-jsx --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-image/src/components/ImageLeftGeneratorPanel.tsx packages/sdkwork-magic-studio-assets/src/choose-asset/index.ts`
  - 结果：`PASS`

### Docs
- 更新 `docs/release/VERSION.md`
- 更新 `docs/release/CHANGELOG.md`
- 新增本轮 `review` / `release` 文档

### Release Notes
- `ImageLeftGeneratorPanel` 已完成“模态选择 + 本地上传”双路径项目�?persisted reference 收口，图像创作链路开始具备更完整的项目级资产治理能力
- 下一轮继续优先处�?`AudioLeftGeneratorPanel`，把音频输入链路也拉入同一标准

### Known Risks
- `AudioLeftGeneratorPanel` 仍未完成项目级引用收�?- voicespeaker / character �?`@sdkwork/magic-studio-generation-history` 解析阻塞依旧存在，不应误报为本轮新增回归
- 更大范围环境噪音 `EPERM` / `indexedDB is not defined` 仍需独立治理

## [v0.1.31] - 2026-04-07

### Added
- 新增 `docs/review/2026-04-07-step-03-video-left-reference-images-binding.md`，固�?`VideoLeftGeneratorPanel` 参考图片模态入口的 review 结论与检查点
- 新增 `docs/release/2026-04-07-v0.1.31-迭代记录.md`，沉淀本轮视频消费方收口记�?- 新增 `packages/sdkwork-magic-studio-video/src/components/VideoLeftGeneratorPanel.boundary.test.ts`

### Changed
- 更新 `packages/sdkwork-magic-studio-video/src/components/VideoLeftGeneratorPanel.tsx`
  - 为参考图�?`ChooseAssetModal` 入口补齐 `projectReference`
  - 固化 `slot: 'video-reference-images'`
  - 固化 `source: 'video-left-generator-panel'`
- 更新 `docs/release/VERSION.md` �?`v0.1.31`

### Fixed
- 修复 `VideoLeftGeneratorPanel` 参考图片资产链路缺少稳定项目级 persisted reference 语义的问�?- 修复视频创作链路无法稳定登记参考图片引用的治理断点

### Refactored
- �?`ChooseAssetModal` 共享主干能力扩展到视频左侧生成面板，形成可继续复制到图像与音频面板的接入模板

### Performance
- 本轮改动继续保持在边界元数据层，未引入新的运行时复杂分支；通过定向 boundary 与回归测试确保低成本扩展

### Security
- 视频参考图片现可稳定映射到 `video-reference-images` 业务槽位，提升项目级引用审计、删除保护和素材追溯准确�?
### Tests
- Red:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-video/src/components/VideoLeftGeneratorPanel.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`1 test | 1 failed`
- Green:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-video/src/components/VideoLeftGeneratorPanel.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`1 file, 1 test passed`
- Regression A:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/chooseAssetIdentity.test.tsx packages/sdkwork-magic-studio-assets/tests/chooseAssetProjectReference.test.tsx packages/sdkwork-magic-studio-assets/tests/chooseAssetModalProjectReference.boundary.test.ts packages/sdkwork-magic-studio-assets/tests/chooseAssetModalSelectionProjectReference.test.ts packages/sdkwork-magic-studio-assets/tests/assetStoreProjectReference.test.tsx packages/sdkwork-magic-studio-assets/tests/assetCenterProjectManagedImport.test.ts packages/sdkwork-magic-studio-assets/tests/assetCenterDeleteSafety.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`7 files, 17 tests passed`
- Regression B:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-video/src/components/modes/SubjectReferenceSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/modes/StartEndFramesSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/modes/LipSyncSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/panel/VideoPromptStyleSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/VideoLeftGeneratorPanel.boundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/panel/VoicePersonaSection.boundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/voicespeaker/VoiceLabModal.boundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/VoiceLeftGeneratorPanel.boundary.test.ts packages/sdkwork-magic-studio-character/src/components/CharacterLeftGeneratorPanel.boundary.test.ts packages/sdkwork-magic-studio-music/src/components/MusicLeftGeneratorPanel.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`10 files, 10 tests passed`
- Typecheck:
  - `pnpm.cmd exec tsc --skipLibCheck --ignoreConfig --noEmit --jsx react-jsx --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-video/src/components/VideoLeftGeneratorPanel.tsx`
  - 结果：`PASS`

### Docs
- 更新 `docs/release/VERSION.md`
- 更新 `docs/release/CHANGELOG.md`
- 新增本轮 `review` / `release` 文档

### Release Notes
- `VideoLeftGeneratorPanel` 已进入项目级 persisted reference 主干，视频创作链路的关键参考图片开始纳入统一项目级资产治�?- 下一轮继续优先处�?`ImageLeftGeneratorPanel`，把图像创作链路的参考图片模态入口一并收�?
### Known Risks
- `ImageLeftGeneratorPanel`、`AudioLeftGeneratorPanel` 仍未完成项目级引用收�?- voicespeaker / character �?`@sdkwork/magic-studio-generation-history` 解析阻塞依旧存在，不应误报为本轮新增回归
- 更大范围环境噪音 `EPERM` / `indexedDB is not defined` 仍需独立治理

## [v0.1.30] - 2026-04-07

### Added
- 新增 `docs/review/2026-04-07-step-03-voice-left-reference-audio-binding.md`，固�?`VoiceLeftGeneratorPanel` 参考音频模态入口的 review 结论与检查点
- 新增 `docs/release/2026-04-07-v0.1.30-迭代记录.md`，沉淀本轮 `VoiceLeftGeneratorPanel` 消费方收口记�?- 新增 `packages/sdkwork-magic-studio-voicespeaker/src/components/VoiceLeftGeneratorPanel.boundary.test.ts`

### Changed
- 更新 `packages/sdkwork-magic-studio-voicespeaker/src/components/VoiceLeftGeneratorPanel.tsx`
  - 为参考音�?`ChooseAssetModal` 入口补齐 `projectReference`
  - 固化 `slot: 'voice-left-reference-audio'`
  - 固化 `source: 'voice-left-generator-panel'`
- 更新 `docs/release/VERSION.md` �?`v0.1.30`

### Fixed
- 修复 `VoiceLeftGeneratorPanel` 参考音频资产链路缺少稳定项目级 persisted reference 语义的问�?- 修复共享主干已经可用但消费方未显式接入导致的资产治理断点

### Refactored
- �?`ChooseAssetModal` 共享主干能力首次落地到声音左侧生成面板，形成后续 `Video / Image / Audio` 面板可复用的消费方接入模�?
### Performance
- 本轮改动维持在边界元数据层，不引入额外运行时查询或额外渲染分支；通过定向边界测试保障低成本扩�?
### Security
- 参考音频资产现在可稳定映射�?`voice-left-reference-audio` 业务槽位，提升项目级引用审计与删除保护准确�?
### Tests
- Red:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-voicespeaker/src/components/VoiceLeftGeneratorPanel.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`1 test | 1 failed`
- Green:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-voicespeaker/src/components/VoiceLeftGeneratorPanel.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`1 file, 1 test passed`
- Regression A:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/chooseAssetIdentity.test.tsx packages/sdkwork-magic-studio-assets/tests/chooseAssetProjectReference.test.tsx packages/sdkwork-magic-studio-assets/tests/chooseAssetModalProjectReference.boundary.test.ts packages/sdkwork-magic-studio-assets/tests/chooseAssetModalSelectionProjectReference.test.ts packages/sdkwork-magic-studio-assets/tests/assetStoreProjectReference.test.tsx packages/sdkwork-magic-studio-assets/tests/assetCenterProjectManagedImport.test.ts packages/sdkwork-magic-studio-assets/tests/assetCenterDeleteSafety.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`7 files, 17 tests passed`
- Regression B:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-video/src/components/modes/SubjectReferenceSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/modes/StartEndFramesSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/modes/LipSyncSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/panel/VideoPromptStyleSection.boundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/panel/VoicePersonaSection.boundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/voicespeaker/VoiceLabModal.boundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/VoiceLeftGeneratorPanel.boundary.test.ts packages/sdkwork-magic-studio-character/src/components/CharacterLeftGeneratorPanel.boundary.test.ts packages/sdkwork-magic-studio-music/src/components/MusicLeftGeneratorPanel.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`9 files, 9 tests passed`
- Typecheck:
  - `pnpm.cmd exec tsc --skipLibCheck --ignoreConfig --noEmit --jsx react-jsx --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-voicespeaker/src/components/VoiceLeftGeneratorPanel.tsx`
  - 结果：`FAIL`
  - 阻塞：`packages/sdkwork-magic-studio-voicespeaker/src/components/panel/types.ts(2,48): error TS2307: Cannot find module '@sdkwork/magic-studio-generation-history' or its corresponding type declarations.`

### Docs
- 更新 `docs/release/VERSION.md`
- 更新 `docs/release/CHANGELOG.md`
- 新增本轮 `review` / `release` 文档

### Release Notes
- `VoiceLeftGeneratorPanel` 已进入项目级 persisted reference 主干，说明共享主干能力不再停留在基础设施层，而是开始被高价值消费方面板真实复用
- 下一轮继续优先处�?`VideoLeftGeneratorPanel`，保持同一节奏推进第一批核心消费方全部收口

### Known Risks
- `VideoLeftGeneratorPanel`、`ImageLeftGeneratorPanel`、`AudioLeftGeneratorPanel` 仍未完成项目级引用收�?- `@sdkwork/magic-studio-generation-history` 解析阻塞依旧存在，不应误报为本轮新增回归
- 更大范围环境噪音 `EPERM` / `indexedDB is not defined` 仍需独立治理

## [v0.1.29] - 2026-04-07

### Added
- 新增 `docs/review/2026-04-07-step-03-choose-asset-modal-project-reference.md`，沉淀 `ChooseAssetModal` 主干透传与持久化能力闭环�?review 证据�?- 新增 `docs/release/2026-04-07-v0.1.29-迭代记录.md`，记录本轮共享资产主干治理结果与下一阶段消费方面板收口顺序�?- 新增 `packages/sdkwork-magic-studio-assets/src/components/chooseAssetModalProjectReference.ts`，抽出模态确认的项目级引用持久化主干�?- 新增 `packages/sdkwork-magic-studio-assets/tests/chooseAssetModalProjectReference.boundary.test.ts`�?- 新增 `packages/sdkwork-magic-studio-assets/tests/chooseAssetModalSelectionProjectReference.test.ts`�?- 新增 `packages/sdkwork-magic-studio-assets/tests/assetStoreProjectReference.test.tsx`�?
### Changed
- 更新 `packages/sdkwork-magic-studio-assets/src/components/ChooseAssetModal.types.ts`，为模态类型契约新�?`projectReference`�?- 更新 `packages/sdkwork-magic-studio-assets/src/components/ChooseAsset.tsx`，向 `ChooseAssetModal` 透传 `projectReference`�?- 更新 `packages/sdkwork-magic-studio-assets/src/components/ChooseAssetModalContent.tsx`，向 `AssetStoreProvider` 透传 `projectReference`，并在库内确认时执行 persisted reference 绑定�?- 更新 `packages/sdkwork-magic-studio-assets/src/store/assetStore.tsx`，在模态上传后执行 `persistChooseAssetProjectReference(...)`�?- 更新 `docs/release/VERSION.md`，将当前执行状态推进到 `v0.1.29`�?
### Fixed
- 修复 `ChooseAssetModal` 无法承载 `projectReference` 的主干缺口�?- 修复模态上传不会进�?project-level persisted reference 主干的问题�?- 修复模态库内确认不会补绑定项目�?persisted reference 的问题�?
### Refactored
- 继续复用 `persistChooseAssetProjectReference(...)` 统一协议，把模态上传和库内确认都收敛到同一 persisted reference 主干，而不是在消费方面板内散落第二套实现�?
### Performance
- 本轮没有新增显式运行时性能优化；通过优先修复共享主干，显著降低了后续多消费方面板逐个接入时的重复改造成本�?
### Security
- `ChooseAssetModal` 首次进入项目�?persisted reference 主干，依赖模态上传或选择的业务链路不再遗漏项目级引用治理、删除保护与资产审计�?
### Tests
- Red:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/chooseAssetModalProjectReference.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`1 test | 1 failed`
  - 失败点：模态类型、桥接组件、模态内�?provider 均未透传 `projectReference`
- Red:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/chooseAssetModalSelectionProjectReference.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`0 test`
  - 原因：缺�?`chooseAssetModalProjectReference.ts`
- Red:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/assetStoreProjectReference.test.tsx --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`1 test | 1 failed`
  - 失败点：模态上传后没有调用 `persistChooseAssetProjectReference(...)`
- Green:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/chooseAssetModalProjectReference.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`1 file, 1 test passed`
- Green:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/chooseAssetModalSelectionProjectReference.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`1 file, 2 tests passed`
- Green:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/assetStoreProjectReference.test.tsx --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`1 file, 1 test passed`
- Regression A:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/chooseAssetIdentity.test.tsx packages/sdkwork-magic-studio-assets/tests/chooseAssetProjectReference.test.tsx packages/sdkwork-magic-studio-assets/tests/chooseAssetModalProjectReference.boundary.test.ts packages/sdkwork-magic-studio-assets/tests/chooseAssetModalSelectionProjectReference.test.ts packages/sdkwork-magic-studio-assets/tests/assetStoreProjectReference.test.tsx packages/sdkwork-magic-studio-assets/tests/assetCenterProjectManagedImport.test.ts packages/sdkwork-magic-studio-assets/tests/assetCenterDeleteSafety.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`7 files, 17 tests passed`
- Regression B:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-video/src/components/modes/SubjectReferenceSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/modes/StartEndFramesSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/modes/LipSyncSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/panel/VideoPromptStyleSection.boundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/panel/VoicePersonaSection.boundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/voicespeaker/VoiceLabModal.boundary.test.ts packages/sdkwork-magic-studio-character/src/components/CharacterLeftGeneratorPanel.boundary.test.ts packages/sdkwork-magic-studio-music/src/components/MusicLeftGeneratorPanel.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`8 files, 8 tests passed`
- Typecheck:
  - `pnpm.cmd exec tsc --skipLibCheck --ignoreConfig --noEmit --jsx react-jsx --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-assets/src/components/ChooseAsset.tsx packages/sdkwork-magic-studio-assets/src/components/ChooseAssetModal.types.ts packages/sdkwork-magic-studio-assets/src/components/ChooseAssetModalContent.tsx packages/sdkwork-magic-studio-assets/src/components/chooseAssetModalProjectReference.ts packages/sdkwork-magic-studio-assets/src/store/assetStore.tsx`
  - 结果：`PASS`
- Existing environment noise:
  - 更大范围资产命令�?`packages/sdkwork-magic-studio-assets/tests/assetStoreIdentity.test.tsx` 时暴露现�?`EPERM` / `indexedDB is not defined` 噪音
  - 结论：不是本轮功能改造引入，已通过拆分受影响范围重新回�?
### Docs
- 更新 `docs/release/VERSION.md`
- 更新 `docs/release/CHANGELOG.md`
- 新增本轮 `review` �?`release` 记录文档

### Release Notes
- 本轮继续停留�?`Step 03`，但主干缺口已经从业务消费点正式推进到了共享资产基础设施，并完成�?`ChooseAssetModal` 的统一收口�?- 这为下一轮批量收�?`VoiceLeftGeneratorPanel`、`VideoLeftGeneratorPanel`、`ImageLeftGeneratorPanel`、`AudioLeftGeneratorPanel` 提供了稳定前提�?
### Known Risks
- 第一批核�?`ChooseAssetModal` 消费方仍未显式声明各自业�?slot / source�?- voicespeaker / character �?`@sdkwork/magic-studio-generation-history` 现有依赖解析阻塞仍未解除�?- 更大范围资产环境测试中仍存在 `indexedDB` 与文件访问噪音，需要独立治理�?
## [v0.1.28] - 2026-04-07

### Added
- 新增 `docs/review/2026-04-07-step-03-voice-lab-binding.md`，沉淀 `VoiceLabModal` 两个槽位接入项目�?persisted reference �?review 证据�?- 新增 `docs/release/2026-04-07-v0.1.28-迭代记录.md`，记录本�?`VoiceLabModal` 闭环的实现、验证与剩余消费面盘点�?- 新增 `packages/sdkwork-magic-studio-voicespeaker/src/components/voicespeaker/VoiceLabModal.boundary.test.ts`，固�?`voice-lab-avatar` �?`voice-lab-reference-audio` 已声�?`projectReference` 的边界证据�?
### Changed
- 更新 `packages/sdkwork-magic-studio-voicespeaker/src/components/voicespeaker/VoiceLabModal.tsx`，为头像输入显式声明 `slot: 'voice-lab-avatar'`，为参考音频输入显式声�?`slot: 'voice-lab-reference-audio'`，并统一附加 `source: 'voice-lab-modal'` metadata�?- 更新 `docs/release/VERSION.md`，将当前执行状态推进到 `v0.1.28`�?
### Fixed
- 修复 `voicespeaker / VoiceLabModal` 的头像和克隆参考音频没有进�?project-level persisted reference 主干的问题�?- 修复声音实验室关键素材链路仍然游离于项目级资产治理之外的断层�?
### Refactored
- 继续复用 `ChooseAsset.projectReference` 统一协议，把 `VoiceLabModal` 的两个直接资产入口收敛到共享 persisted reference 主干，而不是在模态内部散落资产中心逻辑�?
### Performance
- 本轮没有新增显式运行时性能优化；通过完成 `VoiceLabModal` 收口，进一步压缩了后续转向 `ChooseAssetModal` 主干治理时的业务分叉面�?
### Security
- `VoiceLabModal` 的头像与参考音频首次进入项目级 persisted reference 主干，删除保护与资产审计不再遗漏声音实验室的关键素材输入路径�?
### Tests
- Red:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-voicespeaker/src/components/voicespeaker/VoiceLabModal.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`1 test | 1 failed`
  - 失败点：源码缺少 `projectReference`、`voice-lab-avatar`、`voice-lab-reference-audio`、`voice-lab-modal`
- Green:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-voicespeaker/src/components/voicespeaker/VoiceLabModal.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`1 file, 1 test passed`
- Regression A:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/chooseAssetIdentity.test.tsx packages/sdkwork-magic-studio-assets/tests/chooseAssetProjectReference.test.tsx packages/sdkwork-magic-studio-assets/tests/assetCenterProjectManagedImport.test.ts packages/sdkwork-magic-studio-assets/tests/assetCenterDeleteSafety.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`4 files, 13 tests passed`
- Regression B:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-video/src/components/modes/SubjectReferenceSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/modes/StartEndFramesSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/modes/LipSyncSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/panel/VideoPromptStyleSection.boundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/panel/VoicePersonaSection.boundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/voicespeaker/VoiceLabModal.boundary.test.ts packages/sdkwork-magic-studio-character/src/components/CharacterLeftGeneratorPanel.boundary.test.ts packages/sdkwork-magic-studio-music/src/components/MusicLeftGeneratorPanel.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`8 files, 8 tests passed`
- Typecheck attempt:
  - `pnpm.cmd exec tsc --skipLibCheck --ignoreConfig --noEmit --jsx react-jsx --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-voicespeaker/src/components/voicespeaker/VoiceLabModal.tsx`
  - 结果：`FAIL`
  - 阻塞：`@sdkwork/magic-studio-generation-history` 在当前定�?`tsc --ignoreConfig` 中无法解�?
### Docs
- 更新 `docs/release/VERSION.md`
- 更新 `docs/release/CHANGELOG.md`
- 新增本轮 `review` �?`release` 记录文档

### Release Notes
- 本轮继续停留�?`Step 03`，把项目�?persisted reference 从视频、voicespeaker、character、music 进一步扩展到�?`VoiceLabModal` 的关键素材入口�?- 同时通过仓库盘点确认下一阶段的主干缺口已经转�?`ChooseAssetModal` 透传能力，而不是继续零散补点�?
### Known Risks
- `ChooseAssetModal` 主干尚未支持 `projectReference` 透传�?- 多个核心消费方仍依赖 `ChooseAssetModal`，包�?`VoiceLeftGeneratorPanel`、`VideoLeftGeneratorPanel`、`ImageLeftGeneratorPanel`、`AudioLeftGeneratorPanel`�?- character / voicespeaker �?`@sdkwork/magic-studio-generation-history` 现有依赖解析阻塞仍未解除�?
## [v0.1.27] - 2026-04-07

### Added
- 新增 `docs/review/2026-04-07-step-03-music-source-binding.md`，沉淀 `MusicLeftGeneratorPanel` 音乐来源槽位接入项目�?persisted reference �?review 证据�?- 新增 `docs/release/2026-04-07-v0.1.27-迭代记录.md`，记录本轮音乐来源闭环的实现、验证与跨包扩展结论�?- 新增 `packages/sdkwork-magic-studio-music/src/components/MusicLeftGeneratorPanel.boundary.test.ts`，固�?`source-music` 槽位已经声明 `projectReference` 的边界证据�?
### Changed
- 更新 `packages/sdkwork-magic-studio-music/src/components/MusicLeftGeneratorPanel.tsx`，为音乐来源输入显式声明 `slot: 'source-music'`，并附加 `source: 'music-left-generator-panel'` metadata�?- 更新 `docs/release/VERSION.md`，将当前执行状态推进到 `v0.1.27`�?
### Fixed
- 修复 `music / MusicLeftGeneratorPanel` 的音乐来源素材上传后没有进入 project-level persisted reference 主干的问题�?- 修复音乐创作链路中的来源素材仍然游离于项目级资产治理之外的断层�?
### Refactored
- 继续复用 `ChooseAsset.projectReference` 统一协议，把音乐来源输入收敛到共�?persisted reference 主干，而不是在音乐面板内散落资产中心逻辑�?
### Performance
- 本轮没有新增显式运行时性能优化；通过�?music 入口纳入统一协议，降低了后续继续扩展 `VoiceLabModal` �?`ChooseAssetModal` 路径时的重复实现成本�?
### Security
- 音乐来源首次进入项目�?persisted reference 主干，删除保护与资产审计不再遗漏这条真实音乐输入路径，降低误删和引用失管风险�?
### Tests
- Red:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-music/src/components/MusicLeftGeneratorPanel.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`1 test | 1 failed`
  - 失败点：源码缺少 `projectReference`、`source-music`、`music-left-generator-panel`
- Green:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-music/src/components/MusicLeftGeneratorPanel.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`1 file, 1 test passed`
- Regression A:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/chooseAssetIdentity.test.tsx packages/sdkwork-magic-studio-assets/tests/chooseAssetProjectReference.test.tsx packages/sdkwork-magic-studio-assets/tests/assetCenterProjectManagedImport.test.ts packages/sdkwork-magic-studio-assets/tests/assetCenterDeleteSafety.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`4 files, 13 tests passed`
- Regression B:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-video/src/components/modes/SubjectReferenceSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/modes/StartEndFramesSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/modes/LipSyncSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/panel/VideoPromptStyleSection.boundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/panel/VoicePersonaSection.boundary.test.ts packages/sdkwork-magic-studio-character/src/components/CharacterLeftGeneratorPanel.boundary.test.ts packages/sdkwork-magic-studio-music/src/components/MusicLeftGeneratorPanel.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`7 files, 7 tests passed`
- Typecheck attempt:
  - `pnpm.cmd exec tsc --skipLibCheck --ignoreConfig --noEmit --jsx react-jsx --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-music/src/components/MusicLeftGeneratorPanel.tsx`
  - 结果：`PASS`

### Docs
- 更新 `docs/release/VERSION.md`
- 更新 `docs/release/CHANGELOG.md`
- 新增本轮 `review` �?`release` 记录文档

### Release Notes
- 本轮继续停留�?`Step 03`，把项目�?persisted reference 从视频、voicespeaker、character 进一步扩展到�?music 音乐来源入口�?- 这说明跨包统一治理正在继续收敛，而不是停留在单包内部�?
### Known Risks
- `VoiceLabModal` 仍未接入，下一轮需继续扩展�?- character / voicespeaker �?`@sdkwork/magic-studio-generation-history` 现有依赖解析阻塞仍未解除�?- `ChooseAssetModal` 消费面仍未做 persisted reference 审计，需独立处理�?
## [v0.1.26] - 2026-04-07

### Added
- 新增 `docs/review/2026-04-07-step-03-character-avatar-binding.md`，沉淀 `CharacterLeftGeneratorPanel` 角色头像槽位接入项目�?persisted reference �?review 证据�?- 新增 `docs/release/2026-04-07-v0.1.26-迭代记录.md`，记录本轮角色头像闭环的实现、验证与跨包扩展结论�?- 新增 `packages/sdkwork-magic-studio-character/src/components/CharacterLeftGeneratorPanel.boundary.test.ts`，固�?`character-avatar` 槽位已经声明 `projectReference` 的边界证据�?
### Changed
- 更新 `packages/sdkwork-magic-studio-character/src/components/CharacterLeftGeneratorPanel.tsx`，为角色头像输入显式声明 `slot: 'character-avatar'`，并附加 `source: 'character-left-generator-panel'` metadata�?- 更新 `docs/release/VERSION.md`，将当前执行状态推进到 `v0.1.26`�?
### Fixed
- 修复 `character / CharacterLeftGeneratorPanel` 的角色头像上传后没有进入 project-level persisted reference 主干的问题�?- 修复角色创作链路中的头像资产仍然游离于项目级资产治理之外的断层�?
### Refactored
- 继续复用 `ChooseAsset.projectReference` 统一协议，把角色头像输入收敛到共�?persisted reference 主干，而不是在角色面板内散落资产中心逻辑�?
### Performance
- 本轮没有新增显式运行时性能优化；通过�?character 头像入口纳入统一协议，降低了后续继续扩展音乐、VoiceLab 等路径时的重复实现成本�?
### Security
- 角色头像首次进入项目�?persisted reference 主干，删除保护与资产审计不再遗漏这条真实角色输入路径，降低误删和引用失管风险�?
### Tests
- Red:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-character/src/components/CharacterLeftGeneratorPanel.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`1 test | 1 failed`
  - 失败点：源码缺少 `projectReference`、`character-avatar`、`character-left-generator-panel`
- Green:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-character/src/components/CharacterLeftGeneratorPanel.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`1 file, 1 test passed`
- Regression A:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/chooseAssetIdentity.test.tsx packages/sdkwork-magic-studio-assets/tests/chooseAssetProjectReference.test.tsx packages/sdkwork-magic-studio-assets/tests/assetCenterProjectManagedImport.test.ts packages/sdkwork-magic-studio-assets/tests/assetCenterDeleteSafety.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`4 files, 13 tests passed`
- Regression B:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-video/src/components/modes/SubjectReferenceSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/modes/StartEndFramesSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/modes/LipSyncSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/panel/VideoPromptStyleSection.boundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/panel/VoicePersonaSection.boundary.test.ts packages/sdkwork-magic-studio-character/src/components/CharacterLeftGeneratorPanel.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`6 files, 6 tests passed`
- Typecheck attempt:
  - `pnpm.cmd exec tsc --skipLibCheck --ignoreConfig --noEmit --jsx react-jsx --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-character/src/components/CharacterLeftGeneratorPanel.tsx`
  - 结果：`FAIL`
  - 阻塞：`@sdkwork/magic-studio-generation-history` 在当前定�?`tsc --ignoreConfig` 中无法解析，并连带触�?`VoiceLabModal.tsx` 的同类问�?
### Docs
- 更新 `docs/release/VERSION.md`
- 更新 `docs/release/CHANGELOG.md`
- 新增本轮 `review` �?`release` 记录文档

### Release Notes
- 本轮继续停留�?`Step 03`，把项目�?persisted reference 从视频、voicespeaker 进一步扩展到�?character 角色头像入口�?- 这说明跨包统一治理正在继续收敛，而不是停留在单包内部�?
### Known Risks
- `MusicLeftGeneratorPanel`、`VoiceLabModal` 仍未接入，下一轮需继续扩展�?- `@sdkwork/magic-studio-generation-history` �?character / voicespeaker 的定向类型校验中仍存在现有依赖解析阻塞�?- `ChooseAssetModal` 消费面仍未做 persisted reference 审计，需独立处理�?
## [v0.1.25] - 2026-04-07

### Added
- 新增 `docs/review/2026-04-07-step-03-voice-persona-avatar-binding.md`，沉淀 `VoicePersonaSection` 头像槽位接入项目�?persisted reference �?review 证据�?- 新增 `docs/release/2026-04-07-v0.1.25-迭代记录.md`，记录本�?voicespeaker 人设头像闭环的实现、验证与跨包扩展结论�?- 新增 `packages/sdkwork-magic-studio-voicespeaker/src/components/panel/VoicePersonaSection.boundary.test.ts`，固�?`persona-avatar` 头像槽位已经声明 `projectReference` 的边界证据�?
### Changed
- 更新 `packages/sdkwork-magic-studio-voicespeaker/src/components/panel/VoicePersonaSection.tsx`，为人设头像输入显式声明 `slot: 'persona-avatar'`，并附加 `source: 'voice-persona-section'` metadata�?- 更新 `docs/release/VERSION.md`，将当前执行状态推进到 `v0.1.25`�?
### Fixed
- 修复 `voicespeaker / VoicePersonaSection` 的头像上传后没有进入 project-level persisted reference 主干的问题�?- 修复声音人格头像仍然游离于项目级资产治理、删除保护、引用审计之外的断层�?
### Refactored
- 继续复用 `ChooseAsset.projectReference` 统一协议，把 voicespeaker 人设头像输入收敛到共�?persisted reference 主干，而不是在面板层散落资产中心逻辑�?
### Performance
- 本轮没有新增显式运行时性能优化；通过把跨包的第一�?voicespeaker 入口收敛到统一协议，降低了后续继续扩展角色、音乐、VoiceLab 等路径时的重复实现成本�?
### Security
- 人设头像首次进入项目�?persisted reference 主干，删除保护与资产审计不再遗漏这条真实 voicespeaker 输入路径，降低误删和引用失管风险�?
### Tests
- Red:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-voicespeaker/src/components/panel/VoicePersonaSection.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`1 test | 1 failed`
  - 失败点：源码缺少 `projectReference`、`persona-avatar`、`voice-persona-section`
- Green:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-voicespeaker/src/components/panel/VoicePersonaSection.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`1 file, 1 test passed`
- Regression A:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/chooseAssetIdentity.test.tsx packages/sdkwork-magic-studio-assets/tests/chooseAssetProjectReference.test.tsx packages/sdkwork-magic-studio-assets/tests/assetCenterProjectManagedImport.test.ts packages/sdkwork-magic-studio-assets/tests/assetCenterDeleteSafety.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`4 files, 13 tests passed`
- Regression B:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-video/src/components/modes/SubjectReferenceSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/modes/StartEndFramesSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/modes/LipSyncSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/panel/VideoPromptStyleSection.boundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/panel/VoicePersonaSection.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`5 files, 5 tests passed`
- Additional verification:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/chooseAssetProjectReference.test.tsx --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`1 file, 2 tests passed`
- Typecheck attempt:
  - `pnpm.cmd exec tsc --skipLibCheck --ignoreConfig --noEmit --jsx react-jsx --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-voicespeaker/src/components/panel/VoicePersonaSection.tsx`
  - 结果：`FAIL`
  - 阻塞：`packages/sdkwork-magic-studio-voicespeaker/src/components/panel/types.ts` 无法解析 `@sdkwork/magic-studio-generation-history`

### Docs
- 更新 `docs/release/VERSION.md`
- 更新 `docs/release/CHANGELOG.md`
- 新增本轮 `review` �?`release` 记录文档

### Release Notes
- 本轮继续停留�?`Step 03`，把项目�?persisted reference 从视频包扩展到了 voicespeaker 的人设头像入口�?- 这标志着跨包统一治理已经开始产生真实收敛，不再只停留在单一业务包�?
### Known Risks
- `CharacterLeftGeneratorPanel`、`MusicLeftGeneratorPanel`、`VoiceLabModal` 仍未接入，下一轮需继续扩展�?- voicespeaker 包当前存在现有类型依赖解析阻塞：`@sdkwork/magic-studio-generation-history` 无法在当前定�?`tsc --ignoreConfig` 中解析�?- `ChooseAssetModal` 消费面仍未做 persisted reference 审计，需独立处理�?
## [v0.1.24] - 2026-04-07

### Added
- 新增 `docs/review/2026-04-07-step-03-video-prompt-style-soundtrack-binding.md`，沉淀 `VideoPromptStyleSection` 音轨槽位接入项目�?persisted reference �?review 证据�?- 新增 `docs/release/2026-04-07-v0.1.24-迭代记录.md`，记录本轮音轨入口闭环的实现、验证与视频包阶段性收口结论�?- 新增 `packages/sdkwork-magic-studio-video/src/components/panel/VideoPromptStyleSection.boundary.test.ts`，固�?`audio-track` 音轨槽位已经声明 `projectReference` 的边界证据�?
### Changed
- 更新 `packages/sdkwork-magic-studio-video/src/components/panel/VideoPromptStyleSection.tsx`，为 `Optional Soundtrack` 显式声明 `slot: 'audio-track'`，并附加 `source: 'video-prompt-style-section'` metadata�?- 更新 `docs/release/VERSION.md`，将当前执行状态推进到 `v0.1.24`�?
### Fixed
- 修复 `video-studio / VideoPromptStyleSection` 的可选音轨上传后没有进入 project-level persisted reference 主干的问题�?- 修复视频包内最后一个直�?`ChooseAsset` 音频输入仍然游离于项目级资产治理之外的断层�?
### Refactored
- 继续复用 `ChooseAsset.projectReference` 统一协议，把视频包中剩余的直�?`ChooseAsset` 消费点收敛到共享 persisted reference 主干，而不是在面板层散落资产中心逻辑�?
### Performance
- 本轮没有新增显式运行时性能优化；通过完成视频包内直接 `ChooseAsset` 消费面阶段性收口，降低了后续继续扩展到其他包时的重复实现与回归成本�?
### Security
- 可选音轨首次进入项目级 persisted reference 主干，视频模式的删除保护与资产审计不再遗漏这条真实音频输入路径，进一步降低误删和引用失管风险�?
### Tests
- Red:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-video/src/components/panel/VideoPromptStyleSection.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`1 test | 1 failed`
  - 失败点：源码缺少 `projectReference`、`audio-track`、`video-prompt-style-section`
- Green:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-video/src/components/panel/VideoPromptStyleSection.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`1 file, 1 test passed`
- Regression:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/chooseAssetIdentity.test.tsx packages/sdkwork-magic-studio-assets/tests/chooseAssetProjectReference.test.tsx packages/sdkwork-magic-studio-assets/tests/assetCenterProjectManagedImport.test.ts packages/sdkwork-magic-studio-assets/tests/assetCenterDeleteSafety.test.ts packages/sdkwork-magic-studio-video/src/components/modes/SubjectReferenceSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/modes/StartEndFramesSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/modes/LipSyncSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/panel/VideoPromptStyleSection.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`8 files, 17 tests passed`
- Typecheck:
  - `pnpm.cmd exec tsc --skipLibCheck --ignoreConfig --noEmit --jsx react-jsx --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-assets/src/components/ChooseAsset.tsx packages/sdkwork-magic-studio-assets/src/components/chooseAssetProjectReference.ts packages/sdkwork-magic-studio-video/src/components/modes/SubjectReferenceSection.tsx packages/sdkwork-magic-studio-video/src/components/modes/StartEndFramesSection.tsx packages/sdkwork-magic-studio-video/src/components/modes/LipSyncSection.tsx packages/sdkwork-magic-studio-video/src/components/panel/VideoPromptStyleSection.tsx`
  - 结果：`PASS`

### Docs
- 更新 `docs/release/VERSION.md`
- 更新 `docs/release/CHANGELOG.md`
- 新增本轮 `review` �?`release` 记录文档

### Release Notes
- 本轮继续停留�?`Step 03`，把视频包内最后一个直�?`ChooseAsset` 消费�?`Optional Soundtrack` 也纳入了项目�?persisted reference 主干�?- 这使视频包中的直�?`ChooseAsset` 输入在资产治理语义上形成阶段性闭环，但并不等于仓库级 `ChooseAsset` 全量完成�?
### Known Risks
- 仓库中仍存在视频包之外的直接 `ChooseAsset` 消费点，下一轮需扩展�?`VoicePersonaSection / CharacterLeftGeneratorPanel / MusicLeftGeneratorPanel` 等路径�?- `ChooseAssetModal` 消费面仍未做 persisted reference 审计，需独立处理�?- 本轮没有执行全仓 `test / typecheck / build`，不能外推为仓库级完成�?
## [v0.1.23] - 2026-04-07

### Added
- 新增 `docs/review/2026-04-07-step-03-lipsync-reference-binding.md`，沉淀 `LipSyncSection` 三个媒体槽位接入项目�?persisted reference �?review 证据�?- 新增 `docs/release/2026-04-07-v0.1.23-迭代记录.md`，记录本�?Lip Sync 输入入口闭环的实现、验证与剩余边界�?- 新增 `packages/sdkwork-magic-studio-video/src/components/modes/LipSyncSection.boundary.test.ts`，固�?`source-video / source-image / driver-audio` 三个真实槽位已经声明 `projectReference` 的边界证据�?
### Changed
- 更新 `packages/sdkwork-magic-studio-video/src/components/modes/LipSyncSection.tsx`，为源视频、源人像、驱动音频三个真实媒体输入显式声明稳�?slot，并统一附加 `source: 'lip-sync-section'` metadata�?- 更新 `docs/release/VERSION.md`，将当前执行状态推进到 `v0.1.23`�?
### Fixed
- 修复 `video-studio / LipSyncSection` 三个真实媒体输入入口上传后没有进�?project-level persisted reference 主干的问题�?- 修复 Lip Sync 创作链路中源媒体与驱动音频只能上传但无法被项目级资产治理识别的断层�?
### Refactored
- 继续复用 `ChooseAsset.projectReference` 统一协议，把 Lip Sync 媒体输入收敛到共�?persisted reference 主干，而不是在视频 UI 中散落资产中心逻辑�?
### Performance
- 本轮没有新增显式运行时性能优化；通过继续沿用共享 `projectReference` 主干，降低了后续继续扩展更多视频输入槽位时的重复实现与回归成本�?
### Security
- Lip Sync 所需源视频、源人像、驱动音频首次进入项目级 persisted reference 主干，删除保护与资产审计不再遗漏这三条核心视频输入路径，降低误删和引用失管风险�?
### Tests
- Red:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-video/src/components/modes/LipSyncSection.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`1 test | 1 failed`
  - 失败点：源码缺少 `projectReference`、`source-video`、`source-image`、`driver-audio`
- Green:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-video/src/components/modes/LipSyncSection.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`1 file, 1 test passed`
- Regression:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/chooseAssetIdentity.test.tsx packages/sdkwork-magic-studio-assets/tests/chooseAssetProjectReference.test.tsx packages/sdkwork-magic-studio-assets/tests/assetCenterProjectManagedImport.test.ts packages/sdkwork-magic-studio-assets/tests/assetCenterDeleteSafety.test.ts packages/sdkwork-magic-studio-video/src/components/modes/SubjectReferenceSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/modes/StartEndFramesSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/modes/LipSyncSection.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`7 files, 16 tests passed`
- Typecheck:
  - `pnpm.cmd exec tsc --skipLibCheck --ignoreConfig --noEmit --jsx react-jsx --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-assets/src/components/ChooseAsset.tsx packages/sdkwork-magic-studio-assets/src/components/chooseAssetProjectReference.ts packages/sdkwork-magic-studio-video/src/components/modes/SubjectReferenceSection.tsx packages/sdkwork-magic-studio-video/src/components/modes/StartEndFramesSection.tsx packages/sdkwork-magic-studio-video/src/components/modes/LipSyncSection.tsx`
  - 结果：`PASS`

### Docs
- 更新 `docs/release/VERSION.md`
- 更新 `docs/release/CHANGELOG.md`
- 新增本轮 `review` �?`release` 记录文档

### Release Notes
- 本轮继续停留�?`Step 03`，把项目�?persisted reference 从主体参考图、起止帧扩展到了 `LipSyncSection` 的三条核心媒体输入路径�?- 这不是宣�?`ChooseAsset` 全面完成，而是继续让真实视频创作入口从“可上传”推进到“可治理、可审计、可保护”�?
### Known Risks
- `VideoPromptStyleSection` �?`Optional Soundtrack` 仍未接入，仍是下一轮优先主任务�?- 视频包之外的 `ChooseAsset` 消费面仍未全量收口，`Step 03` 不能宣布结束�?- 本轮没有执行全仓 `test / typecheck / build`，不能外推为仓库级完成�?
## [v0.1.22] - 2026-04-07

### Added
- 新增 `docs/review/2026-04-07-step-03-start-end-frames-reference-binding.md`，沉淀 `StartEndFramesSection` 接入项目�?persisted reference �?review 证据�?- 新增 `docs/release/2026-04-07-v0.1.22-迭代记录.md`，记录本轮双帧输入入口闭环的实现、验证与剩余边界�?- 新增 `packages/sdkwork-magic-studio-video/src/components/modes/StartEndFramesSection.boundary.test.ts`，固�?`start-frame / end-frame` 两个真实槽位已经声明 `projectReference` 的边界证据�?
### Changed
- 更新 `packages/sdkwork-magic-studio-video/src/components/modes/StartEndFramesSection.tsx`，为 `Start Image` 显式声明 `slot: 'start-frame'`，为 `End Image` 显式声明 `slot: 'end-frame'`，并统一附加 `source: 'start-end-frames-section'` metadata�?- 更新 `docs/release/VERSION.md`，将当前执行状态推进到 `v0.1.22`�?
### Fixed
- 修复 `video-studio / StartEndFramesSection` 两个真实图片输入入口上传后没有进�?project-level persisted reference 主干的问题�?- 修复双帧视频生成链路中起始帧、结束帧只能上传但无法被项目级资产治理识别的断层�?
### Refactored
- 继续复用 `ChooseAsset.projectReference` 统一协议，把双帧输入收敛到共�?persisted reference 主干，而不是在视频 UI 组件中散落资产中心逻辑�?
### Performance
- 本轮没有新增显式运行时性能优化；通过复用共享 `projectReference` 主干，降低了后续继续扩展更多视频输入槽位时的重复实现与回归成本�?
### Security
- 起始帧、结束帧首次进入项目�?persisted reference 主干，删除保护与资产审计不再遗漏这两条真实视频输入路径，降低误删和引用失管风险�?
### Tests
- Red:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-video/src/components/modes/StartEndFramesSection.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`1 test | 1 failed`
  - 失败点：源码缺少 `projectReference`、`start-frame`、`end-frame`
- Green:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-video/src/components/modes/StartEndFramesSection.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`1 file, 1 test passed`
- Regression:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/chooseAssetIdentity.test.tsx packages/sdkwork-magic-studio-assets/tests/chooseAssetProjectReference.test.tsx packages/sdkwork-magic-studio-assets/tests/assetCenterProjectManagedImport.test.ts packages/sdkwork-magic-studio-assets/tests/assetCenterDeleteSafety.test.ts packages/sdkwork-magic-studio-video/src/components/modes/SubjectReferenceSection.boundary.test.ts packages/sdkwork-magic-studio-video/src/components/modes/StartEndFramesSection.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`6 files, 15 tests passed`
- Typecheck:
  - `pnpm.cmd exec tsc --skipLibCheck --ignoreConfig --noEmit --jsx react-jsx --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-assets/src/components/ChooseAsset.tsx packages/sdkwork-magic-studio-assets/src/components/chooseAssetProjectReference.ts packages/sdkwork-magic-studio-video/src/components/modes/SubjectReferenceSection.tsx packages/sdkwork-magic-studio-video/src/components/modes/StartEndFramesSection.tsx`
  - 结果：`PASS`

### Docs
- 更新 `docs/release/VERSION.md`
- 更新 `docs/release/CHANGELOG.md`
- 新增本轮 `review` �?`release` 记录文档

### Release Notes
- 本轮继续停留�?`Step 03`，但把项目级 persisted reference �?`SubjectReferenceSection` 扩展到了第二个真实视频入�?`StartEndFramesSection`�?- 这不是宣�?`ChooseAsset` 全面完成，而是继续把真实视频输入路径从“可上传”推进到“可治理、可审计、可保护”�?
### Known Risks
- `LipSyncSection` 仍未接入，仍是下一轮优先主任务�?- `ChooseAsset` 全量消费面还未收口，`Step 03` 不能宣布结束�?- 本轮没有执行全仓 `test / typecheck / build`，不能外推为仓库级完成�?
## [v0.1.21] - 2026-04-07

### Added
- 新增 `docs/review/2026-04-07-step-03-choose-asset-subject-reference-binding.md`，沉淀 `ChooseAsset` 首个真实视频入口接入 project-level persisted reference �?review 证据�?- 新增 `docs/release/2026-04-07-v0.1.21-迭代记录.md`，记录本�?`ChooseAsset` -> `SubjectReferenceSection` 闭环的实现、验证与剩余边界�?- 新增 `packages/sdkwork-magic-studio-assets/tests/chooseAssetProjectReference.test.tsx`，覆�?`registerExistingAsset(...)` �?`bindReference(...)` 两条真实上传路径�?- 新增 `packages/sdkwork-magic-studio-video/src/components/modes/SubjectReferenceSection.boundary.test.ts`，固定真实消费方已经声明 `projectReference` 契约的边界证据�?
### Changed
- 更新 `packages/sdkwork-magic-studio-assets/src/components/ChooseAsset.tsx`，新增可�?`projectReference`，让本地上传在显式声明项目引用语义时自动进入 asset-center persisted reference 主干�?- 更新 `packages/sdkwork-magic-studio-assets/src/choose-asset/index.ts`，导�?`ChooseAssetProjectReference` 类型�?- 更新 `packages/sdkwork-magic-studio-video/src/components/modes/SubjectReferenceSection.tsx`，为视频主体参考图声明 `slot: subject-reference` �?`source: subject-reference-section`�?- 更新 `packages/sdkwork-magic-studio-assets/tests/chooseAssetIdentity.test.tsx`，收�?mock 到真实导入路径，消除 `indexedDB is not defined` 假阳性�?- 更新 `docs/release/VERSION.md`，将当前执行状态推进到 `v0.1.21`�?
### Fixed
- 修复 `ChooseAsset` 在本地上传成功后只做 SDK 导入、却完全没有登记 project-level persisted reference 的问题�?- 修复 `video-studio / SubjectReferenceSection` 的主体参考图上传无法进入 asset-center 项目级引用治理面的断层�?- 修复 `chooseAssetIdentity` 测试�?mock 路径漂移导致底层 `indexedDB` 被意外拉起的假回归问题�?
### Refactored
- 新增 `packages/sdkwork-magic-studio-assets/src/components/chooseAssetProjectReference.ts`，把 `ChooseAsset` �?project-level persisted reference 落库逻辑�?UI 组件内部收敛到私�?helper，保持组件边界清晰�?
### Performance
- 本轮没有新增显式运行时性能优化；通过�?persisted reference 写回逻辑收敛到单一 helper，降低后续扩展多�?`ChooseAsset` 消费入口时的重复实现与回归成本�?
### Security
- 视频主体参考图首次进入资产中心 project-level persisted reference 主干，删除保护与项目级资产审计不再遗漏这条真实业务路径，降低误删与引用失管风险�?
### Tests
- Red:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/chooseAssetProjectReference.test.tsx packages/sdkwork-magic-studio-video/src/components/modes/SubjectReferenceSection.test.tsx --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`ChooseAsset` persisted reference 用例失败，证明上传链路没有进�?asset-center persisted reference 主干；同时暴�?video �?TSX import-analysis blocker�?- Green:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/chooseAssetProjectReference.test.tsx packages/sdkwork-magic-studio-video/src/components/modes/SubjectReferenceSection.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`2 files, 3 tests passed`
- Regression:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/chooseAssetIdentity.test.tsx packages/sdkwork-magic-studio-assets/tests/chooseAssetProjectReference.test.tsx packages/sdkwork-magic-studio-assets/tests/assetCenterProjectManagedImport.test.ts packages/sdkwork-magic-studio-assets/tests/assetCenterDeleteSafety.test.ts packages/sdkwork-magic-studio-video/src/components/modes/SubjectReferenceSection.boundary.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`5 files, 14 tests passed`
- Typecheck:
  - `pnpm.cmd exec tsc --skipLibCheck --ignoreConfig --noEmit --jsx react-jsx --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-assets/src/components/ChooseAsset.tsx packages/sdkwork-magic-studio-assets/src/components/chooseAssetProjectReference.ts packages/sdkwork-magic-studio-video/src/components/modes/SubjectReferenceSection.tsx`
  - 结果：`PASS`

### Docs
- 更新 `docs/release/VERSION.md`
- 更新 `docs/release/CHANGELOG.md`
- 新增本轮 `review` �?`release` 记录文档

### Release Notes
- 本轮继续停留�?`Step 03`，但首次让一个真�?`ChooseAsset` 消费入口进入 project-level persisted reference 主干�?- 这不是宣�?`ChooseAsset` 全面完成，而是�?`video-studio / SubjectReferenceSection` 从“可上传”推进到“可治理、可审计、可阻断误删”�?
### Known Risks
- `ChooseAsset` 全量消费面仍未接入，`StartEndFramesSection / LipSyncSection / 其他 ChooseAsset` 入口仍待补齐�?- `SubjectReferenceSection` 运行时消费方验证在当前定向配置下仍受 video �?TSX import-analysis blocker 影响，本轮采�?source boundary 固化消费方证据�?- `Step 03` 不能宣告结束，`alpha` 不能开启�?
## [v0.1.20] - 2026-04-07

### Added
- 新增 `docs/review/2026-04-07-step-03-asset-center-sdk-root-export-convergence.md`，沉淀 Step 03 第十六轮 shared wrapper 收敛�?review 证据�?- 新增 `docs/release/2026-04-07-v0.1.20-迭代记录.md`，记录本轮真实根因、实现、验证与后续建议�?
### Changed
- 更新 `packages/sdkwork-magic-studio-core/src/sdk/assetCenterClient.ts`，停止直接依�?`@sdkwork/app-sdk/api/*`、`@sdkwork/app-sdk/http/*`、`@sdkwork/app-sdk/types/*`，改为从 `@sdkwork/app-sdk` 根导出统一消费 `createAssetCenterApi`、`createUploadApi`、`createHttpClient` 与相关类型�?- 更新 `tests/assetsFocusedSdkClientBoundary.node.test.mjs`，将 shared wrapper 边界从“依�?subpath exports”收敛为“依赖真实可解析�?generated SDK root export”，同时继续禁止 `createClient(...)` 回退�?- 更新 `docs/release/VERSION.md`，将当前执行状态推进到 `v0.1.20`�?
### Fixed
- 修复 `assetCenterClient.ts` �?npm mode / node_modules Junction / `tsc --ignoreConfig` 下因 `@sdkwork/app-sdk/*` subpath exports 缺失而导致的 Canvas 定向 typecheck 阻塞�?- 修复一次“本�?mirror 已修、真实解析包未修”的�?GREEN 风险，把问题收敛到真正参与解析的 shared SDK 包路径�?
### Refactored
- �?focused asset-center shared wrapper 收敛�?shared app SDK 根导出，同时保持只组合资产中心与上传能力，不回退�?broad generated client singleton�?
### Performance
- 本轮没有引入新的运行时性能优化；通过消除解析链差异带来的编译脆弱性，降低了多模式构建与回归验证的返工成本�?
### Security
- 本轮没有直接新增安全机制；通过禁止�?blocker 压力下回退�?package-local HTTP �?broad client workaround，维持了远程业务统一�?shared app SDK 的治理边界�?
### Tests
- Red:
  - `node tests/assetsFocusedSdkClientBoundary.node.test.mjs`
  - 结果：`7 tests | 1 failed`
  - 失败点：`assetCenterClient.ts` 仍依�?unresolved `@sdkwork/app-sdk/*` subpath exports
- Green:
  - `node tests/assetsFocusedSdkClientBoundary.node.test.mjs`
  - 结果：`7 tests passed`
- Typecheck:
  - `pnpm.cmd exec tsc --skipLibCheck --ignoreConfig --noEmit --jsx react-jsx --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageAttachment.ts packages/sdkwork-magic-studio-canvas/src/components/CanvasNode.tsx`
  - 结果：`PASS`
- Runtime verification:
  - `node --input-type=module -e "const sdk = await import('@sdkwork/app-sdk'); console.log(typeof sdk.createAssetCenterApi, typeof sdk.createUploadApi, typeof sdk.createHttpClient);"`
  - 结果：`function function function`
- Regression:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/assetCenterProjectManagedImport.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`1 file, 7 tests passed`
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/assetCenterDeleteSafety.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`1 file, 3 tests passed`

### Docs
- 更新 `docs/release/VERSION.md`
- 更新 `docs/release/CHANGELOG.md`
- 新增本轮 `review` �?`release` 记录文档

### Release Notes
- 本轮继续停留�?`Step 03`，但焦点从“尝试补 shared SDK subpath exports”收敛为“让 Magic Studio shared wrapper 不再依赖当前无法解析�?subpath exports”�?- 该调整直接恢复了 Canvas 主路径的定向编译能力，并保住了已�?asset-center 主干回归链路�?
### Known Risks
- 外部共享 `@sdkwork/app-sdk` 契约源当前仍未补�?`./api/*`、`./http/*`、`./types/*` exports；本轮只是解�?Magic Studio 当前主路�?blocker，不是源头治理完成�?- 如果后续新代码再次直接导�?`@sdkwork/app-sdk/*`，问题仍可能复发�?- `ChooseAsset` node/web �?persisted reference 收口仍未完成，`Step 03` 不能宣告结束�?
## [v0.1.19] - 2026-04-07

### Added
- 新增 `docs/review/2026-04-07-step-03-asset-center-bind-reference-metadata-refresh.md`，沉淀 Step 03 本轮 asset-center 主干 review 证据
- 新增 `docs/release/2026-04-07-v0.1.19-迭代记录.md`，记录本轮真实变更、验证、阻塞与后续建议
- 新增 `packages/sdkwork-magic-studio-assets/tests/assetCenterProjectManagedImport.test.ts` 中的重复绑定 metadata 刷新 RED/GREEN 用例

### Changed
- 更新 `packages/sdkwork-magic-studio-assets/src/asset-center/application/AssetCenterService.ts`，让 `bindReference(...)` 在同一 `(domain, entityType, entityId, relation, slot)` 命中时执行引用对象更新，而不是保留旧 metadata
- 更新 `docs/release/VERSION.md`，将当前执行状态推进到 `v0.1.19`

### Fixed
- 修复 project-level persisted reference 在重复绑定同 key �?`metadata` 固化为旧 `boardId / boardUuid / elementId / source` 的问�?- 修复 Canvas reference image �?asset-center 主干上重复绑定后无法反映最新上下文的问题，避免后续 `ChooseAsset` / board-element 场景把旧上下文继续带入项目资产引�?
### Refactored
- �?asset-center reference 去重逻辑从“只判断是否存在”收敛为“同 key 判断 + 最小合并更新”，保持单条 persisted reference 的同时允�?metadata 迭代刷新

### Performance
- 维持 persisted reference 的单条记录模型，不为�?key 重绑制造额�?reference 膨胀，避免查询和删除保护链路出现重复绑定噪音

### Security
- 强化 project-level persisted reference 的上下文一致性，减少�?metadata 被误判为当前 board/element 归属后产生的错误引用风险

### Tests
- Red:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/assetCenterProjectManagedImport.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`1 file, 7 tests | 1 failed`
  - 失败点：�?key `bindReference(...)` 保留�?metadata，未刷新到最�?`board/element/source`
- Green:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/assetCenterProjectManagedImport.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`1 file, 7 tests passed`
- Regression:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-magiccut/tests/magicCutStoreIdentity.test.tsx packages/sdkwork-magic-studio-magiccut/tests/generatedSelectionImport.test.ts packages/sdkwork-magic-studio-magiccut/tests/magicCutAssetState.test.ts packages/sdkwork-magic-studio-magiccut/tests/trackCoverImport.test.ts packages/sdkwork-magic-studio-assets/tests/assetCenterDeleteSafety.test.ts packages/sdkwork-magic-studio-assets/tests/assetCenterProjectManagedImport.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasImportedAssetResource.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageAttachment.test.ts packages/sdkwork-magic-studio-canvas/src/services/canvasGenerationService.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasGeneratedOutcomeResource.test.ts packages/sdkwork-magic-studio-canvas/src/services/canvasToCutConverter.test.ts packages/sdkwork-magic-studio-film/tests/generatedSelectionAssetImport.test.ts packages/sdkwork-magic-studio-assets/tests/generatedSelectionAsset.test.ts packages/sdkwork-magic-studio-assets/tests/generatedSelectionAssetPersistence.test.ts packages/sdkwork-magic-studio-assets/tests/generatedOutcomeAssetPersistence.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`16 files, 77 tests passed`
- Typecheck:
  - `pnpm.cmd exec tsc --skipLibCheck --ignoreConfig --noEmit --jsx react-jsx --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-assets/src/asset-center/application/AssetCenterService.ts`
  - 结果：`PASS`
  - `pnpm.cmd exec tsc --skipLibCheck --ignoreConfig --noEmit --jsx react-jsx --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageAttachment.ts packages/sdkwork-magic-studio-canvas/src/components/CanvasNode.tsx`
  - 结果：`FAIL`
  - blocker：`packages/sdkwork-magic-studio-core/src/sdk/assetCenterClient.ts` 缺少 `@sdkwork/app-sdk/api/asset-center`、`@sdkwork/app-sdk/api/upload`、`@sdkwork/app-sdk/http/client`、`@sdkwork/app-sdk/types/common`

### Docs
- 更新 `docs/release/VERSION.md`
- 更新 `docs/release/CHANGELOG.md`
- 新增本轮 `review` �?`release` 记录文档

### Release Notes
- 本轮继续停留�?`Step 03`，但�?Canvas 局部补丁进一步推进到�?asset-center 主干语义修复
- 该修复直接提升了 MagicCut / Film / Canvas 共用 persisted reference 语义的一致性，为后续收�?`ChooseAsset` node/web 闭环提供了稳定基础

### Known Risks
- `ChooseAsset` node/web �?persisted reference 收口仍未完成，Step 03 不能宣告结束
- 共享 `@sdkwork/app-sdk/*` 类型声明缺失仍阻�?Canvas 主题定向 `tsc`
- 当前 reference metadata 刷新采用浅合并策略；若未来出现显式“删除某�?metadata 字段”的需求，需要补充更明确的更新协�?
## [v0.1.18] - 2026-04-07

### Added
- 新增 `docs/review/2026-04-07-step-03-canvas-reference-image-review-hardening.md`，记�?Canvas reference image �?code review 后的第二轮收敛与残余风险判断
- 新增 `docs/release/2026-04-07-v0.1.18-迭代记录.md`，沉淀本轮 `Step 03` 第十四轮局部闭环的 review hardening 结果
- 新增 `packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageAttachment.test.ts`，覆盖稳�?attachment key 的删除行�?
### Changed
- 更新 `packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageAttachment.ts`，统一 reference image attachment id 生成与删除匹配逻辑
- 更新 `packages/sdkwork-magic-studio-canvas/src/components/CanvasNode.tsx`，参考图 attachment 删除改为基于稳定资源 key，而不是假�?`ref-{index}`
- 更新 `packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.ts`，`registerExistingAsset(...)` 现在合并上传资产既有 metadata �?board/element/source 业务上下�?- 更新 `docs/release/VERSION.md`，将当前版本推进�?`v0.1.18`，并把当前局部闭环推进到 `Step 03 第十四轮`

### Fixed
- 修复 Canvas 节点 reference image attachment id 已切换为稳定资源 key、但删除逻辑仍按 `ref-{index}` 解析，导致用户无法移除刚上传参考图的回�?- 修复 `registerExistingAsset(...)` 丢失上传资产 canonical identity metadata，导�?Canvas 内存资源�?asset-center 持久化记�?identity 不一致的风险

### Refactored
- �?attachment id 解析和删除行为收敛到独立 util，避�?UI 侧生�?id 与删除侧解析规则再次分叉

### Performance
- attachment 删除改为稳定 key 匹配，不再依�?index 位置，避免后续排�?去重调整后出现额外的删除错位重算

### Security
- 持续强化 Canvas reference image 进入 asset-center 删除前引用阻断后的完整性，降低“无法移除错误参考图”与“identity 不一致导致引用审计偏差”的风险

### Tests
- Red:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageAttachment.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`2 files`
  - 结果：`1 failed test + 1 failed suite`
  - 失败原因�?    - 缺少 `./canvasReferenceImageAttachment` 模块，说�?attachment 删除逻辑缺少统一稳定 key helper
    - `registerExistingAsset(...)` 没有透传上传资产 identity metadata
- Green:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageAttachment.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`2 files, 5 tests passed`
- Regression:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-magiccut/tests/magicCutStoreIdentity.test.tsx packages/sdkwork-magic-studio-magiccut/tests/generatedSelectionImport.test.ts packages/sdkwork-magic-studio-magiccut/tests/magicCutAssetState.test.ts packages/sdkwork-magic-studio-magiccut/tests/trackCoverImport.test.ts packages/sdkwork-magic-studio-assets/tests/assetCenterDeleteSafety.test.ts packages/sdkwork-magic-studio-assets/tests/assetCenterProjectManagedImport.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasImportedAssetResource.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageAttachment.test.ts packages/sdkwork-magic-studio-canvas/src/services/canvasGenerationService.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasGeneratedOutcomeResource.test.ts packages/sdkwork-magic-studio-canvas/src/services/canvasToCutConverter.test.ts packages/sdkwork-magic-studio-film/tests/generatedSelectionAssetImport.test.ts packages/sdkwork-magic-studio-assets/tests/generatedSelectionAsset.test.ts packages/sdkwork-magic-studio-assets/tests/generatedSelectionAssetPersistence.test.ts packages/sdkwork-magic-studio-assets/tests/generatedOutcomeAssetPersistence.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`16 files, 76 tests passed`
- Typecheck blocker:
  - `pnpm.cmd exec tsc --skipLibCheck --ignoreConfig --noEmit --jsx react-jsx --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageAttachment.ts packages/sdkwork-magic-studio-canvas/src/components/CanvasNode.tsx`
  - 结果：`FAIL`
  - blocker：`packages/sdkwork-magic-studio-core/src/sdk/assetCenterClient.ts` 缺少 `@sdkwork/app-sdk/api/asset-center`、`@sdkwork/app-sdk/api/upload`、`@sdkwork/app-sdk/http/client`、`@sdkwork/app-sdk/types/common`

### Docs
- 更新 `docs/release/CHANGELOG.md`
- 更新 `docs/release/VERSION.md`
- 新增本轮 review 文档�?release record

### Release Notes
- 本轮是在 `v0.1.17` �?Canvas persisted reference 落地基础上继续做 review hardening
- 这不是新开大范围重构，而是对已落地能力的缺陷收敛，使其更接近可商业化维护标�?
### Known Risks
- 同一 project 下同一 asset 被多�?board/element 复用时，当前 `bindReference(...)` 仍以 `(domain, entityType, entityId, relation, slot)` 去重，无法表达多份细粒度上下文；该问题已记录为后续架构约束风险，不作为本轮新回归
- Canvas 其他导入入口�?`ChooseAsset` 消费链仍可能存在同类 persisted reference 盲区
- `ChooseAsset` �?node/web 平台隔离尚未完成
- 共享 `@sdkwork/app-sdk/*` 类型声明缺失仍阻塞定�?`tsc`

## [v0.1.17] - 2026-04-07

### Added
- 新增 `docs/review/2026-04-07-step-03-canvas-reference-image-reference-binding.md`，记�?`Canvas reference image` 持久化引用补洞的 RED-GREEN-Regression 证据�?- 新增 `docs/release/2026-04-07-v0.1.17-迭代记录.md`，沉淀本轮 `Step 03` 第十三轮局部闭环的交付与验证结�?- �?`packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.test.ts` 补充两条 RED 用例，覆盖“未入索引时 registerExistingAsset”与“已入索引时 bindReference”两条真实路�?
### Changed
- 更新 `packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.ts`，新�?context / scope / reference / locator / timestamp 解析，并在上传后统一进入 asset-center persisted reference 主干
- 更新 `packages/sdkwork-magic-studio-canvas/src/components/CanvasNode.tsx`，在参考图上传时显式透传 `boardId / boardUuid / elementId / source`
- 更新 `docs/release/VERSION.md`，将当前版本推进�?`v0.1.17`，并把当前局部闭环推进到 `Step 03 第十三轮`

### Fixed
- 修复 `Canvas reference image` 本地上传后只完成 SDK 导入、却没有�?asset-center 注册项目�?persisted reference 的问�?- 修复 `Canvas reference image` 资产已存在于 asset-center 时没有补 `bindReference(...)` 的问�?- 修复 Canvas 节点参考图导入链路缺失 `board / element / source` 业务上下文，导致后续引用审计无法还原消费位置的问�?
### Refactored
- �?Canvas 参考图导入的持久化引用逻辑收敛�?helper 内部，保�?UI 层只负责提供业务上下文，不扩�?asset-center 细节

### Performance
- 继续复用上传后已解析出的主资�?URL 生成 locator，避免在 Canvas 参考图导入路径上增加额外的资源解析往�?
### Security
- �?Canvas 节点参考图首次进入 asset-center 删除前引用阻断主干，降低“仍被使用的参考图被误删”的风险

### Tests
- Red:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`1 file`
  - 结果：`3 tests | 2 failed`
  - 失败原因�?    - 未入索引的本地参考图导入路径没有进入 `assetCenterService.initialize(...)`
    - 已入索引的本地参考图导入路径没有进入 `assetCenterService.initialize(...)`
- Green:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`1 file, 3 tests passed`
- Regression:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-magiccut/tests/magicCutStoreIdentity.test.tsx packages/sdkwork-magic-studio-magiccut/tests/generatedSelectionImport.test.ts packages/sdkwork-magic-studio-magiccut/tests/magicCutAssetState.test.ts packages/sdkwork-magic-studio-magiccut/tests/trackCoverImport.test.ts packages/sdkwork-magic-studio-assets/tests/assetCenterDeleteSafety.test.ts packages/sdkwork-magic-studio-assets/tests/assetCenterProjectManagedImport.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasImportedAssetResource.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.test.ts packages/sdkwork-magic-studio-canvas/src/services/canvasGenerationService.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasGeneratedOutcomeResource.test.ts packages/sdkwork-magic-studio-canvas/src/services/canvasToCutConverter.test.ts packages/sdkwork-magic-studio-film/tests/generatedSelectionAssetImport.test.ts packages/sdkwork-magic-studio-assets/tests/generatedSelectionAsset.test.ts packages/sdkwork-magic-studio-assets/tests/generatedSelectionAssetPersistence.test.ts packages/sdkwork-magic-studio-assets/tests/generatedOutcomeAssetPersistence.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`15 files, 74 tests passed`
- Typecheck blocker:
  - `pnpm.cmd exec tsc --skipLibCheck --ignoreConfig --noEmit --jsx react-jsx --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.ts packages/sdkwork-magic-studio-canvas/src/components/CanvasNode.tsx`
  - 结果：`FAIL`
  - blocker：`packages/sdkwork-magic-studio-core/src/sdk/assetCenterClient.ts` 缺少 `@sdkwork/app-sdk/api/asset-center`、`@sdkwork/app-sdk/api/upload`、`@sdkwork/app-sdk/http/client`、`@sdkwork/app-sdk/types/common`

### Docs
- 更新 `docs/release/CHANGELOG.md`
- 更新 `docs/release/VERSION.md`
- 新增本轮 review 文档�?release record

### Release Notes
- 本轮继续停留�?`Step 03`，将 asset-center 的引用治理从 MagicCut / Film / TrackCover 继续推进�?`Canvas reference image` 上传入口
- 该能力是对现有删除前引用阻断主干的真实扩展，不是只补文档或只补测�?
### Known Risks
- Canvas 其他导入入口�?`ChooseAsset` 消费链仍可能存在同类 persisted reference 盲区
- `ChooseAsset` �?node/web 平台隔离尚未完成
- 共享 `@sdkwork/app-sdk/*` 类型声明缺失仍阻塞定�?`tsc`

## [v0.1.16] - 2026-04-07

### Added
- 新增 `docs/review/2026-04-07-step-03-magiccut-track-cover-reference-binding.md`，记�?`MagicCut TrackCover` 导入链路项目级引用登记补齐的 RED-GREEN-Regression 证据链�?- 新增 `docs/release/2026-04-07-v0.1.16-迭代记录.md`，沉淀本轮 `Step 03` 局部闭环的实现、验证、风险与下一轮计划�?- �?`packages/sdkwork-magic-studio-magiccut/tests/trackCoverImport.test.ts` 新增两条失败测试，分别覆�?TrackCover 本地文件导入时的项目级注册和 URL 导入时的项目级引用绑定�?
### Changed
- 更新 `packages/sdkwork-magic-studio-magiccut/src/utils/magicCutTrackCoverImport.ts`，在 TrackCover 导入 helper 内补�?`context / scope / reference / locator / timestamp` 解析与项目级 persisted reference 持久化逻辑�?- 更新 `packages/sdkwork-magic-studio-magiccut/src/components/Timeline/MagicCutTrackHeader.tsx`，在 TrackCover 导入调用侧显式传�?`project.uuid`、`trackKey` 与语义化 source�?- 更新 `docs/release/VERSION.md`，把当前版本推进�?`v0.1.16`，并同步 Step 03 最新闭环状态�?
### Fixed
- 修复 `MagicCut TrackCover` 本地文件导入路径在资产尚未进�?asset-center index 时未完成 `registerExistingAsset(...)` 且缺少项目级 `references` 的问题�?- 修复 `MagicCut TrackCover` URL 导入路径在资产已存在 asset-center index 时未�?`bindReference(...)` 的问题�?- 修复 TrackCover helper 只做 SDK 上传�?URL 解析、却完全绕开 asset-center persisted reference 治理面的断层�?
### Refactored
- �?TrackCover 导入后的 persisted reference 持久化收敛到 helper 内部私有函数，而不是在时间线头部组件散落实现�?
### Performance
- 本轮只在 TrackCover 导入完成后增加常量级 scope / locator 解析，以及一条必要的 `registerExistingAsset(...)` �?`bindReference(...)` 路径，对现有封面导入链路性能影响可控�?
### Security
- �?TrackCover 导入资产真正进入 asset-center 删除前引用保护面，降低封面资产仍被当前项目使用却被误删的风险�?
### Tests
- Red:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-magiccut/tests/trackCoverImport.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`1 file`
  - 失败：`4 tests | 2 failed`
  - 失败点：
    - 本地文件封面导入路径没有进入 `assetCenterService.initialize(...)`
    - URL 封面导入路径没有进入 `assetCenterService.initialize(...)`
- Green:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-magiccut/tests/trackCoverImport.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`1 file, 4 tests passed`
- Regression:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-magiccut/tests/magicCutStoreIdentity.test.tsx packages/sdkwork-magic-studio-magiccut/tests/generatedSelectionImport.test.ts packages/sdkwork-magic-studio-magiccut/tests/magicCutAssetState.test.ts packages/sdkwork-magic-studio-magiccut/tests/trackCoverImport.test.ts packages/sdkwork-magic-studio-assets/tests/assetCenterDeleteSafety.test.ts packages/sdkwork-magic-studio-assets/tests/assetCenterProjectManagedImport.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasImportedAssetResource.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.test.ts packages/sdkwork-magic-studio-canvas/src/services/canvasGenerationService.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasGeneratedOutcomeResource.test.ts packages/sdkwork-magic-studio-canvas/src/services/canvasToCutConverter.test.ts packages/sdkwork-magic-studio-film/tests/generatedSelectionAssetImport.test.ts packages/sdkwork-magic-studio-assets/tests/generatedSelectionAsset.test.ts packages/sdkwork-magic-studio-assets/tests/generatedSelectionAssetPersistence.test.ts packages/sdkwork-magic-studio-assets/tests/generatedOutcomeAssetPersistence.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`15 files, 72 tests passed`
- Typecheck blocker:
  - `pnpm.cmd exec tsc --skipLibCheck --ignoreConfig --noEmit --jsx react-jsx --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-magiccut/src/utils/magicCutTrackCoverImport.ts packages/sdkwork-magic-studio-magiccut/src/components/Timeline/MagicCutTrackHeader.tsx`
  - 结果：`FAIL`
  - blocker：共�?`@sdkwork/app-sdk/*` 类型声明缺失，阻塞在 `packages/sdkwork-magic-studio-core/src/sdk/assetCenterClient.ts`

### Docs
- 更新 `docs/release/CHANGELOG.md`
- 更新 `docs/release/VERSION.md`
- 新增本轮 review �?release record

### Release Notes
- 本轮�?`Step 03` 从“Film 导入 helper 会登记项目级引用”继续推进到“MagicCut TrackCover helper 也会登记项目级引用”，使删除保护能力首次扩展到 TrackCover 主干�?
### Known Risks
- 当前仍只有项目级 persisted reference，尚未扩展到 Track / Clip 级实体引用模型�?- Canvas、其他上传入口仍可能存在同类引用登记盲区�?- `ChooseAsset` 暴露出的 `indexedDB`、`@sdkwork/app-sdk` 子导出与 node/web 平台隔离问题仍未关闭�?- 共享 `@sdkwork/app-sdk/*` 类型声明缺失仍阻塞定�?`tsc`�?
## [v0.1.15] - 2026-04-07

### Added
- 新增 `docs/review/2026-04-07-step-03-film-project-reference-binding.md`，记�?`Film` 导入链路项目级引用登记补齐的 RED-GREEN-Regression 证据链�?- 新增 `docs/release/2026-04-07-v0.1.15-迭代记录.md`，沉淀本轮 `Step 03` 局部闭环的实现、验证、风险与下一轮计划�?- �?`packages/sdkwork-magic-studio-film/tests/generatedSelectionAssetImport.test.ts` 新增两条失败测试，分别覆�?URL 导入后的项目级引用绑定和本地文件导入时的项目级引用注册�?
### Changed
- 更新 `packages/sdkwork-magic-studio-film/src/utils/filmModalAssetImport.ts`，在 Film 导入 helper 内补�?`scope / reference / locator / status` 解析与项目级 persisted reference 持久化逻辑�?- 更新 `docs/release/VERSION.md`，把当前版本推进�?`v0.1.15`，并同步 Step 03 最新闭环状态�?
### Fixed
- 修复 `Film` URL 导入链路在资产已存在 asset-center index 时未�?`bindReference(...)` 的问题�?- 修复 `Film` 本地文件导入链路在资产尚未进�?asset-center index 时未完成 `registerExistingAsset(...)` 且缺少项目级 `references` 的问题�?- 修复 `filmModalAssetImport.ts` 接收业务 metadata 但完全不消费、导致导入资产无法进入项目级 persisted reference 治理面的断层�?
### Refactored
- �?Film 导入后的 persisted reference 持久化收敛到 helper 内部私有函数，而不是在各个页面/弹窗入口散落实现�?
### Performance
- 本轮只在 Film 导入完成后增加常量级 scope / locator 解析，以及一条必要的 `registerExistingAsset(...)` �?`bindReference(...)` 路径，对现有导入链路性能影响可控�?
### Security
- �?Film 导入资产真正进入资产中心删除前引用保护面，降低资产仍被当前项目使用却被误删的风险�?
### Tests
- Red:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-film/tests/generatedSelectionAssetImport.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`1 file`
  - 失败：`13 tests | 2 failed`
  - 失败点：
    - URL 导入路径没有进入 `assetCenterService.initialize(...)`
    - 本地文件导入路径没有进入 `assetCenterService.initialize(...)`
- Green:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-film/tests/generatedSelectionAssetImport.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`1 file, 13 tests passed`
- Regression:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-magiccut/tests/magicCutStoreIdentity.test.tsx packages/sdkwork-magic-studio-magiccut/tests/generatedSelectionImport.test.ts packages/sdkwork-magic-studio-magiccut/tests/magicCutAssetState.test.ts packages/sdkwork-magic-studio-assets/tests/assetCenterDeleteSafety.test.ts packages/sdkwork-magic-studio-assets/tests/assetCenterProjectManagedImport.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasImportedAssetResource.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.test.ts packages/sdkwork-magic-studio-canvas/src/services/canvasGenerationService.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasGeneratedOutcomeResource.test.ts packages/sdkwork-magic-studio-canvas/src/services/canvasToCutConverter.test.ts packages/sdkwork-magic-studio-film/tests/generatedSelectionAssetImport.test.ts packages/sdkwork-magic-studio-assets/tests/generatedSelectionAsset.test.ts packages/sdkwork-magic-studio-assets/tests/generatedSelectionAssetPersistence.test.ts packages/sdkwork-magic-studio-assets/tests/generatedOutcomeAssetPersistence.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`14 files, 68 tests passed`

### Docs
- 更新 `docs/release/CHANGELOG.md`
- 更新 `docs/release/VERSION.md`
- 新增本轮 review �?release record

### Release Notes
- 本轮�?`Step 03` 从“MagicCut 项目导入会登记项目级引用”继续推进到“Film 导入 helper 也会登记项目级引用”，使删除保护能力首次从 MagicCut 扩展�?Film 导入主干�?
### Known Risks
- 当前仍只有项目级 persisted reference，尚未扩展到 `shot / scene / character / prop` 级别实体引用模型�?- Canvas、TrackCover、其他上传入口仍可能存在同类引用登记盲区�?- `ChooseAsset` 暴露出的 `indexedDB`、`@sdkwork/app-sdk` 子导出与 node/web 平台隔离问题仍未关闭�?
## [v0.1.14] - 2026-04-07

### Added
- 新增 `docs/review/2026-04-07-step-03-magiccut-project-reference-binding.md`，记�?`MagicCut` 项目导入引用登记补齐�?RED-GREEN-Regression 证据链�?- 新增 `docs/release/2026-04-07-v0.1.14-迭代记录.md`，沉淀本轮 `Step 03` 局部闭环的实现、验证、风险与下一轮计划�?- �?`packages/sdkwork-magic-studio-magiccut/tests/magicCutStoreIdentity.test.tsx` 新增两条失败测试，分别覆盖本地受管导入和服务端上传后的项目级引用登记�?
### Changed
- 更新 `packages/sdkwork-magic-studio-magiccut/src/store/magicCutStore.tsx`，在 `importMagicCutUpload(...)` 内统一解析当前导入 `scope` 并构造项目级引用对象�?- 更新 `docs/release/VERSION.md`，把当前版本推进�?`v0.1.14`，并同步 Step 03 最新闭环状态�?
### Fixed
- 修复 `MagicCut` 本地受管导入资产进入资产中心时未登记项目�?`persisted reference` 的问题�?- 修复 `MagicCut` 服务端上传资产进入资产中心后未补 `bindReference(...)` 的问题�?- 修复上一轮删除前引用阻断能力�?`MagicCut` 项目导入主干上“有删除保护能力但没有登记来源”的治理断层�?
### Refactored
- �?`MagicCut` 项目导入作用域与项目级引用构造收敛在单一入口内，避免把引用登记逻辑散落到多个分支条件中�?
### Performance
- 本轮未引入额外批量查询或全局扫描，只在导入入口增加常量级引用对象构造与一次必要的绑定调用，对现有导入链路性能影响可控�?
### Security
- �?`MagicCut` 项目导入资产真正进入资产中心的删除前引用保护面，降低资产仍被项目使用却被误删的风险�?
### Tests
- Red:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-magiccut/tests/magicCutStoreIdentity.test.tsx --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`1 file`
  - 失败：`5 tests | 2 failed`
  - 失败点：
    - `importAsset(...)` 缺少 `references`
    - `bindReference(...)` 未调�?- Green:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-magiccut/tests/magicCutStoreIdentity.test.tsx --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`1 file, 5 tests passed`
- Regression:
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-magiccut/tests/magicCutStoreIdentity.test.tsx packages/sdkwork-magic-studio-magiccut/tests/generatedSelectionImport.test.ts packages/sdkwork-magic-studio-magiccut/tests/magicCutAssetState.test.ts packages/sdkwork-magic-studio-assets/tests/assetCenterDeleteSafety.test.ts packages/sdkwork-magic-studio-assets/tests/assetCenterProjectManagedImport.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasImportedAssetResource.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.test.ts packages/sdkwork-magic-studio-canvas/src/services/canvasGenerationService.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasGeneratedOutcomeResource.test.ts packages/sdkwork-magic-studio-canvas/src/services/canvasToCutConverter.test.ts packages/sdkwork-magic-studio-film/tests/generatedSelectionAssetImport.test.ts packages/sdkwork-magic-studio-assets/tests/generatedSelectionAsset.test.ts packages/sdkwork-magic-studio-assets/tests/generatedSelectionAssetPersistence.test.ts packages/sdkwork-magic-studio-assets/tests/generatedOutcomeAssetPersistence.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`14 files, 66 tests passed`

### Docs
- 更新 `docs/release/CHANGELOG.md`
- 更新 `docs/release/VERSION.md`
- 新增本轮 review �?release record

### Release Notes
- 本轮�?`Step 03` 从“删除前会阻断已登记引用资产”进一步推进到“`MagicCut` 项目导入主干会真实登记项目级引用”，使删除保护首次在 `MagicCut` 项目导入链路上形成完整闭环�?
### Known Risks
- 其他消费 `importAssetBySdk(...)` 的入口仍可能存在同类引用登记盲区�?- 本轮只补齐了项目�?persisted reference，尚未扩展到更细粒度的编辑对象引用模型�?- `ChooseAsset` node/web 平台隔离问题仍未关闭�?
## [v0.1.13] - 2026-04-07

### Added
- 新增 `docs/review/2026-04-07-step-03-asset-delete-reference-guard.md`，固�?Step 03 第九轮局部闭环的 review 证据�?- 新增 `docs/release/2026-04-07-v0.1.13-迭代记录.md`，记录本轮资产删除前反向引用阻断结果�?
### Changed
- 更新 `packages/sdkwork-magic-studio-assets/tests/assetCenterDeleteSafety.test.ts`，补齐“被持久化引用的资产不能删除”失败用例�?- 更新 `packages/sdkwork-magic-studio-assets/src/asset-center/application/AssetCenterService.ts`，让资产中心删除主干在删文件、删索引前先检�?`references`�?- 更新 `docs/release/VERSION.md`，将当前执行状态推进到 Step 03 第九轮局部闭环�?
### Fixed
- 修复资产中心删除主干只做受管路径安全校验、却不校验资产是否仍被业务引用的缺口�?- 修复已登�?`references` 的资产在删除时仍可能继续删除本地受管文件与索引记录的风险�?
### Refactored
- 将删除前引用安全判断收敛�?`AssetCenterService.deleteById(...)` 核心服务层，避免只依赖上层单个界面或单个引擎做局部防线�?
### Performance
- 本轮未引入显式性能优化；通过前置拒绝无效删除，避免误删后的恢复与返工成本�?
### Security
- 进一步降低被业务对象持久化引用的资产被误删的概率，提升本地资产治理的可审计性与删除安全边界�?
### Tests
- Red�?  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/assetCenterDeleteSafety.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`1 file`
  - 失败明细：`3 tests | 1 failed`
  - 原因：`promise resolved "undefined" instead of rejecting`
- Green�?  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/assetCenterDeleteSafety.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`1 file, 3 tests passed`
- Regression�?  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/assetCenterDeleteSafety.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasImportedAssetResource.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.test.ts packages/sdkwork-magic-studio-canvas/src/services/canvasGenerationService.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasGeneratedOutcomeResource.test.ts packages/sdkwork-magic-studio-canvas/src/services/canvasToCutConverter.test.ts packages/sdkwork-magic-studio-magiccut/tests/generatedSelectionImport.test.ts packages/sdkwork-magic-studio-magiccut/tests/magicCutAssetState.test.ts packages/sdkwork-magic-studio-film/tests/generatedSelectionAssetImport.test.ts packages/sdkwork-magic-studio-assets/tests/generatedSelectionAsset.test.ts packages/sdkwork-magic-studio-assets/tests/generatedSelectionAssetPersistence.test.ts packages/sdkwork-magic-studio-assets/tests/generatedOutcomeAssetPersistence.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`12 files, 55 tests passed`

### Docs
- 本轮已补�?review、version、changelog �?release record 闭环�?
### Release Notes
- 当前版本标志着 Step 03 已把删除治理从“仅校验路径安全”推进到“同时校验引用安全”，为后续统一回收、反向引用审计和恢复策略继续收敛奠定核心服务边界�?
### Known Risks
- 当前阻断能力依赖 `asset.references` 已被正确登记；仍未登记引用关系的业务旁路需要后续继续审计�?- 上层调用方对阻断错误的提示文案与交互反馈仍未全部统一�?- `ChooseAsset` 暴露出的 `indexedDB`、`@sdkwork/app-sdk` 子导出与 node/web 平台隔离问题仍未关闭�?
## [v0.1.12] - 2026-04-07

### Added
- 新增 `packages/sdkwork-magic-studio-canvas/src/utils/canvasImportedAssetResource.ts`，统一承接 uploaded asset -> Canvas resource �?canonical identity 投影逻辑�?- 新增 `packages/sdkwork-magic-studio-canvas/src/utils/canvasImportedAssetResource.test.ts`，覆�?Canvas 本地上传导入入口�?top-level canonical identity 提升�?fallback 行为�?- 新增 `docs/review/2026-04-07-step-03-canvas-upload-canonical-identity.md`，固�?Step 03 第八轮局部闭环的 review 证据�?- 新增 `docs/release/2026-04-07-v0.1.12-迭代记录.md`，记录本�?Canvas 本地上传导入 canonical identity 收敛结果�?
### Changed
- 更新 `packages/sdkwork-magic-studio-canvas/src/components/CanvasNode.tsx`，让 Canvas 本地上传落盘后复用统一�?imported asset 投影入口，而不是只在组件内构造局部资源对象�?- 更新 `packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.ts`，让参考图导入入口与本地上传入口共用同一�?canonical identity 提升逻辑�?- 更新 `docs/release/VERSION.md`，将当前执行状态推进到 Step 03 第八轮局部闭环�?
### Fixed
- 修复 Canvas 本地上传导入入口在资产已落盘后仍只把 canonical identity 留在 `metadata`、没有同步提升到 Canvas 资源 top-level `assetId / assetUuid / primaryResourceId / primaryResourceUuid / resourceViewId / resourceViewUuid` 的问题�?- 修复 Canvas 本地上传入口与参考图导入入口对同一�?uploaded asset 采用两套资源投影逻辑、导致后续消费侧仍需依赖 `metadata` 兼容回填的问题�?- 修复 Canvas 导入资源在缺�?`resourceViewUuid` 时无法统一回退�?`primaryResourceUuid / clientUuid / assetId` 的身份表达不一致问题�?
### Refactored
- �?Canvas uploaded asset 的资源投影职责从组件内分散逻辑收敛�?`toCanvasImportedAssetResource(...)`，降低导入入口与消费入口的身份漂移风险�?- �?Canvas 导入资源�?canonical identity、展示字段与 `metadata` 同步透传策略统一到单�?util，便于后续继续治理删除前反向引用与跨入口消费侧审计�?
### Performance
- 本轮未引入显式性能优化；通过消除 Canvas 导入侧重复身份拼装与后续兼容回填，降低后续导出、引用与转换链路的返工成本�?
### Security
- 进一步降�?Canvas 本地上传资源在主链路中以临时本地标识替代 canonical identity 的概率，提升资产身份治理稳定性与可审计性�?
### Tests
- Red�?  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-canvas/src/utils/canvasImportedAssetResource.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`0 test`
  - 原因：`Cannot find module './canvasImportedAssetResource'`
- Green�?  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-canvas/src/utils/canvasImportedAssetResource.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`2 files, 3 tests passed`
- Regression�?  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-canvas/src/utils/canvasImportedAssetResource.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.test.ts packages/sdkwork-magic-studio-canvas/src/services/canvasGenerationService.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasGeneratedOutcomeResource.test.ts packages/sdkwork-magic-studio-canvas/src/services/canvasToCutConverter.test.ts packages/sdkwork-magic-studio-magiccut/tests/generatedSelectionImport.test.ts packages/sdkwork-magic-studio-film/tests/generatedSelectionAssetImport.test.ts packages/sdkwork-magic-studio-assets/tests/generatedSelectionAsset.test.ts packages/sdkwork-magic-studio-assets/tests/generatedSelectionAssetPersistence.test.ts packages/sdkwork-magic-studio-assets/tests/generatedOutcomeAssetPersistence.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`10 files, 39 tests passed`

### Docs
- 本轮已补�?review、version、changelog �?release record 闭环�?
### Release Notes
- 当前版本标志着 Step 03 已把 Canvas canonical identity 收敛从“生成引用侧可回退 metadata”继续推进到“本地上传导入入口一落盘就具�?top-level canonical identity”，进一步减�?Canvas 侧对嵌套 metadata 身份的长期依赖�?
### Known Risks
- `ChooseAsset` 暴露出的 `indexedDB`、`@sdkwork/app-sdk` 子导出与 node/web 平台隔离问题仍未关闭�?- Step 03 仍未完成删除前反向引用治理�?- Canvas 更广泛消费侧是否全部优先读取 top-level canonical identity，仍需继续审计�?
## [v0.1.11] - 2026-04-07

### Added
- 新增 `packages/sdkwork-magic-studio-canvas/src/services/canvasGenerationService.test.ts` �?metadata canonical identity 回归用例，验�?Canvas �?top-level 身份缺失时仍能复�?`metadata` 中的 `assetId / assetUuid / primaryResourceId / resourceViewId`�?- 新增 `docs/review/2026-04-07-step-03-canvas-generation-metadata-identity.md`，固�?Step 03 第七轮局部闭环的 review 证据�?- 新增 `docs/release/2026-04-07-v0.1.11-迭代记录.md`，记录本�?Canvas 生成引用链路 identity 收敛结果�?
### Changed
- 更新 `packages/sdkwork-magic-studio-canvas/src/services/canvasGenerationService.ts`，让 Canvas image/video 引用入口支持�?top-level �?`metadata` 两层解析 canonical `assetId / assetUuid / primaryResourceId / primaryResourceUuid / resourceViewId / resourceViewUuid`�?- 更新 `packages/sdkwork-magic-studio-canvas/src/services/canvasGenerationService.test.ts`，将本文件的局�?mock 收敛为无副作用测试桩，只保留视频请求构造的真实实现，确保测试能稳定进入业务 RED�?- 更新 `docs/release/VERSION.md`，将当前执行状态推进到 Step 03 第七轮局部闭环�?
### Fixed
- 修复 Canvas 在把已有资源再次作为 image/video 引用发送给生成服务时，只读�?top-level 身份字段、忽�?`metadata` canonical identity 的问题�?- 修复统一视频请求在上述场景下退回使用本地临�?`uuid` 而不�?canonical `resourceViewUuid` 的问题�?- 修复 `canvasGenerationService.test.ts` 由于 `vi.importActual(...)` 引发局�?`indexedDB` / `EPERM` 噪声而无法进入业�?RED 的问题�?
### Refactored
- �?Canvas 生成引用身份解析从“分散读取资源顶层字段”收敛为 `resolveCanvasResourceIdentity(...)` 统一逻辑，避�?image/video 两条入口继续漂移�?- �?Canvas 资源 `metadata` 同步透传�?image/video input ref 顶层，减少后续消费侧再次做兼容回填的成本�?
### Performance
- 本轮未引入显式性能优化；通过避免 Canvas 引用链路继续退回本地临时身份，降低后续重复生成、重复解析和返工成本�?
### Security
- 进一步降低临时本�?`uuid` �?Canvas 生成引用主链路中充当主引用的概率，提升资产身份治理稳定性�?
### Tests
- Red Blocker�?  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-canvas/src/services/canvasGenerationService.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`0 test`
  - 原因：局�?mock 方式误触�?`indexedDB is not defined` �?`EPERM ... retry/index.js`
- Red�?  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-canvas/src/services/canvasGenerationService.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`1 file, 5 tests`
  - 业务失败：`2 failed`
- Green�?  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-canvas/src/services/canvasGenerationService.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`1 file, 5 tests passed`
- Regression�?  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-canvas/src/services/canvasGenerationService.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasGeneratedOutcomeResource.test.ts packages/sdkwork-magic-studio-canvas/src/utils/canvasReferenceImageImport.test.ts packages/sdkwork-magic-studio-magiccut/tests/generatedSelectionImport.test.ts packages/sdkwork-magic-studio-film/tests/generatedSelectionAssetImport.test.ts packages/sdkwork-magic-studio-assets/tests/generatedSelectionAsset.test.ts packages/sdkwork-magic-studio-assets/tests/generatedSelectionAssetPersistence.test.ts packages/sdkwork-magic-studio-assets/tests/generatedOutcomeAssetPersistence.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`8 files, 35 tests passed`

### Docs
- 本轮已补�?review、version、changelog �?release record 闭环�?
### Release Notes
- 当前版本标志着 Step 03 已把 canonical identity 收敛从共享层、Film、MagicCut 继续推进�?Canvas 生成引用主干，开始系统性消�?Canvas 侧的身份漂移�?
### Known Risks
- `Canvas` 导入链路中的同类 nested identity 缺口仍未完成�?- `ChooseAsset` 暴露出的 `indexedDB`、`@sdkwork/app-sdk` 子导出和 node/web 平台隔离问题仍未处理�?- Step 03 仍未完成整步闭环�?
## [v0.1.10] - 2026-04-07

### Added
- 新增 `packages/sdkwork-magic-studio-magiccut/tests/generatedSelectionImport.test.ts` 的嵌�?`resource.metadata` canonical identity 回归用例，验�?MagicCut 导入链路不会�?top-level 身份缺失时误走重新导入分支�?- 新增 `docs/review/2026-04-07-step-03-magiccut-generated-selection-nested-identity.md`，固�?Step 03 第六轮局部闭环的 review 证据�?- 新增 `docs/release/2026-04-07-v0.1.10-迭代记录.md`，记录本�?MagicCut 导入链路 identity 收敛结果�?
### Changed
- 更新 `packages/sdkwork-magic-studio-magiccut/src/utils/generatedSelectionImport.ts`，让 MagicCut 生成结果导入链路支持�?top-level、`resource` 直挂字段�?`resource.metadata` 三层解析 canonical `assetId / assetUuid / primaryResourceId / resourceViewId`�?- 更新 `docs/release/VERSION.md`，将当前执行状态推进到 Step 03 第六轮局部闭环�?
### Fixed
- 修复 MagicCut 导入链路忽略嵌套 `resource.metadata` �?canonical `assetId / assetUuid / primaryResourceId / resourceViewId`，导致已持久化生成结果被误判为未持久化资源的问题�?- 修复上述场景�?MagicCut 错误触发 URL 导入分支，并最终在 `resolveEntityKey(...)` �?`Entity key missing` 的问题�?
### Refactored
- �?MagicCut 生成结果导入入口�?identity 读取策略从“只�?top-level 字段”收敛为“top-level + resource 直挂字段 + resource.metadata”的统一解析逻辑�?- �?`buildSelectionBackedResource(...)` 同步切换到统一 identity 解析结果，避免构造出�?timeline 资源仍回退到临时字段�?
### Performance
- 本轮未引入显式性能优化；通过减少 MagicCut 侧不必要的重复导入与重复解析，降低后续资产导入链路的返工成本�?
### Security
- 进一步降低临�?URL �?MagicCut 资产主链路中充当主引用的概率，提升资产身份治理稳定性�?
### Tests
- Red 证据�?  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-magiccut/tests/generatedSelectionImport.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`1 failed`
  - 原因：MagicCut 未复用嵌�?canonical identity，误入导入分支并�?`resolveEntityKey(...)` 报错
- Green�?  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-magiccut/tests/generatedSelectionImport.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`1 file, 4 tests passed`
- Regression�?  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-magiccut/tests/generatedSelectionImport.test.ts packages/sdkwork-magic-studio-film/tests/generatedSelectionAssetImport.test.ts packages/sdkwork-magic-studio-assets/tests/generatedSelectionAsset.test.ts packages/sdkwork-magic-studio-assets/tests/generatedSelectionAssetPersistence.test.ts packages/sdkwork-magic-studio-assets/tests/generatedOutcomeAssetPersistence.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`5 files, 27 tests passed`

### Docs
- 本轮已补�?review、version、changelog �?release record 闭环�?
### Release Notes
- 当前版本标志着 Step 03 已把嵌套 canonical identity 收敛从共享层继续推进到第二条消费引擎导入链路，开始系统性消�?MagicCut 侧的重复导入与身份漂移�?
### Known Risks
- `Canvas` 导入链路中的同类嵌套 identity 缺口仍未完成�?- `ChooseAsset` 暴露出的 `indexedDB`、`@sdkwork/app-sdk` 子导出和 node/web 平台隔离问题仍未处理�?- Step 03 仍未完成整步闭环�?
## [v0.1.9] - 2026-04-07

### Added
- 新增 `packages/sdkwork-magic-studio-film/tests/generatedSelectionAssetImport.test.ts` 的嵌�?`resource.metadata` canonical identity 回归用例，验�?Film 导入链路不会�?top-level 身份缺失时误走重新导入分支�?- 新增 `docs/review/2026-04-07-step-03-film-generated-selection-nested-identity.md`，固�?Step 03 第五轮局部闭环的 review 证据�?- 新增 `docs/release/2026-04-07-v0.1.9-迭代记录.md`，记录本�?Film 导入链路 identity 收敛结果�?
### Changed
- 更新 `packages/sdkwork-magic-studio-film/src/utils/filmModalAssetImport.ts`，让 Film 生成结果导入链路支持�?top-level、`resource` 直挂字段�?`resource.metadata` 三层解析 canonical `assetId / assetUuid`�?- 更新 `docs/release/VERSION.md`，将当前执行状态推进到 Step 03 第五轮局部闭环�?
### Fixed
- 修复 Film 导入链路忽略嵌套 `resource.metadata.assetId / assetUuid`，导致已持久化生成结果被误判为未持久化资源的问题�?- 修复上述场景�?Film 错误触发 `importAssetFromUrlBySdk(...)` 重新导入分支的问题�?
### Refactored
- �?Film 生成结果导入入口�?identity 读取策略从“只�?top-level 字段”收敛为“top-level + resource 直挂字段 + resource.metadata”的统一解析逻辑�?
### Performance
- 本轮未引入显式性能优化；通过减少 Film 侧不必要的重复导入与重复解析，降低后续资产导入链路的返工成本�?
### Security
- 进一步降低临�?URL �?Film 资产主链路中充当主引用的概率，提升资产身份治理稳定性�?
### Tests
- Red 证据�?  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-film/tests/generatedSelectionAssetImport.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`1 failed`
  - 原因：Film 未复用嵌�?canonical identity，误入重新导入分�?- Green�?  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-film/tests/generatedSelectionAssetImport.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`1 file, 11 tests passed`
- Regression�?  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-film/tests/generatedSelectionAssetImport.test.ts packages/sdkwork-magic-studio-assets/tests/generatedSelectionAsset.test.ts packages/sdkwork-magic-studio-assets/tests/generatedSelectionAssetPersistence.test.ts packages/sdkwork-magic-studio-assets/tests/generatedOutcomeAssetPersistence.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`4 files, 23 tests passed`

### Docs
- 本轮已补�?review、version、changelog �?release record 闭环�?
### Release Notes
- 当前版本标志着 Step 03 已把嵌套 canonical identity 收敛从共享层继续推进�?Film 引擎导入链路，开始系统性消除消费引擎侧的重复导入与身份漂移�?
### Known Risks
- `MagicCut / Canvas` 导入链路中的同类嵌套 identity 缺口仍未完成�?- `ChooseAsset` 暴露出的 `indexedDB`、`@sdkwork/app-sdk` 子导出和 node/web 平台隔离问题仍未处理�?- Step 03 仍未完成整步闭环�?
## [v0.1.8] - 2026-04-07

### Added
- 新增 `packages/sdkwork-magic-studio-assets/tests/generatedSelectionAssetPersistence.test.ts` 的嵌�?`resource.metadata` canonical identity 回归用例，验证持久化链路不会在顶层字段缺失时误入重新导入分支�?- 新增 `docs/review/2026-04-07-step-03-generated-selection-persistence-nested-identity.md`，固�?Step 03 第四轮局部闭环的 review 证据�?- 新增 `docs/release/2026-04-07-v0.1.8-迭代记录.md`，记录本轮基础设施清障与业务闭环结果�?
### Changed
- 更新 `tests/vitest.codex.config.mjs`，补�?workspace 包的子路�?alias，让 `@sdkwork/magic-studio-core/services`、`@sdkwork/magic-studio-core/platform`、`@sdkwork/magic-studio-core/sdk` 等子路径�?codex 专用 Vitest 配置下可解析�?- 更新 `packages/sdkwork-magic-studio-assets/src/services/generatedSelectionAssetPersistence.ts`，使持久化链路支持从嵌套 `resource` �?`resource.metadata` 承接 canonical identity�?- 更新 `docs/release/VERSION.md`，将当前执行状态推进到 Step 03 第四轮局部闭环�?
### Fixed
- 修复 codex 专用 Vitest 配置无法解析 `@sdkwork/magic-studio-core/services` 等子路径，导致共享持久化测试无法运行的问题�?- 修复 `persistGeneratedSelectionAsset(...)` 在顶�?identity 缺失时忽略嵌�?`resource.metadata` canonical identity 的问题�?- 修复持久化链路在上述场景下误入重新导入分支，并进一步触发上传返回体 metadata 读取异常的问题�?
### Refactored
- 将持久化链路�?identity 解析从“只看顶�?selection 字段”收敛为“顶层字�?+ resource 直挂字段 + resource.metadata”的统一策略�?- �?codex 专用测试 alias 从“精确包名映射”提升为“精确包�?+ 子路径”双映射，增强共享主干测试可运行性�?
### Performance
- 本轮未引入显式性能优化；通过减少不必要的重新导入和重�?identity 兼容逻辑，降低后续引擎与持久化侧的返工成本�?
### Security
- 持久化链路进一步降低了临时 URL、临�?selection 标识在核心资产流程中充当主引用的概率�?
### Tests
- Red 证据一�?  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/generatedOutcomeAssetPersistence.test.ts packages/sdkwork-magic-studio-assets/tests/generatedSelectionAssetPersistence.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`2 failed`
  - 原因：`@sdkwork/magic-studio-core/services` 子路径无法解�?- Red 证据二：
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/generatedSelectionAssetPersistence.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`1 failed`
  - 原因：嵌�?identity 未被复用，误入重新导入分�?- Green / Regression�?  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/generatedSelectionAsset.test.ts packages/sdkwork-magic-studio-assets/tests/generatedSelectionAssetPersistence.test.ts packages/sdkwork-magic-studio-assets/tests/generatedOutcomeAssetPersistence.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`3 files, 12 tests passed`
- 扩展验证尝试�?  - `ChooseAsset` 相关测试当前已不再受 alias 阻断，但暴露出更深层 node/web 平台隔离�?`@sdkwork/app-sdk` 子导出问题，未在本轮处理�?
### Docs
- 本轮已补�?review、version、changelog �?release 记录闭环�?
### Release Notes
- 当前版本标志着 Step 03 已从“共享投影入口识别嵌�?canonical identity”继续推进到“共享持久化入口识别嵌套 canonical identity”，同时 codex 自动化验证链也从 alias 阻断推进到更深层平台隔离问题�?
### Known Risks
- `ChooseAsset` 测试暴露出的 `indexedDB` / `@sdkwork/app-sdk` 子导�?/ web 平台初始化问题仍未处理�?- `Film / MagicCut / Canvas` 导入链路中的同类嵌套 identity 收敛仍待继续推进�?- Step 03 仍未完成整步闭环�?
## [v0.1.7] - 2026-04-07

### Added
- 新增 `packages/sdkwork-magic-studio-assets/tests/generatedSelectionAsset.test.ts` 的嵌�?canonical identity 回归用例，验�?`resource.metadata` 中的身份不会再被共享资产投影入口忽略�?- 新增 `docs/review/2026-04-07-step-03-generated-selection-nested-identity.md`，固�?Step 03 第三轮局部闭环的 review 证据�?- 新增 `docs/release/2026-04-07-v0.1.7-迭代记录.md`，记录本轮真实实现、验证结果与剩余缺口�?
### Changed
- 更新 `packages/sdkwork-magic-studio-assets/src/components/generate/generatedSelectionAsset.ts`，为 AI 生成结果增加嵌套 `resource` / `resource.metadata` identity 解析�?- 更新 `docs/release/VERSION.md`，将当前执行状态推进到 Step 03 第三轮局部闭环�?
### Fixed
- 修复 AI 生成结果已经携带 canonical identity，但共享资产投影仍退�?`selection.key / artifact uuid` 的问题�?- 修复嵌套 `resource.metadata` 中的 `assetId / assetUuid / primaryResourceId / resourceViewId` 在资产投影阶段丢失的问题�?
### Refactored
- 将生成结果身份解析从“只看顶层字段”收敛为“顶层字�?+ resource 直挂字段 + resource.metadata”的共享主干逻辑�?- 保持既有主键语义不变，只�?canonical identity 来源，避免把 `resourceViewId` 或其他资源级 id 误判为主资产 id�?
### Performance
- 本轮未引入显式性能优化；通过减少临时 selection 标识继续渗透到资产链路，降低后续引擎和持久化侧的重复兼容成本�?
### Security
- 进一步降低临�?URL、临�?key、临�?uuid 在核心资产链路中充当主引用的概率，提升资产身份治理稳定性�?
### Tests
- Red 证据�?  - 新增嵌套 identity 回归用例在修复前失败，表现为 `id` 退�?`selection.key`、`uuid` 退�?`artifact uuid`、metadata canonical identity 为空�?- Green / Regression�?  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/generatedSelectionAsset.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`1 file, 3 tests passed`
- 扩展验证尝试�?  - `generatedSelectionAssetPersistence.test.ts` �?`chooseAssetIdentity.test.tsx` 当前仍受仓库已有 `@sdkwork/magic-studio-core/services` 模块解析 blocker 影响，本轮未将该基础设施问题混入实现范围�?
### Docs
- 本轮已补�?review、version、changelog �?release 记录闭环�?
### Release Notes
- 当前版本标志着 Step 03 已从“共�?resolver 识别嵌套资产引用”继续推进到“共享生成结果投影入口识别嵌�?canonical identity”阶段，开始系统性削弱临�?selection 标识在资产链路中的主引用地位�?
### Known Risks
- `persistGeneratedSelectionAsset(...)`、`MagicCut / Film / Canvas` 导入链路中的同类嵌套身份缺口仍未完成�?- 当前 Vitest 最小配置下仍存�?`@sdkwork/magic-studio-core/services` 的模块解�?blocker，影响更大范围消费侧验证�?- Step 03 仍未完成全链�?`assetId / primaryResourceId / resourceViewId` 写回协议统一�?
## [v0.1.6] - 2026-04-07

### Added
- 新增 `packages/sdkwork-magic-studio-assets/tests/assetUrlResolver.test.ts`，验证嵌�?`resource` �?`payload.image` 场景也能�?canonical asset url / managed locator 解析�?- 新增 `docs/review/2026-04-07-step-03-asset-url-resolver-nested-reference.md`，固�?Step 03 第二轮共享解析主干收敛的 review 证据�?- 新增 `docs/release/2026-04-07-v0.1.6-迭代记录.md`，记录本轮真实实现、验证结果与剩余风险�?
### Changed
- 更新 `packages/sdkwork-magic-studio-assets/src/asset-center/application/assetUrlResolver.ts`，将统一解析入口扩展为可识别受控嵌套资产载体�?- 更新 `packages/sdkwork-magic-studio-magiccut/tests/magicCutStoreIdentity.test.tsx`，补�?canonical asset identity 回归保护�?- 更新 `docs/release/VERSION.md`，将当前状态推进到 Step 03 第二轮真实闭环�?
### Fixed
- 修复统一 resolver 只认顶层 source、无法解析嵌�?`resource / payload` 资产引用的问题�?- 修复包装对象顶层缺失 `assetId` 时直接返�?`null`、无法继续解�?canonical url 或托�?locator 的缺口�?
### Refactored
- 将嵌套资产载体的识别逻辑收敛到共�?resolver 主干，而不是让各引擎调用方继续做分散兼容�?- 保持顶层 `id` 既有优先级，同时限制嵌套层只读取 `assetId / metadata.assetId`，降低误判风险�?
### Performance
- 本轮未引入显式性能优化；通过减少无效 `null` 返回和局部兼容分支，降低了后续引擎接线的重复解析成本�?
### Security
- 统一解析入口更稳定地优先 canonical asset reference，降低临�?URL、裸路径在核心链路中的主引用权重�?
### Tests
- 执行 Red 用例�?  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/assetUrlResolver.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`FAIL`，证明嵌�?`resource / payload` 在修复前无法被统一 resolver 识别
- 执行 Green / Regression�?  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/assetUrlResolver.test.ts packages/sdkwork-magic-studio-assets/tests/useAssetUrlDefaultResolver.test.ts packages/sdkwork-magic-studio-magiccut/tests/magicCutStoreIdentity.test.tsx --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`3 files, 8 tests passed`
- 执行文件级类型校验尝试：
  - `pnpm.cmd exec tsc --skipLibCheck --ignoreConfig --noEmit --jsx react-jsx --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-assets/src/asset-center/application/assetUrlResolver.ts`
  - 结果：`FAIL`
  - blocker：共�?`@sdkwork/app-sdk/*` 类型声明缺失，阻塞在 `packages/sdkwork-magic-studio-core/src/sdk/assetCenterClient.ts`

### Docs
- 本轮已补�?review、version、changelog �?release 记录闭环�?
### Release Notes
- 当前版本标志着 Step 03 已从“目录与删除边界收敛”推进到“共享资产引用解析主干收敛”阶段，包装对象内部�?canonical asset identity 开始被统一入口可靠识别�?
### Known Risks
- Step 03 仍未完成 Film / MagicCut / Canvas 内部所有直�?URL 主引用替换�?- `assetId / primaryResourceId / resourceViewId` 的全量写回协议和删除前反向引用追踪仍需后续轮次继续推进�?- 全仓 `tsc` 仍被共享 SDK 类型缺口阻塞�?
## [v0.1.5] - 2026-04-07

### Added
- 新增 `packages/sdkwork-magic-studio-assets/tests/assetCenterDeleteSafety.test.ts`，验证资产中心仅删除 Magic Studio 受管目录内的物理文件，外部绝对路径只删索引不删文件�?- 新增 `docs/review/2026-04-07-step-03-asset-delete-safety.md`，固�?Step 03 第一轮删除安全边界收敛的 review 证据�?- 新增 `docs/release/2026-04-07-v0.1.5-迭代记录.md`，记录本�?Step 03 真实实现、验证结果与剩余风险�?
### Changed
- 更新 `packages/sdkwork-magic-studio-assets/src/asset-center/application/AssetCenterService.ts`，`deleteById(...)` 在删除前新增受管目录门禁，避免对 Magic Studio 受管树之外的本地文件执行物理删除�?- 更新 `packages/sdkwork-magic-studio-assets/src/asset-center/application/magicStudioAssetLayout.ts`，新�?`isManagedAssetAbsolutePath(...)`，统一识别系统素材库、项�?media/cache/exports 与独立覆�?cache/exports 根目录�?- 更新 `packages/sdkwork-magic-studio-assets/tests/magicStudioAssetLayout.test.ts`，补齐受管目录正反判定与覆写缓存根目录覆盖�?- 更新 `docs/release/VERSION.md`，将当前执行状态推进到 Step 03 第一轮真实闭环�?
### Fixed
- 修复资产中心删除回收会误删外部绝对路径文件的高风险问题�?- 修复删除策略只看“索引里是否有路径”而不看“路径是否属于受管目录”的安全缺口�?
### Refactored
- 将删除安全边界从 `AssetCenterService` 的散点判断，收敛�?`magicStudioAssetLayout` 共享目录规则，后续引擎和回收策略可复用同一判定标准�?
### Performance
- 本轮没有引入显式性能优化；通过减少越权文件删除和无效磁盘操作，降低了错�?I/O 风险与回滚成本�?
### Security
- 资产物理删除从“按索引路径删除”升级为“按受管目录白名单删除”，显著提升本地存储治理安全性�?
### Tests
- 执行 Red 用例�?  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/assetCenterDeleteSafety.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads`
  - 结果：`FAIL`，证明外部绝对路径曾被错误删�?- 执行 Green / Regression�?  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/assetCenterDeleteSafety.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads`
  - 结果：`1 file, 2 tests passed`
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/magicStudioAssetLayout.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`1 file, 5 tests passed`
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-assets/tests/assetCenterProjectManagedImport.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads --exclude ".worktrees/**"`
  - 结果：`1 file, 6 tests passed`
  - `pnpm.cmd exec tsc --ignoreConfig --noEmit --jsx react-jsx --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-assets/src/asset-center/application/AssetCenterService.ts packages/sdkwork-magic-studio-assets/src/asset-center/application/magicStudioAssetLayout.ts`
  - 结果：`PASS`

### Docs
- 本轮已补�?Step 03 第一轮的 review、version、changelog �?release 记录闭环�?
### Release Notes
- 当前版本标志着 Step 03 已从“统一目录规划”推进到“统一删除安全边界”阶段，资产中心本地存储治理开始具备商业化交付所需的安全约束�?
### Known Risks
- Step 03 仍未完成统一 `assetId` 主引用收敛，三大引擎还需要继续切换到资产中心主引用协议�?- 外部绝对路径当前采取“仅删索引、不删文件”策略，后续仍需补齐用户可见的回收、重定位和引用追踪产品逻辑�?
## [v0.1.4] - 2026-04-07

### Added
- 新增 `packages/sdkwork-magic-studio-magiccut/src/store/projectGraph.ts`，提�?`buildMagicCutProjectGraph(...)` �?`buildMagicCutPersistedProject(...)`，用于生成和回写 canonical `ProjectGraph`�?- 新增 `packages/sdkwork-magic-studio-magiccut/tests/magicCutProjectGraph.test.ts`，验�?`magiccut` 工程快照能够输出 canonical `ProjectGraph`�?- 新增 `packages/sdkwork-magic-studio-editor/src/services/projectService.test.ts`，验�?`editor/projectService` 不再伪造成功结果�?- 新增 `tests/vitest.codex.config.mjs`，提供本�?Step 02 定向单测所需的最小测试配置�?- 新增 `docs/review/2026-04-07-step-02-project-graph-and-editor-contract.md`，固�?Step 02 第一轮代码闭�?review 证据�?- 新增 `docs/release/2026-04-07-v0.1.4-迭代记录.md`，记录本轮真实实现与验证结果�?
### Changed
- 更新 `packages/sdkwork-magic-studio-magiccut/src/store/defaultProject.ts`，默认工程创建时即携�?canonical `projectGraph`�?- 更新 `packages/sdkwork-magic-studio-magiccut/src/store/projectState.ts`，当持久化工程缺�?`projectGraph` 时可基于 `normalizedState` 自动重建�?- 更新 `packages/sdkwork-magic-studio-magiccut/src/store/magicCutStore.tsx`，autosave 快照改为通过 `buildMagicCutPersistedProject(...)` 输出，避�?`projectGraph` 在保存链路中丢失�?- 更新 `packages/sdkwork-magic-studio-editor/src/services/projectService.ts`，移�?mock 同步/发布成功路径，改为显式未实现错误�?- 更新 `packages/sdkwork-magic-studio-magiccut/tests/defaultProject.test.ts`，补充默认工�?`projectGraph` 断言�?- 更新 `docs/release/VERSION.md`，将当前状态推进到 Step 02 第一轮代码闭环�?
### Fixed
- 修复 `magiccut` 默认工程、运行态状态与持久化快照之�?`projectGraph` 不一致的问题�?- 修复 `editor/projectService` 假装 Git 同步和发布成功、但没有真实实现的虚假闭环问题�?
### Refactored
- �?`magiccut` 的工程快照构建逻辑从散落的 store 持久化拼装，收敛为可复用�?`buildMagicCutPersistedProject(...)`�?
### Performance
- 本轮没有直接引入运行时性能优化；通过统一工程图谱和移除假成功路径，降低后续主干实施的返工成本�?
### Security
- 通过移除 `editor/projectService` 的伪造成功路径，降低“误以为已同�?已发布”的流程型风险�?
### Tests
- 执行了定向单测命令：
  - `pnpm.cmd exec vitest run packages/sdkwork-magic-studio-magiccut/tests/magicCutProjectGraph.test.ts packages/sdkwork-magic-studio-magiccut/tests/defaultProject.test.ts packages/sdkwork-magic-studio-editor/src/services/projectService.test.ts --config tests/vitest.codex.config.mjs --configLoader native --pool threads`
  - 结果：`3 files, 6 tests passed`
- 执行了定向单文件编译验证�?  - `pnpm.cmd exec tsc --ignoreConfig --noEmit --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-editor/src/services/projectService.ts`
  - 结果：`PASS`
- 包级 `tsc -p` 仍被共享 `@sdkwork/app-sdk/*` 类型缺失阻塞，未在本轮内清除�?
### Docs
- 本轮已补�?Step 02 �?review、version、changelog �?release 记录闭环�?
### Release Notes
- 当前版本标志着项目已从 Step 01 基线冻结进入 Step 02 的真实代码实施阶段，并完成了第一轮共享项目图谱与工程协议收敛�?
### Known Risks
- `magicCutProjectService` 仍未升级为真实远端工程服务�?- `editor` 仍未接入真实 Git / 发布平台执行链�?- 全仓 `typecheck` 仍被共享 SDK 类型缺失阻塞�?
## [v0.1.3] - 2026-04-07

### Added
- 新增 `docs/reports/2026-04-07-step-01-gap-audit.md`，冻�?`Step 01` 的差距矩阵、高风险共享文件、owner、优先级与并行禁区�?- 新增 `docs/review/2026-04-07-step-01-baseline-freeze.md`，补�?`Step 01` �?review 证据�?- 新增 `docs/release/2026-04-07-v0.1.3-迭代记录.md`，记录本轮从 Prompt 治理进入真实 step 执行的首轮结果�?
### Changed
- 更新 `docs/架构/00-当前实现审计与架构事实基�?md`，补�?2026-04-07 �?Step 01 基线冻结回写�?- 更新 `docs/架构/14-行业对标-评估标准与演进路�?md`，冻结当前阶段的 P0 / P1 / P2 优先级序列�?- 更新 `docs/架构/15-架构落地步骤-并行实施计划.md`，补�?Step 01 基线冻结后的实施入口与共享文�?owner 约束�?- 更新 `docs/release/VERSION.md`，把当前执行状态从 Prompt 治理轮推进到 Step 01 已闭环状态�?
### Fixed
- 修复此前 release 状态仍停留�?Prompt 治理轮、未反映真实 step 执行进度的问题�?- 修复此前缺少当前工作区脏状态对共享主干实施风险的显式登记问题�?
### Refactored
- 将当前执行入口从“继续打�?Prompt”收敛为“按 Prompt 驱动 Step 01 现实冻结，再进入 Step 02-05 共享主干实施”�?
### Performance
- 无直接性能代码变更；通过冻结当前优先级和并行禁区，降低后续共享主干实施的返工成本�?
### Security
- 无直接安全代码变更；明确�?`default.json` 过宽权限�?`policy.rs` 未闭环状态提升为 P0 共享主干风险�?
### Tests
- 执行�?Step 01 所需的结构级核验命令，确�?`projectService.ts` mock、插件空适配器、AI 直连模型路径、宽 capability 等关键事实均可被代码和命令直接定位�?
### Docs
- 本轮已完�?`docs/架构/00`、`14`、`15` �?Step 01 回写，并补齐 report、review、release 三类文档闭环�?
### Release Notes
- 当前版本标志着项目已从 Prompt 治理增强进入真实 step 执行阶段；下一轮应进入 `Step 02-05` 的共享主干实现，而不是继续停留在指令打磨�?
### Known Risks
- 当前 `main` 分支仍处于大面积脏工作区状态；在处理共享主干代码前，仍需先控�?owner 与隔离边界�?- 本轮未运�?`pnpm test`、`pnpm typecheck` �?`pnpm tauri:build`，因为本轮目标是 Step 01 审计冻结而非代码实现闭环�?
## [v0.1.2] - 2026-04-07

### Added
- �?`docs/prompts/反复执行Step指令.md` 增加“完美结果定义与目标函数”，明确每轮必须优先提升核心价值闭环、架构一致性和商业�?readiness�?- �?Prompt 增加“平台期识别与策略切换规则”“回归重开与完成态撤销规则”“blocker 分层与外部依赖推进规则”“阶段发布量化门禁”�?- 新增 `docs/review/2026-04-07-step-00-prompt-governance-v0.1.2.md`，固化本�?Prompt 治理增强 review 证据�?- 新增 `docs/release/2026-04-07-v0.1.2-迭代记录.md`，沉淀本轮增强�?release 记录�?
### Changed
- 扩展 `docs/release/VERSION.md` 结构，增�?`Quality Score` �?`Stage Gate Verdict` 字段，用于支撑阶段发布裁决�?- 扩展 Prompt 的输出要求和直接执行指令，使其必须显式输出评分变化、平台期/重开状态和 release stage 升级判断�?- 更新 `docs/release/README.md`，同步说�?`VERSION.md` 的新增治理字段�?
### Fixed
- 修复此前 Prompt 对“无效迭代”“连续无增量”“平台期卡顿”的判定不足问题�?- 修复此前 Prompt 对“已完成能力被回归破坏后如何撤销完成态”的规则空缺�?- 修复此前 release stage 升级缺少量化门禁依据的问题�?
### Refactored
- �?Prompt 从“重复执行清单”重构为“带目标函数、平台期破局、回归重开、阶段门禁”的闭环治理指令�?
### Performance
- 无直接运行时代码变更；通过平台期强制切换策略，提升后续真实实施轮的迭代效率与收敛效率�?
### Security
- 无直接安全代码变更；强化了对长期 fallback、未登记 mock、外�?blocker 借口式停工的治理约束�?
### Tests
- �?Prompt �?release 文档进行了结构级检索校验，确认 `平台期`、`回归重开`、`blocker 分层`、`阶段发布量化门禁`、`Quality Score`、`Stage Gate Verdict` 等规则已落盘�?
### Docs
- 对齐 Prompt、review、release 三类文档的治理口径，确保新规则本身也遵守新规则�?
### Release Notes
- 当前版本�?Prompt 治理增强版，目标是让同一条提示词可重复输入并持续自驱迭代，直到全�?step 真正闭环并达到商业化稳定完成态�?
### Known Risks
- 本轮仍属于治理与文档层增强，尚未执行应用构建或功能测试，真实产品能力仍需在后�?step 实施轮中兑现�?
## [v0.1.1] - 2026-04-07

### Added
- �?`docs/prompts/反复执行Step指令.md` 增加“内部自驱思考循环”“防自我欺骗规则”“连续收敛判定”“自我反证结论”等高级治理逻辑�?- 新增 `docs/release/2026-04-07-v0.1.1-迭代记录.md`，沉淀本轮 Prompt 治理增强记录�?
### Changed
- �?Prompt 从“可重复执行”进一步提升为“可反证、可自校验、可持续收敛到商业化稳定完成态”的总控指令�?- 强化每轮 release 记录要求，规定只要发生治理、Prompt、版本或核心实现变化，就必须新增单轮迭代记录�?
### Fixed
- 修正此前 Prompt 中对“高质量完成”的约束不足问题，补齐反回归、反误判与持续收敛逻辑�?
### Refactored
- 重构 Prompt 的执行规则层次，使其同时覆盖现实审计、主目标选择、真实实施、验证、回写、自评和终局判定�?
### Performance
- 无直接性能代码变更；增强了后续迭代对性能短板的识别和持续收敛能力�?
### Security
- 无直接安全代码变更；增强了后续迭代对临时放权、未登记 fallback、伪完成的识别约束�?
### Tests
- �?Prompt 关键治理关键词进行了结构级检索验证，确认新规则已进入文档�?
### Docs
- 强化 Prompt、release、迭代记录之间的闭环关系�?
### Release Notes
- 当前版本�?Prompt �?release 治理增强版，目标是提升后续所�?step 执行的自驱质量与终局收敛能力�?
### Known Risks
- 当前增强仍属于治理与文档层，后续仍需在真实代码实施轮中持续验证其执行效果�?
## [v0.1.0] - 2026-04-07

### Added
- 建立 `docs/prompts/反复执行Step指令.md`，用于驱动当前项目按 step 体系持续重复执行、验证、回写和迭代�?- 建立 `docs/release/README.md`、`docs/release/VERSION.md`、`docs/release/CHANGELOG.md` 基础发布文档骨架�?
### Changed
- 将后续迭代的 release / changelog / version 管理统一收敛�?`docs/release/` 目录�?
### Fixed
- 无�?
### Refactored
- 无�?
### Performance
- 无�?
### Security
- 无�?
### Tests
- �?`docs/step` �?`docs/prompts` 进行了结构级核验，确认关键治理字段已进入 Prompt �?step 总控文档体系�?
### Docs
- �?step 执行、架构回写、review 证据、release 记录统一纳入可重复执�?Prompt�?
### Release Notes
- 当前版本为内部治理与执行框架版本，目标是为后续持续商业化实施提供统一总控入口�?
### Known Risks
- 当前为发布治理与 Prompt 基础骨架，应用核心功能的代码�?step 实施仍需�?`docs/step/00-13` 持续推进�?