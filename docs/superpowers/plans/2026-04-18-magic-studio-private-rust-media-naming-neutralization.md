# Magic Studio Private Rust Media Naming Neutralization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Standardize the remaining private Rust media naming across desktop and server-host runtimes so the server-first media stack uses one capability-oriented vocabulary end-to-end.

**Architecture:** Public contracts are already neutral, so this batch is a pure internal standards pass. The implementation keeps real `ffmpeg` / `ffprobe` process execution, but private traits, helpers, test doubles, and internal call sites must use neutral `media command` / `media probe` naming consistently across both Rust runtimes.

**Tech Stack:** Rust, Cargo test, Node.js test runner

---

### Task 1: Lock the private naming standard with a failing source assertion

**Files:**
- Create: `tests/magicStudioRustPrivateMediaNaming.node.test.mjs`

- [ ] **Step 1: Add source assertions for the targeted Rust files**
- [ ] **Step 2: Reject legacy private names such as `ffmpeg_available`, `ffmpeg_exec`, `ffmpeg_exec_controlled`, `ffprobe_json`, `with_ffmpeg_progress_args`, `parse_ffmpeg_time_to_seconds`, and `run_ffmpeg_with_progress`**
- [ ] **Step 3: Run `node --test --experimental-test-isolation=none tests/magicStudioRustPrivateMediaNaming.node.test.mjs` and confirm RED**

### Task 2: Neutralize private media trait naming in `src-tauri`

**Files:**
- Modify: `src-tauri/src/framework/services/media.rs`
- Modify: `src-tauri/src/framework/services/toolkit.rs`
- Modify: `src-tauri/src/commands/media_commands.rs`

- [ ] **Step 1: Rename private `MediaService` methods to `media_command_available`, `media_command_execute`, `media_command_execute_controlled`, and `media_probe`**
- [ ] **Step 2: Rename toolkit helper methods and call sites to the neutral media-command vocabulary**
- [ ] **Step 3: Rename local test doubles and fixture fields to the same vocabulary**

### Task 3: Neutralize private media trait naming in server-host

**Files:**
- Modify: `packages/sdkwork-magic-studio-server/src-host/src/services/media.rs`
- Modify: `packages/sdkwork-magic-studio-server/src-host/src/services/toolkit.rs`
- Modify: `packages/sdkwork-magic-studio-server/src-host/src/routes/core.rs`

- [ ] **Step 1: Rename private `MediaService` methods to match the `src-tauri` standard**
- [ ] **Step 2: Rename toolkit helper methods and call sites to the neutral media-command vocabulary**
- [ ] **Step 3: Rename local test doubles and fixture fields to the same vocabulary**

### Task 4: Verify runtime parity and residual debt

**Files:**
- Modify: `docs/tauri-rust-framework-architecture.md`

- [ ] **Step 1: Update architecture wording where it still describes private abstraction mappings with legacy method names**
- [ ] **Step 2: Run `cargo test --manifest-path src-tauri/Cargo.toml`**
- [ ] **Step 3: Run `cargo test --manifest-path packages/sdkwork-magic-studio-server/src-host/Cargo.toml` with offline mode if needed**
- [ ] **Step 4: Run `node --test --experimental-test-isolation=none tests/magicStudioRustPrivateMediaNaming.node.test.mjs tests/tauriRustCompileCompatibility.node.test.mjs tests/magicStudioServerContractParity.node.test.mjs`**
- [ ] **Step 5: Re-scan `src-tauri` and `packages/sdkwork-magic-studio-server/src-host` for leftover private media helper leaks**
