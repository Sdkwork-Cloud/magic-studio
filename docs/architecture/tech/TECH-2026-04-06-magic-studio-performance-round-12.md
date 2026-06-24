> Migrated from `docs/review/2026-04-06-magic-studio-performance-round-12.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Magic Studio V2 性能复盘与执行方�?Round 12（补档）

日期�?026-04-06  
范围：`apps/magic-studio-v2`  
补档说明：本文件根据当前代码状态、边界测试与已通过构建结果回填 Round 12 的实施闭环�? 
排除范围：`packages/sdkwork-magic-studio-notes`

---

## 1. 本轮目标

�?`sdkwork-magic-studio-canvas` 清理完成之后，继续收�?`sdkwork-magic-studio-drive` 中最后一个高优先级的 `@sdkwork/magic-studio-assets` broad root import 热点，避�?`feature-assets-center` 的可疑来源继续被 `drive` 运行时路径放大�?
---

## 2. 问题列表

### P1. `FilePreviewModal` 仍从 `@sdkwork/magic-studio-assets` 根入口拿运行时能�?
影响�?
1. `drive` 预览弹窗在运行时仍依赖宽入口 facade
2. 资产解析能力与资源中心主包继续耦合
3. 不利于继续缩�?`feature-assets-center` 的真实可疑面

根因�?
1. `packages/sdkwork-magic-studio-drive/src/components/FilePreviewModal.tsx` 直接消费�?`assetService`
2. 导入来源没有收口�?`@sdkwork/magic-studio-assets/services`

---

## 3. 本轮处理输入与输�?
### 3.1 `packages/sdkwork-magic-studio-drive/src/components/FilePreviewModal.tsx`

输入�?
1. `assetService`
2. 来源：`@sdkwork/magic-studio-assets`

输出�?
1. `assetService`
2. 来源改为：`@sdkwork/magic-studio-assets/services`

### 3.2 `tests/driveAssetsSubpathBoundary.node.test.mjs`

输入�?
1. `FilePreviewModal.tsx` 源码
2. `magic-studio-assets` 根入口禁止规�?
输出�?
1. 新增 node 边界测试
2. 断言 `FilePreviewModal.tsx` 不再出现 `from '@sdkwork/magic-studio-assets'`
3. 断言命中 `@sdkwork/magic-studio-assets/services`

---

## 4. 红灯 -> 绿灯闭环

### 4.1 失败测试

新增�?
1. `tests/driveAssetsSubpathBoundary.node.test.mjs`

目标�?
1. 锁定 `drive` 预览弹窗必须�?focused services subpath

### 4.2 最小实�?
策略�?
1. 不改业务逻辑
2. 不改入参与返�?3. 只改运行时导入边�?
### 4.3 验证结果

执行�?
1. `node --test tests/driveAssetsSubpathBoundary.node.test.mjs`
2. `pnpm run test:node`
3. `pnpm run build:test`

结果�?
1. 边界测试通过
2. 全量 node tests 通过
3. 构建通过

---

## 5. 结论

Round 12 的价值不在于立刻�?`feature-assets-center` 大幅下降，而在于把 `drive` 从高优先�?broad root import 可疑面中清掉，给后续 `magiccut` 与共享层根因调查腾出更干净的样本面�?
---

## 6. 下一步计�?
1. 继续处理 `sdkwork-magic-studio-magiccut`
2. 先清运行�?root import，再清资源面板和 domain 侧资产类型导�?3. �?`drive + magiccut` 收口后重新复�?`feature-assets-center` 的真实组�?
