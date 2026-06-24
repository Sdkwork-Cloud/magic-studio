> Migrated from `docs/magic-studio-unified-host-api-standard.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Magic Studio Unified Host and API Standard

## Status

This document is the primary source of truth for Magic Studio V2 host, runtime, backend, API, and storage architecture as of 2026-04-23.

It supersedes the historical high-level architecture narratives in:

- `docs/architect-react+tauri.md`
- `docs/architect-react+tauri copy.md`
- `docs/architect-standard-react+tauri.md`

Those documents now remain only as redirect stubs so they cannot continue to act as shadow architecture references.

Use this document together with:

- `docs/standards/magic-studio-authority-matrix.md` for package, server, and shell ownership summary
- `docs/magic-studio-api-route-catalog.md` for the generated route-by-route API inventory
- `docs/magic-studio-api-capability-matrix.md` for current API inventory and business API extraction blueprint
- `docs/tauri-rust-framework-architecture.md` for the desktop-shell specialization
- `docs/platform-runtime-capability-matrix.md` for runtime API exposure
- `docs/local-media-toolkit-architecture.md` for media/toolkit specialization

## Non-Negotiable Decisions

1. Magic Studio has exactly one business capability kernel:
   - `packages/sdkwork-magic-studio-server/src-host`
2. That kernel is hosted in exactly two ways:
   - standalone server deployment
   - embedded desktop host started by Tauri during native startup
3. `src-tauri` is a shell-only host layer, not a second application backend.
4. Frontend business flows must target canonical Rust HTTP APIs or runtime facades, never Tauri business invoke commands.
5. Storage topology, managed asset resolution, and runtime classification are shared cross-host contracts, not per-host conventions.

## Host Model

### Server Deployment

- The Rust host runs as a standalone HTTP server.
- Browser clients talk to the same canonical route catalog used by desktop mode.
- Same DTO naming, same OpenAPI document, same capability governance, same job model.

### Desktop Deployment

- Tauri boots native shell services and starts the embedded Rust host.
- Frontend desktop mode waits for canonical server readiness before server-backed flows initialize.
- Desktop-only behavior is limited to shell concerns such as PTY, browser shell integration, native window controls, dialogs, clipboard, notifications, opener, and updater integration.
- Draggable shell titlebar regions must use shared shell UI helpers instead of handwritten `data-tauri-drag-region` attributes.

## Frontend Runtime Model

Frontend runtime kinds remain:

- `web`
- `server`
- `desktop`

But there are only two host families:

- browser-hosted: `web` and `server`
- desktop shell: `desktop`

Rules:

- Feature code must use runtime capability APIs and the shared runtime-family helpers:
  - `isBrowserHostedRuntimeKind(...)`
  - `isDesktopShellRuntimeKind(...)`
- New and migrated feature code must prefer `getPlatformRuntime()` capability domains over the legacy `platform` compatibility object.
- Feature code must not treat literal `web` as the only browser-hosted runtime.
- Shared business and storage packages should not branch on raw `platform.getPlatform()` checks when the runtime surface already exposes the needed capability or host-family classification.
- Shared packages that cannot depend on `@sdkwork/magic-studio-core/platform` may only consume the injected `window.__sdkworkPlatformRuntime` capability global. `window.__sdkworkPlatform` is retired.
- Shared packages that read `window.__sdkworkPlatformRuntime` must centralize runtime-kind and desktop-shell classification behind one local helper module instead of scattering literal runtime-string checks across components and services.
- Shared packages that read `window.__sdkworkPlatformRuntime` should expose both browser-hosted and desktop-shell classifiers from that helper module so `server` never gets reintroduced as an ad hoc `web || server` condition.
- `server` means same-origin canonical Rust host discovery promoted the browser app into the standalone server profile.
- SDK bootstrap and app environment normalization must preserve `server` as a first-class public platform value after canonical runtime promotion. They must not collapse promoted server delivery back into `web`.
- Downstream contracts may define a vocabulary that is narrower than runtime kinds. When that happens, map runtime kind into the downstream contract through one centralized adapter instead of leaking raw runtime strings into feature code.
- The auth contract is the canonical example of that rule: `desktop` runtime maps to auth `deviceType: 'desktop'`, while browser-hosted `web` and `server` runtimes both map to auth `deviceType: 'web'`.
- Service and domain layers must prefer focused package subpaths over broad UI-root entries when they only need a narrow helper. Cross-package plumbing must not depend on presentation-root facades by default.
- Foundational cross-package DTOs, pagination models, service-result envelopes, runtime-neutral enums, entity-identity helpers, and canonical workspace/project contracts must come from `@sdkwork/magic-studio-types`.
- Canonical focused `@sdkwork/magic-studio-types` contract entrypoints are:
  - `@sdkwork/magic-studio-types/entity`
  - `@sdkwork/magic-studio-types/service`
  - `@sdkwork/magic-studio-types/pagination`
  - `@sdkwork/magic-studio-types/storage`
  - `@sdkwork/magic-studio-types/media`
  - `@sdkwork/magic-studio-types/assets`
  - `@sdkwork/magic-studio-types/asset-center`
  - `@sdkwork/magic-studio-types/image`
  - `@sdkwork/magic-studio-types/video`
  - `@sdkwork/magic-studio-types/audio`
  - `@sdkwork/magic-studio-types/music`
  - `@sdkwork/magic-studio-types/character`
  - `@sdkwork/magic-studio-types/voice`
  - `@sdkwork/magic-studio-types/sfx`
  - `@sdkwork/magic-studio-types/chat`
  - `@sdkwork/magic-studio-types/chatppt`
  - `@sdkwork/magic-studio-types/agi`
  - `@sdkwork/magic-studio-types/input-resource`
  - `@sdkwork/magic-studio-types/vocabulary`
  - `@sdkwork/magic-studio-types/catalog`
  - `@sdkwork/magic-studio-types/content`
  - `@sdkwork/magic-studio-types/user`
  - `@sdkwork/magic-studio-types/workspace`
  - `@sdkwork/magic-studio-types/runtime`
  - `@sdkwork/magic-studio-types/infrastructure`
  - `@sdkwork/magic-studio-types/theme-mode`
  - `@sdkwork/magic-studio-types/asset-reference`
- Ownership inside `@sdkwork/magic-studio-types` is explicit:
  - `vocabulary`: runtime-neutral enums and shared string-union vocabulary
  - `assets`: generic asset entities, asset metadata, asset categories, and non-center asset DTOs
  - `asset-center`: unified digital asset aggregate, asset scope/storage/reference/query contracts, and portal-launch asset orchestration DTOs
  - `image`: image-only aspect-ratio and image-specific contract families
  - `video`: video generation, result, input-resource, and preset contracts
  - `audio`: audio generation, transcription, translation, and speech task contracts
  - `music`: music generation, remix/extend workflow, and music result contracts
  - `character`: character/avatar generation and character conversation contracts
  - `voice`: voice speaker, voice clone/design, and generated voice result contracts
  - `sfx`: sound-effect generation and generated sfx result contracts
  - `chat`: chat session, message, transcript, and chat agent contracts
  - `chatppt`: presentation, slide, theme, and presentation-authoring contracts
  - `catalog`: generation/model catalog contracts
  - `content`: gallery/style/attachment/content DTOs
  - `user`: user settings and app notification DTOs
  - `workspace`: project/workspace topology contracts
- Foundational runtime, storage, service, and domain files must consume those focused `@sdkwork/magic-studio-types` subpaths when they only need one contract family. The broad root entry remains a convenience facade, not the default dependency for low-level package internals.
- Media feature packages must follow the same owner mapping in shared internals:
  - identity helpers such as `createUuid(...)`, `matchesEntityKey(...)`, and `resolveEntityKey(...)` belong to `@sdkwork/magic-studio-types/entity`
  - generation execution/outcome/input contracts belong to `@sdkwork/magic-studio-types/agi`
  - renderable URL and stable locator classification belongs to `@sdkwork/magic-studio-types/input-resource`
  - generic asset selection/persistence DTOs belong to `@sdkwork/magic-studio-types/assets`
  - provider registry contracts belong to `@sdkwork/magic-studio-types/infrastructure`
  - image-only aspect-ratio contracts belong to `@sdkwork/magic-studio-types/image`
  - media-domain task/result contracts belong to `@sdkwork/magic-studio-types/video`, `@sdkwork/magic-studio-types/audio`, `@sdkwork/magic-studio-types/music`, `@sdkwork/magic-studio-types/character`, `@sdkwork/magic-studio-types/voice`, and `@sdkwork/magic-studio-types/sfx`
  - chat session/message/transcript contracts belong to `@sdkwork/magic-studio-types/chat`
  - presentation/slide/theme contracts belong to `@sdkwork/magic-studio-types/chatppt`
- Canonical focused low-level `@sdkwork/magic-studio-commons` utility entrypoints are:
  - `@sdkwork/magic-studio-commons/utils/helpers`
  - `@sdkwork/magic-studio-commons/utils/logger`
  - `@sdkwork/magic-studio-commons/utils/assetIdentity`
  - `@sdkwork/magic-studio-commons/utils/serviceAdapter`
- Focused algorithmic structures that still belong to `@sdkwork/magic-studio-commons` must be imported from explicit non-root subpaths such as `@sdkwork/magic-studio-commons/algorithms`, never from the broad root entry.
- Foundational runtime, storage, service, store, and domain files must import those focused utility entrypoints instead of reaching the broad `@sdkwork/magic-studio-commons` root for `pathUtils`, `generateUUID`, logger primitives, asset identity helpers, or service-adapter plumbing.
- Foundational runtime, storage, service, store, and domain files must not import `Result`, `ServiceResult`, `Page`, `PageRequest`, `Sort`, `matchesEntityKey`, `resolveEntityKey`, media/resource enums, or shared asset DTOs from the broad `@sdkwork/magic-studio-commons` root. Those contracts belong to `@sdkwork/magic-studio-types`.
- Low-level packages must not duplicate canonical entity-identity helpers such as `deriveClientEntityUuidFromId(...)` locally when `@sdkwork/magic-studio-types/entity` already owns the behavior.

## Canonical API System

### Surface Taxonomy

| Surface | Base Path | Auth Mode | Ownership |
| --- | --- | --- | --- |
| `core` | `/api/core/v1` | `host` | local runtime, toolkit, jobs, policy, migrations, sqlite, route discovery |
| `app` | `/api/app/v1` | `user` | application-facing product APIs |
| `admin` | `/api/admin/v1` | `admin` | governance, deployment, and control-plane APIs |

### Discovery and Documentation

- Health: `/healthz`
- Docs page: `/docs`
- Live OpenAPI: `/openapi.json`
- Versioned OpenAPI: `/openapi/magic-studio-server-v1.json`
- Route catalog: `/api/core/v1/routes`
- Runtime summary: `/api/core/v1/runtime/summary`

### Contract Ownership

Canonical API ownership is split by responsibility, not duplicated by host:

- Route inventory: `packages/sdkwork-magic-studio-server/contracts/magic-studio-server.contract.json`
- TypeScript contract facade: `packages/sdkwork-magic-studio-server/src/contract.ts`
- TypeScript client surface: `packages/sdkwork-magic-studio-server/src/client.ts`
- Rust contract loader: `packages/sdkwork-magic-studio-server/src-host/src/contract.rs`
- Rust route implementation: `packages/sdkwork-magic-studio-server/src-host/src/routes/*`
- Host/runtime/server transport DTOs: `packages/sdkwork-magic-studio-host-types/src/*`
- Cross-domain business DTOs: `packages/sdkwork-magic-studio-types/src/*`

Rules:

- `@sdkwork/magic-studio-host-types` owns canonical host/runtime/server transport shapes, discovery/governance envelopes, toolkit DTOs, and public request/response contracts that are specific to the Rust host surface.
- `@sdkwork/magic-studio-types` owns shared domain transport shapes, pagination/service/entity/resource contracts, and cross-feature product vocabulary.
- `@sdkwork/magic-studio-host-core` owns network host/baseUrl discovery only. It must not own canonical health/docs/openapi/route-catalog/runtime-summary path authority.
- Public host resolution input and full host descriptor authority belong to `@sdkwork/magic-studio-server`, even when the implementation delegates low-level connection discovery to `@sdkwork/magic-studio-host-core`.
- Published API version constants, canonical surface inventory, and surface base-path constants are derived by `@sdkwork/magic-studio-server` from the canonical contract JSON.

### Route Authoring Rules

Every canonical route must satisfy all of the following:

1. It exists in `magic-studio-server.contract.json`.
2. It belongs to one of `core`, `app`, or `admin`.
3. It declares a stable semantic route id such as `coreMediaVideoConcat`.
4. The route id is the canonical semantic key across TypeScript contract facades, Rust host wiring, route catalog payloads, and OpenAPI `operationId`.
5. It declares a stable method and canonical path.
6. Every body-bearing route declares `requestBodySchema`.
7. Every route declares `successResponseSchema`.
8. OpenAPI output is generated from the same canonical ownership graph.
9. TypeScript clients resolve path constants from the contract facade instead of hardcoded `/api/...` string fragments.
10. Rust host routing must resolve canonical public paths by route id instead of rebuilding `surface + suffix` path conventions at call sites.
11. Contract `meta` must reference discovery routes by canonical route id instead of duplicating health, route-catalog, or runtime-summary path strings.
12. Parameterized public paths and OpenAPI paths must be materialized through canonical server contract helpers, not ad hoc `:param` string replacement in clients, tests, or host wiring.

### DTO and Naming Rules

- Shared request and response DTOs use neutral product vocabulary.
- Public DTO names must not leak host implementation words such as `Tauri`, `invoke`, or internal tool aliases when a product-level name exists.
- Public route names must prefer business meaning over implementation history.
- Cross-family task governance belongs to `/api/app/v1/generation/tasks`; internal storage words such as `history`, `registry`, or package-local task tables must not leak into the public generation-governance route vocabulary.
- Cross-family cancel governance, when exposed, belongs to `/api/app/v1/generation/tasks/:taskId/cancel` and must delegate to real host-owned task-family semantics; products without a true canonical cancel implementation must return an explicit unsupported error instead of a fake success or silent no-op.
- Schema naming must stay stable across Rust host, OpenAPI document, and TypeScript clients.
- Canonical `app` route and persisted task operation names must use the server contract vocabulary, even when the UI keeps a narrower alias for interaction design.
- `style-transfer` is the canonical server/app operation name for source-video stylization. `video-to-video` is a frontend generation-mode alias and must be translated before it becomes persisted host task state or server capability vocabulary.
- `VideoConfig.mode` may keep UI aliases, but `UnifiedVideoGenerationRequest.generationType`, `GenerationRecipe.mode`, persisted task metadata, and canonical capability payloads must use the normalized server vocabulary.
- Public runtime metadata and diagnostics must use `desktop` / `desktop shell` vocabulary such as `desktopShellVersion`, never implementation-detail names such as `tauriVersion`.
- Canonical runtime kind and public app platform vocabularies belong to `@sdkwork/magic-studio-types`. Higher layers may adapt them, but must not re-declare competing string-union authorities.
- Public platform types must not expose generic raw native bridge methods; shell bridging belongs behind the closed `runtime.bridge` surface.

### Execution Adapter Rules

- Provider-backed generation and voice execution must terminate inside `packages/sdkwork-magic-studio-server/src-host/src/services`, not in frontend packages or Tauri shell commands.
- When a real upstream/provider mapping exists, the Rust host must normalize the result into canonical task status, provider payload, and artifact records on the existing `app` routes instead of introducing parallel transport contracts.
- `GET /api/app/v1/capabilities/execution` must expose both family-level aggregate readiness and operation-level readiness through `operationDetails`, so desktop and server consumers can make identical routing decisions from the same Rust-owned truth source.
- Frontend service-layer methods that submit, query, cancel, or prompt-enhance provider-backed generation or voice operations must preflight the exact operation with `assertRuntimeMagicStudioExecutionOperationReady(...)` from `@sdkwork/magic-studio-core` before calling a generated SDK or canonical runtime server client.
- React UI consumers should use the shared `useRuntimeMagicStudioExecutionOperationCapability(...)` hook from `@sdkwork/magic-studio-core/platform` to project canonical Rust-host operation truth into disabled buttons, mode affordances, and inline reason text. Non-React consumers may use `readRuntimeMagicStudioExecutionOperationCapability(...)` directly.
- UI capability consumption is advisory. Service-layer preflight remains the mandatory final enforcement.
- When a route family is only partially backed by a real upstream mapping, capability discovery and architecture docs must describe that honestly at operation level, for example:
  - image: text-to-image, prompt-guided image-to-image, variation, edit, and host-local upscale may execute while the same canonical route family still exposes lifecycle-only operations whenever the needed adapter/runtime is unavailable
  - video: text-to-video and image-to-video may execute while extend/style-transfer/lip-sync remain lifecycle-only
  - music: text-to-music, similar, remix, and extend may execute through the shared music adapter while task lookup remains host-local
  - character: create may execute through the shared image adapter while list/read/cancel remain host-local character task lifecycle operations
  - sfx: create may remain lifecycle-only while task list/read/cancel and category discovery still execute through canonical host persistence
- Generated SDK parity gaps must be disclosed explicitly. If an upstream generated SDK does not currently publish an operation such as `generation.lipSyncVideo`, Magic Studio may keep a local compatibility request shape and runtime feature-detect the bridge, but it must not pretend that generated-contract parity already exists.
- Unsupported operations must remain standardized lifecycle contracts or explicit failures. They must never return fake provider success payloads just to preserve surface symmetry, and lifecycle-only clone routes must not auto-promote tasks or preview metadata to a successful provider-backed state.
- Conversation persistence may be standardized ahead of chat execution. Durable chat session metadata and transcript storage belong to `/api/app/v1/chat/sessions` and `/api/app/v1/chat/sessions/:sessionId/transcript`, but message-stream submission must not become a public route until the host owns moderation, attachment resolution, model policy, and streaming lifecycle semantics.

### Frontend API Consumption Rules

Frontend business code must use one of:

- generated SDKs
- canonical runtime server clients
- focused package facades that sit on top of those clients

Frontend business code must not use:

- raw `fetch` against ad hoc `core/app/admin` URLs inside feature packages
- direct `@tauri-apps/*` imports for product behavior
- Tauri invoke commands as a business transport fallback
- legacy package-specific model/discovery SDK bridges when a canonical `app` route family already exists, including creation target/channel/model/style discovery
- overloading `GET /api/app/v1/creation/capabilities` as a selector-only read model when the narrower canonical generation catalog routes under `/api/app/v1/generation/catalog/*` already provide provider/model/style/voice projections for UI selection
- ad hoc package-local saved-preset persistence once the Rust host owns reusable creation defaults; durable creation presets must live behind `/api/app/v1/creation/presets` so server deployment and desktop embedding share one canonical source of truth
- ad hoc package-local multi-step recipe or template persistence once the Rust host owns reusable creation workflows; durable creation templates must live behind `/api/app/v1/creation/templates` and must materialize canonical session state through the same Rust-owned creation contract instead of browser-local joins
- ad hoc browser `localStorage` or similar package-local persistence for cross-surface product handoff state once the Rust host owns the workflow, including canonical creation handoff through `/api/app/v1/creation/sessions`
- ad hoc package-local creation history persistence once the Rust host owns the workflow; canonical cross-media history must live behind `/api/app/v1/creation/history` with standard list/read/upsert/favorite/delete/clear semantics so server deployment and desktop embedding share one durable source of truth
- ad hoc package-local multi-item creation orchestration or batch-planning persistence once the Rust host owns that workflow; durable creation batches must live behind `/api/app/v1/creation/batches`, and materialization into current-session state must stay on the same Rust-owned creation contract
- media feature packages such as `image`, `audio`, `music`, `video`, `sfx`, and `character` must treat history persistence as host-owned infrastructure and only provide task-to-entry mapping on top of the shared `@sdkwork/magic-studio-generation-history` store layer
- imported media tasks for those canonical creation-history packages must be written through the host-backed history service immediately; in-memory insertion without host persistence is not compliant
- cross-family task listing, lookup, and deletion must go through `/api/app/v1/generation/tasks`, and cross-family honest cancel must go through `/api/app/v1/generation/tasks/:taskId/cancel`; feature packages must not read raw generation registry files or invent parallel package-local task governance endpoints
- durable workspace topology, recent-project discovery, project-open activity, project duplication, archive/restore lifecycle, and canonical workspace-project session state must go through `/api/app/v1/workspaces`; package-local `localStorage` or ad hoc filesystem conventions are not compliant once the host owns that namespace
- canonical workspace-project session state must extend `/api/app/v1/workspaces/:workspaceId/projects/:projectId/session`; arbitrary-folder editor fallback outside a canonical workspace project may remain package-local, but it must not create a parallel `editor` or `browser` API family
- durable workspace-project git synchronization, git-sync history read models, latest-sync reads, canonical retry lineage, release packaging, latest-release reads, release soft-delete/restore retention governance, release retention statistics, bounded prune orchestration, release retention-policy configuration and apply orchestration, release manifest inspection, immutable rebuild orchestration with release lineage, and release artifact download must stay under the same `workspaces` family, specifically `/api/app/v1/workspaces/:workspaceId/projects/:projectId/git-sync`, `/api/app/v1/workspaces/:workspaceId/projects/:projectId/git-syncs`, and `/api/app/v1/workspaces/:workspaceId/projects/:projectId/releases`; fleet-level retention execution/audit belongs under `/api/admin/v1/governance/workspace-release-retention/runs`, and fleet-level recurring governance belongs under `/api/admin/v1/governance/workspace-release-retention/schedules`; `editor` must provide UX only and must not invent a parallel publish/deploy transport surface
- operator-facing execution inventory, health, failure, provider-detail, reconcile, failure-acknowledgement, and failure-retry governance must live under `/api/admin/v1/governance/execution/*` and be derived from the canonical `app/capabilities/execution` truth, rather than introducing a second package-local readiness registry or desktop-only provider audit surface
- durable chat session metadata and transcript persistence must go through `/api/app/v1/chat/sessions` and `/api/app/v1/chat/sessions/:sessionId/transcript`; package-local browser persistence for cross-host chat history is not compliant once the host owns that namespace
- durable presentation entities and slide mutations must go through `/api/app/v1/presentations`; package-local `localStorage` persistence for cross-host presentation state is not compliant once the host owns that namespace
- feature packages that consume canonical generation-task governance should do so through a shared adapter/store layer such as `@sdkwork/magic-studio-generation-history`, rather than open-coding direct `listGenerationTasks` / `readGenerationTask` / `deleteGenerationTask` / `cancelGenerationTask` loops in each package service
- feature packages that submit canonical host task families and then poll by task id should use the shared runtime polling helper from `@sdkwork/magic-studio-core/services` instead of hand-maintaining duplicated `setTimeout` retry loops in each media package
- `voices` history belongs to the canonical `/api/app/v1/voices/*` namespace, not package-local persistence; imported voice speech results must persist through the host-owned `PUT /api/app/v1/voices/speech/tasks/:taskId` upsert contract instead of inventing a browser-local workaround or a second history store
- host-critical runtime and business entrypoints should prefer public `@sdkwork/magic-studio-core` subpaths such as `router`, `platform`, `services`, and `sdk` over the broad root entry
- new capability-aware feature code must not introduce fresh `platform.*` calls when an equivalent `getPlatformRuntime().<domain>` capability already exists
- media feature services should centralize canonical host-capability gating behind shared `@sdkwork/magic-studio-core` runtime helpers instead of open-coding `capabilities/execution` fetch logic inside each package

## Storage and Asset Standard

`@sdkwork/magic-studio-core/storage` is the canonical owner of Magic Studio runtime storage topology and runtime-backed asset resolution.

`@sdkwork/magic-studio-types/asset-reference` is the canonical owner of pure Magic Studio asset-reference syntax and classifier helpers.

Rules:

- Runtime root and user layout must be resolved through shared runtime-backed helpers.
- Browser-hosted `server` runtime must resolve canonical system paths from Rust runtime summary instead of web-only placeholder paths such as `/home/web_user`.
- The canonical managed asset protocol is `assets://`.
- Host-owned workspace governance metadata such as git-sync registries and release registries must live in host-managed metadata directories outside the project source tree, and generated release artifacts must live under host-generated output roots instead of being persisted into user project content.
- Feature code that needs to classify `assets://`, `file://`, `desktop://`, raw local paths, or renderable URLs must use the shared `@sdkwork/magic-studio-types/asset-reference` helpers instead of hand-written prefix parsing.
- Shared asset storage descriptors must use the canonical storage modes `browser-vfs`, `desktop-fs`, `remote-url`, and `hybrid`.
- Ad hoc storage proxy HTTP contracts are not part of the standard. Frontend packages must not invent standalone `/upload-url`, `/list`, `/download`, `/delete`, `/exists`, or `/sign` storage APIs outside `@sdkwork/magic-studio-server`.
- If object storage needs a service-backed workflow in both standalone server deployment and desktop host mode, that workflow must be authored as canonical Rust server routes and consumed through the shared server contract/package facade.
- When a host-local locator must be represented explicitly outside managed assets, use `file://` or `desktop://`. Legacy Tauri-local asset naming is retired.
- Renderable preview/player URLs for `assets://`, `file://`, `desktop://`, and raw local filesystem paths must be materialized through shared resolvers such as `useAssetUrl(...)`, `resolveAssetUrlByAssetIdFirst(...)`, or canonical runtime storage helpers. Feature code must not call `convertFileSrc(...)` directly on locator strings.
- Feature code must not strip `assets://` with ad hoc string replacement.
- Static legacy storage exports such as `storageConfig`, `APP_ROOT_DIR`, `DIR_NAMES`, `PROJECT_SUBDIRS`, `CACHE_SUBDIRS`, and `SYSTEM_LIBRARY_DIRS` are retired.

### Canonical System Library Taxonomy

Managed global library directories are fixed:

- `system/library/video`
- `system/library/image`
- `system/library/audio`
- `system/library/text`
- `system/library/other`

No alternate canonical buckets such as `downloads`, `images`, `models`, or `misc` are allowed in new architecture work.

## Desktop Shell Boundary

`src-tauri` is allowed to own shell-only concerns:

- PTY/session lifecycle
- external URL opening and file-reveal shell actions
- command existence checks
- window, app, dialog, notification, and updater shell affordances

The allowed shell command vocabulary is intentionally closed:

- `create_pty`
- `kill_pty`
- `resize_pty`
- `start_pty`
- `sync_pty_sessions`
- `system_command_exists`
- `write_pty`

Desktop-native file reads, writes, metadata checks, rename, copy, and delete operations must flow through the canonical Rust HTTP contract. Direct frontend use of `plugin-fs` is not part of the standard.

`src-tauri` must not reintroduce business command modules for:

- media
- compression
- database
- migrations
- jobs
- policy
- toolkit orchestration
- governance APIs

If a capability must exist in both standalone server mode and desktop mode, it belongs in the Rust server kernel.

## Runtime Import and Initialization Contract

Platform and runtime infrastructure must be import-safe and lazy:

- no eager IndexedDB construction at module import time
- no import-time runtime creation when lazy initialization is possible
- no import-time platform logging side effects
- no import-time environment snapshot that can freeze browser-hosted `server` delivery as `web` before canonical runtime promotion completes
- node-like environments must be able to import core platform entrypoints without browser storage failures

This rule exists to keep shared packages testable, embeddable, and safe for server-side tooling.

## Review Findings Closed by This Standard

The major architectural problems already identified in Magic Studio were:

1. Historical documents promoted Tauri as a broad product backend instead of a shell host.
2. Frontend runtime guidance did not consistently distinguish browser-hosted `server` from raw `web`.
3. Storage ownership drifted through legacy static constants and protocol-stripping helpers.
4. Older architecture narratives encouraged direct plugin or native API usage in feature code.

This standard closes those gaps by defining one kernel, one contract system, one storage authority, and one approved shell boundary.

## Implementation Checklist

New work is compliant only if all answers are yes:

1. Does the capability belong in the Rust server instead of `src-tauri`?
2. Is the public route declared in the canonical contract JSON?
3. Does OpenAPI describe the same request and response schemas?
4. Does the TypeScript client consume contract constants instead of hardcoded path strings?
5. Does frontend code use runtime facades or generated SDKs instead of direct host APIs?
6. Does runtime-backed storage flow through `@sdkwork/magic-studio-core/storage` helpers?
7. Are managed assets represented as `assets://` locators?
8. Are browser-hosted runtime checks using the shared runtime-family helpers?
9. Is runtime initialization lazy and import-safe?
10. Would the same behavior work in both standalone server and desktop host modes without a parallel implementation?

If any answer is no, the change is not aligned with the Magic Studio standard.

