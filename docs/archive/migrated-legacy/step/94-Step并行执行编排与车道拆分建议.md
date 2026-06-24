# Step并行执行编排与车道拆分建议

## 1. 文档定位

本文件不是简单回答“哪些 step 可以并行”，而是回答：

`如何把 00-13 拆成可安全并行的 lane，并且在多人或多子 agent 协作时不发生协议漂移、写集冲突、交接失控和伪完成。`

因此，本文件必须与 `87`、`89`、`92`、`98`、`99` 联合使用。

## 2. 并行执行总原则

最快且风险可控的执行方式不是“所有 step 全并行”，而是：

`串行主脊柱 + 波次内并行车道 + 上游冻结物交接 + 共享文件锁 + 固定合流窗口`

并行前提必须同时成立：

1. 当前 step 的开工卡已填写完成。
2. 上游提供物、冻结版本和验收 owner 已明确。
3. 共享文件 owner 已冻结。
4. 当前 lane 的写目录边界已冻结。
5. 当前 lane 已定义本地验证命令和回滚方式。

## 3. 必须严格串行的主脊柱

以下 step 不能被打散并行：

- `00`：冻结统一执行门禁
- `01`：冻结当前事实基线与优先级
- `13`：统一总验收与发布裁决

它们是整个 program 的“总控主脊柱”，必须严格串行。

## 4. 每个 Lane 的 Preflight Checklist

所有 lane 开工前，必须完成并记录以下 preflight：

| Lane | 必填前置项 | 必跑命令 | 样例/夹具 | 平台要求 |
| --- | --- | --- | --- | --- |
| Lane A/B/C/D | 基于 `01` 通过后的 base commit SHA 开工 | `pnpm run preflight:deps` `pnpm run typecheck` | 当前最小样例工程与基线文档 | 通用 Node/Pnpm 环境 |
| Lane E/F/G/C2 | 基于 `02-04` 冻结后的 base commit SHA 开工 | `pnpm run preflight:deps` `pnpm run test` `pnpm run build:git-sdk` | Film/MagicCut/Canvas 样例工程、动作样例 | 通用 Node/Pnpm 环境 |
| Lane D2/H | 基于 `05` 冻结后的 base commit SHA 开工 | `pnpm run preflight:deps` `pnpm run test` `pnpm run tauri:build` | 插件样例、交付样例、安装验证夹具 | Windows + Tauri 工具链 |
| Lane I | 基于 Wave B 可测主链路的 base commit SHA 开工 | `pnpm run preflight:deps` `pnpm run test` `pnpm run typecheck` | 性能基线样例、预算脚本夹具 | 通用 Node/Pnpm 环境 |

统一要求：

- 必须在交接包中写明 `base commit SHA`
- 必须写明当前 `MAGIC_STUDIO_VITE_MODE` 与 `MAGIC_STUDIO_SDK_MODE`
- 必须写明当前 lane 依赖的样例工程、假数据或测试夹具

## 5. 波次编排

### 5.1 Wave A：共享主干冻结

- Lane A：`02`
- Lane B：`03`
- Lane C：`04`
- Lane D：`05`

说明：Wave A 可以并行，但不允许交叉主改共享文件。

### 5.2 Wave B：核心创作闭环

- Lane E：`06`
- Lane F：`07`
- Lane G：`08`
- Lane C2：`09`

说明：Wave B 必须建立在 `02-05` 已冻结的共享主干上。  
`09` 可以并行，但只能基于已冻结动作面接入。

### 5.3 Wave C：生态、交付与治理

- Lane D2：`10`
- Lane H：`11`
- Lane I：`12`

说明：Wave C 必须建立在 Wave B 至少一条真实主链路已经可重复运行的前提上。

## 6. 上游 Lane -> 下游 Lane 依赖契约

