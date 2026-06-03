# Magic Studio Rust Server-First Design

**Scope**

- include: `rust server-first runtime`, `single-source server contract`, `standard envelopes`, `frontend local-api discovery`, `policy and migration http APIs`, `desktop shell demotion`
- exclude: migrating every existing feature module off the old runtime bridge in one pass
- exclude: preserving legacy Tauri invoke compatibility as a long-term architecture rule

## Design Goals

- make the Rust server the only canonical local capability gateway for the new application standard
- remove contract drift by introducing a single source of truth for route metadata and OpenAPI seeds
- establish a standard response model for success, list, and problem payloads
- separate desktop shell concerns from local business and system capability transport
- give frontend runtime a standard way to discover and consume the local server
- land enough real HTTP capability to start replacing native bridge clients immediately

## Recommended Architecture

### Runtime rule

- `web`, `desktop`, `server`, `container`, and `kubernetes` are delivery modes
- delivery modes must share the same local capability contract
- the local capability contract is HTTP served by the Rust server
- the desktop shell may still own window chrome, updater hooks, and host lifecycle, but not the primary business or toolkit transport

### Canonical packages

```text
packages/
  sdkwork-magic-studio-types/
  sdkwork-magic-studio-host-core/
  sdkwork-magic-studio-server/
  sdkwork-magic-studio-distribution/
```

### Package responsibilities

#### `@sdkwork/magic-studio-types`

- runtime modes
- host descriptors
- API surfaces
- route contract types
- envelope types
- problem types

#### `@sdkwork/magic-studio-host-core`

- default local host and bind metadata
- host discovery rules
- local server URL helpers
- runtime-mode-aware host descriptor resolution

#### `@sdkwork/magic-studio-server`

- canonical server contract JSON
- TypeScript contract facade
- TypeScript client
- Rust host
- Rust route handlers
- Rust standard response helpers

#### `@sdkwork/magic-studio-distribution`

- release family metadata
- artifact manifest types

## Server Contract Standard

### Single source of truth

- create one JSON contract file inside `@sdkwork/magic-studio-server`
- both TypeScript and Rust must derive route metadata from that file
- route catalog and OpenAPI seed are generated from the same contract, never duplicated by hand

### Canonical surfaces

```text
/api/core/v1
/api/app/v1
/api/admin/v1
```

### Required routes in this iteration

```text
GET  /healthz
GET  /docs
GET  /openapi.json
GET  /openapi/magic-studio-server-v1.json
GET  /api/core/v1/routes
GET  /api/core/v1/runtime/summary
GET  /api/core/v1/toolkit/capabilities
GET  /api/app/v1/plugins
GET  /api/admin/v1/deployments
POST /api/core/v1/filesystem/read-dir
POST /api/core/v1/filesystem/read-text
POST /api/core/v1/filesystem/read-bytes
POST /api/core/v1/filesystem/write-text
POST /api/core/v1/filesystem/write-bytes
POST /api/core/v1/filesystem/stat
POST /api/core/v1/filesystem/exists
POST /api/core/v1/filesystem/ensure-dir
POST /api/core/v1/filesystem/remove
POST /api/core/v1/filesystem/rename
POST /api/core/v1/filesystem/copy-file
POST /api/core/v1/policy/validate-path
POST /api/core/v1/policy/validate-command
GET  /api/core/v1/policy/snapshot
POST /api/core/v1/migrations/status
POST /api/core/v1/migrations/apply
```

## API Standard

### Success envelope

```json
{
  "requestId": "uuid",
  "timestamp": "rfc3339",
  "data": {},
  "meta": {
    "version": "v1"
  }
}
```

### List envelope

```json
{
  "requestId": "uuid",
  "timestamp": "rfc3339",
  "items": [],
  "meta": {
    "page": 1,
    "pageSize": 0,
    "total": 0,
    "version": "v1"
  }
}
```

### Problem envelope

```json
{
  "requestId": "uuid",
  "timestamp": "rfc3339",
  "error": {
    "code": "string",
    "message": "string",
    "detail": "string|null",
    "retryable": false,
    "fieldErrors": null
  }
}
```

### Error mapping rules

- validation errors: `400`
- policy denials: `403`
- missing resources: `404`
- conflict conditions: `409`
- unexpected internal failures: `500`

## Rust Server Standard

### Rust host layout

```text
packages/sdkwork-magic-studio-server/
  contracts/
    magic-studio-server.contract.json
  src/
    index.ts
    client.ts
  src-host/
    Cargo.toml
    src/
      config.rs
      contract.rs
      lib.rs
      main.rs
      response.rs
      routes/
        admin.rs
        app.rs
        core.rs
        docs.rs
        mod.rs
      services/
        filesystem.rs
        migration.rs
        policy.rs
        mod.rs
      state.rs
```

### Rust design rules

- one file, one clear responsibility
- route handlers are thin and state-driven
- service logic is isolated from HTTP response formatting
- server config is explicit and testable
- every public route is covered by route tests

## Frontend Standard

### Discovery rule

- frontend must resolve a `MagicStudioHostDescriptor` through host-core helpers
- desktop defaults to the local server descriptor unless explicitly overridden
- standalone server mode may use same-origin host discovery

### Runtime rule

- frontend packages do not own host discovery logic ad hoc
- frontend packages do not import `@tauri-apps/api/core.invoke` for business or toolkit transport
- new local capability clients must use the typed server client or direct HTTP helpers built on the same descriptor
- desktop shell may keep window, dialog, notification, updater, and PTY ownership, but canonical filesystem transport must flow through the Rust server contract
- browser-hosted `server` runtime must resolve canonical host system paths from Rust runtime summary instead of inheriting placeholder web paths

### First clients to convert

- policy client
- migration client
- desktop filesystem adapter

These are small enough to move now and establish the pattern for later toolkit migrations.

## Review Findings Driving This Design

1. the previous server contract was duplicated in TypeScript and Rust
2. Rust server declared `app` and `admin` routes in metadata but did not register them at runtime
3. `/docs` existed as a constant but not as a real route
4. frontend toolkit and policy clients still depended on `bridge.invoke`
5. host-core lacked a real discovery standard
6. desktop filesystem transport still treated Tauri commands as a business backend instead of using the canonical server contract

## Success Criteria

- server contract lives in one JSON source and both runtimes consume it
- Rust server serves real `core`, `app`, and `admin` routes declared by the contract
- policy, migration, and canonical filesystem APIs are available over HTTP
- TypeScript host-core exposes deterministic local server discovery
- frontend policy, migration, desktop filesystem, and browser-hosted server filesystem clients operate through the Rust server contract
