# Magic Studio I18n Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove remaining user-visible hardcoded UI text, normalize `Magic Cut` naming to `魔映` in Chinese, and keep the workspace buildable with repeatable i18n regressions.

**Architecture:** Use the existing root locale bundles in `@sdkwork/react-i18n` as the default source of truth, and fall back to `createLocalizedText` only for tightly scoped component-local copy. Add focused regression tests first, then patch high-signal layout/component hotspots, then verify with targeted tests and a full workspace build.

**Tech Stack:** React, TypeScript, Vitest, Vite, pnpm workspace

---

## Chunk 1: Lock The Regression Surface

### Task 1: Add failing i18n regressions for Magic Cut branding and layout hotspots

**Files:**
- Create: `packages/sdkwork-react-i18n/tests/runtimeUiInternationalization.test.ts`
- Modify: `src/layouts/MagicCutLayout/MagicCutLayoutHeader.test.tsx`

- [ ] **Step 1: Write failing assertions for Chinese `magic_cut` labels resolving to `魔映` and for remaining hardcoded text in the current layout hotspots**
- [ ] **Step 2: Run `pnpm test -- packages/sdkwork-react-i18n/tests/runtimeUiInternationalization.test.ts src/layouts/MagicCutLayout/MagicCutLayoutHeader.test.tsx` and confirm the new tests fail for the current raw strings**

## Chunk 2: Fix Locale Resources

### Task 2: Normalize shared locale labels and descriptions

**Files:**
- Modify: `packages/sdkwork-react-i18n/src/locales/zh-CN/common.ts`
- Modify: `packages/sdkwork-react-i18n/src/locales/zh-CN/market.ts`
- Modify: `packages/sdkwork-react-i18n/src/locales/zh-CN/settings.ts`
- Modify: `packages/sdkwork-react-i18n/src/locales/zh-CN/assetCenter.ts`
- Modify: `packages/sdkwork-react-i18n/src/locales/en/canvas.ts`
- Modify: `packages/sdkwork-react-i18n/src/locales/zh-CN/canvas.ts`
- Modify: `packages/sdkwork-react-i18n/src/locales/en/notes.ts`
- Modify: `packages/sdkwork-react-i18n/src/locales/zh-CN/notes.ts`

- [ ] **Step 1: Add or update locale keys needed by the failing tests and normalize all shared Chinese `Magic Cut` labels to `魔映`**
- [ ] **Step 2: Keep the English locale aligned with the new keys so components can switch languages cleanly**

## Chunk 3: Remove Hardcoded Runtime Text

### Task 3: Patch high-traffic layouts and canvas export UI

**Files:**
- Modify: `src/layouts/MagicCutLayout/MagicCutLayoutHeader.tsx`
- Modify: `src/layouts/MagicCutLayout/MagicCutLayoutSidebar.tsx`
- Modify: `src/layouts/CreationLayout/CreationLayoutSidebar.tsx`
- Modify: `src/layouts/NotesLayout/NotesHeader.tsx`
- Modify: `src/layouts/MainLayout/MainGlobalHeader.tsx`
- Modify: `packages/sdkwork-react-canvas/src/components/CanvasZoomControls.tsx`
- Modify: `packages/sdkwork-react-canvas/src/components/CanvasExportModal.tsx`

- [ ] **Step 1: Replace visible hardcoded labels, badges, placeholders, notifications, and menu copy with locale-backed text**
- [ ] **Step 2: Use existing namespaces where possible and add only the minimum new keys required**
- [ ] **Step 3: Re-run the focused tests to verify the red-green cycle is complete**

### Task 4: Expand the audit-driven cleanup into other visible shell components if the new regression still reports gaps

**Files:**
- Modify: `packages/sdkwork-react-i18n/tests/runtimeUiInternationalization.test.ts`
- Modify: `packages/**/src/components/**/*.tsx`
- Modify: `src/**/*.tsx`

- [ ] **Step 1: Run the runtime i18n regression and inspect remaining failures**
- [ ] **Step 2: Patch the next visible user-facing hotspots surfaced by the audit without touching unrelated internals**
- [ ] **Step 3: Repeat until the audit is clean or only non-user-visible literals remain**

## Chunk 4: Verification

### Task 5: Prove the workspace is stable

**Files:**
- Test: `packages/sdkwork-react-i18n/tests/runtimeUiInternationalization.test.ts`
- Test: `src/layouts/MagicCutLayout/MagicCutLayoutHeader.test.tsx`

- [ ] **Step 1: Run `pnpm test -- packages/sdkwork-react-i18n/tests/runtimeUiInternationalization.test.ts src/layouts/MagicCutLayout/MagicCutLayoutHeader.test.tsx`**
- [ ] **Step 2: Run `pnpm build`**
- [ ] **Step 3: If either command fails, return to the failing layer and fix the root cause before claiming completion**
