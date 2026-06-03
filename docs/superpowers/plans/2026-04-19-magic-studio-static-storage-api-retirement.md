# Magic Studio Static Storage API Retirement Implementation Plan

> **Status Update (2026-04-19):** Completed. The legacy static `storageConfig` surface has been removed from `@sdkwork/magic-studio-commons` and `@sdkwork/magic-studio-fs`, and architecture contracts now guard against its return.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the legacy static `storageConfig` export surface so MagicStudio storage contracts only flow through canonical runtime-backed helpers.

**Architecture:** `@sdkwork/magic-studio-core/storage` is the only valid source for MagicStudio storage topology. `@sdkwork/magic-studio-commons` and `@sdkwork/magic-studio-fs` must stop exporting ad hoc root constants and folder-name bundles that bypass runtime configuration and user-scoped layout resolution.

**Tech Stack:** TypeScript, Node.js test runner, workspace package source exports

---

### Task 1: Remove the legacy static storage model from commons and fs package surfaces

**Files:**
- Delete: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-commons/src/utils/storageConfig.ts`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-commons/src/utils/index.ts`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-fs/src/index.ts`

- [x] Remove the static `storageConfig`, `APP_ROOT_DIR`, and folder-name constant exports from `@sdkwork/magic-studio-commons`.
- [x] Remove the re-export bridge from `@sdkwork/magic-studio-fs`.
- [x] Keep the remaining fs/package surface unchanged.

### Task 2: Add an architecture guard for the new public storage boundary

**Files:**
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/tests/magicStudioServerContractParity.node.test.mjs`

- [x] Assert the fs and commons package entrypoints no longer export the retired static storage API names.
- [x] Assert the legacy `storageConfig.ts` source file is removed so the old model cannot silently return.

### Task 3: Run focused verification

**Files:**
- No additional code files required unless verification reveals drift.

- [x] Run the server/storage contract node test.
- [x] Run the application build to catch export-surface or type drift.
