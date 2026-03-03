# Service Interface Standard (v1 Draft)

**Date:** 2026-03-02  
**Scope:** `packages/*` 全模块 service 封装统一与 SDK 接入预留

## 1. 目标

1. 所有“可变交互能力”必须通过 service 进入业务层，禁止在 `store/component/page` 中直接散落实现。
2. 通过统一 adapter seam（可注入适配器）为未来 SDK/远程服务替换预留扩展点。
3. 保持“渐进式推进”：先抽边界、再收敛实现、最后替换后端/SDK，不破坏现有功能。

## 2. 分层与职责

1. `UI 层 (components/pages)`：仅做展示与交互事件分发，不直接访问 `fetch/localStorage/navigator/invoke`。
2. `Store 层`：编排状态，不直接实现 IO 或平台调用。
3. `Service 层`：
   - `Business Service`：用例编排（跨 service 协同）。
   - `Domain Service`：领域逻辑。
   - `Infra Service`：平台能力（HTTP、存储、剪贴板、文件、Tauri）。
4. `Adapter 层`：`createServiceAdapterController(...)` 暴露注入点，允许 SDK 覆盖本地实现。

## 3. 文件与命名规范

1. 每个功能包推荐结构：
   - `src/services/<domain>Service.ts`
   - `src/services/<module>BusinessService.ts`
   - `src/services/index.ts`
2. “偏好/会话/布局”类能力也视为 service：
   - 示例：`authSessionService`、`noteLayoutService`、`filmPreferencesService`。
3. 禁止把业务级 IO helper 放在 `store/component` 内部匿名函数中。

## 4. 接口规范

1. 外部可失败业务能力优先使用显式返回契约：
   - `Promise<ServiceResult<T>>`（对齐现有 `@sdkwork/react-types`）。
2. 纯内部 helper 允许返回原始类型（如 `Promise<Uint8Array | undefined>`），但必须在 service 文件中定义与导出。
3. 不允许 `any` 暴露到公共 service API（仅可在适配边界做最小化收敛）。

## 5. 交互边界规则

1. 下列调用默认只能出现在 service 层：
   - `fetch(...)`
   - `localStorage/sessionStorage`
   - `navigator.clipboard`
   - `@tauri-apps/api/core.invoke(...)`
2. 基础设施例外（允许保留）：
   - `@sdkwork/react-core/src/platform/web.ts`
   - `@sdkwork/app-sdk-typescript/*`

## 6. SDK 接入预留标准

1. 每个业务模块至少一个可替换入口：
   - `setXxxBusinessAdapter(...)`
   - `getXxxBusinessAdapter(...)`
   - `resetXxxBusinessAdapter(...)`
2. 适配器接口必须聚合模块关键 service，禁止 UI 直接感知 SDK 客户端对象。

## 7. 渐进式落地节奏

1. Phase A：把散落交互迁移进 service（不改业务语义）。
2. Phase B：统一返回契约与错误模型。
3. Phase C：注入 SDK 适配器并灰度切换。
4. Phase D：删除旧调用路径与重复 helper。

## 8. 本轮已执行落地（2026-03-02）

1. 新增核心交互基础 service：`inlineDataService`（`data/blob` 二进制提取、文本抓取）。
2. 批量替换多模块重复 `tryExtractInlineData + fetch` 逻辑到 service。
3. 新增并接入会话/偏好 service：
   - `authSessionService`
   - `noteLayoutService`
   - `filmPreferencesService`
   - `assetUiStateService`
4. 组件剪贴板调用统一收口到平台 service（`platform.copy/paste`）。

## 9. 需要你确认的“标准不合理点”

1. 是否要求**所有** service 方法都强制 `ServiceResult<T>`？
   - 建议：仅对“跨边界业务调用”强制，底层 infra helper 保持轻量返回。
2. 是否要求**每个包**都必须有 `src/services`？
   - 建议：类型包/基础 SDK 包可豁免（例如 `react-types`、`app-sdk-typescript`）。
3. 是否要求零例外（包括 core/platform）？
   - 建议：`core/platform` 和 `app-sdk` 作为基础设施层保留平台直连是合理的。
