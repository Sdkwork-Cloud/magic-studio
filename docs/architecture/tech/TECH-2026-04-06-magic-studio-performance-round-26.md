> Migrated from `docs/review/2026-04-06-magic-studio-performance-round-26.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Magic Studio V2 性能复盘与执行方案 Round 26

日期：2026-04-06  
范围：`apps/magic-studio-v2`  
目标：把 auth/user IAM 样式从入口全局 CSS 中拆出，收口到 lazy route 级样式边界，并验证构建产物是否形成独立 IAM CSS chunk。

---

## 1. 当前阶段结论

round-25 完成后，入口 JS 已经明显瘦身，主问题从 JS 首屏同步依赖转移到 CSS：

1. `dist/assets/index-CUmuH37b.css` 仍为 `366.04 kB`
2. `src/index.css` 同时承担全局样式、auth/user 的 Tailwind `@source`、以及 IAM host presentation 规则
3. auth/user 页面本身已经是 lazy route，但其样式仍被提前编译并注入入口 CSS

本轮 round-26 的目标不是继续拆 JS，而是先把 IAM CSS 边界切干净。

---

## 2. 问题列表

### P1. `src/index.css` 仍扫描 auth/user 源树

影响：
1. `sdkwork-auth-pc-react` 与 `sdkwork-user-pc-react` 的 Tailwind utilities 被提前编译到入口 CSS
2. lazy route 无法形成独立的 route-scoped CSS 产物

### P2. `src/index.css` 仍承载 IAM host 样式

影响：
1. `[data-magic-iam-screen="auth"]`
2. `[data-magic-iam-screen="user"]`
3. `.magic-iam-theme`
4. `.magic-auth-shell`

这些规则都属于 auth/user route 的宿主样式，不应留在全局入口。

### P3. lazy IAM page 没有显式绑定 route CSS

影响：
1. 即使拆出新样式文件，也可能因为页面未显式引入，导致构建产物无法建立 route CSS 依赖关系

### P4. CSS side-effect import 的类型边界缺失

影响：
1. 三个页面引入 `../styles/iam.css` 后，`pnpm run build:test` 触发 `TS2882`
2. 若不补全类型声明，构建无法闭环

---

## 3. 本轮执行方案

### 方案选择

采用最小且可验证的 route-scoped CSS 迁移方案：

1. 先补红测，锁定 `src/index.css` 与 `src/styles/iam.css` 的职责边界
2. 从 `src/index.css` 移除 auth/user 的 `@source`
3. 从 `src/index.css` 移除全部 IAM host presentation 规则
4. 新建 `src/styles/iam.css` 承载 auth/user 的 `@source` 与 IAM host 规则
5. 让 `LoginPage`、`AuthOAuthCallbackPage`、`ProfilePage` 三个 lazy page 显式引入该样式
6. 修复 CSS side-effect import 的 TS 类型声明
7. 跑 node tests、vitest、build:test，并检查 dist 产物边界

### 为什么先不拆 `sdkwork-ui` `@source`

原因：
1. `sdkwork-ui` 仍被主应用多个共享组件复用
2. 当前最清晰、风险最低、收益最直接的切口是 auth/user 私有扫描源
3. 先形成 IAM route CSS chunk，再决定下一轮是否细拆 `sdkwork-ui`

---

## 4. 逐项输入 / 输出 / 变更属性

### 4.1 `tests/iamCssBoundary.node.test.mjs`

输入：
1. `src/index.css` 仍包含 auth/user `@source`
2. `src/index.css` 仍包含 `data-magic-iam-screen` 规则
3. lazy pages 尚未加载 IAM route CSS

输出：
1. 新增 CSS 边界测试
2. 强制 `src/index.css` 与 `src/styles/iam.css` 职责分离
3. 强制三张 lazy page 显式引入 `../styles/iam.css`

变更属性：新增

### 4.2 `tests/authTailwindCompilation.node.test.mjs`

输入：
1. 旧测试默认 auth/user 扫描源留在 `src/index.css`

输出：
1. 改为编译 `src/styles/iam.css`
2. 断言只注册 auth/user 两个 route source tree

变更属性：修改

### 4.3 `tests/authHostVisualParity.node.test.mjs`

输入：
1. 旧测试从 `src/index.css` 读取 auth host rules

输出：
1. 改为从 `src/styles/iam.css` 读取 auth host rules

变更属性：修改

### 4.4 `tests/userHostVisualParity.node.test.mjs`

输入：
1. 旧测试从 `src/index.css` 读取 user host rules

输出：
1. 改为从 `src/styles/iam.css` 读取 user host rules

变更属性：修改

### 4.5 `tests/authLoginRuntimeStability.node.test.mjs`

输入：
1. 旧测试假设 auth shell 的宿主样式仍在 `src/index.css`

输出：
1. 改为校验 `src/styles/iam.css` 中的 `.magic-auth-shell`

变更属性：修改

### 4.6 `tests/authSharedUiParity.node.test.mjs`

输入：
1. 旧测试把 shared UI 与 auth/user source tree 全部绑定到 `src/index.css`

输出：
1. 断言 `src/index.css` 只保留 `sdkwork-ui` source tree
2. 断言 `src/styles/iam.css` 接管 auth/user source tree

变更属性：修改

### 4.7 `tests/iamHostPresentation.node.test.mjs`

输入：
1. 旧测试把 IAM presentation 规则视为全局入口样式的一部分

输出：
1. 改为校验 route-scoped `src/styles/iam.css`

变更属性：修改

### 4.8 `src/styles/iam.css`

输入：
1. auth/user `@source`
2. IAM host presentation rules
3. `.magic-auth-shell`
4. user center sticky/header/settings shell rules

输出：
1. 新的 lazy IAM route 样式入口
2. 构建时可形成独立 IAM CSS chunk

变更属性：新增

### 4.9 `src/index.css`

输入：
1. 全局基础 Tailwind
2. `sdkwork-ui` source tree
3. auth/user source tree
4. IAM host rules

输出：
1. 保留全局 Tailwind、`tailwindcss-animate`、`sdkwork-ui` source tree、通用应用样式
2. 移除 auth/user source tree
3. 移除全部 IAM host rules

变更属性：修改

### 4.10 `src/pages/LoginPage.tsx`

输入：
1. 仅转发 `@sdkwork/magic-studio-auth` 登录页面

输出：
1. 新增 `import '../styles/iam.css';`
2. 建立 Login route 对 IAM CSS 的显式依赖

变更属性：修改

### 4.11 `src/pages/AuthOAuthCallbackPage.tsx`

输入：
1. 仅转发 `@sdkwork/magic-studio-auth` OAuth callback 页面

输出：
1. 新增 `import '../styles/iam.css';`
2. 建立 callback route 对 IAM CSS 的显式依赖

变更属性：修改

### 4.12 `src/pages/ProfilePage.tsx`

输入：
1. 仅转发 `@sdkwork/magic-studio-user` profile 页面

输出：
1. 新增 `import '../styles/iam.css';`
2. 建立 profile route 对 IAM CSS 的显式依赖

变更属性：修改

### 4.13 `src/css.d.ts`

输入：
1. TypeScript 对 side-effect CSS import 缺少模块声明

输出：
1. 新增 `declare module '*.css';`
2. 修复 `TS2882`

变更属性：新增

---

## 5. 红灯到绿灯闭环

### 5.1 红灯

命令：

```powershell
node --test tests/iamCssBoundary.node.test.mjs tests/authTailwindCompilation.node.test.mjs tests/authHostVisualParity.node.test.mjs tests/userHostVisualParity.node.test.mjs tests/authLoginRuntimeStability.node.test.mjs tests/authSharedUiParity.node.test.mjs tests/iamHostPresentation.node.test.mjs
```

结果：

1. 7 个测试失败，1 个测试通过
2. 失败主因：`src/styles/iam.css` 不存在
3. 说明测试正确地把问题锁定在 route CSS 尚未落地，而不是别的噪音

### 5.2 绿灯

命令：

```powershell
node --test tests/iamCssBoundary.node.test.mjs tests/authTailwindCompilation.node.test.mjs tests/authHostVisualParity.node.test.mjs tests/userHostVisualParity.node.test.mjs tests/authLoginRuntimeStability.node.test.mjs tests/authSharedUiParity.node.test.mjs tests/iamHostPresentation.node.test.mjs
```

结果：

1. 8/8 通过
2. 说明 source tree 边界、IAM host rules、lazy page 样式依赖三者已经对齐

### 5.3 构建红灯与修复

命令：

```powershell
pnpm run build:test
```

第一次结果：

1. 失败
2. 失败原因：`TS2882: Cannot find module or type declarations for side-effect import of '../styles/iam.css'`

修复：

1. 新增 `src/css.d.ts`

再次执行结果：

1. 构建通过

---

## 6. 验证

### 6.1 Identity 与性能边界回归

命令：

```powershell
node --test tests/authDesktopWindowControls.node.test.mjs tests/authHostVisualParity.node.test.mjs tests/authLayoutParity.node.test.mjs tests/authLegacyReferenceCleanup.node.test.mjs tests/authLocalComposition.node.test.mjs tests/authLoginRuntimeStability.node.test.mjs tests/authSharedUiParity.node.test.mjs tests/authTailwindCompilation.node.test.mjs tests/authZhCnLocale.node.test.mjs tests/iamCssBoundary.node.test.mjs tests/iamHostDependencyParity.node.test.mjs tests/iamHostPresentation.node.test.mjs tests/iamThemeBridge.node.test.mjs tests/profileLayoutParity.node.test.mjs tests/userCenterHostBranding.node.test.mjs tests/userHostVisualParity.node.test.mjs tests/userLocalComposition.node.test.mjs tests/userSectionAdapterParity.node.test.mjs tests/userSharedShellParity.node.test.mjs tests/userZhCnLocale.node.test.mjs tests/appEntryFocusedSubpathBoundary.node.test.mjs tests/layoutShellBoundary.node.test.mjs tests/magiccutShellBoundary.node.test.mjs tests/magiccutFeatureSubpathBoundary.node.test.mjs tests/startupPerformance.node.test.mjs tests/viteManualChunks.node.test.mjs tests/viteChunkIsolation.node.test.mjs tests/viteReactAlias.node.test.mjs tests/i18nLazyBootstrapBoundary.node.test.mjs
```

结果：

1. 42/42 通过

### 6.2 组件 smoke test

命令：

```powershell
pnpm exec vitest run src/layouts/MainLayout/MainSidebar.test.tsx src/layouts/MagicCutLayout/MagicCutLayoutHeader.test.tsx
```

结果：

1. 2 个文件通过
2. 4 个测试通过

### 6.3 构建验证

命令：

```powershell
pnpm run build:test
```

结果：

1. 构建成功
2. 新产物中出现独立的 `iam-*.css` 与 `iam-*.js`
3. `LoginPage`、`AuthOAuthCallbackPage`、`ProfilePage` 构建产物显式依赖 `iam-*.js`
4. `magic-iam-screen` 与 `magic-auth-shell` 规则出现在 `iam-*.css` 中

---

## 7. 构建结果

### round-25 关键产物

1. `dist/assets/index-DRE_qhUp.js` `143.85 kB`
2. `dist/assets/index-CUmuH37b.css` `366.04 kB`

### round-26 关键产物

1. `dist/assets/index-DsBEvoQd.js` `144.02 kB`
2. `dist/assets/index-3uHoKPMf.css` `359.71 kB`
3. `dist/assets/iam-DbRhjvWD.css` `323.23 kB`
4. `dist/assets/iam-C0UOczAg.js` `0.07 kB`

### 本轮结果解读

1. 入口 JS 基本保持稳定，没有因为 CSS 拆分把主入口重新膨胀
2. 入口 CSS 从 `366.04 kB` 下降到 `359.71 kB`，减少 `6.33 kB`
3. IAM 样式成功转移为独立 route-scoped 产物，不再挂在主入口 CSS 上
4. 但 `iam-*.css` 体积达到 `323.23 kB`，说明 auth/user route 本身仍然生成了大量 Tailwind utilities

---

## 8. 残留问题与下一步计划

### 当前残留问题

#### P1. entry CSS 降幅有限

原因判断：
1. IAM host rules 本身很小
2. 更大的成本来自 Tailwind 扫描后生成的 utilities 与基础层
3. `src/styles/iam.css` 使用 `@import "tailwindcss";` 后，IAM route chunk 自身也携带了完整 Tailwind 输出

#### P2. IAM CSS chunk 仍偏大

原因判断：
1. auth/user 源树里使用了大量 Tailwind utility class
2. route CSS 目前仍按整棵 auth/user 源树扫描
3. 可能还存在共享基础层重复注入

### 下一轮建议

#### 方案 A，优先执行

1. 继续审计 `iam-*.css` 的组成
2. 统计 auth/user route 实际命中的高体积 utility family
3. 评估是否可以把 auth 与 user 再分拆成两个独立 CSS 入口
4. 评估是否可用更轻的 `@reference`/共享基础层策略，避免 IAM route 重复携带完整 Tailwind base

#### 方案 B，次优

1. 继续拆 `sdkwork-ui` 的 `@source`
2. 但这一步风险更高，且主问题已转移到 IAM route 自身的 Tailwind 生成成本

### round-27 计划

1. 新增构建产物审计测试，锁定 `iam-*.css` 的边界与重复成本
2. 调查 auth 与 user 是否可以拆成 `auth.css`、`user.css`
3. 若可行，继续做 route 级 CSS 细分
4. 若不可行，再评估 Tailwind 基础层共享策略

---

## 9. 本轮总结

round-26 已完成一个完整闭环：

1. review 根因
2. 补红测
3. 落地实现
4. 修复构建类型边界
5. 跑回归测试
6. 跑构建
7. 检查 dist 产物
8. 输出下一轮计划

当前代码状态已经达到“identity 样式从入口全局 CSS 中剥离，并由 lazy route 独立加载”的目标。下一轮的重点不再是样式边界是否正确，而是继续压缩 `iam-*.css` 的体积。

