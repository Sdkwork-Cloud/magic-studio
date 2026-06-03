# Magic Studio Neutral Recording Results Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove recording-backend implementation leakage from the public Rust toolkit result contract.

**Architecture:** The Rust server remains the canonical public boundary, so recording errors and result payloads must describe runtime capabilities rather than ffmpeg internals. Internal ffmpeg checks stay in place, but public codes, messages, and notes become capability-oriented and backend-neutral.

**Tech Stack:** Rust, Axum, serde, cargo test

---

### Task 1: Lock the recording contract with failing Rust tests

**Files:**
- Modify: `packages/sdkwork-magic-studio-server/src-host/src/services/toolkit.rs`

- [ ] **Step 1: Add a focused test fixture for `LocalToolkitService` recording operations**
- [ ] **Step 2: Write failing tests for `recordAudio` and `recordScreen` availability errors**
- [ ] **Step 3: Write failing tests for `recordAudio` and `recordScreen` success payload notes**
- [ ] **Step 4: Run the focused Rust tests to verify RED**

### Task 2: Neutralize public recording results

**Files:**
- Modify: `packages/sdkwork-magic-studio-server/src-host/src/services/toolkit.rs`

- [ ] **Step 1: Replace recording availability error codes with capability-oriented values**
- [ ] **Step 2: Replace recording availability messages with runtime-capability wording**
- [ ] **Step 3: Remove implementation-specific success notes from recording results**

### Task 3: Verify and review residual leakage

**Files:**
- Verify only

- [ ] **Step 1: Run focused Rust recording tests**
- [ ] **Step 2: Run full Rust host test suite**
- [ ] **Step 3: Search for remaining public recording-result leakage**
