> Migrated from `docs/standards/agi-native-contract-checklist.md` on 2026-06-24.
> Owner: SDKWork maintainers

# AGI-Native Contract Checklist

This checklist defines the minimum bar for Magic Studio V2 as an AGI-native, asset-first, uuid-first application.

## Mandatory Standards

1. Client entities are `uuid`-first.
2. Database `id` is optional before persistence and is never the only client-side identity.
3. Generated image, video, audio, speech, and music outputs must be traceable through canonical generation contracts.
4. Business truth is asset-centered. Resolved delivery URLs are views, not domain identity.
5. `canvas`, `film`, and `magiccut` must converge on one shared `projectGraph`.
6. Store/runtime normalization must preserve shared graph state instead of treating it as ad hoc metadata.
7. Surface editors must persist normalized graph-aware entities through canonical service boundaries.

## Automated Checks

The script `scripts/check-agi-native-standards.mjs` currently enforces:

1. `uuid`-first identity helpers remain in shared base types.
2. Shared `ProjectGraphDocument` and graph-source helpers remain defined.
3. Canvas, Film, and MagicCut root project types continue to expose `projectGraph`.
4. Canvas continues to emit shared project graph output on export.
5. Film continues to build and normalize shared project graphs, and Film store persists through `filmService.saveProject`.
6. MagicCut normalized runtime state continues to carry and preserve `projectGraph`.

## Current Follow-Up Backlog

The following are still active tightening targets and should be moved under automated governance next:

1. Eliminate URL-first UI callbacks such as `onSuccess(url: string)` in generation modals and previews.
2. Remove remaining `Promise<string>` generation or remix boundaries where the returned string is still a business artifact instead of a delivery helper.
3. Expand static checks to catch id-only entity comparisons in shared client-side business logic.
4. Add CI wiring so the standards script runs automatically with the workspace regression suite.

