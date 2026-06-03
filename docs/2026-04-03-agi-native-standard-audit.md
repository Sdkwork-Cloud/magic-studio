> **Historical AGI-native audit snapshot from 2026-04-03.**
> This report is retained as audit history only and does not define the current canonical architecture or the current implementation state.
> Use `docs/agi-native-unified-application-standard.md` together with `docs/magic-studio-unified-host-api-standard.md` for the current standard.

# 2026-04-03 AGI-Native Standard Audit

## Conclusion

Magic Studio V2 is not yet close to the target "AGI-native unified application" standard.

The dominant architectural problem is that the current system is still shaped around:

1. raw URLs as business truth
2. page-local task objects instead of canonical generation executions
3. module-local data contracts instead of one asset-centered graph
4. `id`-centric or ad hoc client identity handling instead of immutable `uuid`-first identity

The result is that image, video, audio, music, film, canvas, MagicCut, and asset-center flows are only partially connected and cannot yet form one coherent multimodal creation system.

## 2026-04-04 Progress Update

Phase 1 foundation work is now partially landed in code:

1. import payloads are no longer client-id-equals-uuid objects by default; they now model nullable persisted `id` plus immutable `uuid`
2. import payloads now carry canonical `resource` and optional `coverResource` objects instead of exposing top-level delivery URLs as the only business handoff
3. generation selection keys no longer fall back to raw delivery URLs
4. persisted generation outcome/selection helpers now preserve canonical asset/resource identity fields needed by downstream modules
5. image/video/audio import adapters now hydrate generated task results from canonical resource descriptors instead of `fileUrl` / `coverUrl`

This is a foundation-only batch. The system is still not at the target standard because higher-level result entities, preview UIs, provider request builders, and film/magiccut/canvas adapters still expose URL-first compatibility fields.

## Target Standard

The target state is defined in [docs/agi-native-unified-application-standard.md](./agi-native-unified-application-standard.md).

The mandatory standard is:

1. asset-first, never URL-first
2. every domain model has `id` and immutable `uuid`
3. client compare/find/update logic uses `uuid` first and non-empty `id` only as fallback
4. all AI generation outputs are saved into the unified asset center
5. all generation flows use canonical recipe/execution/artifact contracts
6. canvas, film, short video, short drama, image edit, video edit, audio, and music become projections over one project graph

## Severity-Ranked Findings

### Critical: base identity contract is still persistence-first instead of client-first

Representative hotspots:

- `packages/sdkwork-magic-studio-types/src/base.types.ts`
- `packages/sdkwork-magic-studio-core/src/services/base/LocalStorageService.ts`
- `packages/sdkwork-magic-studio-canvas/src/store/canvasStore.tsx`
- `packages/sdkwork-magic-studio-video/src/services/videoHistoryService.ts`
- `packages/sdkwork-magic-studio-music/src/services/musicHistoryService.ts`

Problems:

1. `BaseEntity.id` is still modeled as always-present instead of nullable pre-persistence.
2. Shared storage/history code still assumes `id` is the lookup key.
3. Canvas selection, grouping, duplication, and relation management are built around `id` only.
4. Some stores still generate `uuid`, but then continue to compare/update by `id`.

Impact:

1. optimistic client-side entity creation is not formally correct
2. merge/update behavior is brittle when persisted ids are absent or change
3. cross-module identity semantics are inconsistent

### Critical: media contracts are still URL-first

Representative hotspots:

- `packages/sdkwork-magic-studio-types/src/media.types.ts`
- `packages/sdkwork-magic-studio-types/src/image.types.ts`
- `packages/sdkwork-magic-studio-types/src/video.types.ts`
- `packages/sdkwork-magic-studio-types/src/audio.types.ts`
- `packages/sdkwork-magic-studio-types/src/music.types.ts`
- `packages/sdkwork-magic-studio-types/src/film.types.ts`
- `packages/sdkwork-magic-studio-types/src/canvas.types.ts`

Problems:

1. `MediaResource` still mixes canonical identity with transient delivery fields like `url`, `path`, `base64`, and `bytes`.
2. generated result types across image/video/audio/music treat URL as the main output.
3. asset identity layers such as `assetId`, `primaryResourceId`, `resourceViewId`, `executionId`, and `artifact` identity are not consistently present.

Impact:

