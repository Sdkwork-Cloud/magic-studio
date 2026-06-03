# Magic Studio Server Runtime Design

**Scope**

- include: `workspace topology`, `server package`, `rust local server`, `host-core`, `distribution`, `server api`, `plugin boundary`, `deploy/docker`, `deploy/kubernetes`, `web/desktop/server runtime convergence`
- exclude: full migration of every existing business module onto the new server transport in the first iteration
- exclude: replacing current Tauri desktop host in one cutover

**Design Goals**

- align `magic-studio-v2` with the `sdkwork-birdcoder` multi-runtime workspace shape instead of keeping server capability trapped inside `src-tauri invoke`
- define an independent `server` package with a Rust local host that can run without the Tauri shell
- promote local capabilities from command-style bridge calls to a unified HTTP API contract with `core`, `app`, and `admin` surfaces
- keep current web and desktop entries usable while the new server-first runtime becomes the canonical local capability boundary
- introduce plugin-ready encapsulation so local capability extensions are governed by manifest, policy, and route registry rather than ad hoc service wiring
- support multiple delivery modes: `web`, `desktop`, `server`, `container`, and `kubernetes`

## Recommended Approach

### Option A: Big-bang birdcoder mirror

- Move root web and desktop delivery immediately into `packages/sdkwork-magic-studio-web` and `packages/sdkwork-magic-studio-desktop`
- Replace current runtime bridge and `src-tauri` flow in one cutover
- Add full server, release, deployment, and API contracts at once

**Trade-off**

- closest visual match to `birdcoder`
- highest breakage risk
- not compatible with the current dirty workspace and wide business-module surface

### Option B: Server-first strangler migration

- Add the new `server`, `types`, `host-core`, and `distribution` packages first
- Establish Rust local server, API contract, release skeleton, and deployment skeleton in parallel with the current app
- Gradually switch current runtime capabilities and feature modules onto the new server transport
- Promote web and desktop delivery packages later, once the server contract is stable

**Trade-off**

- slightly slower than a big-bang rewrite
- materially safer
- preserves current product behavior while converging toward the `birdcoder` architecture

### Option C: Desktop-embedded HTTP compatibility layer

- Keep current root structure
- Expose an internal HTTP layer only inside Tauri
- Delay independent server package and deployment families until later

**Trade-off**

- lowest initial cost
- fails the user goal of defining an independent server package and multi-deployment system
- keeps server architecture as a desktop sidecar instead of a first-class runtime

**Recommendation**

Use **Option B**. It is the only path that reaches `birdcoder`-style server architecture without coupling success to a risky one-shot rewrite.

## Target Workspace Topology

### New product packages

```text
packages/
  sdkwork-magic-studio-types/
  sdkwork-magic-studio-host-core/
  sdkwork-magic-studio-server/
  sdkwork-magic-studio-distribution/
```

### Later delivery packages after transport hardening

```text
packages/
  sdkwork-magic-studio-web/
  sdkwork-magic-studio-desktop/
```

### Temporary transition rule

- current root `src/` and `src-tauri/` remain active during phase 1
- current root app becomes a transitional delivery shell, not the permanent authority for local runtime shape
- the new `server` package becomes the authority for local capability transport, route catalog, OpenAPI export, and packaged server release

## Package Responsibilities

### `@sdkwork/magic-studio-types`

- shared `server api` types
- request and response envelopes
- route catalog models
- runtime mode and host mode definitions
- OpenAPI-derived client type output targets
- plugin manifest and permission contract types

### `@sdkwork/magic-studio-host-core`

- local server default host and port constants
- host descriptor model
- runtime distribution metadata
- local server discovery logic for `desktop`, `server`, and later `container` and `kubernetes`

### `@sdkwork/magic-studio-server`

- Rust host source under `src-host`
- TypeScript contract bridge under `src`
- route definitions, OpenAPI export seed, route catalog, runtime summary, health route
- embedded web asset packaging contract

### `@sdkwork/magic-studio-distribution`

- release family metadata
- artifact manifest types
- packaging profile definitions for `server`, `container`, `kubernetes`, and later `desktop` and `web`

## Server API Architecture

### Canonical surfaces

- `core`: runtime health, route catalog, toolkit capabilities, jobs, migrations, policy, file system, browser, media, pty
- `app`: plugin catalog, workspace runtime services, project-local operations, feature-facing local APIs
- `admin`: governance, audit, release, deployment, diagnostics

### Canonical prefixes

```text
/api/core/v1
/api/app/v1
/api/admin/v1
```

### Required meta routes

```text
GET /healthz
GET /openapi.json
GET /openapi/magic-studio-server-v1.json
GET /api/core/v1/routes
GET /api/core/v1/runtime/summary
GET /api/core/v1/toolkit/capabilities
```

### Envelope standard

```json
{
  "requestId": "string",
  "timestamp": "string",
  "data": {},
  "meta": {
    "version": "v1"
  }
}
```

### Problem response standard

```json
{
  "requestId": "string",
  "timestamp": "string",
  "error": {
    "code": "string",
    "message": "string",
    "detail": "string|null",
    "retryable": "boolean",
    "fieldErrors": "object|null"
  }
}
```

## Rust Local Server Design

### Host structure

