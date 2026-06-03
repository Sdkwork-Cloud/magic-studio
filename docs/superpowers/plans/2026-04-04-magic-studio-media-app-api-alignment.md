# Magic Studio Media App API Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align Magic Studio's image, audio, video, character, and film remote-business flows to `spring-ai-plus-app-api` with uuid-first identity, unified asset-center persistence, and no direct frontend model calls or mock remote logic.

**Architecture:** All remote business must flow through `spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-core/src/sdk/useAppSdkClient.ts` into `@sdkwork/app-sdk`, with `spring-ai-plus-business/spring-ai-plus-app-api` as the single contract source. Existing generation, upload, asset, image, video, and character APIs are upgraded to explicit app-api VOs that expose `id + uuid` and asset-backed AI result metadata; missing `asset-center` and `film` aggregates are added in app-api, then the TypeScript SDK is regenerated and the frontend packages are migrated to the shared SDK path.

**Tech Stack:** Spring Boot app-api, OpenAPI 3, SDKWork app SDK generator, TypeScript SDK, React/TypeScript Magic Studio packages, unified asset-center domain types, Vitest, Maven

---

## Scope

- In scope: `image`, `audio`, `video`, `character`, `film`, shared `upload/assets/asset-center`, generated app SDK regeneration, and frontend migration for these domains.
- Out of scope: `notes`, `drive`, and any `notes/drive` asset binding logic.
- Out of scope for this round: standalone `voice-speaker` business APIs unless they become a hard dependency of the `audio` package migration.
- Constraint: no table, column, index, migration, or embedded DB schema change without explicit user approval.

## Target Contract Standards

1. Every business model and every app-api response VO must expose top-level `id` and `uuid`.
2. `uuid` is created when the object is created, remains immutable, and is the primary client-side lookup key.
3. Client-side comparisons and map keys must use `uuid` first, then fall back to non-empty `id`.
4. AI generation results must not be naked URLs. They must be asset-backed media resources that preserve prompt, model, provider, generation parameters, task identity, and the final delivery URL or locator.
5. All generated image, audio, video, character, and film outputs must land in the unified asset center.
6. Remote business logic must not call `GoogleGenAI`, raw `fetch`, or local mock persistence from feature packages once the migration is complete.

## Current State Summary

- `image`
  - Frontend entry: `spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-image/src/services/imageService.ts`
  - Current mode: direct `GoogleGenAI` in frontend plus direct `fetch` for reference resolution.
  - Gap: backend exists, but the frontend bypasses it and the backend result contract is not yet asset-center/uuid-first.
- `audio`
  - Frontend entry: `spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-audio/src/services/audioService.ts`
  - Current mode: wraps frontend `genAIService.generateAudio`.
  - Gap: backend `generation/audio/tts` already exists, but the frontend bypasses it and result identity/resource metadata is incomplete.
- `video`
  - Frontend entries:
    - `spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-video/src/services/videoService.ts`
    - `spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-video/src/services/videoRequestBuilder.ts`
  - Current mode: mock/local service.
  - Gap: backend `POST /generation/video` exists, but its request form is far narrower than the frontend `UnifiedVideoGenerationRequest`.
- `character`
  - Frontend entries:
    - `spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-character/src/services/characterService.ts`
    - `spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-character/src/services/characterHistoryService.ts`
  - Current mode: local mock and in-memory task generation.
  - Gap: backend exists, but frontend is not integrated and list/detail/task VOs do not yet follow the standard identity/resource model.
- `film`
  - Frontend entries:
    - `spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-film/src/services/filmService.ts`
    - `spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-film/src/services/filmProjectService.ts`
    - `spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-film/src/repository/filmRepository.ts`
  - Current mode: direct `GoogleGenAI` for script analysis and media generation, plus local storage or platform storage for projects.
  - Gap: no `film` app-api aggregate exists at all; film currently cannot run on the standard remote path.
- `asset-center`
  - Frontend entry: `spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-assets/src/asset-center/infrastructure/RemoteAssetIndexRepository.ts`
  - Current mode: expects `/api/asset-center/*` aggregate endpoints.
  - Gap: `spring-ai-plus-app-api` only exposes low-level `/app/v3/api/assets` CRUD, not the unified asset-center aggregate and query contract.

## File Structure

### App API contract and controller files to modify

- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/generation/vo/GenerationTaskVO.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/generation/converter/GenerationTaskConverter.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/generation/ImageGenerationAppApiController.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/generation/AudioGenerationAppApiController.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/generation/VideoGenerationAppApiController.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/generation/CharacterGenerationAppApiController.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/generation/form/BaseGenerationForm.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/generation/form/ImageGenerationForm.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/generation/form/ImageVariationForm.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/generation/form/ImageEditForm.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/generation/form/ImageUpscaleForm.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/generation/form/AudioGenerationForm.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/generation/form/CharacterGenerationForm.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/generation/form/CharacterBatchGenerationForm.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/generation/form/VideoGenerationForm.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/assets/AssetsAppApiController.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/assets/converter/AssetConverter.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/assets/vo/AssetVO.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/assets/vo/AssetDetailVO.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/upload/UploadAppApiController.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/upload/converter/UploadConverter.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/upload/vo/FileVO.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/image/vo/ImageVO.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/image/vo/ImageDetailVO.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/video/vo/VideoVO.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/video/vo/VideoDetailVO.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/character/vo/CharacterVO.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/character/vo/CharacterDetailVO.java`

### New app-api packages to create

- Create: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/assetcenter/AssetCenterAppApiController.java`
- Create: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/assetcenter/form/*`
- Create: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/assetcenter/vo/*`
- Create: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/assetcenter/converter/*`
- Create: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/film/FilmAppApiController.java`
- Create: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/film/form/*`
- Create: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/film/vo/*`
- Create: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/film/converter/*`

### Generated SDK outputs to regenerate, never hand-edit

- Regenerate: `spring-ai-plus-business/spring-ai-plus-app-api/sdkwork-sdk-app/sdkwork-app-sdk-typescript/src/api/generation.ts`
- Regenerate: `spring-ai-plus-business/spring-ai-plus-app-api/sdkwork-sdk-app/sdkwork-app-sdk-typescript/src/api/asset.ts`
- Regenerate or add: `spring-ai-plus-business/spring-ai-plus-app-api/sdkwork-sdk-app/sdkwork-app-sdk-typescript/src/api/asset-center.ts`
- Regenerate or add: `spring-ai-plus-business/spring-ai-plus-app-api/sdkwork-sdk-app/sdkwork-app-sdk-typescript/src/api/film.ts`
- Regenerate: `spring-ai-plus-business/spring-ai-plus-app-api/sdkwork-sdk-app/sdkwork-app-sdk-typescript/src/api/upload.ts`
- Regenerate affected types under `spring-ai-plus-business/spring-ai-plus-app-api/sdkwork-sdk-app/sdkwork-app-sdk-typescript/src/types/*`

### Frontend files that will switch to the regenerated SDK contracts

- Modify: `spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-image/src/services/imageService.ts`
- Modify: `spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-audio/src/services/audioService.ts`
- Modify: `spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-video/src/services/videoService.ts`
- Modify: `spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-video/src/services/videoRequestBuilder.ts`
- Modify: `spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-character/src/services/characterService.ts`
- Modify: `spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-character/src/services/characterHistoryService.ts`
- Modify: `spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-film/src/services/filmService.ts`
- Modify: `spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-film/src/services/filmProjectService.ts`
- Modify: `spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-film/src/repository/filmRepository.ts`
- Modify: `spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-assets/src/asset-center/infrastructure/RemoteAssetIndexRepository.ts`

## Backend Decision Matrix

| Domain | Frontend entry | Target app-api / SDK pairing | Backend decision | Reason | Priority |
| --- | --- | --- | --- | --- | --- |
| Common generation task identity | `packages/sdkwork-magic-studio-image/src/services/imageService.ts`, `packages/sdkwork-magic-studio-audio/src/services/audioService.ts`, `packages/sdkwork-magic-studio-video/src/services/videoService.ts`, `packages/sdkwork-magic-studio-character/src/services/characterService.ts` | `generation.*` task create/list/status APIs | MODIFY | `GenerationTaskVO` has `taskId` only and leaks core `GenerationInput/Output`; it does not satisfy top-level `id + uuid` or asset-backed output metadata. | P0 |
| Image generation | `packages/sdkwork-magic-studio-image/src/services/imageService.ts` | `generation.createGenerationImage`, `createVariation`, `editImage`, `upscaleImage`, image task APIs | MODIFY | Backend exists, but result resources still need unified asset metadata and the frontend currently bypasses the SDK with direct `GoogleGenAI`. | P0 |
| Audio TTS | `packages/sdkwork-magic-studio-audio/src/services/audioService.ts` | `generation.textToSpeech`, audio task APIs | MODIFY | Backend exists, but output and result semantics need uuid-first asset-backed audio resources and the frontend currently uses direct frontend AI service. | P0 |
| Video generation canonical contract | `packages/sdkwork-magic-studio-video/src/services/videoService.ts`, `packages/sdkwork-magic-studio-video/src/services/videoRequestBuilder.ts` | `generation.createGenerationVideo` as the single canonical endpoint | MODIFY | Current `VideoGenerationForm` cannot express `UnifiedVideoGenerationRequest` fields such as `generationType`, role-based assets, style block, and provider-specific options. | P0 |
| Character generation | `packages/sdkwork-magic-studio-character/src/services/characterService.ts` | `generation.createGenerationCharacter`, `batchCreate`, `listCharacters`, `getCharacterDetail`, character task APIs | MODIFY | Backend exists, but VOs are not standardized and the frontend is still local mock logic. | P0 |
| Upload identity return | media upload and import flows across image, audio, video, film | `upload.uploadFile`, `upload.uploadFiles`, `upload.mergeChunks` | MODIFY | `FileVO` does not consistently expose canonical `id + uuid`, making later asset-center binding and uuid-first client logic fragile. | P0 |
| Low-level asset CRUD | `packages/sdkwork-magic-studio-assets/src/services/assetSdkQueryService.ts` and shared asset import flows | `asset.listAssets`, `getAssetDetail`, `deleteAsset`, `batchDeleteAssets` | MODIFY | Asset/detail VOs are still low-level and not uuid-first; `DELETE /assets/batch` currently mismatches generated SDK expectations. | P0 |
| Unified asset center aggregate | `packages/sdkwork-magic-studio-assets/src/asset-center/infrastructure/RemoteAssetIndexRepository.ts` | new `asset-center` app-api and generated SDK | ADD | The frontend already expects unified aggregate and query APIs, but app-api only exposes low-level `/assets` CRUD. | P0 |
| Film project aggregate | `packages/sdkwork-magic-studio-film/src/services/filmProjectService.ts`, `packages/sdkwork-magic-studio-film/src/repository/filmRepository.ts` | new `film` app-api and generated SDK | ADD | There is no film app-api controller today, while film project persistence is local-only. | P0 |
| Film script analysis and graph orchestration | `packages/sdkwork-magic-studio-film/src/services/filmService.ts` | new `film` app-api analysis and graph endpoints, plus generic image/video generation reuse | ADD | Film script analysis and extraction are currently direct `GoogleGenAI`; they need a backend-owned orchestration contract. | P0 |
| Media library/detail VOs | later media browse/detail surfaces | `image.*`, `video.*`, `character.*` non-generation APIs | MODIFY | Image, video, and character detail/list VOs do not consistently expose the standard `id + uuid` identity model or asset-backed resources. | P1 |
| Model creation capabilities | `packages/sdkwork-magic-studio-assets/src/services/creationCapabilityService.ts` | `models/creation-capabilities?target=image|video|short_drama` | NO_BACKEND_CHANGE | Capability endpoints already cover `image`, `video`, and `short_drama`; only frontend adoption is needed. | P1 |

## Target API Set

### APIs to modify

- `POST /app/v3/api/generation/image`
- `POST /app/v3/api/generation/image/variations`
- `POST /app/v3/api/generation/image/edits`
- `POST /app/v3/api/generation/image/upscale`
- `GET /app/v3/api/generation/image/tasks/{taskId}`
- `GET /app/v3/api/generation/image/tasks`
- `DELETE /app/v3/api/generation/image/tasks/{taskId}`
- `POST /app/v3/api/generation/audio/tts`
- `GET /app/v3/api/generation/audio/tasks/{taskId}`
- `GET /app/v3/api/generation/audio/tasks`
- `DELETE /app/v3/api/generation/audio/tasks/{taskId}`
- `POST /app/v3/api/generation/video`
- `GET /app/v3/api/generation/video/tasks/{taskId}`
- `GET /app/v3/api/generation/video/tasks`
- `DELETE /app/v3/api/generation/video/tasks/{taskId}`
- `POST /app/v3/api/generation/character`
- `POST /app/v3/api/generation/character/batch`
- `GET /app/v3/api/generation/character/{characterId}`
- `GET /app/v3/api/generation/character/list`
- `GET /app/v3/api/generation/character/tasks/{taskId}`
- `GET /app/v3/api/generation/character/tasks`
- `DELETE /app/v3/api/generation/character/tasks/{taskId}`
- `POST /app/v3/api/upload/file`
- `POST /app/v3/api/upload/files`
- `POST /app/v3/api/upload/chunk/merge`
- `GET /app/v3/api/assets`
- `GET /app/v3/api/assets/{assetId}`
- `DELETE /app/v3/api/assets/batch`
- `GET /app/v3/api/image/*` affected VOs
- `GET /app/v3/api/video/*` affected VOs
- `GET /app/v3/api/character/*` affected VOs

### APIs to add

- `POST /app/v3/api/asset-center/assets`
- `POST /app/v3/api/asset-center/assets/batch`
- `GET /app/v3/api/asset-center/assets/page`
- `GET /app/v3/api/asset-center/assets/{assetId}`
- `DELETE /app/v3/api/asset-center/assets/{assetId}`
- `GET /app/v3/api/asset-center/assets/stats`
- `POST /app/v3/api/film/projects`
- `GET /app/v3/api/film/projects`
- `GET /app/v3/api/film/projects/{projectUuid}`
- `PUT /app/v3/api/film/projects/{projectUuid}`
- `DELETE /app/v3/api/film/projects/{projectUuid}`
- `POST /app/v3/api/film/projects/{projectUuid}/script-analysis`
- `GET /app/v3/api/film/projects/{projectUuid}/graph`
- `PUT /app/v3/api/film/projects/{projectUuid}/graph`

### APIs with no backend work in this round

- `GET /app/v3/api/models/creation-capabilities?target=image`
- `GET /app/v3/api/models/creation-capabilities?target=video`
- `GET /app/v3/api/models/creation-capabilities?target=short_drama`

## Implementation Order

1. Identity baseline for generation/upload/assets/media VOs
2. Canonical `POST /generation/video` contract expansion
3. Image, audio, and character generation contract normalization
4. Unified asset-center aggregate API
5. Film aggregate and script-analysis API
6. SDK regeneration
7. Frontend migration package-by-package
8. End-to-end verification and cleanup

### Task 1: Lock the uuid-first media identity contract

**Files:**
- Create: `spring-ai-plus-business/spring-ai-plus-app-api/src/test/java/com/sdkwork/ai/gateway/api/app/v3/generation/GenerationTaskContractTest.java`
- Create: `spring-ai-plus-business/spring-ai-plus-app-api/src/test/java/com/sdkwork/ai/gateway/api/app/v3/assets/AssetIdentityContractTest.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/generation/vo/GenerationTaskVO.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/generation/converter/GenerationTaskConverter.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/assets/vo/AssetVO.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/assets/vo/AssetDetailVO.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/upload/vo/FileVO.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/image/vo/ImageVO.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/video/vo/VideoVO.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/character/vo/CharacterVO.java`

- [ ] **Step 1: Write failing contract tests for top-level `id + uuid`**

```java
assertThat(json.at("/data/id").asText()).isEqualTo("123");
assertThat(json.at("/data/uuid").asText()).isEqualTo("gen-uuid-123");
assertThat(json.at("/data/taskId").asText()).isEqualTo("123");
```

- [ ] **Step 2: Run the tests and confirm the current contract fails**

Run from `spring-ai-plus-business/spring-ai-plus-app-api`:

```powershell
mvn -Dtest=GenerationTaskContractTest,AssetIdentityContractTest test
```

Expected: FAIL because current media/task/upload VOs do not consistently expose top-level `id` and `uuid`.

- [ ] **Step 3: Implement the canonical identity fields**

Add top-level `id` and `uuid` to all affected VOs, keep domain alias fields like `taskId`, `assetId`, `imageId`, `videoId`, and `characterId` only as convenience aliases, and update converters so the alias values are derived from the canonical identity.

- [ ] **Step 4: Re-run the contract tests**

```powershell
mvn -Dtest=GenerationTaskContractTest,AssetIdentityContractTest test
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/generation/vo/GenerationTaskVO.java spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/generation/converter/GenerationTaskConverter.java spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/assets/vo/AssetVO.java spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/assets/vo/AssetDetailVO.java spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/upload/vo/FileVO.java spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/image/vo/ImageVO.java spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/video/vo/VideoVO.java spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/character/vo/CharacterVO.java spring-ai-plus-business/spring-ai-plus-app-api/src/test/java/com/sdkwork/ai/gateway/api/app/v3/generation/GenerationTaskContractTest.java spring-ai-plus-business/spring-ai-plus-app-api/src/test/java/com/sdkwork/ai/gateway/api/app/v3/assets/AssetIdentityContractTest.java
git commit -m "feat: standardize media identity contracts"
```

### Task 2: Replace leaked generation core payloads with app-api media-result VOs

**Files:**
- Create: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/generation/vo/GenerationTaskInputVO.java`
- Create: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/generation/vo/GenerationTaskOutputVO.java`
- Create: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/generation/vo/GeneratedMediaResourceVO.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/generation/vo/GenerationTaskVO.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/generation/converter/GenerationTaskConverter.java`

- [ ] **Step 1: Write a failing serialization test for asset-backed generation output**

```java
assertThat(json.at("/data/output/outputAssets/0/uuid").asText()).isNotBlank();
assertThat(json.at("/data/output/outputAssets/0/generation/prompt").asText()).isEqualTo("test prompt");
assertThat(json.at("/data/output/outputAssets/0/delivery/url").asText()).isNotBlank();
```

- [ ] **Step 2: Run the targeted test**

```powershell
mvn -Dtest=GenerationTaskContractTest test
```

Expected: FAIL because `GenerationTaskVO` still exposes raw `GenerationInput` and `GenerationOutput`.

- [ ] **Step 3: Implement explicit app-api output VOs**

Map generation output into an app-api contract that exposes:
- canonical identity
- product and mode
- prompt, negative prompt, model, provider, parameters
- output assets and resources with `id`, `uuid`, asset identity, delivery URL, and metadata

- [ ] **Step 4: Re-run the test**

```powershell
mvn -Dtest=GenerationTaskContractTest test
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/generation/vo spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/generation/converter/GenerationTaskConverter.java spring-ai-plus-business/spring-ai-plus-app-api/src/test/java/com/sdkwork/ai/gateway/api/app/v3/generation/GenerationTaskContractTest.java
git commit -m "feat: add asset-backed generation task result contracts"
```

### Task 3: Expand `POST /generation/video` to the unified frontend request model

**Files:**
- Create: `spring-ai-plus-business/spring-ai-plus-app-api/src/test/java/com/sdkwork/ai/gateway/api/app/v3/generation/VideoGenerationContractTest.java`
- Create: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/generation/form/VideoGenerationAssetForm.java`
- Create: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/generation/form/VideoGenerationStyleForm.java`
- Create: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/generation/form/VideoGenerationOptionsForm.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/generation/form/VideoGenerationForm.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/generation/VideoGenerationAppApiController.java`
- Inspect: `spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-video/src/services/videoRequestBuilder.ts`
- Inspect: `spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-types/src/video.types.ts`

- [ ] **Step 1: Write the failing controller contract test**

```json
{
  "generationType": "lip-sync",
  "prompt": "make the portrait speak",
  "assets": [
    { "role": "source_image", "type": "image", "assetUuid": "asset-img-1" },
    { "role": "driver_audio", "type": "audio", "assetUuid": "asset-audio-1" }
  ],
  "videoStyle": { "id": "cinematic" },
  "options": { "lipSyncDriverType": "audio", "lipSyncSourceType": "image" }
}
```

- [ ] **Step 2: Run the targeted test**

```powershell
mvn -Dtest=VideoGenerationContractTest test
```

Expected: FAIL because current `VideoGenerationForm` cannot deserialize or map the frontend request.

- [ ] **Step 3: Implement the canonical video contract**

Make `POST /app/v3/api/generation/video` the canonical endpoint with:
- `generationType`
- role-based `assets[]`
- `videoStyle`
- provider-neutral `options`
- provider or routing payload passthrough in `extraParams`

Keep legacy helper endpoints only as thin aliases until the frontend migration is done, then remove them in cleanup.

- [ ] **Step 4: Re-run the test**

```powershell
mvn -Dtest=VideoGenerationContractTest test
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/generation/form spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/generation/VideoGenerationAppApiController.java spring-ai-plus-business/spring-ai-plus-app-api/src/test/java/com/sdkwork/ai/gateway/api/app/v3/generation/VideoGenerationContractTest.java
git commit -m "feat: unify video generation contract"
```

### Task 4: Normalize image, audio, and character generation endpoints to the asset-backed standard

**Files:**
- Create: `spring-ai-plus-business/spring-ai-plus-app-api/src/test/java/com/sdkwork/ai/gateway/api/app/v3/generation/ImageAudioCharacterContractTest.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/generation/ImageGenerationAppApiController.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/generation/AudioGenerationAppApiController.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/generation/CharacterGenerationAppApiController.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/generation/form/ImageGenerationForm.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/generation/form/ImageVariationForm.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/generation/form/ImageEditForm.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/generation/form/ImageUpscaleForm.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/generation/form/AudioGenerationForm.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/generation/form/CharacterGenerationForm.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/generation/form/CharacterBatchGenerationForm.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/generation/vo/CharacterGenerationVO.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/generation/vo/CharacterListVO.java`

- [ ] **Step 1: Write failing tests for image, audio, and character result payloads**

Lock these expectations:
- task result contains top-level `id + uuid`
- output assets include canonical media identity
- image, audio, and character creation requests accept `bizScene` and reference assets cleanly
- character detail/list returns canonical avatar asset/resource references

- [ ] **Step 2: Run the targeted tests**

```powershell
mvn -Dtest=ImageAudioCharacterContractTest test
```

Expected: FAIL

- [ ] **Step 3: Implement minimal contract changes**

Ensure these endpoints return the same normalized result structure:
- image generation endpoints
- audio TTS and audio task endpoints
- character generation, list, detail, and task endpoints

- [ ] **Step 4: Re-run the tests**

```powershell
mvn -Dtest=ImageAudioCharacterContractTest test
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/generation spring-ai-plus-business/spring-ai-plus-app-api/src/test/java/com/sdkwork/ai/gateway/api/app/v3/generation/ImageAudioCharacterContractTest.java
git commit -m "feat: normalize image audio and character generation contracts"
```

### Task 5: Fix low-level upload and asset APIs for asset-center ingestion

**Files:**
- Create: `spring-ai-plus-business/spring-ai-plus-app-api/src/test/java/com/sdkwork/ai/gateway/api/app/v3/upload/UploadAssetContractTest.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/upload/UploadAppApiController.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/upload/converter/UploadConverter.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/upload/vo/FileVO.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/assets/AssetsAppApiController.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/assets/converter/AssetConverter.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/assets/vo/AssetVO.java`
- Modify: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/assets/vo/AssetDetailVO.java`

- [ ] **Step 1: Write the failing upload and asset contract tests**

Lock these behaviors:
- upload returns top-level `id + uuid`
- upload response includes stable file and asset resource identity needed for asset-center ingestion
- `DELETE /assets/batch` accepts the same request contract represented in the generated SDK

- [ ] **Step 2: Run the targeted test**

```powershell
mvn -Dtest=UploadAssetContractTest test
```

Expected: FAIL because current `FileVO` and `AssetVO` do not provide the standard contract and batch delete mismatches the SDK.

- [ ] **Step 3: Implement the low-level asset and upload fixes**

Do not add a new compatibility wrapper. Fix the app-api contract directly so upload and low-level asset CRUD are safe to compose into the new asset-center aggregate.

- [ ] **Step 4: Re-run the test**

```powershell
mvn -Dtest=UploadAssetContractTest test
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/upload spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/assets spring-ai-plus-business/spring-ai-plus-app-api/src/test/java/com/sdkwork/ai/gateway/api/app/v3/upload/UploadAssetContractTest.java
git commit -m "feat: normalize upload and asset api contracts"
```

### Task 6: Add the unified asset-center aggregate API

**Files:**
- Create: `spring-ai-plus-business/spring-ai-plus-app-api/src/test/java/com/sdkwork/ai/gateway/api/app/v3/assetcenter/AssetCenterAppApiControllerTest.java`
- Create: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/assetcenter/AssetCenterAppApiController.java`
- Create: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/assetcenter/form/AssetCenterPageQueryForm.java`
- Create: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/assetcenter/form/AssetCenterBatchSaveForm.java`
- Create: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/assetcenter/vo/UnifiedDigitalAssetVO.java`
- Create: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/assetcenter/vo/AssetCenterStatsVO.java`
- Create: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/assetcenter/converter/AssetCenterConverter.java`
- Inspect: `spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-types/src/asset-center.types.ts`
- Inspect: `spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-assets/src/asset-center/infrastructure/RemoteAssetIndexRepository.ts`

- [ ] **Step 1: Write a failing controller test against the frontend aggregate contract**

Lock these routes:
- `POST /app/v3/api/asset-center/assets`
- `POST /app/v3/api/asset-center/assets/batch`
- `GET /app/v3/api/asset-center/assets/page`
- `GET /app/v3/api/asset-center/assets/{assetId}`
- `DELETE /app/v3/api/asset-center/assets/{assetId}`
- `GET /app/v3/api/asset-center/assets/stats`

- [ ] **Step 2: Run the targeted test**

```powershell
mvn -Dtest=AssetCenterAppApiControllerTest test
```

Expected: FAIL because no `asset-center` package or controller exists yet.

- [ ] **Step 3: Implement the aggregate controller and VO mapping**

Make the new API map directly to frontend `UnifiedDigitalAsset` semantics:
- canonical asset identity
- asset scope and references
- primary payload and resource
- stats by type and domain

Do not involve notes or drive in this round.

- [ ] **Step 4: Re-run the test**

```powershell
mvn -Dtest=AssetCenterAppApiControllerTest test
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/assetcenter spring-ai-plus-business/spring-ai-plus-app-api/src/test/java/com/sdkwork/ai/gateway/api/app/v3/assetcenter/AssetCenterAppApiControllerTest.java
git commit -m "feat: add unified asset center app api"
```

### Task 7: Add the film aggregate and script-analysis API

**Files:**
- Create: `spring-ai-plus-business/spring-ai-plus-app-api/src/test/java/com/sdkwork/ai/gateway/api/app/v3/film/FilmAppApiControllerTest.java`
- Create: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/film/FilmAppApiController.java`
- Create: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/film/form/FilmProjectCreateForm.java`
- Create: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/film/form/FilmProjectUpdateForm.java`
- Create: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/film/form/FilmScriptAnalysisForm.java`
- Create: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/film/vo/FilmProjectVO.java`
- Create: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/film/vo/FilmScriptAnalysisVO.java`
- Create: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/film/vo/FilmProjectGraphVO.java`
- Create: `spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/film/converter/FilmConverter.java`
- Inspect: `spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-types/src/film.types.ts`
- Inspect: `spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-film/src/services/filmService.ts`
- Inspect: `spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-film/src/repository/filmRepository.ts`

- [ ] **Step 1: Write the failing film controller tests**

Lock these routes:
- `POST /app/v3/api/film/projects`
- `GET /app/v3/api/film/projects`
- `GET /app/v3/api/film/projects/{projectUuid}`
- `PUT /app/v3/api/film/projects/{projectUuid}`
- `DELETE /app/v3/api/film/projects/{projectUuid}`
- `POST /app/v3/api/film/projects/{projectUuid}/script-analysis`
- `GET /app/v3/api/film/projects/{projectUuid}/graph`
- `PUT /app/v3/api/film/projects/{projectUuid}/graph`

- [ ] **Step 2: Run the targeted test**

```powershell
mvn -Dtest=FilmAppApiControllerTest test
```

Expected: FAIL because no film app-api contract exists.

- [ ] **Step 3: Implement the film aggregate**

Persist the film project as the aggregate root. Each nested entity in the project graph must carry `id + uuid`. Film script analysis should return extracted characters, locations, props, scenes, and shots, but actual image and video rendering should still route through the generic generation endpoints with `bizScene=film`.

- [ ] **Step 4: Re-run the test**

```powershell
mvn -Dtest=FilmAppApiControllerTest test
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add spring-ai-plus-business/spring-ai-plus-app-api/src/main/java/com/sdkwork/ai/gateway/api/app/v3/film spring-ai-plus-business/spring-ai-plus-app-api/src/test/java/com/sdkwork/ai/gateway/api/app/v3/film/FilmAppApiControllerTest.java
git commit -m "feat: add film aggregate app api"
```

### Task 8: Regenerate the TypeScript SDK and migrate frontend media packages to the shared wrapper path

**Files:**
- Regenerate: `spring-ai-plus-business/spring-ai-plus-app-api/sdkwork-sdk-app/sdkwork-app-sdk-typescript/src/api/*`
- Regenerate: `spring-ai-plus-business/spring-ai-plus-app-api/sdkwork-sdk-app/sdkwork-app-sdk-typescript/src/types/*`
- Modify: `spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-image/src/services/imageService.ts`
- Modify: `spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-audio/src/services/audioService.ts`
- Modify: `spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-video/src/services/videoService.ts`
- Modify: `spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-video/src/services/videoRequestBuilder.ts`
- Modify: `spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-character/src/services/characterService.ts`
- Modify: `spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-character/src/services/characterHistoryService.ts`
- Modify: `spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-film/src/services/filmService.ts`
- Modify: `spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-film/src/services/filmProjectService.ts`
- Modify: `spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-film/src/repository/filmRepository.ts`
- Modify: `spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-assets/src/asset-center/infrastructure/RemoteAssetIndexRepository.ts`

- [ ] **Step 1: Regenerate the TypeScript SDK from app-api**

Run from `spring-ai-plus-business/spring-ai-plus-app-api`:

```powershell
.\sdkwork-sdk-app\bin\generate-sdk.ps1 -Languages typescript
```

Expected: the generated `generation`, `asset`, `asset-center`, `film`, and `upload` APIs and types reflect the new contract.

- [ ] **Step 2: Replace direct frontend AI, mock, and local persistence paths**

Migrate:
- image package from direct `GoogleGenAI` to `sdk.client.generation.*`
- audio package from `genAIService` to `sdk.client.generation.textToSpeech`
- video package from mock service to `sdk.client.generation.createGenerationVideo`
- character package from local mock to `sdk.client.generation.*` plus character APIs
- film package from local storage and direct AI to `sdk.client.film.*` plus generic generation APIs

- [ ] **Step 3: Wire asset-center remote base path to app-api**

Use `/app/v3/api/asset-center` when the frontend instantiates the remote repository so the existing aggregate repository can hit the new backend correctly.

- [ ] **Step 4: Run frontend typecheck**

Run from `spring-ai-plus-business/apps/magic-studio-v2`:

```powershell
pnpm typecheck
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add spring-ai-plus-business/spring-ai-plus-app-api/sdkwork-sdk-app/sdkwork-app-sdk-typescript spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-image spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-audio spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-video spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-character spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-film spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-assets
git commit -m "refactor: route media packages through app sdk contracts"
```

### Task 9: End-to-end verification and cleanup

**Files:**
- Modify: none unless verification reveals defects

- [ ] **Step 1: Run app-api tests**

Run from `spring-ai-plus-business/spring-ai-plus-app-api`:

```powershell
mvn test
```

Expected: PASS

- [ ] **Step 2: Re-run SDK generation once after any post-test contract fix**

```powershell
.\sdkwork-sdk-app\bin\generate-sdk.ps1 -Languages typescript
```

Expected: PASS

- [ ] **Step 3: Run Magic Studio verification**

Run from `spring-ai-plus-business/apps/magic-studio-v2`:

```powershell
pnpm typecheck
pnpm test
```

Expected: PASS

- [ ] **Step 4: Final remote-business audit**

Search for remaining bypasses in the migrated domains:

```powershell
rg -n "GoogleGenAI|genAIService|fetch\\(|localStorage|platform\\.setStorage|platform\\.getStorage" spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-image spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-audio spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-video spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-character spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-film
```

Expected: no remote-business bypass remains in the migrated domains.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "chore: verify media app api alignment"
```

## Review Notes

- `spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-assets/src/asset-center/infrastructure/RemoteAssetIndexRepository.ts` already defines the aggregate contract shape the backend should follow.
- `spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-video/src/services/videoRequestBuilder.ts` is the canonical frontend request model for video and should drive the backend `VideoGenerationForm` redesign.
- `spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-film/src/services/filmService.ts` and `spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-types/src/film.types.ts` should drive the new film project aggregate and script-analysis response design.
- `D:\javasource\spring-ai-plus\spring-ai-plus-commons\src\main\java\com\sdkwork\spring\ai\plus\data\pojo\vo\BasePlusVO.java` currently exposes only `createdAt` and `updatedAt`, so the media and film VOs must add `id` and `uuid` explicitly instead of assuming inheritance already covers the standard.

## Handoff

Plan saved for backend-first execution. The recommended implementation path is:

1. App-api identity and generation contracts
2. Asset-center aggregate
3. Film aggregate
4. SDK regeneration
5. Frontend migration