1. generated outputs cannot be uniformly reasoned about across modules
2. editing workflows cannot reliably round-trip through a unified asset center
3. provenance, versioning, and remix chains are incomplete

### Critical: generation boundaries still return strings or `{ url }`

Representative hotspots:

- `packages/sdkwork-magic-studio-core/src/ai/genAIService.ts`
- `packages/sdkwork-magic-studio-notes/src/services/genAIService.ts`
- `packages/sdkwork-magic-studio-image/src/services/imageService.ts`
- `packages/sdkwork-magic-studio-film/src/services/filmService.ts`
- `packages/sdkwork-magic-studio-audio/src/components/AudioGeneratorModal.tsx`
- `packages/sdkwork-magic-studio-music/src/components/MusicGeneratorModal.tsx`
- `packages/sdkwork-magic-studio-video/src/components/VideoGeneratorModal.tsx`

Problems:

1. AI generation is still represented as "return a string URL" or "return `{ url }`".
2. provider, model, prompt, parameters, reference assets, execution state, and resulting artifacts are not represented as one canonical entity.
3. generated object URLs are passed directly into UI callbacks instead of entering the asset center first.

Impact:

1. output provenance is lost
2. history cannot unify across providers and modalities
3. edit/remix/version/publish cannot be modeled cleanly

### Critical: shared generation history and asset-picking still work on raw URLs

Representative hotspots:

- `packages/sdkwork-magic-studio-assets/src/components/generate/GenerationHistoryListPane.tsx`
- `packages/sdkwork-magic-studio-generation-history/src/components/GenerateHistory.tsx`
- `packages/sdkwork-magic-studio-generation-history/src/components/GenerationItem.tsx`
- `packages/sdkwork-magic-studio-generation-history/src/components/GenerationPreview.tsx`
- `packages/sdkwork-magic-studio-assets/src/components/ChooseAsset.tsx`
- `packages/sdkwork-magic-studio-assets/src/components/ChooseAssetModal.tsx`
- `packages/sdkwork-magic-studio-assets/src/components/AIGenerateCoverModal.tsx`

Problems:

1. selection, preview, download, and save flows are wired around `url: string`.
2. generated outputs are often converted into pseudo-assets after the fact instead of being born as assets.
3. upload/generation entrypoints still treat user-visible URL as the canonical handoff boundary.

Impact:

1. asset center remains a secondary sink instead of the system of record
2. generation history is disconnected from canonical assets and artifacts
3. business flows are harder to normalize and audit

### High: module models are still islands instead of one graph

Representative hotspots:

- `packages/sdkwork-magic-studio-types/src/canvas.types.ts`
- `packages/sdkwork-magic-studio-types/src/film.types.ts`
- `packages/sdkwork-magic-studio-types/src/magiccut.types.ts`
- `packages/sdkwork-magic-studio-magiccut/src/domain/assets/magicCutAssetState.ts`
- `packages/sdkwork-magic-studio-canvas/src/services/canvasToCutConverter.ts`

Assessment:

1. `magiccut` is the best current internal reference for asset/resource layering.
2. `film` has partial movement toward asset ids in some places, but its types and services are still not canonical.
3. `canvas` remains one of the weakest areas because elements, selection, export, and conversion still depend on local ids and URL-shaped media attachments.
4. cross-surface graph entities such as project, sequence, scene, shot, asset, artifact, recipe, execution, and publish target are not formally unified.

### High: provider adaptation is under-modeled

Representative hotspots:

- `packages/sdkwork-magic-studio-core/src/ai/genAIService.ts`
- `packages/sdkwork-magic-studio-notes/src/services/genAIService.ts`
- `packages/sdkwork-magic-studio-video/src/services/videoRequestBuilder.ts`
- `packages/sdkwork-magic-studio-film/src/services/filmService.ts`

Problems:

1. provider-neutral request models are incomplete.
2. provider-specific controls leak into feature-local config shapes.
3. asynchronous generation job state is not standardized across modalities.

Impact:

1. difficult to compare providers
2. difficult to switch models/providers without UI rewrites
3. difficult to build consistent orchestration, retries, polling, and telemetry

## Module Heatmap

