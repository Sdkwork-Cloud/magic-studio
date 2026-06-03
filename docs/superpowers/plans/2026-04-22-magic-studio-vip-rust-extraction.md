# Magic Studio VIP Rust Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Canonicalize VIP plans, subscription status, purchase orchestration, and subscription history inside the Rust host so Magic Studio exposes a stable membership API surface across server deployment and desktop embedding.

**Architecture:** Build a dedicated `vip.rs` host domain instead of hiding membership inside frontend services or overloading trade routes. The VIP domain owns durable plan catalog and subscription lifecycle, while purchase orchestration composes with the existing host-owned trade commerce service for order and payment settlement. Frontend `magic-studio-vip` keeps its public package-facing service shape, but its data now comes from canonical `@sdkwork/magic-studio-server` APIs rather than app-sdk facades.

**Tech Stack:** Rust with Axum and file-backed JSON persistence, TypeScript, canonical server contract/OpenAPI JSON, Markdown architecture docs

---

### Task 1: Lock the VIP canonical boundary and storage shape

**Files:**
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src-host/src/services/vip.rs`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src-host/src/services/app_storage.rs`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src-host/src/services/mod.rs`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src-host/src/state.rs`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src-host/src/routes/app/vip.rs`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src-host/src/routes/app/mod.rs`

- [ ] Keep VIP as its own host business domain instead of embedding it into the trade service implementation.
- [ ] Persist one canonical VIP registry file containing plan catalog and subscription records.
- [ ] Use trade commerce only as a composed settlement dependency for purchase orchestration, not as the domain owner of subscription state.

### Task 2: Implement canonical VIP lifecycle in the Rust host

**Files:**
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src-host/src/services/vip.rs`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src-host/src/routes/app/vip.rs`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src-host/src/state.rs`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src-host/src/routes/app/mod.rs`

- [ ] Implement plan list and current-status reads from host-owned durable state.
- [ ] Implement purchase orchestration that creates a canonical trade order, initiates settlement, and activates or extends the subscription in one host-owned transaction boundary.
- [ ] Implement subscription list and cancel operations so VIP is a complete membership capability, not only a purchase button backend.

### Task 3: Complete transport DTOs, route contract, and client surface

**Files:**
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-host-types/src/server-vip.ts`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-host-types/src/index.ts`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src/contract.ts`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src/client.ts`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src/index.ts`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/contracts/magic-studio-server.contract.json`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/contracts/magic-studio-server.openapi-components.json`

- [ ] Add canonical VIP DTOs for plans, pricing options, status, subscriptions, purchase requests, and cancel requests.
- [ ] Add route ids and client methods for every canonical VIP route.
- [ ] Keep OpenAPI schemas machine-complete so the membership surface is auditable and reusable by other packages.

### Task 4: Migrate the VIP frontend package to canonical server APIs

**Files:**
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-vip/src/entities/vip.entity.ts`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-vip/src/services/vipServerMapper.ts`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-vip/src/services/vipService.ts`
- Review: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-vip/src/services/vipBusinessService.ts`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-vip/src/store/vipStore.tsx`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-vip/src/pages/PricingPage.tsx`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-vip/src/components/PaymentModal.tsx`

- [ ] Preserve the existing package-facing `getPlans` and `subscribe` API while moving the transport to canonical server APIs.
- [ ] Add canonical status hydration so the VIP page and store render real membership state on load.
- [ ] Use the payment-method selection in the purchase request instead of leaving the modal as a detached UI affordance.

### Task 5: Sync capability metadata and architecture authority docs

**Files:**
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src-host/src/services/capabilities.rs`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/ARCHITECT.md`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/docs/magic-studio-api-capability-matrix.md`

- [ ] Promote VIP from planned to canonical in the capability inventory.
- [ ] Update app family counts and route totals after the VIP routes land.
- [ ] Keep portal explicitly planned as the next remaining product-facing gateway domain after VIP.

### Task 6: Run focused verification without expanding into heavy test work

**Files:**
- No additional implementation files unless verification exposes real defects.

- [ ] Run `cargo fmt --manifest-path packages/sdkwork-magic-studio-server/src-host/Cargo.toml`.
- [ ] Run `cargo check --manifest-path packages/sdkwork-magic-studio-server/src-host/Cargo.toml`.
- [ ] Run `node scripts/run-pnpm-cli.mjs --dir packages/sdkwork-magic-studio-host-types run typecheck`.
- [ ] Run `node scripts/run-pnpm-cli.mjs --dir packages/sdkwork-magic-studio-server run typecheck`.
- [ ] Run `node scripts/run-pnpm-cli.mjs --dir packages/sdkwork-magic-studio-vip run typecheck`.
- [ ] Parse the updated contract JSON files.
- [ ] Run `node scripts/run-pnpm-cli.mjs run check:architecture-doc-parity`.
- [ ] Run `node scripts/run-pnpm-cli.mjs run check:architecture-standards`.
