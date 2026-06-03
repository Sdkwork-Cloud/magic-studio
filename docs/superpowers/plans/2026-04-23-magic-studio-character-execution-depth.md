# Magic Studio Character Execution Depth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Promote canonical `generation/characters` from lifecycle-only task registration into a real Rust-host execution path that produces character image artifacts through the existing canonical image adapter, with no new route family and no desktop/server divergence.

**Architecture:** Keep `generation/characters` as a product-facing character domain while mapping its create operation onto the existing provider-backed image execution kernel inside the Rust host. `generation.rs` owns character prompt normalization and task semantics, `execution.rs` remains the only provider adapter boundary, and `capabilities.rs` remains the canonical runtime truth source for both standalone server and embedded desktop delivery.

**Tech Stack:** Rust, Axum, file-backed task persistence, canonical image execution adapter, Markdown architecture docs

---

### Task 1: Normalize character create requests into one host-owned execution recipe

**Files:**
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src-host/src/services/generation.rs`

- [ ] Keep `POST /api/app/v1/generation/characters/tasks` as the only public create route.
- [ ] Compose a canonical character-image prompt from prompt, description, archetype, gender, outfit, avatar mode, and appearance traits.
- [ ] Preserve the existing character task/list/read/cancel model so frontend contracts do not split.

### Task 2: Reuse the canonical image adapter instead of creating a special character transport

**Files:**
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src-host/src/services/generation.rs`

- [ ] Execute character creation through `generate_image(...)` with character-owned mode and reference inputs.
- [ ] Keep avatar references and aspect ratio mapped into the canonical image request shape.
- [ ] Keep failures honest when the image adapter is unavailable or the upstream request fails.

### Task 3: Update capability truth and architecture docs

**Files:**
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src-host/src/services/capabilities.rs`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/docs/magic-studio-unified-host-api-standard.md`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/docs/magic-studio-api-capability-matrix.md`

- [ ] Mark character create readiness according to the real backend state.
- [ ] Document character generation as a canonical host-executed operation backed by the shared image adapter.
- [ ] Shrink the remaining execution-depth gap list accordingly.

### Task 4: Run focused verification only

**Files:**
- No new implementation files unless verification exposes a real defect.

- [ ] Run `cargo fmt --manifest-path packages/sdkwork-magic-studio-server/src-host/Cargo.toml`.
- [ ] Run `cargo check --manifest-path packages/sdkwork-magic-studio-server/src-host/Cargo.toml`.
- [ ] Run `C:\\nvm4w\\nodejs\\node.exe scripts\\run-pnpm-cli.mjs run check:architecture-standards`.
