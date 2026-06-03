# AGI-Native Unified Application Standard

## Authority

This document defines Magic Studio V2 product-level business unification goals.

It is subordinate to:

- `docs/magic-studio-unified-host-api-standard.md`
- `docs/platform-runtime-capability-matrix.md`
- `docs/local-media-toolkit-architecture.md`

It does not redefine host ownership, API transport boundaries, or shell-only capability rules.

## 1. Mission

Magic Studio V2 must become an AGI-native creation system rather than a collection of point tools.

The application standard is:

1. one identity model across all domains
2. one asset model across all modalities
3. one generation model across all providers
4. one project graph across create, edit, remix, publish
5. one runtime contract across browser-hosted, desktop shell, local-first, and remote execution surfaces

This document supersedes any URL-first, task-local, or provider-shaped business model.

## 2. External Benchmark Baseline

The target standard is informed by the current product direction of leading multimodal platforms.

Reference sources:

- OpenAI image generation guide: https://platform.openai.com/docs/guides/image-generation
- OpenAI video generation with Sora: https://platform.openai.com/docs/guides/video-generation/
- OpenAI audio and speech guide: https://platform.openai.com/docs/guides/audio/quickstart
- OpenAI text-to-speech guide: https://platform.openai.com/docs/guides/text-to-speech/quick-start.pls
- Google Gemini image generation: https://ai.google.dev/gemini-api/docs/imagen-prompt-guide
- Google Gemini image understanding: https://ai.google.dev/gemini-api/docs/vision
- Google Veo model docs: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/veo/3-1-generate-preview
- Google Veo image-to-video docs: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/video/generate-videos-from-an-image
- Google text-to-speech docs: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/speech/text-to-speech
- Google Gemini-TTS multi-speaker docs: https://docs.cloud.google.com/text-to-speech/docs/create-dialogue-with-multispeakers
- Volcengine ImageX + Doubao AIGC docs: https://www.volcengine.com/docs/508/1361042
- Volcengine veImageX MCP article: https://developer.volcengine.com/articles/7599494248853864486
- Volcengine product overview: https://www.volcengine.com/sem
- Jimeng official site: https://jimeng.jianying.com/
- Kling official global app: https://app.klingai.com/global/
- Kuaishou official company page mentioning Kling AI: https://www.kuaishou.com/about/

Provider-common capability patterns observed from those sources:

1. multimodal generation is no longer isolated by modality
2. image and video workflows require typed reference inputs, not raw prompt-only calls
3. asynchronous job execution is the default for non-trivial media generation
4. generated output is not just a file, but a structured artifact with prompt, model, controls, and provenance
5. editing and generation are converging into one unified workflow
6. audio and speech require support for voice, style, speaker, transcript, and streaming concerns
7. story creation is increasingly project-oriented, not single-call oriented

## 3. North Star Product Definition

Magic Studio V2 must support the full AGI-native lifecycle:

1. understand
2. plan
3. generate
4. edit
5. compose
6. version
7. publish
8. remix

Supported business surfaces must all be treated as projections over the same canonical core:

- text and script
- image generation
- image editing
- audio generation
- speech generation
- music generation
- video generation
- short video creation
- short drama creation
- canvas ideation
- film preproduction
- timeline editing

## 4. Core Principles

### 4.1 Asset-first, never URL-first

Business state must never use raw URLs as canonical data.

Rules:

1. a URL is only a resolved delivery view
2. every generated or imported result must be registered in the asset center
3. every business object must reference assets, artifacts, or typed resource refs
4. all preview URLs must be resolved from asset identity, never persisted as business truth

### 4.2 Identity-first

All domain entities must implement immutable client identity.

Rules:

1. `uuid` is created at object construction time
2. `uuid` is immutable for the lifetime of the entity
3. `id` is nullable until persistence assigns it
4. client compare, find, update, selection, caching, optimistic update, drag state, and history state must use `uuid` first
5. non-empty `id` is only a fallback when interoperating with persisted records

### 4.3 Generation-first

AI creation must be represented as a first-class domain operation rather than a helper returning a string.

Rules:

1. every generation call must create a structured generation execution record
2. prompt, model, provider, controls, safety, references, and outputs are all mandatory parts of the model
3. generation output must always be represented as artifacts
4. tasks and jobs are orchestration state, not the product itself

### 4.4 Provider-agnostic, provider-rich

The canonical model must be provider-neutral, while still preserving provider-specific controls.

Rules:

1. common fields must live in canonical contracts
2. provider-specific request and response fields must live in `providerOptions` or `providerPayload`
3. adapters must map canonical requests to provider-specific wire contracts
4. providers must never leak their transport DTOs into UI or store state

### 4.5 Project-graph, not page-local

Canvas, film, short video, short drama, and MagicCut must all share one graph-based creation model:

1. project
2. scene
3. shot
4. sequence
5. asset
6. artifact
7. generation execution
8. publish target

## 5. Canonical Identity Standard

### 5.1 Base identity

