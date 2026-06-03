# Magic Studio Internal Bridge Command Neutralization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Standardize the remaining desktop bridge command ids so the Rust server-first architecture uses one capability-oriented vocabulary across public routes and internal bridge transport.

**Architecture:** React desktop fallback and Tauri command registration must share the same neutral bridge ids. This batch also aligns `toolkit.media.available()` with probe capability semantics and updates repository docs so no canonical architecture reference still teaches the legacy ids.

**Tech Stack:** TypeScript, Rust, Node.js test runner, Cargo test

---

### Task 1: Lock the neutral bridge naming contract with failing tests

**Files:**
- Modify: `packages/sdkwork-magic-studio-core/src/platform/toolkit/__tests__/createPlatformToolKit.server.test.ts`
- Modify: `tests/magicStudioServerContractParity.node.test.mjs`

- [ ] **Step 1: Add a desktop bridge fallback test that expects `media_probe_available`, `media_command_execute`, `media_probe`, `compression_*`, and `database_*` invoke ids**
- [ ] **Step 2: Add Tauri source assertions that reject `media_ffmpeg_*`, `native_*`, and `db_*` command exports/registrations for this bridge slice**
- [ ] **Step 3: Run focused Node verification and confirm RED**

### Task 2: Rename React desktop bridge invoke ids

**Files:**
- Modify: `packages/sdkwork-magic-studio-core/src/platform/toolkit/createPlatformToolKit.ts`

- [ ] **Step 1: Replace legacy bridge invoke strings with the neutral ids**
- [ ] **Step 2: Make `toolkit.media.available()` invoke `media_probe_available`**
- [ ] **Step 3: Keep server-runtime behavior and payload contracts unchanged**

### Task 3: Rename Tauri command exports and registrations

**Files:**
- Modify: `src-tauri/src/commands/media_commands.rs`
- Modify: `src-tauri/src/commands/compression_commands.rs`
- Modify: `src-tauri/src/commands/database_commands.rs`
- Modify: `src-tauri/src/main.rs`

- [ ] **Step 1: Rename exported Tauri command functions to the neutral bridge ids**
- [ ] **Step 2: Update `run_blocking(...)` labels to the same neutral ids**
- [ ] **Step 3: Make `media_probe_available` check `ffprobe` through `AppContext::system()`**
- [ ] **Step 4: Update `generate_handler!` registration to match the renamed commands**

### Task 4: Align documentation and verify the slice

**Files:**
- Modify: `docs/tauri-rust-framework-architecture.md`
- Modify: `docs/local-media-toolkit-architecture.md`
- Modify: `docs/superpowers/specs/2026-04-18-magic-studio-platform-bridge-neutralization-design.md`
- Modify: `docs/superpowers/specs/2026-04-18-magic-studio-neutral-toolkit-capabilities-design.md`
- Modify: `docs/superpowers/specs/2026-04-18-magic-studio-neutral-media-command-result-design.md`
- Create: `docs/superpowers/specs/2026-04-18-magic-studio-internal-bridge-command-neutralization-design.md`

- [ ] **Step 1: Update architecture docs so they publish only the neutral bridge ids**
- [ ] **Step 2: Re-run focused Node tests**
- [ ] **Step 3: Run broader Node server-first regression**
- [ ] **Step 4: Run Rust host regression**
- [ ] **Step 5: Re-scan the repository for leftover legacy bridge command ids outside ignored backup material**
