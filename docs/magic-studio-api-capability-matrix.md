# Magic Studio API Capability Matrix

## Status

This document is the canonical API capability inventory and extraction blueprint for Magic Studio V2 as of 2026-04-23.

Use it together with:

- `docs/magic-studio-unified-host-api-standard.md` for host/runtime/API authority
- `docs/magic-studio-api-route-catalog.md` for the generated route-by-route contract inventory
- `ARCHITECT.md` for the root architecture summary
- `packages/sdkwork-magic-studio-server/contracts/magic-studio-server.contract.json` for the current canonical route contract

This document does not replace the canonical route contract. It records:

- what is already implemented in the canonical Rust host API
- which package capabilities are still trapped inside frontend/package services
- which of those capabilities should become `core`, `app`, or `admin` APIs
- which capabilities should deliberately remain package-local and not become host APIs

## Decision Rules

### Extract To `core`

Use the `core` surface when the capability is host-native infrastructure:

- filesystem
- media toolkit
- compression
- SQLite
- migrations
- policy
- runtime diagnostics
- local async jobs

`core` is not a business API surface.

### Extract To `app`

Use the `app` surface when the capability is product-facing and must stay stable across server deployment and desktop embedding:

- assets
- workspace and project topology
- notes
- drive
- settings
- notifications
- film and magiccut project flows
- auth, user, generation, trade, VIP, and portal-facing product APIs

The `app` surface may be implemented in two ways behind the same contract:

1. host-owned local business capability
2. canonical gateway/proxy to upstream product services or generated SDK-backed services

Clients must not care which implementation mode is active.

### Extract To `admin`

Use the `admin` surface when the capability is operator-facing:

- deployment inventory
- runtime governance
- policy audit
- plugin governance
- job audit and diagnostics
- storage/provider governance

### Keep Package-Local

Do not create host APIs for:

- pure UI helpers
- ephemeral interaction state
- view-only adapters
- browser-only formatting helpers
- shell-only presentation affordances

Examples that should stay package-local by default:

- browser URL normalization helpers
- favicon derivation helpers
- canvas selection and interaction helpers
- editor-only transient view mechanics that are not scoped to a canonical workspace project
- player preview widgets

## Current Architecture Snapshot

Magic Studio currently has:

- exactly one business capability kernel:
  - `packages/sdkwork-magic-studio-server/src-host`
- exactly two delivery modes:
  - standalone server deployment
  - embedded desktop host started by `src-tauri`
- exactly three public runtime kinds:
  - `web`
  - `server`
  - `desktop`
- exactly three canonical API surfaces:
  - `core`
  - `app`
  - `admin`

Current route totals in the canonical server contract:

- `core`: 39 routes
- `app`: 366 routes
- `admin`: 23 routes
- total: 428 routes

The Rust host is now structurally correct as the single business kernel for both server deployment and desktop embedding. It owns host-native infrastructure plus real product APIs for capabilities discovery, creation capability catalog discovery, durable creation batch orchestration and materialization, reusable creation preset lifecycle, reusable creation template lifecycle, canonical generation catalog read-model discovery for provider/model/style/voice selection, canonical cross-family generation task governance, canonical creation session handoff, canonical cross-media creation history, auth/session, user center, security governance with canonical session/device/two-factor management, settings, notifications, workspaces/projects plus recent-project discovery, durable open activity, filesystem-backed duplication, archive/restore lifecycle, canonical project-session roaming, canonical project git remote synchronization with sync-history read models, latest-sync read models, retry lineage, canonical project release packaging with host-owned artifact download, latest-release read models, manifest inspection, immutable rebuild orchestration with release lineage, soft-delete retention governance, restore governance, release retention statistics, bounded prune orchestration, release retention-policy configuration, release retention-policy apply orchestration, assets, drive, canonical film project persistence with server-side query semantics plus host-owned preset catalog/create/apply, reusable template lifecycle and instantiation, project-owned template snapshot creation, canonical asset inventory, canonical publish history/detail/artifact access, project-level canonical review queue discovery, project-level portfolio dashboards, project-level reviewer-capacity forecasting, project-level decision-freshness analytics, project-level governance-drift supervision, project-level escalation forecasting, project-level dependency-graph projection, project-level intervention planning, project-level recovery orchestration, project-level approval burn-down supervision, project-level intervention outcome supervision, project-level effectiveness baselining, project-level intervention execution history, typed canonical publish review-state query, host-derived canonical publish review timeline and review-round projections, canonical publish review anchors, canonical publish review activity, canonical publish review decision matrix, canonical publish review readiness, canonical reviewer coverage projections, canonical reviewer backlog and SLA projections, canonical reviewer attention projections, canonical stale-decision and drift projections, canonical reviewer-worklist projections, canonical review-operations dashboard snapshots, canonical review latency and throughput analytics, canonical publish review assignments, canonical review submit/resubmit workflow, canonical reviewer-consensus governance, threaded canonical publish review comments, canonical publish comment resolution, canonical publish approval/request-changes/reopen governance, canonical publish restoration, publish deletion, asset relink and locator migration repair, storyboard publish bundles with canonical project snapshots and canonical review-state persistence, explicit script standardization, explicit prepare-analysis orchestration, explicit refresh-analysis orchestration, explicit rebuild-storyboard orchestration, persistent scene-breakdown pre-production planning, persistent shot-variant planning on top of the scene breakdown, persistent shooting-plan derivation on top of the pre-production state, honest script/character/prop analysis, validation, batch authoring, import/package ingest, export packaging, MagicCut project/template persistence with server-side query semantics, template lifecycle, template update, project duplication, template instantiation, honest render capability discovery, render jobs, artifact access, notes, canonical chat session metadata and transcript persistence, canonical portal feed publishing/discovery/detail/interaction lifecycle, canonical trade marketplace task persistence and lifecycle, canonical trade order lifecycle, canonical payment initiation and refund, host-owned wallet recharge, wallet balance read-models, transaction history, canonical VIP plan catalog and purchase orchestration, canonical VIP subscription status and history, prompt optimization, generation foundation routes for image, video, audio, music, sfx, character, and speech, the canonical voices namespace, and the canonical admin governance surface.

The main remaining architecture gap is no longer route shape. It is execution depth and capability depth:

- the Rust host now has a real generated-AI-SDK speech execution adapter for `generation/audio/text-to-speech` and `voices/speech/tasks`
- the new `/api/app/v1/generation/tasks` family is now the canonical cross-product governance surface for task list/read/delete plus honest global cancel across image, video, audio, music, sfx, character, and speech records, and the Rust host now backs that surface through a dedicated governance layer that merges the generation registry with canonical voice speech task persistence; product-specific route families remain the canonical create/prompt/cancel entrypoints
- the `admin` surface now covers deployment inventory, runtime audits, job metrics, policy audits, storage providers, execution provider inventory/health/failure read models plus provider detail, reconcile, failure acknowledgement, and failure retry governance, plugin governance, and fleet-level workspace release retention run execution/audit plus schedule lifecycle and manual trigger governance through canonical Rust host APIs
- the `creation` route family is now canonical for discovery, durable batch orchestration and materialization, reusable preset lifecycle, reusable template lifecycle, cross-surface current-session handoff, and cross-media creation history, replacing browser-local portal launch persistence, package-local saved-preset state, package-local template composition, package-local batch-planning state, and package-local creation history storage with host-owned state scoped by workspace, project, target, and generation task lineage
- the `film` route family is now structurally canonical for project lifecycle, preset catalog/create/apply, reusable template lifecycle and instantiation, project-owned template snapshots, asset inventory, publish history/detail/artifact content access, project-level review queue discovery, project-level portfolio dashboards, project-level reviewer-capacity forecasting, project-level decision-freshness analytics, project-level governance-drift supervision, project-level escalation forecasting, project-level dependency-graph projection, project-level intervention planning, project-level recovery orchestration, project-level approval burn-down supervision, project-level intervention outcome supervision, project-level effectiveness baselining, project-level intervention execution history, typed review-state query, host-derived review timeline and review-round projections, review-anchor projections, review-activity projections, review-decision-matrix projections, review-readiness projections, reviewer-coverage projections, reviewer-backlog projections, reviewer-attention projections, review-operations dashboard snapshots, stale-decision projections, review latency and throughput analytics, anchor-responsibility projections, reviewer-worklist projections, publish review assignments, publish review submit/resubmit workflow, publish review consensus governance, threaded publish review comments, publish comment resolution, publish approval, publish request-changes, publish reopen, publish restoration, publish deletion, asset relink, storyboard publish bundles, script standardization, prepare-analysis orchestration, refresh-analysis orchestration, rebuild-storyboard orchestration, persistent scene-breakdown planning, persistent shot-variant planning, persistent shooting-plan derivation, script analysis, character extraction, prop extraction, project-graph reads, validation, batch authoring, storyboard generation, shot synchronization, asset binding, import/package ingest, and export packaging
- the `magiccut` route family is now structurally complete for persistence, template lifecycle, render capability discovery, render jobs, and artifact retrieval; the remaining gap is execution depth because only honest audio-only WAV render is implemented and video render remains explicitly unsupported until a real server-side composition engine exists
- video extend/style-transfer/lip-sync, sfx, and voice-clone execution still need the same canonical adapter standard
- `style-transfer` is the canonical server/app operation name for source-video stylization; frontend `video-to-video` remains only a UX alias, and the frontend request boundary now normalizes it before service, execution, and persisted task state are created
- the generated app-sdk currently does not publish a typed `generation.lipSyncVideo` surface, so lip-sync must stay a runtime-detected optional bridge until upstream SDK parity is real
- portal feed is now canonical inside the Rust host for publish/discover/featured/detail/interaction/delete flows, and any further film review expansion should stay on the same host-derived read-model path beyond escalation forecast, dependency graph, intervention planning, recovery orchestration, approval burn-down, intervention outcomes, effectiveness baselining, and intervention execution history toward durable host-owned execution state only when the kernel truly persists that workflow, rather than reintroducing package-local governance joins

## Current Canonical API Family Snapshot

Current `app` family counts in the canonical server contract:

- `assets`: 9 routes
- `auth`: 12 routes
- `capabilities`: 3 routes
- `chat`: 7 routes
- `creation`: 29 routes
- `drive`: 14 routes
- `film`: 77 routes
- `magiccut`: 19 routes
- `generation/images`: 6 routes
- `generation/videos`: 8 routes
- `generation/audio`: 4 routes
- `generation/catalog`: 4 routes
- `generation/music`: 5 routes
- `generation/sfx`: 5 routes
- `generation/characters`: 4 routes
- `generation/tasks`: 4 routes
- `notes`: 16 routes
- `presentations`: 7 routes
- `notifications`: 6 routes
- `portal`: 10 routes
- `plugins`: 1 route
- `prompt`: 1 route
- `settings`: 2 routes
- `trade`: 22 routes
- `user`: 29 routes
- `vip`: 5 routes
- `voices`: 20 routes
- `workspaces`: 37 routes