```ts
export interface ClientEntityIdentity {
  id: string | null;
  uuid: string;
  createdAt: string | number;
  updatedAt: string | number;
  deletedAt?: string | null;
}
```

### 5.2 Identity resolution

```ts
export const resolveEntityKey = (entity: {
  uuid?: string | null;
  id?: string | null;
}): string => {
  if (entity.uuid && entity.uuid.trim().length > 0) {
    return entity.uuid;
  }
  if (entity.id && entity.id.trim().length > 0) {
    return entity.id;
  }
  throw new Error('Entity key missing');
};
```

### 5.3 Asset identity layers

Three identities must be distinguished:

1. `id`: database row identity, nullable before persistence
2. `uuid`: immutable business entity identity
3. `assetId`: asset-center aggregate identity

Extended resource identities:

1. `primaryResourceId`: the atomic primary file/resource under an asset
2. `resourceViewId`: runtime/editor projection identity

## 6. Canonical AGI Domain Model

### 6.1 Media input

```ts
export interface MediaInputRef extends ClientEntityIdentity {
  assetId: string | null;
  primaryResourceId?: string | null;
  resourceViewId?: string | null;
  type: 'text' | 'image' | 'video' | 'audio' | 'music' | 'voice' | 'subtitle' | 'file';
  role:
    | 'input'
    | 'reference'
    | 'style-reference'
    | 'character-reference'
    | 'start-frame'
    | 'end-frame'
    | 'driver-audio'
    | 'source-video'
    | 'source-image'
    | 'mask'
    | 'overlay';
  resource?: AnyMediaResource | null;
  metadata?: Record<string, unknown>;
}
```

### 6.2 Generation recipe

```ts
export interface GenerationRecipe extends ClientEntityIdentity {
  product:
    | 'text'
    | 'image'
    | 'video'
    | 'audio'
    | 'music'
    | 'speech'
    | 'short-video'
    | 'short-drama-shot'
    | 'edit-image'
    | 'edit-video';
  mode:
    | 'text-to-image'
    | 'image-to-image'
    | 'text-to-video'
    | 'image-to-video'
    | 'style-transfer'
    | 'text-to-speech'
    | 'speech-to-text'
    | 'text-to-music'
    | 'lip-sync'
    | 'inpaint'
    | 'outpaint'
    | 'expand'
    | 'upscale'
    | 'restyle';
  prompt?: string;
  negativePrompt?: string;
  instructions?: string;
  inputRefs: MediaInputRef[];
  parameters: Record<string, unknown>;
  providerOptions?: Record<string, unknown>;
}
```

### 6.3 Generation execution

```ts
export interface GenerationExecution extends ClientEntityIdentity {
  recipe: GenerationRecipe;
  provider: string;
  providerModel: string;
  status:
    | 'draft'
    | 'queued'
    | 'processing'
    | 'succeeded'
    | 'failed'
    | 'canceled'
    | 'partial';
  progress?: number;
  remoteJobId?: string | null;
  startedAt?: string | number | null;
  finishedAt?: string | number | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  usage?: Record<string, unknown>;
  providerPayload?: Record<string, unknown>;
}
```

### 6.4 Generated artifact

```ts
export interface GeneratedArtifact<TResource extends AnyMediaResource = AnyMediaResource>
  extends ClientEntityIdentity {
  assetId: string;
  primaryResourceId?: string | null;
  resourceViewId?: string | null;
  resource: TResource;
  product:
    | 'text'
    | 'image'
    | 'video'
    | 'audio'
    | 'music'
    | 'speech'
    | 'subtitle'
    | 'project';
  role:
    | 'primary'
    | 'alternate'
    | 'thumbnail'
    | 'cover'
    | 'poster'
    | 'waveform'
    | 'transcript'
    | 'subtitle'
    | 'stem'
    | 'preview';
  generation: {
    executionUuid: string;
    recipeUuid: string;
    provider: string;
    providerModel: string;
    prompt?: string;
    negativePrompt?: string;
    parameters?: Record<string, unknown>;
    inputRefs?: MediaInputRef[];
  };
}
```

### 6.5 Artifact set

```ts
export interface ArtifactSet extends ClientEntityIdentity {
  primaryArtifactUuid: string;
  artifacts: GeneratedArtifact[];
}
```

## 7. Canonical Asset Standard

The asset center remains the aggregate root for all durable media.

Rules:

1. every import produces a `UnifiedDigitalAsset`
2. every generation output must be converted into one or more `GeneratedArtifact`s backed by a `UnifiedDigitalAsset`
3. project domains store `assetId`, `uuid`, and typed refs, not URLs
4. derived files such as poster, subtitle, waveform, transcript, and thumbnails are sibling artifacts under the same asset graph when appropriate
5. asset metadata must include origin and provenance

Mandatory provenance metadata:

1. `origin`: upload, ai, stock, system
2. `provider`
3. `providerModel`
4. `recipeUuid`
5. `executionUuid`
6. `sourceAssetIds`
7. `workspaceId`
8. `projectId`
9. `domain`

