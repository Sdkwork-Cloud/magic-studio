# SDKWork React Canvas Infinite Interaction Design

## Goal

Polish `packages/sdkwork-react-canvas` so the infinite canvas feels coherent and dependable across pan, zoom, minimap navigation, node/group editing, and undo/redo.

## Current Issues

- Zoom math is split across wheel zoom, toolbar zoom buttons, reset, and minimap navigation, so viewport behavior is inconsistent.
- Minimap dragging depends on local mouse events and can lose control when the pointer leaves the minimap surface.
- Several canvas edits are transient-only updates and never create a real history entry, especially group resize and inline text/group-label edits.
- Parent group bounds are only re-fit during drag moves, so nudges, align/distribute, text resize, upload-driven media resize, and other geometry changes can leave group shells stale.

## Recommended Approach

Use one shared viewport utility layer and one shared group-fit path in the store, then route existing interactions through those helpers. Keep the public component structure intact and make the fixes incremental, test-backed, and low-risk.

## Architecture

### 1. Shared Viewport Math

Add a small pure utility module for:

- clamping zoom
- zooming around a screen anchor
- zooming around the viewport center
- centering the viewport on a world point

`CanvasBoard`, `CanvasZoomControls`, and `CanvasMinimap` should all call these helpers instead of re-implementing their own coordinate math.

### 2. Reliable Final Commits

Store-level mutations need a way to distinguish preview updates from committed history updates. For geometry/text edits that currently stream `updateElement(..., false)` repeatedly, add a committed path that records history once at the end of the interaction.

This applies to:

- group resize
- text editing
- note editing
- group label editing

### 3. Automatic Ancestor Group Re-fit

When a child element changes geometry, all ancestor groups should be recomputed consistently. This should happen for:

- move commits
- nudges
- align/distribute
- direct element update commits that touch `x`, `y`, `width`, or `height`
- text measurement updates
- media upload / generation size changes

### 4. Minimap Drag Robustness

Minimap dragging should use window-level move/up listeners while active so the interaction does not break when the pointer leaves the canvas element.

## Testing Strategy

Add focused unit tests around pure helpers instead of trying to boot the whole canvas runtime:

- viewport math helpers
- group-fit ancestor collection / geometry recompute
- history-safe export wiring where appropriate

## Non-Goals

- Re-architecting the entire canvas interaction state into a state machine
- Migrating the UI layer to a different event system
- Redesigning visual styling unrelated to infinite canvas interaction quality
