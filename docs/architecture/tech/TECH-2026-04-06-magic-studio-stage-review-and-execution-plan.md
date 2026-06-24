> Migrated from `docs/review/2026-04-06-magic-studio-stage-review-and-execution-plan.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Magic Studio V2 阶段审查与执行计�?
日期�?026-04-06  
范围：`apps/magic-studio-v2`

---

## 1. 当前阶段结论

当前应用已经完成以下闭环�?
1. `pnpm run typecheck` 通过�?2. `pnpm run build:git-sdk` 通过�?3. 核心远端业务链路继续遵循 `client.xxx -> retired generic app SDK -> retired Spring app API authority`�?4. `notes` 业务本轮不纳入处理范围�?
但是根测试闭环仍未完成，当前最大的阻塞不是单个业务模块，而是测试运行器边界错误：

1. `vitest` 仍在收集 `*.node.test.mjs`�?2. 根脚本没有把 `vitest` �?`node:test` 分离执行�?3. 结果�?`pnpm test` 的失败噪音过高，无法准确反映真实业务缺陷�?
---

## 2. 已确认的问题列表

### P0 测试运行器架构问�?
根因已经确认�?
1. Node 原生测试文件 `*.node.test.mjs` 采用 `node:test` 风格�?2. 当前根测试命令直接运�?`vitest`，导致这些文件被错误收集，报�?`No test suite found in file ...`�?
修复策略�?
1. `vite.config.ts` 中显式排�?`**/*.node.test.mjs`�?2. `package.json` 中拆�?`test:vitest` �?`test:node`�?3. 新增跨平台脚�?`scripts/run-node-tests.mjs`，递归收集并执行全�?`node:test` 文件�?
### P1 真实剩余失败

在运行器边界收敛之后，继续处理以下真实失败：

1. `packages/sdkwork-magic-studio-i18n/tests/sourceInternationalization.test.ts`
   - tracked file 清单过期�?2. `packages/sdkwork-magic-studio-i18n/tests/runtimeUiInternationalization.test.ts`
   - 仍存在硬编码文案，例�?`Text to Speech`�?3. `packages/sdkwork-magic-studio-portal-video/tests/portalAttachmentImport.test.ts`
   - `assetUuid` 丢失，需要追踪业务代码根因�?4. `scripts/__tests__/tauri-path.test.ts`
   - 断言尚未反映 `.magic-studio-write-check` 路径探测行为�?5. `packages/sdkwork-magic-studio-canvas/src/services/index.test.ts`
6. `packages/sdkwork-magic-studio-canvas/src/store/canvasStoreIdentity.test.ts`
   - 两个测试超时，需要单独做根因排查�?
---

## 3. 本轮执行顺序

### 阶段 A：收敛测试运行器边界

输入�?
1. `tests/testRunnerBoundary.test.ts`

输出�?
1. `vite.config.ts` 排除 `node:test` 文件�?2. `package.json` 拆分根测试脚本�?3. 新增 `scripts/run-node-tests.mjs`�?4. `tests/testRunnerBoundary.test.ts` 通过�?
验证�?
1. `pnpm exec vitest run tests/testRunnerBoundary.test.ts`
2. `pnpm run test:vitest`
3. `pnpm run test:node`

### 阶段 B：清理真实剩余失�?
输入�?
1. 根测试运行器边界已正确分离�?
输出�?
1. i18n 测试恢复真实文件清单与运行时文案约束�?2. portal-video 导入链路恢复 `assetUuid`�?3. tauri path 测试与当前跨平台路径策略一致�?4. canvas 超时问题完成根因分析、修复与回归验证�?
验证�?
1. 定向 `vitest` 测试通过�?2. `pnpm test` 收敛到新的真实结果�?
### 阶段 C：复盘与下一步计�?
输出�?
1. �?`docs/review/` 更新问题列表、修复方案、验证结果和下一步计划�?2. 留存未完成项及其风险说明�?
---

## 4. 当前约束

1. 不修�?generated SDK�?2. 不修�?DB / migration / schema�?3. 不处�?`notes` 业务�?4. 继续保证上传链路使用 S3 预签�?URL 模式�?5. 代码修改必须带回归验证，不做无证据结论�?
---

## 5. 当前实施状�?
当前正在执行阶段 A：测试运行器边界收敛�?
