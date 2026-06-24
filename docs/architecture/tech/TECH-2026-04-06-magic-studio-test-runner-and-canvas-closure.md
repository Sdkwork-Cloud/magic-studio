> Migrated from `docs/review/2026-04-06-magic-studio-test-runner-and-canvas-closure.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Magic Studio V2 测试运行器与 Canvas 收敛闭环

日期�?026-04-06  
范围：`apps/magic-studio-v2`

---

## 1. 本轮目标

把当前应用从“可构建但根测试不可信”的状态，推进到“根测试、类型检查、git-sdk 构建都可验证通过”的状态�?
本轮主线问题有两类：

1. 根测试运行器边界错误，`vitest` 错误收集 `node:test` 与自执行边界脚本�?2. 运行器噪音清理后暴露出的真实失败，包�?i18n 审查、portal attachment 身份映射、tauri path 断言漂移、canvas 测试超时�?
---

## 2. 已完成修�?
### 2.1 根测试运行器边界收敛

输入�?
1. `tests/testRunnerBoundary.test.ts` 红灯�?2. `pnpm test` �?`vitest` 错误收集 `*.node.test.mjs` �?`scripts/*.test.mjs`�?
输出�?
1. `vite.config.ts`
   - 排除 `**/*.node.test.mjs`
   - 排除 `scripts/*.test.mjs`
2. `package.json`
   - 新增 `test:vitest`
   - 新增 `test:node`
   - `test` 改为串行执行两�?3. `scripts/run-node-tests.mjs`
   - 递归收集 `node:test` 文件
   - 执行 `scripts/*.test.mjs` 自执行边界脚�?   - 跨平台输出统一失败汇�?
结果�?
1. `tests/testRunnerBoundary.test.ts` 通过�?2. `pnpm run test:node` 通过�?3. `pnpm test` 不再被运行器边界错误污染�?
### 2.2 i18n 审查与运行时文案修复

输入�?
1. `packages/sdkwork-magic-studio-i18n/tests/sourceInternationalization.test.ts`
   - 脏工作区�?`git ls-files` 仍返回已删除路径，直�?`readFileSync` �?`ENOENT`
2. `packages/sdkwork-magic-studio-i18n/tests/runtimeUiInternationalization.test.ts`
   - `packages/sdkwork-magic-studio-audio/src/components/AudioLeftGeneratorPanel.tsx` 仍保�?`Text to Speech`

输出�?
1. source audit 测试在读取前显式跳过本地已不存在�?tracked file�?2. `AudioLeftGeneratorPanel` 改用 `t('audio.common.subtitle')`，移除硬编码英文文案�?
结果�?
1. source internationalization audit 通过�?2. runtime UI internationalization audit 通过�?
### 2.3 portal attachment 身份映射修复

输入�?
1. `packages/sdkwork-magic-studio-portal-video/tests/portalAttachmentImport.test.ts`
   - 从资产中心选择现有资产时，`assetUuid` �?`undefined`

根因�?
1. 通用工具 `resolveAssetRecordAssetUuid` 只认 metadata 中的 canonical `assetUuid`
2. portal-video 选择的是资产中心记录，顶�?`asset.uuid` 本身就是稳定 canonical uuid，但当前工具链没有在这个模块里兜底使�?
输出�?
1. `packages/sdkwork-magic-studio-portal-video/src/utils/portalAttachmentImport.ts`
   - 对已存在资产记录新增 `readExplicitAssetUuid` 兜底
   - 仅在 `asset.uuid` 非空且不等于持久�?`asset.id` 时回�?`assetUuid`

结果�?
1. portal attachment 导入身份对齐测试通过�?
### 2.4 tauri path 测试漂移修复

输入�?
1. `scripts/__tests__/tauri-path.test.ts`
   - 当前实现会额外创�?`.magic-studio-write-check`
   - 测试预期仍停留在旧行�?
输出�?
1. 更新断言，接受目标目录和 `.magic-studio-write-check` 目录都被创建�?
结果�?
1. tauri path 测试通过�?
### 2.5 Canvas 超时与内部边界收�?
输入�?
1. `packages/sdkwork-magic-studio-canvas/src/services/index.test.ts`
2. `packages/sdkwork-magic-studio-canvas/src/store/canvasStoreIdentity.test.ts`
3. 根套件下默认 5000ms 超时

根因�?
1. `canvas` 包内部大量通过 `../services` 总桶互相引用
2. 总桶会把 `canvasGenerationService` 一类重模块连带导入
3. `canvasStoreIdentity` 单测导入真实 `canvasBusinessService` 时，把不需要的业务适配层也一起加�?4. 在整�?`vitest` 并发环境里，这种导入成本会把默认 5 秒阈值顶�?
输出�?
1. 生产代码内，包内模块改为优先直连具体 service 文件，而不是统一�?`../services` 回流
   - `canvasStore.tsx`
   - `CanvasBoard.tsx`
   - `CanvasNode.tsx`
   - `CanvasEmptyState.tsx`
   - `CanvasToolbar.tsx`
   - `ElementToolbar.tsx`
   - `CanvasZoomControls.tsx`
2. `packages/sdkwork-magic-studio-canvas/src/services/index.test.ts`
   - 额外 mock `canvasGenerationService`
   - 把测试聚焦到 `NodeFactory` 重导出本�?3. `packages/sdkwork-magic-studio-canvas/src/store/canvasStoreIdentity.test.ts`
   - mock `canvasBusinessService`
   - 仅注入该测试真正需要的 `canvasHierarchyService` 和轻�?`canvasService`

结果�?
1. `index.test.ts` 默认超时下通过�?2. `canvasStoreIdentity.test.ts` 默认超时下通过�?3. 根级 `pnpm test` 通过�?
---

## 3. 新鲜验证证据

本轮已重新执行并通过�?
1. `pnpm exec vitest run tests/testRunnerBoundary.test.ts`
2. `pnpm run test:node`
3. `pnpm exec vitest run scripts/__tests__/tauri-path.test.ts`
4. `pnpm exec vitest run packages/sdkwork-magic-studio-i18n/tests/sourceInternationalization.test.ts`
5. `pnpm exec vitest run packages/sdkwork-magic-studio-i18n/tests/runtimeUiInternationalization.test.ts`
6. `pnpm exec vitest run packages/sdkwork-magic-studio-portal-video/tests/portalAttachmentImport.test.ts`
7. `pnpm exec vitest run packages/sdkwork-magic-studio-canvas/src/services/index.test.ts`
8. `pnpm exec vitest run packages/sdkwork-magic-studio-canvas/src/store/canvasStoreIdentity.test.ts`
9. `pnpm --filter @sdkwork/magic-studio-canvas typecheck`
10. `pnpm run typecheck`
11. `pnpm test`
12. `pnpm run build:git-sdk`

最终状态：

1. `vitest`: `285 passed | 1 skipped`
2. `node-side tests`: `52` 个全部通过
3. `typecheck`: 根级通过
4. `build:git-sdk`: 通过

---

## 4. 当前剩余风险

这些项不是本轮阻塞，但仍应继续治理：

1. `vite.config.ts` 仍有 `MODULE_TYPELESS_PACKAGE_JSON` 警告
   - 当前原因是仓库还没有统一完成 CommonJS / ESM 边界迁移
   - 不能为了消警告直接把�?`package.json` 改成 `"type": "module"`
2. 构建仍提示大 chunk
   - `feature-assets` �?`2088 kB`
   - `feature-magiccut` �?`586 kB`
   - `feature-film` �?`474 kB`
3. 这属于下一轮性能治理与模块拆分工作，不是当前测试或功能正确性阻�?
---

## 5. 下一步计�?
1. �?`feature-assets / feature-magiccut / feature-film` 做更细粒度拆�?   - 继续减少包内通过总桶文件回流
   - 对重组件、重编辑器和历史面板做延迟导�?2. 盘点根目�?`.js/.mjs/.ts` 工程脚本的模块格�?   - 为后续统一处理 `vite.config.ts` 的模块类型警告做准备
3. 继续审视 `magic-studio-v2` 内部包边�?   - 默认优先包内直连具体模块
   - 只在外部消费层暴露稳�?barrel

