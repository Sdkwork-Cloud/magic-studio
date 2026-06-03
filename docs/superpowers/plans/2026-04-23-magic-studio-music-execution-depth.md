# Magic Studio Music Execution Depth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Promote canonical `generation/music` from partial execution depth to a real Rust-host music workflow where `create`, `similar`, `remix`, and `extend` all execute through the same provider-backed adapter in both standalone server and desktop embedding.

**Architecture:** Keep the public route family unchanged and deepen execution only behind the existing canonical host surface. `generation.rs` remains the product-facing orchestration layer, `execution.rs` remains the only provider adapter boundary, and `capabilities.rs` remains the single truth source for operation-level readiness consumed by both browser-hosted server mode and desktop mode.

**Tech Stack:** Rust, Axum, file-backed task persistence, `sdkwork-ai-sdk` generated client, Markdown architecture docs

---

### Task 1: Normalize the canonical music workflow contract inside the Rust host

**Files:**
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src-host/src/services/generation.rs`

- [ ] Keep `POST /api/app/v1/generation/music/tasks`, `/similar`, `/remix`, and `/extend` as the only public entrypoints.
- [ ] Add shared host-side prompt and reference normalization so music workflows are self-describing instead of lifecycle-only placeholders.
- [ ] Preserve one canonical task registry and one canonical task/read model for all music modes.

### Task 2: Deepen the provider adapter instead of introducing a parallel workflow path

**Files:**
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src-host/src/services/execution.rs`

- [ ] Extend the music execution request so reference-driven workflows can pass canonical source audio into the generated AI SDK.
- [ ] Reuse the existing `generate_music(...)` adapter path for similar/remix/extend instead of inventing operation-specific transport clients.
- [ ] Keep failures honest when the upstream adapter rejects a workflow or source reference.

### Task 3: Align runtime capability truth with the new backend reality

**Files:**
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src-host/src/services/capabilities.rs`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/docs/magic-studio-unified-host-api-standard.md`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/docs/magic-studio-api-capability-matrix.md`

- [ ] Mark `music-generation` operation readiness per operation, not with stale lifecycle-only wording.
- [ ] Update the architecture standard so music is documented as a fully host-executed family when the adapter is configured.
- [ ] Update the API capability matrix so the remaining execution-depth gaps are narrowed to the still-unsupported families only.

### Task 4: Run focused verification without expanding into broad test work

**Files:**
- No new implementation files unless verification exposes a defect.

- [ ] Run `cargo fmt --manifest-path packages/sdkwork-magic-studio-server/src-host/Cargo.toml`.
- [ ] Run `cargo check --manifest-path packages/sdkwork-magic-studio-server/src-host/Cargo.toml`.
- [ ] Run `C:\\nvm4w\\nodejs\\node.exe scripts\\run-pnpm-cli.mjs run check:architecture-standards`.