| Module | Current State | Main Defects | Priority |
| --- | --- | --- | --- |
| `sdkwork-magic-studio-types` | foundational but outdated | id contract wrong, media URL-first, task/result types fragmented | P0 |
| `sdkwork-magic-studio-core` | shared runtime exists | AI service returns raw URLs, LocalStorageService is id-first | P0 |
| `sdkwork-magic-studio-assets` | useful shell | asset center not yet the mandatory source of truth | P0 |
| `sdkwork-magic-studio-generation-history` | reusable UI | selection/preview/save are URL-first | P0 |
| `sdkwork-magic-studio-image` | functional feature module | result and callback contracts are URL-first | P1 |
| `sdkwork-magic-studio-video` | functional feature module | config/results/history still task-local and URL-first | P1 |
| `sdkwork-magic-studio-audio` | functional feature module | generation callbacks are URL-first | P1 |
| `sdkwork-magic-studio-music` | functional feature module | uuid handling and history persistence are weak | P1 |
| `sdkwork-magic-studio-film` | partial asset-aware work exists | services/types still URL-first, film graph not canonical | P1 |
| `sdkwork-magic-studio-canvas` | powerful interaction layer | selection/store/export built on local ids and URL-shaped resources | P1 |
| `sdkwork-magic-studio-magiccut` | best internal reference | still a local island, not the shared app standard | P1 |

## Representative Refactor Targets

### Identity-first targets

- `packages/sdkwork-magic-studio-types/src/base.types.ts`
- `packages/sdkwork-magic-studio-core/src/services/base/LocalStorageService.ts`
- `packages/sdkwork-magic-studio-video/src/services/videoHistoryService.ts`
- `packages/sdkwork-magic-studio-music/src/services/musicHistoryService.ts`
- `packages/sdkwork-magic-studio-canvas/src/store/canvasStore.tsx`

### Asset-first targets

- `packages/sdkwork-magic-studio-types/src/media.types.ts`
- `packages/sdkwork-magic-studio-types/src/asset-center.types.ts`
- `packages/sdkwork-magic-studio-assets/src/services/assetService.ts`
- `packages/sdkwork-magic-studio-assets/src/components/ChooseAsset.tsx`
- `packages/sdkwork-magic-studio-assets/src/components/ChooseAssetModal.tsx`
- `packages/sdkwork-magic-studio-assets/src/components/generate/upload/types.ts`

### Generation-first targets

- `packages/sdkwork-magic-studio-core/src/ai/genAIService.ts`
- `packages/sdkwork-magic-studio-notes/src/services/genAIService.ts`
- `packages/sdkwork-magic-studio-image/src/services/imageService.ts`
- `packages/sdkwork-magic-studio-film/src/services/filmService.ts`
- `packages/sdkwork-magic-studio-video/src/services/videoService.ts`
- `packages/sdkwork-magic-studio-audio/src/services/audioService.ts`
- `packages/sdkwork-magic-studio-music/src/services/musicService.ts`

### Shared flow targets

- `packages/sdkwork-magic-studio-generation-history/src/components/GenerateHistory.tsx`
- `packages/sdkwork-magic-studio-generation-history/src/components/GenerationItem.tsx`
- `packages/sdkwork-magic-studio-generation-history/src/components/GenerationPreview.tsx`
- `packages/sdkwork-magic-studio-assets/src/components/generate/GenerationHistoryListPane.tsx`

### Graph-unification targets

- `packages/sdkwork-magic-studio-types/src/canvas.types.ts`
- `packages/sdkwork-magic-studio-types/src/film.types.ts`
- `packages/sdkwork-magic-studio-types/src/magiccut.types.ts`
- `packages/sdkwork-magic-studio-canvas/src/services/canvasToCutConverter.ts`
- `packages/sdkwork-magic-studio-magiccut/src/domain/assets/magicCutAssetState.ts`

## Architecture Decision

The correct path is not compatibility-driven cleanup.

Because this is a new application with no user migration burden, the correct strategy is:

1. redefine canonical contracts first
2. move generation entrypoints onto recipe/execution/artifact models
3. force all outputs into the unified asset center
4. rewrite shared history/import/selection flows around asset identity
5. then rewrite feature modules on top of the new core

## Current Readiness

Current readiness for the target AGI-native standard is low.

The codebase has valuable building blocks, but the current architecture still behaves like a set of loosely connected AI tools instead of one multimodal, asset-native, project-graph creation system.

The next mandatory artifact is the master implementation plan:

- `docs/plans/2026-04-03-agi-native-standardization-master-plan.md`
