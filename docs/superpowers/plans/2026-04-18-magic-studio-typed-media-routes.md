# Magic Studio Typed Media Routes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the remaining frontend-built common ffmpeg commands with canonical Rust server typed media APIs so server-first media processing becomes the standard path.

**Architecture:** The canonical contract JSON remains the single route source of truth. TypeScript clients resolve route paths from the contract facade, Rust route handlers stay thin and delegate command construction plus validation to `MediaService`, and frontend toolkit server branches consume only typed media client methods for common operations while `ffmpeg/exec` remains an explicitly low-level escape hatch.

**Tech Stack:** TypeScript, Node.js test runner, Rust, Axum, Serde, ffmpeg/ffprobe

---

### Task 1: Lock the typed media API surface with failing tests

**Files:**
- Modify: `tests/magicStudioServerContractParity.node.test.mjs`
- Modify: `packages/sdkwork-magic-studio-server/src/client.test.ts`
- Modify: `packages/sdkwork-magic-studio-core/src/platform/toolkit/__tests__/createPlatformToolKit.server.test.ts`
- Modify: `packages/sdkwork-magic-studio-server/src-host/src/lib.rs`

- [ ] **Step 1: Extend the node contract parity test**

Assert that the canonical contract contains:
- `POST /api/core/v1/media/video/transcode`
- `POST /api/core/v1/media/video/trim`
- `POST /api/core/v1/media/video/extract-audio`
- `POST /api/core/v1/media/video/thumbnail`
- `POST /api/core/v1/media/audio/convert`
- `POST /api/core/v1/media/audio/normalize`
- `POST /api/core/v1/media/audio/mix`

- [ ] **Step 2: Extend the TypeScript client test**

Add expectations that the client targets the canonical typed media routes above instead of building these requests through `/media/ffmpeg/exec`.

- [ ] **Step 3: Extend the frontend server-mode toolkit test**

Add assertions that:
- `toolkit.video.transcode(...)`
- `toolkit.video.trim(...)`
- `toolkit.video.extractAudio(...)`
- `toolkit.video.createThumbnail(...)`
- `toolkit.audio.convert(...)`
- `toolkit.audio.normalize(...)`
- `toolkit.audio.mix(...)`

use the typed server routes with structured JSON payloads.

- [ ] **Step 4: Extend the Rust route test suite**

Add route-wiring tests that hit each new endpoint with intentionally invalid payloads and verify `400` responses.

- [ ] **Step 5: Run the targeted tests and verify failure**

Run:
- `node --test --experimental-test-isolation=none tests/magicStudioServerContractParity.node.test.mjs packages/sdkwork-magic-studio-server/src/client.test.ts packages/sdkwork-magic-studio-core/src/platform/toolkit/__tests__/createPlatformToolKit.server.test.ts`
- `CARGO_NET_OFFLINE=true cargo test --manifest-path packages/sdkwork-magic-studio-server/src-host/Cargo.toml`

Expected:
- node tests fail because the contract, client, and toolkit do not support the typed routes yet
- Rust tests fail because the typed routes are not wired yet

### Task 2: Add canonical contract paths and typed TypeScript client methods

**Files:**
- Modify: `packages/sdkwork-magic-studio-server/contracts/magic-studio-server.contract.json`
- Modify: `packages/sdkwork-magic-studio-server/src/contract.ts`
- Modify: `packages/sdkwork-magic-studio-server/src/client.ts`

- [ ] **Step 1: Add the typed media routes to the canonical contract**

Keep naming explicit and operation-oriented. Do not add variant-specific endpoints until consumers need them.

- [ ] **Step 2: Export route-path constants from the contract facade**

Expose one constant per new typed route and keep path resolution contract-driven.

- [ ] **Step 3: Add typed request/response helpers to the server client**

Create methods for:
- `mediaVideoTranscode`
- `mediaVideoTrim`
- `mediaVideoExtractAudio`
- `mediaVideoCreateThumbnail`
- `mediaAudioConvert`
- `mediaAudioNormalize`
- `mediaAudioMix`

All methods should accept structured DTOs and return the standard command envelope.

### Task 3: Move ffmpeg command construction into Rust media services

**Files:**
- Modify: `packages/sdkwork-magic-studio-server/src-host/src/services/media.rs`
- Modify: `packages/sdkwork-magic-studio-server/src-host/src/routes/core.rs`
- Modify: `packages/sdkwork-magic-studio-server/src-host/src/lib.rs`

- [ ] **Step 1: Add typed Rust request DTOs for each media operation**

Keep route handlers thin and camelCase-compatible with the TypeScript client payloads.

- [ ] **Step 2: Add typed media service methods**

Implement:
- input and output path validation
- overwrite policy handling
- shared scale filter generation
- ffmpeg arg building inside `MediaService`
- audio mix handling including the single-input fast path

- [ ] **Step 3: Wire new Axum routes**

Register each canonical endpoint and delegate directly to `MediaService`.

### Task 4: Switch frontend toolkit server branches to typed media APIs

**Files:**
- Modify: `packages/sdkwork-magic-studio-core/src/platform/toolkit/createPlatformToolKit.ts`

- [ ] **Step 1: Replace server-side raw ffmpeg calls for common video operations**

Route `transcode`, `trim`, `extractAudio`, and `createThumbnail` through the new typed client methods. Keep bridge fallback behavior unchanged for non-server runtimes.

- [ ] **Step 2: Replace server-side raw ffmpeg calls for common audio operations**

Route `convert`, `normalize`, and `mix` through the new typed client methods. Preserve existing validation and browser/runtime fallbacks.

- [ ] **Step 3: Keep `ffmpeg.exec()` as an explicit low-level escape hatch**

Do not remove it; narrow its architectural role by no longer using it for common toolkit operations.

### Task 5: Verification and review

**Files:**
- Verify only

- [ ] **Step 1: Re-run the targeted node regression**

Run:
- `node --test --experimental-test-isolation=none tests/magicStudioServerContractParity.node.test.mjs packages/sdkwork-magic-studio-server/src/client.test.ts packages/sdkwork-magic-studio-core/src/platform/toolkit/__tests__/createPlatformToolKit.server.test.ts`

Expected: PASS

- [ ] **Step 2: Re-run the Rust regression**

Run:
- `CARGO_NET_OFFLINE=true cargo test --manifest-path packages/sdkwork-magic-studio-server/src-host/Cargo.toml`

Expected: PASS

- [ ] **Step 3: Re-run the broader server-first regression slice**

Run:
- `node --test --experimental-test-isolation=none tests/magicStudioServerContractParity.node.test.mjs packages/sdkwork-magic-studio-host-core/src/discovery.test.ts packages/sdkwork-magic-studio-server/src/client.test.ts packages/sdkwork-magic-studio-core/src/platform/toolkit/__tests__/policyClient.test.ts packages/sdkwork-magic-studio-core/src/platform/toolkit/__tests__/migrationClient.test.ts packages/sdkwork-magic-studio-core/src/platform/toolkit/__tests__/jobClient.test.ts packages/sdkwork-magic-studio-core/src/platform/toolkit/__tests__/createPlatformToolKit.server.test.ts`

Expected: PASS

- [ ] **Step 4: Review the remaining raw ffmpeg surface**

Confirm that common toolkit operations no longer depend on `/media/ffmpeg/exec`, then identify whether any next-step typed routes are still justified beyond the retained low-level escape hatch.
