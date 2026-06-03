# Magic Studio Typed Media Jobs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify asynchronous toolkit jobs with the new typed media vocabulary so the Rust server exposes one canonical media language for both synchronous routes and job execution.

**Architecture:** Keep the existing `/api/core/v1/jobs` surface but replace legacy ad hoc media job variants with typed `video/*` and `audio/*` job operations that mirror the synchronous media request DTOs. Move shared ffmpeg request handling into `MediaService` controlled methods so routes and jobs reuse the same validation and command construction logic instead of maintaining parallel media semantics.

**Tech Stack:** TypeScript, Node.js test runner, Rust, Axum, Serde, Tokio, ffmpeg/ffprobe

---

### Task 1: Lock the new job vocabulary with failing tests

**Files:**
- Modify: `packages/sdkwork-magic-studio-server/src/client.test.ts`
- Modify: `packages/sdkwork-magic-studio-core/src/platform/toolkit/__tests__/jobClient.test.ts`
- Modify: `packages/sdkwork-magic-studio-server/src-host/src/lib.rs`

- [ ] **Step 1: Write a failing TypeScript client test**

Assert that `submitToolkitJob()` can submit a typed media job such as `videoTranscode` with the same field names as the synchronous media request DTO.

- [ ] **Step 2: Write a failing frontend job client test**

Assert that `ToolkitJobClient.submitToolkitJob()` sends the canonical `/api/core/v1/jobs` payload with a typed media operation and no legacy ad hoc operation names.

- [ ] **Step 3: Write failing Rust route tests**

Add one test that submits a typed `videoTranscode` operation and expects `200`, and one test that submits the legacy `transcodeVideoH264` operation and expects request rejection.

- [ ] **Step 4: Run the targeted tests and verify failure**

Run:
- `node --test --experimental-test-isolation=none packages/sdkwork-magic-studio-server/src/client.test.ts packages/sdkwork-magic-studio-core/src/platform/toolkit/__tests__/jobClient.test.ts`
- `CARGO_NET_OFFLINE=true cargo test --manifest-path packages/sdkwork-magic-studio-server/src-host/Cargo.toml`

Expected:
- node tests fail because the client/job client types and payloads do not yet use the new operation vocabulary
- Rust tests fail because the job route still accepts only the legacy media operation enum

### Task 2: Replace legacy media job operations at the API boundary

**Files:**
- Modify: `packages/sdkwork-magic-studio-server/src/client.ts`
- Modify: `packages/sdkwork-magic-studio-server/src-host/src/services/toolkit.rs`
- Modify: `packages/sdkwork-magic-studio-server/src-host/src/services/jobs.rs`

- [ ] **Step 1: Replace the legacy TypeScript media job union**

Remove:
- `transcodeVideoH264`
- `extractAudioWav`
- `mergeVideoAndAudio`

Add:
- `videoTranscode`
- `videoTrim`
- `videoExtractAudio`
- `videoThumbnail`
- `audioConvert`
- `audioNormalize`
- `audioMix`

Reuse the existing typed media request DTO field names directly.

- [ ] **Step 2: Replace the Rust media job enum variants**

Mirror the new TypeScript operation vocabulary and field names in the Rust `ToolkitOperation` enum.

- [ ] **Step 3: Update job snapshot operation naming**

Ensure `JobSnapshot.operation` and `ToolkitOperationResult.operation` report the new canonical names.

### Task 3: Remove duplicated media command construction from async jobs

**Files:**
- Modify: `packages/sdkwork-magic-studio-server/src-host/src/services/media.rs`
- Modify: `packages/sdkwork-magic-studio-server/src-host/src/services/toolkit.rs`

- [ ] **Step 1: Add controlled typed media execution methods to `MediaService`**

Expose controlled variants of the typed media operations so job execution can reuse the same validation and ffmpeg argument construction already used by synchronous routes.

- [ ] **Step 2: Refactor toolkit job execution to call `MediaService`**

Replace the old job-specific ffmpeg arg builders for media transformation jobs with calls into the typed controlled media methods plus shared progress reporting.

- [ ] **Step 3: Keep non-media toolkit jobs focused**

Leave `probeMedia`, `resizeImage`, `zipAssets`, `recordAudio`, and `recordScreen` intact unless required by this refactor.

### Task 4: Verify the unified standard

**Files:**
- Verify only

- [ ] **Step 1: Re-run the targeted node tests**

Run:
- `node --test --experimental-test-isolation=none packages/sdkwork-magic-studio-server/src/client.test.ts packages/sdkwork-magic-studio-core/src/platform/toolkit/__tests__/jobClient.test.ts`

Expected: PASS

- [ ] **Step 2: Re-run the Rust tests**

Run:
- `CARGO_NET_OFFLINE=true cargo test --manifest-path packages/sdkwork-magic-studio-server/src-host/Cargo.toml`

Expected: PASS

- [ ] **Step 3: Re-run the broader server-first regression slice**

Run:
- `node --test --experimental-test-isolation=none tests/magicStudioServerContractParity.node.test.mjs packages/sdkwork-magic-studio-host-core/src/discovery.test.ts packages/sdkwork-magic-studio-server/src/client.test.ts packages/sdkwork-magic-studio-core/src/platform/toolkit/__tests__/policyClient.test.ts packages/sdkwork-magic-studio-core/src/platform/toolkit/__tests__/migrationClient.test.ts packages/sdkwork-magic-studio-core/src/platform/toolkit/__tests__/jobClient.test.ts packages/sdkwork-magic-studio-core/src/platform/toolkit/__tests__/createPlatformToolKit.server.test.ts`
- `CARGO_NET_OFFLINE=true cargo test --manifest-path packages/sdkwork-magic-studio-server/src-host/Cargo.toml`

Expected: PASS

- [ ] **Step 4: Review for remaining job/media vocabulary drift**

Confirm that the public async job API no longer exposes the legacy media operation names and that synchronous and asynchronous media execution now speak one canonical language.
