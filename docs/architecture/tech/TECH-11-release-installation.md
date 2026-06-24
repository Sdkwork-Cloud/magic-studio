> Migrated from `docs/step/11-工程发布导出与安装交付闭环.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Step 11 - 工程发布导出与安装交付闭�?
## 1. 目标与范�?
�?step 用于将项目同步、导出、发布、安装包交付形成真实闭环，让产品从“能创作”进入“能交付”�?
### 1.1 执行输入

- `docs/架构/13-测试质量-安装部署-发布运维.md`
- `docs/架构/15` 中架�?`Step 10`
- 前置主干：`Step 02`、`Step 05`
- 关键文件�?  - `packages/sdkwork-magic-studio-editor/src/services/projectService.ts`
  - `packages/sdkwork-magic-studio-editor/src/services/projectPublishService.ts`
  - `packages/sdkwork-magic-studio-editor/src/services/projectSyncService.ts`
  - `packages/sdkwork-magic-studio-magiccut/src/services/export/videoExportService.ts`
  - `packages/sdkwork-magic-studio-magiccut/src/services/export/strategies/DesktopExportStrategy.ts`
  - `.github/workflows/release.yml`
  - `src-tauri/tauri.prod.conf.json`
  - `README.md`

### 1.2 本步非目�?
- 不在�?step 内引入复杂团队协作云服务
- 不在�?step 内扩展完整运营分发平�?
### 1.3 最小输�?
- 真实同步服务
- 真实发布服务
- 导出和发布链路一致�?- 安装与制品说�?
## 2. 架构对齐

- `docs/架构/01`
- `docs/架构/13`
- `docs/架构/15` �?`Step 10`

## 3. 当前现状

`projectService.ts` 中同步与发布仍为 mock，导致工程交付链路没有真实产品意义�?
## 4. 设计

### 4.1 交付主链�?
必须形成�?
`项目 -> 同步 -> 导出 -> 构建 -> 制品 -> 安装 / 发布说明`

### 4.2 关键约束

- `projectService.ts` 不再承担 mock 主路�?- 导出链路与桌面打包链路口径一�?- 发布 workflow 必须能被验证

## 5. 实施落地规划

1. 拆出 `projectSyncService` �?`projectPublishService`
2. 替换 mock 同步与发布逻辑
3. 对齐 MagicCut 导出与桌面制品链�?4. 完善 release workflow 与安装说�?
## 6. 测试计划

- 同步流程验证
- 发布流程验证
- Tauri 构建验证
- 制品校验脚本验证

## 7. 结果验证

```bash
pnpm exec vitest run packages/sdkwork-magic-studio-editor/src/services/projectPublishService.test.ts
pnpm tauri:build
pnpm verify:release:artifacts
```

## 8. 检查点

- `CP11-1`：同步与发布服务拆分完成
- `CP11-2`：mock 主路径移�?- `CP11-3`：制品验证通过
- `CP11-4`：交付主链路可进入总验�?
## 9. 推荐并行执行

- step 级：可与 `Step 10`、`12` 并行
- 子任务级：同步服务、发布服务、release workflow、导出适配可并行；`projectService.ts` �?`release.yml` �?owner

## 10. 风险与回�?
风险�?
- 真实同步依赖外部环境
- 发布脚本与项目服务改动冲�?
回滚�?
- 先回�?workflow 绑定和发布入�?- 不回滚新服务抽象

## 11. 完成定义

- 产品具备真实交付闭环

## 12. 下一步准入条�?
- `Step 13` 可将交付链路纳入总验�?

