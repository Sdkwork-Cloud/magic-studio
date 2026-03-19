# MagicCut Pro Audit Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the highest-leverage workflow, performance, and captioning issues in `@sdkwork/react-magiccut` while documenting the remaining benchmark gaps for later feature work.

**Architecture:** Keep playback authority inside `PlayerController`, split remote asset fetching from local resource derivation in the browser panel, and promote subtitle tracks to explicit timeline types instead of generic fallbacks.

**Tech Stack:** React 18, TypeScript, Zustand, Vitest, Vite

---

### Task 1: Lock playback shortcuts to the real transport

**Files:**
- Modify: `packages/sdkwork-react-magiccut/src/hooks/useShortcuts.ts`
- Modify: `packages/sdkwork-react-magiccut/tests/shortcutDefinitions.test.ts`

**Step 1: Write the failing test**

Add a regression test proving the transport shortcut dependencies call the real playback handlers for J/K/L instead of mutating state in isolation.

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @sdkwork/react-magiccut test -- tests/shortcutDefinitions.test.ts`

Expected: FAIL because the new shortcut-routing behavior is not covered yet.

**Step 3: Write minimal implementation**

Update `useShortcuts.ts` so the J/K/L shortcut actions delegate through `playerController.handleJKLInput(...)` and `pause()`.

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @sdkwork/react-magiccut test -- tests/shortcutDefinitions.test.ts`

Expected: PASS

### Task 2: Remove unnecessary asset-panel churn

**Files:**
- Modify: `packages/sdkwork-react-magiccut/src/components/Resources/MagicCutResourcePanel.tsx`
- Create: `packages/sdkwork-react-magiccut/src/domain/assets/resourcePanelAssets.ts`
- Create: `packages/sdkwork-react-magiccut/tests/resourcePanelAssets.test.ts`

**Step 1: Write the failing test**

Add tests for helper logic that derives local resources by category and merges local and remote collections without duplicates.

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @sdkwork/react-magiccut test -- tests/resourcePanelAssets.test.ts`

Expected: FAIL because the helper module does not exist yet.

**Step 3: Write minimal implementation**

Create helper functions for local asset derivation and merging, then refactor `MagicCutResourcePanel.tsx` so:

- local resources are computed separately from remote fetches
- remote fetches depend on debounced query input
- store resource updates do not retrigger remote page-0 fetches

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @sdkwork/react-magiccut test -- tests/resourcePanelAssets.test.ts`

Expected: PASS

### Task 3: Restore trust in browsing interactions

**Files:**
- Modify: `packages/sdkwork-react-magiccut/src/components/Resources/SkimmableAssetCard.tsx`
- Modify: `packages/sdkwork-react-magiccut/src/services/TrackFactory.ts`
- Modify: `packages/sdkwork-react-magiccut/src/components/Timeline/MagicCutTimeline.tsx`
- Modify: `packages/sdkwork-react-magiccut/src/components/Timeline/MagicCutTrackHeader.tsx`
- Modify: `packages/sdkwork-react-magiccut/src/components/Timeline/TimelineMinimap.tsx`
- Create: `packages/sdkwork-react-magiccut/tests/trackFactory.test.ts`
- Create: `packages/sdkwork-react-magiccut/tests/skimmableAssetCard.test.tsx`

**Step 1: Write the failing tests**

- Add a regression test that subtitle track config is explicit.
- Add a component test that clicking the favorite control on a skimmable asset card calls the toggle callback.

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @sdkwork/react-magiccut test -- tests/trackFactory.test.ts tests/skimmableAssetCard.test.tsx`

Expected: FAIL because subtitle config and favorite interaction are incomplete.

**Step 3: Write minimal implementation**

- Wire `onToggleFavorite` inside `SkimmableAssetCard`.
- Add subtitle-track defaults to `TrackFactory`.
- Add subtitle track entry points and visual affordances in the timeline UI.

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @sdkwork/react-magiccut test -- tests/trackFactory.test.ts tests/skimmableAssetCard.test.tsx`

Expected: PASS

### Task 4: Full verification

**Files:**
- No new files

**Step 1: Run focused tests**

Run: `pnpm --filter @sdkwork/react-magiccut test`

Expected: PASS

**Step 2: Run typecheck**

Run: `pnpm --filter @sdkwork/react-magiccut typecheck`

Expected: PASS

**Step 3: Run build**

Run: `pnpm --filter @sdkwork/react-magiccut build`

Expected: PASS
