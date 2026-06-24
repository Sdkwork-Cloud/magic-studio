> Migrated from `docs/step/01-现状基线冻结与差距审计.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step 01 - 现状基线冻结与差距审�?
## 1. 目标与范�?
�?step 用于把当�?`magic-studio-v2` 的真实实现状态冻结为单一事实来源，并明确与目标架构之间的差距、优先级和高风险点�?
### 1.1 执行输入

- `docs/架构/00-当前实现审计与架构事实基�?md`
- `docs/架构/14-行业对标-评估标准与演进路�?md`
- `docs/架构/15-架构落地步骤-并行实施计划.md`
- 关键代码事实文件�?  - `package.json`
  - `src/router/registry.tsx`
  - `packages/sdkwork-magic-studio-editor/src/services/projectService.ts`
  - `packages/sdkwork-magic-studio-plugins/src/services/pluginsBusinessService.ts`
  - `packages/sdkwork-magic-studio-core/src/ai/genAIService.ts`
  - `src-tauri/capabilities/default.json`
  - `src-tauri/src/framework/services/policy.rs`

### 1.2 本步非目�?
- 不直接修�?mock、空适配器或权限过宽问题
- 不直接收敛项目图谱、资产中心、AI 主干
- 不提前启动三大引擎重�?
### 1.3 最小输�?
- 差距矩阵
- 高风险文件清�?- 优先级序�?- 串并行实施准入条�?
## 2. 架构对齐

�?step 直接对齐�?
- `docs/架构/00`
- `docs/架构/01`
- `docs/架构/02`
- `docs/架构/14`
- `docs/架构/15`

## 3. 当前现状

当前已知事实�?
- `projectService.ts` 中同步和发布仍为 mock
- `pluginsBusinessService.ts` 为空适配�?- `genAIService.ts` 同时存在 SDK 主路径和 `@google/genai` 直连路径
- `default.json` 仍存�?`fs:scope = **`
- `ProjectGraph` 已有类型基础，但服务主干尚未完全收敛

## 4. 设计

### 4.1 差距分类

差距必须按以下四类归档：

- 主干缺口：项目、资产、AI、权限、发布主干未完全收敛
- 引擎缺口：`film / magiccut / canvas / chat-prompt` 主链路未闭环
- 治理缺口：插件、性能、安全、发布门禁不完整
- 交付缺口：E2E 验收、Go/No-Go、回滚和文档回写不完�?
### 4.2 优先级原�?
优先级必须遵守：

1. 先主干，后引�?2. 先共享协议，后业务接�?3. 先安全门禁，后生态扩�?4. 先交付能力，后非主链路增�?
## 5. 实施落地规划

### 5.1 审计子任�?
- 审计项目与发布主干：`projectService.ts`
- 审计插件主干：`pluginsBusinessService.ts`
- 审计 AI 主干：`genAIService.ts`
- 审计桌面权限面：`default.json` + `policy.rs`
- 审计三大引擎主入口：`FilmEditorPage.tsx`、`MagicCutEditor.tsx`、`CanvasBoard.tsx`

### 5.2 关键输出

- 把高风险共享文件 owner 固定到后�?lane
- �?`Step 02-13` 的前置依赖和并行禁区明确
- 把“允许保留的兼容层”和“必须淘汰的 mock / 空壳”分开

## 6. 测试计划

验证重点�?
- 差距是否精确映射�?`docs/架构/15` 的主步骤
- 高风险文件是否已识别完全
- 优先级是否支持最短关键路�?
## 7. 结果验证

建议验证命令�?
```bash
rg -n "Mock|mock|publish|syncToGitHub" packages/sdkwork-magic-studio-editor/src/services/projectService.ts
rg -n "Record<string, never>" packages/sdkwork-magic-studio-plugins/src/services/pluginsBusinessService.ts
rg -n "@google/genai|createGeneration|streamChat|streamArticle" packages/sdkwork-magic-studio-core/src/ai/genAIService.ts
rg -n "\"fs:scope\"|\"path\": \"\\*\\*\"" src-tauri/capabilities/default.json
```

预期结果�?
- 所有关键短板均可由命令和文件直接定�?
## 8. 检查点

- `CP01-1`：关键短板与高风险文件清单冻�?- `CP01-2`：差距映射到 `Step 02-13`
- `CP01-3`：共享文�?owner 与并行禁区冻�?- `CP01-4`：允许进入共享主干实�?
## 9. 推荐并行执行

- step 级：必须串行，先�?`Step 02-05`
- 子任务级：可并行审计 AI、插件、发布、桌面权限、三大引擎入�?
## 10. 风险与回�?
风险�?
- 差距审计不完整导致后续实施顺序错�?- 低估共享主干风险，导致并行冲�?
回滚�?
- 若优先级设定不合理，只回滚差距矩阵和 lane 分配，不回滚事实基线

## 11. 完成定义

- 差距矩阵和高风险文件清单已经可直接指导实�?- `Step 02-05` 的输入边界清�?- 共享主干与引擎实施的先后顺序冻结

## 12. 下一步准入条�?
- 项目、资产、AI、桌面权限四条主干的 owner 已明�?- 不允许在未冻结共享协议前启动引擎收敛


