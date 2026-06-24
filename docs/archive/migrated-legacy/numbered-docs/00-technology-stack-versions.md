# Magic Studio V2 Technology Stack Reference

## Authority

This document is a supporting technology-stack reference subordinate to:

- `docs/README.md`
- `docs/magic-studio-unified-host-api-standard.md`
- `docs/tauri-rust-framework-architecture.md`

It does not redefine host ownership, API boundaries, or shell-only capability rules.

## Delivery Model

Magic Studio V2 is standardized around:

- one React frontend workspace
- one canonical Rust business kernel at `packages/sdkwork-magic-studio-server/src-host`
- one standalone server deployment mode
- one Tauri desktop shell embedding the same Rust server

Capacitor/mobile host architecture is not part of the active Magic Studio V2 stack.

## Workspace and Tooling

| Area | Version / Value | Source |
| --- | --- | --- |
| App version | `0.1.1` | `package.json`, `src-tauri/Cargo.toml` |
| Package manager | `pnpm@10.30.2` | `package.json` |
| Monorepo task runner | `turbo@^2.9.3` | `package.json` |
| Node test runner | built-in `node --test` for focused boundary checks | repo scripts/tests |

## Frontend Runtime Stack

| Technology | Version | Source |
| --- | --- | --- |
| React | `^19.2.4` | `pnpm-workspace.yaml` catalog |
| React DOM | `^19.2.4` | `pnpm-workspace.yaml` catalog |
| TypeScript | `^6.0.2` | `pnpm-workspace.yaml` catalog |
| Vite | `^8.0.3` | `pnpm-workspace.yaml` catalog |
| Zustand | `^5.0.12` | `pnpm-workspace.yaml` catalog |
| Tailwind CSS | `^4.2.2` | `pnpm-workspace.yaml` catalog |
| Vitest | `^4.1.2` | `package.json` |

## Desktop Shell Stack

| Technology | Version | Source |
| --- | --- | --- |
| Tauri CLI / JS API baseline | `^2.10.1` | `pnpm-workspace.yaml` catalog |
| Rust `tauri` crate | `2.10.3` | `src-tauri/Cargo.toml` |
| `tauri-build` | `2.5.6` | `src-tauri/Cargo.toml` |
| Desktop updater plugin | `2.10.0` | `src-tauri/Cargo.toml` |
| Desktop shell log plugin | `2.8.0` | `src-tauri/Cargo.toml` |

## Rust Server Kernel Stack

| Technology | Version | Source |
| --- | --- | --- |
| Rust edition | `2021` | `src-tauri/Cargo.toml` |
| Tokio | `1` | `src-tauri/Cargo.toml` |
| Serde | `1.0` | `src-tauri/Cargo.toml` |
| rusqlite | `0.39` with `bundled` | `src-tauri/Cargo.toml` |
| portable-pty | `0.9.0` | `src-tauri/Cargo.toml` |
| zip | `8.5` | `src-tauri/Cargo.toml` |

## Canonical Implementation Packages

- Frontend app shell: `src/`
- Desktop shell host: `src-tauri/`
- Canonical Rust server host: `packages/sdkwork-magic-studio-server/src-host/`
- Typed server contract facade: `packages/sdkwork-magic-studio-server/src/`
- Shared platform/runtime surface: `packages/sdkwork-magic-studio-core/src/platform/`

## Maintenance Rules

1. Update this document only after the underlying manifest files or canonical standards change.
2. If package manifests and this document disagree, the manifests win until the document is refreshed.
3. Do not add Capacitor/mobile versions here unless Magic Studio V2 formally adopts that host model.
