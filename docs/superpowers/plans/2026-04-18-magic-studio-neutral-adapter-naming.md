# Magic Studio Neutral Adapter Naming Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove leftover tool-specific naming from high-level adapter code adjacent to the public API boundary.

**Architecture:** Public vocabulary has already been neutralized, so nearby adapter-layer names should match it. This plan deliberately stops short of low-level binary wrapper names, which remain internal implementation details.

**Tech Stack:** TypeScript, Rust source assertions, Node.js test runner

---

### Task 1: Lock adapter naming with source assertions

**Files:**
- Modify: `packages/sdkwork-magic-studio-core/src/platform/toolkit/__tests__/createPlatformToolKit.server.test.ts`
- Modify: `tests/magicStudioServerContractParity.node.test.mjs`

- [ ] **Step 1: Add failing assertions for the neutral probe parsing helper names**
- [ ] **Step 2: Add a failing assertion rejecting `MediaFfmpegConcatRequest`**
- [ ] **Step 3: Run focused Node verification to confirm RED**

### Task 2: Rename the adapter-layer identifiers

**Files:**
- Modify: `packages/sdkwork-magic-studio-core/src/platform/toolkit/createPlatformToolKit.ts`
- Modify: `packages/sdkwork-magic-studio-server/src-host/src/routes/core.rs`

- [ ] **Step 1: Rename probe parsing helpers to `parseMediaProbeAs...`**
- [ ] **Step 2: Rename the route concat DTO to `MediaVideoConcatRequest`**
- [ ] **Step 3: Preserve runtime behavior**

### Task 3: Verify the focused surface

**Files:**
- Verify only

- [ ] **Step 1: Run focused adapter-naming tests**
- [ ] **Step 2: Run broader Node server-first regression**
- [ ] **Step 3: Re-scan for remaining high-level adapter naming debt**
