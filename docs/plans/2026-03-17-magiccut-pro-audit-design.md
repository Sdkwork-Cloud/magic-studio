# MagicCut Pro Audit Design

**Date:** 2026-03-17

## Goal

Bring `packages/sdkwork-react-magiccut` closer to an AI-era professional editing baseline by fixing the highest-leverage workflow, interaction, and performance problems while documenting the remaining product gaps against leading editors.

## Benchmark Signals

The professional bar used for this pass comes from official product capability guidance:

- Adobe Premiere Pro emphasizes text-based editing, transcription, and caption translation.
- DaVinci Resolve emphasizes AI-powered editing assistance, dialogue tools, and advanced professional finishing.
- Final Cut Pro emphasizes timeline organization, captions, roles, and browser-driven editorial speed.
- CapCut emphasizes AI-first creation flows such as script-to-video and rapid auto-caption style workflows.

These products differ in market position, but they agree on a few baseline expectations:

1. Core transport and timeline shortcuts must feel reliable and immediate.
2. Asset browsing must stay responsive while the editor state changes.
3. Caption/subtitle workflows must feel first-class, not bolted on.
4. AI entry points must shorten workflows instead of introducing friction or hidden failure modes.

## Current State Summary

`@sdkwork/react-magiccut` already has strong structural ambition:

- Multi-panel editing layout with resource browser, player, timeline, properties, export, templates, and AI generators.
- WebGL-based preview path, offline export path, and domain-driven timeline logic.
- Voice generation and script-driven caption cue generation.
- Rich shortcut manifest, edit tools, minimap, snapping, skimming, and linked selection.

The biggest quality problems are not “missing everything”; they are inconsistent finishing around critical workflows:

- Professional J/K/L transport exists in `PlayerController` but is not wired through the active shortcut layer.
- Resource browser fetching is coupled to `state.resources`, which can cause unnecessary remote reloads when local editor state changes.
- Search input issues remote queries on every keystroke with no debounce.
- Favorite toggling is broken on skimmable visual asset cards.
- Subtitle tracks exist in the type system and auto-caption flow, but they are not treated as first-class tracks in the add-track UI and visual presentation.
- Proxy support exists only as a simulation service and is not production-ready.
- There is no transcript-driven editing, scene detection, silence removal, multicam workflow, or AI-assisted rough cut pipeline exposed in the editor UX.

## Recommended Approach

Use a two-track approach:

1. Fix the highest-confidence workflow and performance defects immediately.
2. Document the larger benchmark gaps that need separate feature work.

This pass should prioritize issues that make the current editor feel unreliable or unfinished even before larger AI features are added.

## Scope For This Iteration

### Ship in code now

- Repair J/K/L transport wiring so professional playback shortcuts drive the real playback controller.
- Decouple remote asset loading from local resource mutations and debounce search-driven queries.
- Restore working favorite interactions on visual asset cards.
- Promote subtitle tracks to first-class timeline citizens in factory config and add-track UI.

### Document but do not fully build in this iteration

- Real proxy transcoding and proxy switching UI.
- Transcript-first editing and speech-to-text for arbitrary clips.
- Silence detection, scene detection, multicam, and role-based finishing workflows.
- Background analysis jobs, collaboration review, and comment workflows.

## Architecture Decisions

### Transport

- The playback controller remains the single authority for playback timing.
- Shortcut handling must delegate J/K/L transport commands into `PlayerController`, not mutate transient transport state directly.

### Resource Browser

- Remote queries should depend on remote-facing inputs only: category, page, and debounced search query.
- Local editor resources should be derived locally and merged into the displayed collection without forcing a network refresh.

### Captions / Subtitle Tracks

- Subtitle tracks should use explicit config, labels, and visual affordances instead of falling back to generic track styling.
- Auto-caption output should land in a track type the user can understand and add manually.

### Favorites

- Asset cards should surface actionable favorite controls consistently across browsing modes.

## Testing Strategy

Use TDD for every behavior change:

- Add regression coverage for transport shortcut routing.
- Add coverage for resource-collection helpers used by the asset panel.
- Add coverage for subtitle track factory behavior.
- Add a component-level regression test for visual asset favorite toggling if feasible within current test tooling.

## Verification

Minimum required verification before claiming success:

- `pnpm --filter @sdkwork/react-magiccut test`
- `pnpm --filter @sdkwork/react-magiccut typecheck`
- `pnpm --filter @sdkwork/react-magiccut build`

## Remaining Product Gaps After This Pass

- No transcript-based editing surface comparable to Premiere Pro text-based editing.
- No genuine proxy generation pipeline comparable to pro offline/online workflows.
- No AI analysis pipeline for scene detection, silence removal, or rough-cut generation.
- No first-class collaboration/review model.
- No dedicated caption browser/editor or role-based organization comparable to mature pro NLEs.

## Decision

Proceed with a focused professionalization pass: repair transport correctness, stabilize asset browsing performance, make favorites trustworthy, and upgrade subtitle tracks to first-class UX while documenting the larger AI-era roadmap gaps.
