# Magic Studio V2 性能复盘与拆包执行方�?Round 1

日期�?026-04-06  
范围：`apps/magic-studio-v2`  
排除范围：`packages/sdkwork-magic-studio-notes`

---

## 1. 当前阶段结论

截至当前阶段，非 `notes` 范围已经完成�?
1. `pnpm exec eslint packages/sdkwork-magic-studio-magiccut --ext ts,tsx --quiet` 通过
2. `pnpm run build:test` 通过
3. 根级 `eslint` 仅剩 `notes` 范围�?`11 errors`

当前最明确且仍值得继续推进的问题已经从“编�?静态质量闭环”切换为“运行时性能与包体结构”�?
### 当前构建中的高价值性能问题

`dist/assets` 最新构建结果显示：

1. `feature-assets--X4tluym.js` �?`2,092,909 B`
2. `feature-magiccut-DlMoVw1B.js` �?`586,199 B`
3. `feature-film-CFeB47We.js` �?`474,295 B`

这说明当前应用虽然可以构建通过，但在以下方面仍有明显优化空间：

1. 首次进入相关业务页后的下载体积过�?2. 懒加载颗粒度被人为放�?3. 共享业务包和页面�?UI 未有效拆�?4. 后续缓存复用与跨页面增量加载收益不足

---

## 2. 问题列表

### 问题 P1：`vite.config.ts` 把多个业务包整包强制合并为单 chunk

当前 `resolveManualChunk(id)` 的行为是�?
1. `packages/sdkwork-magic-studio-assets` 全部进入 `feature-assets`
2. `packages/sdkwork-magic-studio-magiccut` 全部进入 `feature-magiccut`
3. `packages/sdkwork-magic-studio-film` 全部进入 `feature-film`

这会导致�?
1. 某个业务页即使只依赖该包中的一小部分模块，也会下载整组模块
2. 共享服务、页面组件、编辑器组件无法按边界分�?3. 手工 chunk 规则覆盖了默认更细粒度的拆包机会

### 问题 P2：`@sdkwork/magic-studio-assets` 同时承担“页�?UI + 通用生成 UI + 资产服务”三类职�?
从引用关系看，很多非资产中心页面都在使用 `@sdkwork/magic-studio-assets` 中的�?
1. `PromptTextInput`
2. `ChooseAsset`
3. `ChooseAssetModal`
4. `GenerationChatWindow`
5. `GenerationHistoryListPane`
6. `persistGenerationOutcomeAsset`
7. `fetchCreationCapabilities`

而当前又把整�?`sdkwork-magic-studio-assets` 包压成一�?chunk，结果是�?
1. 资产中心页面 UI 和共享生成组件被绑在一�?2. 仅使用能力查�?持久化服务的页面也会承担过大的下载成�?
### 问题 P3：性能问题已有明确根因，但尚未具备回归测试

当前仓库已有启动/构建策略�?node test，但还没有针�?chunk 路由规则的回归测试�?
这意味着�?
1. 后续任何人再次修�?`vite.config.ts` 都可能把大包问题重新引入
2. 现阶段需要先把拆包边界固化为可测试行�?
---

## 3. 根因分析

本轮已确认的根因链路如下�?
1. 路由层虽然使用了 `lazy(() => import(...))`
2. �?`vite.config.ts` �?`manualChunks` 又把整个包路径强制映射到固定�?chunk
3. `@sdkwork/magic-studio-assets` 还被多个模块作为共享能力入口广泛依赖
4. 最终导致“看起来是懒加载，实际上是多个业务场景共用一个超大共享块�?
这不是单个页面代码过大导致的单点问题，而是“导入边�?+ chunk 策略”共同造成的结构性问题�?
---

## 4. 本轮执行方案

### 方案目标

在不修改 `notes`、不引入架构回退、不过度重构业务模块的前提下，先完成一轮低风险高收益的拆包治理�?
### 本轮实施路径

1. 先为 chunk 解析规则补充 node test
2. �?`vite.config.ts` 中的 chunk 解析逻辑抽出为独立可测试模块
3. �?`feature-assets` 细分为至少：
   - 资产中心页面/UI
   - 共享生成组件
   - 资产服务�?asset-center 基础能力
4. �?`feature-film` 细分为至少：
   - 首页/编辑�?   - 大型弹窗与编辑组�?   - 共享 store/service
