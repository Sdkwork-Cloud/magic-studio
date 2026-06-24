> Migrated from `docs/step/06-Film引擎闭环与结构化影视创作.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step 06 - Film 引擎闭环与结构化影视创作

## 1. 目标与范�?
�?step 用于�?`film` 从影视工作台外壳推进为可生产、可保存、可生成、可预览的结构化影视创作引擎�?
### 1.1 执行输入

- `docs/架构/09-canvas-film-magiccut创作引擎设计.md`
- `docs/架构/15` 中架�?`Step 5`
- 前置主干�?  - `Step 02` 项目图谱
  - `Step 03` 资产主干
  - `Step 04` AI 任务主干
- 关键文件�?  - `packages/sdkwork-magic-studio-film/src/pages/FilmHomePage.tsx`
  - `packages/sdkwork-magic-studio-film/src/pages/FilmEditorPage.tsx`
  - `packages/sdkwork-magic-studio-film/src/services/filmService.ts`
  - `packages/sdkwork-magic-studio-film/src/services/filmProjectService.ts`
  - `packages/sdkwork-magic-studio-film/src/services/filmBusinessService.ts`
  - `packages/sdkwork-magic-studio-film/src/store/filmStore.tsx`
  - `packages/sdkwork-magic-studio-film/src/entities/film.entity.ts`

### 1.2 本步非目�?
- 不在�?step 内优化所有影视高级特效与模板生�?- 不在�?step 内承担发布与导出主链�?
### 1.3 最小输�?
- `Film` 项目可创建、打开、保�?- 角色 / 场景 / 道具 / 分镜可项目化或资产化
- AI 生成、预览、资产绑定闭环成�?
## 2. 架构对齐

- `docs/架构/03`
- `docs/架构/05`
- `docs/架构/09`
- `docs/架构/15` �?`Step 5`

## 3. 当前现状

`FilmEditorPage.tsx` 已形成专业工作台外壳，但真正闭环仍依赖：

- 统一项目图谱
- 统一资产绑定
- 统一 AI 任务记录

## 4. 设计

### 4.1 业务闭环

必须形成�?
`脚本 -> 角色 / 场景 / 道具 -> 分镜 -> 生成 -> 预览 -> 资产入库`

### 4.2 数据边界

- 结构实体挂到 `ProjectGraph`
- 媒体结果挂到资产中心
- AI 结果挂到任务中心

## 5. 实施落地规划

1. �?`Film` 读取统一 `ProjectGraph`
2. 让核心结构实体可持久化和资产�?3. �?Film AI 生成全部接统一任务中心
4. 打通预览与资产引用

## 6. 测试计划

- 项目创建、打开、保�?- 脚本和镜头结构编�?- 生成任务触发与结果回�?- 预览读取已绑定资�?
## 7. 结果验证

```bash
pnpm exec vitest run packages/sdkwork-magic-studio-film/src/services/filmService.test.ts
pnpm exec vitest run packages/sdkwork-magic-studio-film/src/services/filmProjectService.test.ts
pnpm typecheck
```

## 8. 检查点

- `CP06-1`：Film 接统一工程主干
- `CP06-2`：结构实体持久化与资产化成立
- `CP06-3`：AI 任务和预览链路成�?- `CP06-4`：Film 主链路可用于总验�?
## 9. 推荐并行执行

- step 级：可与 `Step 07`、`08`、`09` 并行
- 子任务级：项目接线、结构实体、AI 接线、预览验证可并行；写集限 `packages/sdkwork-magic-studio-film/*`

## 10. 风险与回�?
风险�?
- 旧页签状态与新项目模型冲�?- 预览和生成链路不一�?
回滚�?
- 允许保留兼容适配�?- 不允许回退到散装页签状态主�?
## 11. 完成定义

- `Film` 成为真实结构化影视创作引�?- 可进入总验收矩�?
## 12. 下一步准入条�?
- `Step 13` 可将 Film 纳入 E2E 主链路验�?