Current `admin` family counts in the canonical server contract:

- `deployments`: 1 route
- `governance`: 15 routes
- `jobs`: 1 route
- `plugins`: 3 routes
- `policy`: 1 route
- `runtime`: 1 route
- `storage`: 1 route

## Recommended Next API Expansion Blueprint

The next API work should be split into two categories so we do not create fake completeness:

### Expand Existing Canonical Routes First

These areas already have the correct public route surface. The right next move is execution-depth implementation inside the Rust kernel, not route proliferation:

- `generation/videos`
  - keep using the existing canonical routes for `extend`, `style-transfer`, and `lip-sync`
  - add real provider execution adapters, capability truth, and durable artifact materialization behind those routes
- `generation/sfx`
  - keep the current canonical route family
  - add real execution adapters instead of inventing a second task family
- `voices`
  - keep the current canonical speech/clone task surface
  - add real clone execution, provider normalization, and honest readiness gating behind the existing routes
- `magiccut`
  - keep the current canonical render route family
  - only add true server-side video render execution when the Rust kernel owns a real composition engine

### Extract New APIs Only When The Kernel Owns Durable Workflow Semantics

These are the best next route candidates, but they should become canonical only when the Rust host owns the full workflow contract instead of frontend sequencing:

| Priority | Area | Candidate APIs | Extract only when the kernel owns |
| --- | --- | --- | --- |
| P1 | creation execution control | `POST /api/app/v1/creation/batches/:batchId/start`<br>`POST /api/app/v1/creation/batches/:batchId/pause`<br>`POST /api/app/v1/creation/batches/:batchId/resume`<br>`POST /api/app/v1/creation/batches/:batchId/retry`<br>`GET /api/app/v1/creation/batches/:batchId/events` | durable scheduling, replay, pause/resume semantics, retry policy, event lineage |
| P1 | chat execution | `POST /api/app/v1/chat/sessions/:sessionId/messages`<br>`POST /api/app/v1/chat/sessions/:sessionId/messages/stream`<br>`GET /api/app/v1/chat/sessions/:sessionId/messages` | moderation, attachment resolution, model policy, stream lifecycle ownership, durable message state |
| P1 | presentations generation | `GET /api/app/v1/presentations/capabilities`<br>`POST /api/app/v1/presentations/:presentationId/generate-outline`<br>`POST /api/app/v1/presentations/:presentationId/generate-slides`<br>`POST /api/app/v1/presentations/:presentationId/apply-theme` | prompt contract, template policy, artifact persistence, slide-level replayability |
| P2 | drive provider governance | `GET /api/app/v1/drive/providers`<br>`POST /api/app/v1/drive/uploads/presign`<br>`POST /api/app/v1/drive/downloads/presign` | storage identity model, provider policy, cross-host URL/security semantics |
| P2 | portal social depth | `GET /api/app/v1/portal/feeds/:feedId/comments`<br>`POST /api/app/v1/portal/feeds/:feedId/comments`<br>`POST /api/app/v1/portal/feeds/:feedId/follow-author` | durable moderation, ranking policy, comment lifecycle, abuse/governance ownership |
| P2 | workspace release retention exception windows and rollout governance | `GET /api/admin/v1/governance/workspace-release-retention/exceptions`<br>`POST /api/admin/v1/governance/workspace-release-retention/exceptions`<br>`PATCH /api/admin/v1/governance/workspace-release-retention/exceptions/:exceptionId`<br>`DELETE /api/admin/v1/governance/workspace-release-retention/exceptions/:exceptionId`<br>`GET /api/admin/v1/governance/workspace-release-retention/policy-rollouts`<br>`POST /api/admin/v1/governance/workspace-release-retention/policy-rollouts` | recurring enforcement windows, staged rollout policy, operator override lineage, and exception handling without weakening project-scoped policy authority |

### API Design Guardrails For Every New Extraction

Every future API expansion must satisfy all of the following:

- prefer extending an existing canonical family before creating a new one
- do not add a route unless the Rust kernel owns durable state, policy, and replay semantics for that workflow
- expose machine-readable capability truth before exposing a create/start route
- keep server deployment and desktop embedding on the exact same route contract
- do not create UI-only convenience routes that duplicate frontend composition logic
- do not publish fake provider success shapes to make a route family look complete

## Standardized Runtime Architecture

The current standardized runtime architecture is:

1. Delivery layer
   - browser/web client
   - standalone Rust server deployment
   - desktop shell embedding the same Rust host through `src-tauri`
2. Public contract layer
   - `@sdkwork/magic-studio-server` owns canonical route ids, path constants, OpenAPI generation, and the fetch client
   - `@sdkwork/magic-studio-host-types` owns host/runtime request DTOs
   - `@sdkwork/magic-studio-types` owns shared business/domain models such as workspace and asset-center entities
3. Host business kernel
   - `packages/sdkwork-magic-studio-server/src-host` is the only canonical service runtime
   - `routes/app` exposes product-facing APIs
   - `routes/core` exposes toolkit and runtime infrastructure APIs
   - `routes/admin` exposes operator-facing APIs
4. Persistence and service layer
   - file-backed local services under `src-host/src/services`
  - current durable business services: capabilities inventory, auth/session, user profile/preferences and security governance, settings, notifications, creation preset/template/batch/history/session registries, workspaces/projects, assets, drive, film project/analysis services, MagicCut persistence/template/render registries, notes, presentations registry, portal registry, trade marketplace registry, trade commerce registry, VIP registry, voices registry
   - current host-native infrastructure services: filesystem, media, compression, SQLite, jobs, policy, migrations
   - current generation services: prompt optimization, image/video/character task orchestration, audio/music/sfx task orchestration, canonical host task persistence, and canonical failed-task persistence when provider execution is not configured
  - current execution adapter services: generated AI SDK-backed speech synthesis, transcription, translation, text-to-image, prompt-guided image-to-image, image variation, image edit, host-local image upscale, text/image-to-video, full text/similar/remix/extend music generation, and image-backed character generation, canonical output persistence, normalized image/video/audio/text/music artifact materialization, and runtime capability discovery for execution readiness

The architectural rule is unchanged:

- server deployment and desktop embedding must expose the same route families
- frontend packages must consume canonical `app`/`core`/`admin` APIs instead of inventing their own local business protocols
- local host-owned business state belongs in Rust services, not in package-local persistence silos

## Current Canonical API Inventory

### `core`

Discovery and diagnostics:

- `GET /healthz`
- `GET /api/core/v1/routes`
- `GET /api/core/v1/runtime/summary`
- `GET /api/core/v1/toolkit/capabilities`

Filesystem:

- `POST /api/core/v1/filesystem/read-dir`
- `POST /api/core/v1/filesystem/read-text`
- `POST /api/core/v1/filesystem/read-bytes`
- `POST /api/core/v1/filesystem/write-text`
- `POST /api/core/v1/filesystem/write-bytes`
- `POST /api/core/v1/filesystem/stat`
- `POST /api/core/v1/filesystem/exists`
- `POST /api/core/v1/filesystem/ensure-dir`
- `POST /api/core/v1/filesystem/remove`
- `POST /api/core/v1/filesystem/rename`
- `POST /api/core/v1/filesystem/copy-file`

Media toolkit:

- `POST /api/core/v1/media/probe`
- `POST /api/core/v1/media/image/resize`
- `POST /api/core/v1/media/video/concat`
- `POST /api/core/v1/media/video/transcode`
- `POST /api/core/v1/media/video/trim`
- `POST /api/core/v1/media/video/extract-audio`
- `POST /api/core/v1/media/video/thumbnail`
- `POST /api/core/v1/media/audio/convert`
- `POST /api/core/v1/media/audio/normalize`
- `POST /api/core/v1/media/audio/mix`

Compression:

- `POST /api/core/v1/compression/zip`
- `POST /api/core/v1/compression/unzip`

SQLite:

- `POST /api/core/v1/database/sqlite/execute`
- `POST /api/core/v1/database/sqlite/query`
- `POST /api/core/v1/database/sqlite/execute-batch`

Jobs:

- `POST /api/core/v1/jobs`
- `GET /api/core/v1/jobs`
- `GET /api/core/v1/jobs/:jobId`
- `POST /api/core/v1/jobs/:jobId/cancel`

Policy:

- `POST /api/core/v1/policy/validate-path`
- `POST /api/core/v1/policy/validate-command`
- `GET /api/core/v1/policy/snapshot`

Migrations:

- `POST /api/core/v1/migrations/status`
- `POST /api/core/v1/migrations/apply`

### `app`

Auth and session:

- `GET /api/app/v1/auth/session`
- `POST /api/app/v1/auth/login`
- `POST /api/app/v1/auth/login/phone`
- `POST /api/app/v1/auth/register`
- `POST /api/app/v1/auth/logout`
- `POST /api/app/v1/auth/refresh-token`
- `POST /api/app/v1/auth/verify-code/send`
- `POST /api/app/v1/auth/verify-code/check`
- `POST /api/app/v1/auth/password-reset/request`
- `POST /api/app/v1/auth/password-reset/confirm`
- `POST /api/app/v1/auth/qr-code`
- `GET /api/app/v1/auth/qr-code/:qrKey`

User center:

- `GET /api/app/v1/user/profile`
- `PATCH /api/app/v1/user/profile`
- `POST /api/app/v1/user/avatar`
- `GET /api/app/v1/user/settings`
- `PUT /api/app/v1/user/settings`
- `POST /api/app/v1/user/password/change`
- `GET /api/app/v1/user/addresses`
- `GET /api/app/v1/user/addresses/default`
- `POST /api/app/v1/user/addresses`
- `PATCH /api/app/v1/user/addresses/:addressId`
- `DELETE /api/app/v1/user/addresses/:addressId`
- `POST /api/app/v1/user/addresses/:addressId/default`
- `GET /api/app/v1/user/history/login`
- `GET /api/app/v1/user/history/generation`
- `GET /api/app/v1/user/sessions`
- `DELETE /api/app/v1/user/sessions/:sessionId`
- `GET /api/app/v1/user/devices`
- `DELETE /api/app/v1/user/devices/:deviceId`
- `GET /api/app/v1/user/two-factor`
- `POST /api/app/v1/user/two-factor/setup`
- `POST /api/app/v1/user/two-factor/verify`
- `DELETE /api/app/v1/user/two-factor`
- `GET /api/app/v1/user/bindings`
- `POST /api/app/v1/user/bind/email`
- `DELETE /api/app/v1/user/bind/email`
- `POST /api/app/v1/user/bind/phone`
- `DELETE /api/app/v1/user/bind/phone`
- `POST /api/app/v1/user/bind/:platform`
- `DELETE /api/app/v1/user/bind/:platform`

Capabilities:

