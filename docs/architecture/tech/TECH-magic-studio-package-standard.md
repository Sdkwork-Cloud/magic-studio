> Migrated from `docs/standards/magic-studio-package-standard.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Magic Studio Package Standard

## Status

This document is the canonical package-governance standard for Magic Studio V2 as of 2026-04-20.

If package architecture guidance conflicts with a broader host/runtime rule, follow `docs/magic-studio-unified-host-api-standard.md` first.

For a concise ownership summary across package, server, and shell boundaries, use `docs/standards/magic-studio-authority-matrix.md`.

## Goal

Keep Magic Studio package ownership, naming, manifests, workspace aliases, and build tooling aligned across:

- standalone server delivery
- desktop delivery
- shared frontend package development

This document exists so package structure is governed by one explicit standard instead of ad hoc conventions.

## Non-Negotiable Decisions

1. `packages/` is the canonical implementation area for shared Magic Studio code.
2. Package naming is product-specific. Legacy `sdkwork-react-*` naming is retired.
3. Private workspace packages use source-entry manifests.
4. Root `tsconfig.json` is the only canonical alias authority for Magic Studio packages.
5. Package typecheck uses the repo wrapper `scripts/run-package-typecheck.mjs`.
6. Package standards are enforced by `pnpm run check:package-standards`.

## Canonical Package Taxonomy

### Runtime and API Foundation

- `@sdkwork/magic-studio-host-types`
  - owns host/runtime/server transport contracts, discovery DTOs, envelopes, toolkit DTOs, plugin manifest types, and server-facing request/response shapes
- `@sdkwork/magic-studio-host-core`
  - owns host discovery, runtime host descriptor resolution, and connection/base URL derivation
- `@sdkwork/magic-studio-server`
  - owns the canonical server contract facade and the Rust kernel build entry
- `@sdkwork/magic-studio-types`
  - owns cross-domain business DTOs, entity identity, service result contracts, pagination, asset references, storage/resource contracts, and shared product vocabulary
- `@sdkwork/magic-studio-core`
  - owns runtime orchestration, platform abstraction, SDK bootstrap, storage topology, and server-client integration
- `@sdkwork/magic-studio-commons`
  - owns shared UI and focused low-level helper subpaths

### Product Capability Packages

Business capabilities live in `@sdkwork/magic-studio-*` feature packages such as:

- `audio`
- `browser`
- `canvas`
- `chat`
- `drive`
- `editor`
- `film`
- `image`
- `magiccut`
- `music`
- `notes`
- `plugins`
- `prompt`
- `trade`
- `video`
- `workspace`

Each package must have one clear responsibility. Cross-package sharing belongs in the foundation packages, not by coupling feature packages to each other arbitrarily.

## Naming Rules

### Directory Names

Canonical directory format:

```text
packages/sdkwork-magic-studio-<module>
```

Rules:

- lowercase only
- hyphen-separated
- one bounded module per package
- no `sdkwork-react-*` directories

### Package Names

Canonical manifest format:

```text
@sdkwork/magic-studio-<module>
```

Rules:

- directory name and `package.json#name` must match exactly
- new Magic Studio packages must not use `@sdkwork/react-*`
- vendor workspace packages such as `retired generic app SDK` and `@sdkwork/sdk-common` are out of scope for the product naming rule

## Manifest Rules

### Private Workspace Packages

Private `@sdkwork/magic-studio-*` packages must use source-entry manifests:

- `main`: `./src/index.ts` or `./src/index.tsx`
- `module`: `./src/index.ts` or `./src/index.tsx`
- `types`: `./src/index.ts` or `./src/index.tsx`
- `exports["."].import`: `./src/index.ts` or `./src/index.tsx`
- `exports["."].types`: `./src/index.ts` or `./src/index.tsx`

Additional rules:

- subpath exports for private packages must not drift to `./dist/*`
- `files` must include `src`, `dist`, and `README.md`
- internal package dependencies must use `workspace:*`

### Published Workspace Exception

`@sdkwork/magic-studio-prompt` is the current published exception:

- root `import` and `types` still resolve through `src`
- `require` may target `./dist/index.cjs`
- `./styles` may target `./dist/style.css`

No other Magic Studio package should invent new packaging exceptions without explicit architecture review.

## TypeScript Rules

Each Magic Studio package `tsconfig.json` must:

- `extends: "../../tsconfig.json"`
- not redefine `compilerOptions.baseUrl`
- not redefine `compilerOptions.paths`
- set `noUnusedLocals: false`
- set `noUnusedParameters: false`

This keeps package typecheck focused on type correctness and preserves one repo-wide alias authority.

SDK-mode projections must mirror the canonical `@sdkwork/magic-studio-types` alias surface:

- `tsconfig.npm-sdk.json`
- `tsconfig.git-sdk.json`

Those files are not separate authorities. They are required projections of the root alias standard so build mode switches do not silently change package resolution behavior.

## Script Rules

### Canonical Typecheck

