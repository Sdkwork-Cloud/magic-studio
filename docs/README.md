# Magic Studio V2 Documentation Index

This file defines the documentation authority model for Magic Studio V2.

If documents disagree, follow them in this order:

1. `docs/magic-studio-unified-host-api-standard.md`
2. `docs/standards/magic-studio-package-standard.md`
3. `docs/standards/magic-studio-rust-server-api-standard.md`
4. `docs/tauri-rust-framework-architecture.md`
5. `docs/platform-runtime-capability-matrix.md`
6. `docs/local-media-toolkit-architecture.md`

Magic Studio V2 is standardized around one canonical Rust business kernel at `packages/sdkwork-magic-studio-server/src-host` and exactly two host modes:

- standalone server deployment
- Tauri desktop shell embedding the same Rust server

`src-tauri` remains a shell-only host layer and is not a second backend.

## Current Canonical Standards

- `docs/magic-studio-unified-host-api-standard.md`
  - Primary source of truth for host, runtime, backend, API, storage, and shell-boundary architecture.
- `docs/tauri-rust-framework-architecture.md`
  - Desktop-shell specialization of the canonical host model.
- `docs/standards/magic-studio-package-standard.md`
  - Canonical naming, manifest, tsconfig, and package-tooling standard for `packages/`.
- `docs/platform-runtime-capability-matrix.md`
  - Runtime capability exposure and browser-hosted vs desktop-shell classification rules.
- `docs/local-media-toolkit-architecture.md`
  - Media, toolkit, workspace, and local-first specialization on top of the same Rust kernel.
- `docs/standards/magic-studio-rust-server-api-standard.md`
  - Route-contract, DTO, and OpenAPI specialization under the unified host standard.

Any document not listed in this section is non-authoritative by default and must not override the canonical standards.

## Supporting Top-Level References

- `docs/00-technology-stack-versions.md`
  - Supporting stack/version reference. Subordinate to the canonical host standard.
- `docs/framework-standard-architecture.md`
  - Package-boundary and framework specialization.
- `docs/package-routing-system.md`
  - Canonical route registry specialization.
- `docs/asset-center-unified-architecture.md`
  - Asset-center architecture specialization.
- `docs/asset-center-high-standard-spec.md`
  - Asset-center governance and storage specialization.
- `docs/asset-center-business-migration.md`
  - Migration and rollout reference. Not a primary architecture authority.
- `docs/asset-center-package-plan.md`
  - Package ownership and rollout reference. Not a primary architecture authority.
- `docs/agi-native-unified-application-standard.md`
  - Product-level business unification goals subordinate to canonical host/runtime standards.
- `docs/tauri-industry-desktop-capability-blueprint.md`
  - Desktop-shell capability reference subordinate to the canonical shell boundary.

## Supporting Directories

- `docs/standards/`
  - Specialized subordinate standards. These refine the canonical model and must not redefine it.
- `docs/release/`
  - Release/versioning/process material. It does not override runtime or architecture standards.
- `docs/review/`
  - Review findings, blocker analysis, and remediation evidence. Advisory, not authoritative architecture.
- `docs/plans/`
  - Working plans and rollout material. Useful for execution context, not for architecture authority.
- `docs/superpowers/`
  - Spec and plan artifacts from guided implementation workflows.

## Historical Directories

These directories are retained for traceability but are not the current source of truth:

- `docs/架构/`
- `docs/step/`
- `docs/reports/`

Use them only for historical reasoning, archived rollout context, and past audit evidence.

## Superseded Documents

The following files remain only as redirect stubs and must not act as shadow standards:

- `docs/architect-standard-react+backend.md`
- `docs/architect-react+capacitor.md`
- `docs/architect-react+tauri.md`
- `docs/architect-standard-react+capacitor.md`
- `docs/architect-react+tauri copy.md`
- `docs/architect-standard-react+tauri.md`

## Maintenance Rule

When architecture changes:

1. Update `docs/magic-studio-unified-host-api-standard.md` first if the change affects host ownership, runtime classification, API taxonomy, storage, or shell boundaries.
2. Update `docs/standards/magic-studio-package-standard.md` if the change affects package naming, manifests, build/typecheck policy, or tsconfig inheritance rules.
3. Update specialized standards only after the canonical rule is clear.
4. Update boundary tests or audit scripts that lock the documentation authority model.
