# Release Documentation

This directory stores versioning notes, release records, distribution checklists, and publishing history.

It is not the canonical source of truth for Magic Studio V2 runtime, host, API, storage, or desktop-shell architecture.

Current canonical standards:

- `docs/magic-studio-unified-host-api-standard.md`
- `docs/tauri-rust-framework-architecture.md`
- `docs/platform-runtime-capability-matrix.md`
- `docs/local-media-toolkit-architecture.md`

Use files in `docs/release/` only for:

- version history
- release notes
- packaging and publishing records
- rollout checklists tied to a specific release

Keep version and packaging metadata aligned across release artifacts, but do not let release notes redefine architecture.
