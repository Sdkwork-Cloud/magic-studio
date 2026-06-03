# Magic Studio V2 性能复盘与执行方�?Round 14（补档）

日期�?026-04-06  
范围：`apps/magic-studio-v2`  
补档说明：本文件回填 `magiccut` 资源/领域层收口与 `assets-center` 共享层排查结果�? 
排除范围：`packages/sdkwork-magic-studio-notes`

---

## 1. 本轮目标

1. 收口 `magiccut` 资源面板�?domain 资产状态中的剩�?`magic-studio-assets` 根入口依�?2. �?`assets-center` 引入更细�?shared workspace chunk �?focused alias
3. 复核为何 `feature-assets-center` 在多轮收口后仍异常偏�?
---

## 2. 问题列表

### P1. `magiccut` 资源面板�?domain 资产模型仍有宽入口依�?
影响�?
1. 资源列表 UI、收藏切换、domain 状态与 `magic-studio-assets` 根入口持续耦合
2. 资产实体类型与运行时服务边界不清�?
### P2. `assets-center` 热路径仍从共�?workspace 根入口取能力

影响�?
1. `magic-studio-commons / magic-studio-core` 等共享包的根入口继续扩大 chunk 耦合�?2. 无法准确判断 chunk 偏大的真实原�?
### P3. 即使完成上述收口，`feature-assets-center` 依然没有明显下降

结论指向�?
1. 根因不止�?root import
2. 很可能还有共享资源被整包带入

---

## 3. 本轮处理输入与输�?
### 3.1 `magiccut` 资源�?domain 文件

输入�?
1. `SkimmableAssetCard.tsx`
2. `VideoResourcePanel.tsx`
3. `TextResourcePanel.tsx`
4. `ImageResourcePanel.tsx`
5. `AudioResourcePanel.tsx`
6. `VisualResourceGrid.tsx`
7. `MusicResourceList.tsx`
8. `EffectResourceGrid.tsx`
9. `AudioResourceList.tsx`
10. `favoriteToggle.ts`
11. `magicCutAssetState.ts`
12. `resourcePanelAssets.ts`

输出�?
1. 资产实体类型统一改走：`@sdkwork/magic-studio-assets/entities`
2. 资源状态与目录能力改走：`@sdkwork/magic-studio-assets/asset-center`
3. URL hook 改走：`@sdkwork/magic-studio-assets/hooks`

### 3.2 `scripts/vite-manual-chunks.mjs`

输入�?
1. 原有仅按大功能包�?chunk 的规�?
输出�?
1. 新增 `resolveSharedWorkspaceChunk`
2. 增加共享包映射：
   - `sdkwork-magic-studio-commons -> shared-magic-studio-commons`
   - `sdkwork-magic-studio-core -> shared-magic-studio-core`
   - `sdkwork-magic-studio-i18n -> shared-magic-studio-i18n`
   - `sdkwork-magic-studio-types -> shared-magic-studio-types`

### 3.3 `vite.config.ts` / `tsconfig.json`

输入�?
1. 共享 workspace focused subpath 不完�?
输出�?
1. 增加 focused alias/path�?   - `@sdkwork/magic-studio-commons/framework/tokens`
   - `@sdkwork/magic-studio-commons/types`
   - `@sdkwork/magic-studio-core/platform`
   - `@sdkwork/magic-studio-core/utils`

### 3.4 `packages/sdkwork-magic-studio-assets` 热路径文�?
输入�?
1. `AssetsPage.tsx`
2. `assetStore.tsx`
3. `AssetGrid.tsx`
4. `AssetSidebar.tsx`
5. `assetSelectionIdentity.ts`
6. `useAssetUrl.ts`

输出�?
1. 共享运行时能力改�?focused subpath
2. 类型能力改走 `@sdkwork/magic-studio-types`

### 3.5 测试文件

输出�?
1. `tests/magiccutResourceAssetsSubpathBoundary.node.test.mjs`
2. `tests/assetsCenterFoundationBoundary.node.test.mjs`
3. `tests/viteManualChunks.node.test.mjs`

---

## 4. 红灯 -> 绿灯闭环

1. 先新�?`magiccut` 资源/domain 边界测试
2. 再新�?`assets-center` 共享层边界测�?3. �?`viteManualChunks` 测试锁定新的 shared chunk 规则
4. 最小改导入路径�?alias/path
5. 运行 `node --test`、`pnpm run test:node`、`pnpm run build:test`

---

## 5. 关键调查结论

虽然 `shared-magic-studio-commons / core / i18n / types` chunk 已经被成功拆出，�?`feature-assets-center` 体积当时依然没有明显下降。继续检查构建产物后发现�?
1. `feature-assets-center` 中混入了大量跨模块中英文文案
2. 文案覆盖 `magicCut / film / portal / settings / notes / assetCenter` 等多个域
3. `packages/sdkwork-magic-studio-i18n/src/I18nService.ts` 当时仍静态导入：
   - `./resources/en`
   - `./resources/zh-CN`

这说明真正的大头之一是基础语言资源整包静态打包，而不是单纯的 root import�?
---

## 6. 验证结果

执行�?
1. `node --test tests/magiccutResourceAssetsSubpathBoundary.node.test.mjs`
2. `node --test tests/assetsCenterFoundationBoundary.node.test.mjs`
3. `node --test tests/viteManualChunks.node.test.mjs`
4. `pnpm run test:node`
5. `pnpm run build:test`

结果�?
1. 所有边界测试通过
2. 全量 node tests 通过
3. 构建通过
4. `feature-assets-center` 仍偏大，证明问题已从“导入边界”进一步收敛到“共�?i18n 基础资源�?
---

## 7. 结论

Round 14 的主要成果不是直接把最�?chunk 压下去，而是把问题从“多个模块都可疑”精确收敛到了“`sdkwork-magic-studio-i18n` 基础语言树静态打包”�?
---

## 8. 下一步计�?
1. �?`I18nService` 新增懒加载边界测�?2. 去掉 `./resources/en` �?`./resources/zh-CN` 的静态导�?3. 在首�?`render` 前预热所需 locale，避免显�?key
4. 再次构建并确�?`feature-assets-center` 是否真实下降
