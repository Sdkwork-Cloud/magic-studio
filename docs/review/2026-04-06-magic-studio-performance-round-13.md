# Magic Studio V2 性能复盘与执行方�?Round 13（补档）

日期�?026-04-06  
范围：`apps/magic-studio-v2`  
补档说明：本文件根据当前 `magiccut` 相关边界测试与现有源码状态回�?Round 13�? 
排除范围：`packages/sdkwork-magic-studio-notes`

---

## 1. 本轮目标

系统性收�?`sdkwork-magic-studio-magiccut` 运行时对 `@sdkwork/magic-studio-assets` 根入口的直接依赖，优先覆盖资源面板、时间线工具栏、配音面板、store 与导入工具等热路径文件�?
---

## 2. 问题列表

### P1. `magiccut` 运行时文件多�?broad root import

影响�?
1. `magiccut` 资源面板和导入链路继续把 `magic-studio-assets` 宽入口带入运行时
2. 资源中心与剪辑器耦合过深
3. `feature-assets-center` �?`feature-magiccut-*` 边界不清�?
根因�?
1. 资源中心查询、资�?URL、生成能力、实体类型等能力被统一从根入口消费
2. `magiccut` 缺少�?`asset-center / services / entities / hooks / generation` 的聚焦导�?
---

## 3. 本轮处理输入与输�?
### 3.1 `packages/sdkwork-magic-studio-magiccut/src/components/Resources/MagicCutResourcePanel.tsx`

输入�?
1. 资源中心读取能力
2. 资产查询能力
3. 资产实体类型
4. 来源统一为：`@sdkwork/magic-studio-assets`

输出�?
1. `assetCenterService` 等来源改为：`@sdkwork/magic-studio-assets/asset-center`
2. `assetService / queryAssetsBySdk` 等来源改为：`@sdkwork/magic-studio-assets/services`
3. `AnyAsset / Asset` 类型来源改为：`@sdkwork/magic-studio-assets/entities`

### 3.2 `packages/sdkwork-magic-studio-magiccut/src/store/magicCutStore.tsx`

输入�?
1. 资产中心与资产服务能�?2. 来源：`@sdkwork/magic-studio-assets`

输出�?
1. 来源改为：`@sdkwork/magic-studio-assets/asset-center`
2. 来源改为：`@sdkwork/magic-studio-assets/services`

### 3.3 `packages/sdkwork-magic-studio-magiccut/src/components/Properties/panels/VoiceSettingsPanel.tsx`

输入�?
1. 生成相关资产能力
2. 服务调用能力
3. 来源：`@sdkwork/magic-studio-assets`

输出�?
1. 生成能力来源改为：`@sdkwork/magic-studio-assets/generation`
2. 服务能力来源改为：`@sdkwork/magic-studio-assets/services`

### 3.4 `packages/sdkwork-magic-studio-magiccut/src/components/Properties/panels/TextSettingsPanel.tsx`

输入�?
1. 文本生成相关能力
2. 来源：`@sdkwork/magic-studio-assets`

输出�?
1. 来源改为：`@sdkwork/magic-studio-assets/generation`

### 3.5 `packages/sdkwork-magic-studio-magiccut/src/components/Timeline/MagicCutTimelineToolbar.tsx`

输入�?
1. 时间线生成工具能�?2. 来源：`@sdkwork/magic-studio-assets`

输出�?
1. 来源改为：`@sdkwork/magic-studio-assets/generation`

### 3.6 `packages/sdkwork-magic-studio-magiccut/src/utils/generatedSelectionImport.ts`

输入�?
1. 已有资产映射与导入能�?2. 来源：`@sdkwork/magic-studio-assets`

输出�?
1. `asset-center` 能力来源改为：`@sdkwork/magic-studio-assets/asset-center`
2. 服务能力来源改为：`@sdkwork/magic-studio-assets/services`

### 3.7 `packages/sdkwork-magic-studio-magiccut/src/utils/magicCutTrackCoverImport.ts`

输入�?
1. 轨道封面导入能力
2. 来源：`@sdkwork/magic-studio-assets`

输出�?
1. 来源改为：`@sdkwork/magic-studio-assets/services`

### 3.8 `packages/sdkwork-magic-studio-magiccut/src/utils/assetUrlResolver.ts`

输入�?
1. 资源 URL 解析能力
2. 来源：`@sdkwork/magic-studio-assets`

输出�?
1. 来源改为：`@sdkwork/magic-studio-assets/asset-center`

### 3.9 `packages/sdkwork-magic-studio-magiccut/src/hooks/useResourceUrl.ts`

输入�?
1. 资源 URL hook
2. 来源：`@sdkwork/magic-studio-assets`

输出�?
1. 来源改为：`@sdkwork/magic-studio-assets/hooks`

### 3.10 `packages/sdkwork-magic-studio-magiccut/src/components/Resources/panels/*`

输入�?
1. 资源面板中的资产实体�?URL hook
2. 来源：`@sdkwork/magic-studio-assets`

输出�?
1. 实体类型来源改为：`@sdkwork/magic-studio-assets/entities`
2. hook 来源改为：`@sdkwork/magic-studio-assets/hooks`

### 3.11 `tests/magiccutAssetsSubpathBoundary.node.test.mjs`

输出�?
1. 锁定 12 �?`magiccut` 运行时文件不再从根入口取能力
2. 逐文件断言必须命中预期 focused subpath

---

## 4. 红灯 -> 绿灯闭环

1. 先新�?`tests/magiccutAssetsSubpathBoundary.node.test.mjs`
2. 验证红灯命中 broad root import
3. 逐文件做最小导入切�?4. 再跑边界测试、全�?node tests 与构�?
---

## 5. 验证结果

执行�?
1. `node --test tests/magiccutAssetsSubpathBoundary.node.test.mjs`
2. `pnpm run test:node`
3. `pnpm run build:test`

结果�?
1. 边界测试通过
2. 全量 node tests 通过
3. 构建通过

---

## 6. 结论

Round 13 �?`magiccut` 的主要运行时资产依赖切到了清晰的子路径边界，为下一轮继续清理资源面板与 domain 资产模型打下基础�?
---

## 7. 下一步计�?
1. 继续处理 `magiccut` 资源面板�?domain 资产状态层
2. 把类型、收藏、资源列表等剩余宽入口继续收�?3. 完成后再回看 `feature-assets-center` 是否仍异常偏�?