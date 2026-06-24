> Migrated from `docs/step/04-AI网关与统一任务中心收敛.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step 04 - AI 网关与统一任务中心收敛

## 1. 目标与范�?
�?step 用于将当�?AI 双路径收敛为“后�?SDK 主路�?+ 受控 fallback”，并建立统一任务中心和统一结果归档逻辑�?
### 1.1 执行输入

- `docs/架构/08-AI接入与多模态生成架�?md`
- `docs/架构/15` 中架�?`Step 3`
- 关键文件�?  - `packages/sdkwork-magic-studio-core/src/ai/genAIService.ts`
  - `packages/sdkwork-magic-studio-core/src/sdk/useAppSdkClient.ts`
  - `packages/sdkwork-magic-studio-video/src/services/videoService.ts`
  - `packages/sdkwork-magic-studio-prompt/src/services/promptBusinessService.ts`
  - `packages/sdkwork-magic-studio-chat/src/services/chatService.ts`

### 1.2 本步非目�?
- 不在�?step 内完成所有对话式动作执行
- 不在�?step 内实现插件调�?AI

### 1.3 最小输�?
- 统一 AI Task 协议
- 统一主路径、fallback、审计规�?- 统一结果进入资产中心

## 2. 架构对齐

- `docs/架构/08`
- `docs/架构/09`
- `docs/架构/15` �?`Step 3`、`Step 8`

## 3. 当前现状

`genAIService.ts` 已具备生成能力，但当前同时存在：

- SDK 路径
- `@google/genai` 直连流式路径
- 各业务服务可能按场景自行接入

这会导致任务协议、成本治理、错误处理和审计分裂�?
## 4. 设计

### 4.1 AI Task 协议

必须统一�?
- `taskId`
- `scene`
- `model`
- `provider`
- `status`
- `progress`
- `inputRefs`
- `outputAssetRefs`
- `cost`
- `errorCode`

### 4.2 主路径规�?
- 生产路径默认先走 backend SDK
- 直连模型只允许以显式 fallback 存在
- fallback 必须带配置开关、审计点和退出计�?
## 5. 实施落地规划

1. 冻结 `aiTaskCenter` 协议
2. 收拢 `genAIService.ts` 主路�?3. �?`chat / prompt / video` 接统一任务中心
4. 将输出结果统一写入资产中心
5. 为后�?`Step 09` 预留动作协议基础

## 6. 测试计划

- 任务创建、轮询、取消、失�?- SDK 主路径成功与 fallback 触发
- 结果归档到资产中�?- `film / canvas` �?AI 产物读取一�?
## 7. 结果验证

```bash
pnpm exec vitest run packages/sdkwork-magic-studio-core/src/ai/aiTaskCenter.test.ts
pnpm exec vitest run packages/sdkwork-magic-studio-film/src/services/filmService.test.ts
pnpm exec vitest run packages/sdkwork-magic-studio-canvas/src/services/canvasGenerationService.test.ts
pnpm typecheck
```

## 8. 检查点

- `CP04-1`：AI Task 协议冻结
- `CP04-2`：SDK 主路�?/ fallback 规则冻结
- `CP04-3`：生成结果统一进入资产中心
- `CP04-4`：允许进入引擎和动作�?step

## 9. 推荐并行执行

- step 级：可与 `Step 02`、`03`、`05` 并行
- 子任务级：任务协议、主路径收敛、业务接线可并行；`genAIService.ts` 需�?owner

## 10. 风险与回�?
风险�?
- 主路径切换导致部分生成场景退�?- fallback 无边界扩�?
回滚�?
- 只保留受�?fallback，不回退到双主干并存

## 11. 完成定义

- AI 架构收敛为单一主路�?- 统一任务中心和统一结果归档成立

## 12. 下一步准入条�?
- `Step 06-09` 可基于统一 AI 任务主干接入能力


