# Magic Studio 基础框架标准体系（V1）

## 1. 当前架构主要不足（面向扩展的风险点）

1. 组件分布过散，通用 UI 与业务 UI 边界不稳定。
2. 各业务包重复实现列表、工具栏、面板、布局壳，交互一致性不足。
3. 组件输入输出契约不统一，事件命名、状态语义、可测试属性缺少统一标准。
4. 主题与设计令牌未沉淀为统一层，业务页面直接写样式，导致迁移成本高。
5. 包职责有交叉，基础能力被业务包反向依赖的风险较高。

## 2. 目标架构（高内聚、低耦合、前瞻扩展）

### 2.1 分层原则

1. `@sdkwork/react-types`
：领域模型、分页模型、组件契约类型，零 UI 依赖。
2. `@sdkwork/react-core`
：平台能力、路由、状态与通用服务抽象。
3. `@sdkwork/react-fs` / `@sdkwork/react-compression` / `@sdkwork/react-i18n`
：基础设施层。
4. `@sdkwork/react-commons`
：通用 UI 与框架级组合组件（无具体业务语义）。
5. `@sdkwork/react-assets` + `feature-*` 业务包
：业务组件、业务流程、业务状态。
6. `src/app` 与 `src/layouts`
：应用装配层（仅组合，不承载领域规则）。

### 2.2 组件分级体系

1. Primitive（原子组件）
：Button、Input、Card、Popover。
2. Composite（组合组件）
：AppShell、ActionToolbar、DataPanel。
3. Business（业务组件）
：EntityCollectionPanel、MagicCutResourcePanel、CanvasBoard。

## 3. 通用组件契约规范

### 3.1 统一输入字段

1. `id`
：组件实例 ID。
2. `className`
：外部样式扩展入口。
3. `style`
：内联样式扩展入口。
4. `testId`
：测试定位入口。

### 3.2 统一状态语义

1. `idle`
2. `loading`
3. `ready`
4. `empty`
5. `error`

### 3.3 统一事件语义

1. 事件回调必须携带最小必要 payload。
2. 关键组件支持显式 `meta`（来源、选中状态、触发方式）。
3. 复杂组件提供 `ref handle` 暴露方法（如 `focusSearch`、`clearSelection`）。

## 4. 已落地的框架内核（本次迭代）

已在 `@sdkwork/react-commons` 新增 `components/framework`：

1. `types.ts`
：定义组件契约与事件/选择模型。
2. `tokens.ts`
：定义框架主题令牌与 CSS Variable 映射。
3. `AppShell.tsx`
：统一应用壳布局（header/sidebar/content/footer）。
4. `ActionToolbar.tsx`
：统一操作栏协议与动作定义。
5. `DataPanel.tsx`
：统一数据面板协议（搜索、状态、选择、空态、错误态）。
6. `EntityCollectionPanel.tsx`
：业务集合面板基类，可直接复用于项目、场景、素材清单。

## 5. 组件输入/输出/事件/方法示例（标准）

### 5.1 `DataPanel`

1. 输入（Props）
：`items`、`itemKey`、`renderItem`、`selectMode`、`query`、`loading`、`error`。
2. 输出（Render）
：统一 header/body/empty/error/loading 容器。
3. 事件（Callbacks）
：`onQueryChange`、`onSelectionChange`、`onRetry`。
4. 方法（Ref Handle）
：`focusSearch()`、`clearSelection()`。

### 5.2 `AppShell`

1. 输入（Props）
：`header`、`sidebar`、`content`、`footer`、`sidebarCollapsed`、`theme`。
2. 事件（Callbacks）
：`onSidebarCollapsedChange`。
3. 方法（Ref Handle）
：`setSidebarCollapsed()`、`toggleSidebar()`。

## 6. 后续演进建议（按优先级）

1. 将各 feature 包现有“列表 + 工具栏 + 面板壳”逐步迁移到 `DataPanel`/`ActionToolbar`。
2. 在 `@sdkwork/react-types` 新增 `ComponentContract` 子模块，统一跨包组件契约类型。
3. 补充 `FormPanel`、`SplitView`、`CommandPalette` 等高复用组合组件。
4. 建立组件可视化验收（Storybook 或 docs playground）与交互规范快照测试。
5. 建立 `feature-*` 目录规范与依赖守卫，禁止 feature 横向耦合。