- `GET /api/app/v1/capabilities/summary`
- `GET /api/app/v1/capabilities/domains`
- `GET /api/app/v1/capabilities/execution`

`GET /api/app/v1/capabilities/execution` is now the canonical machine-readable readiness source for both server deployment and desktop embedding. Each capability family exposes aggregate `executionStatus` plus `operationDetails[]`, so partially implemented families can stay honest at operation level instead of pretending every route in the family has the same execution depth.

Creation discovery, batches, presets, templates, history, and sessions:

- `GET /api/app/v1/creation/capabilities`
- `GET /api/app/v1/creation/batches`
- `POST /api/app/v1/creation/batches`
- `GET /api/app/v1/creation/batches/:batchId`
- `PATCH /api/app/v1/creation/batches/:batchId`
- `DELETE /api/app/v1/creation/batches/:batchId`
- `POST /api/app/v1/creation/batches/:batchId/materialize`
- `POST /api/app/v1/creation/batches/:batchId/items/:itemId/status`
- `GET /api/app/v1/creation/presets`
- `POST /api/app/v1/creation/presets`
- `GET /api/app/v1/creation/presets/:presetId`
- `PATCH /api/app/v1/creation/presets/:presetId`
- `DELETE /api/app/v1/creation/presets/:presetId`
- `GET /api/app/v1/creation/templates`
- `POST /api/app/v1/creation/templates`
- `GET /api/app/v1/creation/templates/:templateId`
- `PATCH /api/app/v1/creation/templates/:templateId`
- `DELETE /api/app/v1/creation/templates/:templateId`
- `POST /api/app/v1/creation/templates/:templateId/apply`
- `GET /api/app/v1/creation/history`
- `GET /api/app/v1/creation/history/:entryId`
- `PUT /api/app/v1/creation/history`
- `POST /api/app/v1/creation/history/:entryId/favorite`
- `DELETE /api/app/v1/creation/history/:entryId`
- `DELETE /api/app/v1/creation/history`
- `POST /api/app/v1/creation/sessions`
- `GET /api/app/v1/creation/sessions/current`
- `POST /api/app/v1/creation/sessions/current/consume`
- `DELETE /api/app/v1/creation/sessions/current`

`creation/batches` is now the canonical durable orchestration surface for one-to-many creation workflows in both server deployment and desktop embedding. It supports strict manual and template-backed planning, per-item lifecycle status, durable execution linkage, and materialization of any selected item into the same host-owned current-session contract used by templates and direct creation entrypoints.

Generation catalog:

- `GET /api/app/v1/generation/catalog/models`
- `GET /api/app/v1/generation/catalog/styles`
- `GET /api/app/v1/generation/catalog/providers`
- `GET /api/app/v1/generation/catalog/voices`

Generation task governance:

- `GET /api/app/v1/generation/tasks`
- `GET /api/app/v1/generation/tasks/:taskId`
- `DELETE /api/app/v1/generation/tasks/:taskId`
- `POST /api/app/v1/generation/tasks/:taskId/cancel`

Prompt:

- `POST /api/app/v1/prompt/optimize`

Image generation:

- `POST /api/app/v1/generation/images/tasks`
- `POST /api/app/v1/generation/images/variations`
- `POST /api/app/v1/generation/images/edits`
- `POST /api/app/v1/generation/images/upscales`
- `POST /api/app/v1/generation/images/prompt/enhance`
- `GET /api/app/v1/generation/images/tasks/:taskId`

Video generation:

- `POST /api/app/v1/generation/videos/tasks`
- `POST /api/app/v1/generation/videos/image-to-video`
- `POST /api/app/v1/generation/videos/extend`
- `POST /api/app/v1/generation/videos/style-transfer`
- `POST /api/app/v1/generation/videos/lip-sync`
- `POST /api/app/v1/generation/videos/prompt/enhance`
- `GET /api/app/v1/generation/videos/tasks/:taskId`
- `POST /api/app/v1/generation/videos/tasks/:taskId/cancel`

Audio generation:

- `POST /api/app/v1/generation/audio/text-to-speech`
- `POST /api/app/v1/generation/audio/transcriptions`
- `POST /api/app/v1/generation/audio/translations`
- `GET /api/app/v1/generation/audio/tasks/:taskId`

Music generation:

- `POST /api/app/v1/generation/music/tasks`
- `POST /api/app/v1/generation/music/similar`
- `POST /api/app/v1/generation/music/remix`
- `POST /api/app/v1/generation/music/extend`
- `GET /api/app/v1/generation/music/tasks/:taskId`

SFX generation:

- `POST /api/app/v1/generation/sfx/tasks`
- `GET /api/app/v1/generation/sfx/tasks`
- `GET /api/app/v1/generation/sfx/categories`
- `GET /api/app/v1/generation/sfx/tasks/:taskId`
- `POST /api/app/v1/generation/sfx/tasks/:taskId/cancel`

Character generation:

- `POST /api/app/v1/generation/characters/tasks`
- `GET /api/app/v1/generation/characters/tasks`
- `GET /api/app/v1/generation/characters/tasks/:taskId`
- `POST /api/app/v1/generation/characters/tasks/:taskId/cancel`

Voices:

- `GET /api/app/v1/voices/market`
- `GET /api/app/v1/voices/workspace`
- `GET /api/app/v1/voices/custom`
- `POST /api/app/v1/voices/custom`
- `PATCH /api/app/v1/voices/custom/:speakerId`
- `DELETE /api/app/v1/voices/custom/:speakerId`
- `GET /api/app/v1/voices/:speakerId`
- `GET /api/app/v1/voices/clone-tasks`
- `POST /api/app/v1/voices/clone-tasks`
- `GET /api/app/v1/voices/clone-tasks/:taskId`
- `DELETE /api/app/v1/voices/clone-tasks/:taskId`
- `POST /api/app/v1/voices/clone-tasks/:taskId/cancel`
- `POST /api/app/v1/voices/:speakerId/preview`
- `GET /api/app/v1/voices/speech/tasks`
- `POST /api/app/v1/voices/speech/tasks`
- `GET /api/app/v1/voices/speech/tasks/:taskId`
- `PATCH /api/app/v1/voices/speech/tasks/:taskId`
- `PUT /api/app/v1/voices/speech/tasks/:taskId`
- `DELETE /api/app/v1/voices/speech/tasks/:taskId`
- `POST /api/app/v1/voices/speech/tasks/:taskId/cancel`

Plugins:

- `GET /api/app/v1/plugins`

Settings:

- `GET /api/app/v1/settings`
- `PUT /api/app/v1/settings`

Notifications:

- `GET /api/app/v1/notifications`
- `POST /api/app/v1/notifications`
- `GET /api/app/v1/notifications/unread-count`
- `POST /api/app/v1/notifications/read-all`
- `POST /api/app/v1/notifications/:notificationId/read`
- `POST /api/app/v1/notifications/delete`

Workspaces and projects:

- `GET /api/app/v1/workspaces`
- `POST /api/app/v1/workspaces`
- `GET /api/app/v1/workspaces/:workspaceId`
- `PATCH /api/app/v1/workspaces/:workspaceId`
- `DELETE /api/app/v1/workspaces/:workspaceId`
- `GET /api/app/v1/workspaces/recent-projects`
- `GET /api/app/v1/workspaces/:workspaceId/projects`
- `POST /api/app/v1/workspaces/:workspaceId/projects`
- `GET /api/app/v1/workspaces/:workspaceId/projects/:projectId`
- `POST /api/app/v1/workspaces/:workspaceId/projects/:projectId/open`
- `POST /api/app/v1/workspaces/:workspaceId/projects/:projectId/duplicate`
- `POST /api/app/v1/workspaces/:workspaceId/projects/:projectId/archive`
- `POST /api/app/v1/workspaces/:workspaceId/projects/:projectId/restore`
- `GET /api/app/v1/workspaces/:workspaceId/projects/:projectId/session`
- `PUT /api/app/v1/workspaces/:workspaceId/projects/:projectId/session`
- `DELETE /api/app/v1/workspaces/:workspaceId/projects/:projectId/session`
- `POST /api/app/v1/workspaces/:workspaceId/projects/:projectId/git-sync`
- `GET /api/app/v1/workspaces/:workspaceId/projects/:projectId/git-syncs`
- `GET /api/app/v1/workspaces/:workspaceId/projects/:projectId/git-syncs/latest`
- `GET /api/app/v1/workspaces/:workspaceId/projects/:projectId/git-syncs/:syncId`
- `POST /api/app/v1/workspaces/:workspaceId/projects/:projectId/git-syncs/:syncId/retry`
- `GET /api/app/v1/workspaces/:workspaceId/projects/:projectId/releases`
- `GET /api/app/v1/workspaces/:workspaceId/projects/:projectId/releases/stats`
- `POST /api/app/v1/workspaces/:workspaceId/projects/:projectId/releases/prune`
- `GET /api/app/v1/workspaces/:workspaceId/projects/:projectId/releases/retention-policy`
- `PUT /api/app/v1/workspaces/:workspaceId/projects/:projectId/releases/retention-policy`
- `POST /api/app/v1/workspaces/:workspaceId/projects/:projectId/releases/retention-policy/apply`
- `POST /api/app/v1/workspaces/:workspaceId/projects/:projectId/releases`
- `GET /api/app/v1/workspaces/:workspaceId/projects/:projectId/releases/latest`
- `GET /api/app/v1/workspaces/:workspaceId/projects/:projectId/releases/:releaseId`
- `DELETE /api/app/v1/workspaces/:workspaceId/projects/:projectId/releases/:releaseId`
- `POST /api/app/v1/workspaces/:workspaceId/projects/:projectId/releases/:releaseId/restore`
- `GET /api/app/v1/workspaces/:workspaceId/projects/:projectId/releases/:releaseId/manifest`
- `GET /api/app/v1/workspaces/:workspaceId/projects/:projectId/releases/:releaseId/artifact`
- `POST /api/app/v1/workspaces/:workspaceId/projects/:projectId/releases/:releaseId/rebuild`
- `PATCH /api/app/v1/workspaces/:workspaceId/projects/:projectId`
- `DELETE /api/app/v1/workspaces/:workspaceId/projects/:projectId`

Assets:

- `GET /api/app/v1/assets`
- `GET /api/app/v1/assets/stats`
- `GET /api/app/v1/assets/categories`
- `POST /api/app/v1/assets/import/file`
- `POST /api/app/v1/assets/import/url`
- `GET /api/app/v1/assets/:assetId`
- `PATCH /api/app/v1/assets/:assetId`
- `DELETE /api/app/v1/assets/:assetId`

Drive:

