> Migrated from `docs/step/02-统一项目图谱与工程协议收敛.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step 02 - 统一项目图谱与工程协议收�?
## 1. 目标与范�?
�?step 用于建立统一 `ProjectGraph` 与跨 `workspace / project / film / magiccut / canvas` 的工程协议主干�?
### 1.1 执行输入

- `docs/架构/05-数据模型与资�?工程存储设计.md`
- `docs/架构/09-canvas-film-magiccut创作引擎设计.md`
- `docs/架构/15` 中架�?`Step 1`
- 关键文件�?  - `packages/sdkwork-magic-studio-workspace/src/services/workspaceService.ts`
  - `packages/sdkwork-magic-studio-editor/src/services/projectService.ts`
  - `packages/sdkwork-magic-studio-editor/src/services/index.ts`
  - `packages/sdkwork-magic-studio-types/src/project-graph.types.ts`
  - `packages/sdkwork-magic-studio-film/src/services/filmProjectService.ts`
  - `packages/sdkwork-magic-studio-magiccut/src/services/magicCutProjectService.ts`
  - `packages/sdkwork-magic-studio-canvas/src/services/canvasService.ts`

### 1.2 本步非目�?
- 不直接打�?AI 任务、资产落地、桌面导�?- 不在�?step 内完成三大引擎业务闭�?
### 1.3 最小输�?
- 单一 `ProjectGraph` 服务
- 三大引擎统一工程上下文绑�?- `projectService` �?mock 主路径职责中剥离

## 2. 架构对齐

- `docs/架构/04`
- `docs/架构/05`
- `docs/架构/09`
- `docs/架构/15` �?`Step 1`

## 3. 当前现状

当前已有 `project-graph.types.ts` 类型基础，但�?
- `projectService.ts` 仍承�?mock 交付职责
- 三大引擎尚未完全收敛到单一项目服务
- 项目上下文容易分散到引擎内私�?store �?service

## 4. 设计

### 4.1 主模型设�?
统一项目图谱必须覆盖�?
- `workspace`
- `project`
- `sequence / scene / shot`
- `timeline / track / clip`
- `publish-target`
- `surface binding`

### 4.2 主干约束

- 任何新增引擎能力不得再引入私有项目主模型
- `projectService` 只保留工程域协议与委托职�?- 旧工程兼容优先通过迁移层实现，不允许回退统一模型方向

## 5. 实施落地规划

### 5.1 关键代码�?
- `packages/sdkwork-magic-studio-editor/src/entities/projectGraph.entity.ts`
- `packages/sdkwork-magic-studio-editor/src/services/projectGraphService.ts`
- `packages/sdkwork-magic-studio-editor/src/services/projectGraphService.test.ts`
- `packages/sdkwork-magic-studio-film/src/services/filmProjectService.ts`
- `packages/sdkwork-magic-studio-magiccut/src/services/magicCutProjectService.ts`
- `packages/sdkwork-magic-studio-canvas/src/services/canvasService.ts`

### 5.2 实施顺序

1. 冻结 `ProjectGraph` 协议和迁移规�?2. 引入统一 `projectGraphService`
3. �?`projectService.ts` 剥离 mock 主路径职�?4. 接三大引擎项目打开、保存、绑定逻辑
5. 补齐迁移与绑定测�?
## 6. 测试计划

必须覆盖�?
- 图谱创建、读取、迁�?- `film / magiccut / canvas` 读取统一工程上下�?- 旧工程兼容和新工程创�?
## 7. 结果验证

```bash
pnpm exec vitest run packages/sdkwork-magic-studio-editor/src/services/projectGraphService.test.ts
pnpm exec vitest run packages/sdkwork-magic-studio-film/src/services/filmProjectService.test.ts
pnpm typecheck
```

预期结果�?
- 三大引擎不再新增私有项目主模�?- `projectService` 不再承担 mock 交付主路�?
## 8. 检查点

- `CP02-1`：`ProjectGraph` 字段与迁移规则冻�?- `CP02-2`：统一服务落地并接三大引擎
- `CP02-3`：测试通过，类型一�?- `CP02-4`：允许进入引擎与发布相关 step

## 9. 推荐并行执行

- step 级：可与 `Step 03-05` 并行
- 子任务级：类�?/ 服务 / 三引擎绑定可多子 agent 并行，但 `projectService.ts` 只能�?owner 持有

## 10. 风险与回�?
风险�?
- 旧工程兼容失�?- `projectService.ts` 与发�?step 冲突

回滚�?
- 保留迁移层和兼容读路�?- 不回滚统一项目模型方向

## 11. 完成定义

- `workspace / project / film / magiccut / canvas` 共享同一工程主干
- 后续步骤可复用统一 `ProjectGraph`

## 12. 下一步准入条�?
- `Step 06`、`07`、`08` 可基于统一工程主干开�?- `Step 11` 可在此基础上接入真实同步与发布服务


