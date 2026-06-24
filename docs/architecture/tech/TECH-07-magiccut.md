> Migrated from `docs/step/07-MagicCut剪辑引擎闭环.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step 07 - MagicCut 剪辑引擎闭环

## 1. 目标与范�?
�?step 用于�?`MagicCut` 从剪辑工作台外壳推进为具备素材导入、时间线编辑、播放器预览、模板保存、真实导出的可生产剪辑引擎�?
### 1.1 执行输入

- `docs/架构/09-canvas-film-magiccut创作引擎设计.md`
- `docs/架构/15` 中架�?`Step 6`
- 前置主干：`Step 02`、`Step 03`、`Step 04`
- 关键文件�?  - `packages/sdkwork-magic-studio-magiccut/src/components/MagicCutEditor.tsx`
  - `packages/sdkwork-magic-studio-magiccut/src/store/magicCutStore.tsx`
  - `packages/sdkwork-magic-studio-magiccut/src/store/projectState.ts`
  - `packages/sdkwork-magic-studio-magiccut/src/services/magicCutProjectService.ts`
  - `packages/sdkwork-magic-studio-magiccut/src/services/magicCutBusinessService.ts`
  - `packages/sdkwork-magic-studio-magiccut/src/services/TimelineEditService.ts`
  - `packages/sdkwork-magic-studio-magiccut/src/services/TimelineOperationService.ts`
  - `packages/sdkwork-magic-studio-magiccut/src/services/export/videoExportService.ts`
  - `packages/sdkwork-magic-studio-magiccut/src/services/export/strategies/DesktopExportStrategy.ts`

### 1.2 本步非目�?
- 不在�?step 内完成高级模板生态和特效市场
- 不在�?step 内完成项目级发布

### 1.3 最小输�?
- 统一时间线资产引�?- 真实桌面导出链路
- 工程保存、恢复、模板闭�?
## 2. 架构对齐

- `docs/架构/03`
- `docs/架构/05`
- `docs/架构/09`
- `docs/架构/15` �?`Step 6`

## 3. 当前现状

`MagicCutEditor.tsx` 已形成专业剪辑工作台，但仍需解决�?
- 时间线仍可能保留旁路资源引用
- 导出需要统一桌面能力而非临时实现
- 模板、工程恢复与真实项目图谱仍待统一

## 4. 设计

### 4.1 主链�?
必须形成�?
`导入 -> 时间线编�?-> 播放预览 -> 属性修�?-> 保存恢复 -> 导出`

### 4.2 关键约束

- 时间线资源主引用必须切到 `assetId`
- 导出必须通过桌面策略�?- 工程保存必须挂到 `ProjectGraph`

## 5. 实施落地规划

1. 替换时间线资源引用为统一资产协议
2. 打�?`projectState` �?`ProjectGraph`
3. 将导出链路切到真实桌面导出策�?4. 补齐模板保存与工程恢�?
## 6. 测试计划

- 时间线增删改查和拖拽编辑
- 播放器与属性联�?- 模板保存与恢�?- 桌面导出构建验证

## 7. 结果验证

```bash
pnpm exec vitest run packages/sdkwork-magic-studio-magiccut/src/services
pnpm typecheck
pnpm tauri:build
```

## 8. 检查点

- `CP07-1`：时间线资产引用统一
- `CP07-2`：工程保存恢复闭环成�?- `CP07-3`：真实导出路径可构建
- `CP07-4`：MagicCut 主链路可进入总验�?
## 9. 推荐并行执行

- step 级：可与 `Step 06`、`08`、`09` 并行
- 子任务级：时间线服务、导出服务、模板恢复可并行；写集限 `packages/sdkwork-magic-studio-magiccut/*`

## 10. 风险与回�?
风险�?
- 真实导出链路不稳
- 旧时间线资源引用未迁净

回滚�?
- 可保留受控降级导�?- 不回退到旁路资源引用主路径

## 11. 完成定义

- `MagicCut` 成为真实可生产剪辑引�?
## 12. 下一步准入条�?
- `Step 13` 可将 MagicCut 纳入主链路验�?

