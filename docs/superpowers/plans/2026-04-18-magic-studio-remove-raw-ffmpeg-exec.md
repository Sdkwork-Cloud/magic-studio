# Magic Studio Remove Raw FFmpeg Exec Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the public raw `/media/ffmpeg/exec` escape hatch from the canonical Magic Studio server API while preserving internal Rust media execution for controlled toolkit jobs and typed media routes.

**Architecture:** The Rust host remains the only runtime authority for native media execution, but its public API surface is narrowed to typed, validated operations. Internal services may still execute ffmpeg commands behind policy enforcement and typed service methods; external TypeScript clients and toolkit consumers must no longer receive a generic command-execution interface.

**Tech Stack:** Rust `axum` host, TypeScript contract/client facade, React platform toolkit, Node `node:test`, Rust `cargo test`

---

### Task 1: Lock the new boundary with failing tests

**Files:**
- Modify: `tests/magicStudioServerContractParity.node.test.mjs`
- Modify: `packages/sdkwork-magic-studio-server/src/client.test.ts`
- Modify: `packages/sdkwork-magic-studio-core/src/platform/toolkit/__tests__/createPlatformToolKit.server.test.ts`
- Modify: `packages/sdkwork-magic-studio-server/src-host/src/lib.rs`

- [ ] **Step 1: Remove the raw exec route from contract parity expectations**

Change the required route list so `/api/core/v1/media/ffmpeg/exec` is no longer part of the canonical public contract.

- [ ] **Step 2: Remove the raw exec client call from TS client route tests**

Delete the `client.mediaFfmpegExec(['-version'])` call and its expected request URL, then add a source-level assertion that `client.ts` no longer exports or implements `mediaFfmpegExec`.

- [ ] **Step 3: Add toolkit API regression that the public escape hatch is gone**

Assert that `toolkit.ffmpeg` still exposes supported inspection helpers but no longer contains an `exec` function.

- [ ] **Step 4: Replace the Rust route smoke test**

Delete the route-wired test for `/api/core/v1/media/ffmpeg/exec` and add a negative regression asserting that `POST /api/core/v1/media/ffmpeg/exec` is no longer served.

- [ ] **Step 5: Run the targeted tests to verify RED**

Run:

```powershell
node --test --experimental-test-isolation=none tests/magicStudioServerContractParity.node.test.mjs packages/sdkwork-magic-studio-server/src/client.test.ts packages/sdkwork-magic-studio-core/src/platform/toolkit/__tests__/createPlatformToolKit.server.test.ts
```

Run:

```powershell
CARGO_NET_OFFLINE=true cargo test --manifest-path packages/sdkwork-magic-studio-server/src-host/Cargo.toml
```

Expected: the updated tests fail because the public route/client/toolkit surface still exists.

### Task 2: Remove the public contract and client surface

**Files:**
- Modify: `packages/sdkwork-magic-studio-server/contracts/magic-studio-server.contract.json`
- Modify: `packages/sdkwork-magic-studio-server/src/contract.ts`
- Modify: `packages/sdkwork-magic-studio-server/src/client.ts`

- [ ] **Step 1: Delete the canonical raw exec route**

Remove the `POST /api/core/v1/media/ffmpeg/exec` entry from the canonical contract JSON.

- [ ] **Step 2: Delete the contract facade constant**

Remove `MAGIC_STUDIO_SERVER_MEDIA_FFMPEG_EXEC_PATH` so downstream code must not resolve the deleted route.

- [ ] **Step 3: Delete the public TS client method**

Remove `mediaFfmpegExec()` from the client interface and implementation.

- [ ] **Step 4: Verify the targeted tests move closer to green**

Run the same Node test command from Task 1.

Expected: client/contract tests pass or fail only on remaining toolkit/server references.

### Task 3: Remove the public toolkit escape hatch without weakening local fallback behavior

**Files:**
- Modify: `packages/sdkwork-magic-studio-core/src/platform/toolkit/types.ts`
- Modify: `packages/sdkwork-magic-studio-core/src/platform/toolkit/createPlatformToolKit.ts`

- [ ] **Step 1: Narrow the toolkit ffmpeg namespace**

Remove `exec(args)` from `PlatformFfmpegToolkit`, keeping only the supported inspection/capability helpers that still have a legitimate public use.

- [ ] **Step 2: Refactor local fallback execution helper**

Change the internal helper used by typed video/audio methods so it no longer depends on the server client raw exec route. When the Rust server is present, typed routes stay typed; when the native bridge is the fallback, the helper invokes the bridge directly.

- [ ] **Step 3: Keep typed media behavior unchanged**

Do not change the request payloads or success/error semantics of `video.*`, `audio.*`, or `ffmpeg.probe()/available()`.

- [ ] **Step 4: Re-run Node tests**

Run the Task 1 Node command again.

Expected: toolkit tests pass; remaining failures, if any, are confined to Rust route wiring.

### Task 4: Remove the public Rust route while preserving internal media execution

**Files:**
- Modify: `packages/sdkwork-magic-studio-server/src-host/src/routes/core.rs`
- Modify: `packages/sdkwork-magic-studio-server/src-host/src/lib.rs`

- [ ] **Step 1: Delete the raw route request handler**

Remove the `MediaFfmpegExecRequest` payload and `media_ffmpeg_exec()` route handler from the public route module.

- [ ] **Step 2: Delete route registration**

Remove the route lookup and `.route(..., post(core::media_ffmpeg_exec))` binding from the Rust host.

- [ ] **Step 3: Preserve internal media service behavior**

Do not remove `MediaService::ffmpeg_exec()` or `ffmpeg_exec_controlled()` because controlled toolkit jobs still require internal native execution.

- [ ] **Step 4: Run full Rust regression**

Run:

```powershell
CARGO_NET_OFFLINE=true cargo test --manifest-path packages/sdkwork-magic-studio-server/src-host/Cargo.toml
```

Expected: all Rust tests pass with the deleted public route.

### Task 5: Final verification and architecture review

**Files:**
- Review only: `packages/sdkwork-magic-studio-server/src-host/src/services/toolkit.rs`
- Review only: `docs/superpowers/plans/2026-04-18-magic-studio-typed-media-jobs.md`

- [ ] **Step 1: Run the broader regression suite**

Run:

```powershell
node --test --experimental-test-isolation=none tests/magicStudioServerContractParity.node.test.mjs packages/sdkwork-magic-studio-host-core/src/discovery.test.ts packages/sdkwork-magic-studio-server/src/client.test.ts packages/sdkwork-magic-studio-core/src/platform/toolkit/__tests__/policyClient.test.ts packages/sdkwork-magic-studio-core/src/platform/toolkit/__tests__/migrationClient.test.ts packages/sdkwork-magic-studio-core/src/platform/toolkit/__tests__/jobClient.test.ts packages/sdkwork-magic-studio-core/src/platform/toolkit/__tests__/createPlatformToolKit.server.test.ts
```

- [ ] **Step 2: Review remaining standardization debt**

Confirm whether `resizeImage` should be promoted into a typed image route family next, now that the last raw public media execution escape hatch is gone.

- [ ] **Step 3: Document residual risks**

Record that any remaining direct ffmpeg command construction is now internal-only and should be evaluated case-by-case for typed route promotion rather than exposed publicly.
