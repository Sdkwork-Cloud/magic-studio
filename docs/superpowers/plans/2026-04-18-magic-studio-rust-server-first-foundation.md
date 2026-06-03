# Magic Studio Rust Server-First Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first production-grade Rust server-first foundation for Magic Studio with a single-source contract, standardized HTTP responses, and frontend host discovery plus initial HTTP clients.

**Architecture:** The server contract becomes a shared JSON source consumed by TypeScript and Rust. The Rust host is split into config, contract, response, route, and service modules, while frontend host-core resolves the canonical local server descriptor and initial clients use HTTP instead of the native bridge.

**Tech Stack:** TypeScript, Node.js test runner, Vitest, Rust, Axum, Tokio, Serde

---

### Task 1: Save the canonical design and execution plan

**Files:**
- Create: `docs/superpowers/specs/2026-04-18-magic-studio-rust-server-first-design.md`
- Create: `docs/superpowers/plans/2026-04-18-magic-studio-rust-server-first-foundation.md`

- [ ] **Step 1: Write the design and plan documents**

Record the approved Rust server-first standard, scope, and task breakdown.

- [ ] **Step 2: Keep the implementation aligned to the plan**

Use this plan as the source of truth for the remaining tasks.

### Task 2: Lock contract parity with failing tests

**Files:**
- Create: `tests/magicStudioServerContractParity.node.test.mjs`
- Modify: `packages/sdkwork-magic-studio-server/src-host/src/lib.rs`

- [ ] **Step 1: Write the failing node-side contract parity test**

Assert that:
- a canonical contract JSON file exists
- TypeScript server source consumes the contract JSON
- Rust server source consumes the contract JSON
- Rust runtime registers `/docs`, `/api/app/v1/plugins`, `/api/admin/v1/deployments`

- [ ] **Step 2: Run the node test to verify it fails**

Run: `node --test tests/magicStudioServerContractParity.node.test.mjs`
Expected: FAIL because the contract JSON and new route wiring do not exist yet.

- [ ] **Step 3: Implement the single-source contract and route registration**

Create the JSON contract, refactor TS and Rust to consume it, and register the missing runtime routes.

- [ ] **Step 4: Re-run the node test**

Run: `node --test tests/magicStudioServerContractParity.node.test.mjs`
Expected: PASS

### Task 3: Harden the Rust host with standardized responses

**Files:**
- Create: `packages/sdkwork-magic-studio-server/src-host/src/config.rs`
- Create: `packages/sdkwork-magic-studio-server/src-host/src/contract.rs`
- Create: `packages/sdkwork-magic-studio-server/src-host/src/response.rs`
- Create: `packages/sdkwork-magic-studio-server/src-host/src/routes/mod.rs`
- Create: `packages/sdkwork-magic-studio-server/src-host/src/routes/core.rs`
- Create: `packages/sdkwork-magic-studio-server/src-host/src/routes/app.rs`
- Create: `packages/sdkwork-magic-studio-server/src-host/src/routes/admin.rs`
- Create: `packages/sdkwork-magic-studio-server/src-host/src/routes/docs.rs`
- Create: `packages/sdkwork-magic-studio-server/src-host/src/state.rs`
- Modify: `packages/sdkwork-magic-studio-server/src-host/src/lib.rs`
- Modify: `packages/sdkwork-magic-studio-server/src-host/src/main.rs`
- Modify: `packages/sdkwork-magic-studio-server/src-host/Cargo.toml`

- [ ] **Step 1: Add Rust route tests for docs, app, and admin routes**

Write tests that request:
- `/docs`
- `/api/app/v1/plugins`
- `/api/admin/v1/deployments`

- [ ] **Step 2: Run the Rust tests to verify they fail**

Run: `cargo test --manifest-path packages/sdkwork-magic-studio-server/src-host/Cargo.toml`
Expected: FAIL because the new routes and modules are not implemented yet.

- [ ] **Step 3: Implement modular host config, state, contract loading, and standard envelopes**

Use route modules and typed response helpers. Ensure startup summary prints `docs`, `openapi`, and `routes`.

- [ ] **Step 4: Re-run the Rust tests**

Run: `cargo test --manifest-path packages/sdkwork-magic-studio-server/src-host/Cargo.toml`
Expected: PASS

### Task 4: Add policy and migration HTTP capability

**Files:**
- Create: `packages/sdkwork-magic-studio-server/src-host/src/services/mod.rs`
- Create: `packages/sdkwork-magic-studio-server/src-host/src/services/policy.rs`
- Create: `packages/sdkwork-magic-studio-server/src-host/src/services/migration.rs`
- Modify: `packages/sdkwork-magic-studio-server/contracts/magic-studio-server.contract.json`
- Modify: `packages/sdkwork-magic-studio-server/src/index.ts`
- Modify: `packages/sdkwork-magic-studio-server/src-host/src/routes/core.rs`

- [ ] **Step 1: Write failing Rust tests for policy and migration HTTP routes**

