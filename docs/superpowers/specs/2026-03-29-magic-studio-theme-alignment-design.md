# Magic Studio Theme Alignment Design

**Date:** 2026-03-29

**Goal**

Align `apps/magic-studio-v2` with the shell, theme tokens, and UI standards used by `apps/claw-studio` while preserving existing product routes, business behavior, and page capabilities.

**Constraints**

- Product behavior, routing semantics, and existing feature entry points must remain intact.
- Theme alignment must cover both visible style and the underlying theme/runtime model.
- The refactor must preserve existing settings-driven typography and sidebar customization where practical.

**Reference Baseline**

- `apps/claw-studio/packages/sdkwork-claw-shell/src/styles/index.css`
- `apps/claw-studio/packages/sdkwork-claw-shell/src/application/layouts/MainLayout.tsx`
- `apps/claw-studio/packages/sdkwork-claw-shell/src/components/AppHeader.tsx`
- `apps/claw-studio/packages/sdkwork-claw-shell/src/components/Sidebar.tsx`
- `apps/claw-studio/packages/sdkwork-claw-shell/src/application/providers/ThemeManager.tsx`

**Architecture**

1. Theme foundation

Introduce a `data-theme + .dark` driven token model in `magic-studio-v2`, mirroring the `claw-studio` approach. Root CSS will expose primary color scales, scrollbar tokens, shared surface colors, and backdrop/focus styles. The existing `appearance` settings model will be extended so runtime theme state can drive these tokens instead of relying on scattered hard-coded hex values.

2. Shell foundation

Unify the app frame around a shared shell language: top header, sidebar, main surface, edge affordances, and panel chrome should use one consistent set of spacing, borders, radii, elevation, and overlay treatments. Existing layout types remain, but each layout should inherit the same shell vocabulary rather than carrying isolated visual rules.

3. Layout convergence

`main`, `generation`, `creation`, `notes`, `vibe`, `magic-cut`, and `blank` layouts continue to serve different business flows, but their frame colors, backgrounds, borders, and transitions will be normalized to the aligned shell tokens. This keeps route-specific structure while eliminating style divergence.

4. Settings convergence

Settings must expose the aligned theme model. `appearance` should support theme mode, theme color, font settings, and sidebar position in a way that feeds the same theme manager and root attributes used across the app.

**Components Affected**

- Global theme runtime
- Settings data model and appearance controls
- Main header
- Main sidebar
- Main content surface
- Shared layout wrappers
- Settings page shell and visible controls
- Route loading state shell

**Error Handling**

- Missing or invalid persisted theme color should fall back to the default aligned theme.
- Existing saved settings without the new theme color field should be normalized during load and continue to work.
- Theme initialization failures should degrade to safe defaults instead of blocking app render.

**Testing Strategy**

- Add tests for theme manager behavior around `data-theme`, dark mode, and sidebar position.
- Add settings service/store coverage for defaulting and persisting the new theme color property.
- Add layout/header/sidebar tests where behavior or rendered class contracts are stable enough to verify.
- Run focused tests first, then full project tests/build for regression evidence.
