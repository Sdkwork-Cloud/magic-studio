> Migrated from `docs/review/2026-04-06-magic-studio-performance-round-15.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Magic Studio V2 性能复盘与执行方�?Round 15

日期�?026-04-06  
范围：`apps/magic-studio-v2`  
本轮目标：拆�?`sdkwork-magic-studio-i18n` 基础语言树的静态打包，�?base locale 迁移到懒加载预热链路，并验证 `feature-assets-center` 是否因此下降�? 
排除范围：`packages/sdkwork-magic-studio-notes`

---

## 1. 当前阶段结论

本轮已经完成完整闭环，并拿到真实收益�?
1. `I18nService` 不再静态导�?`./resources/en` �?`./resources/zh-CN`
2. 首屏挂载前会先完�?`bootstrap()`，其中会等待 `i18nService.initialize()` 预热当前 locale �?fallback locale
3. `feature-assets-center` 从上一轮构建输出的 `1,410.53 kB` 降到了本轮的 `1,236.06 kB`
4. `rg` 复核构建产物可见，`Loading Route`、`Magic Cut`、`Upgrade to Pro` 等跨模块基础文案已经集中落入 `shared-magic-studio-i18n-*`，不再出现在 `feature-assets-center-*` 的匹配结果中
5. 仍有残留问题�?   - `feature-assets-center` 依旧略高�?`1200 kB` warning �?   - `MODULE_TYPELESS_PACKAGE_JSON` warning 仍在
   - `PLUGIN_TIMINGS` warning 仍在

---

## 2. 问题列表

### P1. `sdkwork-magic-studio-i18n` 基础语言树静态导入导致跨模块文案被整包带�?
影响�?
1. 任意使用 `useTranslation()` 的热路径都可能把全局基础文案树一并带�?2. `feature-assets-center` 被动吸收 `magicCut / film / portal / settings / notes` 等域�?copy
3. 构建产物难以按真实业务边界拆�?
根因�?
1. `packages/sdkwork-magic-studio-i18n/src/I18nService.ts` 静态导�?`./resources/en`
2. `packages/sdkwork-magic-studio-i18n/src/I18nService.ts` 静态导�?`./resources/zh-CN`
3. `resources/*` 又静态聚合了完整 base locale �?
### P2. 首屏渲染前没有等�?i18n 基础资源准备完成

影响�?
1. 如果把静态导入改成懒加载，但仍在 `render` 后才初始化，会有首屏显示 key 的风�?
---

## 3. 本轮处理输入与输�?
### 3.1 `tests/i18nLazyBootstrapBoundary.node.test.mjs`

输入�?
1. `packages/sdkwork-magic-studio-i18n/src/I18nService.ts`
2. `packages/sdkwork-magic-studio-i18n/src/resourceLoaders.ts`
3. `src/app/bootstrap.ts`
4. `index.tsx`

输出�?
1. 新增 node 边界测试
2. 断言 `I18nService.ts` 不再静态导�?`./resources/en`
3. 断言 `I18nService.ts` 不再静态导�?`./resources/zh-CN`
4. 断言 `bootstrap.ts` �?`await i18nService.initialize()`
5. 断言 `index.tsx` 会在 `ReactDOM.createRoot` �?`await bootstrap()`

### 3.2 `packages/sdkwork-magic-studio-i18n/src/resourceLoaders.ts`

输入�?
1. locale：`en-US` �?`zh-CN`

输出�?
1. `loadBaseResource(locale)`�?   - 懒加�?`./resources/en` �?`./resources/zh-CN`
   - 对同一�?locale 做缓存与并发复用

### 3.3 `packages/sdkwork-magic-studio-i18n/src/I18nService.ts`

输入�?
1. `initialize(options)`
2. `setLocale(locale, options)`
3. 当前 locale / fallback locale

输出�?
1. `initialize()` 改为异步�?   - 先加载当�?locale �?fallback locale �?base resources
   - 再应�?locale
2. `setLocale()` 改为异步�?   - 先加载资源，再切�?locale
3. 新增 `preloadBaseResources(localeInput)`�?   - 预热当前 locale �?fallback locale
4. `t()` 在资源未命中时只回落到已加载资源，不再依赖静态整�?
### 3.4 `src/app/bootstrap.ts`

输入�?
1. URL 中的 `locale`
2. `auth` / `user` 的本�?i18n namespace

输出�?
1. `initializeI18n` 改为异步
2. 在继续调度其�?deferred task 前先 `await i18nService.initialize(...)`

### 3.5 `index.tsx`

输入�?
1. `mountApp()`

输出�?
1. �?`createRoot` �?`await bootstrap()`
2. 确保首屏 render �?i18n 已完成预�?
### 3.6 `packages/sdkwork-magic-studio-i18n/tests/i18nService.test.ts`

输入�?
1. 原同�?`setLocale()` 假设

输出�?
1. 切换�?`await i18nService.setLocale(...)`
2. 新增真实基础文案预热测试�?   - 输入：`requestedLocale = 'zh-CN'`
   - 输出：`i18nService.t('appShell.loading_route') === '路由加载�?..'`

### 3.7 `packages/sdkwork-magic-studio-i18n/tests/localizedText.test.ts`

输入�?
1. 原同�?`setLocale()` 假设

输出�?
1. `afterEach` 改为异步 reset
2. `zh-CN` 切换改为 await

### 3.8 `packages/sdkwork-magic-studio-i18n/tests/formatters.test.ts`

输入�?
1. 原同�?`setLocale()` 假设

输出�?
1. `afterEach` 改为异步 reset
2. `zh-CN / en-US` 切换改为 await

### 3.9 `packages/sdkwork-magic-studio-i18n/src/packageRegistry.ts`

输入�?
1. `setLocale: (l) => i18nService.setLocale(l)`

输出�?
1. 改为 fire-and-forget 包装�?   - `setLocale: (l) => { void i18nService.setLocale(l) }`

### 3.10 `packages/sdkwork-magic-studio-settings/src/store/settingsStore.tsx`

输入�?
1. `syncLanguage(lang)` 直接同步调用 `i18nService.setLocale(...)`

输出�?
1. 改为 fire-and-forget�?   - `void i18nService.setLocale(...)`

---

## 4. 红灯 -> 绿灯闭环

### 4.1 红灯

执行�?
1. `node --test tests/i18nLazyBootstrapBoundary.node.test.mjs`

结果�?
1. 失败
2. 失败原因正确：`resourceLoaders.ts` 尚不存在
3. 说明测试锁定的是“必须存在新的懒加载边界”，而不是测试自身写�?
### 4.2 最小实�?
策略�?
1. 不改翻译 key 结构
2. 不拆 locale 文案内容
3. 只改 base locale 加载方式和首屏启动顺�?
### 4.3 绿灯

执行�?
1. `node --test tests/i18nLazyBootstrapBoundary.node.test.mjs`
2. `pnpm vitest run packages/sdkwork-magic-studio-i18n/tests/i18nService.test.ts packages/sdkwork-magic-studio-i18n/tests/localizedText.test.ts packages/sdkwork-magic-studio-i18n/tests/formatters.test.ts`

结果�?
1. 边界测试通过
2. `3` �?vitest 文件�?`15` 个测试全部通过

---

## 5. 本轮中止的失败实�?
本轮曾尝试把 `AssetGrid / AssetSidebar / assetSelectionIdentity / useAssetUrl` 抽成新的 `feature-assets-browser` manual chunk，意图继续把 `feature-assets-center` 压到 warning 线以下�?
真实构建结果显示�?
1. `feature-assets-center` 变成了约 `10.64 kB`
2. 但新�?`feature-assets-browser` 直接膨胀�?`1,225.53 kB`
3. warning 只是从一�?chunk 搬到了另一�?chunk

结论�?
1. 这不是有效拆分，而是“假拆分�?2. 已回退该实验，不保留到最终代�?3. 后续若要继续压缩，应优先做真正的运行�?lazy boundary，而不是只�?`manualChunks`

---

## 6. 验证结果

### 6.1 定向边界测试

执行�?
1. `node --test tests/i18nLazyBootstrapBoundary.node.test.mjs`
2. `node --test tests/viteManualChunks.node.test.mjs`

结果�?
1. 全部通过

### 6.2 `sdkwork-magic-studio-i18n` 定向 vitest

执行�?
1. `pnpm vitest run packages/sdkwork-magic-studio-i18n/tests/i18nService.test.ts packages/sdkwork-magic-studio-i18n/tests/localizedText.test.ts packages/sdkwork-magic-studio-i18n/tests/formatters.test.ts`

结果�?
1. `3 passed`
2. `15 passed`

### 6.3 全量 node tests

执行�?
1. `pnpm run test:node`

结果�?
1. `Discovered 70 node-side test file(s).`
2. `All 70 node-side test file(s) passed.`

### 6.4 构建

执行�?
1. `pnpm run build:test`

结果�?
1. 构建通过
2. `MODULE_TYPELESS_PACKAGE_JSON` warning 仍在
3. `PLUGIN_TIMINGS` warning 仍在
4. chunk warning 仍在，但本轮已经确认其主要根因之一已被消除

### 6.5 产物复核

执行�?
1. `Get-ChildItem dist/assets | Sort-Object Length -Descending | Select-Object -First 20 Name,@{Name='KB';Expression={[math]::Round($_.Length/1kb,2)}}`
2. `rg -n --glob "feature-assets-center-*.js" --glob "shared-magic-studio-i18n-*.js" "Loading Route|路由加载中|Magic Cut|魔映|Upgrade to Pro" dist/assets`

结果�?
1. 最�?JS chunk 仍是 `feature-assets-center-CvTEZ9aE.js`
2. 大小为：
   - 构建输出口径：`1,236.06 kB`
   - 文件系统口径：`1207.09 KB`
3. `shared-magic-studio-i18n-BoQcLRlv.js` �?`175.31 kB`
4. 文案搜索命中 `shared-magic-studio-i18n-*`，而不�?`feature-assets-center-*`

---

## 7. 构建产物对比

上一轮关键结果：

1. `feature-assets-center`：`1,410.53 kB`

本轮关键结果�?
1. `feature-assets-center`：`1,236.06 kB`

净变化�?
1. 下降 `174.47 kB`

结论�?
1. `sdkwork-magic-studio-i18n` 基础语言树静态导入，确实�?`feature-assets-center` 异常偏大的主要原因之一

---

## 8. 当前残留问题

### 8.1 `feature-assets-center` 仍略高于 warning 阈�?
状态：

1. 现在距离 `1200 kB` 仅差 `36.06 kB`
2. 继续只改 `manualChunks` 并不可靠，已经有一次失败实�?
### 8.2 `MODULE_TYPELESS_PACKAGE_JSON` warning

状态：

1. 当前仍由 `vite.config.ts` �?ES module 方式�?Node 重新解析触发
2. 是否�?`package.json` �?`"type"` 需要单独评估对脚本与工具链的连带影�?
### 8.3 `PLUGIN_TIMINGS` warning

状态：

1. 当前主要耗时仍在 `@tailwindcss/vite:generate:build`、`vite:build-import-analysis` 等构建阶�?2. 属于后续构建链性能优化问题，不是这�?i18n 拆包的直接目�?
---

## 9. 下一步计�?
1. 继续优先寻找真正�?lazy boundary，而不是继续盲�?`manualChunks`
2. 候选方向：
   - �?`assets-center` 内部某些重型面板或预览流转做真正�?`lazy(() => import(...))`
   - 继续拆分 `sdkwork-magic-studio-i18n` 基础语言树，按域或按 host-critical / non-critical 分层
3. �?`MODULE_TYPELESS_PACKAGE_JSON` 做独立风险评估，确认是否可以安全改为 module package
4. 保持每轮都写 `docs/review`、跑全量 node tests 与构建复�?
