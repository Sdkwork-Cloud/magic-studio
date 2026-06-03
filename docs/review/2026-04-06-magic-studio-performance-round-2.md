# Magic Studio V2 性能复盘与执行方�?Round 2

日期�?026-04-06  
范围：`apps/magic-studio-v2`  
排除范围：`packages/sdkwork-magic-studio-notes`

---

## 1. 当前阶段

上一轮已完成�?
1. `feature-magiccut` 拆成 `engine / shared / panels`
2. `feature-film` 拆成 `pages / core`
3. `ChooseAssetModal` 改为轻壳 + 懒加载重内容
4. `pnpm run build:test` 通过
5. `pnpm run test:node` 通过

当前唯一仍然明显超预算的业务 chunk�?
1. `feature-assets-center-*.js` �?`2,083,805 B`

---

## 2. 根因复核

本轮针对 `feature-assets-center` 继续做了根因追踪，得到以下证据：

1. `src/router/registry.tsx` 仍通过 `import('@sdkwork/magic-studio-assets')` 读取 `AssetsPage`
2. `src/router/registry.tsx` 仍通过 `import('@sdkwork/magic-studio-assets')` 读取 `AssetStoreProvider`
3. `src/router/packageRouteLoader.tsx` 仍通过 `import('@sdkwork/magic-studio-assets')` 读取 `AssetsPage` �?`AssetStoreProvider`
4. `src/router/routePreload.ts` 仍通过 `import('@sdkwork/magic-studio-assets')` �?`assets` 预加�?5. `src/app/bootstrap.ts` 仍通过 `import('@sdkwork/magic-studio-assets')` 读取�?   - `defaultI18nConfig`
   - `initializeAssetServices`
   - `assetCenterService`
6. `packages/sdkwork-magic-studio-assets/src/index.ts` 是一个全�?re-export 入口

结论�?
1. 当前真正的高风险点不�?`AssetsPage` 代码体量本身
2. 而是根应用仍在多个关键入口加�?`@sdkwork/magic-studio-assets` 根模�?3. 一旦根模块被动态导入，`src/index.ts` 的全量导出图就会被求�?4. 这直接削弱了前一�?manual chunk 拆分收益

---

## 3. 本轮执行目标

把根应用�?`@sdkwork/magic-studio-assets` 的关键入口依赖改为子路径直连，避免再从根模块触发整包导出图�?
---

## 4. 本轮执行方案

### 方案 A：路由与 bootstrap 改为 assets 子路径入�?
这是本轮推荐方案�?
做法�?
1. �?`sdkwork-magic-studio-assets` 增加根应用可消费的子路径入口别名
2. 路由页改�?`pages` 子路径导�?`AssetsPage`
3. Provider 改从 `store` 子路径导�?`AssetStoreProvider`
4. 预加载逻辑改为预加�?`pages` / `store`
5. bootstrap 改为�?   - �?`i18n` 子路径读�?`defaultI18nConfig`
   - �?`services` �?`asset-center` 子路径读取初始化能力

优点�?
1. 改动集中
2. 风险可控
3. 能直接切断根模块入口造成的全量求�?4. 不影响外部包继续使用根入�?
### 方案 B：继续强�?manualChunks，不改入口导�?
不推荐�?
原因�?
1. 根因不是 chunk 命名粗糙，而是入口导入边界错误
2. 继续仅调 chunk 规则，大概率收益有限

---

## 5. 本轮处理函数输入/输出定义

### 5.1 `routePreload.assets(): Promise<unknown[]>`

输入�?
1. 无显式输入，按当前路由命中触�?
输出�?
1. 预加�?`AssetsPage` 相关页面入口
2. 预加�?`AssetStoreProvider` 相关状态入�?
改造目标：

1. 不再导入 `@sdkwork/magic-studio-assets` 根入�?2. 改为导入 `@sdkwork/magic-studio-assets/pages` �?`@sdkwork/magic-studio-assets/store`

### 5.2 `bootstrap(): Promise<void>`

输入�?
1. 应用启动环境

输出�?
1. 注册 i18n 配置
2. 初始�?asset services
3. 初始化资产中心基础能力

改造目标：

1. 不再通过 `@sdkwork/magic-studio-assets` 根入口读�?`defaultI18nConfig`
2. 不再通过 `@sdkwork/magic-studio-assets` 根入口读�?`initializeAssetServices` �?`assetCenterService`

### 5.3 `lazy(() => import(...))` �?Assets 路由装载�?
输入�?
1. 当前路由命中 `/assets`

输出�?
1. 懒加�?`AssetsPage`
2. 懒加�?`AssetStoreProvider`

改造目标：

1. 改用子路径入口，避免整包 namespace import

---

## 6. 本轮实施步骤

1. 先写失败测试，锁定“根应用禁止�?`@sdkwork/magic-studio-assets` 根入口装载资产页/Provider/bootstrap 能力�?2. 运行测试，确认失�?3. 增加 `tsconfig` �?`vite` �?assets 子路径别�?4. 修改 `registry / packageRouteLoader / packageRoutes / routePreload / bootstrap`
5. 重跑 node tests
6. 重跑 `build:test`
7. 检�?`feature-assets-center` 是否下降
8. 回写文档与下一步计�?
---

## 7. 预期验收标准

1. `pnpm run test:node` 通过
2. `pnpm run build:test` 通过
3. 根级 lint 仍仅�?`notes` �?11 个错�?4. `feature-assets-center` 较上一轮继续下�?5. 若仍然过大，则下一轮继续处�?`PromptTextInput / CreationChatInput` 的入口边�?