# MagicCut Render Runtime Hardening Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove two professional-grade runtime gaps in `@sdkwork/react-magiccut`: placeholder export fallback and transition lead-in playback/render desynchronization.

**Architecture:** Keep the new logic in package-local domain helpers so export/runtime policy stays inside `sdkwork-react-magiccut` and remains aligned with `ARCHITECT.md` boundaries. Wire the helpers into the existing export service and render engine with minimal surface-area changes.

**Tech Stack:** TypeScript, Vitest, React package-local domain helpers, existing WebGL/export runtime services

---

## Chunk 1: Export Fallback Integrity

### Task 1: Define encoder selection behavior in tests

**Files:**
- Create: `packages/sdkwork-react-magiccut/tests/exportCapabilities.test.ts`
- Create: `packages/sdkwork-react-magiccut/src/domain/export/exportCapabilities.ts`

- [ ] **Step 1: Write the failing test**

```ts
it('falls back to media recorder when WebCodecs lacks a muxer', () => {
  expect(resolvePreferredExportEncoder({
    webCodecsSupported: true,
    h264Supported: true,
    webCodecsMuxerAvailable: false,
    mediaRecorderSupported: true,
  })).toBe('browser-media-recorder');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @sdkwork/react-magiccut test tests/exportCapabilities.test.ts`