- `GET /api/app/v1/drive/root`
- `GET /api/app/v1/drive/entries`
- `GET /api/app/v1/drive/stats`
- `GET /api/app/v1/drive/files/:itemId/content`
- `PUT /api/app/v1/drive/files/:itemId/content`
- `POST /api/app/v1/drive/folders`
- `POST /api/app/v1/drive/uploads`
- `POST /api/app/v1/drive/imports/file`
- `POST /api/app/v1/drive/rename`
- `POST /api/app/v1/drive/move`
- `POST /api/app/v1/drive/delete`
- `POST /api/app/v1/drive/restore`
- `POST /api/app/v1/drive/trash/empty`
- `POST /api/app/v1/drive/favorites`

Film:

- `GET /api/app/v1/film/projects`
- `POST /api/app/v1/film/projects`
- `GET /api/app/v1/film/presets`
- `POST /api/app/v1/film/presets`
- `GET /api/app/v1/film/templates`
- `POST /api/app/v1/film/templates`
- `POST /api/app/v1/film/projects/import/package`
- `POST /api/app/v1/film/projects/validate`
- `GET /api/app/v1/film/templates/:templateId`
- `PUT /api/app/v1/film/templates/:templateId`
- `DELETE /api/app/v1/film/templates/:templateId`
- `POST /api/app/v1/film/templates/:templateId/instantiate`
- `POST /api/app/v1/film/projects/:projectId/template-snapshots`
- `GET /api/app/v1/film/projects/:projectId`
- `GET /api/app/v1/film/projects/:projectId/project-graph`
- `GET /api/app/v1/film/projects/:projectId/asset-inventory`
- `GET /api/app/v1/film/projects/:projectId/publishes`
- `GET /api/app/v1/film/projects/:projectId/reviews/queue`
- `GET /api/app/v1/film/projects/:projectId/reviews/portfolio-dashboard`
- `GET /api/app/v1/film/projects/:projectId/reviews/reviewer-capacity`
- `GET /api/app/v1/film/projects/:projectId/reviews/decision-freshness`
- `GET /api/app/v1/film/projects/:projectId/reviews/governance-drift`
- `GET /api/app/v1/film/projects/:projectId/reviews/escalation-forecast`
- `GET /api/app/v1/film/projects/:projectId/reviews/dependency-graph`
- `GET /api/app/v1/film/projects/:projectId/reviews/intervention-plan`
- `GET /api/app/v1/film/projects/:projectId/reviews/recovery-orchestration`
- `GET /api/app/v1/film/projects/:projectId/reviews/approval-burn-down`
- `GET /api/app/v1/film/projects/:projectId/reviews/effectiveness-baseline`
- `GET /api/app/v1/film/projects/:projectId/reviews/intervention-execution-history`
- `GET /api/app/v1/film/projects/:projectId/reviews/intervention-outcomes`
- `GET /api/app/v1/film/projects/:projectId/publishes/:publishId`
- `GET /api/app/v1/film/projects/:projectId/publishes/:publishId/reviews/state`
- `GET /api/app/v1/film/projects/:projectId/publishes/:publishId/reviews/timeline`
- `GET /api/app/v1/film/projects/:projectId/publishes/:publishId/reviews/rounds`
- `GET /api/app/v1/film/projects/:projectId/publishes/:publishId/reviews/anchors`
- `GET /api/app/v1/film/projects/:projectId/publishes/:publishId/reviews/activity`
- `GET /api/app/v1/film/projects/:projectId/publishes/:publishId/reviews/anchor-responsibility`
- `GET /api/app/v1/film/projects/:projectId/publishes/:publishId/reviews/decision-matrix`
- `GET /api/app/v1/film/projects/:projectId/publishes/:publishId/reviews/readiness`
- `GET /api/app/v1/film/projects/:projectId/publishes/:publishId/reviews/reviewer-backlog`
- `GET /api/app/v1/film/projects/:projectId/publishes/:publishId/reviews/reviewer-attention`
- `GET /api/app/v1/film/projects/:projectId/publishes/:publishId/reviews/reviewer-coverage`
- `GET /api/app/v1/film/projects/:projectId/publishes/:publishId/reviews/operations-dashboard`
- `GET /api/app/v1/film/projects/:projectId/publishes/:publishId/reviews/stale-decisions`
- `GET /api/app/v1/film/projects/:projectId/publishes/:publishId/reviews/latency-analytics`
- `GET /api/app/v1/film/projects/:projectId/publishes/:publishId/reviews/reviewer-worklist`
- `POST /api/app/v1/film/projects/:projectId/publishes/:publishId/approve`
- `POST /api/app/v1/film/projects/:projectId/publishes/:publishId/request-changes`
- `POST /api/app/v1/film/projects/:projectId/publishes/:publishId/reviews/comments`
- `POST /api/app/v1/film/projects/:projectId/publishes/:publishId/reviews/comments/:commentId/resolve`
- `POST /api/app/v1/film/projects/:projectId/publishes/:publishId/reviews/submit`
- `POST /api/app/v1/film/projects/:projectId/publishes/:publishId/reviews/consensus`
- `POST /api/app/v1/film/projects/:projectId/publishes/:publishId/reviews/assignments`
- `POST /api/app/v1/film/projects/:projectId/publishes/:publishId/reopen`
- `POST /api/app/v1/film/projects/:projectId/publishes/:publishId/restore`
- `DELETE /api/app/v1/film/projects/:projectId/publishes/:publishId`
- `GET /api/app/v1/film/projects/:projectId/publishes/:publishId/artifacts/:artifactKind/content`
- `PUT /api/app/v1/film/projects/:projectId`
- `DELETE /api/app/v1/film/projects/:projectId`
- `POST /api/app/v1/film/analysis/script`
- `POST /api/app/v1/film/projects/:projectId/authoring/standardize-script`
- `POST /api/app/v1/film/projects/:projectId/authoring/prepare-analysis`
- `POST /api/app/v1/film/projects/:projectId/authoring/rebuild-storyboard`
- `POST /api/app/v1/film/projects/:projectId/authoring/create-scene-breakdown`
- `POST /api/app/v1/film/projects/:projectId/authoring/generate-shot-variants`
- `POST /api/app/v1/film/projects/:projectId/authoring/create-shooting-plan`
- `POST /api/app/v1/film/projects/:projectId/storyboard/generate`
- `POST /api/app/v1/film/projects/:projectId/shots/sync`
- `POST /api/app/v1/film/projects/:projectId/authoring/batch`
- `POST /api/app/v1/film/projects/:projectId/authoring/refresh-analysis`
- `POST /api/app/v1/film/projects/:projectId/apply-preset`
- `POST /api/app/v1/film/projects/:projectId/assets/relink`
- `POST /api/app/v1/film/projects/:projectId/assets/bind`
- `POST /api/app/v1/film/projects/:projectId/export/package`
- `POST /api/app/v1/film/projects/:projectId/publish/storyboard`
- `POST /api/app/v1/film/analysis/characters`
- `POST /api/app/v1/film/analysis/props`

MagicCut:

- `GET /api/app/v1/magiccut/projects`
- `POST /api/app/v1/magiccut/projects`
- `GET /api/app/v1/magiccut/projects/:projectId`
- `PUT /api/app/v1/magiccut/projects/:projectId`
- `DELETE /api/app/v1/magiccut/projects/:projectId`
- `POST /api/app/v1/magiccut/projects/:projectId/duplicate`
- `GET /api/app/v1/magiccut/templates`
- `POST /api/app/v1/magiccut/templates`
- `GET /api/app/v1/magiccut/templates/:templateId`
- `PUT /api/app/v1/magiccut/templates/:templateId`
- `POST /api/app/v1/magiccut/templates/:templateId/instantiate`
- `DELETE /api/app/v1/magiccut/templates/:templateId`
- `GET /api/app/v1/magiccut/render-capabilities`
- `GET /api/app/v1/magiccut/renders`
- `POST /api/app/v1/magiccut/projects/:projectId/renders`
- `GET /api/app/v1/magiccut/renders/:renderId`
- `POST /api/app/v1/magiccut/renders/:renderId/cancel`
- `GET /api/app/v1/magiccut/renders/:renderId/artifacts`
- `GET /api/app/v1/magiccut/renders/:renderId/artifacts/:artifactId/content`

Notes:

- `GET /api/app/v1/notes/workspace-snapshot`
- `GET /api/app/v1/notes`
- `POST /api/app/v1/notes`
- `GET /api/app/v1/notes/trashed`
- `GET /api/app/v1/notes/:noteId`
- `PUT /api/app/v1/notes/:noteId`
- `DELETE /api/app/v1/notes/:noteId`
- `POST /api/app/v1/notes/:noteId/trash`
- `POST /api/app/v1/notes/:noteId/restore`
- `POST /api/app/v1/notes/:noteId/move`
- `POST /api/app/v1/notes/:noteId/publish`
- `POST /api/app/v1/notes/folders`
- `PATCH /api/app/v1/notes/folders/:folderId`
- `DELETE /api/app/v1/notes/folders/:folderId`
- `POST /api/app/v1/notes/folders/:folderId/move`
- `POST /api/app/v1/notes/trash/clear`

Chat:

- `GET /api/app/v1/chat/sessions`
- `POST /api/app/v1/chat/sessions`
- `GET /api/app/v1/chat/sessions/:sessionId`
- `PATCH /api/app/v1/chat/sessions/:sessionId`
- `DELETE /api/app/v1/chat/sessions/:sessionId`
- `GET /api/app/v1/chat/sessions/:sessionId/transcript`
- `PUT /api/app/v1/chat/sessions/:sessionId/transcript`

Presentations:

- `GET /api/app/v1/presentations`
- `POST /api/app/v1/presentations`
- `GET /api/app/v1/presentations/:presentationId`
- `PATCH /api/app/v1/presentations/:presentationId`
- `DELETE /api/app/v1/presentations/:presentationId`
- `POST /api/app/v1/presentations/:presentationId/slides`
- `PATCH /api/app/v1/presentations/:presentationId/slides/:slideId`

Trade marketplace:

- `GET /api/app/v1/trade/tasks/available`
- `GET /api/app/v1/trade/tasks/published`
- `GET /api/app/v1/trade/tasks/accepted`
- `GET /api/app/v1/trade/tasks/:taskId`
- `POST /api/app/v1/trade/tasks/:taskId/accept`
- `POST /api/app/v1/trade/tasks/:taskId/submit`
- `POST /api/app/v1/trade/tasks/:taskId/approve`
- `POST /api/app/v1/trade/tasks/:taskId/cancel`

Trade commerce:

- `GET /api/app/v1/trade/orders`
- `POST /api/app/v1/trade/orders`
- `GET /api/app/v1/trade/orders/:orderId`
- `POST /api/app/v1/trade/orders/:orderId/status`
- `POST /api/app/v1/trade/orders/:orderId/cancel`
- `DELETE /api/app/v1/trade/orders/:orderId`
- `GET /api/app/v1/trade/orders/statistics`
- `GET /api/app/v1/trade/payments`
- `POST /api/app/v1/trade/payments`
- `GET /api/app/v1/trade/payments/:paymentId`
- `POST /api/app/v1/trade/payments/:paymentId/refund`
- `POST /api/app/v1/trade/payments/recharge`
- `POST /api/app/v1/trade/payments/:paymentId/simulate-callback`
- `GET /api/app/v1/trade/wallet`
- `GET /api/app/v1/trade/transactions`

