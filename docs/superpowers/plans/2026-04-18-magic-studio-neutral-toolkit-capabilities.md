# Magic Studio Neutral Toolkit Capabilities Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove remaining public toolkit capability leakage by replacing tool-named capability fields with neutral capability vocabulary.

**Architecture:** The public capability matrix must describe externally useful runtime abilities. Internal tool detection may remain implementation-specific, but the serialized API and frontend toolkit abstractions must stay tool-agnostic.

**Tech Stack:** TypeScript, Node.js test runner, Rust, Axum, Serde

---

### Task 1: Lock the capability vocabulary with failing tests

**Files:**
- Modify: `packages/sdkwork-magic-studio-server/src/client.test.ts`
- Modify: `packages/sdkwork-magic-studio-core/src/platform/toolkit/__tests__/createPlatformToolKit.server.test.ts`
- Modify: `packages/sdkwork-magic-studio-server/src-host/src/lib.rs`

- [ ] **Step 1: Require `mediaProbeAvailable` in toolkit capability tests**
- [ ] **Step 2: Reject public `ffmpegAvailable` and `ffprobeAvailable` in client-source assertions**
- [ ] **Step 3: Add Rust capability-route assertions for neutral payload fields**
- [ ] **Step 4: Run RED verification**

### Task 2: Rename the public capability payload

**Files:**
- Modify: `packages/sdkwork-magic-studio-server/src/client.ts`
- Modify: `packages/sdkwork-magic-studio-server/src-host/src/services/toolkit.rs`

- [ ] **Step 1: Remove public `ffmpegAvailable` from the TypeScript capability interface**
- [ ] **Step 2: Rename `ffprobeAvailable` to `mediaProbeAvailable`**
- [ ] **Step 3: Keep internal tool detection implementation-specific**

### Task 3: Align frontend toolkit media availability

**Files:**
- Modify: `packages/sdkwork-magic-studio-core/src/platform/toolkit/createPlatformToolKit.ts`
- Modify: `packages/sdkwork-magic-studio-core/src/platform/toolkit/__tests__/createPlatformToolKit.server.test.ts`

- [ ] **Step 1: Make `toolkit.media.available()` read `mediaProbeAvailable` on server runtime**
- [ ] **Step 2: Keep bridge/system fallbacks working**

### Task 4: Verification

**Files:**
- Verify only

- [ ] **Step 1: Run targeted Node tests**
- [ ] **Step 2: Run broader server-first Node slice**
- [ ] **Step 3: Run Rust regression**
- [ ] **Step 4: Review remaining public tool-name leakage**
