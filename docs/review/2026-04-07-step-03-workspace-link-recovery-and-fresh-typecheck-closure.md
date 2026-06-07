# 2026-04-07 Step 03 workspace link recovery and fresh typecheck closure

## Step / Wave

- 当前 Step: `Step 03`
- 当前 Wave: `Wave A / 共享主干收敛`
- 当前轮次: `第三十一轮局部闭环`

## 本轮目标

继续执行 `docs/prompts/反复执行Step指令.md`，在上轮已完�?`GenerationResultSelection` 源码导入边界收敛之后，优先完成两件事�?
1. 在不再次触发外部 workspace 安装副作用的前提下，恢复当前�?`node_modules` 的可验证状态�?2. 重新执行 voicespeaker / character 三条 fresh typecheck，确�?`@sdkwork/magic-studio-generation-history` blocker 是否真实关闭�?
## 根因结论

本轮系统化排障确认，上一轮阻塞已经分裂为两个不同层面的问题：

### 1. `pnpm install` 越界风险来自 workspace 结构本身

- `pnpm-workspace.yaml` 将以下外部目录纳入当�?workspace�?  - `../sdkwork-core/sdkwork-core-pc-react`
  - `../openchat/sdkwork-im-sdk/sdkwork-im-sdk-typescript/composed`
  - `../openchat/sdkwork-im-sdk/sdkwork-im-sdk-typescript/adapter-wukongim`
  - `../openchat/sdkwork-im-sdk/sdkwork-im-sdk-typescript/generated/server-openapi`
  - `../../application-root product app SDK TypeScript family`
  - `../../sdk/sdkwork-sdk-commons/sdkwork-sdk-common-typescript`
- 根应�?`magic-studio` 直接依赖 `@sdkwork/core-pc-react`�?- `@sdkwork/core-pc-react` 又直接依赖：
  - `@openchat/sdkwork-im-sdk`
  - `@openchat/sdkwork-im-wukongim-adapter`
  - `@sdkwork/im-backend-sdk`

结论�?
- 当前 workspace 根执�?`pnpm install` 时，天然可能�?`openchat` 依赖链卷入安装范围�?- 这不是偶发噪音，而是当前 workspace 结构的确定性结果�?
### 2. 当前仓真实损坏点是“链接层被拆掉，存储层仍在�?
现场证据�?
- `node_modules/.pnpm` 存在
- `node_modules/.pnpm-workspace-state-v1.json` 存在
- `node_modules/.modules.yaml` 缺失
- `node_modules/.bin` 缺失
- 顶层 `node_modules/react`、`node_modules/typescript`、`node_modules/vitest` 等链接缺�?
结论�?
- 当前仓并不是“依赖包全部丢失”，而是 `pnpm` 先拆除了链接层，但没有完成重建�?- 在这种状态下继续盲跑 `pnpm install`，风险高于收益�?
## RED

### 1. 直接恢复安装失败

命令�?
```bash
$env:CI='true'; pnpm.cmd install --offline --frozen-lockfile --ignore-scripts --config.recursive-install=false
```

结果�?
- `FAIL`
- 输出：`Scope: 33 of 43 workspace projects`
- 首个失败点：
  - `ERR_PNPM_OUTDATED_LOCKFILE`
  - 指向 `openchat\\sdkwork-im-sdk\\sdkwork-im-sdk-typescript\\adapter-wukongim\\package.json`

结论�?
- 即使显式关闭递归安装，`pnpm install` 仍没有被限制在当前应用范围内�?- 当前环境下不能再把“恢复当前仓验证能力”建立在 root install 成功的假设上�?
### 2. fresh typecheck 在恢复前不可执行

命令�?
```bash
node scripts/ensure-workspace-node-modules.mjs
```

结果�?
- `FAIL`
- 错误�?  - `Missing node_modules\.modules.yaml`

## 实施

### 1. 采用当前仓内安全 relink 策略恢复顶层链接�?
本轮没有继续修改业务源码，而是在当前仓 `node_modules` 内执行安�?relink�?
1. 重建 `node_modules/.modules.yaml`
   - 写入 `virtualStoreDir: node_modules/.pnpm`
2. 基于 `node_modules/.pnpm-workspace-state-v1.json` �?`pnpm-lock.yaml`�?   - 恢复 39 �?workspace 包顶层链�?   - 恢复 101 个根直接依赖顶层链接
3. 针对 fresh typecheck 暴露出的传递依赖缺口，继续补齐�?   - `@types/react -> csstype`
   - `@aws-sdk/client-s3` / `@aws-sdk/s3-request-presigner` 的关键依赖链
