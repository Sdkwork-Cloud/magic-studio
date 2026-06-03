# Magic Studio Neutral Media Command Result Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove ffmpeg implementation naming from the public React toolkit media command result type surface.

**Architecture:** The Rust server contract already uses neutral command result naming, so magic-studio-core should align to that standard instead of exposing ffmpeg in public type identities. Internal bridge command names remain implementation-specific and private.

**Tech Stack:** TypeScript, Node.js test runner

---

### Task 1: Lock the public type vocabulary with failing tests

**Files:**
- Modify: `packages/sdkwork-magic-studio-core/src/platform/toolkit/__tests__/createPlatformToolKit.server.test.ts`

- [ ] **Step 1: Add source assertions for `ToolkitMediaCommandResult`**
- [ ] **Step 2: Reject `ToolkitFfmpegExecResult` in the public toolkit types**
- [ ] **Step 3: Run the focused Node test to verify RED**

### Task 2: Rename the public type surface

**Files:**
- Modify: `packages/sdkwork-magic-studio-core/src/platform/toolkit/types.ts`
- Modify: `packages/sdkwork-magic-studio-core/src/platform/toolkit/createPlatformToolKit.ts`

- [ ] **Step 1: Replace `ToolkitFfmpegExecResult` with `ToolkitMediaCommandResult`**
- [ ] **Step 2: Update video/audio toolkit method signatures**
- [ ] **Step 3: Rename magic-studio-core helper plumbing to neutral media command vocabulary**

### Task 3: Verification

**Files:**
- Verify only

- [ ] **Step 1: Run focused toolkit server test**
- [ ] **Step 2: Run targeted Node regression slice**
- [ ] **Step 3: Review for remaining public media command naming leakage**
