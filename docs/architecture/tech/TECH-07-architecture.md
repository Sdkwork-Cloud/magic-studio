> Migrated from `docs/架构/07-桌面运行时与本地能力架构.md` on 2026-06-24.
> Owner: SDKWork maintainers

# 07. Desktop Runtime And Local Capability Architecture

## 1. Goal

Desktop delivery exists to host the canonical Rust server and expose a very small native shell surface.

The desktop runtime is successful only if:

- product behavior still flows through the canonical Rust HTTP server
- the native shell remains minimal, explicit, and auditable
- desktop and standalone server deployment keep the same business contract

## 2. Canonical Model

There are only two host forms for the business kernel:

1. standalone Rust server deployment
2. desktop shell embedding the same Rust server at startup

There is not a separate desktop business backend.

## 3. Current Desktop Host Shape

The current `src-tauri/src` structure is:

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

This structure is intentional:

- `main.rs` bootstraps the shell host
- `embedded_server.rs` starts the canonical Rust HTTP server
- `framework/` contains shell-only host support
- `shell/` contains the entire native shell namespace

Top-level `commands`, `pty`, `session`, `fs`, or `platform` Rust modules must not be reintroduced.

## 4. Shell-Only Native Surface

The active native command surface is intentionally closed:

- `create_pty`
- `start_pty`
- `write_pty`
- `resize_pty`
- `kill_pty`
- `sync_pty_sessions`
- `system_command_exists`

That surface is owned by `src-tauri/src/shell/mod.rs`.

The same shell namespace also owns:

- PTY shell event naming
- command module registration
- PTY/session private state

## 5. What Desktop Owns

Desktop shell ownership is limited to native host concerns:

- app/window lifecycle
- desktop plugins such as dialog, notification, clipboard, updater, opener
- PTY lifecycle
- shell command existence checks
- embedded server startup

These are shell concerns because they only exist due to the native host form.

## 6. What Desktop Does Not Own

Desktop shell must not own product/business implementations for:

- filesystem business transport
- media processing
- compression
- database
- migrations
- jobs
- toolkit orchestration
- deployment/governance APIs
- policy APIs for product behavior

Those capabilities belong to `packages/sdkwork-magic-studio-server/src-host` and must be exposed through the canonical HTTP contract.

## 7. AppContext Standard

`AppContext::default()` is shell-only. It wires exactly:

1. `SystemService`
2. `PtyService`

If `AppContext` starts growing filesystem, media, compression, database, migration, job, or toolkit services again, the architecture has regressed.

## 8. Desktop Startup Flow

The required startup sequence is:

1. Tauri initializes native shell plugins.
2. `embedded_server::start_embedded_magic_studio_server()` starts the canonical Rust server.
3. The shell registers only the closed native shell command set.
4. Frontend runtime initialization waits for canonical server readiness before enabling server-backed capabilities.

This guarantees one business transport model instead of separate desktop and server behavior.

## 9. Frontend Consumption Rules

Frontend code running on desktop must use:

- `getPlatformRuntime()` for runtime capabilities
- `@sdkwork/magic-studio-server` for canonical server discovery and client contracts
- focused facades layered on top of those primitives

Frontend code must not use:

- direct `@tauri-apps/*` imports in feature packages
- ad hoc invoke command strings
- handwritten shell event strings
- Tauri native commands as a fallback business transport

## 10. Governance Rules

Desktop shell architecture remains correct only if these rules stay enforced:

- native shell command names are centrally owned
- shell event names are centrally owned
- runtime kind vocabulary is centrally owned
- public app platform vocabulary is centrally owned
- package runtime dependencies match actual source imports
- architecture docs describe the current shell-only host shape instead of legacy business-service layouts

## 11. Review Checklist

Before accepting a desktop-runtime change, verify:

1. Does this capability belong only to the native shell form?
2. If the same capability is needed in standalone server deployment, why is it not in the Rust server kernel?
3. Does the change expand the native command surface?
4. Does it create a second vocabulary owner for commands, events, runtime kinds, or public platform names?
5. Does it make the shell less replaceable or less auditable?

If the answer to any of these questions is bad, the change is architectural debt.

## 12. Required End State

The required desktop architecture standard is:

- desktop is a thin shell
- Rust server is the canonical business kernel
- API ownership stays server-first
- native shell surface stays small
- runtime and platform vocabulary stay centralized
- desktop and server deployment remain behaviorally equivalent for business capabilities

That is the target to preserve.

