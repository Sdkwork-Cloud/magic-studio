# Magic Studio User-Scope Storage Alignment Implementation Plan

> **Status Update (2026-04-19):** Completed. Workspace initialization now resolves from the canonical runtime root layout, reusable templates now resolve from the canonical runtime user layout, and the default local-user scope is centralized in core storage.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align remaining workspace and template storage entrypoints to the canonical MagicStudio runtime layout so server and desktop share one storage contract.

**Architecture:** Workspace initialization must resolve from the runtime root layout, while reusable templates must resolve from the runtime user layout. The implementation should centralize the default local-user scope in core storage so chat and template features do not invent separate conventions.

**Tech Stack:** TypeScript, Vitest, shared runtime/storage helpers in `@sdkwork/magic-studio-core`

---

### Task 1: Canonicalize the default local user scope in core storage

**Files:**
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-core/src/storage/runtimeMagicStudioStorage.ts`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-core/src/storage/__tests__/runtimeMagicStudioStorage.test.ts`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-chat/src/services/chatStoragePaths.ts`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-chat/tests/chatStoragePaths.test.ts`

- [x] Add a shared `DEFAULT_LOCAL_MAGIC_STUDIO_USER_ID` export in core storage.
- [x] Add a helper for resolving the default runtime user layout from the active runtime.
- [x] Repoint chat storage helpers to the shared default user constant instead of owning a duplicate fallback.
- [x] Keep verification focused on exported contract and effective resolved path.

### Task 2: Move workspace initialization onto the canonical runtime root layout

**Files:**
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-workspace/src/services/workspaceService.ts`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-workspace/src/services/__tests__/workspaceService.test.ts`

- [x] Remove direct dependency on `documents`, `APP_ROOT_DIR`, and `DIR_NAMES.WORKSPACES`.
- [x] Resolve the active runtime and read `workspacesRoot` from `resolveRuntimeMagicStudioRootLayout(...)`.
- [x] Preserve idempotent directory creation behavior.
- [x] Verify `initialize()` creates the canonical runtime workspaces root.

### Task 3: Move template persistence onto the canonical runtime user layout

**Files:**
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-magiccut/src/services/templateService.ts`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-magiccut/tests/templateServiceIdentity.test.ts`

- [x] Replace `documents + storageConfig.templates.root` resolution with `resolveRuntimeMagicStudioDefaultUserLayout(...)`.
- [x] Use the shared default local user scope so browser-hosted server and desktop resolve the same template directory contract.
- [x] Verify template writes land under `users/<userId>/templates`.

### Task 4: Re-run focused architectural verification

**Files:**
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/tests/magicStudioServerContractParity.node.test.mjs` (only if the new shared export needs parity coverage)

- [x] Run focused Vitest coverage for core storage, chat storage, workspace service, and template service.
- [x] Run the existing server contract parity test if exports or runtime-storage contracts changed.
- [x] Run the app build to catch type/export drift.
