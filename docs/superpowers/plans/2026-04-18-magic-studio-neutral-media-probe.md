# Magic Studio Neutral Media Probe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove `ffprobe` and `ffmpeg` implementation naming from the public probe/inspection API by standardizing on neutral `mediaProbe` terminology across route, client, jobs, and frontend toolkit.

**Architecture:** Keep Rust internals using ffprobe where appropriate, but expose a public contract that describes media probing as a capability instead of a tool invocation. Align route, client, async job, and toolkit namespace names so public consumers see one neutral vocabulary.

**Tech Stack:** TypeScript, Node.js test runner, Rust, Axum, Serde, Tokio

---

### Task 1: Lock the neutral probe standard with failing tests

**Files:**
- Modify: `tests/magicStudioServerContractParity.node.test.mjs`
- Modify: `packages/sdkwork-magic-studio-server/src/client.test.ts`
- Modify: `packages/sdkwork-magic-studio-core/src/platform/toolkit/__tests__/createPlatformToolKit.server.test.ts`
- Modify: `packages/sdkwork-magic-studio-core/src/platform/toolkit/__tests__/useToolkitJob.test.tsx`
- Modify: `packages/sdkwork-magic-studio-server/src-host/src/lib.rs`

- [ ] **Step 1: Require `/api/core/v1/media/probe`**
- [ ] **Step 2: Replace client expectations with `mediaProbe()`**
- [ ] **Step 3: Replace toolkit expectations with `toolkit.media.probe()` and `toolkit.media.available()`**
- [ ] **Step 4: Add Rust tests for `mediaProbe` job acceptance and legacy `probeMedia` rejection**
- [ ] **Step 5: Run RED verification**

### Task 2: Rename the public contract and client surface

**Files:**
- Modify: `packages/sdkwork-magic-studio-server/contracts/magic-studio-server.contract.json`
- Modify: `packages/sdkwork-magic-studio-server/src/contract.ts`
- Modify: `packages/sdkwork-magic-studio-server/src/client.ts`

- [ ] **Step 1: Rename the canonical route to `/api/core/v1/media/probe`**
- [ ] **Step 2: Rename `mediaFfprobeJson()` to `mediaProbe()`**
- [ ] **Step 3: Rename async job union kind `probeMedia` to `mediaProbe`**

### Task 3: Standardize Rust route and job vocabulary

**Files:**
- Modify: `packages/sdkwork-magic-studio-server/src-host/src/routes/core.rs`
- Modify: `packages/sdkwork-magic-studio-server/src-host/src/lib.rs`
- Modify: `packages/sdkwork-magic-studio-server/src-host/src/services/toolkit.rs`
- Modify: `packages/sdkwork-magic-studio-server/src-host/src/services/jobs.rs`

- [ ] **Step 1: Expose `media_probe` as the public route handler**
- [ ] **Step 2: Rename the toolkit operation variant to `MediaProbe`**
- [ ] **Step 3: Update snapshot/result naming to `mediaProbe`**

### Task 4: Rename the frontend public toolkit namespace

**Files:**
- Modify: `packages/sdkwork-magic-studio-core/src/platform/toolkit/types.ts`
- Modify: `packages/sdkwork-magic-studio-core/src/platform/toolkit/createPlatformToolKit.ts`
- Modify: `packages/sdkwork-magic-studio-core/src/platform/toolkit/__tests__/createPlatformToolKit.server.test.ts`

- [ ] **Step 1: Replace `ffmpeg` public namespace with `media`**
- [ ] **Step 2: Keep behavior the same, only neutralize public naming**
- [ ] **Step 3: Re-run targeted tests**

### Task 5: Verification

**Files:**
- Verify only

- [ ] **Step 1: Run targeted Node tests**
- [ ] **Step 2: Run broader server-first Node slice**
- [ ] **Step 3: Run Rust regression**
- [ ] **Step 4: Review remaining public implementation leakage**
