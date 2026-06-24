> Migrated from `docs/step/95-架构能力闭环验收标准.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 架构能力闭环验收标准

## 1. 文档定位

本文件回答的不是“代码有没有改完”，而是：

`当前 step 是否已经把对应的架构能力真实落地，并且足以支撑下游继续推进与最终发布裁决。`

因此，本文件是每个 step 收尾前的强制裁决标准。

## 2. 强制联读矩阵

在使用本文件前，必须同时准备以下材料：

- `88`：能力兑现证明包
- `89`：当前 step 的开工卡与收尾卡
- `90`：架构章节、代码目录、证据映射
- `91`：质量审计与复盘
- `97`：架构回写与能力兑现回执
- `98`：lane 交接包

任一材料缺失，当前 step 不允许进入通过裁决。

## 3. 通过模型

每个 step 都必须同时通过两套门槛：

### 3.1 解锁最低 bar

含义：下游 step 可以开始依赖当前 step 的最低门槛。

要求：

- 关键协议或接口已经冻结
- 上游提供物已经可交接
- 有最小可重复验证路径
- 有最小回滚说明

### 3.2 能力完工 bar

含义：当前 step 可以正式宣告“架构能力已兑现”的最终门槛。

要求：

- 真实主链路闭环成立
- must-run 命令全部通过
- 证明包、review 文档、架构回写全部完成
- 兼容层、迁移、回滚都已记录且状态明确

### 3.3 评级方式

| 评级 | 条件 |
| --- | --- |
| `领先` | 解锁最低 bar、能力完工 bar 全部满足，且无开放例外项 |
| `合格` | 能力完工 bar 满足，但存在明确记录的后续优化项 |
| `不通过` | 任意硬门槛不满足，或存在一票否决项 |

## 4. Step 级验收矩阵

| Step | 架构章节 | 解锁最低 bar | 能力完工 bar | must-run 命令 | 证据落点 | 兼容 / 迁移 / 回滚要求 | 一票否决 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `00` | `00` `15` | 主步骤与治理文档齐备，执行规则可统一引用 | 全体 lane 已按统一门禁开工，无悬空规则 | `rg -n "^## " docs/step/README.md docs/step/00-总实施原则与执行门禁.md docs/step/89-Step逐步执行卡与完工判定总表.md` | `docs/review/*step-00*.md`、`docs/step/README.md` | 说明本轮规则替换了哪些旧口径；回滚到旧口径的方法 | 没有门禁、没有 review 产物、没有 No-Go 规则 |
| `01` | `00` `14` `15` | 差距、优先级、共享 owner、风险台账冻结 | 当前仓库核心短板被完整映射到后续 step | `rg -n "projectService|genAIService|policy.rs|default.json|pluginsBusinessService" docs/架构 docs/step` | `docs/review/*step-01*.md`、差距审计文档 | 说明允许保留的兼容层、待迁移项与风险升级路径 | 只有问题列表，没有 owner、优先级或风险分级 |
| `02` | `04` `05` `09` `15` | `ProjectGraph`、项目协议、迁移规则冻结并可供消费 | 三大引擎共享同一项目主干，不再新增私有项目模型 | `pnpm run typecheck` `pnpm run test` `pnpm run audit:services` | `docs/review/*step-02*.md`、`docs/step/evidence/step-02/` | 说明历史工程迁移规则、兼容层保留范围、回滚到旧主干的方法 | 仍存在新私有项目模型，或 `projectService.ts` 仍以 mock 为主路径 |
| `03` | `05` `09` `15` | `assetId`、目录策略、引用方式冻结 | 关键资源统一经资产中心落地，旧引用已迁移或受控 | `pnpm run test` `pnpm run typecheck` | `docs/review/*step-03*.md`、`docs/step/evidence/step-03/` | 说明旧路径兼容保留时长、迁移脚本、历史工程回归夹具 | 业务 lane 仍可绕过资产中心直接落盘 |
| `04` | `08` `15` | AI Task 协议、SDK 主路径、fallback 规则冻结 | AI 主路径统一进入任务中心，fallback 已降级为受控兼容层 | `pnpm run test` `pnpm run audit:services` `pnpm run typecheck` | `docs/review/*step-04*.md`、`docs/step/evidence/step-04/` | 说明保留 fallback 的失效时间、迁移计划和回滚方式 | 仍允许业务层自由直连模型，形成平行 AI 主架构 |
| `05` | `07` `12` `15` | capability 范围、命令分级、策略校验冻结 | 最小权限模型成立，拒绝路径有效，能力不会因交付要求被放宽 | `pnpm run test` `pnpm run tauri:build` | `docs/review/*step-05*.md`、`docs/step/evidence/step-05/` | 说明旧 capability 兼容范围、回滚能力与不可逆变更 | 通过放宽 `default.json` 或跳过策略校验换取进度 |
| `06` | `03` `06` `09` `15` | 至少一条 Film 主链路可重复跑通 | Film 形成“脚本 -> 分镜 -> 生成 -> 预览 -> 回写”闭环，失败路径清晰 | `pnpm run test` `pnpm run build:git-sdk` | `docs/review/*step-06*.md`、`docs/step/evidence/step-06/` | 说明旧 Film 流程兼容方式、数据迁移与回滚路径 | 只有页面演示，没有工程回写和失败路径验证 |
| `07` | `03` `06` `09` `15` | 至少一条导入-编辑-导出链路可跑通 | MagicCut 形成“导入 -> 编辑 -> 导出 -> 恢复”闭环 | `pnpm run test` `pnpm run build:git-sdk` | `docs/review/*step-07*.md`、`docs/step/evidence/step-07/` | 说明旧导出链路兼容、模板迁移和回滚策略 | 导出仍是演示态或恢复链路不存在 |
| `08` | `03` `06` `09` `15` | 至少一条节点执行到结果归档链路可跑通 | Canvas 形成“节点 -> 执行 -> 结果归档 -> 下游输出”闭环 | `pnpm run test` `pnpm run build:git-sdk` | `docs/review/*step-08*.md`、`docs/step/evidence/step-08/` | 说明旧节点结果兼容、转换迁移与回滚方式 | 结果仍停留在内存态或演示态 |
| `09` | `03` `08` `09` `15` | 至少一条自然语言动作链路可跑通 | Chat / Prompt 可以执行真实动作，并给出成功/失败反馈 | `pnpm run test` `pnpm run build:git-sdk` | `docs/review/*step-09*.md`、`docs/step/evidence/step-09/` | 说明旧建议式交互如何兼容、动作协议版本与回滚方式 | 仍只输出建议文本，不驱动真实动作 |
| `10` | `07` `12` `15` | 插件可加载、可拒绝、可卸载 | manifest、权限、沙箱、生命周期与拒绝路径全部成立 | `pnpm run test` `pnpm run tauri:build` | `docs/review/*step-10*.md`、`docs/step/evidence/step-10/` | 说明 V0 插件兼容策略、权限迁移、沙箱回滚方式 | 只有插件页或配置页，没有真实运行时闭环 |
| `11` | `01` `13` `15` | 至少一条工程到交付链路可跑通 | 同步、导出、安装、发布进入真实交付链路，mock 主路径降级 | `pnpm run build:git-sdk` `pnpm run verify:release:artifacts` `pnpm run tauri:build` | `docs/review/*step-11*.md`、`docs/step/evidence/step-11/` | 说明历史交付方式兼容、迁移与回滚手段 | `syncToGitHub` / `publishApp` 仍是未标记的 mock 主路径 |
| `12` | `11` `14` `15` | 性能预算项、观测点和基线已冻结 | 性能进入预算、观测、门禁三件套治理，且指标来自真实链路 | `pnpm run verify:iam-route-css-budget` `pnpm run test` `pnpm run typecheck` | `docs/review/*step-12*.md`、`docs/step/evidence/step-12/` | 说明历史指标兼容、基线迁移、门禁回滚方式 | 没有真实基线却宣告预算达标 |
| `13` | `13` `14` `15` | 总验收矩阵、Go/No-Go 清单齐备 | 能基于统一证据证明 `docs/架构/01-15` 核心能力已兑现并给出最终裁决 | `pnpm run test` `pnpm run typecheck` `pnpm run build:git-sdk` `pnpm run tauri:bundle:verified` | `docs/review/*step-13*.md`、总验收报告、发布回执 | 说明若 No-Go 时如何回滚到上一稳定版本 | 在证据缺失、例外未关闭或主链路未闭环时口头放行 |

## 5. 例外登记册

只有在以下信息齐备时，例外才能被暂时接受：

```md
## 例外事项
## 影响 Step
## 批准人
## 失效时间
## 补偿验证
## 是否阻塞宣告完成
```

规则：

- 未登记的例外视为违规，不允许通过。
- 例外默认阻塞“能力完工 bar”，除非明确写明仅不阻塞“解锁最低 bar”。
- 例外到期未关闭，必须回退到 `不通过` 状态。

## 6. 统一不通过条件

出现以下任一情况，当前 step 直接判定 `不通过`：

1. `must-run` 命令未执行或无结果摘要。
2. 没有 `docs/review/` 产物。
3. 没有证明包。
4. 没有架构回写或回写与实际实现不一致。
5. 没有兼容层、迁移、回滚说明。
6. 把“解锁最低 bar”误当作“能力完工 bar”。

## 7. 结论

本文件把“闭环验收”从主观判断变成了显式门槛、显式命令、显式证据和显式例外。  
只要任一显式门槛不成立，就不能宣告当前 step 已完整兑现架构能力。

