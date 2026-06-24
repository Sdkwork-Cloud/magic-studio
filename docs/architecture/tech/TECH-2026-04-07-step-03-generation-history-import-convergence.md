> Migrated from `docs/review/2026-04-07-step-03-generation-history-import-convergence.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 2026-04-07 Step 03 generation-history import convergence

## Step / Wave

- 当前 Step: `Step 03`
- 当前 Wave: `Wave A / 共享主干收敛`
- 当前轮次: `第三十轮局部闭环`

## 本轮目标

继续执行 `docs/prompts/反复执行Step指令.md`，在第一批核心消费方已经完成收口之后，转向阻塞项治理。本轮选定目标�?
- `packages/sdkwork-magic-studio-voicespeaker/src/components/panel/types.ts`
- `packages/sdkwork-magic-studio-voicespeaker/src/components/voicespeaker/VoiceLabModal.tsx`
- `packages/sdkwork-magic-studio-character/src/components/CharacterLeftGeneratorPanel.tsx`

目标是定位并收敛 `@sdkwork/magic-studio-generation-history` �?voicespeaker / character 定向 typecheck 中的解析失败根因，并给出真实验证状态�?
## 根因结论

本轮系统化调试确认：

1. 初始失败命令为：

```bash
pnpm.cmd exec tsc --skipLibCheck --ignoreConfig --noEmit --jsx react-jsx --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-voicespeaker/src/components/VoiceLeftGeneratorPanel.tsx
```

失败信息�?
- `packages/sdkwork-magic-studio-voicespeaker/src/components/panel/types.ts(2,48): error TS2307: Cannot find module '@sdkwork/magic-studio-generation-history' or its corresponding type declarations.`

2. 进一步审计确认：

- `packages/sdkwork-magic-studio-voicespeaker/package.json`
  - 没有声明 `@sdkwork/magic-studio-generation-history`
- `packages/sdkwork-magic-studio-character/package.json`
  - 也没有声�?`@sdkwork/magic-studio-generation-history`
- `packages/sdkwork-magic-studio-assets/package.json`
  - 已声明该依赖，且其包�?`node_modules/@sdkwork/magic-studio-generation-history` 实际存在

3. 当前环境中真实的链接状态：

- `packages/sdkwork-magic-studio-assets/node_modules/@sdkwork/magic-studio-generation-history` 存在
- `packages/sdkwork-magic-studio-voicespeaker/node_modules/@sdkwork/magic-studio-generation-history` 不存�?- `packages/sdkwork-magic-studio-character/node_modules/@sdkwork/magic-studio-generation-history` 不存�?
4. 对照工作模式确认�?
- `@sdkwork/magic-studio-assets` �?`@sdkwork/magic-studio-assets/generation` 已稳�?re-export `GenerationResultSelection`
- voicespeaker / character 本身已经真实依赖 `@sdkwork/magic-studio-assets`

因此本轮根因结论是：

- 直接�?`@sdkwork/magic-studio-generation-history` 裸模块导入类型，在当�?`tsc --ignoreConfig` 校验路径下依赖真实包链接
- voicespeaker / character 没有这条稳定的直接依赖边�?- 更稳的消费方式是通过已声明依赖的 `@sdkwork/magic-studio-assets/generation` 收敛类型来源

## 设计约束

- 不扩大到业务逻辑改�?- 不在当前受损环境下继续强行重建整�?workspace 依赖�?- 优先修复源码层的导入边界
- 环境损坏与代码修复必须分开记录，不能误�?blocker 已完全关�?
## RED

### 1. 失败复现

命令�?
```bash
pnpm.cmd exec tsc --skipLibCheck --ignoreConfig --noEmit --jsx react-jsx --module ESNext --moduleResolution bundler --target ES2022 --lib ES2022,DOM packages/sdkwork-magic-studio-voicespeaker/src/components/VoiceLeftGeneratorPanel.tsx
```

结果�?
- `FAIL`
- 失败点：
  - `TS2307: Cannot find module '@sdkwork/magic-studio-generation-history'`

### 2. 依赖重链尝试

命令 A�?
```bash
pnpm.cmd install --ignore-scripts --offline --filter @sdkwork/magic-studio-voicespeaker --filter @sdkwork/magic-studio-character
```

结果 A�?
- `FAIL`
- 错误�?  - `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`

命令 B�?
```bash
$env:CI='true'; pnpm.cmd install --ignore-scripts --offline --filter @sdkwork/magic-studio-voicespeaker --filter @sdkwork/magic-studio-character
```

结果 B�?
- `FAIL`
- 错误�?  - `EPERM: operation not permitted, unlink '...apps\\openchat\\sdkwork-im-sdk\\sdkwork-im-sdk-typescript\\adapter-wukongim\\node_modules\\typescript'`

补充结论�?
- 依赖重链尝试在当前环境下失败，并破坏了当�?workspace �?`node_modules` 元数�?- 不能再把“环境恢复”与“源码根因修复”混为一�?
## 实施

### 1. 收敛类型导入来源

更新�?
- `packages/sdkwork-magic-studio-voicespeaker/src/components/panel/types.ts`
- `packages/sdkwork-magic-studio-voicespeaker/src/components/voicespeaker/VoiceLabModal.tsx`
- `packages/sdkwork-magic-studio-character/src/components/CharacterLeftGeneratorPanel.tsx`

落地方式�?
- 将：

```ts
import type { GenerationResultSelection } from '@sdkwork/magic-studio-generation-history';
```

- 收敛为：

```ts
import type { GenerationResultSelection } from '@sdkwork/magic-studio-assets/generation';
```

### 2. 保持依赖声明最小化

说明�?
- 中途尝试给 voicespeaker / character 增补 `workspace:*` 依赖声明，但由于当前环境无法完成依赖重链，本轮最终没有保留这条未验证的依赖声明变�?- 保持最�?diff 聚焦在可落地且更稳定的源码导入边�?
## GREEN / 验证结果

### 1. 源码边界验证

命令�?
```bash
rg -n "@sdkwork/magic-studio-generation-history" packages/sdkwork-magic-studio-voicespeaker packages/sdkwork-magic-studio-character
```

结果�?
- 源码目录下已不再出现 voicespeaker / character �?`@sdkwork/magic-studio-generation-history` 的直接导�?- 仅剩 `packages/sdkwork-magic-studio-voicespeaker/tsconfig.json` 中的路径别名声明

### 2. 环境检�?
命令�?
```bash
node scripts/ensure-workspace-node-modules.mjs
```

结果�?
- `FAIL`
- 错误�?  - `Missing node_modules\.modules.yaml; run pnpm install in <workspace-root>\magic-studio-v2.`

### 3. fresh typecheck 状�?
结论�?
- `BLOCKED`
- 原因�?  - �?`node_modules` 元数据已损坏
  - 当前无法获得与本轮开始时等价�?fresh `pnpm exec tsc` 运行前提

## 检查点评估

### CP03-56 是否已定�?`@sdkwork/magic-studio-generation-history` 解析失败的源码层根因

- 结论：`PASS`
- 证据�?  - voicespeaker / character 直接依赖了未稳定链接的裸模块
  - assets 作为已声明依赖，提供了稳�?re-export 边界

### CP03-57 是否已完成源码层最小修�?
- 结论：`PASS`
- 证据�?  - voicespeaker / character 已改为从 `@sdkwork/magic-studio-assets/generation` 导入 `GenerationResultSelection`

### CP03-58 是否已经 fresh 验证 blocker 被完全关�?
- 结论：`NO`
- 原因�?  - 当前 workspace �?`node_modules` 元数据损�?  - `pnpm exec` 工具链不可用

### CP03-59 是否应误报进�?`alpha`

- 结论：`NO`
- 原因�?  - blocker 只完成了源码层修�?  - fresh typecheck 仍被环境损坏阻塞
  - 全仓 `test / typecheck / build` 尚未完成

## 现存风险 / Blocker

- �?`node_modules` 缺失 `.modules.yaml`
- `pnpm exec` 当前不可用，`tsc` / `vitest` 需要先恢复 workspace node_modules
- 在环境恢复前，不能宣�?voicespeaker / character �?typecheck blocker 已完全关�?
## 下一轮建�?
1. 先恢复当�?workspace �?`node_modules` 元数据�?2. 环境恢复后，重新执行三条 fresh typecheck�?   - `VoiceLeftGeneratorPanel.tsx`
   - `VoiceLabModal.tsx`
   - `CharacterLeftGeneratorPanel.tsx`
3. 只有�?fresh typecheck 成功后，才能把该 blocker �?stage gate 中移除�?