Cover:
- `GET /api/core/v1/policy/snapshot`
- `POST /api/core/v1/policy/validate-command`
- `POST /api/core/v1/migrations/status`

- [ ] **Step 2: Run the Rust tests to verify they fail**

Run: `cargo test --manifest-path packages/sdkwork-magic-studio-server/src-host/Cargo.toml`
Expected: FAIL because these endpoints are not implemented yet.

- [ ] **Step 3: Implement policy and migration services and connect them to HTTP routes**

Return standard envelopes and problem responses.

- [ ] **Step 4: Re-run the Rust tests**

Run: `cargo test --manifest-path packages/sdkwork-magic-studio-server/src-host/Cargo.toml`
Expected: PASS

### Task 5: Add host discovery and the typed server client

**Files:**
- Create: `packages/sdkwork-magic-studio-host-core/src/discovery.ts`
- Create: `packages/sdkwork-magic-studio-server/src/client.ts`
- Modify: `packages/sdkwork-magic-studio-host-core/src/index.ts`
- Modify: `packages/sdkwork-magic-studio-host-types/src/host.ts`
- Modify: `packages/sdkwork-magic-studio-host-types/src/server-api.ts`

- [ ] **Step 1: Write failing TypeScript tests for host discovery and server client**

Create tests that verify:
- desktop defaults to `http://127.0.0.1:4318`
- server mode can derive same-origin descriptors
- server client builds the canonical route URLs correctly

- [ ] **Step 2: Run the targeted Vitest files and verify failure**

Run: `node ./node_modules/vitest/vitest.mjs run packages/sdkwork-magic-studio-host-core/src/discovery.test.ts packages/sdkwork-magic-studio-server/src/client.test.ts`
Expected: FAIL because the modules do not exist yet.

- [ ] **Step 3: Implement host discovery and the typed client**

Expose typed helpers for `healthz`, `openapi`, `route catalog`, `runtime summary`, `policy`, and `migration`.

- [ ] **Step 4: Re-run the targeted Vitest files**

Run: `node ./node_modules/vitest/vitest.mjs run packages/sdkwork-magic-studio-host-core/src/discovery.test.ts packages/sdkwork-magic-studio-server/src/client.test.ts`
Expected: PASS

### Task 6: Move initial frontend clients to HTTP

**Files:**
- Modify: `packages/sdkwork-magic-studio-core/package.json`
- Modify: `packages/sdkwork-magic-studio-core/src/platform/toolkit/policyClient.ts`
- Modify: `packages/sdkwork-magic-studio-core/src/platform/toolkit/migrationClient.ts`
- Modify: `src/app/bootstrap.ts`
- Modify: `src/app/global.d.ts`

- [ ] **Step 1: Write failing tests for policy and migration clients using the local server contract**

Cover:
- client support detection without native bridge dependency
- correct local route usage
- error handling through problem envelopes

- [ ] **Step 2: Run the targeted tests to verify failure**

Run: `node ./node_modules/vitest/vitest.mjs run packages/sdkwork-magic-studio-core/src/platform/toolkit/policyClient.test.ts packages/sdkwork-magic-studio-core/src/platform/toolkit/migrationClient.test.ts`
Expected: FAIL because the clients still depend on `bridge.invoke`.

- [ ] **Step 3: Refactor the clients to use the typed server client and host discovery**

Initialize the resolved host descriptor during bootstrap and expose it for shared runtime consumption.

- [ ] **Step 4: Re-run the targeted tests**

Run: `node ./node_modules/vitest/vitest.mjs run packages/sdkwork-magic-studio-core/src/platform/toolkit/policyClient.test.ts packages/sdkwork-magic-studio-core/src/platform/toolkit/migrationClient.test.ts`
Expected: PASS

### Task 7: Final verification

**Files:**
- Verify only

- [ ] **Step 1: Run the targeted node, Vitest, and Rust verification commands**

Run:
- `node --test tests/magicStudioServerContractParity.node.test.mjs`
- `node ./node_modules/vitest/vitest.mjs run packages/sdkwork-magic-studio-host-core/src/discovery.test.ts packages/sdkwork-magic-studio-server/src/client.test.ts packages/sdkwork-magic-studio-core/src/platform/toolkit/policyClient.test.ts packages/sdkwork-magic-studio-core/src/platform/toolkit/migrationClient.test.ts`
- `cargo test --manifest-path packages/sdkwork-magic-studio-server/src-host/Cargo.toml`

Expected:
- node contract test passes
- all targeted Vitest files pass
- Rust tests pass

- [ ] **Step 2: Run package typechecks for the touched TS packages**

Run:
- `pnpm --dir packages/sdkwork-magic-studio-host-core exec tsc --noEmit`
- `pnpm --dir packages/sdkwork-magic-studio-server exec tsc --noEmit`
- `pnpm --dir packages/sdkwork-magic-studio-core exec tsc --noEmit`

Expected: PASS
