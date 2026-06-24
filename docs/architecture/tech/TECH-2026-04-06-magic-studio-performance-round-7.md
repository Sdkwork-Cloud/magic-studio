> Migrated from `docs/review/2026-04-06-magic-studio-performance-round-7.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Magic Studio V2 性能复盘与执行方�?Round 7

日期�?026-04-06  
范围：`apps/magic-studio-v2`  
排除范围：`packages/sdkwork-magic-studio-notes`

---

## 1. 当前阶段结论

Round 7 的目标不是继续拍 `manualChunks`，而是把图片能力最后一个“假 lazy、真静态暴露”的 public entry 漏洞补齐�?
Round 6 虽然已经把：

1. `AIImageGeneratorModal / ImageGeneratorModal` 收敛成轻 wrapper
2. `ImageStoreProvider / GenerateHistory / editor / asset persistence` 后移�?lazy content boundary
3. `ImageLeftGeneratorPanel` �?`ImageStoreProvider` 重新压回 `feature-image`

但构建阶段仍然出�?`INEFFECTIVE_DYNAMIC_IMPORT`，说�?lazy panel 仍然被别的同步入口提前抓住�?
Round 7 的核心动作是�?
1. 找到真正破坏 lazy 边界的同�?public entry
2. 先补失败测试锁死边界
3. 再把 public entry 改为转发 lazy wrapper，而不�?concrete panel

结果�?
1. `INEFFECTIVE_DYNAMIC_IMPORT` 警告消失
2. `feature-film-core` 继续下降
3. `feature-image` 继续承接真实图片运行时代�?4. `VideoPage / VideoChatPage -> feature-notes` 的残留链路仍存在，但按用户要求只记录、不�?notes

---

## 2. 问题列表

### P1. 图片 panel �?lazy import �?public entry 的静态导出抵�?
现象�?
1. `LazyImageLeftGeneratorPanel.tsx` 已经使用 `React.lazy`
2. 但构建仍提示 `INEFFECTIVE_DYNAMIC_IMPORT`
3. 说明 `ImageLeftGeneratorPanel` 同时被其他同步路径静态抓�?
根因�?
1. `packages/sdkwork-magic-studio-image/src/index.ts`
2. `packages/sdkwork-magic-studio-image/src/panels/index.ts`

这两�?public entry 仍然直接导出 concrete `ImageLeftGeneratorPanel`，导�?bundler �?public facade 上保留同步引用，抵消�?modal/content 内部的动态加载收益�?
---

## 3. 本轮设计与输入输�?
本轮没有新增业务接口，也没有改后端契约，仅调整前端模块暴露边界�?
### 3.1 `packages/sdkwork-magic-studio-image/src/index.ts`

输入�?
1. 原先直接导出 `ImageLeftGeneratorPanel`

输出�?
1. 改为导出 `LazyImageLeftGeneratorPanel as ImageLeftGeneratorPanel`

职责变化�?
1. 根入口不再同步暴�?concrete panel
2. 图片�?public facade 与实�?lazy 边界保持一�?
### 3.2 `packages/sdkwork-magic-studio-image/src/panels/index.ts`

输入�?
1. 原先直接导出 `../components/ImageLeftGeneratorPanel`

输出�?
1. 改为导出 `../components/LazyImageLeftGeneratorPanel`

职责变化�?
1. `panels` 子入口不再绕�?lazy wrapper
2. 保持 panel public entry 与实际运行时加载路径一�?
---

## 4. 实施清单

### 4.1 先写失败测试

新增�?
1. `tests/imagePanelPublicEntryBoundary.node.test.mjs`

约束�?
1. `src/index.ts` 不能再直接导�?concrete panel
2. `src/panels/index.ts` 不能再直接导�?concrete panel
3. 两个 public entry 都必须通过 `LazyImageLeftGeneratorPanel`

### 4.2 最小实�?
修改�?
1. `packages/sdkwork-magic-studio-image/src/index.ts`
2. `packages/sdkwork-magic-studio-image/src/panels/index.ts`

实现�?
1. 统一导出 `LazyImageLeftGeneratorPanel as ImageLeftGeneratorPanel`

---

## 5. 验证结果

### 5.1 定向边界测试

通过�?
1. `node --test tests/imagePanelPublicEntryBoundary.node.test.mjs`

### 5.2 受影响组件测�?
通过�?
1. `pnpm vitest run packages/sdkwork-magic-studio-image/src/components/AIImageGeneratorModal.test.tsx packages/sdkwork-magic-studio-image/src/components/ImageLeftGeneratorPanel.test.tsx`

### 5.3 全量 node 测试

通过�?
1. `pnpm run test:node`
2. 当轮结果：`Discovered 61 node-side test file(s).`
3. 当轮结果：`All 61 node-side test file(s) passed.`

### 5.4 构建

通过�?
1. `pnpm run build:test`

---

## 6. 产物级结�?
### 6.1 关键现象

Round 7 完成后：

1. `INEFFECTIVE_DYNAMIC_IMPORT` 警告消失
2. `feature-film-core` 从上一轮的 `335.45 KiB` 继续下降到约 `327.59 KiB`
3. `feature-image` 稳定承接图片面板�?store，约 `53.86 KiB`

### 6.2 关键产物证据

1. `dist/assets/ImageLeftGeneratorPanel-*.js`
   - 仅转�?`feature-image-*`
2. `dist/assets/panels-*.js`
   - 仅转�?`feature-image-*`

这说�?public entry 已不再反向抓�?concrete panel�?
---

## 7. 残留问题

### 7.1 视频页面仍落�?notes 相关 chunk

现象�?
1. `VideoPage / VideoChatPage` 仍由 `feature-notes-*` 转发

根因�?
1. `packages/sdkwork-magic-studio-notes/src/components/NoteEditor.tsx` 仍消�?`@sdkwork/magic-studio-video`

处理结论�?
1. 已定�?2. 按用户要求，本轮不改 `notes`

### 7.2 `feature-assets-center` 仍过�?
状态：

1. 仍是当前最大业�?chunk
2. 说明图片链路之外，资产中心侧仍有更深的同步依赖残�?
---

## 8. 下一步计�?
下一轮优先级�?
1. 继续分析 `feature-assets-center` 的真实来源，不再盲调 chunk 规则
2. 优先看高频消费包是否还在静态走 `@sdkwork/magic-studio-assets` 宽入�?3. 继续坚持�?   - 失败测试
   - 最小实�?   - 全量 node tests
   - build:test
   - dist 复核
   - review 文档回写

---

## 9. 本轮交付摘要

Round 7 的实际价值是把图片能力的 lazy 设计补成“真正闭环”：

1. modal/content �?lazy
2. public entry 也不再反向破�?lazy
3. 构建警告被实质消�?4. 产物归属继续�?`feature-image` 收敛

这轮不是表面清理，而是把图片能力在 public facade 层的最后一个同步泄漏点补平�?