```text
packages/sdkwork-magic-studio-server/
  src/
    index.ts
  src-host/
    Cargo.toml
    src/
      lib.rs
      main.rs
      routes/
      state/
      plugins/
      policies/
```

### Rust responsibilities

- boot Axum application
- expose canonical route catalog and OpenAPI document
- load static web bundle for standalone server mode
- bridge existing local capability services from current `src-tauri/framework/services/*`
- own plugin registry and policy enforcement
- own server-mode runtime state, not Tauri window state

### Migration rule for current `src-tauri`

- existing service logic is reused, not rewritten blindly
- command handlers become thin adapters over reusable service modules
- over time, shared Rust service modules move from `src-tauri` into the new `packages/sdkwork-magic-studio-server/src-host` and desktop reuses them

## Frontend Runtime Convergence

### Current problem

- `index.tsx -> bootstrap -> getPlatformRuntime()` currently distinguishes mainly `web` and `desktop`
- local capabilities are consumed through runtime facades but terminate at `Tauri invoke`
- no independent `server` runtime mode exists

### Target rule

- frontend packages continue consuming runtime facades
- runtime facades stop assuming that local capability means `Tauri invoke`
- local capability transport becomes selectable:
  - `web`: browser-only implementation
  - `desktop`: desktop shell plus discovered local server base URL
  - `server`: browser client talking to packaged Rust local server

### Phase 1 boundary

- define server-aware runtime types and host descriptors
- do not migrate every existing package in one cutover
- wire only minimal detection and transport contracts in the first iteration

## Plugin Architecture

### Plugin goals

- plugin loading is governed by manifest, permission scopes, and policy checks
- plugins do not directly obtain raw file system or shell access
- plugin routes are registered through a server-owned registry

### Plugin contract

```json
{
  "id": "string",
  "name": "string",
  "version": "string",
  "kind": "builtin|local",
  "entry": {
    "routePrefix": "/api/app/v1/plugins/<plugin-id>",
    "capabilitySet": ["filesystem.read", "media.inspect"]
  },
  "permissions": {
    "paths": ["workspace", "cache", "plugin-sandbox"],
    "commands": ["none|governed"]
  }
}
```

### Phase 1 rule

- build plugin manifest and registry types first
- expose plugin catalog and policy snapshot APIs
- defer arbitrary plugin execution until policy and sandbox boundaries are proven

## Deployment Model

### Delivery families

- `web`: static browser build
- `desktop`: current Tauri shell, later packaged as an explicit delivery package
- `server`: Rust local server with embedded web assets
- `container`: Docker bundle for Linux deployment
- `kubernetes`: Helm-compatible deployment bundle

### Required directories

```text
deploy/
  docker/
  kubernetes/
server/
  windows/x64/
  linux/x64/
  linux/arm64/
```

### Release rules

- packaged `server` artifact must include the Rust binary, embedded web assets, and machine-readable manifest
- `container` and `kubernetes` artifacts derive from the same server release family, not an unrelated Node-only host
- release metadata must describe family, platform, arch, checksum, and OpenAPI version

## Migration Phases

### Phase 1: Server runtime foundation

- create `types`, `host-core`, `server`, and `distribution` packages
- add Rust local server skeleton
- add route catalog and OpenAPI skeleton
- add initial root scripts for `server:dev` and `server:build`
- add deploy skeleton for `docker` and `kubernetes`

### Phase 2: Runtime bridge convergence

- make frontend runtime aware of `server` transport
- introduce local server discovery into desktop and browser server mode
- bridge minimal feature flows through the new server contract

### Phase 3: Service migration

- move reusable local capability logic out of `src-tauri` command-only structure
- expose current policy, filesystem, job, browser, media, pty, and migration services through the server routes

### Phase 4: Delivery convergence

- promote current root web and desktop delivery into explicit packageized hosts
- align release automation with `server`, `container`, and `kubernetes` families

## Testing Strategy

### TypeScript verification

- package-level `tsc --noEmit` for new packages
- route contract tests for route catalog and OpenAPI seed
- root script contract tests for `server:dev` and `server:build`

### Rust verification

- `cargo test --manifest-path packages/sdkwork-magic-studio-server/src-host/Cargo.toml`
- route smoke tests for `/healthz`, `/openapi.json`, and `/api/core/v1/routes`

### Integration verification

- packaged local server can boot without the Tauri shell
- current workspace can still typecheck with the added packages and scripts

## Design Decisions

1. The independent `server` package is mandatory and lands in phase 1, not a future cleanup task.
2. The new local runtime authority is the Rust server contract, not `Tauri invoke`.
3. The current root app remains only as a transition shell until delivery packages are promoted.
4. Plugin support is introduced through governed manifests and route registries, not arbitrary code execution first.
5. Multi-deployment support is defined immediately as architecture, but implementation lands incrementally by family.

## Success Criteria

- `magic-studio-v2` contains a real `packages/sdkwork-magic-studio-server`
- the Rust server boots independently and serves canonical meta routes
- shared TypeScript contracts exist for server runtime, route catalog, and host descriptors
- root scripts recognize server development and build entrypoints
- deploy skeletons exist for `docker` and `kubernetes`
- the path to full `birdcoder`-style multi-runtime convergence is executable, not just documented
