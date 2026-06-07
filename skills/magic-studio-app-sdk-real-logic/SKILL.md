---
name: magic-studio-app-sdk-real-logic
description: Guides Magic Studio remote business modules onto application-root product app SDK contracts. Use when integrating or repairing apps/magic-studio-v2 packages so they consume generated product SDK facades or typed injected product client ports instead of package-local HTTP or service shortcuts, or when a missing contract must be closed end to end before the workspace can ship.
---

# Magic Studio App SDK Real Logic

## Overview

Drive `apps/magic-studio-v2` to one remote-business path:

`src shell / feature package / store -> packages/sdkwork-magic-studio-core/src/sdk/useAppSdkClient.ts -> typed product app client port or generated product app SDK facade`

Keep Tauri, local filesystem, process, editor, media pipeline, and device work on native boundaries. Route only remote business capability through the shared product app SDK boundary. If a method is missing, close the backend/OpenAPI/generator gap first, then return and delete the workaround.

Treat every round as a recursive closure loop: self-review the touched app or client code, decide whether the next fix belongs in app or frontend code, backend or service code, or generator inputs, regenerate the SDK when contracts move, then review again until no higher-value gap remains.

## Progressive Loading

- Start with this file only.
- Load `references/architecture-map.md` only when boundary ownership or wrapper placement is unclear.
- Load `../../../SDK_INTEGRATION_STANDARD.md` only when lifecycle, env keys, or token rules matter.
- Load `../../ARCHITECT.md` only when package ownership or workspace layering is unclear.
- Load `references/verification.md` only before closing the round.

## Hard Rules

- Use application-root product SDK families or typed injected product client ports as the remote business boundary.
- Use dependency SDKs such as appbase, drive, search, and other declared SDK families through their own application-root SDK packages instead of copying their APIs into the Magic Studio product SDK.
- If the shared wrapper is incomplete, finish it in `packages/sdkwork-magic-studio-core` before editing feature packages.
- Keep Tauri plugins, local files, shell commands, editor runtime, and media processing out of the app SDK path.
- Replace package-local business HTTP with the wrapper path. Do not add raw `fetch`, generic HTTP helpers, manual auth headers, mock branches, or app-local SDK forks.
- Never hand-edit generated SDK output. Fix backend or generator inputs, then regenerate.
- Any table, column, index, migration, or embedded DB schema change requires user confirmation first.

## Default Loop

1. Classify the target as remote-business, local-native, or mixed.
2. Audit the touched package and `sdkwork-magic-studio-core` for raw HTTP, duplicated DTOs, manual headers, mock branches, or stale shortcuts.
3. Verify the real generated SDK export and the shared wrapper surface.
4. If the method exists, refactor to the wrapper path and delete the bypass.
5. If the method is missing, close the gap in the product-owned API/OpenAPI/generator inputs or inject a typed product client port until the generated product SDK family exists, then finish the integration.
6. If gap closure needs any schema change, stop and ask the user before touching DB structure.
7. Self-review the touched path. If a better next fix still belongs in app or frontend code, backend or service code, generator inputs, or adjacent cleanup, keep iterating instead of stopping at the first pass.
8. Run verification, then rescan adjacent packages and one extra global pass.

## Red Flags

- raw `fetch(`, `axios.`, or generic HTTP helpers in package service code
- manual `Authorization` or `Access-Token` assignment
- package-local SDK forks or DTO shims
- fake success fallback or timeout-based save simulation
- any unapproved migration, DDL, or embedded DB schema edit

## Completion Bar

- Remote business modules use the shared wrapper and product app SDK boundary.
- Local-only features still stay on the correct native boundary.
- No raw HTTP, manual header, mock bypass, or temporary fallback remains.
- Missing contracts are closed in backend/OpenAPI/generator inputs, and no schema change happened without approval.
- Relevant audit, typecheck, build, and host verification pass.
