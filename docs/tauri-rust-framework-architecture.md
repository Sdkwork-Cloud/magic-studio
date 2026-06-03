# Tauri Rust Framework Architecture

## Goal

Make `src-tauri` a thin desktop shell that hosts the canonical Rust HTTP server kernel instead of acting as a second business backend.

## Authority

This document is the desktop-shell specialization of `docs/magic-studio-unified-host-api-standard.md`.

Use:

- `docs/magic-studio-unified-host-api-standard.md` for the primary host/API/storage standard
- `docs/standards/magic-studio-authority-matrix.md` for package, server, and shell ownership summary
- `docs/platform-runtime-capability-matrix.md` for runtime capability exposure
- `docs/local-media-toolkit-architecture.md` for toolkit/media specialization

## Canonical Runtime Model

There is exactly one business capability kernel:

- `packages/sdkwork-magic-studio-server/src-host`

It is hosted in two ways:

1. Standalone server deployment
2. Embedded desktop host started by Tauri during native startup

This means desktop and deployable server mode share the same:

- HTTP route surface
- DTO contract
- OpenAPI output
- capability governance
- toolkit/media/database/compression behavior

On the frontend there are still two host families, not three:

- browser-hosted runtime: `web` and `server`
- desktop shell runtime: `desktop`

`server` means the browser client has discovered a same-origin canonical Rust host and promoted itself into the standalone server profile. Feature code must not use literal `=== 'web'` checks when the real intent is "browser-hosted behavior". Use runtime capability APIs and the shared browser-hosted runtime classification instead.

The same rule applies to local storage paths. Browser-hosted IndexedDB VFS is not a mock filesystem tier; it is the browser-backed implementation of the canonical MagicStudio path contract. Local feature code must resolve storage roots through the shared MagicStudio layout builders, not through ad hoc `/mock/*` directories.

Asset locator semantics are fixed as well. Pure protocol vocabulary and classification for `assets://`, `file://`, `desktop://`, local filesystem paths, and renderable URL detection are owned by `@sdkwork/magic-studio-types/asset-reference`. Runtime-backed normalization and URL/path materialization are owned by `@sdkwork/magic-studio-core/storage`. Feature packages may expose thin wrappers such as `@sdkwork/magic-studio-assets/asset-center`, but they must not redefine protocol constants or string-prefix parsing locally.

The global managed asset taxonomy is also fixed. Canonical system-library storage is only:

- `system/library/video`
- `system/library/image`
- `system/library/audio`
- `system/library/text`
- `system/library/other`

Feature code must not create alternate canonical buckets such as `downloads`, `images`, `models`, or `misc`.

## Canonical API Surface

Desktop mode does not define a parallel backend contract. It embeds the same canonical API system used by standalone server mode:

- `core`: `/api/core/v1`
- `app`: `/api/app/v1`
- `admin`: `/api/admin/v1`

Contract ownership is shared and host-neutral:

- route inventory: `packages/sdkwork-magic-studio-server/contracts/magic-studio-server.contract.json`
- TypeScript contract/client surface: `packages/sdkwork-magic-studio-server/src/*`
- Rust contract and routes: `packages/sdkwork-magic-studio-server/src-host/src/*`

Every desktop-visible business capability must come through that canonical route system, including DTO naming and OpenAPI output.

## Desktop Shell Boundary

`src-tauri` is allowed to own only native shell concerns that are not part of the canonical HTTP business contract:

- PTY/session lifecycle
- command existence checks for shell UX
- window/app/plugin bootstrap
- notifications/dialogs, clipboard, opener, updater, and related native shell affordances

`src-tauri` must not own parallel business implementations for:

- filesystem or workspace business transport
- media processing
- compression
- database access
- migrations
- toolkit orchestration
- jobs
- deployment/governance APIs
- policy APIs that belong to the canonical server

If a capability must work in both standalone server mode and desktop mode, it belongs in the Rust server kernel, not in a Tauri invoke command.

## Layered Structure

```text
src-tauri/src/
  main.rs                    # desktop shell bootstrap
  embedded_server.rs         # starts embedded canonical Rust HTTP server
  framework/
    context.rs               # shell-only AppContext DI container
    error.rs                 # FrameworkError / FrameworkResult
    runtime.rs               # run_blocking wrapper for shell adapters
    services/
      system.rs              # default shell + command existence
      pty.rs                 # PTY/session abstraction
  shell/
    mod.rs                   # shell registry + shell event vocabulary authority
    pty.rs                   # PTY/session state implementation
    session.rs               # PTY session lifecycle internals
    commands/
      mod.rs                 # closed shell command namespace
      pty.rs                 # thin PTY command adapters
      system.rs              # thin shell system command adapters
```

The canonical business server remains outside `src-tauri`:

```text
packages/sdkwork-magic-studio-server/
  src-host/                  # Rust HTTP kernel shared by server + desktop
  src/                       # TypeScript package facade / client surface
  contracts/                 # canonical contract and OpenAPI component sources
```

## AppContext Composition

`AppContext::default()` now wires shell-only dependencies:

1. `SystemService`
2. `PtyService`

That is the entire desktop-native surface. Business services are intentionally absent.

## Startup Flow

1. Tauri starts native plugins and window shell infrastructure.
2. `embedded_server::start_embedded_magic_studio_server()` binds the desktop-local listener and spawns the canonical Rust HTTP app.
3. `AppContext` is registered for shell-only invoke commands.
4. Frontend desktop bootstrap waits for canonical server health readiness before initializing server-backed SDK/toolkit layers.

