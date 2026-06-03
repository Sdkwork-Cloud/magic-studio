# Magic Studio Server Client Canonical Runtime Default Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `createMagicStudioServerClient()` default to the canonical server runtime descriptor instead of desktop discovery semantics.

**Architecture:** The dedicated server client package should derive its default host identity from `MAGIC_STUDIO_SERVER_RUNTIME`, not from generic runtime discovery. Explicit host and baseUrl overrides stay intact, but the zero-config path becomes unambiguously server-first.

**Tech Stack:** TypeScript, Node.js test runner

---

### Task 1: Lock the default runtime contract with tests

**Files:**
- Modify: `packages/sdkwork-magic-studio-server/src/client.test.ts`

- [ ] **Step 1: Add a failing test for the default client host kind**
- [ ] **Step 2: Add a source assertion rejecting `runtimeMode: 'desktop'` in `client.ts`**
- [ ] **Step 3: Run the focused Node test to verify RED**

### Task 2: Switch the client to the canonical server runtime default

**Files:**
- Modify: `packages/sdkwork-magic-studio-server/src/client.ts`

- [ ] **Step 1: Replace generic host discovery with `MAGIC_STUDIO_SERVER_RUNTIME` as the default host**
- [ ] **Step 2: Preserve explicit `host` and `baseUrl` override behavior**
- [ ] **Step 3: Remove unused discovery imports if they remain**

### Task 3: Verify the TypeScript surface

**Files:**
- Verify only

- [ ] **Step 1: Run focused server client tests**
- [ ] **Step 2: Run broader Node server-first regression slice**
- [ ] **Step 3: Re-scan for remaining server client default-runtime leakage**
