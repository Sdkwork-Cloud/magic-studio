> Migrated from `docs/step/05-桌面权限收敛与运行时治理.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step 05 - 桌面权限收敛与运行时治理

## 1. 目标与范围

本 step 用于建立 Tauri 运行时的最小权限模型、路径白名单、命令分级和高风险能力策略校验。

### 1.1 执行输入

- `docs/架构/07-桌面运行时与本地能力架构.md`
- `docs/架构/12-安全架构与治理标准.md`
- `docs/架构/15` 中架构 `Step 4`
- 关键文件：
  - `src-tauri/capabilities/default.json`
  - `src-tauri/src/framework/services/policy.rs`
  - `src-tauri/src/framework/services/filesystem.rs`
  - `src-tauri/src/framework/services/media.rs`
  - `src-tauri/src/framework/services/jobs.rs`
  - `src-tauri/src/framework/services/toolkit.rs`

### 1.2 本步非目标

- 不在本 step 内完成插件运行时本体
- 不在本 step 内完成发布闭环

### 1.3 最小输出

- 工作区级路径白名单
- 命令风险分级
- 高风险能力统一策略校验

## 2. 架构对齐

- `docs/架构/07`
- `docs/架构/12`
- `docs/架构/15` 的 `Step 4`、`Step 9`、`Step 10`

## 3. 当前现状

当前已存在 `policy.rs` 策略服务，但：

- `default.json` 仍将 `fs:scope` 放开到 `**`
- `shell / process / http` 等权限仍过宽
- 策略服务与 capability 层尚未完全闭环

## 4. 设计

### 4.1 路径白名单

只允许：

- workspace root
- assets root
- cache root
- exports root
- plugin sandbox root

### 4.2 命令分级

至少分为：

- 只读信息
- 工作区内读写
- 删除 / 重命名
- 媒体执行
- 外部命令 / shell

## 5. 实施落地规划

1. 收紧 `default.json` 的路径与权限范围
2. 扩展 `policy.rs` 的命令和路径分级规则
3. 让文件删除、媒体执行、作业执行统一走策略校验
4. 输出桌面能力范围矩阵

## 6. 测试计划

- 路径访问允许 / 拒绝
- 危险命令允许 / 拒绝
- 工作区内关键能力可用
- 发布版构建可通过

## 7. 结果验证

```bash
pnpm tauri:build
pnpm verify:release:artifacts
pnpm typecheck
```

同时检查：

```bash
rg -n "\"fs:scope\"|\"path\": \"\\*\\*\"" src-tauri/capabilities/default.json
```

## 8. 检查点

- `CP05-1`：路径白名单冻结
- `CP05-2`：命令风险分级冻结
- `CP05-3`：关键运行时能力进入策略层
- `CP05-4`：允许进入插件与交付 step

## 9. 推荐并行执行

- step 级：可与 `Step 02-04` 并行
- 子任务级：capability 收敛、policy 扩展、服务接线可并行；`policy.rs` 需单 owner

## 10. 风险与回滚

风险：

- 权限收紧过度影响现有功能
- 工作区路径识别不准确

回滚：

- 允许暂时回退到工作区级宽白名单
- 不允许回退到全局 `**`

## 11. 完成定义

- 桌面运行时达到最小权限基本标准
- 插件、发布、导出所需安全主干就绪

## 12. 下一步准入条件

- `Step 10`、`11` 可以安全启动
- 三大引擎后续涉及桌面能力时必须走策略层


