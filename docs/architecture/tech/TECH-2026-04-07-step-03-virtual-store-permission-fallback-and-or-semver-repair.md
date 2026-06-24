> Migrated from `docs/review/2026-04-07-step-03-virtual-store-permission-fallback-and-or-semver-repair.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 2026-04-07 Step 03 virtual store permission fallback and OR semver repair

## Step / Wave

- Current Step: `Step 03`
- Current Wave: `Wave A / 工具链与依赖恢复治理`
- Review Scope: `repair:deps` �?`.pnpm` 既有候选包的恢复能力、`safe Vitest` 回归稳定性、剩�?frontier 缺口判定收敛�?
## 背景

本轮继续执行 `/docs/prompts/反复执行Step指令.md` �?`docs/step/` �?Step 约束，在已有 `offline root install = No-Go`、`safe runner` 边界修复、`prerelease semver` 修复的基础上，继续收敛 `repair:deps` 误报范围�?
上一轮结束时，`repair:deps` 仍有 `21` �?actionable frontier，且已确认其中一部分依赖�?`.pnpm` 中真实存在，但仍未被恢复到根 `node_modules`�?
## 根因调查

### 根因 1：虚拟仓候选包 `package.json` 存在，但读取会触�?`EPERM / EACCES`

通过针对真实依赖的旁路诊断确认：

- `ecdsa-sig-formatter@1.0.11`
- `gcp-metadata@8.1.2`
- `google-logging-utils@1.1.3`
- `extend@3.0.2`
- `jwa@2.0.1`
- `safe-buffer@5.1.2 / 5.2.1`
- `node-fetch@3.3.2`

这些候选包都存在于 `.pnpm/<pkg>@<version>/node_modules/<pkg>/package.json`，但在当前环境中直接读取 `package.json` 会报 `EPERM` 或权限拒绝，导致解析器把候选项静默丢弃，从而误判为缺失�?
### 根因 2：`repair:deps` 不支�?`||` semver 范围

通过�?`eslint-plugin-react-hooks` 依赖链诊断确认：

- `zod` 范围�?`^3.25.0 || ^4.0.0`
- `zod-validation-error` 范围�?`^3.5.0 || ^4.0.0`

当前实现只支持单�?`^ / ~ / >= / exact`，未支持 OR 范围，导�?`zod@4.3.6` �?`zod-validation-error@4.0.2` 虽然存在且可读，仍被错误判为缺失�?
## TDD 落地

### 新增失败测试

�?`scripts/__tests__/repair-workspace-node-modules.test.ts` 中先补了两个失败用例�?
1. `falls back to virtual store directory versions when candidate package.json reads fail`
2. `supports OR semver ranges when relinking transitive dependencies`

初次执行时两个测试均失败，符合预期，证明问题已经被稳定复现�?
### 实现修复

�?`scripts/repair-workspace-node-modules.mjs` 中做了最小必要修改：

1. `satisfiesDependencyRange(...)`
   - 增加 `||` 范围解析
   - 对每个子范围递归复用现有比较逻辑

2. `createVirtualStoreResolver(...)`
   - 为虚拟仓候选包建立 `{ packageJson, error }` 读取缓存
   - 当候�?`package.json` �?`EPERM / EACCES` 无法读取时，不再直接放弃
   - 回退使用 `.pnpm` 目录名中的版本信息继续进行匹配和排序
   - ambiguous 结果改为记录 `resolved.version`，避免依�?`packageJson.version`

## 验证结果

### 定向测试

- `pnpm.cmd run test:vitest:safe -- scripts/__tests__/repair-workspace-node-modules.test.ts`
  - 结果：`8 tests passed`

### Step 03 回归测试

- `pnpm.cmd run test:vitest:safe -- scripts/__tests__/run-vitest-safe.test.ts scripts/__tests__/ensure-workspace-node-modules.test.ts scripts/__tests__/repair-workspace-node-modules.test.ts tests/testRunnerBoundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/VoiceLeftGeneratorPanel.boundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/voicespeaker/VoiceLabModal.boundary.test.ts packages/sdkwork-magic-studio-character/src/components/CharacterLeftGeneratorPanel.boundary.test.ts`
  - 结果：`7 files, 23 tests passed`

### `repair:deps` 收敛结果

执行�?
- `repairWorkspaceNodeModules({ workspaceRoot: process.cwd() })`

结果�?
- `actionableUniqueCount: 11`
- `frontierUniqueCount: 11`
- `deferredUniqueCount: 0`

与上一轮相比，本轮�?frontier �?`21` 收敛�?`11`，说明误报已被显著压缩�?
## 剩余 blocker 判定

剩余 `11` 项如下：

- `@eslint/js`
- `archiver`
- `fast-xml-parser`
- `mediabunny`
- `png-to-ico`
- `protobufjs`
- `rxjs`
- `sharp`
- `shell-quote`
- `tippy.js`
- `typescript-eslint`

其中可进一步分为两类：

### 真实根依赖或版本缺口

- `@eslint/js`
- `archiver`
- `mediabunny`
- `png-to-ico`
- `sharp`
- `tippy.js`
- `typescript-eslint`
- `protobufjs`

这些项仍需通过后续受控安装或锁定版本修复，不属于本轮解析器误报�?
### 虚拟仓内容不完整

- `fast-xml-parser`
- `rxjs`
- `shell-quote`

这三项在 `.pnpm` 根目录下可以看到对应目录名，但在期望路径下不存在可读取的 `package.json`�?
- `node_modules/.pnpm/fast-xml-parser@5.5.8/node_modules/fast-xml-parser/package.json`
- `node_modules/.pnpm/rxjs@7.8.2/node_modules/rxjs/package.json`
- `node_modules/.pnpm/shell-quote@1.8.3/node_modules/shell-quote/package.json`

因此本轮判定其为真实虚拟仓内容缺失，而非继续通过脚本逻辑兜底�?
## Bar / 结论

- `阻塞收敛 bar`：本轮达成。误报已�?`21` 收敛�?`11`
- `能力实现 bar`：本轮达成。`EPERM/EACCES` 虚拟仓回退�?OR semver 均已落地
- `Step 完成 bar`：本轮未达成。仍存在真实安装级缺口和虚拟仓内容缺�?
## 下一步建�?
1. 进入 Step 03 下一轮，针对剩余 11 项做“真实缺�?vs 虚拟仓破损”分流治理�?2. 对根依赖缺口采用 repo-local、最小范围、可回滚�?targeted install 方案，不回退�?root offline install No-Go 路径�?3. �?`fast-xml-parser / rxjs / shell-quote` 单独做虚拟仓完整性校验，确认是否需要重新恢复对�?store entry�?4. �?frontier 进一步降�?0 之前，Release Stage 保持 `internal`�?
