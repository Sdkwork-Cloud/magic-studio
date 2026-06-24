> Migrated from `docs/架构/04-模块规划与边界设计.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 04. Module Planning And Boundary Design

## 1. Goal

This document defines the stable module boundaries for Magic Studio V2 after the server-first architecture convergence.

The target state is:

- one canonical Rust business kernel
- one thin desktop shell host
- one shared frontend runtime model across browser-hosted and desktop delivery
- one clear dependency direction from application shell to domain packages to shared platform/runtime contracts

## 2. Canonical Module Map

### 2.1 Host And Runtime

| Area | Canonical Location | Responsibility |
| --- | --- | --- |
| Canonical Rust business kernel | `packages/sdkwork-magic-studio-server/src-host` | Filesystem, media, compression, database, governance, jobs, migrations, deployment, OpenAPI, DTO-backed HTTP routes |
| Desktop shell host | `src-tauri` | Native shell bootstrap, embedded server startup, PTY, shell command existence checks, window/app lifecycle |
| Frontend runtime boundary | `packages/sdkwork-magic-studio-core/src/platform` | Shared runtime capability API for `web`, `server`, and `desktop` |
| Runtime and public platform vocabulary | `packages/sdkwork-magic-studio-types/src/runtime.types.ts` | Canonical runtime kinds and public app platform names |

### 2.2 Frontend Layers

| Layer | Primary Locations | Responsibility |
| --- | --- | --- |
| App shell | `src/app`, `src/router`, `src/layouts` | Bootstrap, route composition, providers, application chrome |
| Foundational shared packages | `@sdkwork/magic-studio-types`, `@sdkwork/magic-studio-commons`, `@sdkwork/magic-studio-core`, `@sdkwork/magic-studio-fs` | Shared contracts, utilities, runtime abstraction, storage/file primitives |
| Canonical server facade | `@sdkwork/magic-studio-server` | Route contract, host descriptor resolution, typed client surface |
| Domain packages | `packages/sdkwork-magic-studio-*` | Product features built on canonical runtime and server contracts |

## 3. Canonical Dependency Direction

```text
App Shell
  -> Domain Packages
  -> @sdkwork/magic-studio-core/platform
  -> @sdkwork/magic-studio-server

Domain Packages
  -> Shared contracts/utilities
  -> Canonical runtime capabilities
  -> Canonical server clients

Desktop Shell
  -> Native OS / Tauri plugins
  -> Embedded canonical Rust server

Canonical Rust Server
  -> Contract artifacts
  -> Internal Rust services
