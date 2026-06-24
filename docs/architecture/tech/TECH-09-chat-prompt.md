> Migrated from `docs/step/09-Chat-Prompt动作层与对话式编辑闭环.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step 09 - Chat / Prompt 动作层与对话式编辑闭�?
## 1. 目标与范�?
�?step 用于�?`chat / prompt` 从文本建议工具推进为跨模式动作层，让自然语言能驱动真实工程动作和引擎动作�?
### 1.1 执行输入

- `docs/架构/03-功能矩阵与核心流�?md`
- `docs/架构/08-AI接入与多模态生成架�?md`
- `docs/架构/15` 中架�?`Step 8`
- 前置主干：`Step 04`
- 关键文件�?  - `packages/sdkwork-magic-studio-chat/src/services/chatService.ts`
  - `packages/sdkwork-magic-studio-prompt/src/services/promptBusinessService.ts`
  - `packages/sdkwork-magic-studio-prompt/src/pages/PromptOptimizerPage.tsx`
  - `packages/sdkwork-magic-studio-canvas/src/services/canvasActionService.tsx`
  - `packages/sdkwork-magic-studio-magiccut/src/services/magicCutPromptService.ts`
  - `packages/sdkwork-magic-studio-film/src/services/filmPromptService.ts`
  - `packages/sdkwork-magic-studio-core/src/ai/actionIntentResolver.ts`

### 1.2 本步非目�?
- 不一步覆盖所有复杂语言指令
- 不在�?step 内把插件动作也纳入协�?
### 1.3 最小输�?
- 统一动作协议
- `Chat / Prompt` 输出转结构化动作
- 至少驱动三大引擎中的最小动作集

## 2. 架构对齐

- `docs/架构/03`
- `docs/架构/08`
- `docs/架构/09`
- `docs/架构/15` �?`Step 8`

## 3. 当前现状

对话和提示词入口已存在，但仍更多承担文本建议与增强职责，尚未成为真实编辑主链路�?
## 4. 设计

### 4.1 动作协议

最少支持：

- 创建生成任务
- 绑定项目资源
- 修改引擎属�?- 插入节点 / 镜头 / 片段

### 4.2 接入策略

- 先接最小动作面
- 不允许三大引擎各自扩张动作协�?
## 5. 实施落地规划

1. 冻结 `actionIntentResolver` 与动�?schema
2. �?`chat / prompt` 输出转为结构化动�?3. �?`film / magiccut / canvas` 的最小动作集
4. 建立用户可感知的动作执行反馈

## 6. 测试计划

- 动作解析正确�?- 非法指令拒绝
- 跨模式动作执�?- 动作执行与工程状态一�?
## 7. 结果验证

```bash
pnpm exec vitest run packages/sdkwork-magic-studio-core/src/ai/actionIntentResolver.test.ts
pnpm exec vitest run packages/sdkwork-magic-studio-canvas/src/services/canvasActionService.test.ts
pnpm typecheck
```

## 8. 检查点

- `CP09-1`：动作协议冻�?- `CP09-2`：`chat / prompt` 输出结构化动�?- `CP09-3`：至少一条跨模式动作链路成功
- `CP09-4`：可进入总验收矩�?
## 9. 推荐并行执行

- step 级：可与 `Step 06-08` 并行，但必须后于 `Step 04`
- 子任务级：动作解析、UI 接线、三引擎动作适配可并行；协议文件�?owner

## 10. 风险与回�?
风险�?
- 自然语言解析不稳�?- 各引擎动作语义不一�?
回滚�?
- 先限制在最小动作面
- 不回退为纯文本建议主路�?
## 11. 完成定义

- 对话式编辑进入真实工程动作层

## 12. 下一步准入条�?
- `Step 13` 可将 Chat / Prompt 纳入主链路验�?

