# Magic Studio Cleanup Architecture Map

## Stack

- React + TypeScript + Vite
- pnpm workspace with shared feature packages
- Tauri desktop host

## Standard Remote Path

Use this path for any remote business capability backed by Magic Studio product SDK ownership:

`src shell / feature package / store -> packages/sdkwork-magic-studio-core/src/sdk/useAppSdkClient.ts -> typed product app client port or generated product app SDK facade`

Cleanup work must converge on this path. It must not create a cleanup-only parallel architecture.

## Local And Native Path

Keep these concerns on their original boundaries:

- Tauri commands and plugin bridges
- local files, shell/process access, dialogs, and device integration
- package orchestration and workspace tooling

Local-only capability should stay local even while adjacent business modules move to the generated SDK.

## Replace Or Remove

- cleanup-only service clients
- raw REST helpers in feature packages
- duplicate DTO mapping that only exists to hide a missing SDK method
- manual auth header assignment in service layers

## Contract Closure Rule

If a feature package needs a method that the generated app SDK does not expose:

1. Fix the product-owned API/OpenAPI/generator contract or declare the correct dependency SDK.
2. Regenerate the product app SDK from the repository-standard generator flow when the generated family exists.
3. Reconnect the package through the shared wrapper.
4. Delete the temporary bypass and any cleanup-only alias.

If that backend work would touch schema, migration, or embedded DB layout, pause and ask the user first.