Expected: FAIL because the helper module does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
export function resolvePreferredExportEncoder(capabilities) {
  if (capabilities.webCodecsSupported && capabilities.h264Supported && capabilities.webCodecsMuxerAvailable) {
    return 'webcodecs';
  }
  if (capabilities.mediaRecorderSupported) {
    return 'browser-media-recorder';
  }
  return null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @sdkwork/react-magiccut test tests/exportCapabilities.test.ts`
Expected: PASS

### Task 2: Wire runtime probing into export selection

**Files:**
- Modify: `packages/sdkwork-react-magiccut/src/services/export/videoExportService.ts`
- Modify: `packages/sdkwork-react-magiccut/src/services/export/encoders/WebCodecsEncoder.ts`
- Modify: `packages/sdkwork-react-magiccut/src/services/export/encoders/BrowserMediaEncoder.ts`

- [ ] **Step 1: Write the failing test**

Extend the encoder-capability tests to cover the final runtime decision surface.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @sdkwork/react-magiccut test tests/exportCapabilities.test.ts`
Expected: FAIL until the service/encoder helpers consume the new capability rules.

- [ ] **Step 3: Write minimal implementation**

Add muxer probing to `WebCodecsEncoder`, support probing to `BrowserMediaEncoder`, and make `videoExportService` use the new helper before selecting an encoder.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @sdkwork/react-magiccut test tests/exportCapabilities.test.ts`
Expected: PASS

## Chunk 2: Transition-Aware Playback Sync

### Task 3: Define transition lead-in playback rules in tests

**Files:**
- Create: `packages/sdkwork-react-magiccut/tests/transitionPlayback.test.ts`
- Create: `packages/sdkwork-react-magiccut/src/domain/playback/transitionPlayback.ts`

- [ ] **Step 1: Write the failing test**

```ts
it('extends a clip activation window by the full incoming transition lead-in', () => {
  expect(resolveClipActivationStart({
    clipStart: 10,
    incomingTransitionLeadIn: 1.25,
    defaultLookahead: 0.5,
  })).toBe(8.75);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @sdkwork/react-magiccut test tests/transitionPlayback.test.ts`
Expected: FAIL because the helper module does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Add helpers to compute incoming transition lead-ins, activation start times, and clip-start clamping for pre-roll rendering.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @sdkwork/react-magiccut test tests/transitionPlayback.test.ts`
Expected: PASS

### Task 4: Wire transition helpers into render playback

**Files:**
- Modify: `packages/sdkwork-react-magiccut/src/engine/WebGLEngine.ts`
- Modify: `packages/sdkwork-react-magiccut/src/engine/renderer/TimelineRenderer.ts`

- [ ] **Step 1: Write the failing test**

Extend the transition-playback tests to verify long transitions stay active before the target clip start and clamp pre-roll rendering to the clip’s first frame.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @sdkwork/react-magiccut test tests/transitionPlayback.test.ts`
Expected: FAIL until runtime consumers use the helper outputs.

- [ ] **Step 3: Write minimal implementation**

Update the engine to use incoming transition lead-ins for warmup/seek windows and clamp transition rendering time for the incoming clip.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @sdkwork/react-magiccut test tests/transitionPlayback.test.ts`
Expected: PASS

## Chunk 3: Verification

### Task 5: Package verification

**Files:**
- Modify: none

- [ ] **Step 1: Run targeted tests**

Run:
- `pnpm --filter @sdkwork/react-magiccut test tests/exportCapabilities.test.ts`
- `pnpm --filter @sdkwork/react-magiccut test tests/transitionPlayback.test.ts`

- [ ] **Step 2: Run package regression suite**

Run: `pnpm --filter @sdkwork/react-magiccut test`
Expected: PASS

- [ ] **Step 3: Run build verification**

Run: `pnpm --filter @sdkwork/react-magiccut build`
Expected: PASS

- [ ] **Step 4: Run typecheck verification**

Run: `pnpm --filter @sdkwork/react-magiccut typecheck`
Expected: local package clean; report any external workspace blockers explicitly if they remain.

## Chunk 4: Timeline Navigation And Retimed Edit Integrity

### Task 6: Define minimap viewport and navigation math in tests

**Files:**
- Create: `packages/sdkwork-react-magiccut/tests/timelineMinimap.test.ts`
- Create: `packages/sdkwork-react-magiccut/src/domain/timeline/minimap.ts`

- [ ] **Step 1: Write the failing test**

Add tests that verify:
- viewport lens coordinates track the visible timeline range
- minimum lens width still preserves full scroll coverage
- click/drag mapping resolves to the correct `scrollLeft`
- playhead time maps cleanly into minimap coordinates

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @sdkwork/react-magiccut test tests/timelineMinimap.test.ts`
Expected: FAIL because the minimap helper does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Add a package-local timeline helper that:
- resolves safe minimap duration
- computes viewport rect geometry
- converts pointer position back into scroll offset
- converts playhead time into minimap x-position

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @sdkwork/react-magiccut test tests/timelineMinimap.test.ts`
Expected: PASS

### Task 7: Wire the minimap into the timeline shell

**Files:**
- Modify: `packages/sdkwork-react-magiccut/src/components/Timeline/TimelineMinimap.tsx`
- Modify: `packages/sdkwork-react-magiccut/src/components/Timeline/MagicCutTimeline.tsx`

- [ ] **Step 1: Extend the UI to consume helper outputs**

Add a real viewport lens, playhead indicator, and drag/click navigation using the minimap helper instead of placeholder comments.

- [ ] **Step 2: Verify the visual integration manually**

Check that:
- the minimap overlays the timeline without blocking core editing
- dragging the lens scrolls the timeline horizontally
- clicking the minimap jumps the viewport predictably
- the playhead marker tracks playback position

### Task 8: Correct retimed edit operations in tests first

**Files:**
- Modify: `packages/sdkwork-react-magiccut/tests/timelineEditService.test.ts`
- Modify: `packages/sdkwork-react-magiccut/src/services/TimelineEditService.ts`

- [ ] **Step 1: Write the failing tests**

Add tests for retimed clips where `speed !== 1` covering:
- ripple trim start offset math
- backward trim clamping using source offset divided by speed
- roll trim start/end offset updates
- slip trim offset movement

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @sdkwork/react-magiccut test tests/timelineEditService.test.ts`
Expected: FAIL because existing edit math assumes 1x speed in several paths.

- [ ] **Step 3: Write minimal implementation**

Update `TimelineEditService` to scale source-offset deltas by clip speed and clamp start-edge movement using timeline-time availability derived from source offset.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @sdkwork/react-magiccut test tests/timelineEditService.test.ts`
Expected: PASS

## Chunk 5: Export Runtime Truth In The UI

### Task 9: Define runtime-driven export presentation rules in tests

**Files:**
- Create: `packages/sdkwork-react-magiccut/tests/exportRuntimePresentation.test.ts`
- Create: `packages/sdkwork-react-magiccut/src/domain/export/exportRuntimePresentation.ts`

- [ ] **Step 1: Write the failing test**

Add tests that prove:
- MP4 is recommended when WebCodecs MP4 is available
- WebM is recommended when it is the only real container path
- MediaRecorder MP4 is surfaced as a compatibility path, not best-quality
- the selected format falls back to the best available runtime option
- Smart HDR is marked unsupported until the renderer truly implements it

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @sdkwork/react-magiccut test tests/exportRuntimePresentation.test.ts`
Expected: FAIL because the presentation helper does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Add a package-local helper that converts raw runtime support into:
- format cards with availability, route, badge, and description
- a recommended format
- blocking reason when no format is actually exportable
- honest Smart HDR support state

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @sdkwork/react-magiccut test tests/exportRuntimePresentation.test.ts`
Expected: PASS

### Task 10: Replace misleading export affordances with runtime-driven UI

**Files:**
- Modify: `packages/sdkwork-react-magiccut/src/services/export/videoExportService.ts`
- Modify: `packages/sdkwork-react-magiccut/src/components/Export/ExportModal.tsx`

- [ ] **Step 1: Expose runtime support snapshot**

Add a service method that reports whether the current runtime can really export:
- MP4 through WebCodecs
- MP4 through MediaRecorder compatibility
- WebM through MediaRecorder

- [ ] **Step 2: Rebuild the modal around real capability**

Update the modal so it:
- loads runtime capability on open
- auto-falls back to a supported format
- renders format cards instead of pretending every option works
- disables Smart HDR until a true renderer path exists
- keeps audio as embedded-only
- removes decorative fake-preview controls

- [ ] **Step 3: Verify locally**

Run:
- `pnpm --filter @sdkwork/react-magiccut test tests/exportRuntimePresentation.test.ts`
- `pnpm --filter @sdkwork/react-magiccut build`

Expected: tests pass, package builds, any workspace-external declaration/type issues are reported explicitly.

## Chunk 6: Real Clip Flipping Instead Of Fake Buttons

### Task 11: Define clip flip transform rules in tests

**Files:**
- Create: `packages/sdkwork-react-magiccut/tests/clipTransform.test.ts`
- Create: `packages/sdkwork-react-magiccut/src/domain/transform/clipTransform.ts`

- [ ] **Step 1: Write the failing test**

Add tests that prove:
- legacy transforms gain `scaleX/scaleY = 1`
- horizontal and vertical flip toggles only affect the intended axis
- render scale factors combine uniform scale with axis-specific scale

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @sdkwork/react-magiccut test tests/clipTransform.test.ts`
Expected: FAIL because the helper does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Add a transform helper that:
- normalizes clip transforms
- toggles horizontal and vertical flip states
- derives effective render scales for renderer/text paths

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @sdkwork/react-magiccut test tests/clipTransform.test.ts`
Expected: PASS

### Task 12: Wire real flip state into UI and renderer

**Files:**
- Modify: `packages/sdkwork-react-types/src/magiccut.types.ts`
- Modify: `packages/sdkwork-react-magiccut/src/components/Properties/panels/VisualTransformPanel.tsx`
- Modify: `packages/sdkwork-react-magiccut/src/components/Properties/MagicCutPropertyPanel.tsx`
- Modify: `packages/sdkwork-react-magiccut/src/components/Properties/panels/ImageSettingsPanel.tsx`
- Modify: `packages/sdkwork-react-magiccut/src/store/magicCutStore.tsx`
- Modify: `packages/sdkwork-react-magiccut/src/engine/WebGLEngine.ts`
- Modify: `packages/sdkwork-react-magiccut/src/engine/renderer/ClipRenderStrategies.ts`
- Modify: `packages/sdkwork-react-magiccut/src/engine/renderer/TimelineRenderer.ts`

- [ ] **Step 1: Extend the transform model**

Add optional `scaleX` and `scaleY` to the clip transform contract while keeping legacy `scale` semantics for backward compatibility.

- [ ] **Step 2: Update renderer math**

Use:
- `scale * scaleX` for horizontal render scale
- `scale * scaleY` for vertical render scale
- absolute effective scale for effect sizing and text oversampling

- [ ] **Step 3: Replace fake flip buttons with real toggles**

Update the transform panel so the flip buttons:
- toggle actual persisted state
- show active styling when a clip is mirrored
- preserve flip state when using fit/reset helpers unless the user explicitly resets everything

- [ ] **Step 4: Verify locally**

Run:
- `pnpm --filter @sdkwork/react-magiccut test tests/clipTransform.test.ts`
- `pnpm --filter @sdkwork/react-magiccut test`
- `pnpm --filter @sdkwork/react-magiccut build`
- `pnpm --filter @sdkwork/react-magiccut typecheck`

Expected: package tests pass, build passes, and any typecheck failure still comes only from workspace-external `sdkwork-react-core` issues.