VIP:

- `GET /api/app/v1/vip/plans`
- `GET /api/app/v1/vip/status`
- `POST /api/app/v1/vip/purchase`
- `GET /api/app/v1/vip/subscriptions`
- `POST /api/app/v1/vip/subscriptions/:subscriptionId/cancel`

Portal:

- `POST /api/app/v1/portal/feeds`
- `GET /api/app/v1/portal/feeds/featured`
- `GET /api/app/v1/portal/feeds/discover`
- `GET /api/app/v1/portal/feeds/:feedId`
- `POST /api/app/v1/portal/feeds/:feedId/like`
- `POST /api/app/v1/portal/feeds/:feedId/unlike`
- `POST /api/app/v1/portal/feeds/:feedId/collect`
- `POST /api/app/v1/portal/feeds/:feedId/uncollect`
- `POST /api/app/v1/portal/feeds/:feedId/share`
- `DELETE /api/app/v1/portal/feeds/:feedId`

### `admin`

- `GET /api/admin/v1/deployments`
- `GET /api/admin/v1/runtime/audits`
- `GET /api/admin/v1/jobs/metrics`
- `GET /api/admin/v1/policy/audits`
- `GET /api/admin/v1/storage/providers`
- `GET /api/admin/v1/plugins`
- `POST /api/admin/v1/plugins/:pluginId/enable`
- `POST /api/admin/v1/plugins/:pluginId/disable`

## Implemented Canonical Capability Matrix

| Domain | Current Package Authority | Current Access Mode | Canonical Status | Priority | Canonical Base Group |
| --- | --- | --- | --- | --- | --- |
| Assets | `sdkwork-magic-studio-assets` | canonical Rust host API now owns managed asset catalog query/import/read/update/delete, asset cover prompt suggestion flows now route through the canonical prompt-optimization server client, creation capability discovery now routes through the canonical creation catalog server client, and cross-surface portal launch handoff now routes through the canonical creation session server client instead of the legacy `model.getCreationCapabilities` bridge or package-local browser persistence | implemented in `app` as the canonical asset-center API | P0 | `/api/app/v1/assets` |
| Workspace and projects | `sdkwork-magic-studio-workspace` | canonical Rust host API now owns durable workspace/project topology and the package consumes the canonical runtime server client plus host asset import for project cover ingestion instead of legacy app-sdk workspace/upload bridges | implemented in `app` as the canonical project topology API | P0 | `/api/app/v1/workspaces` |
| Drive | `sdkwork-magic-studio-drive` | canonical Rust host API now owns managed drive topology, file content reads/writes, import/upload, lifecycle actions, and preview/download byte delivery; the package now consumes the canonical runtime server client instead of legacy app-sdk drive facades, presigned upload flow, or asset-URL-based preview joins | implemented in `app` as the canonical managed-content API | P0 | `/api/app/v1/drive` |
| Film projects and canonical authoring/export surface | `sdkwork-magic-studio-film` | canonical Rust host API now owns durable film project persistence, server-side listing/filtering, host-owned preset catalog/create/apply, reusable template lifecycle and instantiation, project-owned template snapshot creation, canonical asset inventory, canonical publish history/detail/artifact content access, project-level canonical review queue discovery, project-level portfolio dashboards, project-level reviewer-capacity forecasting, project-level decision-freshness analytics, project-level governance-drift supervision, project-level escalation forecasting, project-level dependency-graph projection, project-level intervention planning, project-level recovery orchestration, project-level approval burn-down supervision, project-level intervention outcome supervision, project-level effectiveness baselining, project-level intervention execution history, typed canonical publish review-state query, host-derived canonical publish review timeline and review-round projections, canonical publish review anchors, canonical publish review activity, canonical publish review decision matrix, canonical publish review readiness, canonical reviewer coverage projections, canonical reviewer backlog and SLA projections, canonical reviewer attention projections, canonical review-operations dashboard snapshots, canonical stale-decision and drift projections, canonical review latency and throughput analytics, canonical reviewer-worklist projections, canonical publish review assignments, canonical submit/resubmit workflow, canonical reviewer-consensus governance, threaded canonical publish review comments, canonical publish comment resolution, canonical publish approval/request-changes/reopen governance, canonical publish deletion, canonical publish restoration, canonical asset relink and locator migration repair, storyboard publish review bundles with canonical review-state persistence, script standardization, prepare-analysis orchestration, refresh-analysis orchestration with preserved entity identity, rebuild-storyboard orchestration, persistent scene-breakdown pre-production planning, persistent shot-variant planning, persistent shooting-plan derivation, script analysis, character extraction, prop extraction, project-graph derivation, validation, batch authoring, storyboard generation, shot synchronization, atomic asset binding, host-owned import/package ingest, and host-owned export packaging; the package now consumes the canonical runtime server client instead of upstream SDK-backed film project/analysis facades or browser-private import/export logic or UI-owned preset constants | implemented in `app` as the canonical film authoring foundation API family | P0 | `/api/app/v1/film` |
| MagicCut projects, templates, and render/export lifecycle | `sdkwork-magic-studio-magiccut` | canonical Rust host API now owns durable project/template persistence, server-side listing/filtering, template lifecycle, template update, project duplication, template instantiation, honest render capability discovery, render jobs, artifact access, and audio-only server export; the package now saves, renders, and downloads through the canonical server client instead of package-local localStorage/VFS services or browser-private export orchestration | implemented in `app` as the canonical MagicCut authoring and render API family; current execution support is deliberately limited to honest audio-only WAV render while video render remains explicitly unsupported | P0 | `/api/app/v1/magiccut` |
| Notes | `sdkwork-magic-studio-notes` | canonical Rust host API now owns local note/folder/trash/publish lifecycle, and the package consumes the canonical runtime server client plus host workspace snapshot instead of direct app-sdk note facades | implemented in `app` as the canonical knowledge/content API | P0 | `/api/app/v1/notes` |
| Chat | `sdkwork-magic-studio-chat` | canonical Rust host API now owns durable chat session metadata, title/pinned/summary mutation, deletion, and transcript persistence; the package now consumes the canonical runtime server client for persistence instead of package-local storage, while response streaming remains intentionally package-local until the host owns moderation, attachment resolution, model policy, and streaming lifecycle semantics | implemented in `app` as the canonical chat persistence API family; streaming execution depth is still pending | P0 | `/api/app/v1/chat` |
| Presentations | `sdkwork-magic-studio-chatppt` | canonical Rust host API now owns durable presentation persistence, title/theme/settings mutation, slide creation/update lifecycle, and history reads; the package now consumes the canonical runtime server client instead of localStorage-backed presentation services, and prompt generation is kept explicitly unsupported until the Rust kernel owns a real generation contract | implemented in `app` as the canonical presentation authoring API | P0 | `/api/app/v1/presentations` |
| Trade task marketplace | `sdkwork-magic-studio-trade` | canonical Rust host API now owns durable marketplace task persistence, server-side listing/filtering, current-user published and accepted task views, task acceptance, delivery submission, publisher approval or reopen, and role-aware cancellation; the package now consumes the canonical runtime server client instead of package-local browser storage | implemented in `app` as the canonical trade marketplace API family | P0 | `/api/app/v1/trade/tasks` |
| Trade commerce | `sdkwork-magic-studio-trade` | canonical Rust host API now owns durable order persistence, order statistics, payment initiation, refund, recharge, wallet balance read-models, transaction history, and sandbox payment callback settlement; the package now consumes the canonical runtime server client instead of app-sdk order/payment/account facades | implemented in `app` as the canonical trade commerce API family | P0 | `/api/app/v1/trade` |
| VIP subscription | `sdkwork-magic-studio-vip` | canonical Rust host API now owns durable plan catalog, current-user membership status, purchase orchestration, subscription history, and cancellation; the package now consumes the canonical runtime server client instead of app-sdk VIP facades and local pricing protocols | implemented in `app` as the canonical VIP membership API family | P0 | `/api/app/v1/vip` |
| Portal feed | `sdkwork-magic-studio-portal-video` | canonical Rust host API now owns durable feed publishing, featured/discover retrieval, feed detail, interaction state, and author-owned deletion; the package now consumes the canonical runtime server client instead of upstream content API facades and package-local feed mapping joins | implemented in `app` as the canonical portal community API family | P0 | `/api/app/v1/portal` |
| Auth and session | `sdkwork-magic-studio-auth` | canonical Rust host API for local session, verification-code, password-reset, and QR login foundation, with package consumers still pending adoption cleanup | implemented in `app` as the canonical identity-session API foundation | P0 | `/api/app/v1/auth` |
| User center | `sdkwork-magic-studio-user` | canonical Rust host API for current-user profile, avatar, password, preference settings, addresses, history, and account bindings; consumer adoption is being aligned to the canonical server client | implemented in `app` as the canonical current-user API surface | P0 | `/api/app/v1/user` |
| Capabilities catalog | `sdkwork-magic-studio-server` | canonical Rust host API for machine-readable architecture summary, domain extraction inventory, and execution-readiness discovery | implemented in `app` as the canonical capability-discovery API | P0 | `/api/app/v1/capabilities` |
| Creation discovery, presets, templates, history, and session handoff | `sdkwork-magic-studio-server` | canonical Rust host API now owns target/channel/model/style discovery, reusable creation preset lifecycle, reusable creation template lifecycle with canonical apply-to-session semantics, cross-surface current-session handoff, and cross-media creation history for both imported entries and generated tasks, and package consumers now use the canonical runtime server client instead of legacy upstream `model.getCreationCapabilities` bridges, package-local browser session storage, package-local saved presets, package-local template composition, or package-local creation history persistence | implemented in `app` as the canonical creation API family | P0 | `/api/app/v1/creation` |
| Generation catalog read-models | `sdkwork-magic-studio-server` | canonical Rust host API now owns provider/model/style/voice selection read-models for generation-facing UIs, and consumer packages can stop mining selector data from frontend constants or overloading the broader creation-capabilities payload when they only need curated catalog projections | implemented in `app` as the canonical generation-catalog API family | P0 | `/api/app/v1/generation/catalog` |
| Generation task governance | `sdkwork-magic-studio-server` | canonical Rust host API now owns cross-family task list/read/delete/cancel governance across image, video, audio, music, sfx, character, and speech records through a dedicated governance layer that merges the generation registry with canonical voice speech task persistence, so consumers can stop depending on package-local task stores or internal history naming | implemented in `app` as the canonical generation-governance API family | P0 | `/api/app/v1/generation/tasks` |
| Admin governance | `sdkwork-magic-studio-server` | canonical Rust host API for deployment inventory, runtime audit, job metrics, policy audit, storage-provider inventory, execution provider inventory/health/failure read models plus provider detail, reconcile, failure acknowledgement, failure retry, plugin enable/disable governance, and fleet-level workspace release retention run execution with durable audit history plus retention schedule list/create/read/update/trigger governance | implemented in `admin` as the canonical operator-governance API surface | P0 | `/api/admin/v1` |
| Settings | `sdkwork-magic-studio-settings` | canonical Rust host API plus package-local consumers pending consolidation | implemented in `app` for browser/server/desktop parity | P0 | `/api/app/v1/settings` |
| Notifications | `sdkwork-magic-studio-notifications` | canonical Rust host API now owns notification inbox creation, listing, unread count, read state, and batch deletion; the package consumes the canonical runtime server client instead of legacy notification SDK facades | implemented in `app` as the user-facing inbox API | P0 | `/api/app/v1/notifications` |
| Prompt optimization | `sdkwork-magic-studio-prompt` | canonical Rust host API now adopted by prompt/settings consumers | implemented in `app` as the reusable prompt-optimization endpoint | P0 | `/api/app/v1/prompt` |
| Image generation | `sdkwork-magic-studio-image` | canonical Rust host foundation now owns task registration, task lookup, prompt enhancement, real generated-AI-SDK-backed execution for text-to-image, prompt-guided image-to-image, variation, and edit requests when configured, plus host-local image upscale through the Rust media runtime when the media toolkit is available | implemented in `app` as the canonical image-generation contract foundation | P0 | `/api/app/v1/generation/images` |
| Video generation | `sdkwork-magic-studio-video` | canonical Rust host foundation now owns task registration, task lookup/cancel, prompt enhancement, and real generated-AI-SDK-backed execution for text-to-video plus image-to-video requests when configured; `style-transfer` is the canonical persisted/server operation name while frontend `video-to-video` remains a UX alias; extend/style-transfer/lip-sync remain standardized lifecycle contracts until a real upstream adapter is selected, and lip-sync still has an upstream generated-sdk parity gap | implemented in `app` as the canonical video-generation contract foundation | P0 | `/api/app/v1/generation/videos` |
| Audio generation | `sdkwork-magic-studio-audio` | canonical Rust host foundation now owns text-to-speech, transcription, translation task registration, task lookup, and real provider-backed execution through the generated AI SDK adapter when configured, with normalized audio/text artifacts and canonical host persistence | implemented in `app` as the canonical audio-generation contract foundation | P0 | `/api/app/v1/generation/audio` |
| Music generation | `sdkwork-magic-studio-music` | canonical Rust host foundation now owns text/similar/remix/extend task registration, task lookup, and real generated-AI-SDK-backed execution for all four workflows when configured, with reference-guided source audio mapped through the same host adapter | implemented in `app` as the canonical music-generation contract foundation | P0 | `/api/app/v1/generation/music` |
| SFX generation | `sdkwork-magic-studio-sfx` | canonical Rust host foundation now owns task registration, task listing, category listing, task lookup, and task cancellation; real provider execution migration is still pending | implemented in `app` as the canonical sound-effect generation contract foundation | P0 | `/api/app/v1/generation/sfx` |
| Character generation | `sdkwork-magic-studio-character` | canonical Rust host foundation now owns character task registration, list/read/cancel lifecycle, and real provider-backed create execution by mapping character prompts and avatar references onto the shared image adapter when configured; the package consumes the canonical server client instead of legacy generation SDK calls | implemented in `app` as the canonical character-generation contract foundation | P0 | `/api/app/v1/generation/characters` |
| Voices | `sdkwork-magic-studio-voicespeaker` | canonical Rust host now owns market/workspace/custom speaker registry plus standardized clone-task and speech-task lifecycle APIs; speech tasks execute through the generated AI SDK when configured, while clone creation remains lifecycle-only and now returns an honest non-executed failed task record until a real clone adapter exists | implemented in `app` as the canonical voices API namespace | P0 | `/api/app/v1/voices` |

