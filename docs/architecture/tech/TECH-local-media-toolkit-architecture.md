> Migrated from `docs/local-media-toolkit-architecture.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Local Media ToolKit Architecture

## Goal

Build a reusable local-first media foundation for Magic Studio on top of one canonical Rust server kernel that can run in two host modes:

1. standalone server deployment
2. embedded desktop host inside Tauri

## Source of Truth

This document specializes `docs/magic-studio-unified-host-api-standard.md` for media, toolkit, workspace, and local-first processing concerns.

Host and API rules in this document inherit the same canonical ownership model:

- one Rust business kernel
- one HTTP contract family
- one OpenAPI surface
- one shell-only desktop boundary

## Core Principles

- Local-first: ingest, transcode, caching, and metadata persistence should work without remote product services.
- Single capability kernel: business/media/database/compression behavior must come from the canonical Rust HTTP server, not from parallel Tauri commands.
- Runtime parity: desktop and server mode share one API contract and one OpenAPI surface.
- Stable frontend surface: UI/business modules call toolkit APIs and server clients, never raw native implementation details.
- Deterministic artifacts: every generated file has explicit path and metadata ownership.

## Capability Domains

- Image: decode, metadata, resize, format conversion
- Video: metadata, concat, transcode, trim, thumbnail, extract audio
- Audio/Voice: metadata, convert, normalize, mix, recording primitives
- Compression: zip/unzip for local project bundles
- File system: normalized local read/write/exists/ensure-dir helpers
- Database: sqlite-backed persistence for local projects, jobs, exports, and caches
- Workspace: stable local directory conventions for media/cache/db/temp roots
- Recorder: browser/runtime capture primitives exposed through toolkit abstractions

## Canonical Rust Server Layer

The canonical business backend is the Rust server in:

- `packages/sdkwork-magic-studio-server/src-host`

Desktop mode embeds that server during Tauri startup. Standalone mode runs it as a deployable server. Both modes expose the same HTTP contract.

Representative route families:

- `GET /healthz`
- `GET /api/core/v1/runtime/summary`
- `GET /api/core/v1/toolkit/capabilities`
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
- `POST /api/core/v1/compression/zip`
- `POST /api/core/v1/compression/unzip`
- `POST /api/core/v1/database/sqlite/execute`
- `POST /api/core/v1/database/sqlite/query`
- `POST /api/core/v1/database/sqlite/execute-batch`

These media/toolkit capabilities belong to the `core` surface because they are host-owned runtime capabilities, not `app` or `admin` product APIs.

## Desktop Shell Layer

Tauri exists only to host desktop-native shell concerns:

- start the embedded Rust server
- manage PTY/session lifecycle
- bridge browser/webview shell actions
- provide notifications/dialogs/window integration

Tauri must not reintroduce media/compression/database/toolkit business commands.

## Frontend Integration Rules

- Frontend modules use `getPlatformToolKit()` and server SDK clients as the stable surface.
- Desktop bootstrap waits for canonical server readiness before initializing server-backed flows.
- Desktop business code must not silently fall back to Tauri invoke commands for server-owned capabilities.
- Shared DTOs that cross package boundaries live in `@sdkwork/magic-studio-types`.

## Localized Workflow for Video Products

1. Ingest media into stable local workspace roots.
2. Probe metadata through the canonical Rust server.
3. Persist descriptors, jobs, and project state through canonical sqlite APIs.
4. Run local media transforms through canonical media routes.
5. Cache thumbnails, proxies, and derived artifacts under deterministic workspace directories.
6. Export output files plus optional archive packages through canonical compression/database flows.

## Data Persistence Schema (Minimum)

- `projects`:
  - `id`, `name`, `created_at`, `updated_at`, `settings_json`
- `assets`:
  - `id`, `project_id`, `path`, `mime`, `size_bytes`, `duration_sec`, `meta_json`
- `jobs`:
  - `id`, `project_id`, `type`, `status`, `input_json`, `output_json`, `error`, `created_at`, `updated_at`
- `exports`:
  - `id`, `project_id`, `output_path`, `preset`, `status`, `meta_json`, `created_at`

## Reuse Strategy Across Apps

- Publish stable capability APIs from `@sdkwork/magic-studio-core/platform`.
- Keep app-specific orchestration in feature packages such as magiccut/video/audio.
- Put cross-runtime business logic in the Rust server kernel or shared TypeScript clients, not in Tauri commands.
- Treat Tauri as a host shell, not as a second application backend.