5. �?`feature-magiccut` 细分为至少：
   - 路由页与 store
   - 播放/渲染引擎
   - 资源面板与属性面�?6. 重新执行 `build:test`
7. 检查新�?`dist/assets` 体积分布
8. 将结果回写到 `docs/review/`

### 本轮不做的事

1. 不处�?`notes`
2. 不改 generated SDK
3. 不改 DB / migration / schema
4. 不为了拆包而重写大量业务导入路�?5. 不为了消�?warning 去改 `"type": "module"`

---

## 5. 本轮处理函数输入/输出定义

本轮不处理后�?API，本轮只处理前端构建与性能策略。以下为要改造的函数输入/输出定义�?
### 5.1 `normalizeModuleId(id: string): string`

输入�?
1. `id`: Vite/Rollup 传入的模块绝对路径或虚拟模块路径

输出�?
1. 统一分隔符后的标准化模块路径字符�?
用途：

1. �?chunk 匹配规则同时兼容 Windows �?Unix 路径

### 5.2 `resolveManualChunk(id: string): string | undefined`

输入�?
1. `id`: 当前待归�?chunk 的模块路�?
输出�?
1. 命中�?chunk 名称
2. 若不命中，返�?`undefined`

用途：

1. 控制业务包按职责拆分 chunk，而不是整包强制合�?
### 5.3 `resolveAssetsFeatureChunk(normalizedId: string): string | undefined`

输入�?
1. `normalizedId`: 已标准化的模块路�?
输出�?
1. `feature-assets-center`
2. `feature-assets-generation`
3. `feature-assets-services`
4. `undefined`

用途：

1. 区分资产中心页面 UI、共享生成组件、服务层

### 5.4 `resolveFilmFeatureChunk(normalizedId: string): string | undefined`

输入�?
1. `normalizedId`: 已标准化的模块路�?
输出�?
1. `feature-film-pages`
2. `feature-film-modals`
3. `feature-film-core`
4. `undefined`

用途：

1. �?Film 页面、弹窗、核�?store/service 解�?
### 5.5 `resolveMagicCutFeatureChunk(normalizedId: string): string | undefined`

输入�?
1. `normalizedId`: 已标准化的模块路�?
输出�?
1. `feature-magiccut-shell`
2. `feature-magiccut-engine`
3. `feature-magiccut-panels`
4. `undefined`

用途：

1. �?MagicCut 路由外壳、渲染引擎、资�?属性面板分�?
### 5.6 `ChooseAssetModal(props: ChooseAssetModalProps): JSX.Element | null`

输入�?
1. `props.isOpen`: 是否打开弹窗
2. `props.onClose`: 关闭回调
3. `props.onConfirm`: 确认选择后的资源回调
4. `props.accepts`: 允许的资源类�?5. `props.multiple`: 是否多�?6. `props.title`: 弹窗标题
7. `props.extractedImages`: 文档中可直接选取的图�?8. `props.initialTab`: 初始页签
9. `props.domain`: 业务�?
输出�?
1. 关闭时返�?`null`
2. 打开时返回一个轻量壳层弹�?3. 壳层内部通过 `React.lazy` 懒加载真正的重型资产中心内容

用途：

1. 保持对外 API 不变
2. �?`AssetSidebar / AssetGrid / AssetStoreProvider` 及其依赖延后到实际打开时再加载

### 5.7 `ChooseAssetModalContent(props: ChooseAssetModalContentProps): JSX.Element`

输入�?
1. `onClose / onConfirm / accepts / multiple / title / extractedImages / initialTab / domain`

输出�?
1. 返回�?`AssetStoreProvider` 的重型资产选择弹窗内容

用途：

1. 将资产中心内部依赖放到独立懒加载边界之后
2. 让普通页面在仅“引用弹窗组件”时不再立即静态引入该弹窗的全部实�?
---

## 6. 验证计划

本轮至少执行以下验证�?
1. 定向 node test：校验新�?chunk 归属规则
2. `pnpm run build:test`
3. 检�?`dist/assets` 最�?chunk 排名
4. 若构建成功，继续确认是否仍存在超过阈值的核心 chunk

---