## 8. Capability Taxonomy

All providers and modules must map into a shared capability taxonomy.

### 8.1 Understanding capabilities

- text understanding
- image understanding
- video understanding
- audio understanding
- multimodal understanding
- tagging and extraction
- segmentation and detection

### 8.2 Generation capabilities

- text generation
- image generation
- video generation
- speech generation
- music generation
- subtitle generation
- storyboard generation

### 8.3 Editing capabilities

- inpaint
- outpaint
- expand
- restyle
- upscale
- remove object
- background replace
- lip-sync
- revoice
- redub
- extend clip
- remix

### 8.4 Composition capabilities

- multi-image fusion
- multi-shot sequence planning
- timeline assembly
- short drama scene assembly
- brand asset consistency

## 9. Module Standardization Rules

### 9.1 Image studio

Must own:

1. image generation recipe construction
2. image edit recipe construction
3. image artifact browsing and reuse

Must not own:

1. raw asset persistence details
2. provider DTOs
3. identity helper duplication

### 9.2 Video studio

Must support:

1. text-to-video
2. image-to-video
3. start-frame / end-frame controlled generation
4. reference-guided generation
5. lip-sync
6. derived poster and transcript artifacts when available

Canonical boundary rule:

- UI-facing `VideoConfig.mode` may keep `video-to-video` as an interaction alias, but canonical request, execution, and artifact history state must normalize that mode to `style-transfer` before persistence or cross-surface transport.

### 9.3 Audio, speech, and music

Must distinguish:

1. speech
2. voice
3. audio effect
4. music
5. transcript

Speech must preserve:

1. voice choice
2. style instructions
3. speaker structure
4. transcript if available
5. streaming or batch mode

### 9.4 Canvas

Canvas must become a graph authoring surface over typed refs:

1. no `referenceImages: string[]`
2. no `resultUrl`
3. nodes reference `MediaInputRef[]`, `GeneratedArtifact[]`, and project graph bindings
4. canvas output is promotable to film, video, or MagicCut without lossy conversion

### 9.5 Film

Film must become the canonical preproduction system:

1. scene
2. shot
3. character
4. location
5. prop
6. dialogue
7. shot generation recipe
8. generated shot artifacts

Film generation must store recipes and artifacts, not only URLs.

### 9.6 MagicCut

MagicCut remains the canonical postproduction system:

1. timeline state consumes asset-backed resource views
2. clips and layers point to `assetId` and `resourceViewId`
3. exports are generated artifacts and publish outputs
4. imported or generated materials must always come from the same asset graph

## 10. Runtime and Provider Orchestration Standard

### 10.1 Execution model

Every provider integration must support:

1. create execution
2. submit provider job
3. poll or receive callback
4. normalize provider result
5. import asset
6. emit artifacts
7. update project graph

### 10.2 Transport isolation

Provider adapters may use:

1. synchronous response
2. asynchronous long-running operation
3. streaming response
4. callback or webhook

Business state must never encode those transport differences directly.

### 10.3 Failure model

All executions must support:

1. retryable vs non-retryable errors
2. partial completion
3. cancellation
4. timeout
5. provider quota errors
6. moderation or safety errors

## 11. Persistence Standard

Durable business storage must persist:

1. canonical entity identity
2. recipe
3. execution
4. artifacts
5. asset references
6. project graph relations

Durable business storage must not persist:

1. blob URLs
2. temporary object URLs
3. page-local selection keys
4. transport-layer provider DTOs

## 12. Quality Gates

The standard is only considered implemented when all of the following are true:

1. no business module persists a raw URL as canonical output
2. no generation service returns `Promise<string>` for generated media
3. every business entity has `uuid`, and `id` is nullable until persistence
4. all client compare, find, update, selection, and cache operations use `uuid` first
5. all generated media is saved into the asset center
6. canvas, film, video, image, audio, music, and MagicCut share the same asset and artifact model
7. provider-specific controls are isolated to adapters
8. every generated result preserves prompt, model, parameters, and source refs

## 13. Mandatory Rewrite Decisions

Because this is a new application with no compatibility burden, the following rewrite decisions are approved by default:

1. remove URL-first task result contracts
2. remove page-local import DTOs that only contain `fileUrl`
3. remove `id = uuid` constructor shortcuts
4. remove store logic keyed only by `id`
5. replace canvas URL fields with typed refs and artifacts
6. replace shared generation history selection by URL with artifact identity
7. converge all business modules on the asset-center and artifact graph

## 14. Final Definition Of Done

Magic Studio V2 reaches the AGI-native standard only when:

1. any generated image, video, audio, music, speech, subtitle, or derived media is visible in one unified asset center
2. any asset can be reused consistently across canvas, film, video, image, audio, music, and MagicCut
3. any generation can be replayed, audited, remixed, and compared from its structured recipe and artifact history
4. any client-side update can be performed using immutable `uuid` identity without depending on raw URLs or database ids
5. any provider can be swapped or expanded without rewriting business UI and store contracts
