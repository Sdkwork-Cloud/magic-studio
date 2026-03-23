# Magic Studio Architecture Map

## Stack

- React + TypeScript + Vite
- pnpm workspace with shared feature packages
- Tauri desktop host

## Standard Remote Path

Use this path for any business capability backed by `spring-ai-plus-app-api`:

`src shell / feature package / store -> packages/sdkwork-react-core/src/sdk/useAppSdkClient.ts -> @sdkwork/app-sdk -> spring-ai-plus-app-api`

The wrapper lives in `packages/sdkwork-react-core`, not in each individual package.

## Local And Native Path

Keep these concerns on their original boundaries:

- Tauri commands and plugin bridges
- local files, shell/process access, dialogs, and device integration
- editor runtime and media-processing pipelines
- package orchestration and workspace tooling

Local-only capability should stay local even while adjacent business modules move to the generated SDK.

## Replace Or Remove

- raw REST helpers in feature packages
- duplicate DTO mapping that only exists to hide a missing SDK method
- package-local backend clients that bypass the shared wrapper
- manual auth header assignment in service layers

## Contract Closure Rule

If a feature package needs a method that the generated app SDK does not expose:

1. Fix the contract in `spring-ai-plus-app-api` and required backend modules.
2. Regenerate the shared app SDK from the repository-standard generator flow.
3. Reconnect the package through the shared wrapper.
4. Delete the temporary bypass.

If that backend work would touch schema, migration, or embedded DB layout, pause and ask the user first.