## Concrete Next-Extractable API Families

There is no remaining product-facing gateway family comparable to VIP or portal feed still trapped outside the canonical Rust host.

The next extraction-style work is narrower:

- keep remaining provider-backed generation and voice operations on the existing canonical routes while upgrading their execution adapters
- deepen the canonical `chat` family from durable persistence into bounded streaming execution only when the Rust kernel truly owns moderation, attachment resolution, model policy, and streaming lifecycle semantics
- deepen the new `creation` family beyond discovery, canonical batches, canonical presets, canonical templates, canonical history, and current-session handoff only when the Rust kernel truly owns batch start/pause/resume/retry semantics, replay policy, and cross-family orchestration governance
- keep imported voice persistence on the canonical `voices` namespace through `PUT /api/app/v1/voices/speech/tasks/:taskId`; do not reintroduce package-local persistence or split voice history into a second browser-only source
- extract cross-host product preferences into `/api/app/v1/settings` only when the state must survive server deployment and desktop embedding with the same meaning; keep ephemeral asset filters, note layout, and locale selection package-local
- only add new portal comment/follow/moderation APIs if those workflows become truly host-owned rather than frontend joins
- continue deleting package-local gateway facades once a canonical host API already exists

## Concrete Next App API Candidates

The next high-value additions should stay on the existing canonical `app` surface instead of creating new transport silos:

- Creation batch execution depth:
  - `GET /api/app/v1/creation/batches`
  - `POST /api/app/v1/creation/batches`
  - `GET /api/app/v1/creation/batches/:batchId`
  - `PATCH /api/app/v1/creation/batches/:batchId`
  - `DELETE /api/app/v1/creation/batches/:batchId`
  - `POST /api/app/v1/creation/batches/:batchId/materialize`
  - `POST /api/app/v1/creation/batches/:batchId/items/:itemId/status`
  - these routes are now canonical for durable multi-item creation planning, strict manual/template-backed workflow state, and current-session materialization
  - only add `POST /api/app/v1/creation/batches/:batchId/start`, `POST /api/app/v1/creation/batches/:batchId/pause`, `POST /api/app/v1/creation/batches/:batchId/resume`, `POST /api/app/v1/creation/batches/:batchId/retry`, or `GET /api/app/v1/creation/batches/:batchId/events` when the Rust kernel owns durable execution scheduling, replay policy, and run-state governance instead of client sequencing
- Chat execution depth:
  - `GET /api/app/v1/chat/sessions`
  - `POST /api/app/v1/chat/sessions`
  - `GET /api/app/v1/chat/sessions/:sessionId`
  - `PATCH /api/app/v1/chat/sessions/:sessionId`
  - `DELETE /api/app/v1/chat/sessions/:sessionId`
  - `GET /api/app/v1/chat/sessions/:sessionId/transcript`
  - `PUT /api/app/v1/chat/sessions/:sessionId/transcript`
  - durable chat session metadata and transcript storage are now canonical in the Rust host under `chat`
  - the remaining gap is message-stream submission, moderation, attachment resolution, and model-policy ownership; do not freeze a public streaming route until the host truly owns those semantics
- Presentation generation depth:
  - `GET /api/app/v1/presentations`
  - `POST /api/app/v1/presentations`
  - `GET /api/app/v1/presentations/:presentationId`
  - `PATCH /api/app/v1/presentations/:presentationId`
  - `DELETE /api/app/v1/presentations/:presentationId`
  - `POST /api/app/v1/presentations/:presentationId/slides`
  - `PATCH /api/app/v1/presentations/:presentationId/slides/:slideId`
  - `POST /api/app/v1/presentations/tasks`
  - `GET /api/app/v1/presentations/tasks/:taskId`
  - durable presentation entities and slide mutations are now canonical in the Rust host under `presentations`; the remaining gap is prompt-to-presentation task execution and any future task route family should stay behind the same neutral vocabulary
  - keep `presentations` as the public API vocabulary; do not leak package-history names such as `chatppt`
- Cross-family generation governance:
  - `GET /api/app/v1/generation/tasks`
  - `GET /api/app/v1/generation/tasks/:taskId`
  - `DELETE /api/app/v1/generation/tasks/:taskId`
  - `POST /api/app/v1/generation/tasks/:taskId/cancel`
  - these routes are now canonical for cross-product task listing, lookup, deletion, and honest cancel governance across image, video, audio, music, sfx, character, and speech task records
  - the Rust host now serves them through a dedicated governance layer that merges generation-registry tasks with canonical voice-speech task persistence, instead of pretending one store already owns every task family
  - canonical governance cancel now delegates to real host-owned cancel semantics for `video`, `sfx`, `character`, and `speech` tasks, while `image`, `audio`, and `music` return explicit unsupported errors until those products truly own standardized cancel semantics
  - `GET /api/app/v1/generation/tasks/:taskId/lineage`
  - `POST /api/app/v1/generation/tasks/:taskId/retry`
  - `POST /api/app/v1/generation/tasks/:taskId/duplicate`
  - lineage, retry, and duplicate should only be added when the host owns cross-family task lineage, replay policy, idempotency, and retry governance rather than package-local heuristics

## Highest-Value Next Implementation Batches

If the goal is a complete and powerful application API system with no architectural debt, the next execution order should be:

1. Generation provider execution standardization
   - keep the current image/video/audio/music/sfx/character routes as the canonical surface
   - finish the remaining unsupported generation operations on top of the same generated AI SDK execution adapter pattern that now powers speech, audio transcription/translation, image generation, text/image-to-video, and the full music workflow
   - do not fake success payloads when providers are not configured
2. Voice clone and wider audio execution completion
   - keep the voices namespace canonical
   - keep speech execution on the generated AI SDK adapter path
   - land the same provider-adapter standard for clone execution instead of leaving the voices domain half lifecycle-only
3. Workspace governance hardening, conversation execution depth, and presentation generation depth
   - canonical workspace-project session roaming now lives under `/api/app/v1/workspaces/:workspaceId/projects/:projectId/session`
   - canonical workspace-project git sync and release packaging now live under `/api/app/v1/workspaces/:workspaceId/projects/:projectId/git-sync` and `/api/app/v1/workspaces/:workspaceId/projects/:projectId/releases`, git-sync history plus latest-sync reads and canonical retry now live under `/api/app/v1/workspaces/:workspaceId/projects/:projectId/git-syncs`, release latest/manifest/rebuild/delete/restore/stats/prune/retention-policy governance now includes immutable rebuild lineage, soft-delete retention, bounded cleanup, explicit retention-policy configuration, and explicit retention-policy apply orchestration under the same `workspaces` family, and fleet-level retention sweeps plus recurring schedule governance now live under `/api/admin/v1/governance/workspace-release-retention/runs` and `/api/admin/v1/governance/workspace-release-retention/schedules`; execution provider detail, reconcile, failure acknowledgement, and failure retry now also live canonically under `/api/admin/v1/governance/execution/*`; the next gap is exception windows, rollout policy, recovery history, and deeper fleet policy rather than missing audit surfaces
   - `sdkwork-magic-studio-editor` should keep only arbitrary-folder fallback state in local storage; canonical workspace projects must restore open files, selected nodes, and expanded tree state from the Rust host
   - `sdkwork-magic-studio-chat` now uses canonical host APIs for durable session metadata and transcript persistence; the remaining gap is provider-stream submission and its surrounding moderation, attachment, and model-policy governance
   - `sdkwork-magic-studio-chatppt` now uses canonical host persistence under `/api/app/v1/presentations`; the remaining gap is prompt-to-slide generation depth and any future template/gallery/task APIs should stay under the same neutral `presentations` vocabulary
