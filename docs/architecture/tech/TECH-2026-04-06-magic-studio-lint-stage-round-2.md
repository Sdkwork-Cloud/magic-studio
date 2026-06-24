> Migrated from `docs/review/2026-04-06-magic-studio-lint-stage-round-2.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Magic Studio V2 Lint 阶段复盘 Round 2

日期�?026-04-06  
范围：`apps/magic-studio-v2`

---

## 1. 当前阶段结论

本轮继续围绕 `magic-studio-v2` 的前�?lint/稳定性闭环推进，目标不是新增后端 API，而是把现有应用按模块逐步收敛到可持续迭代的状态�?
最新根级命令：

```bash
pnpm exec eslint . --ext ts,tsx --quiet
```

最新结果：

1. 根级剩余 `117 errors`
2. `MODULE_TYPELESS_PACKAGE_JSON` 仍然只是 warning，不作为本轮修改 `package.json` 的理�?3. `notes` 业务按用户要求暂不处理，因此后续闭环以“非 notes 范围持续清零”为优先目标

阶段趋势�?
1. 历史基线：`269 errors`
2. 第一轮完成后：`195 errors`
3. 收敛 `core/types/user/compression` 后：`163 errors`
4. 收敛 `drive/editor/app-shell/video/vip/workspace` 后：`131 errors`
5. 收敛 `film/portal-video` 后：`117 errors`

---

## 2. 本轮新增完成范围

### 已完成修复的�?
1. `packages/sdkwork-magic-studio-film`
2. `packages/sdkwork-magic-studio-portal-video`

### 已落地的方法输入/输出定义

1. `resolvePreferredModelId`
输入：`providers: { models: { id: string }[] }[]`，`requestedId: string`  
输出：`string`  
用途：当当前模型失效时，自动回退到首个有效模型；无模型时返回空串�?
2. `resolvePreferredSelectionId`
输入：`options: { id: string }[]`，`requestedId: string`，`fallbackId?: string`  
输出：`string`  
用途：在样式等 `id` 型选项中保留当前选择，否则回退到首项或兜底值�?
3. `resolvePreferredSelectionValue`
输入：`options: { value: string }[]`，`requestedValue: string`，`fallbackValue: string`  
输出：`string`  
用途：在分辨率、时长、比例等 `value` 型选项中保留当前选择，否则回退到首项或兜底值�?
4. `resolvePortalGenMode`
输入：`activeTab: PortalTab`，`requestedMode: string`，`attachments: { type: string }[]`  
输出：`string`  
用途：�?`portal-video` 中根�?tab 和附件类型派生最终生成模式；`video` 且带图片/视频附件时强�?`start_end`�?
### 本轮核心实现

1. `packages/sdkwork-magic-studio-core/src/utils/selectionFallback.ts`
新增通用派生函数，统一处理模型、样式、时长、分辨率、比例等“当前选择失效后回退”的逻辑�?
2. `packages/sdkwork-magic-studio-film/src/pages/FilmHomePage.tsx`
�?`activeModel/activeStyle/duration/resolution/aspectRatio` 的同�?`useEffect` 改为 `effective*` 派生值，避免 effect 中同�?`setState`�?
3. `packages/sdkwork-magic-studio-film/src/components/FilmPreviewPanel.tsx`
�?`useRef(Date.now())` 改为 `useRef(0)`，并在播�?effect 中初始化时间戳，消除 render 期间�?impurity�?
4. `packages/sdkwork-magic-studio-film/tests/filmStoreProjectGraph.test.tsx`
清理未使用参数，保持测试文件 lint 通过�?
5. `packages/sdkwork-magic-studio-portal-video/src/pages/PortalPage.tsx`
移除“能力变化后通过 effect 回填默认模型/样式/时长/分辨�?比例/生成模式”的模式，统一改成派生值�?
6. `packages/sdkwork-magic-studio-portal-video/src/utils/portalGenerationSelection.ts`
新增 `portal-video` 生成模式派生函数，避免在 effect 中同步重�?`genMode`�?
---

## 3. 本轮验证结果

已执行并通过�?
```bash
pnpm exec vitest run packages/sdkwork-magic-studio-core/src/utils/__tests__/selectionFallback.test.ts packages/sdkwork-magic-studio-portal-video/src/utils/portalGenerationSelection.test.ts
```

结果：`2 files, 13 tests passed`

```bash
pnpm exec vitest run packages/sdkwork-magic-studio-film/tests/filmStoreProjectGraph.test.tsx
```

结果：`1 file, 3 tests passed`

```bash
pnpm exec eslint packages/sdkwork-magic-studio-film packages/sdkwork-magic-studio-portal-video --ext ts,tsx --quiet
```

结果：通过

```bash
pnpm exec eslint . --ext ts,tsx --quiet
```

结果：根级剩�?`117 errors`

---

## 4. 当前剩余问题聚类

### P1 低风险收敛包

1. `packages/sdkwork-magic-studio-generation-history`
问题集中在：
`no-useless-assignment`
`react-hooks/set-state-in-effect`

2. `packages/sdkwork-magic-studio-i18n`
问题集中在：
空接口定�?
3. `packages/sdkwork-magic-studio-ide-config`
问题集中在：
未使用的 `catch` 参数

4. `packages/sdkwork-magic-studio-image`
问题集中在：
根据 props 变化�?effect 中同步重置状�?
5. `packages/sdkwork-magic-studio-music`
问题集中在：
render 期间 `Math.random()`
未使用导�?参数

6. `packages/sdkwork-magic-studio-plugins`
问题集中在：
`preserve-manual-memoization`
空接�?
### P2 大包收敛

1. `packages/sdkwork-magic-studio-magiccut`
当前仍是最大问题簇，涉及：
`react-hooks/set-state-in-effect`
`react-hooks/refs`
`react-hooks/immutability`
`preserve-caught-error`
`no-useless-assignment`
未使用变�?
### 排除范围

1. `packages/sdkwork-magic-studio-notes`
按用户要求，本轮及后续当前阶段暂不处理�?
---

## 5. 下一步执行方�?
### 阶段 D：继续清理低风险�?
输入�?
1. 当前根级 lint 输出
2. `generation-history / i18n / ide-config / image / music / plugins` 的定�?lint 结果

输出�?
1. 继续下降的根级错误数
2. 更聚焦的 `magiccut` 收敛清单

验证�?
1. 定向 `vitest`
2. 包级 lint
3. 根级 lint

### 阶段 E：集中处�?`magiccut`

输入�?
1. 低风险包收敛后的新基�?2. `magiccut` 定向 lint 输出

输出�?
1. `magiccut` 按子模块拆分的问题清�?2. 每批修复后的验证记录

---

## 6. 设计原则

1. 不修�?generated SDK
2. 不修�?DB / migration / schema
3. 不处�?`notes` 业务
4. 不通过关闭 lint 规则、增加兼容层或回退架构来“压 lint�?5. �?React hooks 问题优先采用派生状态、稳定回调、事件入口更新等方式修复
6. 对行为变化点优先补纯函数测试或复用现有回归测�?7. 上传链路继续保持 S3 预签�?URL 模式，不引入旁路直传接口

