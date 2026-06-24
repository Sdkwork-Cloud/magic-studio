> Migrated from `docs/step/08-Canvas工作流引擎闭环.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step 08 - Canvas 工作流引擎闭�?
## 1. 目标与范�?
�?step 用于�?`Canvas` 从交互画板推进为具备节点创建、连接、执行、历史恢复、资产入库、下游输出能力的工作流引擎�?
### 1.1 执行输入

- `docs/架构/09-canvas-film-magiccut创作引擎设计.md`
- `docs/架构/15` 中架�?`Step 7`
- 前置主干：`Step 02`、`Step 03`、`Step 04`
- 关键文件�?  - `packages/sdkwork-magic-studio-canvas/src/components/CanvasBoard.tsx`
  - `packages/sdkwork-magic-studio-canvas/src/store/canvasStore.tsx`
  - `packages/sdkwork-magic-studio-canvas/src/services/canvasService.ts`
  - `packages/sdkwork-magic-studio-canvas/src/services/canvasGenerationService.ts`
  - `packages/sdkwork-magic-studio-canvas/src/services/canvasHistoryService.ts`
  - `packages/sdkwork-magic-studio-canvas/src/services/canvasExportService.ts`
  - `packages/sdkwork-magic-studio-canvas/src/services/canvasToCutConverter.ts`
  - `packages/sdkwork-magic-studio-canvas/src/services/canvasActionService.tsx`

### 1.2 本步非目�?
- 不追求一步完成全部节点生�?- 不在�?step 内完成插件节点生态市�?
### 1.3 最小输�?
- 统一节点输入输出协议
- 节点执行结果进入资产中心
- 历史、恢复、下游导出闭�?
## 2. 架构对齐

- `docs/架构/05`
- `docs/架构/08`
- `docs/架构/09`
- `docs/架构/15` �?`Step 7`

## 3. 当前现状

`CanvasBoard.tsx` 已具备高级交互与性能设计，但当前仍需把：

- 节点执行
- 资产回写
- 历史恢复
- 输出�?`MagicCut` 或其它模�?
真正收敛到统一工程主干�?
## 4. 设计

### 4.1 主链�?
必须形成�?
`节点编排 -> 节点执行 -> 结果入资�?-> 历史恢复 -> 向下游输出`

### 4.2 关键约束

- 节点结果不能只停留在内存状�?- 节点协议不能脱离统一 AI Task 与资产协�?
## 5. 实施落地规划

1. 冻结节点输入输出协议
2. 打通执行结果入资产中心
3. 补齐历史快照和恢�?4. 打通导出到 `MagicCut` 或其它引擎的转换能力

## 6. 测试计划

- 节点执行成功 / 失败
- 历史 undo / redo / restore
- 节点结果进入资产中心
- 转换到下游模式的正确�?
## 7. 结果验证

```bash
pnpm exec vitest run packages/sdkwork-magic-studio-canvas/src/services
pnpm exec vitest run packages/sdkwork-magic-studio-canvas/src/store
pnpm typecheck
```

## 8. 检查点

- `CP08-1`：节点协议冻�?- `CP08-2`：执行结果进入资产中�?- `CP08-3`：历史恢复和导出能力成立
- `CP08-4`：Canvas 主链路可进入总验�?
## 9. 推荐并行执行

- step 级：可与 `Step 06`、`07`、`09` 并行
- 子任务级：节点协议、执行结果、历史恢复、下游转换可并行；写集限 `packages/sdkwork-magic-studio-canvas/*`

## 10. 风险与回�?
风险�?
- 节点协议�?AI Task 协议不一�?- 历史恢复影响交互性能

回滚�?
- 可先保留资产输出，再逐步打开到下游转�?
## 11. 完成定义

- `Canvas` 成为真实工作流引擎而不是纯交互画板

## 12. 下一步准入条�?
- `Step 13` 可将 Canvas 纳入主链路验�?

