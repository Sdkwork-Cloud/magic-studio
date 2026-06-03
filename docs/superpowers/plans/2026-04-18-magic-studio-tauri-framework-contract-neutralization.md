# Magic Studio Tauri Framework Contract Neutralization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the `src-tauri` desktop framework media/toolkit contract with the neutral server-host standard so the application uses one capability-oriented Rust contract vocabulary.

**Architecture:** The desktop framework keeps its private `ffmpeg`/`ffprobe` implementation wiring for now, but its externally meaningful capability fields, error codes, error messages, and recording notes must match the canonical Rust server-host contract. Tests should prove both the media service taxonomy and the toolkit capability/error payloads are neutral.

**Tech Stack:** Rust, Serde, Cargo test

---

### Task 1: Lock the desktop framework contract with failing Rust tests

**Files:**
- Modify: `src-tauri/src/framework/services/media.rs`
- Modify: `src-tauri/src/framework/services/toolkit.rs`

- [ ] **Step 1: Add media service tests for neutral empty-args and media-probe empty-input failures**
- [ ] **Step 2: Add toolkit tests for neutral capability payload serialization**
- [ ] **Step 3: Add toolkit tests for recording capability errors, media-command failure codes, and note removal**
- [ ] **Step 4: Run focused `cargo test --manifest-path src-tauri/Cargo.toml framework::services` or the closest runnable desktop cargo test to confirm RED**

### Task 2: Align desktop media service error taxonomy

**Files:**
- Modify: `src-tauri/src/framework/services/media.rs`

- [ ] **Step 1: Replace `MEDIA_FFMPEG_*` codes/messages with `MEDIA_COMMAND_*` wording**
- [ ] **Step 2: Replace `MEDIA_FFPROBE_*` codes/messages with `MEDIA_PROBE_*` wording**
- [ ] **Step 3: Preserve the actual `ffmpeg`/`ffprobe` process execution behavior**

### Task 3: Align desktop toolkit capability and recording contracts

**Files:**
- Modify: `src-tauri/src/framework/services/toolkit.rs`

- [ ] **Step 1: Replace `ffmpeg_available` and `ffprobe_available` with `media_probe_available` in `ToolkitCapabilityMatrix`**
- [ ] **Step 2: Replace toolkit media-command failure and recording-unavailable error codes/messages with the neutral forms**
- [ ] **Step 3: Remove backend-revealing recording notes**

### Task 4: Verify and document parity

**Files:**
- Modify: `docs/tauri-rust-framework-architecture.md`
- Modify: `docs/platform-runtime-capability-matrix.md`
- Create: `docs/superpowers/specs/2026-04-18-magic-studio-tauri-framework-contract-neutralization-design.md`

- [ ] **Step 1: Update architecture docs where they describe the desktop toolkit capability contract**
- [ ] **Step 2: Run `cargo test --manifest-path src-tauri/Cargo.toml`**
- [ ] **Step 3: Run the existing Node regression slice that checks Rust-server-first parity**
- [ ] **Step 4: Re-scan the repo for leftover desktop framework contract leaks**
