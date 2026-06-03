# Magic Studio V2 性能复盘与执行方案 Round 19

日期：2026-04-06  
范围：`apps/magic-studio-v2`  
目标：解决 round-18 之后仍然存在的 `vendor-*` 超大单桶问题，把第三方依赖从一个 2.6MB 级大块拆成稳定、可缓存、可继续优化的多组 vendor chunk。

---

## 1. 当前阶段结论

round-18 已经解决了两个根问题：

1. `rolldown` 下旧的 `manualChunks` 语义不再足以稳定维持共享边界。
2. `chat` / `vip` 根入口导致的 `INEFFECTIVE_DYNAMIC_IMPORT` 已消失。

但新的主瓶颈转移为：

1. `vendor-CgUxp4Vk.js` 仍有 `2635.08 kB`
2. `index-BXRtEskY.js` 仍有 `495.10 kB`
3. `shared-magic-studio-i18n-CqW_1eyr.js` 仍有 `178.63 kB`

本轮先处理第 1 条，因为它是构建产物中最确定、最可验证、风险最小的一层。

---

## 2. 根因分析

通过检查 `scripts/vite-manual-chunks.mjs` 与上轮构建结果，确认根因如下：

1. `resolveManualChunk()` 对所有 `/node_modules/` 统一返回 `'vendor'`
2. `vite.config.ts` 已经通过 `rolldownOptions.output.codeSplitting.groups` 复用了该分类函数
3. 这意味着所有第三方依赖无论大小、职责、访问时机，都会被强行塞进同一个 `vendor` 组
4. 在当前依赖结构下，这个单桶天然聚合了：
   - React 运行时
   - UI 组件族
   - Monaco / Tiptap / XTerm 等编辑器依赖
   - AWS SDK / Smithy
   - 其他通用依赖

结论：问题不在 Vite 配置丢失，而在 chunk 分类策略过于粗糙。

---

## 3. 问题列表

### P1. 第三方依赖被错误聚合到单一 `vendor`

影响：

1. 初次下载成本过高
2. 任何一个小改动都会让整个 `vendor` 失去缓存价值
3. 后续无法判断究竟是 React/UI/编辑器/AWS 哪一类导致膨胀

### P2. `index` 体积难以下降

影响：

1. 即使 shell 本身没有变重，也会被动依赖单一 `vendor`
2. 无法区分壳层问题与第三方桶问题

本轮结论：

1. P1 必须先解决
2. P2 暂不直接改，留到下一轮基于新构建结果再追

---

## 4. 本轮执行方案

### 4.1 方案选择

候选方案：

1. 继续保留单一 `vendor`
   - 优点：改动最小
   - 缺点：问题不解
2. 按业务 feature 拆第三方依赖
   - 优点：理论上更细
   - 缺点：耦合过强，维护成本高
3. 按第三方族群职责拆分 vendor
   - 优点：稳定、可缓存、可验证
   - 缺点：需要补分类规则和测试

本轮采用方案 3。

### 4.2 目标 vendor 分组

1. `vendor-react`
2. `vendor-ui`
3. `vendor-editor`
4. `vendor-aws`
5. 其他仍落回 `vendor`

---

## 5. 逐项处理对象输入 / 输出 / 变更属性

### 5.1 `tests/viteManualChunks.node.test.mjs`

输入：

1. `resolveManualChunk()` 旧行为只返回单一 `vendor`
2. 尚不存在 `resolveVendorChunk()`

输出：

1. 新增 red/green 用例，要求 `react` / `ui` / `editor` / `aws` 各自进入独立 vendor 组
2. 明确兜底仍可回落到 `vendor`

变更属性：修改

### 5.2 `tests/viteChunkIsolation.node.test.mjs`

输入：

1. 仅验证共享 workspace / assets-center 的 group 复用

输出：

1. 追加 vendor group 复用断言
2. 确认 `rolldown` group naming 继续复用同一个分类器

