# MagicCut Asset Model Unification Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `@sdkwork/react-magiccut` use asset-center managed assets as the canonical source of truth, with timeline resources reduced to derived render/editor views.

**Architecture:** Keep asset ownership in the asset-center aggregate root (`UnifiedDigitalAsset`) and make the MagicCut normalized state explicitly two-layered: canonical `assets` plus derived `resourceViews`. Timeline clips, layers, playback, rendering, export, and UI continue consuming resource views, but creation, normalization, import, and persistence all flow through the asset layer. This preserves runtime stability while fixing the current overloading of `AnyMediaResource.metadata`.

**Tech Stack:** TypeScript, Vitest, React, Zustand store patterns, existing asset-center service and unified asset types

---

## Chunk 1: Canonical MagicCut Asset State

### Task 1: Define asset-backed MagicCut state in tests

**Files:**
- Create: `packages/sdkwork-react-magiccut/tests/magicCutAssetState.test.ts`
- Create: `packages/sdkwork-react-magiccut/src/domain/assets/magicCutAssetState.ts`
- Modify: `packages/sdkwork-react-magiccut/src/store/types.ts`

- [ ] **Step 1: Write the failing test**

Add tests proving:
- importing a `UnifiedDigitalAsset` produces a canonical `assets[assetId]`
- a derived `resourceViews[assetId]` is created from the asset’s primary payload
- re-normalization preserves `assetId` identity and merges richer metadata without duplicating assets
- resolving a resource view falls back to asset-center locators rather than arbitrary metadata fields

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @sdkwork/react-magiccut test tests/magicCutAssetState.test.ts`
Expected: FAIL because the helper module does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Create a focused helper that:
- defines `MagicCutAssetMap`
- defines `MagicCutTimelineResourceView = AnyMediaResource & { metadata.assetId: string; metadata.primaryResourceId?: string; metadata.storageMode?: string }`
- builds resource views from `UnifiedDigitalAsset`
- upserts assets into state and keeps `resourceViews` aligned
- normalizes legacy `resources`-only state into the new shape

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @sdkwork/react-magiccut test tests/magicCutAssetState.test.ts`
Expected: PASS

### Task 2: Make normalized state explicitly asset-first

**Files:**
- Modify: `packages/sdkwork-react-magiccut/src/store/types.ts`
- Modify: `packages/sdkwork-react-magiccut/src/utils/assetReferenceNormalization.ts`

- [ ] **Step 1: Extend the state type**

Add:
- `assets: Record<string, UnifiedDigitalAsset>`
- `resourceViews: Record<string, MagicCutTimelineResourceView>`

Keep `resources` as a compatibility alias only if a transition shim is required internally; otherwise replace it package-wide in the same task.

- [ ] **Step 2: Normalize persisted state**

Update normalization so:
- old persisted state with only `resources` becomes `assets + resourceViews`
- persisted `assets` remain canonical
- project `mediaResources` refs are emitted from canonical asset-backed resource views

- [ ] **Step 3: Verify with tests**

Run: `pnpm --filter @sdkwork/react-magiccut test tests/magicCutAssetState.test.ts`
Expected: PASS

## Chunk 2: Store And Import Flow

### Task 3: Register imported assets through asset-center first

**Files:**
- Modify: `packages/sdkwork-react-magiccut/src/store/magicCutStore.tsx`
- Modify: `packages/sdkwork-react-magiccut/src/components/Timeline/MagicCutTimelineToolbar.tsx`
- Modify: `packages/sdkwork-react-assets/src/services/assetBusinessService.ts`

- [ ] **Step 1: Write failing tests first**

Extend `magicCutAssetState.test.ts` or add a focused store-domain test to prove:
- SDK-imported assets are registered into the canonical `assets` map
- timeline insertions reference asset-backed resource views
- detached audio import also creates a canonical asset entry

- [ ] **Step 2: Run targeted tests to verify they fail**

Run:
- `pnpm --filter @sdkwork/react-magiccut test tests/magicCutAssetState.test.ts`

- [ ] **Step 3: Implement the import flow**

Change MagicCut import helpers so they:
- upload/import with `@sdkwork/react-assets`
- resolve or register the corresponding `UnifiedDigitalAsset` in asset-center
- derive the timeline resource view from that asset
- write both `assets` and `resourceViews` into normalized state

- [ ] **Step 4: Run targeted tests**

Run:
- `pnpm --filter @sdkwork/react-magiccut test tests/magicCutAssetState.test.ts`
Expected: PASS

### Task 4: Persist project state from the canonical asset graph

**Files:**
- Modify: `packages/sdkwork-react-magiccut/src/store/magicCutStore.tsx`
- Modify: `packages/sdkwork-react-magiccut/src/services/templateService.ts`
- Modify: `packages/sdkwork-react-types/src/magiccut.types.ts`

- [ ] **Step 1: Update project-level refs**

Refine the project model so project persistence clearly points at canonical asset-backed media refs rather than arbitrary resource blobs.

- [ ] **Step 2: Update save/load/template hydration**

Ensure:
- default project state initializes `assets` and `resourceViews`
- save emits normalized `assets` and derived refs
- template instantiation clones timeline structure while preserving canonical asset ownership

- [ ] **Step 3: Verify persistence-focused behavior**

Run:
- `pnpm --filter @sdkwork/react-magiccut test tests/magicCutAssetState.test.ts`
- `pnpm --filter @sdkwork/react-magiccut test tests/importDropSequence.test.ts`

## Chunk 3: Runtime Consumers

### Task 5: Point runtime consumers at resource views, not free-form resources

**Files:**
- Modify: `packages/sdkwork-react-magiccut/src/engine/WebGLEngine.ts`
- Modify: `packages/sdkwork-react-magiccut/src/engine/AudioEngine.ts`
- Modify: `packages/sdkwork-react-magiccut/src/engine/renderer/TimelineRenderer.ts`
- Modify: `packages/sdkwork-react-magiccut/src/components/Player/MagicCutPlayer.tsx`
- Modify: `packages/sdkwork-react-magiccut/src/components/Timeline/*` as needed

- [ ] **Step 1: Update type surfaces**

Replace `Record<string, AnyMediaResource>` usage with the new asset-backed resource-view type where appropriate.

- [ ] **Step 2: Keep runtime behavior unchanged**

All playback, trimming, waveform, export, and preview behavior should still resolve from `clip.resource.id`, but those IDs now correspond to canonical asset-backed views.

- [ ] **Step 3: Run regression tests**

Run:
- `pnpm --filter @sdkwork/react-magiccut test tests/playerPreviewService.test.ts`
- `pnpm --filter @sdkwork/react-magiccut test tests/transitionPlayback.test.ts`
- `pnpm --filter @sdkwork/react-magiccut test tests/exportValidation.test.ts`

## Chunk 4: Verification

### Task 6: Full package verification

**Files:**
- Modify: none

- [ ] **Step 1: Run package tests**

Run: `pnpm --filter @sdkwork/react-magiccut test`
Expected: PASS

- [ ] **Step 2: Run typecheck**

Run: `pnpm --filter @sdkwork/react-magiccut typecheck`
Expected: PASS

- [ ] **Step 3: Run build**

Run: `pnpm --filter @sdkwork/react-magiccut build`
Expected: PASS
