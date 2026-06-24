> Migrated from `docs/standards/magic-studio-authority-matrix.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Magic Studio Authority Matrix

## Status

This document is the canonical cross-document authority summary for Magic Studio V2 as of 2026-04-20.

Use it to verify ownership boundaries across host/runtime/API/package standards before introducing new package responsibilities, shell capabilities, or shared DTO contracts.

## Kernel and Host Matrix

| Area | Canonical Authority | Must Not Drift To |
| --- | --- | --- |
| Business capability kernel | `packages/sdkwork-magic-studio-server/src-host` | `src-tauri`, frontend feature packages |
| Host modes | standalone server deployment; embedded desktop host started by Tauri during native startup | parallel desktop-only business backends |
| Runtime kinds | `web`, `server`, `desktop` | ad hoc runtime string unions in downstream packages |
| Host families | browser-hosted: `web`, `server`; desktop shell: `desktop` | `web`-only browser assumptions |

## Foundation Package Authority

| Authority | Owns | Must Not Own |
| --- | --- | --- |
| `@sdkwork/magic-studio-host-types` | host/runtime/server transport DTOs, discovery/governance envelopes, toolkit/server request-response shapes | shared cross-feature product DTOs, canonical route path authority |
| `@sdkwork/magic-studio-host-core` | host discovery, base URL derivation, connection resolution | canonical health/docs/openapi/route-catalog/runtime-summary path authority, product DTO ownership |
| `@sdkwork/magic-studio-server` | canonical route contract facade, route/base-path/version authority, Rust build entry, contract metadata projections | broad shared host transport DTO families, broader cross-domain business DTO ownership |
| `@sdkwork/magic-studio-types` | shared domain/entity/pagination/service-result/resource contracts, asset references, runtime-neutral product vocabulary | canonical route prefixes, published API version constants, surface/base-path authority |
| `@sdkwork/magic-studio-core` | runtime orchestration, platform abstraction, storage topology, canonical server client integration | canonical server route authority, direct desktop-native business command transport |
| `@sdkwork/magic-studio-commons` | shared UI, focused helper subpaths, explicit non-root utility and algorithm entrypoints | entity/service-result/pagination/resource ownership, broad domain-contract authority |
| `src-tauri` | shell-only host bootstrap, PTY/session lifecycle, window/dialog/notification/updater shell integration, closed native shell command/event vocabulary | product backend capability kernels, business media/compression/database/migration/job/governance transports |

## Canonical Import Authority

Rules:

- Foundation and low-level feature code must prefer focused public subpaths over broad root facades.
- `@sdkwork/magic-studio-types/<domain>` is the canonical owner map for low-level TypeScript contract imports.
- `@sdkwork/magic-studio-commons` low-level utility imports must use focused entrypoints such as `utils/helpers`, `utils/logger`, `utils/assetIdentity`, `utils/serviceAdapter`, and explicit non-root algorithm subpaths.
- Cross-package imports must use published package facades or focused public subpaths, never sibling `../other-package/src/*` paths.

## Desktop Shell Boundary

Allowed shell-only authority in `src-tauri`:

- PTY/session lifecycle
- shell command existence checks
- window/app/bootstrap wiring
- dialogs, notifications, clipboard, opener, updater, and related native shell affordances

Forbidden business authority in `src-tauri`:

- media processing
- compression
- database access
- migrations
- jobs
- toolkit orchestration
- deployment/governance APIs
- policy APIs that belong to the canonical Rust server

## Governance Commands

Run:

```bash
pnpm run check:architecture-standards
pnpm run check:architecture-doc-parity
pnpm run check:package-standards
pnpm run check:runtime-boundaries
pnpm run check:types-alias-parity
pnpm run check:types-import-boundaries
```

These commands are the non-test governance baseline for package standards, runtime boundaries, focused-import enforcement, alias parity, and architecture authority doc consistency.

