# Magic Studio Neutral Toolkit Operation Types Design

## Scope

- include: `sdkwork-magic-studio-server public TypeScript type names for toolkit command/operation results`
- include: `magic-studio-core job client public aliases`
- include: `useToolkitJob public operation type references`
- exclude: Rust enum/struct names, which are already implementation-local
- exclude: changing job payload shapes or runtime behavior

## Problem

The Rust server-first public TypeScript surface still exposes the legacy `Native` vocabulary:

- `MagicStudioToolkitNativeCommandResult`
- `MagicStudioToolkitNativeOperationResult`
- `MagicStudioToolkitNativeOperation`
- `ToolkitNativeCommandResult`
- `ToolkitNativeOperationResult`
- `ToolkitNativeOperation`

These names were reasonable when the local bridge was the primary execution model, but they are now wrong at the architectural level:

- the Rust server is the canonical capability boundary
- the job system models toolkit operations, not native bridge implementation details

## Options

### Option 1: Add neutral aliases but keep `Native` names

Pros:
- low churn

Cons:
- preserves technical debt in a greenfield app
- keeps the public surface semantically split

### Option 2: Rename only the server client types

Pros:
- improves the canonical contract package

Cons:
- magic-studio-core job client still re-exports `Native` names
- public developer experience remains inconsistent

### Option 3: Recommended

- rename `MagicStudioToolkitNativeCommandResult` -> `MagicStudioToolkitCommandResult`
- rename `MagicStudioToolkitNativeOperationResult` -> `MagicStudioToolkitOperationResult`
- rename `MagicStudioToolkitNativeOperation` -> `MagicStudioToolkitOperation`
- rename magic-studio-core aliases to `ToolkitCommandResult`, `ToolkitOperationResult`, `ToolkitOperation`
- update `useToolkitJob` to reference `ToolkitOperation`
- do not keep compatibility aliases

Pros:
- one consistent server-first vocabulary across packages
- removes stale bridge-era terminology
- no compatibility debt

Cons:
- coordinated rename across public type exports and tests

## Decision

Adopt Option 3.

## Design

### Server Package

Public names become:

- `MagicStudioToolkitCommandResult`
- `MagicStudioToolkitOperationResult`
- `MagicStudioToolkitOperation`

All method signatures and snapshot/result shapes should use the new names.

### React-Core Job Package

Public aliases become:

- `ToolkitCommandResult`
- `ToolkitOperationResult`
- `ToolkitOperation`

`useToolkitJob()` and related hooks should depend on `ToolkitOperation`.

### Behavior

No runtime behavior changes. This is a public type-identity cleanup only.

## Testing Strategy

- add source assertions in `sdkwork-magic-studio-server/src/client.test.ts` for neutral toolkit type names
- add source assertions in `sdkwork-magic-studio-core/src/platform/toolkit/__tests__/jobClient.test.ts` for neutral magic-studio-core job types
- run targeted Node tests for client and job client
- run broader server-first regression slice

## Success Criteria

- no public server TypeScript type name contains `ToolkitNative`
- no public magic-studio-core job type alias contains `ToolkitNative`
- `useToolkitJob` uses `ToolkitOperation`
- behavior and regressions remain green
