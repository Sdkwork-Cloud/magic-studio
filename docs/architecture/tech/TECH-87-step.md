> Migrated from `docs/step/87-Step责任矩阵与串并行禁配清单.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step责任矩阵与串并行禁配清单

## 1. 文档定位

本文件回答三个最容易导致并行失控的问题：

1. 每个 step 到底谁负责拍板，谁负责实施，谁负责验收？
2. 哪些 step 可以并行，哪�?step 必须串行�?3. 多子 agent 或多人并行时，哪些目录与共享文件绝对不能抢改�?
本文件是 `94` 的责任底座，�?`99` 的组织前提，也是 `89` 执行卡中的角色与禁配来源�?
## 2. 核心角色定义

| 角色 | 主要职责 | 可以裁决的内�?| 必交付物 | 禁止行为 |
| --- | --- | --- | --- | --- |
| 架构 owner | 维护共享协议、主干边界、架构回写与 Go / No-Go 口径 | 共享协议冻结、能力是否兑�?| 协议冻结说明、架构回写结�?| 直接替代 lane owner 完成业务实现 |
| 产品/体验 owner | 保证交互闭环、创作体验与业务结果符合目标 | 业务体验取舍、交互闭环验�?| 关键流程验收结论 | 绕过架构与安全门禁做体验特判 |
| 集成 owner | 负责分支合流、共享文件锁、冲突处理、集成窗�?| 合流顺序、共享文件移交窗�?| 合流记录、冲突清单、集成结�?| 代替架构 owner 修改共享协议 |
| Lane owner | 对所�?step 的设计、落地、验证、回滚负�?| �?lane 的实现方案与节奏 | 代码、测试、验证、交接包 | 越权修改其他 lane 的共享主�?|
| QA owner | 负责统一验收矩阵与结果证�?| 是否允许通过验收 | 验收报告、缺陷回�?| 代替业务 owner 做方案设�?|
| 安全 owner | 负责权限、沙箱、命令能力、数据与本地安全 | 最小权限、命令分级、安全例�?| 安全评审结论、拒绝清�?| 在无验证情况下放宽权�?|
| 性能 owner | 负责预算、观测与性能门禁 | 指标阈值、性能回归裁决 | 预算矩阵、观测结果、门禁结�?| 用经验判断替代基准数�?|
| 发布 owner | 负责导出、安装、发布、workflow 与交付口�?| 发布链路是否可放�?| 发布说明、安装验证、回滚指�?| 在主链路未闭环时提前放量发布 |

## 3. Step 级责任矩�?
说明�?
- `A`：最终拍板责任人
- `R`：实施负责人
- `C`：必须协同角�?- `V`：验�?复核角色

| Step | A | R | C | V |
| --- | --- | --- | --- | --- |
| `00` | 架构 owner | 架构 owner + 集成 owner | QA owner | QA owner |
| `01` | 架构 owner | 架构 owner | �?Lane owner | QA owner |
| `02` | 架构 owner | Lane A | 集成 owner、QA owner | 架构 owner + QA owner |
| `03` | 架构 owner | Lane B | 集成 owner、安�?owner | 架构 owner + QA owner |
| `04` | 架构 owner | Lane C | 产品/体验 owner、安�?owner | 架构 owner + QA owner |
| `05` | 安全 owner | Lane D | 架构 owner、集�?owner | 安全 owner + QA owner |
| `06` | 产品/体验 owner | Lane E | Lane A、B、C、QA owner | 产品/体验 owner + QA owner |
| `07` | 产品/体验 owner | Lane F | Lane A、B、C、QA owner | 产品/体验 owner + QA owner |
| `08` | 产品/体验 owner | Lane G | Lane A、B、C、QA owner | 产品/体验 owner + QA owner |
| `09` | 产品/体验 owner | Lane C2 | Lane C、Lane E、F、G | 产品/体验 owner + QA owner |
| `10` | 安全 owner | Lane D2 | Lane D、产�?体验 owner | 安全 owner + QA owner |
| `11` | 发布 owner | Lane H | Lane A、Lane D、QA owner | 发布 owner + QA owner |
| `12` | 性能 owner | Lane I | �?Lane owner、QA owner | 性能 owner + QA owner |
| `13` | 架构 owner | 集成 owner + QA owner | 全部 Lane owner、发�?owner | 架构 owner + QA owner + 发布 owner |

## 4. 串行依赖与禁并行矩阵

| Step | 必须等待 | 可以并行 | 禁止并行 | 禁止原因 |
| --- | --- | --- | --- | --- |
| `00` | �?| �?| `01-13` | 执行口径和门禁未冻结前，不允许任何下游开�?|
| `01` | `00` | �?| `02-13` | 当前差距、优先级、共享文�?owner 未冻�?|
| `02` | `01` | `03` `04` `05` | `06` `07` `08` `11` 的主链路落码 | ProjectGraph 与工程协议未冻结 |
| `03` | `01` | `02` `04` `05` | `06` `07` `08` `10` `11` 的资产落地改�?| `assetId` 与目�?存储策略未冻�?|
| `04` | `01` | `02` `03` `05` | `06` `07` `08` `09` �?AI 主链路接�?| AI Task 协议与主路径未冻�?|
| `05` | `01` | `02` `03` `04` | `10` `11` 的能力放开与命令落�?| capability 与策略分级未冻结 |
| `06` | `02` `03` `04` | `07` `08`，可�?`09` 按冻结动作面并行 | `02` `03` `04` 未完成时强行开工；`11` 在未冻结交付接口时接主链�?| Film 依赖的项目、资产、AI 主干仍在漂移 |
| `07` | `02` `03` `04` | `06` `08`，可�?`09` 按冻结动作面并行 | `02` `03` `04` 未完成时强行开工；`11` 直接消费不稳定导出接�?| 剪辑时间线与导出协议会反复返�?|
| `08` | `02` `03` `04` | `06` `07`，可�?`09` 按冻结动作面并行 | `02` `03` `04` 未完成时强行开�?| 节点执行结果与资产归档接口不稳定 |
| `09` | `04`，并依赖 `06-08` 冻结动作�?| `06` `07` `08` | 直接抢改 `06-08` �?lane 主干文件 | 对话动作层只能基于冻结动作协议接�?|
| `10` | `05`，并依赖 Wave B 最小闭�?| `11` `12` | �?`05` 抢改 `policy.rs` / capability；绕�?Wave B 直接做插件能力承�?| 沙箱边界和权限粒度必须建立在安全主干�?|
| `11` | `02` `05`，并依赖 Wave B 最小闭�?| `10` `12` | �?`02` 抢改 `projectService.ts`；与 `05` 抢改桌面策略；在业务主链路未闭环时提前放�?| 交付链路不能依赖尚未冻结的主干接�?|
| `12` | `01`，并依赖 Wave B 主链路可�?| `10` `11` | 在没有统一场景和基线时宣告预算达成 | 性能门禁必须建立在真实链路和真实指标�?|
| `13` | `00-12` | �?| 与任何未验收 step 交叉推进 | 总验收必须基于已冻结证据�?|

## 5. 共享文件所有权与移交流�?
| 共享文件/目录 | 默认 owner | 可申请协作的 lane | 允许移交时机 | 禁止行为 |
| --- | --- | --- | --- | --- |
| `packages/sdkwork-magic-studio-editor/src/services/projectService.ts` | Lane A | Lane H | `02` 通过验收且已有移交记录后 | `02` �?`11` 同时主改 |
| `packages/sdkwork-magic-studio-types/` | Lane A | Lane E/F/G/C2/H | 类型协议冻结并经架构 owner 同意 | �?lane 私自新增并行版本类型 |
| `packages/sdkwork-magic-studio-assets/` 主干 | Lane B | Lane E/F/G/D2/H | `03` 通过验收后按接口协作 | 业务 lane 绕过资产中心直接落盘 |
| `packages/sdkwork-magic-studio-core/src/ai/genAIService.ts` | Lane C | Lane C2，E/F/G 通过协议申请 | `04` 冻结 AI 主路径后 | `04` �?`09` 无序抢改主协�?|
| `src-tauri/src/framework/services/policy.rs` | Lane D | Lane D2、Lane H | `05` 冻结命令分级与白名单�?| 插件或发�?lane 绕过安全 owner 改策�?|
| `src-tauri/capabilities/default.json` | Lane D | Lane D2、Lane H | `05` 冻结后仅允许收紧，不允许随意放宽 | 用临时放�?capability 换取进度 |
| `.github/workflows/release.yml` | Lane H | 集成 owner、发�?owner | `11` 开始时独占 | �?lane 同时修改发布工作�?|

移交流程必须包含以下四件事：

1. �?owner 明确说明当前冻结的接口、边界和禁改项�?2. 接收 owner 明确说明本次修改范围和回滚方式�?3. 集成 owner 记录移交开始与移交结束时间�?4. 合流后由 QA owner 复核是否破坏原冻结协议�?
## 6. 多子 agent 并行执行建议

推荐按“写目录边界”而不是按“概念主题”拆 agent�?
| Agent/Lane | 建议负责 Step | 主写目录 | 禁改目录 |
| --- | --- | --- | --- |
| Lane A | `02` | `packages/sdkwork-magic-studio-editor/` `packages/sdkwork-magic-studio-types/` | `assets` `src-tauri` `film` `magiccut` `canvas` |
| Lane B | `03` | `packages/sdkwork-magic-studio-assets/` | `editor` `src-tauri` `release` |
| Lane C | `04` | `packages/sdkwork-magic-studio-core/ai/` �?AI 主干模块 | `film` `magiccut` `canvas` 的业务主�?|
| Lane D | `05` | `src-tauri/` 安全与策略层 | 业务引擎目录 |
| Lane E | `06` | `packages/sdkwork-magic-studio-film/` | `projectService.ts` `policy.rs` |
| Lane F | `07` | `packages/sdkwork-magic-studio-magiccut/` | `projectService.ts` `policy.rs` |
| Lane G | `08` | `packages/sdkwork-magic-studio-canvas/` | `projectService.ts` `policy.rs` |
| Lane C2 | `09` | `chat` `prompt` 动作层与受控接入�?| 直接抢改 E/F/G 主干 |
| Lane D2 | `10` | 插件运行时与沙箱目录 | 绕过 D 直接�?capability/policy |
| Lane H | `11` | 发布、导出、安装、workflow | 在未移交前改 `projectService.ts` |
| Lane I | `12` | `scripts/`、性能检查、观测相�?| 业务功能目录主干 |
| QA/集成 | `13` | 验收矩阵、合流、验证脚�?| 业务方案设计与共享协议改�?|

## 7. 立即停止并行的场�?
出现以下任一情况，必须立刻停止相�?lane 的并行推进，转入串行治理�?
1. 两个 lane 需要同时主改同一个共享文件�?2. 当前 step 的共享协议还在漂移，但下�?lane 已经开始按该协议落码�?3. 当前 lane 没有完成本地验证，却试图进入集成分支�?4. 当前 lane 为追求进度临时放宽权限、跳过测试、保�?mock 主路径�?5. 当前 lane 无法提供回滚方法，却已经准备交接给下游�?
## 8. 结论

step 体系要做到“每一步做完都能完整兑现架构能力”，前提不是写更多任务，而是先把责任、边界、禁并行和共享文件主权彻底冻结�?
本文件的作用，就是确保每�?step 在真正开工前，已经回答清楚：

- 谁拍�?- 谁实�?- 谁验�?- 谁不能碰
- 什么时候才能并�?- 什么时候必须立刻停下来

