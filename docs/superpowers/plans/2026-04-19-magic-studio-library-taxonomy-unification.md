# Magic Studio Library Taxonomy Unification Implementation Plan

> **Status Update (2026-04-19):** The legacy shared `storageConfig.ts` file referenced by earlier storage work has been retired. Canonical system-library topology now lives in `@sdkwork/magic-studio-core/storage`, and any historical references to shared static storage config should be interpreted as superseded by runtime-backed storage helpers.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the split between legacy `downloads/images/models` library folders and the canonical MagicStudio `system/library/{video,image,audio,text,other}` contract across server-ready local storage flows.

**Architecture:** Make `@sdkwork/magic-studio-core/storage` the single source of truth for system-library directory names and type-to-directory mapping. Refactor asset import/indexing, drive root initialization, and shared storage config consumers to depend on that canonical surface so standalone server mode and desktop-embedded server mode both resolve the same filesystem contract.

**Tech Stack:** TypeScript, Vitest, Node.js test runner, Markdown

---

### Task 1: Define the canonical system-library taxonomy in core storage

**Files:**
- Modify: `packages/sdkwork-magic-studio-core/src/storage/magicStudioPaths.ts`
- Modify: `packages/sdkwork-magic-studio-core/src/storage/index.ts`

- [ ] **Step 1: Add exported canonical library directory names and ordered directory list**
- [ ] **Step 2: Add one shared helper that maps `AssetContentKey` or `AssetType` style content into `video|image|audio|text|other`**
- [ ] **Step 3: Keep the helper usable from feature packages without pulling in runtime-specific dependencies**

### Task 2: Migrate canonical storage consumers onto the shared taxonomy

**Files:**
- Modify: `packages/sdkwork-magic-studio-assets/src/services/assetService.ts`
- Modify: `packages/sdkwork-magic-studio-drive/src/services/driveService.ts`
- Modify: `packages/sdkwork-magic-studio-core/src/storage/magicStudioPaths.ts`

- [ ] **Step 1: Remove `LIBRARY_SUBDIRS` usage from asset import, derivative creation, and refresh/index initialization**
- [ ] **Step 2: Make drive canonical root creation create only `system/library/{video,image,audio,text,other}`**
- [ ] **Step 3: Keep all shared library roots and typed paths anchored to the canonical MagicStudio storage helpers in `@sdkwork/magic-studio-core/storage`**

### Task 3: Align remaining direct consumers and document the standard

**Files:**
- Modify: `packages/sdkwork-magic-studio-core/src/services/media/downloadService.ts`
- Modify: `packages/sdkwork-magic-studio-browser/src/services/browserDownloadService.ts`
- Modify: `packages/sdkwork-magic-studio-canvas/src/services/canvasExportService.ts`
- Modify: `docs/plans/2026-03-18-magicstudio-storage-design.md`
- Modify: `docs/tauri-rust-framework-architecture.md`

- [ ] **Step 1: Replace any remaining legacy library bucket assumptions such as `downloads/images/models/misc` with canonical typed directories**
- [ ] **Step 2: Document that system library taxonomy is singular canonical storage, not a customizable legacy bucket set**
- [ ] **Step 3: Keep project-scoped media layouts unchanged while clarifying the global system-library role**

### Task 4: Add focused contract guards and verification

**Files:**
- Modify: `packages/sdkwork-magic-studio-assets/tests/assetServiceMagicStudioRoot.test.ts`
- Modify: `packages/sdkwork-magic-studio-assets/tests/assetServiceIdentity.test.ts`
- Modify: `tests/magicStudioServerContractParity.node.test.mjs`
- Create if needed: focused library-taxonomy assertions under existing storage or asset tests

- [ ] **Step 1: Assert canonical `system/library` directories and virtual paths use `video|image|audio|text|other`**
- [ ] **Step 2: Add one architecture guard rejecting legacy `downloads/images/models/misc` use in canonical storage code**
- [ ] **Step 3: Run focused asset/storage/server contract verification and app build**
