> Migrated from `docs/architect-standard-react+capacitor.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Magic Studio Historical Capacitor Standard Redirect

> **Superseded for Magic Studio V2 on 2026-04-19.**
> This file is retained only as a redirect stub to prevent architectural drift.
> Historical content was intentionally removed because Magic Studio V2 does not use a Capacitor host model.

Current source of truth:

- `docs/README.md`
- `docs/magic-studio-unified-host-api-standard.md`
- `docs/tauri-rust-framework-architecture.md`
- `docs/platform-runtime-capability-matrix.md`

Canonical decisions:

1. Magic Studio has one Rust business kernel: `packages/sdkwork-magic-studio-server/src-host`.
2. That kernel is hosted in exactly two ways: standalone server deployment and Tauri desktop shell embedding the same server.
3. Capacitor/mobile host architecture is not part of the Magic Studio V2 runtime standard.
4. Frontend product flows must target canonical Rust HTTP APIs and runtime facades, not alternate mobile-native business bridges.

