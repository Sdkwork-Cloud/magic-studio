> Migrated from `docs/review/2026-04-06-magic-studio-iteration-closure.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Magic Studio V2 迭代闭环 Review

日期�?026-04-06  
范围：`apps/magic-studio-v2`  
目标：收敛当前应用内的工程级阻塞，确�?`client.xxx -> retired generic app SDK -> retired Spring app API authority` 对接链路未回退，并把剩余风险、修复方案、后续计划落到文档�?
---

## 1. 当前结论

当前 `magic-studio-v2` 应用内本轮阻塞已完成闭环�?
1. 根级 `pnpm run typecheck` 已通过�?2. `pnpm run build:git-sdk` 已通过�?3. 当前剩余问题主要是非阻塞告警或跨应用问题，不属于本应用本轮功能失败�?
本轮最后一个应用内阻塞点是�?
- `packages/sdkwork-magic-studio-character/src/pages/CharacterPage.test.tsx`

其根因不是角色业务逻辑错误，而是测试文件中的 `vi.fn` 默认签名�?`mock.calls` 严格类型约束不兼容，和之前已经修复的 `audio / music / sfx / image / video / voicespeaker` 页面测试问题是同一类工程问题�?
---

## 2. 本轮新增修复

### 2.1 `magic-studio-character` 页面测试严格类型收敛

文件�?
- `packages/sdkwork-magic-studio-character/src/pages/CharacterPage.test.tsx`

问题表现�?
- `TS2554: Expected 0 arguments, but got 1`
- `TS2493: Tuple type '[]' of length '0' has no element at index '0'`
- `TS18048: paneProps / initialPaneProps / filteredPaneProps is possibly 'undefined'`

根因�?
1. `generationHistoryListPane` 被声明为 `vi.fn(() => null)`，在严格类型推断下被视为不接收参数�?2. `mock.calls.at(-1)?.[0]` �?`vitest` 严格元组推断下会得到可能为空的调用元组�?3. 这些写法在运行时没有问题，但�?`tsc --noEmit` 下会变成工程级阻塞�?
修复方案�?
1. �?mock 改为 `vi.fn((props: any) => props)`，显式接�?pane props�?2. �?`mock.calls.at(-1)?.[0]` 的结果在测试中显式收窄为 `any`�?3. 保持业务断言不变，只修复测试类型噪音，不改页面生产逻辑�?
结果�?
- `@sdkwork/magic-studio-character` 包级 `typecheck` 通过�?- `CharacterPage` 页面测试通过�?- 根级 `typecheck` 完整通过�?
---

## 3. 本轮验证证据

### 3.1 新鲜验证命令

已执行并通过�?
- `pnpm --filter @sdkwork/magic-studio-character typecheck`
- `pnpm exec vitest run packages/sdkwork-magic-studio-character/src/pages/CharacterPage.test.tsx`
- `pnpm run typecheck`
- `pnpm run build:git-sdk`
- `pnpm exec vitest run packages/sdkwork-magic-studio-character/src/pages/CharacterPage.test.tsx packages/sdkwork-magic-studio-settings/tests/packageBoundary.test.ts packages/sdkwork-magic-studio-trade/src/services/paymentService.test.ts`

### 3.2 补充审查命令

已执行：

- `pnpm run audit:services:policy:review-gate`
  - 结果：未失败，但由于缺少环境变量 `POLICY_BASE_FILE`，当前只是跳�?diff 审查�?- `pnpm run check:sdk-standard:quick`
  - 结果：失败�?  - 失败位置：`apps/sdkwork-chat-pc-react/packages/sdkwork-openchat-pc-auth/src/services/appAuthService.ts`
  - 结论：这是跨应用标准问题，不属于当前 `magic-studio-v2` 应用内缺陷�?
---

## 4. 当前问题列表

### 4.1 已闭环问�?
1. `magic-studio-settings <-> magic-studio-assets` �?`turbo typecheck` 循环依赖已经拆除�?   - 当前方案是在 `magic-studio-settings` 内部新增轻量 `AgentPromptEditor`，不再反向依�?`@sdkwork/magic-studio-assets`�?2. `assetCenter / cover prompt / S3 presigned upload / film analysis / trade recharge / video lip-sync / voice-speaker clone & generation` �?SDK 对接阻塞已收敛�?3. 多个页面测试�?store 测试中的 strict TypeScript 问题已经通过统一模板修复�?4. 本轮最后剩余的 `magic-studio-character` 页面测试类型阻塞已经收敛�?
### 4.2 当前仍需后续处理的非阻塞�?
1. `review-gate` 没有基线文件�?   - 现象：`audit:services:policy:review-gate` 因缺�?`POLICY_BASE_FILE` 跳过�?   - 影响：服务封装策略无法做增量 diff 审查，CI 只能做到“可运行”，不能做到“变更准入”�?   - 建议：在 CI 或本地审查链路中产出并注入基线文件，再启�?review-gate�?
2. `vite.config.ts` 的模块类型告警仍在�?   - 现象：Node 提示根目�?`package.json` 未声�?`"type": "module"`，导�?`vite.config.ts` 被重新按 ES module 解析�?   - 影响：属于构建性能与工程一致性问题，不影响本轮功能交付�?   - 当前不直接改动原因：
     - 仓库内仍存在若干 `.js` 脚本，需要先�?CommonJS / ESM 脚本盘点，不能为了消告警直接�?`"type": "module"`�?     - 现有测试与文档还直接引用 `vite.config.ts` 文件名，例如 `tests/viteReactAlias.node.test.mjs`、`tests/viteStartupPathing.node.test.mjs`，因此也不能未经联动改造就直接改名�?`vite.config.mts`�?
3. 产物 chunk 体积偏大�?   - 当前观察值：
     - `feature-assets` �?`2088 kB`
     - `feature-magiccut` �?`586 kB`
     - `feature-film` �?`474 kB`
   - 影响：首屏加载、Tauri 包体、缓存更新粒度、低性能设备体验都会受影响�?   - 建议：下一轮按功能边界拆分懒加载与编辑器级动态导入，而不是简单调�?warning 阈值�?
4. 仓库级标准检查存在跨应用失败�?   - 失败位置：`apps/sdkwork-chat-pc-react/packages/sdkwork-openchat-pc-auth/src/services/appAuthService.ts`
   - 结论：需要单独开一轮修复，不应混入本应用代码中�?
---

## 5. 本轮遵循的设计与边界

本轮继续遵循以下固定约束�?
1. 所有远端业务交互统一走：
   - `feature/service -> useAppSdkClient / client.xxx -> retired generic app SDK -> retired Spring app API authority`
2. 不修�?generated SDK 产物来“修类型”�?3. 不修�?DB / migration / schema�?4. 不处�?`notes` 业务功能本身�?5. 上传链路继续采用 S3 标准预签�?URL�?   - `client.upload.getPresignedUrl`
   - 前端直传 `PUT presignedUrl`
   - 透传服务端要求的 `headers`
   - `client.upload.registerPresigned`

---

## 6. 下一步执行计�?
### 6.1 工程治理

1. �?`audit:services:policy:review-gate` 产出可复用的 `POLICY_BASE_FILE` 基线文件�?2. �?review-gate 接入 CI，避免未�?service 边界回退�?
### 6.2 构建优化

1. 盘点根目�?`.js` 脚本的模块格式，决定采用�?   - `vite.config.ts -> vite.config.mts`
   - 或整体切�?`package.json` 的模块声�?2. �?`feature-assets / feature-film / feature-magiccut` �?chunk 拆分设计�?   - 路由级懒加载
   - 编辑器重模块延迟加载
   - 大型第三方依赖隔�?
### 6.3 仓库级标准收�?
1. 单独处理 `apps/sdkwork-chat-pc-react` �?auth 标准问题�?2. 重新�?`pnpm run check:sdk-standard:quick`，把跨应用失败从仓库层面清零�?
---

## 7. 交付状�?
截至 2026-04-06，本应用当前阶段的交付状态为�?
1. 应用�?SDK 对接主链路可构建�?2. 根级类型检查已恢复为通过状态�?3. 当前剩余项以工程优化和跨应用治理为主，不是本应用的功能阻塞�?
