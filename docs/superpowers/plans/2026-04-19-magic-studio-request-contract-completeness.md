# Magic Studio Request Contract Completeness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the Rust server-first API standard so every body-bearing route has one canonical shared request DTO, one canonical OpenAPI request-body schema, and one consistent TypeScript client signature.

**Architecture:** Keep `packages/sdkwork-magic-studio-server/contracts/magic-studio-server.contract.json` as the canonical route metadata source, extend it with `requestBodySchema`, and promote all reusable request/response DTOs into `@sdkwork/magic-studio-host-types`. Treat the low-level server client as a strict HTTP contract adapter that accepts request objects only, while higher-level toolkit helpers remain free to expose ergonomic wrappers.

**Tech Stack:** TypeScript, Node.js test runner, Rust, Axum, Serde, Cargo, JSON OpenAPI artifacts

---

### Task 1: Lock the request-body completeness contract with failing tests

**Files:**
- Modify: `tests/magicStudioServerSharedDtoBoundary.node.test.mjs`
- Modify: `tests/magicStudioServerOpenApiSchema.node.test.mjs`

- [ ] **Step 1: Add shared DTO boundary assertions**

Assert that policy validation requests, media/compression/sql requests, migration requests, toolkit operations, and job submissions are exported from `@sdkwork/magic-studio-host-types` and no longer owned by `packages/sdkwork-magic-studio-server/src/client.ts`.

- [ ] **Step 2: Add OpenAPI route metadata assertions**

Assert that every body-bearing canonical route now declares `requestBodySchema` and the expected typed success envelope.

- [ ] **Step 3: Run the targeted node tests and verify failure**

Run:
- `node --test tests/magicStudioServerSharedDtoBoundary.node.test.mjs`
- `node --test tests/magicStudioServerOpenApiSchema.node.test.mjs`

Expected:
- the shared DTO test fails because request DTOs are still locally owned
- the OpenAPI schema test fails because route metadata and generated OpenAPI lack `requestBodySchema`

### Task 2: Move shared request and operation DTOs into `@sdkwork/magic-studio-host-types`

**Files:**
- Create: `packages/sdkwork-magic-studio-host-types/src/server-toolkit.ts`
- Modify: `packages/sdkwork-magic-studio-host-types/src/server-governance.ts`
- Modify: `packages/sdkwork-magic-studio-host-types/src/server-api.ts`
- Modify: `packages/sdkwork-magic-studio-host-types/src/index.ts`
- Modify: `packages/sdkwork-magic-studio-server/src/index.ts`

- [ ] **Step 1: Add toolkit/media/compression/sql DTO ownership**

Create `server-toolkit.ts` for media request/result types, compression/sql request/result types, toolkit operations, and toolkit job submission payloads.

- [ ] **Step 2: Add governance request DTO ownership**

Add dedicated policy validation and migration request interfaces to `server-governance.ts`.

- [ ] **Step 3: Extend route metadata typing**

Add optional `requestBodySchema` to `MagicStudioApiContractRoute`.

- [ ] **Step 4: Re-export the canonical DTO surface**

Expose the new shared DTOs from both the shared types package root and the server package root.

### Task 3: Make the low-level server client strictly request-object based

**Files:**
- Modify: `packages/sdkwork-magic-studio-server/src/client.ts`
- Modify: `packages/sdkwork-magic-studio-server/src/client.test.ts`

- [ ] **Step 1: Remove local DTO ownership from `client.ts`**

Import all shared request/response DTOs from `@sdkwork/magic-studio-host-types` and delete local duplicates.

- [ ] **Step 2: Replace positional body-route arguments**

Change media, compression, sqlite, migration, policy, and job submission methods to accept a single request object matching the HTTP body.

- [ ] **Step 3: Update the client test surface**

Assert the same HTTP payloads are sent while the TypeScript API now uses canonical request objects.

### Task 4: Generate complete request-body metadata in both TypeScript and Rust

**Files:**
- Modify: `packages/sdkwork-magic-studio-server/contracts/magic-studio-server.contract.json`
- Modify: `packages/sdkwork-magic-studio-server/contracts/magic-studio-server.openapi-components.json`
- Modify: `packages/sdkwork-magic-studio-server/src/contract.ts`
- Modify: `packages/sdkwork-magic-studio-server/src-host/src/contract.rs`
- Modify: `packages/sdkwork-magic-studio-server/src-host/src/lib.rs`
- Modify: `docs/standards/magic-studio-rust-server-api-standard.md`

- [ ] **Step 1: Add canonical `requestBodySchema` metadata**

Annotate every body-bearing route in the contract JSON with the shared request schema name.

- [ ] **Step 2: Add missing schema components**

Define all request/result/envelope schemas required by the new contract metadata.

- [ ] **Step 3: Generate OpenAPI request bodies**

Teach both the TypeScript and Rust OpenAPI generators to emit `requestBody` refs from `requestBodySchema`.

- [ ] **Step 4: Update the written standard**

Document that body routes must use shared DTO ownership plus `requestBodySchema` and request-object client signatures.

### Task 5: Update downstream consumers and verify the full slice

**Files:**
- Modify: `packages/sdkwork-magic-studio-core/src/platform/toolkit/createPlatformToolKit.ts`
- Modify: `packages/sdkwork-magic-studio-core/src/platform/toolkit/migrationClient.ts`
- Modify: `packages/sdkwork-magic-studio-core/src/platform/toolkit/jobClient.ts`
- Modify: `packages/sdkwork-magic-studio-core/src/platform/toolkit/__tests__/migrationClient.test.ts`
- Modify: `packages/sdkwork-magic-studio-core/src/platform/toolkit/__tests__/jobClient.test.ts`
- Modify: `packages/sdkwork-magic-studio-core/src/platform/toolkit/__tests__/createPlatformToolKit.server.test.ts`

- [ ] **Step 1: Update toolkit consumers to the new low-level request API**

Wrap body payloads into request objects while preserving the higher-level toolkit ergonomics.

- [ ] **Step 2: Re-run the targeted tests**

Run:
- `node --test tests/magicStudioServerSharedDtoBoundary.node.test.mjs`
- `node --test tests/magicStudioServerOpenApiSchema.node.test.mjs`
- `node --test packages/sdkwork-magic-studio-server/src/client.test.ts`
- `node --test packages/sdkwork-magic-studio-core/src/platform/toolkit/__tests__/migrationClient.test.ts`
- `node --test packages/sdkwork-magic-studio-core/src/platform/toolkit/__tests__/jobClient.test.ts`
- `node --test packages/sdkwork-magic-studio-core/src/platform/toolkit/__tests__/createPlatformToolKit.server.test.ts`

Expected: PASS

- [ ] **Step 3: Re-run package and Rust verification**

Run:
- `node scripts/run-pnpm-cli.mjs --dir packages/sdkwork-magic-studio-server run typecheck`
- `cargo test --manifest-path packages/sdkwork-magic-studio-server/src-host/Cargo.toml`
- `node scripts/run-pnpm-cli.mjs run check:server`
- `node scripts/run-pnpm-cli.mjs run test:node`
- `node scripts/run-app-build.mjs`

Expected: PASS

- [ ] **Step 4: Review for remaining standard drift**

Confirm the Rust server contract, OpenAPI output, TypeScript client, and frontend consumers all describe the same request and response shapes with no local DTO forks.
