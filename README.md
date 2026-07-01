# Magic Studio V2
repository-kind: application

## Development

Prerequisites:

- Node.js
- pnpm
- Rust toolchain
- Tauri desktop prerequisites for your operating system

Install dependencies:

```bash
pnpm install
```

Run the web app:

```bash
pnpm dev
```

Run the desktop app in Tauri development mode:

```bash
pnpm tauri:dev
```

Run the local Rust server in server mode:

```bash
pnpm server:dev
```

Run the canonical Rust server verification suite:

```bash
pnpm check:server
```

## Architecture

Magic Studio V2 uses one canonical Rust business kernel at `packages/sdkwork-magic-studio-server/src-host`.

Host modes:

- `pnpm server:dev`: standalone Rust server deployment
- `pnpm tauri:dev`: Tauri desktop shell embedding the same Rust server
- `pnpm check:server`: contract, client, typecheck, and Rust host verification for the shared server-first stack
- `src-tauri` is shell-only and not a second business backend
- desktop filesystem CRUD is served by the embedded Rust HTTP contract instead of Tauri invoke commands
- browser-hosted `server` runtime resolves canonical system paths from Rust runtime summary and uses the same Rust HTTP filesystem contract as desktop
- legacy React + Tauri architecture docs remain only as redirect stubs

Current standards:

Primary source of truth:

- `docs/magic-studio-unified-host-api-standard.md`
- `docs/README.md` is the documentation entrypoint and authority map

Specialized references:

- `docs/tauri-rust-framework-architecture.md`
- `docs/platform-runtime-capability-matrix.md`
- `docs/local-media-toolkit-architecture.md`

## Build

Build the web app:

```bash
pnpm build
```

Build the desktop app without generating installers:

```bash
pnpm tauri:build
```

Build the desktop installer bundle:

```bash
pnpm tauri:bundle
```

Build the standalone Rust server:

```bash
pnpm server:build
```

Windows installer output:

```text
src-tauri/target/release/bundle/nsis/
```

## Release

This repository includes a GitHub Actions release workflow at `.github/workflows/release.yml`.

Release behavior:

- Pushing a tag like `v0.1.0` builds and publishes GitHub Release assets automatically.
- Running the workflow manually from the Actions tab publishes the current app version as `v__VERSION__`.
- The workflow builds Windows NSIS installers, Ubuntu AppImage and DEB packages, and macOS app and DMG bundles.

Recommended release flow:

```bash
git push origin main
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin v0.1.0
```

Notes:

- Keep the app version aligned in `package.json`, `src-tauri/Cargo.toml`, and `src-tauri/tauri.conf.json` before tagging.
- The GitHub Release workflow only publishes installer assets. Runtime updater metadata continues to use `https://api.sdkwork.com/app/v3/api/app/update/latest?app=magic-studio`.

## SDKWork Documentation Contract

Domain: system
Capability: component
Package type: react-tauri-app
Status: ACTIVE

### Public API

Public exports are declared in `specs/component.spec.json` under `contracts.publicExports`.

### Required SDK Surface

- None declared in `specs/component.spec.json`.

### Configuration

Configuration keys and runtime entrypoints are declared in `specs/component.spec.json`.

### SaaS/Private/Local Behavior

This module follows the canonical standards linked from `specs/component.spec.json`, including deployment and runtime configuration rules where applicable.

### Security

Do not add secrets, live tokens, manual auth headers, or app-local credential handling to this module.

### Extension Points

Extension points are limited to declared public exports, runtime entrypoints, SDK clients, events, and config keys.

### Verification

- `pnpm --filter magic-studio typecheck`

### Owner And Status

Owner and lifecycle status are tracked in `specs/component.spec.json`.

## Documentation Canon

- [docs/README.md](docs/README.md)
- [docs/product/prd/PRD.md](docs/product/prd/PRD.md)
- [docs/architecture/tech/TECH_ARCHITECTURE.md](docs/architecture/tech/TECH_ARCHITECTURE.md)