4. Film governance depth and MagicCut execution-depth completion
   - film base project, preset catalog/create/apply, reusable template lifecycle/instantiate, project-owned template snapshots, asset inventory, publish history/detail/artifact access, project-level review queue discovery, project-level portfolio dashboards, project-level reviewer-capacity forecasting, project-level decision-freshness analytics, project-level governance-drift supervision, project-level escalation forecasting, project-level dependency-graph projection, project-level intervention planning, project-level recovery orchestration, project-level approval burn-down supervision, project-level intervention outcome supervision, project-level effectiveness baselining, project-level intervention execution history, typed review-state query, host-derived review timeline and review-round APIs, review-anchor aggregation, review-activity projection, review-decision-matrix projection, review-readiness projection, reviewer-coverage projection, reviewer-backlog projection, reviewer-attention projection, review-operations dashboard snapshots, stale-decision projection, review latency analytics, reviewer-worklist projection, publish review assignments, publish review submit/resubmit workflow, publish review consensus governance, threaded publish review comments, publish comment resolution, publish approval/request-changes/reopen governance, publish restoration, publish deletion, script standardization, prepare-analysis workflow, refresh-analysis workflow, rebuild-storyboard workflow, persistent scene-breakdown workflow, persistent shot-variant workflow, persistent shooting-plan workflow, analysis workflow, project-graph derivation, validation, batch authoring, storyboard generation, shot synchronization, asset binding, import/package ingest, and export packaging are now canonical in the Rust host
   - further film review expansion should stay on the same Rust-side review context and derived read-model path beyond escalation forecast, dependency graph, intervention planning, recovery orchestration, approval burn-down, intervention outcomes, effectiveness baselines, and intervention execution history toward durable host-owned execution state only when the workflow is really persisted instead of reintroducing package-local workflow aggregation
   - MagicCut route shape is now canonical end-to-end, but only honest audio-only WAV render is enabled; video render must wait for a real server-side composition engine instead of a fake compatibility layer
5. Portal capability depth
   - portal feed route ownership is now canonical in the Rust host
   - only add comments, follow graphs, moderation, or ranking APIs when those workflows gain real host-owned persistence and policy
6. Consumer adoption cleanup and capability-depth hardening
   - remaining feature packages should converge on canonical server clients once their host APIs exist
   - capability discovery should continue to expose exact execution readiness so unsupported operations never look 'available by accident'
7. Creation workflow depth
   - keep `GET /api/app/v1/creation/capabilities`, the canonical batch routes under `/api/app/v1/creation/batches`, the canonical preset routes under `/api/app/v1/creation/presets`, the canonical template routes under `/api/app/v1/creation/templates`, the canonical history routes under `/api/app/v1/creation/history`, the current-session handoff routes under `/api/app/v1/creation/sessions`, and the canonical selector read-models under `/api/app/v1/generation/catalog/*` as the standardized creation and generation discovery surfaces
   - only add batch start/pause/resume/retry/event APIs when the Rust kernel owns durable execution scheduling, replay policy, and orchestration-state governance instead of delegating those semantics to package-local sequencing
   - creation execution should continue to land on the existing canonical generation and voice route families unless the product truly introduces a higher-level cross-media workflow contract

## API Extraction Backlog By Product Area

The latest package audit surfaced a second tier of extractable capability. These are the APIs that would make Magic Studio materially stronger, but they must be standardized according to where the durable product semantics actually belong.

### Extract Next By Extending Existing Canonical Families

These candidates should not create new transport silos. They should deepen an existing canonical `app` or `admin` family once the Rust kernel becomes the true system of record for the workflow.

| Priority | Product area | Package-local source | Preferred family | Candidate APIs | Extract only when the kernel owns |
| --- | --- | --- | --- | --- | --- |
| P1 | chat execution and attachments | `sdkwork-magic-studio-chat` still streams through frontend `genAIService` even though sessions and transcript are already canonical | `chat` | `POST /api/app/v1/chat/sessions/:sessionId/messages`<br>`GET /api/app/v1/chat/sessions/:sessionId/messages`<br>`POST /api/app/v1/chat/sessions/:sessionId/messages/stream`<br>`POST /api/app/v1/chat/sessions/:sessionId/attachments` | moderation, attachment resolution, model policy, stream lifecycle ownership, and durable message state |
| P1 | presentation generation depth | `sdkwork-magic-studio-chatppt` persists presentations canonically, but `generateSlidesFromPrompt(...)` is explicitly unsupported | `presentations` | `GET /api/app/v1/presentations/capabilities`<br>`POST /api/app/v1/presentations/:presentationId/generate-outline`<br>`POST /api/app/v1/presentations/:presentationId/generate-slides`<br>`POST /api/app/v1/presentations/:presentationId/apply-theme`<br>`POST /api/app/v1/presentations/:presentationId/exports` | prompt contract, theme/template policy, export artifacts, slide-level replayability, and honest execution readiness |
| P1 | creation batch execution governance | canonical `creation` batch planning is landed, but run-state orchestration is still intentionally not host-owned | `creation` | `POST /api/app/v1/creation/batches/:batchId/start`<br>`POST /api/app/v1/creation/batches/:batchId/pause`<br>`POST /api/app/v1/creation/batches/:batchId/resume`<br>`POST /api/app/v1/creation/batches/:batchId/retry`<br>`GET /api/app/v1/creation/batches/:batchId/events` | durable scheduling, replay, pause/resume semantics, retry policy, and event lineage |
| P2 | drive metadata overlay and managed downloads | `sdkwork-magic-studio-drive` keeps favorites/recent/trash/labels in local metadata keyed by path, while `sdkwork-magic-studio-browser` keeps a runtime-only download queue | `drive` | `GET /api/app/v1/drive/entries?view=favorites|recent|trash`<br>`PATCH /api/app/v1/drive/items/:itemId/metadata`<br>`POST /api/app/v1/drive/download-jobs`<br>`GET /api/app/v1/drive/download-jobs/:jobId`<br>`POST /api/app/v1/drive/download-jobs/:jobId/import-asset` | canonical drive item identity, durable job ownership, cross-host download policy, and stable storage/security semantics |
| P2 | workspace release retention exception windows and rollout governance | retention-policy read/update/apply is canonical under the `workspaces` family and fleet-level execution/audit plus recurring schedule governance are now canonical under `admin/governance/workspace-release-retention`; the remaining gap is exception-window ownership, staged rollout governance, and explicit operator overrides rather than missing schedule routes | `admin/governance` | `GET /api/admin/v1/governance/workspace-release-retention/exceptions`<br>`POST /api/admin/v1/governance/workspace-release-retention/exceptions`<br>`PATCH /api/admin/v1/governance/workspace-release-retention/exceptions/:exceptionId`<br>`DELETE /api/admin/v1/governance/workspace-release-retention/exceptions/:exceptionId`<br>`GET /api/admin/v1/governance/workspace-release-retention/policy-rollouts`<br>`POST /api/admin/v1/governance/workspace-release-retention/policy-rollouts` | recurring enforcement windows, staged rollout policy, operator override lineage, and exception handling without weakening project-scoped policy authority |
| P2 | portal community depth | `sdkwork-magic-studio-portal-video` already consumes canonical feed APIs, but comments/follow graphs still are not host-owned workflows | `portal` | `GET /api/app/v1/portal/feeds/:feedId/comments`<br>`POST /api/app/v1/portal/feeds/:feedId/comments`<br>`POST /api/app/v1/portal/feeds/:feedId/follow-author`<br>`GET /api/app/v1/portal/authors/:authorId/followers` | durable comment persistence, abuse policy, moderation state, and ranking ownership |
| P2 | execution governance history and recovery policy | provider inventory, health, failure, provider detail, reconcile, acknowledgement, and retry workflows are now canonical under `admin/governance/execution`; the remaining gap is audit history projection, recovery policy ownership, and fleet-level remediation windows rather than missing operator actions | `admin/governance` | `GET /api/admin/v1/governance/execution/reconciliations`<br>`GET /api/admin/v1/governance/execution/failures/:failureId/history`<br>`GET /api/admin/v1/governance/execution/failures/acknowledgements` | durable governance history, fleet policy projection, and retained recovery evidence beyond the current bounded action surface |
| P3 | managed toolchain governance | `sdkwork-magic-studio-ide-config` currently reads install/config state directly from the runtime | `admin/governance` | `GET /api/admin/v1/governance/toolchains`<br>`GET /api/admin/v1/governance/toolchains/:toolId`<br>`GET /api/admin/v1/governance/toolchains/:toolId/install-state`<br>`GET /api/admin/v1/governance/toolchains/:toolId/config` | the product truly manages tool availability and policy across server deployment and desktop embedding rather than just inspecting local files |

### Candidate New Families Only If A New Durable Domain Is Promoted

These are real product opportunities, but they should not become public API families until Magic Studio explicitly promotes the domain into durable cross-host business state.

| Priority | Domain | Package-local source | Candidate APIs | Only create a family when |
| --- | --- | --- | --- | --- |
| P2 | canvas board persistence and export pipelines | `sdkwork-magic-studio-canvas` still keeps boards in localStorage and exports to MagicCut from the package layer | `GET /api/app/v1/canvas/boards`<br>`POST /api/app/v1/canvas/boards`<br>`GET /api/app/v1/canvas/boards/:boardId`<br>`POST /api/app/v1/canvas/boards/import`<br>`POST /api/app/v1/canvas/boards/:boardId/export/json`<br>`POST /api/app/v1/canvas/boards/:boardId/export/magiccut` | canvas is promoted from a UI authoring surface into a first-class cross-host project domain with durable board identity, import/export lineage, and asset ownership |
| P3 | browser research memory | `sdkwork-magic-studio-browser` keeps bookmarks/history in localStorage and downloads in an in-memory queue | `GET /api/app/v1/browser/bookmarks`<br>`POST /api/app/v1/browser/bookmarks`<br>`GET /api/app/v1/browser/history`<br>`DELETE /api/app/v1/browser/history`<br>`GET /api/app/v1/browser/downloads` | the in-app browser becomes a real research/workspace product surface rather than a convenience shell for browsing pages |

