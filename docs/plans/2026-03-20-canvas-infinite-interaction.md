# Canvas Infinite Interaction Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make `sdkwork-react-canvas` infinite canvas interactions consistent, history-safe, and resilient across zoom, minimap navigation, inline editing, and group containment.

**Architecture:** Introduce pure viewport helpers and pure group-fit helpers, then route `CanvasBoard`, `CanvasZoomControls`, `CanvasMinimap`, `CanvasNode`, `CanvasGroupPanel`, and `canvasStore` through those shared paths. Use focused tests on pure logic so verification stays stable in the current workspace.

**Tech Stack:** React, Zustand, TypeScript, Vitest

---

### Task 1: Add shared viewport helpers

**Files:**
- Create: `packages/sdkwork-react-canvas/src/utils/viewport.ts`
- Create: `packages/sdkwork-react-canvas/src/utils/viewport.test.ts`

**Step 1: Write the failing test**

Cover:

- zoom around an anchor keeps the same world point under the cursor
- center zoom uses viewport center as anchor
- center-on-world produces expected viewport coordinates

**Step 2: Run test to verify it fails**

Run: `pnpm test packages/sdkwork-react-canvas/src/utils/viewport.test.ts`

**Step 3: Write minimal implementation**

Implement pure helper functions with no React dependencies.

**Step 4: Run test to verify it passes**

Run: `pnpm test packages/sdkwork-react-canvas/src/utils/viewport.test.ts`

### Task 2: Add group-fit helper coverage

**Files:**
- Create: `packages/sdkwork-react-canvas/src/store/canvasGroupGeometry.ts`
- Create: `packages/sdkwork-react-canvas/src/store/canvasGroupGeometry.test.ts`

**Step 1: Write the failing test**

Cover:

- collecting ancestor groups for a changed child
- recomputing nested group bounds with padding
- leaving unrelated groups untouched

**Step 2: Run test to verify it fails**

Run: `pnpm test packages/sdkwork-react-canvas/src/store/canvasGroupGeometry.test.ts`

**Step 3: Write minimal implementation**

Export pure helpers for ancestor collection and group bound recompute.

**Step 4: Run test to verify it passes**

Run: `pnpm test packages/sdkwork-react-canvas/src/store/canvasGroupGeometry.test.ts`

### Task 3: Route canvas interactions through shared helpers

**Files:**
- Modify: `packages/sdkwork-react-canvas/src/components/CanvasBoard.tsx`
- Modify: `packages/sdkwork-react-canvas/src/components/CanvasMinimap.tsx`
- Modify: `packages/sdkwork-react-canvas/src/components/CanvasZoomControls.tsx`

**Step 1: Replace duplicated viewport math**

Use the new viewport helpers in wheel zoom, toolbar zoom, reset, and minimap interaction.

**Step 2: Make minimap dragging robust**

Use active drag state plus window listeners so dragging survives pointer exit.

**Step 3: Run targeted tests**

Run:

- `pnpm test packages/sdkwork-react-canvas/src/utils/viewport.test.ts`

### Task 4: Fix history-safe edit commits and group containment

**Files:**
- Modify: `packages/sdkwork-react-canvas/src/store/canvasStore.tsx`
- Modify: `packages/sdkwork-react-canvas/src/components/CanvasNode.tsx`
- Modify: `packages/sdkwork-react-canvas/src/components/CanvasGroupPanel.tsx`

**Step 1: Add a committed update path**

Allow transient editing followed by one true history commit with final data.

**Step 2: Re-fit ancestor groups on geometry-changing commits**

Use the new group geometry helper anywhere committed geometry changes occur.

**Step 3: Ensure inline text, note, label, and group resize interactions commit history**

Finalize those interactions with actual diff-bearing updates instead of empty final calls.

**Step 4: Run targeted tests**

Run:

- `pnpm test packages/sdkwork-react-canvas/src/store/canvasGroupGeometry.test.ts`

### Task 5: Verify integrated canvas package state

**Files:**
- Modify only if verification reveals issues

**Step 1: Run focused canvas tests**

Run:

- `pnpm test packages/sdkwork-react-canvas/src/utils/viewport.test.ts packages/sdkwork-react-canvas/src/store/canvasGroupGeometry.test.ts packages/sdkwork-react-canvas/src/services/index.test.ts`

**Step 2: Run package build or typecheck if available**

Run:

- `pnpm --filter @sdkwork/react-canvas build`

If unrelated workspace issues block full success, document the exact failure and confirm the canvas-focused tests still pass.
