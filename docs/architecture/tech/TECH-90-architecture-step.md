> Migrated from `docs/step/90-架构能力-Step-代码目录-证据映射矩阵.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 架构能力 - Step - 代码目录 - 证据映射矩阵

## 1. 文档定位

本文件用于回答四个问题：

- 某项架构能力由哪�?step 落地
- 主要修改哪些代码目录
- 需要哪些验证证�?- 是否允许并行执行

## 2. 映射矩阵

| 架构能力 | 主要 Step | 主要代码目录 | 核心证据 | 串并行属�?|
| --- | --- | --- | --- | --- |
| 执行门禁与证据口�?| `00` | `docs/step/` | 索引、门禁、检查点、辅助治理文�?| 串行 |
| 基线审计与差距矩�?| `01` | `docs/架构/` `packages/` `src-tauri/` | 差距矩阵、高风险文件清单 | 串行 |
| 统一项目图谱 | `02` | `packages/sdkwork-magic-studio-editor/` `packages/sdkwork-magic-studio-types/` | `ProjectGraph` 服务、测试、三引擎绑定 | 可与 `03-05` 并行 |
| 统一资产主干 | `03` | `packages/sdkwork-magic-studio-assets/` `packages/sdkwork-magic-studio-film/` `packages/sdkwork-magic-studio-magiccut/` `packages/sdkwork-magic-studio-canvas/` | 资产测试、目录策略、跨模式读取 | 可与 `02`、`04`、`05` 并行 |
| AI 主路径与任务中心 | `04` | `packages/sdkwork-magic-studio-core/` `packages/sdkwork-magic-studio-chat/` `packages/sdkwork-magic-studio-prompt/` `packages/sdkwork-magic-studio-video/` | AI task 协议、任务中心测试、fallback 规则 | 可与 `02`、`03`、`05` 并行 |
| 桌面权限与运行时治理 | `05` | `src-tauri/` | capability 收敛、policy 校验、构建验�?| 可与 `02-04` 并行 |
| Film 闭环 | `06` | `packages/sdkwork-magic-studio-film/` | 项目、生成、预览链路测�?| �?`07-09` 并行 |
| MagicCut 闭环 | `07` | `packages/sdkwork-magic-studio-magiccut/` | 时间线、导出、工程恢复测�?| �?`06`、`08`、`09` 并行 |
| Canvas 闭环 | `08` | `packages/sdkwork-magic-studio-canvas/` | 节点执行、历史恢复、下游输出测�?| �?`06`、`07`、`09` 并行 |
| Chat / Prompt 动作�?| `09` | `packages/sdkwork-magic-studio-chat/` `packages/sdkwork-magic-studio-prompt/` `packages/sdkwork-magic-studio-core/` | 动作解析测试、跨模式动作验证 | �?`06-08` 并行 |
| 插件运行�?V1 | `10` | `packages/sdkwork-magic-studio-plugins/` `src-tauri/` | manifest、权限、沙箱、构建验�?| �?`11-12` 并行 |
| 工程发布交付闭环 | `11` | `packages/sdkwork-magic-studio-editor/` `packages/sdkwork-magic-studio-magiccut/` `.github/workflows/` | 同步/发布服务测试、制品校�?| �?`10`、`12` 并行 |
| 性能预算治理 | `12` | `src/app/` `packages/sdkwork-magic-studio-canvas/` `packages/sdkwork-magic-studio-magiccut/` `scripts/` | 预算矩阵、预算脚本、构建验�?| �?`10-11` 并行 |
| 集成联调与发布门�?| `13` | `docs/架构/` `docs/step/` 全仓 | E2E 矩阵、Go/No-Go 结论 | 串行 |

## 3. 使用方式

- 进入任一 step 前，先确认当前能力对应的代码目录和证据要�?- 若能力缺证据，不允许宣称 step 完成