### Explicit Non-Extraction Decisions From The Current Audit

The package audit also makes several "do not extract" decisions clearer:

- `sdkwork-magic-studio-browser/src/services/browserService.ts` is purely helper logic for URL normalization and favicon derivation; it must stay package-local
- `sdkwork-magic-studio-editor/src/services/editorSessionService.ts` may keep arbitrary-folder fallback state package-local, but canonical workspace-project session roaming already belongs under the `workspaces` family
- `sdkwork-magic-studio-canvas/src/services/canvasActionService.tsx` is presentation-layer interaction logic and must not become host API surface
- `sdkwork-magic-studio-canvas/src/services/canvasService.ts` still includes mock prompt-to-element generation; mock UI affordances are not server contracts
- `sdkwork-magic-studio-editor/src/services/projectService.ts` now maps `syncToGitHub` and `publishApp` UX actions onto canonical `workspaces` git-sync and release APIs; do not create separate `editor` governance routes or package-local deployment lineage stores
- `sdkwork-magic-studio-ide-config/src/services/ideConfigService.ts` should stay local unless managed toolchain governance becomes a real operator-facing product requirement
- browser downloads, if promoted, should be standardized under the `drive` family as durable download jobs rather than creating a browser-only transport surface

## Next Film API Candidates

The next extractable `film` APIs with the highest architecture value should now continue from the same canonical review context beyond the newly landed escalation-forecast, dependency-graph, intervention-plan, recovery-orchestration, approval-burn-down, intervention-outcomes, effectiveness-baseline, and intervention-execution-history surfaces such as:

- durable intervention execution state and operator acknowledgement
  - only add write-side execution ledgers, acknowledgements, or workflow mutation APIs if the Rust kernel becomes the real system of record for intervention actuation rather than a derived evidence reader

## Current Review Findings

The main architecture problems that still exist after the current extraction wave are:

- generation and voice route shape are now broadly complete, and the real provider adapter is now live for speech plus audio transcription/translation, text-to-image, prompt-guided image-to-image, image variation, image edit, host-local image upscale, text/image-to-video, the full text/similar/remix/extend music workflow, and image-backed character creation; the remaining gap is operation-level completion for video extend/style-transfer/lip-sync, sfx, and voice-clone, plus upstream generated-sdk parity for lip-sync
- `/api/app/v1/generation/tasks` is now the canonical cross-family task governance surface for list/read/delete plus honest global cancel, backed by a dedicated host governance layer that merges generation-registry tasks with canonical voice-speech task persistence; the remaining generation-governance gap is lineage/retry/duplicate only when the Rust kernel truly owns replay and ancestry semantics
- `capabilities/execution` now exposes family-level aggregate readiness plus per-operation `operationDetails`, so mixed families no longer hide ready host-local operations behind a single coarse status
- media service-layer capability preflight is now the emerging standard across image, video, music, sfx, character, and voice task creation flows, with video prompt-enhance/read/cancel lifecycle checks now also aligned
- `sdkwork-magic-studio-image` and `sdkwork-magic-studio-video` now also use the shared `waitForCanonicalTaskResult(...)` helper from `@sdkwork/magic-studio-core/services`, so every canonical host task family that polls by task id has converged on one runtime polling standard instead of hand-maintained package retry loops
- video and voice entry panels now adopt the shared `useRuntimeMagicStudioExecutionOperationCapability(...)` hook so canonical Rust-host operation readiness can disable generate/clone/enhance actions before submit while still preserving service-layer enforcement underneath
- the remaining frontend gap is expansion of that same shared capability-hook pattern into the remaining image, music, sfx, character, and wider voice/video affordance surfaces instead of letting each package invent its own runtime-readiness UI logic
- `@sdkwork/magic-studio-generation-history` now serves as the shared frontend adapter layer for both canonical creation-history persistence and canonical generation-task governance consumption, so feature packages can stop duplicating direct `generation/tasks` HTTP loops when they only need standard list/read/delete/cancel behavior
- `sdkwork-magic-studio-audio` and `sdkwork-magic-studio-music` now persist imported tasks through canonical host history, closing the last remaining import-path inconsistency across image, video, audio, music, sfx, and character history
- `/api/app/v1/creation/templates` is now the canonical reusable-recipe surface for multi-step creation workflows, and template apply now materializes the same host-owned current-session contract instead of reintroducing browser-local workflow joins
- `/api/app/v1/creation/batches` is now the canonical durable orchestration surface for one-to-many creation planning, strict template/manual batch state, per-item lifecycle tracking, and materialization into the host-owned current session; the remaining creation gap is durable execution scheduling, replay, and run-state governance only when the Rust kernel owns those semantics end to end
- `/api/app/v1/creation/presets` is now the canonical reusable-defaults surface for cross-host image, video, music, speech, and adjacent creation flows; the remaining creation work is deeper batch-execution governance, not batch transport extraction
- `sdkwork-magic-studio-assets` now consumes the canonical runtime server client for managed asset catalog query/import/read/update/delete, canonical prompt optimization, canonical creation capability discovery, canonical creation presets, canonical creation templates, and canonical creation session handoff; the remaining creation work is no longer transport extraction but broader batch-planning adoption and deeper workflow ownership only if the product promotes those flows into primary UX
- `sdkwork-magic-studio-chat` no longer owns package-local durable session metadata or transcript persistence; that state is now canonical under `/api/app/v1/chat/*`, and the remaining gap is provider-stream submission plus moderation, attachment resolution, and model-policy governance before a public chat execution route should exist
- `sdkwork-magic-studio-chatppt` now uses canonical Rust-host presentation persistence and slide lifecycle APIs; the remaining presentation gap is deeper prompt-to-slide generation and optional template/catalog semantics, which must stay explicitly unsupported until the host owns a real product contract
- `sdkwork-magic-studio-voicespeaker` now consumes canonical server APIs, imported voice tasks persist through the canonical host-owned `PUT /api/app/v1/voices/speech/tasks/:taskId` upsert contract, speech-task history reads/deletes now route through the shared canonical generation-governance store on top of `/api/app/v1/generation/tasks`, clone tasks expose standardized list/read/delete/cancel lifecycle routes, speech execution can run through the generated AI SDK, and clone creation no longer fakes provider success; the remaining voice gap is clone provider execution depth, not route ownership
- `sdkwork-magic-studio-character` now uses the same shared canonical generation-governance store for cross-family task list/cancel adoption instead of package-local task-governance HTTP loops; the remaining character gap is execution-depth refinement, not route ownership
- `sdkwork-magic-studio-trade` is now aligned to canonical Rust host APIs for marketplace tasks, orders, payments, wallet reads, and transaction history; the remaining trade work is capability depth, not gateway extraction
- `sdkwork-magic-studio-vip` is now aligned to canonical Rust host APIs for plans, membership status, purchase orchestration, subscription history, and cancellation; the remaining VIP work is pricing/governance depth only when the kernel truly owns more membership policy
- `sdkwork-magic-studio-portal-video` is now aligned to canonical Rust host APIs for feed publish, featured/discover retrieval, feed detail, interaction state, and author-owned deletion; the remaining portal work is deeper community workflow ownership, not transport extraction
- `sdkwork-magic-studio-film` now has a canonical host-owned project, preset, template, template-snapshot, asset-inventory, publish-history, review-queue, project-review-portfolio, reviewer-capacity, project-review-decision-freshness, project-review-governance-drift, project-review-escalation-forecast, project-review-dependency-graph, project-review-intervention-plan, project-review-recovery-orchestration, project-review-approval-burn-down, project-review-intervention-outcomes, project-review-effectiveness-baseline, project-review-intervention-execution-history, publish-detail, publish-review-state, publish-review-timeline, publish-review-rounds, publish-review-anchors, publish-review-activity, publish-review-decision-matrix, publish-review-readiness, publish-reviewer-coverage, publish-reviewer-backlog, publish-reviewer-attention, publish-review-operations-dashboard, publish-review-stale-decisions, publish-review-latency-analytics, publish-review-anchor-responsibility, publish-review-worklist, publish-review-assignments, publish-review-submit, publish-review-consensus, publish-approve, publish-request-changes, publish-review-comments, publish-review-comment-resolve, publish-reopen, publish-restore, publish-delete, publish-artifact-access, relink, publish, script-standardization, prepare-analysis, refresh-analysis, rebuild-storyboard, scene-breakdown, shot-variant planning, shooting-plan derivation, analysis, project-graph, validation, batch-authoring, storyboard, shot-sync, asset-binding, import-package, and export-package surface; the remaining high-value governance gap is durable execution state only if the host truly owns intervention actuation, not basic route shape
- `sdkwork-magic-studio-magiccut` now has a canonical host-owned authoring/render API family, but video render is still intentionally unsupported because the project does not yet have a real server-side composition engine; this is correct, but it remains a capability gap for a full video workstation
- `settings` has the right canonical route surface, but some preference-like consumers are still semantically undecided between truly cross-host product state and package-local UI state; extraction must stay meaning-driven, not storage-driven

## What Should Not Be Extracted Yet

These capabilities exist, but should not become canonical host APIs by default:

- browser URL normalization and favicon derivation
- canvas selection, hover, interaction, and local undo/redo internals
- player-preview-only helpers
- editor-only transient view mechanics outside canonical workspace-project session state
- local storage wrappers used only as implementation details

The rule is simple:

- if it is cross-host business state or a stable product contract, extract it
- if it is presentation or transient editor mechanics, keep it package-local

Applied to the current package audit:

- chat streaming is an execution-depth candidate only after the host truly owns moderation, attachment resolution, model policy, and streaming lifecycle semantics
- deeper presentation generation/template workflows are extraction candidates only on top of the now-canonical `/api/app/v1/presentations` family
- drive metadata overlay and managed download jobs should extend the canonical `/api/app/v1/drive` family only after item identity and durable job ownership are standardized
- canonical workspace-project session state now belongs under `/api/app/v1/workspaces/:workspaceId/projects/:projectId/session`; only arbitrary-folder fallback and transient editor-only view mechanics should remain package-local
- browser history/bookmarks should remain package-local unless the browser becomes a real research-memory product surface
- canvas board persistence/export should only become a public family if canvas is promoted into a durable cross-host authoring domain
- `syncToGitHub` and `publishApp` are now editor UX affordances on top of canonical `workspaces` governance routes; any further expansion must continue under project-scoped governance APIs rather than introducing `editor` transport families

## Final Standard

The target state for Magic Studio is:

1. `core` owns host-native infrastructure.
2. `app` owns every stable product capability, regardless of whether the implementation is host-local or upstream-gateway-backed.
3. `admin` owns operator and governance workflows.
4. Pure UI and local interaction helpers do not leak into the public host contract.
5. Server deployment and desktop embedding expose the same canonical API families, DTO vocabulary, and route semantics.