变更属性：修改

### 5.3 `scripts/vite-manual-chunks.mjs`

输入：

1. `/node_modules/` 统一映射为 `'vendor'`

输出：

1. 新增 `resolveVendorChunk(normalizedId)`
2. 引入四类 vendor 组：
   - `vendor-react`
   - `vendor-ui`
   - `vendor-editor`
   - `vendor-aws`
3. 保留兜底 `vendor`
4. `resolveManualChunk()` 优先走 `resolveVendorChunk()`

变更属性：修改

---

## 6. 红灯 -> 绿灯闭环

### 6.1 红灯

命令：

```powershell
node --test tests/viteManualChunks.node.test.mjs tests/viteChunkIsolation.node.test.mjs
```

结果：

1. 失败
2. 失败原因：`../scripts/vite-manual-chunks.mjs` 不存在导出 `resolveVendorChunk`

结论：

1. 新测试确实卡住了未实现的真实缺口

### 6.2 绿灯

实现后命令：

```powershell
node --test tests/viteManualChunks.node.test.mjs tests/viteChunkIsolation.node.test.mjs
```

结果：

1. 8/8 通过

---

## 7. 验证

### 7.1 Node 边界验证

命令：

```powershell
node --test tests/viteManualChunks.node.test.mjs tests/viteChunkIsolation.node.test.mjs tests/viteReactAlias.node.test.mjs
```

结果：

1. 9/9 通过

### 7.2 构建验证

命令：

```powershell
pnpm run build:test
```

结果：

1. 构建成功
2. 无 `INEFFECTIVE_DYNAMIC_IMPORT` 警告

---

## 8. 构建结果对比

### 8.1 round-18 前置结果

1. `vendor-CgUxp4Vk.js`: `2635.08 kB`
2. `index-BXRtEskY.js`: `495.10 kB`

### 8.2 round-19 完成后结果

1. `vendor-D1oeSE1c.js`: `1015.46 kB`
2. `vendor-ui-DLdERzGo.js`: `776.46 kB`
3. `vendor-editor-CtWQa_eF.js`: `382.08 kB`
4. `vendor-aws-B6O_llgO.js`: `324.26 kB`
5. `vendor-react-CXTcjzUn.js`: `189.64 kB`
6. `index-DqT56kS2.js`: `506.67 kB`

### 8.3 本轮结论

1. 单一 `vendor` 问题已实质解决
2. `index` 没有同步下降，说明壳层问题仍独立存在
3. `shared-magic-studio-i18n` 也没有下降，说明国际化运行时仍需要单独处理

---

## 9. 风险与残留问题

### R1. `index` 仍然静态依赖部分大块

已知事实：

1. `index` 仍然较大
2. 后续需要判断它到底静态依赖了哪些 vendor 组

### R2. `shared-magic-studio-i18n` 依赖面仍广

已知事实：

1. `shared-magic-studio-i18n` 仍接近 `183 kB`
2. 很可能存在跨 feature 的语言资源聚合

---

## 10. 下一步计划

### round-20 目标

1. 继续追 `index-*` 静态依赖链路
2. 优先审查 `editor` / `drive` / `notes` 等根入口是否把重型依赖暴露给壳层
3. 用 focused subpath 继续缩小 root-entry 泄漏面

### round-21 候选

1. 继续拆 `shared-magic-studio-i18n`
2. 审查 `assets-generation` / `notes` / `editor` 的编辑器依赖是否仍被壳层提前引入

---

## 11. 本轮结论

本轮已经形成完整闭环：

1. 通过测试证明问题真实存在
2. 用最小实现补上 vendor 分组分类器
3. 通过构建验证确认第三方依赖已从单一巨型 `vendor` 分裂为稳定的多组 vendor
4. 明确下一轮不再继续纠缠 vendor 单桶，而是转向 `index` 与 `shared-magic-studio-i18n`
