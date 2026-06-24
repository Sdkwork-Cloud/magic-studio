> Migrated from `docs/step/10-插件运行时与权限沙箱V1.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step 10 - 插件运行时与权限沙箱 V1

## 1. 目标与范�?
�?step 用于把插件体系从页面壳与市场入口升级为具�?manifest、权限、沙箱、生命周期和最小能力暴露的真实插件运行时�?
### 1.1 执行输入

- `docs/架构/07-桌面运行时与本地能力架构.md`
- `docs/架构/12-安全架构与治理标�?md`
- `docs/架构/15` 中架�?`Step 9`
- 前置主干：`Step 05`
- 关键文件�?  - `packages/sdkwork-magic-studio-plugins/src/pages/PluginsPage.tsx`
  - `packages/sdkwork-magic-studio-plugins/src/services/pluginsBusinessService.ts`
  - `packages/sdkwork-magic-studio-plugins/src/services/index.ts`
  - `packages/sdkwork-magic-studio-plugins/src/types/pluginManifest.ts`
  - `packages/sdkwork-magic-studio-plugins/src/services/pluginRuntimeService.ts`
  - `packages/sdkwork-magic-studio-plugins/src/services/pluginPermissionService.ts`
  - `src-tauri/src/framework/services/policy.rs`
  - `src-tauri/src/framework/services/plugin_sandbox.rs`

### 1.2 本步非目�?
- 不在�?step 内完成插件市场生态运营能�?- 不开放高风险系统级权�?
### 1.3 最小输�?
- `Plugin Manifest`
- 权限申请与校�?- 沙箱目录和生命周期服�?
## 2. 架构对齐

- `docs/架构/04`
- `docs/架构/07`
- `docs/架构/12`
- `docs/架构/15` �?`Step 9`

## 3. 当前现状

`pluginsBusinessService.ts` 为空适配器，说明插件当前停留在入口层而非平台运行时层�?
## 4. 设计

### 4.1 Manifest 结构

至少包含�?
- `id`
- `version`
- `entry`
- `capabilities`
- `requiredPermissions`
- `sandboxScope`

### 4.2 权限边界

- 未声明权限不得运�?- 未通过校验不得加载
- 插件默认只能访问沙箱目录和显式暴露能�?
## 5. 实施落地规划

1. 定义 manifest 类型和解析流�?2. 建立插件权限申请与校验服�?3. 建立沙箱目录与运行时生命周期
4. 与桌面策略层联动

## 6. 测试计划

- manifest 解析与校�?- 权限申请成功 / 失败
- 未授权插件禁止运�?- 沙箱目录隔离

## 7. 结果验证

```bash
pnpm exec vitest run packages/sdkwork-magic-studio-plugins/src/services
pnpm typecheck
pnpm tauri:build
```

## 8. 检查点

- `CP10-1`：manifest 冻结
- `CP10-2`：权限校验流程成�?- `CP10-3`：沙箱目录与生命周期成立
- `CP10-4`：插件主链路可进入总验�?
## 9. 推荐并行执行

- step 级：可与 `Step 11-12` 并行，但必须后于 `Step 05`
- 子任务级：manifest、权限服务、沙箱服务可并行；`policy.rs` 和插件注册表需�?owner

## 10. 风险与回�?
风险�?
- 插件能力暴露过宽
- 运行时隔离不完整

回滚�?
- 先限制能力集
- 不回退到无权限校验的插件页面壳

## 11. 完成定义

- 插件具备平台级最小运行时闭环

## 12. 下一步准入条�?
- `Step 13` 可将插件纳入安装、权限申请、运行主链路验收


