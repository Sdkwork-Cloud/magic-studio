# Magic Studio Neutral Recording Results Design

## Scope

- include: `Rust toolkit public recording error codes`
- include: `Rust toolkit public recording error messages`
- include: `Rust toolkit public recording notes payload semantics`
- exclude: renaming internal ffmpeg execution helpers
- exclude: changing recording operation names such as `recordAudio` and `recordScreen`

## Problem

The Rust server-first toolkit contract still leaks recording implementation details through public
result payloads:

- error code: `TOOLKIT_FFMPEG_NOT_AVAILABLE`
- error messages mention `ffmpeg/ffprobe`
- success `notes` reveal backend details such as `ffmpeg native backend`

These values are public because they flow through:

- `ToolkitOperationResult`
- job error envelopes returned by the Rust server

This breaks the server-first architecture standard already established elsewhere in the app:

- public contracts describe capabilities
- implementation tools remain internal

## Options

### Option 1: Keep current recording messages

Pros:
- no code churn

Cons:
- public API leaks implementation details
- inconsistent with the rest of the neutralized toolkit surface
- forces future clients to reason about ffmpeg rather than capabilities

### Option 2: Add neutral aliases while keeping old codes/messages

Pros:
- lower migration cost in a legacy system

Cons:
- preserves compatibility debt that this greenfield app explicitly rejects
- keeps two public vocabularies for the same capability

### Option 3: Recommended

- replace recording failure codes with capability-oriented codes
- replace recording failure messages with runtime-capability wording
- remove implementation-only success notes
- keep internal ffmpeg checks and execution paths private

Pros:
- public API remains capability-oriented and server-first
- avoids unnecessary compatibility baggage
- keeps implementation choice swappable without API churn

Cons:
- requires targeted Rust test updates

## Decision

Adopt Option 3.

## Design

### Public Failure Codes

Replace the shared implementation-specific failure code with operation-specific capability codes:

- `TOOLKIT_AUDIO_RECORDING_NOT_AVAILABLE`
- `TOOLKIT_SCREEN_RECORDING_NOT_AVAILABLE`

Reasoning:

- audio recording and screen recording are distinct public capabilities
- clients should be able to react to each capability independently

### Public Failure Messages

Replace tool-specific wording with capability wording:

- `audio recording is not available in the current runtime`
- `screen recording is not available in the current runtime`

This keeps the error contract stable even if the internal recording backend changes later.

### Public Success Payload

Set `ToolkitOperationResult.notes` to `None` for:

- `recordAudio`
- `recordScreen`

The current notes only expose backend details and do not carry stable business value. Omitting them
is the cleanest contract.

### Internal Implementation Boundary

The following remain internal implementation details and are not part of the public contract:

- `ffmpeg_available()` checks
- `build_record_audio_args(...)`
- `build_record_screen_args(...)`
- ffmpeg command arguments and platform capture devices

## Testing Strategy

- add Rust service-level regression tests in `toolkit.rs`
- assert recording availability failures return the new public codes/messages
- assert successful recording operations return `notes: None`
- assert the retired `TOOLKIT_FFMPEG_NOT_AVAILABLE` code is absent from recording results

## Success Criteria

- no public recording failure code exposes `FFMPEG`
- no public recording failure message mentions `ffmpeg` or `ffprobe`
- successful `recordAudio` and `recordScreen` operations return `notes: None`
- internal recording implementation remains unchanged behind the Rust service boundary
