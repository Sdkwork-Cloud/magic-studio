# Magic Studio Trade Marketplace Rust Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the trade task marketplace into the canonical Rust host so server deployment and desktop embedding consume one durable `app` API instead of package-local browser storage.

**Architecture:** Keep the scope narrow and correct. This slice covers only trade marketplace tasks under `/api/app/v1/trade/tasks/*`, with Rust-owned persistence under app storage, shared transport DTOs in `@sdkwork/magic-studio-host-types`, and frontend consumption through `@sdkwork/magic-studio-server`. Trade orders, payments, and wallet remain outside this slice and stay explicitly non-canonical until separately extracted.

**Tech Stack:** Rust with Axum and file-backed JSON storage, TypeScript, canonical server contract/OpenAPI JSON, Markdown architecture docs

---

### Task 1: Stabilize the Rust host marketplace service and route wiring

**Files:**
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src-host/src/services/trade.rs`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src-host/src/services/app_storage.rs`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src-host/src/services/mod.rs`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src-host/src/state.rs`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src-host/src/routes/app/trade.rs`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src-host/src/routes/app/mod.rs`

- [ ] Ensure the trade marketplace service compiles cleanly and owns seed, read, accept, submit, approve, and cancel flows.
- [ ] Keep all marketplace persistence under app-owned Rust storage, not `localStorage`, not desktop-only commands.
- [ ] Verify route ids, contract route lookup, and path mounting stay aligned with the canonical `app` surface.

### Task 2: Complete shared transport types, contract exports, and OpenAPI schema

**Files:**
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-host-types/src/server-trade.ts`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-host-types/src/index.ts`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src/contract.ts`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src/client.ts`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src/index.ts`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/contracts/magic-studio-server.contract.json`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/contracts/magic-studio-server.openapi-components.json`

- [ ] Export one complete trade marketplace contract surface for list/read/accept/submit/approve/cancel.
- [ ] Add missing OpenAPI component schemas so the contract is machine-complete instead of route-only.
- [ ] Keep DTO naming product-specific and transport-specific under the `MagicStudioTrade*` namespace.

### Task 3: Migrate the trade package to the canonical server client

**Files:**
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-trade/src/services/taskService.ts`
- Optional Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-trade/src/services/tradeTaskMapper.ts`
- Optional Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-trade/src/services/tradeServerClient.ts`
- Review: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-trade/src/entities/index.ts`
- Review: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-trade/src/services/tradeBusinessService.ts`

- [ ] Preserve the existing task service public API so package consumers do not need a second refactor.
- [ ] Replace package-local persistence with canonical `@sdkwork/magic-studio-server` client calls.
- [ ] Centralize DTO-to-entity mapping so trade UI state is shaped once and stays consistent.

### Task 4: Sync capability metadata and architecture authority docs

**Files:**
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src-host/src/services/capabilities.rs`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/ARCHITECT.md`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/docs/magic-studio-api-capability-matrix.md`

- [ ] Mark the trade marketplace task slice as canonical while leaving trade orders/payments/wallet explicitly deferred.
- [ ] Update route totals and family counts after the eight marketplace routes land in the contract.
- [ ] Remove any architecture finding that still describes trade task persistence as package-local once the migration is complete.

### Task 5: Run focused verification without expanding into heavy test work

**Files:**
- No additional implementation files unless verification exposes real defects.

- [ ] Run `cargo fmt --manifest-path packages/sdkwork-magic-studio-server/src-host/Cargo.toml`.
- [ ] Run `cargo check --manifest-path packages/sdkwork-magic-studio-server/src-host/Cargo.toml`.
- [ ] Run `node scripts/run-pnpm-cli.mjs --dir packages/sdkwork-magic-studio-host-types run typecheck`.
- [ ] Run `node scripts/run-pnpm-cli.mjs --dir packages/sdkwork-magic-studio-server run typecheck`.
- [ ] Run `node scripts/run-pnpm-cli.mjs --dir packages/sdkwork-magic-studio-trade run typecheck`.
- [ ] Run `node scripts/run-pnpm-cli.mjs run check:architecture-doc-parity`.
- [ ] Run `node scripts/run-pnpm-cli.mjs run check:architecture-standards`.
