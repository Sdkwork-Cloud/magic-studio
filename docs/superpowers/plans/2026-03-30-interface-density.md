# Interface Density Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add stable shell density presets and one-shot Auto recommendation without introducing runtime font-size drift.

**Architecture:** Introduce a small appearance-density domain service that owns preset metrics, Auto recommendation, and legacy normalization. Keep persisted shell typography as the source of truth, then let settings UI drive density selection and advanced manual overrides through that service.

**Tech Stack:** React, TypeScript, Vitest, Tailwind CSS, settings/theme runtime

---

### Task 1: Add Density Domain Model

**Files:**
- Modify: `packages/sdkwork-react-settings/src/entities/settings.entity.ts`
- Modify: `src/app/theme/types.ts`
- Create: `packages/sdkwork-react-settings/src/services/appearanceDensityService.ts`
- Test: `packages/sdkwork-react-settings/tests/appearanceDensityService.test.ts`

- [ ] **Step 1: Write the failing test**

Cover preset metrics, Auto recommendation thresholds, scale-factor cap, and manual-custom behavior.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/sdkwork-react-settings/tests/appearanceDensityService.test.ts`
Expected: FAIL because the density service and types do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Add `densityMode`, preset constants, Auto recommendation, legacy inference, and helper functions to apply preset/custom updates.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/sdkwork-react-settings/tests/appearanceDensityService.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

Do not commit unless explicitly requested by the user.

### Task 2: Normalize Settings And Theme Runtime

**Files:**
- Modify: `packages/sdkwork-react-settings/src/constants.ts`
- Modify: `packages/sdkwork-react-settings/src/services/settingsService.ts`
- Modify: `packages/sdkwork-react-settings/tests/themeAppearanceSettings.test.ts`
- Modify: `src/app/theme/ThemeManager.ts`
- Modify: `src/app/theme/ThemeManager.test.ts`

- [ ] **Step 1: Write the failing test**

Extend settings/theme tests to verify legacy settings gain a normalized density mode and the theme manager emits density metadata.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/sdkwork-react-settings/tests/themeAppearanceSettings.test.ts src/app/theme/ThemeManager.test.ts`
Expected: FAIL because density normalization and output attributes are not implemented.

- [ ] **Step 3: Write minimal implementation**

Persist `densityMode` in defaults and normalization, then apply `data-density` in the theme runtime alongside existing typography variables.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/sdkwork-react-settings/tests/themeAppearanceSettings.test.ts src/app/theme/ThemeManager.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

Do not commit unless explicitly requested by the user.

### Task 3: Ship Appearance Density UI

**Files:**
- Create: `packages/sdkwork-react-settings/src/components/AppearanceSettings.tsx`
- Modify: `packages/sdkwork-react-settings/src/components/index.ts`
- Modify: `packages/sdkwork-react-settings/src/data/definitions.ts`
- Modify: `packages/sdkwork-react-settings/src/pages/SettingsPage.tsx`

- [ ] **Step 1: Write the failing test**

Prefer a source guard or focused unit test that asserts the appearance page exposes density selection and keeps advanced font controls available.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test packages/sdkwork-react-settings/tests/appearanceDensityService.test.ts packages/sdkwork-react-settings/tests/themeAppearanceSettings.test.ts`
Expected: FAIL or remain incomplete because the appearance UI is not wired yet.

- [ ] **Step 3: Write minimal implementation**

Render a dedicated appearance panel for density selection, show the current Auto recommendation, provide a re-recommend action, and mark manual font/line-height changes as `custom`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test packages/sdkwork-react-settings/tests/appearanceDensityService.test.ts packages/sdkwork-react-settings/tests/themeAppearanceSettings.test.ts src/app/theme/ThemeManager.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

Do not commit unless explicitly requested by the user.

### Task 4: Final Verification

**Files:**
- Verify only

- [ ] **Step 1: Run focused tests**

Run: `pnpm test packages/sdkwork-react-settings/tests/appearanceDensityService.test.ts packages/sdkwork-react-settings/tests/themeAppearanceSettings.test.ts src/app/theme/ThemeManager.test.ts`
Expected: PASS

- [ ] **Step 2: Run lint on touched files**

Run: `pnpm exec eslint packages/sdkwork-react-settings/src/components/AppearanceSettings.tsx packages/sdkwork-react-settings/src/constants.ts packages/sdkwork-react-settings/src/data/definitions.ts packages/sdkwork-react-settings/src/entities/settings.entity.ts packages/sdkwork-react-settings/src/pages/SettingsPage.tsx packages/sdkwork-react-settings/src/services/appearanceDensityService.ts packages/sdkwork-react-settings/src/services/settingsService.ts packages/sdkwork-react-settings/tests/appearanceDensityService.test.ts packages/sdkwork-react-settings/tests/themeAppearanceSettings.test.ts src/app/theme/ThemeManager.ts src/app/theme/ThemeManager.test.ts src/app/theme/types.ts`
Expected: 0 errors

- [ ] **Step 3: Run build proof**

Run: `pnpm exec vite build`
Expected: exit 0

- [ ] **Step 4: Commit**

Do not commit unless explicitly requested by the user.
