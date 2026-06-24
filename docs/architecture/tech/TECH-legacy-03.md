> Migrated from `docs/step/03-资产中心与本地存储闭环.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step 03 - 资产中心与本地存储闭�?
## 1. 目标与范�?
�?step 用于建立统一资产身份、统一目录布局、统一引用关系和统一删除回收策略，让所有模式都以资产中心为唯一落地主干�?
### 1.1 执行输入

- `docs/架构/05-数据模型与资�?工程存储设计.md`
- `docs/架构/15` 中架�?`Step 2`
- 关键文件�?  - `packages/sdkwork-magic-studio-assets/src/asset-center/application/AssetCenterService.ts`
  - `packages/sdkwork-magic-studio-assets/src/asset-center/application/magicStudioAssetLayout.ts`
  - `packages/sdkwork-magic-studio-assets/src/asset-center/domain/assetCenter.domain.ts`
  - `packages/sdkwork-magic-studio-film/src/utils/filmAssetIdentity.ts`
  - `packages/sdkwork-magic-studio-magiccut/src/services/AssetCacheService.ts`
  - `packages/sdkwork-magic-studio-canvas/src/utils/canvasIdentity.ts`

### 1.2 本步非目�?
- 不在�?step 内完成导出、发布、插件访问资�?- 不直接实现三大引擎完整业务功�?
### 1.3 最小输�?
- 统一 `assetId` 主引�?- 统一本地目录与存储层�?- 统一资产来源、派生、引用关�?
## 2. 架构对齐

- `docs/架构/04`
- `docs/架构/05`
- `docs/架构/09`
- `docs/架构/15` �?`Step 2`

## 3. 当前现状

`AssetCenterService.ts` 已具备统一资产主干能力，但各模式仍存在�?
- 裸路径或本地路径直连
- 资源 identity 不统一
- 引用关系与版本信息不完整

## 4. 设计

### 4.1 统一资产协议

所有资源引用必须至少包含：

- `assetId`
- `primaryResourceId`
- 必要 `metadata`
- �?`workspaceId / projectId / domain` 的绑定关�?
### 4.2 存储层级

统一固定�?
- `workspaces`
- `projects`
- `assets`
- `cache`
- `exports`
- `logs`

## 5. 实施落地规划

1. 冻结资产 identity 和目录布局
2. 替换三大引擎的裸路径或临�?URL 主引�?3. 补齐引用关系、来源、派生、版本信�?4. 固化删除回收和重命名策略

## 6. 测试计划

覆盖以下场景�?
- 本地导入
- 远程 URL 注册
- `film / magiccut / canvas` 通过 `assetId` 读取资产
- 删除、重命名、引用绑定、统�?
## 7. 结果验证

```bash
pnpm exec vitest run packages/sdkwork-magic-studio-assets/src/asset-center/application/AssetCenterService.test.ts
pnpm exec vitest run packages/sdkwork-magic-studio-canvas/src/services/canvasService.test.ts
pnpm exec vitest run packages/sdkwork-magic-studio-film/src/services/filmService.test.ts
pnpm typecheck
```

## 8. 检查点

- `CP03-1`：资�?identity 与目录策略冻�?- `CP03-2`：三大引擎主引用切换�?`assetId`
- `CP03-3`：资产测试与跨模式读取通过
- `CP03-4`：允许进入引擎与插件相关 step

## 9. 推荐并行执行

- step 级：可与 `Step 02`、`04`、`05` 并行
- 子任务级：资�?identity、目录策略、三引擎接线可并行；`AssetCenterService.ts` 需�?owner

## 10. 风险与回�?
风险�?
- 旧项目仍依赖裸路�?- 删除回收误伤本地文件

回滚�?
- 保留读取兼容�?- 删除策略先仅限受管目录，不扩到系统路�?
## 11. 完成定义

- 资产中心成为统一落地主干
- 三大引擎不再以裸路径作为主引�?
## 12. 下一步准入条�?
- `Step 06-08` 可基于统一资产协议开�?- `Step 10-11` 可在统一资产模型上构建插件与交付链路


