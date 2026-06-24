> Migrated from `docs/review/2026-04-06-magic-studio-lint-stage-round-3.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Magic Studio V2 Lint 阶段复盘 Round 3

日期�?026-04-06  
范围：`apps/magic-studio-v2`

---

## 1. 当前阶段结论

本轮继续围绕 `magic-studio-v2` 的前�?lint/稳定性闭环推进，核心目标仍然是把�?`notes` 范围收敛到可持续迭代状态，而不是扩展新的后端接口工作�?
当前最新基线：

```bash
pnpm exec eslint packages/sdkwork-magic-studio-magiccut --ext ts,tsx --quiet
```

结果：通过

```bash
pnpm exec eslint . --ext ts,tsx --quiet
```

结果：根级仅�?`11 errors`

```bash
pnpm run build:test
```

结果：通过

阶段结论�?
1. `packages/sdkwork-magic-studio-magiccut` 已从本轮起点 `53 errors` 收敛�?`0 errors`
2. 根级已从上一阶段�?`117 errors` 收敛�?`11 errors`
3. 当前剩余 `11 errors` 全部位于 `packages/sdkwork-magic-studio-notes`
4. 因用户明确要求，本阶段仍不处�?`notes`，因此“非 notes 范围 lint 清零 + 构建通过”已经完�?5. `MODULE_TYPELESS_PACKAGE_JSON` 仍然只是 warning，不作为修改 `package.json` 的理�?
阶段趋势�?
1. 历史基线：`269 errors`
2. 第一轮完成后：`195 errors`
3. 收敛 `core/types/user/compression` 后：`163 errors`
4. 收敛 `drive/editor/app-shell/video/vip/workspace` 后：`131 errors`
5. 收敛 `film/portal-video` 后：`117 errors`
6. 收敛 `magiccut` 第一批低风险问题后：`magiccut 53 -> 24`
7. 收敛 `magiccut` 第二�?hooks/player/node/renderer 问题后：`magiccut 24 -> 0`
8. 根级最新：`11 errors`，全部属�?`notes`
9. `build:test` 已通过，非 `notes` 范围编译链闭环完�?
---

## 2. 本轮完成范围

### 已完成修复的�?
1. `packages/sdkwork-magic-studio-magiccut`

### 本轮已处理的方法输入/输出定义

1. `BaseModal(props: BaseModalProps) => ReactPortal | null`
输入：`isOpen/onClose/title/icon/showCloseButton/size/className/children`  
输出：模态框 portal �?`null`  
改造：移除 `domReady` 状态，改为 `typeof document !== 'undefined'` 派生判断�?
2. `ToastProvider({ children }) => JSX.Element`
输入：`children`  
输出：`ToastContext.Provider`  
改造：移除 `domReady` 状态，只在可用 DOM 时渲�?portal�?
3. `ContextMenuProvider({ children }) => JSX.Element`
输入：`children`  
输出：`ContextMenuContext.Provider`  
改造：移除 effect 中同�?`setDomReady(true)`，直接使�?DOM 可用性派生值�?
4. `resolveNextFavoriteState(current) => boolean`
输入：`boolean | null | undefined`  
输出：下一次收藏状�? 
改造：去掉冗余布尔包装，不改变收藏切换语义�?
5. `TimelineEditService.getTrimStartDelta(clip, desiredDelta, _state) => number`
输入：`CutClip/number/NormalizedState`  
输出：裁剪后的安�?delta  
改造：仅修正未使用参数命名，不改算法�?
6. `DesktopExportStrategy.save(blob, filename, destinationPath?) => Promise<void>`
输入：导出二进制、文件名、可选目�? 
输出：保存完�?Promise  
改造：保留原保存链路，补充异常 `cause`�?
7. `ResourceDropStrategy.calculate(input, context) => PlacementResult`
输入：拖拽输入、时间线上下�? 
输出：轨道落点、时间、吸附线、冲突状�? 
改造：消除冗余中间赋值，保持落点算法语义不变�?
8. `ClipMoveStrategy.calculate(input, context) => PlacementResult`
输入：拖拽输入、时间线上下�? 
输出：移动落点结�? 
改造：移除无意义可变变量，保留碰撞与吸附逻辑�?
9. `UniversalPlayer.renderFrame(time, forcePlayingState?, previewTimeOverride?) => void`
输入：时间、可选播放态覆盖、可选预览时�? 
输出：直接驱�?WebGL 播放器渲�? 
改造：把“渲染循环使用的最新值”同步到 effect 中，避免 render 期读�?ref�?
10. `useSnapPoints({ pixelsPerSecond, isSnappingEnabled }) => { calculateSnap, prepareSnapPoints }`
输入：像素密度、是否开启吸�? 
输出：吸附计算器与索引准备函�? 
改造：�?`stateRef.current = state` �?render 移到 effect�?
11. `useClipDrag(options) => { startDrag }`
输入：拖拽上下文、轨道数据、自动滚�?ref、吸附能�? 
输出：开始拖拽方�? 
改造：修复 ref 命名、拖拽加速索引构建位置和 callback 依赖不稳定问题�?
12. `useSearchFilter(options) => { filteredData, query, setQuery, isSearching }`
输入：`data/searchKeys/filterFn/debounceMs`  
输出：过滤结果、查询值、查询更新器、搜索中状�? 
改造：�?`isSearching` 改为 `query !== debouncedQuery` 的派生状态，移除 effect 中同�?`setIsSearching(true)`�?
13. `useAnnounce() => announce(message, priority?)`
输入：消息文本、播报优先级  
输出：无，执行可访问性播�? 
改造：�?ref 管理 announcer DOM 节点，避免把 DOM 放进 state 后直接修改�?
14. `useDrag(options) => { state, startDrag, cancelDrag }`
输入：拖拽起止回调、阈�? 
输出：拖拽状态与控制函数  
改造：修复事件处理器声明顺序和 `mouseup` 解绑模式�?
15. `useRafCallback(callback) => throttledCallback`
输入：回调函�? 
输出：RAF 节流后的回调函数  
改造：�?`callbackRef.current = callback` �?render 挪到 effect�?
16. `VideoNode(props: VideoNodeProps) => JSX.Element`
输入：`src/isSelected/isGenerating/onUpload`  
输出：视频节点播放器界面  
改造：增加 `currentTime` 状态同步，消除 render 期读�?`videoRef.current.currentTime`�?
17. `ClipFilmstrip` 中的 `FilmstripFrame(props) => JSX.Element`
输入：`resourceId/resourceUrl/time/width/height`  
输出：单帧缩略图  
改造：使用 `loadedFrameKey` 派生显隐，去�?effect 中同�?`setIsVisible(false)`�?
---

## 3. 本轮核心实现

### 第一批：低风险静态问题收�?
已修文件�?
1. `packages/sdkwork-magic-studio-magiccut/src/components/common/Modal.tsx`
2. `packages/sdkwork-magic-studio-magiccut/src/components/common/Toast.tsx`
3. `packages/sdkwork-magic-studio-magiccut/src/components/common/Tooltip.tsx`
4. `packages/sdkwork-magic-studio-magiccut/src/components/common/Resizer.tsx`
5. `packages/sdkwork-magic-studio-magiccut/src/domain/assets/favoriteToggle.ts`
6. `packages/sdkwork-magic-studio-magiccut/src/services/AssetCacheService.ts`
7. `packages/sdkwork-magic-studio-magiccut/src/services/TimelineEditService.ts`
8. `packages/sdkwork-magic-studio-magiccut/src/services/export/encoders/BrowserMediaEncoder.ts`
9. `packages/sdkwork-magic-studio-magiccut/src/services/export/strategies/DesktopExportStrategy.ts`
10. `packages/sdkwork-magic-studio-magiccut/src/services/templateService.ts`
11. `packages/sdkwork-magic-studio-magiccut/src/engine/renderer/ClipRenderStrategies.ts`
12. `packages/sdkwork-magic-studio-magiccut/src/engine/renderer/ResourceManager.ts`
13. `packages/sdkwork-magic-studio-magiccut/src/engine/renderer/TimelineRenderer.ts`
14. `packages/sdkwork-magic-studio-magiccut/src/components/Timeline/dnd/strategies/ClipMoveStrategy.ts`
15. `packages/sdkwork-magic-studio-magiccut/src/components/Timeline/dnd/strategies/ResourceDropStrategy.ts`
16. `packages/sdkwork-magic-studio-magiccut/src/components/Timeline/dnd/visuals/GhostFactory.ts`
17. `packages/sdkwork-magic-studio-magiccut/src/engine/AudioEngine.ts`

本批次结果：

1. `magiccut` lint：`53 -> 24`
2. 定向测试继续通过

### 第二批：hooks / player / node / overlay 收敛

已修文件�?
1. `packages/sdkwork-magic-studio-magiccut/src/components/Player/UniversalPlayer.tsx`
2. `packages/sdkwork-magic-studio-magiccut/src/components/Timeline/canvas/DragOverlay.tsx`
3. `packages/sdkwork-magic-studio-magiccut/src/components/Timeline/canvas/hooks/useClipDrag.ts`
4. `packages/sdkwork-magic-studio-magiccut/src/components/Timeline/canvas/hooks/useSnapPoints.ts`
5. `packages/sdkwork-magic-studio-magiccut/src/components/Timeline/visuals/ClipFilmstrip.tsx`
6. `packages/sdkwork-magic-studio-magiccut/src/components/common/ContextMenu.tsx`
7. `packages/sdkwork-magic-studio-magiccut/src/components/nodes/VideoNode.tsx`
8. `packages/sdkwork-magic-studio-magiccut/src/hooks/useAccessibility.tsx`
9. `packages/sdkwork-magic-studio-magiccut/src/hooks/useDataOperations.ts`
10. `packages/sdkwork-magic-studio-magiccut/src/hooks/useDragDrop.ts`
11. `packages/sdkwork-magic-studio-magiccut/src/hooks/usePerformance.ts`

本批次结果：

1. `magiccut` lint：`24 -> 0`
2. 根级最新收敛到 `11`
3. 剩余问题全部集中�?`notes`

### 第三批：TypeScript 构建错误收敛

已修文件�?
1. `packages/sdkwork-magic-studio-compression/src/compressionService.ts`
2. `packages/sdkwork-magic-studio-film/src/pages/FilmHomePage.tsx`
3. `packages/sdkwork-magic-studio-generation-history/src/components/GenerationPreview.tsx`
4. `packages/sdkwork-magic-studio-image/src/components/AIImageGeneratorModal.tsx`
5. `packages/sdkwork-magic-studio-magiccut/src/components/Player/TransformOverlay.tsx`
6. `packages/sdkwork-magic-studio-magiccut/src/components/Properties/panels/AudioSettingsPanel.tsx`
7. `packages/sdkwork-magic-studio-magiccut/src/components/Resources/MagicCutResourcePanel.tsx`
8. `src/layouts/MainLayout/MainSidebar.tsx`

本批次结果：

1. `build:test` 通过
2. �?`notes` 范围 lint 与构建双闭环完成

---

## 4. 验证结果

已执行并通过�?
```bash
pnpm exec eslint packages/sdkwork-magic-studio-magiccut --ext ts,tsx --quiet
```

结果：通过

```bash
pnpm exec vitest run packages/sdkwork-magic-studio-magiccut/tests/favoriteToggle.test.ts packages/sdkwork-magic-studio-magiccut/tests/templateServiceIdentity.test.ts packages/sdkwork-magic-studio-magiccut/tests/magicCutStoreIdentity.test.tsx
```

结果：`3 files, 15 tests passed`

```bash
pnpm exec eslint . --ext ts,tsx --quiet
```

结果：根级剩�?`11 errors`

```bash
pnpm run build:test
```

结果：通过

剩余根级问题分布�?
1. `packages/sdkwork-magic-studio-notes/src/components/AIPromptModal.tsx`
2. `packages/sdkwork-magic-studio-notes/src/components/HtmlSourceModal.tsx`
3. `packages/sdkwork-magic-studio-notes/src/components/NoteEditor.tsx`
4. `packages/sdkwork-magic-studio-notes/src/components/NoteSidebar.tsx`
5. `packages/sdkwork-magic-studio-notes/src/components/PublishModal.tsx`
6. `packages/sdkwork-magic-studio-notes/src/components/menus/AIWriterFloat.tsx`
7. `packages/sdkwork-magic-studio-notes/src/components/menus/BlockFloatingMenu.tsx`
8. `packages/sdkwork-magic-studio-notes/src/components/menus/TextBubbleMenu.tsx`
9. `packages/sdkwork-magic-studio-notes/src/entities/publishing.entity.ts`
10. `packages/sdkwork-magic-studio-notes/tests/noteStoreIdentity.test.tsx`

说明�?
1. 本阶段剩�?`11 errors` 全部位于用户明确排除�?`notes`
2. �?`notes` 范围已闭环完�?
---

## 5. 当前问题列表

### 已闭环的问题

1. `magiccut` 中大�?`react-hooks/set-state-in-effect`
2. `magiccut` �?render 期读�?ref
3. `magiccut` �?`preserve-manual-memoization`
4. `magiccut` �?`no-useless-assignment`
5. `magiccut` �?`preserve-caught-error`
6. `magiccut` 中未使用参数/变量

### 待后续阶段处理的问题

1. `notes` 包剩�?`11 errors`

---

## 6. 设计与修复原�?
1. 不修�?generated SDK
2. 不修�?DB / migration / schema
3. 不处�?`notes` 业务
4. 不通过关闭 lint 规则、增加兼容层或回退架构来“压 lint�?5. �?React hooks 问题优先采用派生状态、effect 同步 ref、稳定事件入口等方式修复
6. 对纯函数和行为保持点优先复用已有测试进行回归验证
7. 上传链路继续保持 S3 预签�?URL 模式，不引入旁路直传接口

---

## 7. 下一步计�?
### 计划 A：冻结当前阶段成�?
输入�?
1. 本轮 `magiccut` 清零结果
2. 根级只剩 `notes` 的事�?
输出�?
1. 当前阶段可交付的“非 notes 范围 lint 清零”里程碑
2. 后续独立处理 `notes` 的明确边�?
### 计划 B：等 `notes` 业务重新纳入范围后再开启新阶段

输入�?
1. 用户重新开�?`notes` 范围
2. 当前 `11 errors` 清单

输出�?
1. `notes` 定向修复计划
2. 根级最终清零方�?