All Magic Studio packages use:

```text
node ../../scripts/run-package-typecheck.mjs tsconfig.json
```

The wrapper is the canonical verification boundary. When a package pins a narrow `compilerOptions.rootDir` but the repo-wide alias graph resolves source files outside that package subtree, the wrapper must widen `rootDir` for the `--noEmit` typecheck run to the shared source-graph ancestor instead of forcing package-local `tsconfig` churn.

If a package still has `typecheck:contract`, it must use:

```text
node ../../scripts/run-package-typecheck.mjs tsconfig.contract.json
```

### Canonical Build Classes

Default private source-entry package build:

```text
vite build
```

Approved exceptions:

- `@sdkwork/magic-studio-distribution`
  - `node ../../scripts/run-package-typecheck.mjs tsconfig.json`
- `@sdkwork/magic-studio-host-core`
  - `node ../../scripts/run-package-typecheck.mjs tsconfig.json`
- `@sdkwork/magic-studio-host-types`
  - `node ../../scripts/run-package-typecheck.mjs tsconfig.json`
- `@sdkwork/magic-studio-server`
  - `node ../../scripts/run-magic-studio-server-build.mjs`
- `@sdkwork/magic-studio-types`
  - `node ../../scripts/run-package-typecheck.mjs tsconfig.json && vite build`

No package should use raw `tsc && vite build` as a private-package special case.

## Dependency Boundary Rules

1. `@sdkwork/magic-studio-host-core` may depend on `@sdkwork/magic-studio-host-types`, but not on feature packages.
2. `@sdkwork/magic-studio-server` may depend on `host-core` and `host-types`, but frontend packages must consume it through the published package facade rather than sibling source paths.
3. `@sdkwork/magic-studio-core` depends on `@sdkwork/magic-studio-server` as the canonical server facade and must not depend directly on `@sdkwork/magic-studio-host-core`.
4. `@sdkwork/magic-studio-types` and `@sdkwork/magic-studio-host-types` are different owners:
   - `types` is product-domain/shared contract authority
   - `host-types` is host/runtime/server transport authority
5. Package source code must not deep-import sibling package internals such as `../../other-package/src/*`.
6. Low-level runtime and domain code must import focused `@sdkwork/magic-studio-types/<domain>` subpaths instead of the root `@sdkwork/magic-studio-types` facade.
7. The current enforced focused-import scope is:
   - `@sdkwork/magic-studio-core`: `src/ai`, `src/platform`, `src/runtime`, `src/services`, `src/storage`, `src/sdk`
   - `@sdkwork/magic-studio-commons`: `src`
   - `@sdkwork/magic-studio-magiccut`: `src`
   - `@sdkwork/magic-studio-chatppt`: `src/store`, `src/services`
   - `@sdkwork/magic-studio-canvas`: `src/entities`, `src/services`, `src/store`, `src/utils`
   - `@sdkwork/magic-studio-browser`: `src/services`
   - `@sdkwork/magic-studio-editor`: `src/services`
   - `@sdkwork/magic-studio-drive`: `src`
   - `@sdkwork/magic-studio-settings`: `src/data`, `src/services`
   - `@sdkwork/magic-studio-notifications`: `src`
   - `@sdkwork/magic-studio-prompt`: `src/services`, `src/store`
   - `@sdkwork/magic-studio-notes`: `src`
   - `@sdkwork/magic-studio-portal-video`: `src`
   - `@sdkwork/magic-studio-film`: `src`

## Review Findings Closed By This Standard

1. Legacy `sdkwork-react-*` package naming drifted away from the Magic Studio product identity.
2. Source-entry manifests were becoming inconsistent across private packages.
3. Package-local TypeScript alias overrides drifted away from the root workspace authority.
4. One-off build scripts such as `tsc && vite build` were creating avoidable package-tooling drift.
5. DTO ownership between `magic-studio-types` and `magic-studio-host-types` was easy to misstate without a dedicated package standard.

## Audit Command

Run:

```bash
pnpm run check:architecture-standards
pnpm run check:architecture-doc-parity
pnpm run check:package-standards
pnpm run check:types-alias-parity
pnpm run check:types-import-boundaries
```

`check:architecture-standards` is the default non-test governance gate. `check:package-standards` is the narrower package-only audit.

Those audits protect:

- package naming
- manifest source-entry rules
- tsconfig inheritance rules
- canonical build/typecheck scripts
- architecture authority doc parity for focused-import governance
- legacy `sdkwork-react-*` naming regression detection
- `@sdkwork/magic-studio-types` alias parity across root/sdk tsconfig projections and Vite
- low-level `@sdkwork/magic-studio-types` root-facade regression detection

Related runtime-boundary governance command:

```bash
pnpm run check:runtime-boundaries
```

That command protects the cross-host architecture by rejecting:

- direct `@tauri-apps/*` imports outside the canonical core desktop runtime layer
- canonical API route literals outside `@sdkwork/magic-studio-server`

