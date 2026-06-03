# Magic Studio Browser-Hosted Runtime Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify frontend runtime semantics so standalone Rust server delivery and pure browser delivery share one browser-hosted contract while desktop remains the only shell-specialized runtime.

**Architecture:** Add a canonical runtime-classification helper in `@sdkwork/magic-studio-core`, route feature packages through runtime capabilities instead of literal `=== 'web'` checks, and document that product logic must distinguish browser-hosted versus desktop-shell runtimes rather than treating `web` as the only browser case.

**Tech Stack:** TypeScript, Node.js test runner, Markdown

---

### Task 1: Add canonical browser-hosted runtime classification

**Files:**
- Create: `packages/sdkwork-magic-studio-core/src/platform/runtime/kinds.ts`
- Modify: `packages/sdkwork-magic-studio-core/src/platform/runtime/index.ts`
- Modify: `packages/sdkwork-magic-studio-core/src/platform/toolkit/magicStudioServerRuntime.ts`

- [ ] **Step 1: Add `isBrowserHostedRuntimeKind()` for `web | server`**
- [ ] **Step 2: Export the helper through the public runtime/platform surface**
- [ ] **Step 3: Make runtime server-host helpers consume the shared classification instead of open-coded string comparisons**

### Task 2: Remove feature-level `=== 'web'` branching where the intent is browser-hosted behavior

**Files:**
- Modify: `packages/sdkwork-magic-studio-chat/src/services/chatService.ts`
- Modify: `packages/sdkwork-magic-studio-drive/src/services/driveService.ts`
- Modify: `packages/sdkwork-magic-studio-core/src/services/media/mediaService.ts`

- [ ] **Step 1: Move chat storage path selection to runtime-capability-based browser-hosted branching**
- [ ] **Step 2: Move drive default-path selection to runtime-capability-based browser-hosted branching**
- [ ] **Step 3: Make media asset hydration and thumbnail handling treat `server` the same as `web` where browser-hosted behavior is required**

### Task 3: Codify the architecture rule and guard it

**Files:**
- Modify: `packages/sdkwork-magic-studio-core/README.md`
- Modify: `docs/tauri-rust-framework-architecture.md`
- Modify: `docs/standards/magic-studio-rust-server-api-standard.md`
- Modify: `tests/magicStudioServerContractParity.node.test.mjs`

- [ ] **Step 1: Document browser-hosted runtime promotion and branching rules**
- [ ] **Step 2: Add contract assertions that public runtime helpers and feature consumers use the canonical classification**
- [ ] **Step 3: Keep guardrails focused on runtime architecture rather than broad feature testing**

### Task 4: Run focused regression verification

**Files:**
- Verify only

- [ ] **Step 1: Run focused runtime and contract slices**
- [ ] **Step 2: Run env/platform contract verification**
- [ ] **Step 3: Run app build verification**