```

The critical rule is that product behavior must flow downward through canonical contracts. It must not bypass them with ad hoc native commands, page-local fetch wrappers, or direct host globals.

## 4. Boundary Rules

### 4.1 Rust Host Boundaries

- `packages/sdkwork-magic-studio-server/src-host` is the only business capability kernel.
- `src-tauri` is not a second backend.
- Desktop and standalone deployment must expose the same HTTP contract.
- If a capability is needed in both desktop and server deployment, it belongs in the Rust server kernel.

### 4.2 Desktop Shell Boundaries

`src-tauri` may own only shell-native concerns:

- Tauri/bootstrap wiring
- embedded Rust server startup
- PTY/session lifecycle
- shell command existence checks
- window, dialog, notification, updater, clipboard, and opener integration
- private Rust shell modules under `src-tauri/src/shell/**`

`src-tauri` must not own business implementations for:

- filesystem APIs used by product features
- media processing
- compression
- database
- migrations
- jobs
- policy/governance APIs
- toolkit execution

Do not reintroduce sibling top-level Rust namespaces such as `src-tauri/src/commands`, `src-tauri/src/pty`, or `src-tauri/src/session`. Shell-private implementation ownership stays nested under `src-tauri/src/shell/**`.

### 4.3 Frontend Boundaries

- Product code must consume canonical capabilities through `getPlatformRuntime()`, `PlatformRuntime`, or focused package facades built on top of them.
- Product code must consume backend behavior through `@sdkwork/magic-studio-server` or higher-level facades that delegate to it.
- Feature packages must not import `@tauri-apps/*` directly for product behavior.
- Feature packages must not use handwritten `/api/core`, `/api/app`, or `/api/admin` fetch wrappers when a canonical client/facade exists.
- Shared runtime kind and public app platform vocabularies must come from `@sdkwork/magic-studio-types`, not from duplicate string unions in downstream packages.
- Canonical asset reference syntax belongs to `@sdkwork/magic-studio-types/asset-reference`. That includes `assets://`, `file://`, `desktop://`, local file paths, and renderable URL classification.
- Runtime-backed asset normalization, absolute-path resolution, and renderable URL materialization belong to `@sdkwork/magic-studio-core/storage`.
- Domain packages may wrap or re-export asset helpers, but they must not become a second protocol authority by redefining protocol constants or raw prefix parsing.
- Foundational packages must expose and consume focused public subpaths when the dependency is narrower than the root package. Use `@sdkwork/magic-studio-types/entity`, `@sdkwork/magic-studio-types/service`, `@sdkwork/magic-studio-types/pagination`, `@sdkwork/magic-studio-types/storage`, `@sdkwork/magic-studio-types/media`, `@sdkwork/magic-studio-types/assets`, `@sdkwork/magic-studio-types/asset-center`, `@sdkwork/magic-studio-types/image`, `@sdkwork/magic-studio-types/video`, `@sdkwork/magic-studio-types/audio`, `@sdkwork/magic-studio-types/music`, `@sdkwork/magic-studio-types/character`, `@sdkwork/magic-studio-types/voice`, `@sdkwork/magic-studio-types/sfx`, `@sdkwork/magic-studio-types/chat`, `@sdkwork/magic-studio-types/agi`, `@sdkwork/magic-studio-types/input-resource`, `@sdkwork/magic-studio-types/vocabulary`, `@sdkwork/magic-studio-types/catalog`, `@sdkwork/magic-studio-types/content`, `@sdkwork/magic-studio-types/user`, `@sdkwork/magic-studio-types/workspace`, `@sdkwork/magic-studio-types/runtime`, `@sdkwork/magic-studio-types/infrastructure`, `@sdkwork/magic-studio-commons/services`, and `@sdkwork/magic-studio-core/sdk` instead of treating root entrypoints as universal imports.
- Media capability packages must map shared internals to the narrowest owner subpath:
  - entity identity helpers -> `@sdkwork/magic-studio-types/entity`
  - generation execution/outcome/input contracts -> `@sdkwork/magic-studio-types/agi`
  - renderable URL and stable locator helpers -> `@sdkwork/magic-studio-types/input-resource`
  - generic asset DTOs -> `@sdkwork/magic-studio-types/assets`
  - provider registry contracts -> `@sdkwork/magic-studio-types/infrastructure`
  - image-only aspect ratio contracts -> `@sdkwork/magic-studio-types/image`
  - media-domain task/result contracts -> `@sdkwork/magic-studio-types/video`, `@sdkwork/magic-studio-types/audio`, `@sdkwork/magic-studio-types/music`, `@sdkwork/magic-studio-types/character`, `@sdkwork/magic-studio-types/voice`, `@sdkwork/magic-studio-types/sfx`
  - chat session/message/transcript contracts -> `@sdkwork/magic-studio-types/chat`

## 5. Stable Module Ownership

### 5.1 `@sdkwork/magic-studio-types`

Owns:

- cross-package DTOs
- runtime kind vocabulary
- public app platform vocabulary
- foundational identity and domain contracts
- focused foundational public subpaths such as `./entity`, `./service`, `./pagination`, `./storage`, `./media`, `./assets`, `./asset-center`, `./image`, `./video`, `./audio`, `./music`, `./character`, `./voice`, `./sfx`, `./chat`, `./agi`, `./input-resource`, `./runtime`, and `./infrastructure`
- focused ownership subpaths such as `./vocabulary`, `./catalog`, `./content`, `./user`, and `./workspace` for non-runtime-neutral contract families

Does not own:

- runtime global access
- platform adapters
- transport logic

### 5.2 `@sdkwork/magic-studio-core`

Owns:

- runtime capability composition
- platform adapters
- shell bridge vocabulary
- desktop shell module loading
- runtime-backed asset locator/reference normalization and renderable URL materialization

Does not own:

- duplicate runtime/public platform vocabulary
- direct feature business logic

### 5.3 `@sdkwork/magic-studio-commons`

Owns:

- shared UI helpers
- window/runtime-global helpers for packages that cannot depend on `magic-studio-core` runtime APIs directly
- focused shared service entrypoints such as `@sdkwork/magic-studio-commons/services`

Does not own:

- alternate runtime classification vocabulary
- raw Tauri business transport

### 5.4 `@sdkwork/magic-studio-fs`

Owns:

- filesystem abstractions and provider wiring on top of canonical runtime capabilities

Does not own:

- ad hoc window global access
- alternate platform runtime APIs

## 6. Review Checklist

When adding or reviewing a module, answer these questions:

1. Does this change introduce a second owner for an existing runtime, API, or DTO vocabulary?
2. Does this code belong in the Rust server kernel instead of the desktop shell?
3. Does this feature depend on `@tauri-apps/*`, direct window globals, or handwritten API URLs instead of canonical facades?
4. Does this file handwrite `assets://`, `file://`, `desktop://`, `http:`, `blob:`, `data:`, or `asset:` parsing instead of calling the canonical helper owner?
5. Are package dependencies aligned with actual runtime imports, including focused subpaths where the package exposes them?
6. Can a new engineer identify one clear owner for this responsibility without reading three packages?

If any answer is wrong or unclear, the boundary is still drifting.

## 7. Current Required End State

Magic Studio V2 is considered structurally correct only when all of the following remain true:

- one canonical Rust business kernel
- one shell-only desktop host
- one closed native shell command vocabulary
- one canonical runtime/public platform vocabulary
- one frontend runtime capability model for `web`, `server`, and `desktop`
- one typed API contract shared by standalone server and desktop-hosted server

This is the standard to preserve going forward.

