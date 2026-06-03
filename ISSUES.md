# Magic Studio V2 Architecture Review

## Status

- Date: 2026-04-20
- Current architecture mode: Rust server-first, dual host delivery
- Review scope: package naming, manifest governance, runtime layering, architecture documentation authority

## Closed in the Current Baseline

1. Legacy `sdkwork-react-*` package naming has been retired in favor of `sdkwork-magic-studio-*` and `@sdkwork/magic-studio-*`.
2. Private Magic Studio workspace packages have been converged onto source-entry manifests.
3. Root `tsconfig.json` is now the canonical alias authority for Magic Studio packages.
4. Missing explicit manifest dependencies for package source imports have been corrected where discovered.
5. `magic-studio-core` server-boundary governance has been updated to reflect the real architecture:
   - it must depend on `@sdkwork/magic-studio-server`
   - it must not depend directly on `@sdkwork/magic-studio-host-core`
6. `sdkwork-magic-studio-trade` no longer carries a one-off `tsc && vite build` drift.
7. Root architecture references have been refreshed so `ARCHITECT.md` no longer describes the project as a generic React/Tauri template.
8. A dedicated non-test package audit entry now exists:
   - `pnpm run check:package-standards`
9. A dedicated runtime-boundary audit entry now exists:
   - `pnpm run check:runtime-boundaries`
10. A unified architecture-governance entry now exists:
   - `pnpm run check:architecture-standards`

## Current Architectural Findings

### Resolved in This Round

1. Documentation authority drift
   - Root `ARCHITECT.md` was outdated and no longer represented the Rust server-first architecture.
   - Resolution: the file now points at the real authority chain and summarizes current package/runtime rules.

2. DTO ownership wording drift
   - `docs/magic-studio-unified-host-api-standard.md` and `docs/standards/magic-studio-rust-server-api-standard.md` did not describe `magic-studio-types` and `magic-studio-host-types` consistently.
   - Resolution: host/runtime/server transport DTOs are now explicitly owned by `@sdkwork/magic-studio-host-types`, while broader shared business/domain contracts remain owned by `@sdkwork/magic-studio-types`.

3. Package-governance visibility gap
   - Package naming, manifest, `tsconfig`, and build policy were being enforced mostly through scattered tests and implicit knowledge.
   - Resolution: `docs/standards/magic-studio-package-standard.md` and `scripts/check-magic-studio-package-standards.mjs` now define and audit the standard directly.

4. Runtime-boundary regression risk
   - The architecture depended on convention to keep feature packages away from direct `@tauri-apps/*` imports and canonical route literals.
   - Resolution: `scripts/check-magic-studio-runtime-boundaries.mjs` now hardens that boundary as a non-test governance command.

## Active Risks to Watch

1. Historical documents still exist
   - Many historical planning and architecture files remain in the repo for traceability.
   - Mitigation: treat `docs/README.md` and `ARCHITECT.md` as the authority entrypoints and do not revive older shadow standards.

2. Legacy contract-oriented scripts still exist in parts of the workspace
   - Some packages still carry `typecheck:contract`.
   - Current stance: do not expand that surface during package-standard work; keep package architecture focused on naming, layering, manifests, and runtime boundaries.

3. Full workspace closure is intentionally not claimed here
   - This review round standardized architecture and package governance.
   - It did not attempt to force a full-repo typecheck/build closure across every package and every historical workflow.

## Canonical Commands

```bash
pnpm run check:architecture-standards
pnpm run check:package-standards
pnpm run check:runtime-boundaries
pnpm run check:server
```

Use the first command as the default non-test architecture gate, the second for package-governance focus, the third for frontend runtime-boundary focus, and the fourth for the Rust server host/runtime boundary.
