# Magic Studio Neutral Media Command Result Design

## Scope

- include: `magic-studio-core public media command result type naming`
- include: `video/audio toolkit method return types`
- include: `magic-studio-core internal helper naming for command result flow`
- exclude: changing internal Rust service method names; bridge command renaming is specified
  separately by `2026-04-18-magic-studio-internal-bridge-command-neutralization-design.md`
- exclude: changing server API payload shapes that already use neutral command result types

## Problem

The public React toolkit still exposes the implementation-specific type name:

- `ToolkitFfmpegExecResult`

This leaks an execution tool into the public API even though the canonical Rust server contract already exposes neutral command result vocabulary through:

- `MagicStudioToolkitNativeCommandResult`

As a result, the public architecture is inconsistent:

- server-first surface is capability-oriented
- magic-studio-core media method return types still expose ffmpeg as part of the type identity

## Options

### Option 1: Add a neutral alias and keep the old type

- add `ToolkitMediaCommandResult`
- keep `ToolkitFfmpegExecResult = ToolkitMediaCommandResult`

Pros:
- small code churn

Cons:
- keeps the leaked implementation term in the public API
- creates avoidable compatibility debt in a greenfield app

### Option 2: Rename only the exported type

- replace `ToolkitFfmpegExecResult` with `ToolkitMediaCommandResult` in `types.ts`
- leave internal helper function names unchanged

Pros:
- removes the public leak
- lower implementation cost

Cons:
- internal helper names stay inconsistent with the new public vocabulary

### Option 3: Recommended

- replace `ToolkitFfmpegExecResult` with `ToolkitMediaCommandResult`
- update public video/audio toolkit method return types
- rename magic-studio-core helper plumbing from ffmpeg-centric result naming to media-command-centric naming
- keep the bridge command transport internal while standardizing its id as `media_command_execute`

Pros:
- public and local architecture use one consistent capability-oriented vocabulary
- avoids compatibility baggage
- keeps internal transport/tool names encapsulated

Cons:
- slightly broader rename across `types.ts`, `createPlatformToolKit.ts`, and tests

## Decision

Adopt Option 3.

## Design

### Public Type

Replace:

```ts
export interface ToolkitFfmpegExecResult {
  code: number;
  stdout: string;
  stderr: string;
}
```

with:

```ts
export interface ToolkitMediaCommandResult {
  code: number;
  stdout: string;
  stderr: string;
}
```

### Public Toolkit API

The following methods return `Promise<ToolkitMediaCommandResult>`:

- `toolKit.video.transcode(...)`
- `toolKit.video.trim(...)`
- `toolKit.video.concat(...)`
- `toolKit.video.extractAudio(...)`
- `toolKit.video.createThumbnail(...)`
- `toolKit.audio.convert(...)`
- `toolKit.audio.normalize(...)`
- `toolKit.audio.mix(...)`

### Internal React-Core Helpers

Rename helper naming to reflect public semantics:

- `runFfmpegStrict(...)` -> `runMediaCommandStrict(...)`
- `readServerCommandResult(...)` -> `readServerMediaCommandResult(...)`

The underlying bridge invocation remains internal:

- `runtime.bridge.invoke('media_command_execute', ...)`

because that is an internal implementation detail rather than a public API contract.

## Testing Strategy

- add source assertions that public `types.ts` exports `ToolkitMediaCommandResult`
- assert public `types.ts` no longer exports `ToolkitFfmpegExecResult`
- run existing toolkit server-route tests to prove runtime behavior is unchanged
- run broader Node server-first regression to catch downstream type/API drift

## Success Criteria

- no public magic-studio-core toolkit type exposes `ToolkitFfmpegExecResult`
- video/audio toolkit methods return `ToolkitMediaCommandResult`
- runtime behavior is unchanged
- internal bridge command names remain encapsulated
- the internal bridge transport uses the neutral `media_command_execute` id