This keeps desktop startup deterministic while preserving one backend implementation.

## Active Native Command Surface

The supported Tauri invoke surface is intentionally minimal:

- `create_pty`
- `start_pty`
- `write_pty`
- `resize_pty`
- `kill_pty`
- `sync_pty_sessions`
- `system_command_exists`

That allowlist is centralized in `src-tauri/src/shell/mod.rs`. `main.rs` calls the shared shell registry instead of inlining command names so desktop-native command growth has one explicit code owner.
The same namespace also owns the PTY shell event prefix and formatter so native emitters do not handwrite shell event names either.
Shell-private Rust implementation modules must stay nested under `src-tauri/src/shell/**`; do not reintroduce sibling top-level `commands/`, `pty/`, or `session/` modules.

Anything beyond this list requires explicit architectural justification. Business capability growth must happen in the canonical Rust server.

Frontend packages must consume this surface through `@sdkwork/magic-studio-core/platform` and `getPlatformRuntime()`. They must not import `@tauri-apps/*` directly for product behavior, because that bypasses the platform boundary and reintroduces runtime-specific coupling.
Where foundational packages expose focused runtime/service subpaths, frontend code must use them directly. `@sdkwork/magic-studio-core/sdk`, `@sdkwork/magic-studio-types/entity`, `@sdkwork/magic-studio-types/service`, `@sdkwork/magic-studio-types/pagination`, `@sdkwork/magic-studio-types/storage`, `@sdkwork/magic-studio-types/media`, `@sdkwork/magic-studio-types/assets`, `@sdkwork/magic-studio-types/asset-center`, `@sdkwork/magic-studio-types/image`, `@sdkwork/magic-studio-types/video`, `@sdkwork/magic-studio-types/audio`, `@sdkwork/magic-studio-types/music`, `@sdkwork/magic-studio-types/character`, `@sdkwork/magic-studio-types/voice`, `@sdkwork/magic-studio-types/sfx`, `@sdkwork/magic-studio-types/chat`, `@sdkwork/magic-studio-types/agi`, `@sdkwork/magic-studio-types/input-resource`, `@sdkwork/magic-studio-types/vocabulary`, `@sdkwork/magic-studio-types/catalog`, `@sdkwork/magic-studio-types/content`, `@sdkwork/magic-studio-types/user`, `@sdkwork/magic-studio-types/workspace`, `@sdkwork/magic-studio-types/runtime`, `@sdkwork/magic-studio-types/infrastructure`, and `@sdkwork/magic-studio-commons/services` are the canonical examples.
Media-facing feature packages such as video, image, audio, music, sfx, voice, and character must apply that rule in their shared internals as well: services/stores/history/utils/constants are not allowed to fall back to the broad `@sdkwork/magic-studio-types` root when a narrower owner subpath exists.
Public frontend naming must stay neutral as well: prefer `desktop` / `desktop shell` in APIs and docs, and keep `Tauri` scoped to host implementation details.

## Shell Governance Model

Desktop-native governance is intentionally narrow:

- shell governance is limited to the closed shell command and event vocabulary
- no filesystem, database, media, migration, job, toolkit, or policy command surface is exposed from the Tauri shell layer
- runtime metadata that affects business discovery belongs to the canonical HTTP server
- runtime bridge access is guarded by centrally owned shell-only command and event names in `src-tauri/src/shell/mod.rs`

This keeps shell governance focused on local host safety rather than duplicating server governance APIs.

## Runtime Initialization Contract

Desktop architecture also depends on import-safe runtime infrastructure:

- platform APIs initialize lazily
- runtime APIs initialize lazily
- browser-backed storage setup must not run eagerly at import time
- platform modules must avoid import-time logging side effects
- desktop network requests use the browser `fetch` semantics directly; desktop does not depend on a parallel Tauri HTTP transport

The desktop shell remains small only if the shared runtime surface stays predictable in browser, node-like, and embedded contexts.

## PTY Event Model

The desktop shell emits PTY output events only:

- `pty-output:<sessionId>`

That event name is emitted from the shared shell vocabulary helper, not from handwritten string templates in PTY/session code.

There is no `job:updated` event in the Tauri shell anymore because asynchronous business jobs belong to the canonical Rust server. There is also no active embedded-browser event surface until a real native browser implementation exists.

## Why This Architecture Is Correct

- One backend behavior model across deployable server and desktop host
- No duplicate API or DTO ownership between Tauri and Rust server
- Frontend business code talks to one transport contract
- Desktop-native code remains small, auditable, and replaceable
- Future deployment forms can host the same Rust kernel without re-implementing business logic

## Review Findings Resolved

The architecture now explicitly removes several forms of technical debt that had started to accumulate:

1. Tauri no longer exposes parallel business command surfaces for media, compression, database, migration, policy, toolkit, or jobs.
2. Desktop runtime metadata is no longer split between a Tauri-specific command surface and the canonical server discovery endpoints.
3. Product file access is routed through the canonical Rust HTTP host instead of a parallel Tauri filesystem command plane.
4. Governance in `src-tauri` is reduced to a closed shell command/event vocabulary, which matches its actual shell responsibilities.
5. PTY remains a native shell concern, while long-running business jobs stay inside the canonical Rust HTTP host.

## Guardrail

When adding new desktop-native code, apply this decision rule:

- If the capability is needed only because the app is a desktop shell, it may live in `src-tauri`.
- If the capability is part of product behavior and should exist in both desktop and server deployments, it must be implemented in `packages/sdkwork-magic-studio-server/src-host`.
