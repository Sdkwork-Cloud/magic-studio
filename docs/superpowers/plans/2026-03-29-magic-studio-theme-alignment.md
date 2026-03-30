# Magic Studio Theme Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align `magic-studio-v2` to the theme, shell, and UI standards used by `claw-studio` without changing product behavior.

**Architecture:** Extend the existing settings-driven theme runtime so it exposes `themeMode + themeColor + shell tokens`, then refactor root CSS and shared shell components to consume those tokens. Keep current route/layout structure, but converge every layout wrapper onto one common visual baseline.

**Tech Stack:** React, TypeScript, Tailwind CSS v4, Vitest, local workspace packages

---

### Task 1: Extend Appearance Settings With Theme Color

**Files:**
- Modify: `packages/sdkwork-react-settings/src/entities/settings.entity.ts`
- Modify: `packages/sdkwork-react-settings/src/constants.ts`
- Modify: `packages/sdkwork-react-settings/src/data/definitions.ts`
- Modify: `packages/sdkwork-react-settings/src/services/settingsService.ts`
- Test: `packages/sdkwork-react-settings/tests/themeAppearanceSettings.test.ts`

- [ ] **Step 1: Write the failing test**

Add a test that loads legacy settings without `appearance.themeColor`, verifies the default aligned theme color is injected, and verifies updates preserve the value.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/sdkwork-react-settings/tests/themeAppearanceSettings.test.ts`
Expected: FAIL because `themeColor` is not part of the model yet.

- [ ] **Step 3: Write minimal implementation**

Add `themeColor` to the settings entity, defaults, and settings normalization path. Add appearance control metadata for the new select field.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/sdkwork-react-settings/tests/themeAppearanceSettings.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

Do not commit unless explicitly requested by the user.

### Task 2: Rebuild Theme Runtime And Root Tokens

**Files:**
- Modify: `src/app/theme/types.ts`
- Modify: `src/app/theme/ThemeManager.ts`
- Modify: `src/index.css`
- Test: `src/app/theme/ThemeManager.test.ts`

- [ ] **Step 1: Write the failing test**

Add tests that verify the theme manager applies `data-theme`, toggles `.dark`, applies typography variables, and preserves sidebar position attributes.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/app/theme/ThemeManager.test.ts`
Expected: FAIL because `data-theme` and aligned token behavior are not implemented.

- [ ] **Step 3: Write minimal implementation**

Refactor the theme manager to drive the new theme attributes and rebuild root CSS tokens to mirror the `claw-studio` shell approach.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/app/theme/ThemeManager.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

Do not commit unless explicitly requested by the user.

### Task 3: Align Main Shell Header And Sidebar

**Files:**
- Modify: `src/layouts/MainLayout/MainLayout.tsx`
- Modify: `src/layouts/MainLayout/MainGlobalHeader.tsx`
- Modify: `src/layouts/MainLayout/MainSidebar.tsx`
- Modify: `src/layouts/MainLayout/MainSidebar.test.tsx`
- Test: `src/layouts/MainLayout/MainSidebar.test.tsx`

- [ ] **Step 1: Write the failing test**

Add or update shell tests to assert the aligned header/sidebar structure, shell attributes, and settings-driven sidebar rendering still work.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/layouts/MainLayout/MainSidebar.test.tsx`
Expected: FAIL because the shell contract does not yet match the aligned design.

- [ ] **Step 3: Write minimal implementation**

Refactor the main header, sidebar, and main frame to use aligned shell surfaces, spacing, active states, hover treatments, and resize/collapse affordances.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/layouts/MainLayout/MainSidebar.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

Do not commit unless explicitly requested by the user.

### Task 4: Converge Secondary Layouts And Settings Shell

**Files:**
- Modify: `src/layouts/GenerationLayout/GenerationLayout.tsx`
- Modify: `src/layouts/CreationLayout/CreationLayout.tsx`
- Modify: `src/layouts/NotesLayout/NotesLayout.tsx`
- Modify: `src/layouts/VibeLayout/VibeLayout.tsx`
- Modify: `src/layouts/MagicCutLayout/MagicCutLayout.tsx`
- Modify: `packages/sdkwork-react-settings/src/pages/SettingsPage.tsx`
- Test: `src/layouts/MagicCutLayout/MagicCutLayoutHeader.test.tsx`

- [ ] **Step 1: Write the failing test**

Update a representative layout/header test to expect aligned surfaces and ensure settings page shell still renders under the new token model.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/layouts/MagicCutLayout/MagicCutLayoutHeader.test.tsx`
Expected: FAIL because the layout chrome still uses divergent colors and framing.

- [ ] **Step 3: Write minimal implementation**

Replace per-layout hard-coded backgrounds/borders with shared shell token classes and align settings page structure to the new shell vocabulary.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/layouts/MagicCutLayout/MagicCutLayoutHeader.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

Do not commit unless explicitly requested by the user.

### Task 5: Regression Verification

**Files:**
- Modify: any remaining theme-affected files discovered during cleanup
- Test: project-wide targeted verification commands

- [ ] **Step 1: Run focused tests**

Run: `pnpm test src/app/theme/ThemeManager.test.ts src/layouts/MainLayout/MainSidebar.test.tsx src/layouts/MagicCutLayout/MagicCutLayoutHeader.test.tsx packages/sdkwork-react-settings/tests/themeAppearanceSettings.test.ts`
Expected: PASS

- [ ] **Step 2: Run broader app test suite**

Run: `pnpm test`
Expected: PASS

- [ ] **Step 3: Run build verification**

Run: `pnpm build:git-sdk`
Expected: exit code 0

- [ ] **Step 4: Run lint verification if needed**

Run: `pnpm lint`
Expected: exit code 0

- [ ] **Step 5: Commit**

Do not commit unless explicitly requested by the user.
