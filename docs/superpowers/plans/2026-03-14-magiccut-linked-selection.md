# MagicCut Linked Selection Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore professional linked audio/video behavior so detached audio stays linked to its source clip and live timeline drag moves linked clips together with correct collision checks.

**Architecture:** Keep link semantics in pure domain/service code and keep the timeline drag hook as a thin orchestration layer. Add tests for detach-audio linking and linked move resolution first, then wire the resulting move plan into store commits and drag preview/validation.

**Tech Stack:** React, TypeScript, Zustand, Vitest

---

## Chunk 1: Link Integrity

### Task 1: Lock detach-audio semantics with tests

**Files:**
- Create: `packages/sdkwork-react-magiccut/tests/timelineOperationService.test.ts`
- Modify: `packages/sdkwork-react-magiccut/src/services/TimelineOperationService.ts`

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run the focused test to verify it fails for missing link metadata**
- [ ] **Step 3: Add shared `linkGroupId` and reciprocal `linkedClipId` to detached audio/video clips**
- [ ] **Step 4: Re-run the focused test to verify it passes**

## Chunk 2: Linked Drag Resolution

### Task 2: Add a pure linked-move resolver

**Files:**
- Create: `packages/sdkwork-react-magiccut/src/domain/timeline/linkedMove.ts`
- Create: `packages/sdkwork-react-magiccut/tests/linkedMove.test.ts`

- [ ] **Step 1: Write failing tests for linked move plans and collision detection**
- [ ] **Step 2: Run the focused tests to verify they fail**
- [ ] **Step 3: Implement minimal linked move resolution for primary and linked clips**
- [ ] **Step 4: Re-run the focused tests to verify they pass**

### Task 3: Wire linked move plans into live drag commits

**Files:**
- Modify: `packages/sdkwork-react-magiccut/src/components/Timeline/canvas/hooks/useClipDrag.ts`
- Modify: `packages/sdkwork-react-magiccut/src/components/Timeline/canvas/TimelineCanvas.tsx`
- Modify: `packages/sdkwork-react-magiccut/src/store/magicCutStore.tsx`

- [ ] **Step 1: Extend the store with grouped clip move support**
- [ ] **Step 2: Pass linked-selection state into the drag hook**
- [ ] **Step 3: Use the pure linked move resolver for preview, validation, and commit**
- [ ] **Step 4: Re-run focused tests and existing timeline tests**

## Chunk 3: Verification

### Task 4: Regressions and package verification

**Files:**
- Test: `packages/sdkwork-react-magiccut/tests/*.test.ts`

- [ ] **Step 1: Run `pnpm --filter @sdkwork/react-magiccut test`**
- [ ] **Step 2: Run `pnpm --filter @sdkwork/react-magiccut build`**
- [ ] **Step 3: Run `pnpm --filter @sdkwork/react-magiccut typecheck` and record workspace-external failures if they remain**
