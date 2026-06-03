# Magic Studio V2 测试审计�?User 子系统修复计�?
日期�?026-04-06  
范围：`apps/magic-studio-v2`  
来源：本轮在应用根目录执�?`pnpm test`、`pnpm lint`、定�?node/vitest 复测后整理�?
---

## 1. 当前阶段结论

当前应用已经满足�?
1. `pnpm run typecheck` 通过�?2. `pnpm run build:git-sdk` 通过�?
但“可构建”不等于“可完整交付”。本轮继续向测试闭环推进时，发现根级质量闸门仍有明显缺口�?
1. `pnpm test` 失败�?2. `pnpm lint` 失败�?
其中，失败项可分为三类：

1. 应用内真实回归缺陷�?2. 包级配置/兼容边界漂移�?3. lint 规则升级后暴露出�?React 运行时与 Hook 用法问题�?
---

## 2. 本轮新增问题列表

### 2.1 P0: `magic-studio-user` 兼容桥接回归

证据�?
- `pnpm exec vitest run packages/sdkwork-magic-studio-user/tests/userCenterService.node.test.mjs`
- `pnpm exec vitest run packages/sdkwork-magic-studio-user/tests/userCompatibility.test.tsx`
- `node --test tests/rootIdentityAlias.node.test.mjs`

问题 1：`userCenterService` �?`vitest` 下失�?
- 失败点：
  - `getUserProfile`
  - `createAddress`
  - `updateUserProfile`
- 报错�?  - `Cannot read properties of undefined (reading 'client')`
- 根因�?  - 当前 service �?`client.user` 上解�?抽取 generated API class method 后再调用，丢失了 `this`，导�?generated `UserApi` 内部访问 `this.client` 时崩溃�?
问题 2：`ProfilePage` 独立渲染时未加载本地用户 i18n

- 失败点：
  - `packages/sdkwork-magic-studio-user/tests/userCompatibility.test.tsx`
- 现象�?  - UI 上显�?`user.accountCenterTitle`、`user.searchPlaceholder` �?key，而非翻译后的文本�?- 根因�?  - 页面独立渲染时没有保�?`@sdkwork/magic-studio-user` 自身 namespace 已注册�?  - 当前 i18n 注册主要发生在应�?`bootstrap`，不覆盖包级独立渲染场景�?
问题 3：身份边�?tsconfig 漂移

- 失败点：
  - `tests/rootIdentityAlias.node.test.mjs`
- 现象�?  - `packages/sdkwork-magic-studio-auth/tsconfig.json`
  - `packages/sdkwork-magic-studio-user/tsconfig.json`
  仍然�?`@sdkwork/auth-pc-react` / `@sdkwork/user-pc-react` 指向 root shim�?- 根因�?  - 包级 typecheck 没有对准真实 shared IAM source，偏离了既定“root �?shim、package 用真实源码”的边界设计�?
### 2.2 P1: `magiccut` 逻辑测试回归

`pnpm test` 当前仍暴露：

- `packages/sdkwork-magic-studio-magiccut/tests/dropPreview.test.ts`
- `packages/sdkwork-magic-studio-magiccut/tests/effectPlacement.test.ts`
- `packages/sdkwork-magic-studio-magiccut/tests/playerPreviewService.test.ts`
- `packages/sdkwork-magic-studio-magiccut/tests/transitionPlayback.test.ts`

这些失败说明�?
1. 预览资源定位逻辑与资源身份字段的约定可能发生了漂移�?2. effect / transition 放置逻辑当前返回 `null` 或空 Map，不符合既有语义�?
这一组属于下一轮重点�?
### 2.3 P1: `canvas` 测试超时

`pnpm test` 当前仍暴露：

- `packages/sdkwork-magic-studio-canvas/src/services/index.test.ts`
- `packages/sdkwork-magic-studio-canvas/src/store/canvasStoreIdentity.test.ts`

当前表现更像初始化路径卡住或动�?import 边界回归，需要单独排查�?
### 2.4 P2: `portal-video` �?`i18n` 兼容测试回归

已发现：

- `packages/sdkwork-magic-studio-portal-video/tests/portalAttachmentImport.test.ts`
- `packages/sdkwork-magic-studio-i18n/tests/runtimeUiInternationalization.test.ts`

其中 `portal-video` 明确体现 `assetUuid` 丢失�?
### 2.5 P2: lint 大量失败

`pnpm lint` 当前统计�?
- `1381` 个问�?- `326` �?error
- `1055` �?warning

已确认的高价�?error 类型包括�?
1. `react-hooks/set-state-in-effect`
2. `react-hooks/refs`
3. `react-hooks/preserve-manual-memoization`
4. `no-useless-assignment`
5. `unused eslint-disable directive`

lint 面太大，本轮不适合无序横扫，必须按模块分批治理�?
---

## 3. 本轮执行顺序

### �?1 步：先收�?`magic-studio-user` 整组

目标�?
1. 修复 generated `user` client method �?`this` 绑定问题�?2. �?`ProfilePage` 独立渲染时具备本�?i18n 自注册能力�?3. 恢复 `auth/user` 包级 tsconfig 身份别名边界�?
验证命令�?
- `pnpm exec vitest run packages/sdkwork-magic-studio-user/tests/userCenterService.node.test.mjs`
- `pnpm exec vitest run packages/sdkwork-magic-studio-user/tests/userCompatibility.test.tsx`
- `node --test tests/rootIdentityAlias.node.test.mjs`

### �?2 步：处理 `magiccut` 测试�?
条件�?
- �?1 步全部通过后再进入�?
### �?3 步：处理 `canvas` 超时�?
条件�?
- `magiccut` 回归收敛后继续�?
### �?4 步：�?error 优先治理 lint

原则�?
1. 先清 error，后考虑 warnings�?2. 优先处理会影�?React 正确性和运行时行为的问题，而不是样式性告警�?
---

## 4. 当前状�?
本轮文档写入时，准备执行的是�?
1. `magic-studio-user` 服务绑定修复�?2. `magic-studio-user` i18n 自注册修复�?3. `auth/user` 包级 IAM tsconfig 修复�?
