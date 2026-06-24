> Migrated from `docs/review/2026-04-06-magic-studio-lint-stage-review.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Magic Studio V2 Lint 阶段审查与本轮实施计�?
日期�?026-04-06  
范围：`apps/magic-studio-v2`

---

## 1. 当前阶段结论

截至本轮开始前，当前应用已经完成以下验证闭环：

1. `pnpm test` 通过
2. `pnpm run typecheck` 通过
3. `pnpm run build:git-sdk` 通过
4. 根测试运行器已经拆分�?`test:vitest` �?`test:node`
5. `vitest` 已排�?`*.node.test.mjs` �?`scripts/*.test.mjs`
6. 既有 `tauri-path / i18n / portal attachment / canvas` 问题已经完成收敛

当前新的主阻塞项不再是测试运行器，也不是构建链路，而是根级 `lint`�?
---

## 2. 新鲜验证结果

本轮重新执行并确认：

1. `pnpm lint`
   - 结果：失�?   - 结论：当前仍有大规模 lint 问题，优先处�?`error` 级问�?2. `pnpm run audit:services:policy:review-gate`
   - 结果：未失败，但提示缺少 `POLICY_BASE_FILE`
   - 结论：当前视�?review gate 被环境条件跳过，不是本轮主阻�?3. `pnpm run check:sdk-standard:quick`
   - 结果：失�?   - 结论：失败点位于跨应用目录，不属于当�?`magic-studio-v2` 本应用代码问题，不纳入本轮修�?4. `pnpm exec eslint packages/sdkwork-magic-studio-assets/src --ext ts,tsx --quiet`
   - 结果：失败，�?`20` �?`error`
   - 结论：当前本应用最明确、最可闭环的阻塞点集中在 `packages/sdkwork-magic-studio-assets`

---

## 3. 阻塞问题清单

### P0：`sdkwork-magic-studio-assets` 组件�?React Hooks 新规则不满足

受影响文件：

1. `src/components/AssetSidebar.tsx`
   - 问题：`react-hooks/set-state-in-effect`
   - 根因：`domain` 变化后在 `useEffect` 内同�?`setSections(...)`
2. `src/components/CreationChatInput/CreationChatInput.tsx`
   - 问题：`react-hooks/refs`
   - 根因：render 期间�?`attachmentsRef.current` 间接暴露�?`getSuggestionConfig(...)`
3. `src/components/CreationChatInput/StyleSelector.tsx`
   - 问题：`react-hooks/preserve-manual-memoization`
   - 根因：`useMemo` 依赖与推断依赖不一�?4. `src/components/CreationChatInput/components/MentionList.tsx`
   - 问题：`react-hooks/set-state-in-effect`
   - 根因：`items` 变化后用 effect 强制重置 `selectedIndex`
5. `src/components/generate/GenerationChatWindow.tsx`
   - 问题：`react-hooks/set-state-in-effect`
   - 根因：`config.prompt` 被镜像为本地 `input`，通过 effect 同步
6. `src/components/generate/upload/UploadVideoGenerationModal.tsx`
   - 问题�? �?`react-hooks/set-state-in-effect`
   - 根因：当 model/resolution/duration/aspectRatio 不在选项中时，通过 effect 同步纠偏

### P0：`sdkwork-magic-studio-assets` 通用语义错误

受影响文件：

1. `src/components/CreationChatInput/components/AttachmentGrid.tsx`
   - 问题：`no-useless-assignment`
   - 根因：`Icon` 默认赋值后又总是被重�?2. `src/services/assetService.ts`
   - 问题�?     - `prefer-const`
     - `no-empty`
     - `no-useless-catch`
     - `@typescript-eslint/no-unused-vars`
     - `preserve-caught-error`
     - `no-useless-assignment`
   - 根因：存在无意义 catch、空 catch、冗余变量与未保�?cause 的异常重�?
---

## 4. 本轮修复原则

1. 不改 generated SDK
2. 不改 DB / migration / schema
3. 不处�?`notes` 业务
4. 不混入跨应用修复
5. 优先做“结构性消除问题”，而不是关闭规则或堆兼容代�?6. 每改一批先跑最小测试，再跑定向 lint，确保形成闭�?
---

## 5. 本轮实施方案

### 阶段 A：为本批行为调整建立最小回归测�?
输入�?
1. 现有 `sdkwork-magic-studio-assets` 既有测试入口
2. 已复现的 lint 根因

输出�?
1. `GenerationChatWindow` 增加 prompt 单一数据源回归测�?2. `UploadVideoGenerationModal` 增加 capability fallback 展示/导入回归测试
3. 如有必要，补�?`CreationChatInput / suggestion` 的最小行为测�?
### 阶段 B：收敛第一批组件错�?
输入�?
1. `AssetSidebar.tsx`
2. `CreationChatInput.tsx`
3. `suggestion.ts`
4. `StyleSelector.tsx`
5. `AttachmentGrid.tsx`
6. `MentionList.tsx`
7. `GenerationChatWindow.tsx`

输出�?
1. 去除 effect 内同�?setState
2. 去除 render �?ref 读取
3. 去除无意�?memo/赋�?4. 保留现有交互语义或在测试中明确新的统一语义

### 阶段 C：收敛导入弹窗和服务层错�?
输入�?
1. `UploadVideoGenerationModal.tsx`
2. `assetService.ts`

输出�?
1. 用派�?fallback 值替�?effect 内纠�?2. 清理�?catch、无�?catch、无用赋值和异常链问�?3. 保持现有导入和资源落盘行为不�?
### 阶段 D：验证与闭环

输出�?
1. `pnpm exec vitest run <定向测试>`
2. `pnpm exec eslint packages/sdkwork-magic-studio-assets/src --ext ts,tsx --quiet`
3. 根据剩余 error 数量决定是否继续清下一批，或把边界写入下一轮计�?
---

## 6. 本轮预期完成标准

1. `packages/sdkwork-magic-studio-assets/src` 的当�?`20` �?`error` 至少显著下降，并优先清零
2. 相关组件与服务行为有测试覆盖
3. `docs/review/` 有新鲜的阶段审查与闭环文�?4. 所有结论都基于本轮重新执行的命令，而不是历史假�?
---

## 7. 当前执行状�?
当前正在执行�?
1. 为首批修复点补测�?2. 逐个文件实施修复
3. 定向 lint 与测试回�?
