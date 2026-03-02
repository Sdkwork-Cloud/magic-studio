# Magic Studio Framework Standard Architecture (V1)

## 1. Objectives

1. Build one consistent base framework for all product domains:
   - notes
   - canvas
   - image studio
   - video studio
   - audio studio
   - music
   - voice speaker
   - magic cut / film editor
2. Enforce high cohesion and low coupling across packages.
3. Make browser mode and tauri mode share the same domain and UI contracts.
4. Standardize component IO contracts, events, and imperative handles.
5. Make future feature packages additive, not invasive.
6. Use `Character` as the unified role domain term across type, API, UI, and asset categories.

## 2. Package Layering

1. `@sdkwork/react-types`
   - Domain entities and cross-package contracts.
   - No UI logic.
2. `@sdkwork/react-core`
   - Runtime orchestration and platform abstractions.
   - Route, state primitives, common service patterns.
3. `@sdkwork/react-fs`, `@sdkwork/react-compression`, `@sdkwork/react-i18n`
   - Infrastructure capability layer.
4. `@sdkwork/react-commons`
   - Reusable UI primitives and framework composites.
   - No direct business rules.
5. `@sdkwork/react-assets` + `feature-*`
   - Business use cases, business components, business workflows.
6. App assembly layer (`src/app`, `src/layouts`)
   - Composition only.
   - No domain rule ownership.

## 3. Dependency Guardrails

1. `feature-*` packages can depend on:
   - `@sdkwork/react-types`
   - `@sdkwork/react-core`
   - `@sdkwork/react-commons`
   - infrastructure packages
2. `@sdkwork/react-commons` must never depend on `feature-*`.
3. `feature-*` packages should not depend on each other directly.
4. Cross-feature orchestration must happen through:
   - shared type contracts in `@sdkwork/react-types`
   - shared infra/service interfaces in `@sdkwork/react-core`
5. Naming guardrail:
   - avoid product-level terms that bind to a specific implementation detail
   - prefer `Character` instead of `Digital Human`

## 4. UI Component Hierarchy

1. Primitive components:
   - button, input, card, popover
2. Framework composite components:
   - `AppShell`
   - `ActionToolbar`
   - `DataPanel`
   - `SplitView`
   - `FormPanel`
   - `VirtualizedList`
   - `CommandPalette`
3. Business components:
   - `EntityCollectionPanel`
   - `AssetSidebar`
   - `MagicCutResourcePanel`
   - other domain panels

## 5. Standard Component Contract

### 5.1 Common Props (all framework components)

1. `id?: string`
2. `className?: string`
3. `style?: CSSProperties`
4. `testId?: string`

### 5.2 Common status semantics

1. `idle`
2. `loading`
3. `ready`
4. `empty`
5. `error`

### 5.3 Component IO and event contracts

1. `AppShell`
   - Input:
     - `header`, `sidebar`, `content`, `footer`
     - `sidebarCollapsed`, `defaultSidebarCollapsed`
     - `sidebarWidth`, `sidebarCollapsedWidth`
     - `theme`
   - Events:
     - `onSidebarCollapsedChange(collapsed)`
   - Methods:
     - `setSidebarCollapsed(collapsed)`
     - `toggleSidebar()`

2. `ActionToolbar`
   - Input:
     - `actions: ToolbarAction[]`
     - `compact`, `direction`, `stretch`, `align`
   - Events:
     - `onAction(actionId, action)`
   - Methods:
     - none

3. `DataPanel`
   - Input:
     - `items`, `itemKey`, `renderItem`
     - `selectMode`, `selectedKeys`, `defaultSelectedKeys`
     - `query`, `searchPlaceholder`
     - `loading`, `error`
   - Events:
     - `onSelectionChange(selectedKeys, meta)`
     - `onQueryChange(query)`
     - `onRetry()`
   - Methods:
     - `focusSearch()`
     - `clearSelection()`

