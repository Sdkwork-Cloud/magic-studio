# Magic Studio Neutral Media Probe Errors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove ffprobe-specific and ffmpeg-specific public error vocabulary from the Rust media service error surface.

**Architecture:** The public route is already `media/probe`, so the probe error model must use the same abstraction. Shared command invocation failures inside `media.rs` should also use neutral media-command vocabulary rather than exposing ffmpeg. Internal command execution remains unchanged.

**Tech Stack:** Rust, serde_json, cargo test

---

### Task 1: Lock media probe failures with deterministic Rust tests

**Files:**
- Modify: `packages/sdkwork-magic-studio-server/src-host/src/services/media.rs`

- [ ] **Step 1: Add empty-input regression test for media probe**
- [ ] **Step 2: Add non-zero-exit regression test for media probe**
- [ ] **Step 3: Add invalid-JSON parse regression test**
- [ ] **Step 4: Add empty-args regression test for shared media command validation**
- [ ] **Step 5: Run focused Rust tests to verify RED**

### Task 2: Neutralize public media probe error vocabulary

**Files:**
- Modify: `packages/sdkwork-magic-studio-server/src-host/src/services/media.rs`

- [ ] **Step 1: Rename public `MEDIA_FFPROBE_*` error codes to `MEDIA_PROBE_*`**
- [ ] **Step 2: Replace ffprobe-specific messages with media-probe wording**
- [ ] **Step 3: Rename public `MEDIA_FFMPEG_*` command error codes to `MEDIA_COMMAND_*` where they surface through `media.rs`**
- [ ] **Step 4: Preserve internal ffprobe and ffmpeg command execution**

### Task 3: Verify the host surface

**Files:**
- Verify only

- [ ] **Step 1: Run focused media probe tests**
- [ ] **Step 2: Run the full Rust host suite**
- [ ] **Step 3: Search for remaining public probe leakage**
