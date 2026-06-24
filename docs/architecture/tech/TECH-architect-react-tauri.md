> Migrated from `docs/architect-react+tauri.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Magic Studio Historical Architecture Redirect

> **Superseded for Magic Studio V2 on 2026-04-19.**
> This file is retained only as a redirect stub to prevent architectural drift.
> Historical content was intentionally removed because Magic Studio V2 now has one canonical architecture standard.

Current source of truth:

- `docs/README.md`
- `docs/magic-studio-unified-host-api-standard.md`
- `docs/tauri-rust-framework-architecture.md`
- `docs/platform-runtime-capability-matrix.md`
- `docs/local-media-toolkit-architecture.md`

Canonical decisions:

1. Magic Studio has one Rust business kernel: `packages/sdkwork-magic-studio-server/src-host`.
2. That kernel is hosted in exactly two ways: standalone server deployment and Tauri desktop shell embedding the same server.
3. `src-tauri` is a shell-only host layer, not a second business backend.
4. Frontend product flows must target canonical Rust HTTP APIs and runtime facades, not ad hoc Tauri business invoke commands.