## 7. 下一步计�?
### 本轮完成后立即执�?
1. �?`feature-assets` 明显下降，则继续处理 `routePreload` 的重预加载策�?2. �?`feature-film` / `feature-magiccut` 仍过大，则进一步查看是否需要组件级动态导�?3. 若拆包效果不足，则进入第二轮：导入边界治�?
### 第二轮候选方�?
1. �?`@sdkwork/magic-studio-assets` 的共享服务与共享 UI 入口进一步子路径�?2. �?Film 大型 Modal 改为交互触发时动态加�?3. �?MagicCut 导出/特效/渲染相关重模块改为延迟装�?
---

## 8. 本轮实施结果

### 已完成的代码改�?
1. 新增可测�?chunk 解析模块�?   - `scripts/vite-manual-chunks.mjs`
2. `vite.config.ts` 改为复用独立 chunk 解析模块
3. 新增拆包回归测试�?   - `tests/viteManualChunks.node.test.mjs`
4. �?`ChooseAssetModal` 拆为轻壳 + 懒加载重内容�?   - `packages/sdkwork-magic-studio-assets/src/components/ChooseAssetModal.tsx`
   - `packages/sdkwork-magic-studio-assets/src/components/ChooseAssetModalContent.tsx`
   - `packages/sdkwork-magic-studio-assets/src/components/ChooseAssetModal.types.ts`
5. 新增资产选择弹窗拆包回归测试�?   - `tests/assetChooserCodeSplit.node.test.mjs`

### 已验证的结果

1. `node --test tests/viteManualChunks.node.test.mjs` 通过
2. `node --test tests/assetChooserCodeSplit.node.test.mjs` 通过
3. `pnpm run test:node` 通过
   - `54 node-side test file(s) passed`
4. `pnpm run build:test` 通过
5. `pnpm exec eslint ...` 针对本轮修改文件通过
6. `pnpm exec eslint . --ext ts,tsx --quiet`
   - 仍然仅剩 `notes` 范围 `11 errors`

### 构建体积分布变化

本轮后，以下拆分已经落地并生效：

1. `feature-magiccut` 不再是单一大块，已分成�?   - `feature-magiccut-engine` �?`235.91 kB`
   - `feature-magiccut-shared` �?`236.23 kB`
   - `feature-magiccut-panels` �?`114.99 kB`
2. `feature-film` 不再是单一大块，已分成�?   - `feature-film-core` �?`455.68 kB`
   - `feature-film-pages` �?`18.87 kB`
3. `feature-assets` 仅部分改善：
   - 新增 `feature-assets-shared` �?`10.15 kB`
   - `feature-assets-center` 从约 `2,092,909 B` 降到�?`2,083,805 B`
   - 仍是当前唯一超过 warning 阈值的核心业务 chunk

---

## 9. 本轮新发现的根因

对构建产物进一步扫描后，`feature-assets-center` 内部仍然可以看到以下特征�?
1. `AppShell`
2. `SplitView`
3. `CommandPalette`
4. `AssetGrid`
5. `AssetSidebar`
6. `GenerationHistoryListPane`
7. `PromptTextInput`
8. `@tiptap` 相关运行时代�?
这说明当前更深层的根因不是单纯的 chunk 名称不合理，而是�?
1. `sdkwork-magic-studio-assets` 仍然同时承载资产中心 UI 与生成编辑器能力
2. `PromptTextInput / CreationChatInput` 这类 Tiptap 编辑器能力仍被打进了资产中心大块
3. `ChooseAssetModal` 的懒加载已经切开一层边界，但还没有�?`PromptTextInput` 这类编辑器重依赖从资产中心主块中彻底拆走

---

## 10. 下一轮执行建�?
### 优先�?P1

继续处理 `sdkwork-magic-studio-assets` 的更深层导入边界问题�?
1. �?`PromptTextInput / CreationChatInput / GenerationHistoryListPane` 进一步从资产中心主块中拆�?2. 优先检查这些组件是否可按“触发时加载”或“独立入口文件”方式继续拆�?3. 若需要，增加 `sdkwork-magic-studio-assets` 的子路径导出或内�?lazy wrapper

### 优先�?P2

�?`routePreload` 做第二轮性能收敛�?
1. 结合当前 chunk 权重，为超重业务包建立更严格的预加载预算
2. 减少在相邻页面切换时对重块的激进预拉取

### 优先�?P3

在不�?`notes` 的前提下继续做可运维性文档闭环：

1. 记录 `feature-assets-center` 的进一步拆分设�?2. 记录是否需要把 `sdkwork-magic-studio-assets` 划分�?`asset-center` �?`asset-generation-ui` 两类明确入口