4. 为验�?runner 恢复情况，补�?`vitest` 基本运行链：
   - 包括 `std-env`

约束说明�?
- 所有动作只发生在当前仓 `node_modules` 内�?- 没有再次触发对外�?workspace �?`install`�?- 没有回退用户已有脏工作区变更�?
## GREEN / 验证结果

### 1. 依赖预检恢复

命令�?
```bash
node scripts/ensure-workspace-node-modules.mjs
```

结果�?
- `PASS`

### 2. TypeScript 运行链恢�?
命令�?
```bash
node node_modules/typescript/bin/tsc -v
```

结果�?
- `PASS`
- 版本：`Version 6.0.2`

### 3. 三条 fresh typecheck 全部通过

命令 A�?
```bash
node node_modules/typescript/bin/tsc --skipLibCheck --ignoreConfig --noEmit --jsx react-jsx --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-voicespeaker/src/components/VoiceLeftGeneratorPanel.tsx
```

结果 A�?
- `PASS`

命令 B�?
```bash
node node_modules/typescript/bin/tsc --skipLibCheck --ignoreConfig --noEmit --jsx react-jsx --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-voicespeaker/src/components/voicespeaker/VoiceLabModal.tsx
```

结果 B�?
- `PASS`

命令 C�?
```bash
node node_modules/typescript/bin/tsc --skipLibCheck --ignoreConfig --noEmit --jsx react-jsx --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-character/src/components/CharacterLeftGeneratorPanel.tsx
```

结果 C�?
- `PASS`

结论�?
- `@sdkwork/magic-studio-generation-history` 已不再是这三条验证链路的首个失败点�?- �?blocker 现已�?fresh 关闭�?
### 4. `vitest` 基础可执行，但测试启动仍�?Vite config 运行时限�?
命令�?
```bash
node node_modules/vitest/vitest.mjs --version
```

结果�?
- `PASS`
- 输出：`vitest/4.1.2 win32-x64 node-v22.20.0`

命令�?
```bash
node node_modules/vitest/vitest.mjs run --config tests/vitest.codex.config.mjs packages/sdkwork-magic-studio-voicespeaker/src/components/VoiceLeftGeneratorPanel.boundary.test.ts packages/sdkwork-magic-studio-voicespeaker/src/components/voicespeaker/VoiceLabModal.boundary.test.ts packages/sdkwork-magic-studio-character/src/components/CharacterLeftGeneratorPanel.boundary.test.ts --exclude ".worktrees/**"
```

结果�?
- `FAIL`
- 首个失败点：
  - `failed to load config`
  - `[plugin externalize-deps] Error: spawn EPERM`

结论�?
- 失败发生�?`vite` 加载配置阶段，不是在边界测试断言本身�?- 当前不能把它描述成业务回归，只能登记为独立的运行�?/ 沙箱限制�?
## 检查点评估

### CP03-56 是否已定�?`@sdkwork/magic-studio-generation-history` 解析失败的源码层根因

- 结论：`PASS`

### CP03-57 是否已完成源码层最小修�?
- 结论：`PASS`

### CP03-60 是否已在不触发外�?workspace install 的前提下恢复当前仓预检能力

- 结论：`PASS`
- 证据�?  - `ensure-workspace-node-modules.mjs` 已通过
  - `tsc` / `vitest --version` 已恢复执�?
### CP03-61 是否�?fresh 关闭 voicespeaker / character �?generation-history blocker

- 结论：`PASS`
- 证据�?  - 三条 targeted fresh typecheck 全部通过

### CP03-62 是否已完成本轮边界测试复�?
- 结论：`NO`
- 原因�?  - `vite` 配置加载阶段触发 `spawn EPERM`
  - 当前是独立运行时限制，不是已确认的测试断言失败

## 现存风险 / Blocker

- 当前 `node_modules` 恢复策略仍是 session �?safe relink，尚未沉淀为仓内正式恢复工具�?- `vitest` 用例执行仍受 `vite` 配置加载阶段 `spawn EPERM` 限制�?- 全仓 `test / typecheck / build` 尚未完成，当前仍不具备升�?`alpha` 条件�?
## 下一轮建�?
1. 将当�?safe relink 策略沉淀为仓内可重复执行的依赖恢复工具，避免后续再被 root install 越界风险拖慢�?2. 独立治理 `vite` / `rolldown` / `externalize-deps` 在当前环境下�?`spawn EPERM`，恢复轻�?boundary test 执行能力�?3. �?blocker 关闭后，继续扩大�?Step 03 的跨包回归、全�?typecheck 与构建审计�?