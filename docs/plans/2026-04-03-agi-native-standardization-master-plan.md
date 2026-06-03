# AGI-Native Standardization Master Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Magic Studio V2 into an AGI-native, asset-first, uuid-first, multimodal creation system spanning text, image, audio, speech, music, video, short video, short drama, canvas ideation, film planning, and timeline editing.

**Architecture:** The rewrite starts from canonical contracts, not from page-level UI. Identity, asset, generation, and project-graph contracts become the foundation; asset center becomes the only canonical media sink; feature modules become projections over shared recipe/execution/artifact and project-graph models.

**Tech Stack:** TypeScript, React, Zustand, Vite, Tauri, Vitest, shared workspace packages under `packages/`

---

## Phase 1: Canonical Identity And AGI Core Contracts

**Files:**

- Modify: `packages/sdkwork-magic-studio-types/src/base.types.ts`
- Add: `packages/sdkwork-magic-studio-types/src/agi.types.ts`
- Modify: `packages/sdkwork-magic-studio-types/src/media.types.ts`
- Modify: `packages/sdkwork-magic-studio-types/src/image.types.ts`
- Modify: `packages/sdkwork-magic-studio-types/src/video.types.ts`
- Modify: `packages/sdkwork-magic-studio-types/src/audio.types.ts`
- Modify: `packages/sdkwork-magic-studio-types/src/music.types.ts`
- Modify: `packages/sdkwork-magic-studio-types/src/index.ts`
- Modify: `packages/sdkwork-magic-studio-commons/src/index.ts`

**Deliverables:**

1. `BaseEntity` becomes client-first with nullable `id` and immutable `uuid`.
2. Shared helpers exist for `uuid`-first lookup and fallback-to-id behavior.
3. Canonical AGI contracts exist for input refs, recipes, executions, artifacts, and artifact sets.
4. Existing image/video/audio/music task types can point to canonical generation objects.
5. `MediaResource` can carry asset/resource/execution identities instead of only transport data.

**Acceptance:**

1. shared types package compiles
2. helper functions are covered by tests
3. no canonical model depends on raw URL as identity

## Phase 2: Shared Persistence And Client Identity Rewrite

**Files:**

- Modify: `packages/sdkwork-magic-studio-core/src/services/base/LocalStorageService.ts`
- Modify: `packages/sdkwork-magic-studio-video/src/services/videoHistoryService.ts`
- Modify: `packages/sdkwork-magic-studio-music/src/services/musicHistoryService.ts`
- Modify: `packages/sdkwork-magic-studio-audio/src/services/audioHistoryService.ts`
- Modify: `packages/sdkwork-magic-studio-canvas/src/store/canvasStore.tsx`
- Modify: `packages/sdkwork-magic-studio-magiccut/src/components/Resources/MagicCutResourcePanel.tsx`
- Modify: `packages/sdkwork-magic-studio-magiccut/src/store/magicCutStore.tsx`

**Deliverables:**

1. all shared persistence layers resolve entity keys with `uuid` first
2. stores and local history can read/update/delete by `uuid` and fallback to non-empty `id`
3. selection, copy/paste, drag state, and optimistic entities stop relying on persistence ids

**Acceptance:**

1. local history services keep stable identity even before persistence
2. canvas and MagicCut selection semantics are `uuid`-first
3. tests cover fallback behavior and persistence round-trip

## Phase 3: Unified Asset Center As The Source Of Truth

**Files:**

- Modify: `packages/sdkwork-magic-studio-types/src/asset-center.types.ts`
- Modify: `packages/sdkwork-magic-studio-assets/src/services/assetService.ts`
- Modify: `packages/sdkwork-magic-studio-assets/src/services/assetSdkQueryService.ts`
- Modify: `packages/sdkwork-magic-studio-assets/src/components/ChooseAsset.tsx`
- Modify: `packages/sdkwork-magic-studio-assets/src/components/ChooseAssetModal.tsx`
- Modify: `packages/sdkwork-magic-studio-assets/src/components/AIGenerateCoverModal.tsx`
- Modify: `packages/sdkwork-magic-studio-assets/src/components/generate/upload/types.ts`
- Modify: `packages/sdkwork-magic-studio-assets/src/asset-center/**`

**Deliverables:**

1. imported and generated content is registered as a unified digital asset at creation time
2. asset references include domain entity uuid and optional id fallback
3. preview URL becomes a resolved delivery view, never canonical business truth
4. asset center supports multimodal artifacts from image/video/audio/music/speech/text/short-drama pipelines

**Acceptance:**

1. all feature modules can hand off to asset center without fabricating pseudo-assets from URL strings
2. asset center query results are asset-first and artifact-aware
3. upload/generation flows no longer use raw URL as the primary contract

## Phase 4: Generation Boundary Rewrite

**Files:**

- Modify: `packages/sdkwork-magic-studio-core/src/ai/genAIService.ts`
- Modify: `packages/sdkwork-magic-studio-notes/src/services/genAIService.ts`
- Modify: `packages/sdkwork-magic-studio-image/src/services/imageService.ts`
- Modify: `packages/sdkwork-magic-studio-video/src/services/videoService.ts`
- Modify: `packages/sdkwork-magic-studio-audio/src/services/audioService.ts`
- Modify: `packages/sdkwork-magic-studio-music/src/services/musicService.ts`
- Modify: `packages/sdkwork-magic-studio-film/src/services/filmService.ts`
- Modify: `packages/sdkwork-magic-studio-video/src/services/videoRequestBuilder.ts`

