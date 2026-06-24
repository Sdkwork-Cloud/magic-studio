> Migrated from `docs/review/2026-04-06-magic-studio-performance-round-6.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Magic Studio V2 性能复盘与执行方�?Round 6

日期�?026-04-06  
范围：`apps/magic-studio-v2`  
排除范围：`packages/sdkwork-magic-studio-notes` 业务改�?
---

## 1. 当前阶段结论

本轮继续沿用 Round 4 / Round 5 的主策略�?
1. 不靠继续硬调 `manualChunks` 解决问题�?2. 先清理真实的静态依赖边界，再观察产物归属�?3. 每一轮都坚持 `失败测试 -> 最小实�?-> 回归验证 -> build 复核 -> 文档回写`�?
本轮完成了两个连续收敛动作：

1. �?`AIImageGeneratorModal / ImageGeneratorModal -> ImageLeftGeneratorPanel` 的同步依赖链改成 lazy panel boundary�?2. 继续把两个图�?modal 本身收敛成“轻�?+ lazy content”的结构，把 `ImageStoreProvider / GenerateHistory / GenerationHistoryListPane / editor / asset persistence` 等重内容移到 content boundary 后面�?
结果是：

1. `ImageLeftGeneratorPanel` 不再�?`feature-film-core` 转发�?2. `ImageStoreProvider` 也已经回�?`feature-image`�?3. `feature-film-core` 进一步下降�?4. `VideoPage / VideoChatPage` 仍然落在 `feature-notes`，该问题已复核，继续记为 notes 排除项残留�?
---

## 2. 问题列表

### P1. 图片面板�?film-core 吞并

现象�?
1. 旧产物中 `dist/assets/panels-Cnk4LY_a.js` 通过 `feature-film-core` 导出 `ImageLeftGeneratorPanel`�?2. 说明图片左侧生成面板没有稳定落到图片特性块�?
根因�?
1. `AIImageGeneratorModal.tsx`
2. `ImageGeneratorModal.tsx`

这两�?modal 之前都直接静态导�?`ImageLeftGeneratorPanel`，�?film / character / magiccut 等包又静态消费这�?modal，于�?panel 沿同步链�?film 方向吸入�?
### P1. 图片 modal 的重内容仍然挂在 wrapper �?
第一步修�?panel 后，继续发现�?
1. `ImageStoreProvider` 入口仍从 `feature-film-core` 转发�?2. `AIImageGeneratorModal.tsx` �?`ImageGeneratorModal.tsx` 本身仍直接承载：
   - store
   - generation history
   - editors
   - asset persistence
   - panel wrapper

根因�?
1. modal 壳子�?modal 工作区内容没有分层�?2. film 侧静态依赖图�?modal 时，rolldown 仍会把这批重内容合并�?`feature-film-core`�?
### P2. 视频页面仍落�?notes 相关 chunk

现象�?
1. 最新产物中 `dist/assets/pages-DybYE1uJ.js` 仍然�?   - `import { a as e, i as t } from "./feature-notes-*.js"`
   - `export { t as VideoChatPage, e as VideoPage }`

根因�?
1. `packages/sdkwork-magic-studio-notes/src/components/NoteEditor.tsx` 仍从 `@sdkwork/magic-studio-video` 根入口获�?`VideoGeneratorModal`�?2. 用户已明�?`notes` 不在当前处理范围内，因此本轮不改�?
---

## 3. 本轮设计与输入输出边�?
本轮没有新增业务 API，也没有改后端契约，只调整前端模块边界�?
### 3.1 `LazyImageLeftGeneratorPanel`

文件：`packages/sdkwork-magic-studio-image/src/components/LazyImageLeftGeneratorPanel.tsx`

输入�?
1. `initialPrompt?: string`
2. `onClose?: () => void`

输出�?
1. 使用 `React.lazy` 异步加载 `ImageLeftGeneratorPanel`
2. 在加载期间输出轻�?fallback UI

职责�?
1. 只负�?panel 的异步边�?2. 不再承载图片生成工作区逻辑

### 3.2 `AIImageGeneratorModal`

文件：`packages/sdkwork-magic-studio-image/src/components/AIImageGeneratorModal.tsx`

输入�?
1. `contextText?: string`
2. `config?: Partial<GenerationConfig>`
3. `onClose: () => void`
4. `onSuccess: (result: GenerationResultSelection | GenerationResultSelection[]) => void`
5. `multiSelect?: boolean`

输出�?
1. 输出 portal modal 壳子
2. 负责提示词预分析�?loading �?3. 通过 lazy boundary 加载 `AIImageGeneratorModalContent`

职责�?
1. 保留轻量壳层
2. 不再直接持有 store / history / editor / panel 依赖

### 3.3 `AIImageGeneratorModalContent`

文件：`packages/sdkwork-magic-studio-image/src/components/AIImageGeneratorModalContent.tsx`

输入�?
1. `AIImageGeneratorModalProps`
2. `initialPrompt: string`

输出�?
1. 输出完整图片生成工作�?2. 内部包裹 `ImageStoreProvider`
3. 输出�?   - 左侧生成面板
   - 右侧历史列表
   - 多选确认动�?
职责�?
1. 承载图片 modal 的重内容
2. 隔离 `ImageStoreProvider / GenerateHistory / editors / persistGeneratedSelectionAsset`

### 3.4 `ImageGeneratorModal`

文件：`packages/sdkwork-magic-studio-image/src/components/ImageGeneratorModal.tsx`

输入�?
1. `onClose: () => void`
2. `onSuccess: (selection: GenerationResultSelection) => void`
3. `actionLabel?: string`

输出�?
1. 输出 portal modal 壳子
2. 通过 lazy boundary 加载 `ImageGeneratorModalContent`

职责�?
1. 只保留外�?modal 容器�?fallback
2. 不再直接持有 store / generation pane / panel

### 3.5 `ImageGeneratorModalContent`

文件：`packages/sdkwork-magic-studio-image/src/components/ImageGeneratorModalContent.tsx`

输入�?
1. `ImageGeneratorModalProps`

输出�?
1. 输出完整图片选择工作�?2. 内部包裹 `ImageStoreProvider`
3. 输出�?   - 左侧生成面板
   - 右侧 `GenerationHistoryListPane`
   - 顶部确认按钮

职责�?
1. 承载选择型图�?modal 的重内容
2. 隔离 `ImageStoreProvider / GenerationHistoryListPane / panel`

---

## 4. 实施清单

### 4.1 先写失败测试

新增�?
1. `tests/imageModalPanelLazyBoundary.node.test.mjs`
2. `tests/imageModalContentLazyBoundary.node.test.mjs`

这两组测试先失败，分别约束：

1. modal wrapper 不得再直接静态导�?`ImageLeftGeneratorPanel`
2. modal wrapper 必须 lazy-load content boundary
3. content 文件必须接管重依�?
### 4.2 第一阶段修复

新增�?
1. `packages/sdkwork-magic-studio-image/src/components/LazyImageLeftGeneratorPanel.tsx`

修改�?
1. `packages/sdkwork-magic-studio-image/src/components/AIImageGeneratorModal.tsx`
2. `packages/sdkwork-magic-studio-image/src/components/ImageGeneratorModal.tsx`

效果�?
1. panel �?modal 的同步依赖链中拆�?
### 4.3 第二阶段修复

新增�?
1. `packages/sdkwork-magic-studio-image/src/components/imageModal.types.ts`
2. `packages/sdkwork-magic-studio-image/src/components/AIImageGeneratorModalContent.tsx`
3. `packages/sdkwork-magic-studio-image/src/components/ImageGeneratorModalContent.tsx`

修改�?
1. `packages/sdkwork-magic-studio-image/src/components/AIImageGeneratorModal.tsx`
2. `packages/sdkwork-magic-studio-image/src/components/ImageGeneratorModal.tsx`
3. `packages/sdkwork-magic-studio-image/src/components/AIImageGeneratorModal.test.tsx`
4. `tests/assetsFeatureSubpathBoundary.node.test.mjs`

效果�?
1. modal 壳子只保留轻逻辑
2. 工作区重内容移到 lazy content 文件
3. 既修�?runtime chunk 问题，也同步修正边界测试

---

## 5. 验证结果

### 5.1 定向源码边界测试

通过�?
1. `node --test tests/imageModalPanelLazyBoundary.node.test.mjs`
2. `node --test tests/imageModalContentLazyBoundary.node.test.mjs`

### 5.2 受影响组件测�?
通过�?
1. `pnpm vitest run packages/sdkwork-magic-studio-image/src/components/AIImageGeneratorModal.test.tsx packages/sdkwork-magic-studio-image/src/components/ImageLeftGeneratorPanel.test.tsx`

### 5.3 全量 node 测试

通过�?
1. `pnpm run test:node`
2. 最新结果：`Discovered 60 node-side test file(s).`
3. 最新结果：`All 60 node-side test file(s) passed.`

### 5.4 构建

通过�?
1. `pnpm run build:test`

---

## 6. 产物级结�?
### 6.1 关键 chunk 变化

本轮开始前�?
1. `feature-film-core` �?`375.63 kB`
2. `feature-image` 在上一轮基线中�?`4.86 kB`
3. `ImageLeftGeneratorPanel` �?`feature-film-core` 转发
4. `ImageStoreProvider` �?`feature-film-core` 转发

本轮第一次修复后�?
1. `feature-film-core` `367.69 kB`
2. `feature-image` `22.17 kB`
3. `ImageLeftGeneratorPanel` 已从 `feature-image` 转发

本轮第二次修复后�?
1. `feature-film-core` `335.45 kB`
2. `feature-image` `55.14 kB`

结论�?
1. 图片 modal 工作区和 store 已进一步压实到图片特性块
2. `feature-film-core` 相比本轮开始前下降�?`40.18 kB`

### 6.2 关键产物证据

已修复：

1. `dist/assets/panels-DxG3Q5Id.js`
   - `import { a as e } from "./feature-image-*.js"`
   - `export { e as ImageLeftGeneratorPanel }`
2. `dist/assets/store-CIvF9jf-.js`
   - `import { c as e, d as t, l as n, u as r } from "./feature-image-*.js"`
   - `export { e as ImageStoreProvider, ... }`

新增的明�?lazy content 边界�?
1. `dist/assets/AIImageGeneratorModalContent-Bnoghqsj.js`
2. `dist/assets/ImageGeneratorModalContent-NQXgWc4U.js`

仍未处理�?
1. `dist/assets/pages-DybYE1uJ.js`
   - 仍通过 `feature-notes-*` 导出 `VideoPage / VideoChatPage`

---

## 7. 残留风险

### 7.1 Video 仍受 notes 排除项影�?
当前状态：

1. `VideoPage / VideoChatPage` 仍落�?`feature-notes`

处理结论�?
1. 已确认根因仍�?`notes` 方向
2. 按用户要求，本轮不改 `packages/sdkwork-magic-studio-notes`

### 7.2 `INEFFECTIVE_DYNAMIC_IMPORT` 警告

构建警告说明�?
1. `ImageLeftGeneratorPanel.tsx` �?`LazyImageLeftGeneratorPanel.tsx` 动态导�?2. 但同时也�?`packages/sdkwork-magic-studio-image/src/index.ts`
3. 以及 `packages/sdkwork-magic-studio-image/src/panels/index.ts`
4. 静态导�?
结论�?
1. 这说�?panel 仍作为图片包 public entry 暴露
2. 当前这不是功能错�?3. 本轮不继续改，是因为 generation route 本身就需要同步拿�?panel，继续把 public panel 入口改成 wrapper 会引入额�?waterfall，收益需要后续测量后再决�?
---

## 8. 下一步计�?
建议按以下优先级继续�?
1. 继续�?`VideoPage / VideoChatPage -> feature-notes` 的真实残留链，但只做证据归档，不进入 notes 业务改造�?2. 评估是否要继续把 `@sdkwork/magic-studio-image` 根入口里�?`ImageLeftGeneratorPanel` 曝露方式改成 wrapper 导出，前提是先测量是否会伤害图片页首屏�?3. 复核 `feature-assets-center` �?`feature-assets-generation` 的职责边界，继续挑出能安全后移的同步依赖�?4. 每轮继续保持�?   - 失败测试
   - 最小实�?   - 全量 node tests
   - build:test
   - dist 复核
   - review 文档回写

---

## 9. 本轮交付摘要

本轮已经形成完整闭环�?
1. 找到图片 modal 同步链导致的 chunk 污染根因
2. 写失败测试锁边界
3. 先拆 panel lazy boundary
4. 再拆 modal content lazy boundary
5. 修正受影响单测与边界测试
6. 跑通全�?node tests �?build
7. 用产物证据确�?`ImageLeftGeneratorPanel` �?`ImageStoreProvider` 都已经回�?`feature-image`

这是当前阶段对图片能力边界最有效、同时风险可控的一轮收敛�?
