> Migrated from `docs/tauri-industry-desktop-capability-blueprint.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Tauri Industry Desktop Capability Blueprint

## Authority

This document is a specialized desktop-shell capability reference subordinate to:

- `docs/magic-studio-unified-host-api-standard.md`
- `docs/tauri-rust-framework-architecture.md`

It does not define Magic Studio V2 business/backend ownership. If a capability must exist in both standalone server deployment and desktop mode, it belongs in `packages/sdkwork-magic-studio-server/src-host`, not in the shell blueprint.

## Goal

Define a reusable desktop shell blueprint for Tauri + Rust applications that need native host affordances without turning the desktop shell into a second backend.

This blueprint is intentionally server-first:

- the canonical Rust business kernel stays host-neutral
- the desktop host stays thin, explicit, and replaceable
- frontend business flows keep one typed API contract across standalone server and desktop deployment

## Host Placement Standard

The first architectural question is always ownership.

| Capability kind | Owner | Examples |
| --- | --- | --- |
| Shell-only native host capability | `src-tauri` | window/app lifecycle, desktop plugins, PTY, shell command existence checks, shell event wiring |
| Shared business capability | `packages/sdkwork-magic-studio-server/src-host` | filesystem/workspace behavior, media, compression, database, migrations, jobs, governance, deployment, toolkits |
| Shared frontend runtime contract | `@sdkwork/magic-studio-types`, `@sdkwork/magic-studio-core`, `@sdkwork/magic-studio-server` | runtime kinds, platform capability adapters, typed server discovery, typed clients |

Rules:

1. If the same behavior must work in standalone server deployment and desktop mode, it is not a shell capability.
2. `src-tauri` may expose only the native affordances that exist because the host form is desktop.
3. Frontend product code must consume shell behavior through typed runtime/platform boundaries, not direct `@tauri-apps/*` imports or ad hoc invoke strings.

## Shell-Only Capability Domains

### 1. Host Runtime and Bootstrap

Scope:

- app startup/shutdown
- embedded server startup orchestration
- native plugin initialization
- minimal shell dependency injection

Magic Studio V2 current shape:

- `main.rs` boots Tauri plugins and starts the embedded canonical Rust server
- `framework/context.rs` wires only `SystemService` and `PtyService`
- `framework/runtime.rs` owns the blocking adapter used by shell commands

### 2. Window and Desktop Integration

Scope:

- window lifecycle
- native menu/tray/deep link integration
- dialog/notification/clipboard/opener/updater wiring
- single-instance and shell UX affordances

This layer is desktop-specific because it exists only due to the native host container. It must not become a product-business transport layer.

### 3. Terminal and Process Plane

Scope:

- PTY/session lifecycle
- shell output event streaming
- shell command existence probing for UX flows

Magic Studio V2 current shape:

- closed native command set: `create_pty`, `start_pty`, `write_pty`, `resize_pty`, `kill_pty`, `sync_pty_sessions`, `system_command_exists`
- shell event ownership and command registration live in `src-tauri/src/shell/mod.rs`

### 4. Shell Diagnostics and Supportability

Scope:

- shell startup diagnostics
- shell-specific logs/crash hooks
- host health visibility for embedded-server startup

This domain is allowed only when the diagnostics describe shell/runtime state. Product-job and product-governance observability remain server-owned.

### 5. Optional Desktop-Only Extension Plane

Scope:

- desktop-only extensions that negotiate with native shell capabilities
- plugin sandboxing that protects the native host boundary

This domain is optional and future-facing. It is valid only when the extension model is genuinely desktop-only and does not duplicate shared business APIs.

## Business Capability Domains That Must Stay Out Of The Shell

The following capability families may appear in a generic product blueprint, but for Magic Studio V2 they are kernel-owned, not shell-owned:

### 1. File and Workspace Plane

Kernel-owned examples:

- `FileSystemService`
- `WorkspaceService`
- `FileWatcherService`
- `CacheService`

Reason:

- workspace, managed assets, and deterministic file behavior must remain equivalent between standalone server deployment and desktop-hosted deployment

### 2. Data Persistence and Migration Plane

Kernel-owned examples:

- `DatabaseService`
- `MigrationService`
- `IndexService`

Reason:

- persistence, migrations, and schema/version policy are shared business concerns, not shell-local behavior

### 3. Job, Workflow, and Media Plane

Kernel-owned examples:

- `JobService`
- `WorkflowService`
- `MediaService`
- `ToolkitService`
- `GpuAccelerationService`

Reason:

- long-running business workflows must keep one contract, one error model, and one ownership model across desktop and server deployment

### 4. Governance, Network, and Sync Plane

Kernel-owned examples:

- `PolicyService`
- `AuditService`
- `NetworkService`
- `SyncService`
- `OfflineQueueService`

Reason:

- these concerns affect product behavior, governance, and deployment semantics across host forms

## Recommended Magic Studio Shell Layout

Desktop shell code should stay close to the current Magic Studio V2 shape:

```text
src-tauri/src/
  main.rs
  embedded_server.rs
  framework/
    context.rs
    error.rs
    runtime.rs
    services/
      system.rs
      pty.rs
  shell/
    mod.rs
    pty.rs
    session.rs
    commands/
      mod.rs
      pty.rs
      system.rs
```

Rules:

- private shell implementation ownership stays under `src-tauri/src/shell/**`
- do not reintroduce sibling top-level `commands/`, `pty/`, or `session/` namespaces
- do not add `framework/services/filesystem.rs`, `media.rs`, `database.rs`, `migration.rs`, `jobs.rs`, or `toolkit.rs` to `src-tauri`

## Packaging Strategy

The shell framework should package around host-native boundaries, not around business domains:

1. `framework/` owns shell support primitives such as context, errors, blocking adapters, and shell-only services.
2. `shell/` owns the closed native command vocabulary, shell event naming, PTY/session internals, and invoke registration.
3. Canonical business domains live in Rust server crates/packages, not in Tauri shell modules.
4. Frontend packages consume shell behavior through `@sdkwork/magic-studio-core/platform` and canonical runtime helpers.

## Priority Roadmap

### P0 (Mandatory Hardening)

1. Keep the native shell command surface closed and explicitly registered in one owner.
2. Keep `AppContext` limited to shell-native services only.
3. Ensure desktop startup remains server-first: embedded server ready before business flows initialize.
4. Keep plugin access behind platform/runtime adapters instead of leaking `@tauri-apps/*` into feature packages.

### P1 (Desktop Productization)

1. Standardize desktop-only UX integrations such as tray, deep links, and native menus when the product truly needs them.
2. Add shell diagnostics that help debug embedded-server startup and PTY lifecycle without duplicating business telemetry.
3. Harden shell update/release flows without coupling them to business API ownership.

### P2 (Platform Expansion)

1. Introduce desktop-only extension hosting only if it is sandboxed and clearly separated from business APIs.
2. Add advanced device/peripheral support only when the capability is truly desktop-native and not required in standalone server deployment.

## Acceptance Criteria For A Shell-Grade Capability

A capability belongs in the desktop shell only when all of the following are true:

1. It exists because the host form is desktop.
2. Standalone server deployment does not need a parallel implementation of the same business behavior.
3. The command/event surface is small, typed, and centrally owned.
4. The owning Rust modules stay inside the shell namespace and remain auditable.
5. Frontend consumption happens through typed runtime/platform adapters rather than direct native imports.
6. The capability does not create a second owner for business routes, DTOs, policy, storage, jobs, or workflows.

If any one of these checks fails, the capability belongs in the canonical Rust server instead of the Tauri shell.