**Deliverables:**

1. generation entrypoints return canonical `GenerationExecution` plus assets/artifacts, never `string`
2. prompt, references, provider, model, parameters, and output artifacts are recorded together
3. async jobs use one shared execution status model across all modalities
4. provider-specific knobs stay inside provider adapters and provider payload fields

**Acceptance:**

1. no AI generation API returns a raw media URL as the canonical result
2. all generated outputs can be traced to recipe and execution identity
3. provider changes do not require UI model rewrites

## Phase 5: Shared History, Preview, Import, And Selection Rewrite

**Files:**

- Modify: `packages/sdkwork-magic-studio-generation-history/src/components/GenerateHistory.tsx`
- Modify: `packages/sdkwork-magic-studio-generation-history/src/components/GenerationItem.tsx`
- Modify: `packages/sdkwork-magic-studio-generation-history/src/components/GenerationPreview.tsx`
- Modify: `packages/sdkwork-magic-studio-assets/src/components/generate/GenerationHistoryListPane.tsx`
- Modify: `packages/sdkwork-magic-studio-image/src/components/ImageGeneratorModal.tsx`
- Modify: `packages/sdkwork-magic-studio-video/src/components/VideoGeneratorModal.tsx`
- Modify: `packages/sdkwork-magic-studio-audio/src/components/AudioGeneratorModal.tsx`
- Modify: `packages/sdkwork-magic-studio-music/src/components/MusicGeneratorModal.tsx`

**Deliverables:**

1. history items are execution/artifact views, not URL cards
2. selection, preview, and save-to-assets operate on asset/artifact identity
3. generation modals emit canonical artifact or asset references into calling domains

**Acceptance:**

1. history UI can show provenance, provider, model, and parameters
2. one preview component can handle assets/artifacts across modalities
3. no history callback is typed as `onSelect(url: string)`

## Phase 6: Feature Module Convergence

**Files:**

- Modify: `packages/sdkwork-magic-studio-image/**`
- Modify: `packages/sdkwork-magic-studio-video/**`
- Modify: `packages/sdkwork-magic-studio-audio/**`
- Modify: `packages/sdkwork-magic-studio-music/**`
- Modify: `packages/sdkwork-magic-studio-film/**`
- Modify: `packages/sdkwork-magic-studio-canvas/**`
- Modify: `packages/sdkwork-magic-studio-magiccut/**`
- Modify: `packages/sdkwork-magic-studio-notes/**`

**Deliverables:**

1. image/video/audio/music use one generation contract family
2. film uses canonical scene/shot/generation/asset relationships
3. canvas nodes carry asset refs and generation refs instead of ad hoc URLs
4. MagicCut consumes unified asset and resource identities as the app-wide standard
5. short video and short drama become composition workflows over the same graph entities

**Acceptance:**

1. all feature modules can import, generate, remix, and publish through one asset-centered contract
2. no module invents a second media resource standard
3. no module persists business truth as raw URL

## Phase 7: Project Graph Unification

**Files:**

- Modify: `packages/sdkwork-magic-studio-types/src/canvas.types.ts`
- Modify: `packages/sdkwork-magic-studio-types/src/film.types.ts`
- Modify: `packages/sdkwork-magic-studio-types/src/magiccut.types.ts`
- Add: `packages/sdkwork-magic-studio-types/src/project-graph.types.ts`
- Modify: `packages/sdkwork-magic-studio-canvas/src/services/canvasToCutConverter.ts`
- Modify: `packages/sdkwork-magic-studio-magiccut/src/domain/assets/magicCutAssetState.ts`

**Deliverables:**

1. canonical graph entities for workspace, project, sequence, scene, shot, timeline, track, clip, asset, artifact, execution, and publish target
2. canvas, film, and MagicCut become different editors over the same underlying graph
3. short-form narrative flows can move from script to shot to generated artifacts to timeline without lossy conversion

**Acceptance:**

1. cross-surface transitions do not require re-wrapping data into incompatible module-local contracts
2. graph relations use uuid-first identity
3. asset provenance survives across ideation, generation, edit, and publish

## Phase 8: Verification And Governance

**Files:**

- Add: `docs/standards/agi-native-contract-checklist.md`
- Add: `scripts/check-agi-native-standards.mjs`
- Add: `scripts/__tests__/check-agi-native-standards.test.ts`
- Modify: feature-level tests under affected packages

**Deliverables:**

1. automated checks for `uuid`-first identity and asset-first generation boundaries
2. architecture guardrails that reject new URL-first contracts
3. regression tests for history, asset handoff, and generation provenance

**Acceptance:**

1. CI can detect reintroduction of URL-first business contracts
2. CI can detect id-only client logic in shared layers
3. CI can detect generation APIs that bypass the unified asset center

## Execution Order

The correct execution order is:

1. Phase 1
2. Phase 2
3. Phase 3
4. Phase 4
5. Phase 5
6. Phase 6
7. Phase 7
8. Phase 8

The reason is simple: if identity and asset/generation contracts are not canonical first, every upper-layer refactor will keep reintroducing the wrong abstractions.
