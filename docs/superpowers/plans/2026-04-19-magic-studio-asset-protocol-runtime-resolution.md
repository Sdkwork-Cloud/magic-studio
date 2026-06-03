# Magic Studio Asset Protocol Runtime Resolution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace ad hoc `assets://` stripping and runtime-specific guessing with one canonical asset-protocol resolution layer shared by browser-hosted, standalone server, and desktop shell flows.

**Architecture:** Promote `assets://` absolute-path and renderable-URL resolution into `@sdkwork/magic-studio-core/storage`, where runtime-backed MagicStudio root/layout data already lives. Make runtime services resolve managed assets through this shared layer instead of manually stripping protocol prefixes or assuming desktop-only filesystem behavior. Keep `@sdkwork/magic-studio-assets` aligned by reusing the same core path-resolution helpers instead of maintaining a second implementation.

**Tech Stack:** TypeScript, Vitest, Node.js test runner, Markdown

---

### Task 1: Define canonical asset-protocol resolvers in core storage

**Files:**
- Create: `packages/sdkwork-magic-studio-core/src/storage/runtimeMagicStudioAssets.ts`
- Modify: `packages/sdkwork-magic-studio-core/src/storage/index.ts`
- Modify: `packages/sdkwork-magic-studio-core/src/index.ts`

- [ ] **Step 1: Export helpers for detecting `assets://` locators and converting them to canonical absolute paths using runtime-backed MagicStudio storage config**
- [ ] **Step 2: Export one runtime helper that resolves a managed asset locator into a renderable URL for browser-hosted and desktop runtimes**
- [ ] **Step 3: Keep the helpers dependency-light so core/media packages can use them without depending on asset-center services**

### Task 2: Reuse the canonical path logic inside asset-center

**Files:**
- Modify: `packages/sdkwork-magic-studio-assets/src/asset-center/application/magicStudioAssetLayout.ts`
- Modify: `packages/sdkwork-magic-studio-assets/src/asset-center/infrastructure/BrowserTauriAssetVfs.ts`
- Modify: `packages/sdkwork-magic-studio-assets/src/asset-center/infrastructure/DefaultAssetUrlResolver.ts`

- [ ] **Step 1: Remove duplicate absolute-path and virtual-path resolution logic from asset-center layout helpers where core now owns it**
- [ ] **Step 2: Make the asset-center VFS and URL resolver consume the new canonical core helpers**
- [ ] **Step 3: Preserve existing asset-center behavior while centralizing ownership of `assets://` path semantics**

### Task 3: Migrate runtime consumers off protocol-stripping stubs

**Files:**
- Modify: `packages/sdkwork-magic-studio-core/src/services/media/downloadService.ts`
- Modify: `packages/sdkwork-magic-studio-core/src/services/media/mediaService.ts`
- Modify: `packages/sdkwork-magic-studio-core/src/services/media/aspectRatioService.ts`
- Modify: `packages/sdkwork-magic-studio-magiccut/src/utils/resourceUtils.ts`

- [ ] **Step 1: Replace direct `assets://` string stripping in media/download services with canonical runtime resolver calls**
- [ ] **Step 2: Make image/video metadata and MagicCut resource helpers treat managed assets as first-class runtime locators**
- [ ] **Step 3: Keep remote/blob/data URLs untouched while standardizing local managed asset handling**

### Task 4: Add focused guards and verification

**Files:**
- Create or modify: `packages/sdkwork-magic-studio-core/src/storage/__tests__/runtimeMagicStudioAssets.test.ts`
- Modify: `packages/sdkwork-magic-studio-assets/tests/browserTauriAssetVfsMagicStudioConfig.test.ts`
- Modify: `packages/sdkwork-magic-studio-assets/tests/assetUrlResolver.test.ts`
- Modify: `tests/magicStudioServerContractParity.node.test.mjs`

- [ ] **Step 1: Assert runtime asset resolvers map `assets://` locators to canonical absolute paths and view URLs**
- [ ] **Step 2: Add contract guards rejecting protocol-stripping placeholders in canonical runtime services**
- [ ] **Step 3: Run focused storage/asset/runtime tests and the app build**
