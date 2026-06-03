# Magic Studio Portal Feed Rust Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Canonicalize portal feed publishing, featured/discover retrieval, feed detail, and high-value user interactions inside the Rust host so Magic Studio exposes one stable community API surface across server deployment and desktop embedding.

**Architecture:** Build a dedicated `portal.rs` host domain inside the unified Rust business kernel instead of leaving community feed behavior in `portal-video` package services and upstream app-sdk joins. The portal domain owns durable feed storage, canonical query semantics, and interaction state, while `sdkwork-magic-studio-portal-video` remains a UI feature package that consumes `@sdkwork/magic-studio-server`.

**Tech Stack:** Rust with Axum and file-backed JSON persistence, TypeScript, canonical server contract/OpenAPI JSON, Markdown architecture docs

---

### Task 1: Lock the canonical portal boundary

**Files:**
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src-host/src/services/portal.rs`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src-host/src/routes/app/portal.rs`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src-host/src/services/app_storage.rs`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src-host/src/services/mod.rs`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src-host/src/state.rs`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src-host/src/routes/app/mod.rs`

- [ ] Keep `portal` as a first-class host-owned app family instead of a package-local service.
- [ ] Persist one canonical portal registry for authors, feeds, and interaction state.
- [ ] Standardize query semantics so featured and discover views are product concepts, not upstream endpoint leakage.

### Task 2: Implement host-owned feed lifecycle and interaction behavior

**Files:**
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src-host/src/services/portal.rs`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src-host/src/routes/app/portal.rs`

- [ ] Implement canonical publish, featured, discover, and detail reads from durable host state.
- [ ] Implement high-value interaction operations: like, unlike, collect, uncollect, share.
- [ ] Implement canonical delete governance so current-user authored feeds can be removed without package-local coupling.

### Task 3: Complete transport DTOs, route contract, and client surface

**Files:**
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-host-types/src/server-portal.ts`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-host-types/src/index.ts`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src/contract.ts`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src/client.ts`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src/index.ts`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/contracts/magic-studio-server.contract.json`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/contracts/magic-studio-server.openapi-components.json`

- [ ] Define canonical portal DTOs for feeds, authors, stats, publish input, discover/featured query, and interaction responses.
- [ ] Add route ids and client methods for every canonical portal route.
- [ ] Keep OpenAPI schemas machine-complete so portal feed becomes an auditable product API surface.

### Task 4: Migrate `portal-video` onto canonical server APIs

**Files:**
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-portal-video/src/services/portalServerMapper.ts`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-portal-video/src/services/portalVideoService.ts`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-portal-video/src/services/index.ts`
- Review: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-portal-video/src/services/portalVideoBusinessService.ts`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-portal-video/package.json`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-portal-video/src/pages/CommunityPage.tsx`

- [ ] Preserve the existing package-facing service shape for publish and gallery queries while moving transport to canonical server APIs.
- [ ] Centralize feed-to-gallery mapping so the UI package does not carry raw upstream protocol assumptions.
- [ ] Remove residual wording and dependency expectations that still describe app-sdk feed transport as the authority.

### Task 5: Sync capability metadata and architecture authority docs

**Files:**
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src-host/src/services/capabilities.rs`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/ARCHITECT.md`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/docs/magic-studio-api-capability-matrix.md`

- [ ] Promote portal feed from planned to canonical.
- [ ] Update route totals, app family counts, and execution-capability inventory after the portal routes land.
- [ ] Keep the next-stage gaps focused on provider execution depth and remaining non-portal frontend cleanup, not on portal transport ownership.

### Task 6: Run focused verification without broadening into heavy tests

**Files:**
- No additional implementation files unless verification exposes real defects.

- [ ] Run `cargo fmt --manifest-path packages/sdkwork-magic-studio-server/src-host/Cargo.toml`.
- [ ] Run `cargo check --manifest-path packages/sdkwork-magic-studio-server/src-host/Cargo.toml`.
- [ ] Run `node scripts/run-pnpm-cli.mjs --dir packages/sdkwork-magic-studio-host-types run typecheck`.
- [ ] Run `node scripts/run-pnpm-cli.mjs --dir packages/sdkwork-magic-studio-server run typecheck`.
- [ ] Run `node scripts/run-pnpm-cli.mjs --dir packages/sdkwork-magic-studio-portal-video run typecheck`.
- [ ] Parse the updated contract JSON files.
- [ ] Run `node scripts/run-pnpm-cli.mjs run check:architecture-doc-parity`.
- [ ] Run `node scripts/run-pnpm-cli.mjs run check:architecture-standards`.
