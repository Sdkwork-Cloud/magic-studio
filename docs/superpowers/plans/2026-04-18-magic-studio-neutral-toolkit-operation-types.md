# Magic Studio Neutral Toolkit Operation Types Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove stale `Native` naming from the public toolkit operation type surface in the server client and magic-studio-core job client.

**Architecture:** Public TypeScript APIs should reflect the Rust server-first toolkit operation model, not historical native-bridge implementation details. The change is type-centric and must not alter payload semantics or job behavior.

**Tech Stack:** TypeScript, Node.js test runner

---

### Task 1: Lock the neutral type vocabulary with failing tests

**Files:**
- Modify: `packages/sdkwork-magic-studio-server/src/client.test.ts`
- Modify: `packages/sdkwork-magic-studio-core/src/platform/toolkit/__tests__/jobClient.test.ts`

- [ ] **Step 1: Require neutral toolkit operation type names in the server client source**
- [ ] **Step 2: Require neutral toolkit job type aliases in the magic-studio-core job client source**
- [ ] **Step 3: Reject legacy `Native` type names from the public source**
- [ ] **Step 4: Run focused RED verification**

### Task 2: Rename the public server client types

**Files:**
- Modify: `packages/sdkwork-magic-studio-server/src/client.ts`

- [ ] **Step 1: Rename command result, operation result, and operation types**
- [ ] **Step 2: Update method signatures and snapshot payload references**

### Task 3: Rename the public magic-studio-core job aliases

**Files:**
- Modify: `packages/sdkwork-magic-studio-core/src/platform/toolkit/jobClient.ts`
- Modify: `packages/sdkwork-magic-studio-core/src/platform/toolkit/useToolkitJob.ts`
- Modify: `packages/sdkwork-magic-studio-core/src/platform/toolkit/__tests__/useToolkitJob.test.tsx`

- [ ] **Step 1: Rename magic-studio-core job client aliases to neutral toolkit operation names**
- [ ] **Step 2: Update hooks to reference `ToolkitOperation`**
- [ ] **Step 3: Keep runtime behavior unchanged**

### Task 4: Verification

**Files:**
- Verify only

- [ ] **Step 1: Run focused client/job-client Node tests**
- [ ] **Step 2: Run broader server-first Node regression slice**
- [ ] **Step 3: Review for remaining public `ToolkitNative` leakage**
