---
name: magic-studio-cleanup-app-sdk-real-logic
description: Guides Magic Studio cleanup work toward the shared application-root product app SDK standard. Use when integrating or repairing apps/magic-studio-v2-type-contract-cleanup so cleanup converges on generated product SDK facades or typed injected product client ports instead of creating a second HTTP architecture, or when a missing contract must be closed end to end before cleanup can finish.
---

# Magic Studio Cleanup App SDK Real Logic

## Overview

Drive `apps/magic-studio-v2-type-contract-cleanup` toward the same generated app-SDK path as the main workspace:

`src shell / feature package / store -> packages/sdkwork-magic-studio-core/src/sdk/useAppSdkClient.ts -> typed product app client port or generated product app SDK facade`

This cleanup workspace must remove divergent contract and service patterns, not become a second architecture. If a method is missing, close the backend/OpenAPI/generator gap first, then return and delete the workaround.

Treat every round as a recursive closure loop: self-review the touched app or client code, decide whether the next fix belongs in app or frontend code, backend or service code, or generator inputs, regenerate the SDK when contracts move, then review again until no higher-value gap remains.

## Progressive Loading

- Start with this file only.
- Load `references/architecture-map.md` only when boundary ownership or cleanup scope is unclear.
- Load `../../../SDK_INTEGRATION_STANDARD.md` only when lifecycle, env keys, or token rules matter.
- Load app `AGENTS.md` only when workspace workflow is unclear.
- Load `references/verification.md` only before closing the round.

## Hard Rules

- Use application-root product SDK families or typed injected product client ports as the remote business boundary.
- Use dependency SDKs such as appbase, drive, search, and other declared SDK families through their own application-root SDK packages instead of copying their APIs into the Magic Studio product SDK.
- Cleanup work must converge on `packages/sdkwork-magic-studio-core`. Do not create a cleanup-only client, wrapper, or parallel contract namespace.
- Keep Tauri, local files, shell commands, and package tooling out of the app SDK path.
- Replace package-local business HTTP with the wrapper path. Do not add raw `fetch`, generic HTTP helpers, manual auth headers, compat DTO shims, or cleanup-only fallback branches.
- Never hand-edit generated SDK output. Fix backend or generator inputs, then regenerate.
- Any table, column, index, migration, or embedded DB schema change requires user confirmation first.

## Default Loop

1. Classify the target as remote-business, local-native, or mixed.
2. Audit the touched package and shared core for raw HTTP, duplicated DTOs, manual headers, stale aliases, or cleanup-only shortcuts.
3. Verify the real generated SDK export and the shared wrapper surface.
4. If the method exists, refactor to the standard wrapper path and delete the divergent cleanup path.
5. If the method is missing, close the gap in the product-owned API/OpenAPI/generator inputs or inject a typed product client port until the generated product SDK family exists, then finish cleanup.
6. If gap closure or cleanup convergence needs any schema change, stop and ask the user before touching DB structure.
7. Self-review the touched path. If a better next fix still belongs in app or frontend code, backend or service code, generator inputs, or adjacent cleanup, keep iterating instead of stopping at the first pass.
8. Run verification, then rescan adjacent packages and one extra global pass so no second architecture remains.

## Red Flags

- raw `fetch(`, `axios.`, or generic HTTP helpers in package service code
- manual `Authorization` or `Access-Token` assignment
- cleanup-specific client facades or second contract namespaces
- fallback branches left after the real SDK method exists
- any unapproved migration, DDL, or embedded DB schema edit

## Completion Bar

- Cleanup leaves one shared app-sdk architecture, not two.
- Remote business modules use the shared wrapper and product app SDK boundary.
- Local-only features still stay on the correct native boundary.
- No raw HTTP, manual header, alias, mock bypass, or cleanup-only fallback remains.
- Missing contracts are closed in backend/OpenAPI/generator inputs, and no schema change happened without approval.
- Relevant audit, typecheck, build, and host verification pass.
