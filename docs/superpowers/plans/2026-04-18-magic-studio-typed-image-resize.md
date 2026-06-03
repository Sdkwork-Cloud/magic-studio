# Magic Studio Typed Image Resize Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Promote image resize into the canonical typed media API so synchronous routes and asynchronous jobs share one resource-first image vocabulary and one Rust service implementation path.

**Architecture:** Add a canonical `/api/core/v1/media/image/resize` route and a shared `ImageResizeRequest` DTO owned by `MediaService`. Rename the async job operation from `resizeImage` to `imageResize`, and route both sync and async flows through the same typed service methods.

**Tech Stack:** TypeScript, Node.js test runner, Rust, Axum, Serde, Tokio, ffmpeg

---

### Task 1: Lock the typed image standard with failing tests

**Files:**
- Modify: `tests/magicStudioServerContractParity.node.test.mjs`
- Modify: `packages/sdkwork-magic-studio-server/src/client.test.ts`
- Modify: `packages/sdkwork-magic-studio-core/src/platform/toolkit/__tests__/jobClient.test.ts`
- Modify: `packages/sdkwork-magic-studio-server/src-host/src/lib.rs`

- [ ] **Step 1: Require the canonical image resize route**

Add `/api/core/v1/media/image/resize` to the contract parity test.

- [ ] **Step 2: Add failing TypeScript client expectations**

Assert that:

- `createMagicStudioServerClient()` exposes `mediaImageResize()`
- the client targets `/api/core/v1/media/image/resize`
- the public job vocabulary contains `imageResize`
- the public job vocabulary no longer contains `resizeImage`

- [ ] **Step 3: Add failing frontend job client coverage**

Submit an `imageResize` job through `ToolkitJobClient` and assert the exact canonical payload.

- [ ] **Step 4: Add failing Rust route tests**

Cover:

- `/api/core/v1/media/image/resize` is publicly wired
- a job with `kind: "imageResize"` is accepted
- a job with `kind: "resizeImage"` is rejected

- [ ] **Step 5: Run RED verification**

Run:

```powershell
node --test --experimental-test-isolation=none tests/magicStudioServerContractParity.node.test.mjs packages/sdkwork-magic-studio-server/src/client.test.ts packages/sdkwork-magic-studio-core/src/platform/toolkit/__tests__/jobClient.test.ts
```

Run:

```powershell
CARGO_NET_OFFLINE=true cargo test --manifest-path packages/sdkwork-magic-studio-server/src-host/Cargo.toml
```

Expected: tests fail because the typed image route/client/job vocabulary does not exist yet.

### Task 2: Add the canonical typed image contract and client surface

**Files:**
- Modify: `packages/sdkwork-magic-studio-server/contracts/magic-studio-server.contract.json`
- Modify: `packages/sdkwork-magic-studio-server/src/contract.ts`
- Modify: `packages/sdkwork-magic-studio-server/src/client.ts`

- [ ] **Step 1: Add the route to the canonical contract**

Add `POST /api/core/v1/media/image/resize` to the JSON contract.

- [ ] **Step 2: Add the TypeScript request DTO**

Define `MagicStudioMediaImageResizeRequest` using canonical `inputPath` and `outputPath` field names.

- [ ] **Step 3: Add the TypeScript client method**

Expose `mediaImageResize(payload)` and remove legacy `resizeImage` job vocabulary in favor of `imageResize`.

- [ ] **Step 4: Re-run client-focused tests**

Run the Node command from Task 1 and confirm failures move to remaining Rust implementation gaps only.

### Task 3: Move image resize into typed Rust media services and routes

**Files:**
- Modify: `packages/sdkwork-magic-studio-server/src-host/src/services/media.rs`
- Modify: `packages/sdkwork-magic-studio-server/src-host/src/routes/core.rs`
- Modify: `packages/sdkwork-magic-studio-server/src-host/src/lib.rs`

- [ ] **Step 1: Add `ImageResizeRequest` to `MediaService`**

Introduce typed sync and controlled methods for image resize.

- [ ] **Step 2: Register the public route**

Add `media_image_resize()` route handling through the canonical contract-derived path.

- [ ] **Step 3: Keep validation inside `MediaService`**

Ensure width/height/path validation and ffmpeg arg construction live in `MediaService`, not in route handlers.

- [ ] **Step 4: Run Rust tests**

Run:

```powershell
CARGO_NET_OFFLINE=true cargo test --manifest-path packages/sdkwork-magic-studio-server/src-host/Cargo.toml
```

Expected: route and service regressions pass.

### Task 4: Standardize async jobs to `imageResize`

**Files:**
- Modify: `packages/sdkwork-magic-studio-server/src-host/src/services/toolkit.rs`
- Modify: `packages/sdkwork-magic-studio-server/src-host/src/services/jobs.rs`

- [ ] **Step 1: Rename the toolkit operation**

Replace `ResizeImage` with `ImageResize` using `inputPath`, `outputPath`, `width`, `height`, and optional `overwrite`.

- [ ] **Step 2: Delegate image resize jobs to `MediaService`**

Remove direct image resize ffmpeg arg construction from `ToolkitService` and call the new typed media methods with progress reporting.

- [ ] **Step 3: Update job operation naming**

Ensure snapshots/results now report `imageResize`.

- [ ] **Step 4: Re-run Node and Rust tests**

Run the same Node and Rust commands from Task 1.

Expected: PASS

### Task 5: Broader regression and residual review

**Files:**
- Verify only

- [ ] **Step 1: Run the broader server-first regression slice**

Run:

```powershell
node --test --experimental-test-isolation=none tests/magicStudioServerContractParity.node.test.mjs packages/sdkwork-magic-studio-host-core/src/discovery.test.ts packages/sdkwork-magic-studio-server/src/client.test.ts packages/sdkwork-magic-studio-core/src/platform/toolkit/__tests__/policyClient.test.ts packages/sdkwork-magic-studio-core/src/platform/toolkit/__tests__/migrationClient.test.ts packages/sdkwork-magic-studio-core/src/platform/toolkit/__tests__/jobClient.test.ts packages/sdkwork-magic-studio-core/src/platform/toolkit/__tests__/createPlatformToolKit.server.test.ts
```

- [ ] **Step 2: Run Rust verification again**

Run:

```powershell
CARGO_NET_OFFLINE=true cargo test --manifest-path packages/sdkwork-magic-studio-server/src-host/Cargo.toml
```

- [ ] **Step 3: Review remaining media-standard debt**

Reassess whether the public `ffmpeg` inspection namespace should also be renamed or internalized now that typed image resize joins the canonical media family.
