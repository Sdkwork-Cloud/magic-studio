# Magic Studio Platform Bridge Neutralization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove legacy “native bridge�?vocabulary from the public magic-studio-core runtime contract.

**Architecture:** The public runtime already exposes a `bridge` capability property, so the exported type and user-facing errors should use the same abstraction. Internal bridge commands remain unchanged; only the public vocabulary becomes neutral and capability-oriented.

**Tech Stack:** TypeScript, Node.js test runner

---

### Task 1: Lock the public bridge vocabulary with tests

**Files:**
- Modify: `packages/sdkwork-magic-studio-core/src/platform/runtime/__tests__/platformRuntime.contract.ts`
- Modify: `packages/sdkwork-magic-studio-core/src/platform/toolkit/__tests__/createPlatformToolKit.server.test.ts`

- [ ] **Step 1: Add a failing assertion for `PlatformBridgeCapability`**
- [ ] **Step 2: Add a failing runtime assertion for neutral invoke error wording**
- [ ] **Step 3: Add a failing toolkit assertion for neutral bridge-access error wording**
- [ ] **Step 4: Add a failing toolkit assertion rejecting `FFprobe` / `FFmpeg` in bridge-access errors**
- [ ] **Step 5: Run focused Node verification to confirm RED**

### Task 2: Neutralize the public runtime vocabulary

**Files:**
- Modify: `packages/sdkwork-magic-studio-core/src/platform/runtime/types.ts`
- Modify: `packages/sdkwork-magic-studio-core/src/platform/runtime/createPlatformRuntime.ts`
- Modify: `packages/sdkwork-magic-studio-core/src/platform/toolkit/createPlatformToolKit.ts`

- [ ] **Step 1: Rename `PlatformNativeBridgeCapability` to `PlatformBridgeCapability`**
- [ ] **Step 2: Replace runtime error wording with neutral bridge wording**
- [ ] **Step 3: Replace toolkit bridge-access wording with neutral bridge wording**
- [ ] **Step 4: Replace tool-specific bridge feature labels with capability-oriented labels**

### Task 3: Verify the public magic-studio-core surface

**Files:**
- Verify only

- [ ] **Step 1: Run focused runtime/toolkit tests**
- [ ] **Step 2: Run broader Node server-first regression slice**
- [ ] **Step 3: Re-scan for remaining public native-bridge leakage**