| 提供方 | 消费方 | 提供物 | 冻结标记 | 验收命令 | 未满足时禁止动作 |
| --- | --- | --- | --- | --- | --- |
| Lane A | Lane E/F/G/H | `ProjectGraph`、项目协议、迁移规则 | `Step 02` 通过验收 | `pnpm run typecheck` `pnpm run test` | 禁止引擎与交付 lane 直接消费未冻项目主干 |
| Lane B | Lane E/F/G/D2/H | `assetId`、目录策略、资产主干接口 | `Step 03` 通过验收 | `pnpm run test` | 禁止业务 lane 裸路径落地或自建平行资产主干 |
| Lane C | Lane E/F/G/C2 | AI Task 协议、SDK 主路径、fallback 规则 | `Step 04` 通过验收 | `pnpm run test` `pnpm run audit:services` | 禁止业务 lane 私接模型或绕过任务中心 |
| Lane D | Lane D2/H | capability 白名单、命令分级、策略校验规则 | `Step 05` 通过验收 | `pnpm run test` `pnpm run tauri:build` | 禁止插件与交付 lane 绕过安全主干放权 |
| Lane E/F/G | Lane C2/H/I | 冻结后的动作面、主链路结果、可测场景 | 各自 step 达到解锁最低 bar | `pnpm run test` `pnpm run build:git-sdk` | 禁止 C2/H/I 消费仍在漂移的业务接口 |
| Lane C2 | Lane H/I | 冻结后的动作协议和反馈模型 | `Step 09` 达到解锁最低 bar | `pnpm run test` `pnpm run build:git-sdk` | 禁止交付与性能治理依赖实验性动作协议 |

## 7. Step 级并行矩阵

| Step | 所属 Lane | 可并行 Step | 必须串行点 | 共享冻结项 | 推荐子 agent 拆分 |
| --- | --- | --- | --- | --- | --- |
| `00` | 总控 | 无 | 全量串行 | 执行口径、门禁、命名规则 | 不拆 |
| `01` | 总控 | 无 | 全量串行 | 差距矩阵、优先级、owner | 不拆 |
| `02` | Lane A | `03` `04` `05` | `06` `07` `08` `11` 必须等待 | 项目协议、类型主干 | 类型协议、迁移策略、兼容治理 |
| `03` | Lane B | `02` `04` `05` | `06` `07` `08` `10` `11` 必须等待 | `assetId`、目录策略、存储层级 | identity、目录、回收恢复 |
| `04` | Lane C | `02` `03` `05` | `06` `07` `08` `09` 必须等待 | AI Task、主路径、fallback | 协议、路由、结果归档 |
| `05` | Lane D | `02` `03` `04` | `10` `11` 必须等待 | capability、白名单、命令分级 | capability 收敛、策略层、拒绝路径 |
| `06` | Lane E | `07` `08`，按动作面与 `09` 并行 | `11` 不得提前接未稳交付接口 | Film 数据模型、动作面、预览回写面 | 脚本/分镜、生成流程、预览回写 |
| `07` | Lane F | `06` `08`，按动作面与 `09` 并行 | 导出协议未稳时 `11` 必须等待 | 时间线模型、导出协议、恢复机制 | 时间线、导出、恢复模板 |
| `08` | Lane G | `06` `07`，按动作面与 `09` 并行 | 节点与资产协议未稳时下游必须等待 | 节点协议、结果归档、转换接口 | 节点执行、结果归档、下游转换 |
| `09` | Lane C2 | `06` `07` `08` | 动作协议未冻时必须暂停 | intent 协议、动作反馈模型 | intent 解析、动作执行、反馈闭环 |
| `10` | Lane D2 | `11` `12` | `policy.rs`/capability 变更必须经 Lane D 审批 | manifest、权限、沙箱、生命周期 | manifest、权限模型、运行时容器 |
| `11` | Lane H | `10` `12` | `projectService.ts` 移交前不得落码；主链路未稳不得放行 | 同步、导出、安装、workflow | 同步/发布、导出/安装、workflow |
| `12` | Lane I | `10` `11` | 指标基线未冻前不能设发布门禁 | 性能预算、观测点、预算脚本 | 基线、观测、脚本门禁 |
| `13` | 总控 | 无 | 全量串行 | 总验收矩阵、Go/No-Go 规则 | 不拆 |

