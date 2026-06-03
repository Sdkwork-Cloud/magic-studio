# Magic Studio Neutral Toolkit Media Command Failure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove ffmpeg-specific non-zero-exit error vocabulary from the public Rust toolkit contract.

**Architecture:** Toolkit operations expose a neutral `ToolkitCommandResult`, so their failure taxonomy should also be media-command-oriented rather than ffmpeg-oriented. The message can remain operation-specific while the shared code becomes `TOOLKIT_MEDIA_COMMAND_FAILED`.

**Tech Stack:** Rust, serde, cargo test

---

### Task 1: Lock the public failure contract with Rust tests

**Files:**
- Modify: `packages/sdkwork-magic-studio-server/src-host/src/services/toolkit.rs`

- [ ] **Step 1: Add failing recording-operation tests for non-zero command exits**
- [ ] **Step 2: Verify the tests fail on the legacy `TOOLKIT_FFMPEG_NON_ZERO_EXIT` code**

### Task 2: Neutralize toolkit media command failure handling

**Files:**
- Modify: `packages/sdkwork-magic-studio-server/src-host/src/services/toolkit.rs`

- [ ] **Step 1: Rename the public non-zero-exit code to `TOOLKIT_MEDIA_COMMAND_FAILED`**
- [ ] **Step 2: Rename the internal helper to neutral media-command vocabulary**
- [ ] **Step 3: Keep operation-specific messages unchanged**

### Task 3: Verify the Rust host surface

**Files:**
- Verify only

- [ ] **Step 1: Run focused Rust media-command failure tests**
- [ ] **Step 2: Run the full Rust host suite**
- [ ] **Step 3: Search for remaining public toolkit failure leakage**
