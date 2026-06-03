# Specialized Standards

This directory stores specialized standards that refine parts of the Magic Studio V2 architecture.

The primary source of truth remains `docs/magic-studio-unified-host-api-standard.md`.

Current subordinate standards include:

- `docs/standards/magic-studio-package-standard.md`
  - canonical package naming, manifest, tsconfig, and package-tooling specialization
- `docs/standards/magic-studio-rust-server-api-standard.md`
  - canonical route-contract, DTO, and OpenAPI specialization
- `docs/standards/agi-native-contract-checklist.md`
  - supporting compliance checklist material

Rules for files in this directory:

- they must stay aligned with the unified host standard
- they must not redefine host ownership or invent a parallel backend model
- they must not reintroduce Tauri-as-backend or direct native business transport narratives
- cross-cutting architecture changes belong in the unified host standard first