## 8. 写集矩阵与 Overlap 串行点

`4` 个共享文件 owner 不足以支撑真正的多人并行，必须同时管理目录级重叠。

| Overlap 对 | 真实冲突区域 | 谁持有主 owner | 何时必须串行 |
| --- | --- | --- | --- |
| Lane B ↔ Lane E/F/G | 资产接口、资产引用、结果落地目录 | Lane B | `03` 未通过前，E/F/G 禁止改资产主干 |
| Lane C ↔ Lane C2 | AI 主协议、动作路由、反馈模型 | Lane C | `04` 未通过前，C2 禁止改 AI 主协议 |
| Lane C ↔ Lane E/F/G | AI 调用入口、任务归档 | Lane C | `04` 未通过前，E/F/G 禁止私接模型 |
| Lane D ↔ Lane D2/H | `policy.rs`、capability、命令分级 | Lane D | `05` 未通过前，D2/H 禁止接强能力 |
| Lane A ↔ Lane H | `projectService.ts`、发布/同步接口 | Lane A，后移交给 H | `02` 移交前必须串行 |
| Lane H ↔ Lane F | 导出接口、交付格式、工作流 | Lane F 提供导出能力，H 负责交付接入 | 导出协议未冻前必须串行 |
| Lane I ↔ Lane F/G | MagicCut/Canvas 真实指标采样点 | Lane F/G 负责业务点位，I 负责预算脚本 | 观测口径未冻前必须串行 |

## 9. 共享文件锁与移交流程

| 共享文件 | 锁定 owner | 解锁条件 | 合流前必须提交 |
| --- | --- | --- | --- |
| `projectService.ts` | Lane A | `02` 通过验收并有移交记录 | 变更说明、回滚方式、下游接口说明 |
| `genAIService.ts` | Lane C | `04` 通过验收并冻结主路径 | 协议变更说明、fallback 清单、验证命令 |
| `policy.rs` | Lane D | 长期由 Lane D 持有，只允许借写 | 安全批准、能力范围 diff、拒绝路径验证 |
| `default.json` | Lane D | `05` 通过验收后仍只允许收紧 | capability diff、安全批准 |
| `.github/workflows/release.yml` | Lane H | `11` 结束后释放 | workflow 变更说明、回滚方式、发布验证 |

## 10. 合流与升级节奏

| 时间点 | 必做动作 | 负责人 |
| --- | --- | --- |
| `09:30` | 共享协议站会，只讨论边界与冻结物变化 | 架构 owner |
| `11:30` | 共享文件锁状态确认 | 集成 owner |
| `14:00` | 阻塞升级窗口，按 `92` 处理 | 架构 owner + 集成 owner |
| `16:30` | 第一次合流和冲突处理 | 集成 owner |
| `18:00` | 各 lane 回填验证、风险、交接状态 | 各 Lane owner |

## 11. 必须立即停止并行的情形

出现以下任一情况，必须停止对应 lane 的并行推进：

1. 两个 lane 需要同时主改同一个共享文件。
2. 上游冻结物发生变化，但消费方尚未重新确认。
3. 当前 lane 的 review 证据、证明包或交接包不完整。
4. 当前 lane 没有本地验证结果却准备进入集成。
5. 当前 lane 通过放宽权限、保留 mock、绕过主干来制造“完成”。

## 12. 结论

真正能把总周期压短的，不是“更多 agent 同时改代码”，而是：

- 有冻结的上游提供物
- 有明确的 lane 写集边界
- 有严格的共享文件锁
- 有固定的合流窗口
- 有缺失证据即阻塞的硬规则

这也是本文件必须作为并行执行入口文档使用的原因。
