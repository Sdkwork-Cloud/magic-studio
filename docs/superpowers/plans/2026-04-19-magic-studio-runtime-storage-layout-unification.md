# Magic Studio Runtime Storage Layout Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace browser-hosted `/mock/*` local storage roots with canonical MagicStudio storage layouts that are shared across browser-hosted and desktop-local runtimes.

**Architecture:** Add a runtime-aware storage resolver in `@sdkwork/magic-studio-core/storage` that derives the canonical MagicStudio root and layouts from `PlatformRuntime.system.path('home')` plus persisted storage overrides. Route local chat and local drive defaults through that resolver so browser-hosted IndexedDB VFS and desktop-local VFS both use the same filesystem contract instead of ad hoc mock roots.

**Tech Stack:** TypeScript, Vitest, Node.js test runner, Markdown

---

### Task 1: Add runtime-aware MagicStudio storage layout resolution

**Files:**
- Create: `packages/sdkwork-magic-studio-core/src/storage/runtimeMagicStudioStorage.ts`
- Modify: `packages/sdkwork-magic-studio-core/src/storage/index.ts`
- Modify: `packages/sdkwork-magic-studio-core/src/index.ts`

- [ ] **Step 1: Add helpers that resolve storage config and canonical layouts from `PlatformRuntime`**
- [ ] **Step 2: Export the helpers through the public core storage/runtime surface**
- [ ] **Step 3: Keep the helper focused on runtime-backed layout resolution only**

### Task 2: Route local feature defaults through canonical layouts

**Files:**
- Modify: `packages/sdkwork-magic-studio-chat/src/services/chatService.ts`
- Modify: `packages/sdkwork-magic-studio-drive/src/services/driveService.ts`
- Modify: `packages/sdkwork-magic-studio-chat/src/services/chatStoragePaths.ts`

- [ ] **Step 1: Make chat transcript storage resolve to `users/<userId>/chats` through the runtime-backed layout**
- [ ] **Step 2: Make local drive default root resolve to `system/library` through the runtime-backed layout**
- [ ] **Step 3: Remove remaining `/mock/*` local path literals from production feature code**

### Task 3: Codify and guard the storage-root standard

**Files:**
- Modify: `docs/tauri-rust-framework-architecture.md`
- Modify: `docs/standards/magic-studio-rust-server-api-standard.md`
- Modify: `tests/magicStudioServerContractParity.node.test.mjs`
- Create: `packages/sdkwork-magic-studio-core/src/storage/__tests__/runtimeMagicStudioStorage.test.ts`

- [ ] **Step 1: Document that browser-hosted local storage must use canonical MagicStudio layouts, not mock roots**
- [ ] **Step 2: Add architecture assertions rejecting `/mock/*` feature defaults**
- [ ] **Step 3: Add one focused runtime-storage layout test for the new resolver**

### Task 4: Run focused verification

**Files:**
- Verify only

- [ ] **Step 1: Run focused runtime/storage and contract tests**
- [ ] **Step 2: Run env/platform regression checks**
- [ ] **Step 3: Run app build verification**
