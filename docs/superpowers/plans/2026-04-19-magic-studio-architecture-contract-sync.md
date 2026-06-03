# Magic Studio Architecture Contract Sync Implementation Plan

> **Status Update (2026-04-19):** Completed. Architecture contracts now guard lazy platform/runtime initialization, and core operational docs explicitly reflect the canonical runtime-backed storage model instead of the retired static storage API.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sync architecture contracts and operational docs to the current canonical MagicStudio runtime/storage model so the documented standard matches the implemented standard.

**Architecture:** Keep the canonical storage contract in `@sdkwork/magic-studio-core/storage`, keep platform/runtime initialization lazy and import-safe, and mark older plan documents as superseded where they still mention retired static storage APIs. Contracts and docs should reinforce the same boundaries instead of describing legacy behavior.

**Tech Stack:** TypeScript, Node.js test runner, Markdown

---

### Task 1: Extend architecture contracts for lazy platform/runtime initialization

**Files:**
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/tests/magicStudioServerContractParity.node.test.mjs`

- [x] Assert `web.ts` no longer eagerly instantiates `WebFileSystem` at module load.
- [x] Assert `platform.ts` and runtime manager use lazy initialization helpers and avoid import-time logging noise.
- [x] Keep the contract focused on architecture boundaries, not implementation trivia.

### Task 2: Sync public-facing and plan documentation to the current standard

**Files:**
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-core/README.md`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/docs/plans/2026-03-18-magicstudio-storage.md`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/docs/superpowers/plans/2026-04-19-magic-studio-library-taxonomy-unification.md`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/docs/superpowers/plans/2026-04-19-magic-studio-user-scope-storage-alignment.md`

- [x] Document that the core package is safe to import in node-like/server test runtimes because platform internals initialize lazily.
- [x] Mark older plans that still mention `storageConfig.ts` or direct `documents` storage as superseded by canonical runtime-backed storage helpers.
- [x] Preserve historical context while making the current standard explicit.

### Task 3: Re-run focused verification

**Files:**
- No additional code files required unless verification reveals drift.

- [x] Run focused Vitest coverage for platform import safety.
- [x] Run the architecture contract node test.
- [x] Run the application build.