4. `SplitView`
   - Input:
     - `direction`
     - `primary`, `secondary`
     - `primarySize`, `defaultPrimarySize`
     - `minPrimarySize`, `maxPrimarySize`, `minSecondarySize`
     - `resizable`, `dividerSize`
   - Events:
     - `onPrimarySizeChange(size, meta)`
     - `onResizeStart()`
     - `onResizeEnd(size)`
   - Methods:
     - `setPrimarySize(size)`
     - `resetPrimarySize()`

5. `FormPanel`
   - Input:
     - `fields: FormFieldDefinition[]`
     - `value`, `defaultValue`
     - `columns`, `disabled`, `loading`, `error`
     - `submitLabel`, `resetLabel`, `hideSubmit`, `hideReset`
   - Events:
     - `onValueChange(value, meta)`
     - `onSubmit(value, meta)`
     - `onReset(value)`
   - Methods:
     - `submit()`
     - `reset()`
     - `focusField(fieldKey)`

6. `VirtualizedList`
   - Input:
     - `items`, `itemKey`, `renderItem`
     - `itemHeight`, `overscan`, `height`
     - `loading`, `error`
   - Events:
     - `onRetry()`
     - `onReachEnd()`
   - Methods:
     - `scrollToTop()`
     - `scrollToIndex(index, align)`

7. `CommandPalette`
   - Input:
     - `commands: CommandPaletteCommand[]`
     - `open`, `defaultOpen`
     - `query`, `defaultQuery`
     - `loading`, `closeOnSelect`, `showGroupLabel`
   - Events:
     - `onOpenChange(open)`
     - `onQueryChange(query)`
     - `onSelect(command, meta)`
   - Methods:
     - `focusSearch()`
     - `clearQuery()`
     - `setOpen(open)`
     - `moveSelection(delta)`
     - `selectActive()`

## 6. API Standard (Spring Boot Pagination Contract)

### 6.1 Request standard

1. Request shape:
   - `page` (0-based)
   - `size`
   - `sort` (array or comma format, for example `updatedAt,desc`)
2. Optional business query:
   - `keyword`
   - `types`
   - `origins`
   - `scope`

### 6.2 Response standard

1. Keep Spring Boot page fields aligned:
   - `content`
   - `number`
   - `size`
   - `totalElements`
   - `totalPages`
   - `first`
   - `last`
   - `numberOfElements`
   - `empty`
2. Mapping adapters must be centralized and reusable:
   - normalize request once
   - map page response once
   - avoid package-local duplicate pagination adapters

## 7. Migration Rules

1. Migrate feature pages by replacing custom list/panel/shell blocks with framework composites.
2. Keep old feature behavior intact during each migration step:
   - same filter semantics
   - same selection semantics
   - same pagination semantics
3. Add one migration PR per feature surface:
   - assets
   - editor
   - magic cut
   - notes
4. Include typecheck checks for all touched packages in every migration step.

## 8. Current Iteration Deliverables

1. Added framework components in `@sdkwork/react-commons/components/framework`:
   - `SplitView`
   - `FormPanel`
   - `VirtualizedList`
   - `CommandPalette`
2. Expanded shared framework type contracts in `framework/types.ts`.
3. Exposed framework components and contracts from package public exports.
4. Migrated `AssetSidebar` to framework-based composition:
   - `ActionToolbar` for source filter actions
   - `DataPanel` for type filter list
5. Migrated `ChooseAssetModal` library body to framework layout:
   - `SplitView` for resizable sidebar/content structure
6. Migrated `ChooseAssetModal` shell to framework layout:
   - `AppShell` for header/content/footer composition
   - `CommandPalette` for standardized quick actions and keyboard UX
7. Unified role asset semantics:
   - removed `digital-human` / `digitalHuman` from core type and asset contracts
   - standardized role assets to `character`

## 9. Next Hardening Steps

1. Add docs playground or story coverage for framework composites.
2. Add lint rule or dependency guard to block cross-feature imports.
3. Migrate one major panel per feature package to framework components.
4. Add visual regression checks for panel and list interactions.
