# Magic Studio Trade Commerce Rust Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Canonicalize trade orders, payments, wallet, and transaction history inside the Rust host so Magic Studio exposes a complete trade `app` API surface across server deployment and desktop embedding.

**Architecture:** Keep the trade domain split by subdomain instead of growing one oversized service. The existing marketplace task slice stays in `trade.rs`, while order/payment/wallet/transaction lifecycle moves into a focused `trade_commerce.rs` service backed by app-owned durable storage under the same trade root. Frontend `orderService` and `paymentService` keep their public method names but stop calling app SDK facades directly; they consume canonical `@sdkwork/magic-studio-server` APIs and map transport DTOs into existing trade package entities.

**Tech Stack:** Rust with Axum and file-backed JSON persistence, TypeScript, canonical server contract/OpenAPI JSON, Markdown architecture docs

---

### Task 1: Lock the trade commerce API boundary and file responsibilities

**Files:**
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src-host/src/services/trade_commerce.rs`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src-host/src/services/app_storage.rs`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src-host/src/services/mod.rs`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src-host/src/state.rs`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src-host/src/routes/app/trade_commerce.rs`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src-host/src/routes/app/mod.rs`

- [ ] Keep marketplace and commerce as separate host services so the trade domain stays composable.
- [ ] Use one durable commerce registry file under the trade root for orders, payments, wallets, and transactions.
- [ ] Keep `app` routes user-scoped by default instead of inventing redundant `/mine` routes unless a true second scope exists.

### Task 2: Implement canonical Rust host trade commerce lifecycle

**Files:**
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src-host/src/services/trade_commerce.rs`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src-host/src/routes/app/trade_commerce.rs`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src-host/src/state.rs`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src-host/src/routes/app/mod.rs`

- [ ] Implement current-user order list/read/create/status-update/cancel/delete/statistics flows.
- [ ] Implement payment initiation, payment read/list, refund, recharge, callback simulation, wallet read, and transaction list flows.
- [ ] Keep payment/order state transitions coherent: payment success drives order progression, refund drives payment/order refund states, and callback simulation stays host-owned instead of UI faking state changes.

### Task 3: Complete transport DTOs, contract exports, and OpenAPI schemas

**Files:**
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-host-types/src/server-trade.ts`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-host-types/src/index.ts`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src/contract.ts`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src/client.ts`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src/index.ts`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/contracts/magic-studio-server.contract.json`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/contracts/magic-studio-server.openapi-components.json`

- [ ] Add canonical trade commerce DTOs for orders, statistics, payments, wallet, transactions, and mutation requests.
- [ ] Add route ids and client methods for every new trade commerce route.
- [ ] Keep OpenAPI components machine-complete so the trade surface is fully generated and auditable.

### Task 4: Migrate the trade package from SDK facades to canonical server APIs

**Files:**
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-trade/src/services/orderService.ts`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-trade/src/services/paymentService.ts`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-trade/src/services/tradeCommerceMapper.ts`
- Review: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-trade/src/services/tradeBusinessService.ts`
- Review: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-trade/src/components/Payment/PaymentDialog.tsx`

- [ ] Preserve the current public service API so hooks and UI consumers do not need a second migration.
- [ ] Replace direct app SDK order/payment/account/wallet calls with canonical runtime server client calls.
- [ ] Centralize DTO-to-entity mapping and normalize legacy helper semantics such as `getMyOrderList`, `getMyPaymentList`, and `queryPaymentStatus` on top of the canonical routes.

### Task 5: Sync capability metadata and authority docs

**Files:**
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-magic-studio-server/src-host/src/services/capabilities.rs`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/ARCHITECT.md`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/docs/magic-studio-api-capability-matrix.md`

- [ ] Update trade route totals and family counts after the commerce routes land.
- [ ] Promote the remaining trade order/payment/wallet surface from planned to canonical.
- [ ] Keep future trade gaps explicit only if a real subdomain still remains outside the host after this extraction.

### Task 6: Run focused verification without expanding into heavy test work

**Files:**
- No additional implementation files unless verification exposes real defects.

- [ ] Run `cargo fmt --manifest-path packages/sdkwork-magic-studio-server/src-host/Cargo.toml`.
- [ ] Run `cargo check --manifest-path packages/sdkwork-magic-studio-server/src-host/Cargo.toml`.
- [ ] Run `node scripts/run-pnpm-cli.mjs --dir packages/sdkwork-magic-studio-host-types run typecheck`.
- [ ] Run `node scripts/run-pnpm-cli.mjs --dir packages/sdkwork-magic-studio-server run typecheck`.
- [ ] Run `node scripts/run-pnpm-cli.mjs --dir packages/sdkwork-magic-studio-trade run typecheck`.
- [ ] Parse the updated contract JSON files.
- [ ] Run `node scripts/run-pnpm-cli.mjs run check:architecture-doc-parity`.
- [ ] Run `node scripts/run-pnpm-cli.mjs run check:architecture-standards`.
