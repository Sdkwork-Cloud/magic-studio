# Magic Studio Tauri Framework Contract Neutralization Design

## Scope

- include: `src-tauri/src/framework/services/toolkit.rs` capability payload field naming
- include: `src-tauri/src/framework/services/toolkit.rs` public toolkit error codes and recording notes
- include: `src-tauri/src/framework/services/media.rs` public media/probe error taxonomy
- include: `src-tauri` desktop toolkit contract parity with the canonical Rust server host
- exclude: deep private trait method renaming across both Rust runtimes
- exclude: public server route changes

## Problem

The canonical Rust server host already exposes neutral capability and media error contracts, but the
desktop `src-tauri` framework layer still carries older tool-specific vocabulary:

- `ToolkitCapabilityMatrix` fields `ffmpeg_available` and `ffprobe_available`
- toolkit failure codes such as `TOOLKIT_FFMPEG_NON_ZERO_EXIT`
- recording availability errors such as `TOOLKIT_FFMPEG_NOT_AVAILABLE`
- recording notes that mention the backend implementation directly
- media service error codes such as `MEDIA_FFMPEG_*` and `MEDIA_FFPROBE_*`

This creates an avoidable split in standards:

- server host is capability-oriented
- desktop framework is still partially tool-oriented

For a greenfield application, two competing contracts are unnecessary debt.

## Options

### Option 1: Leave `src-tauri` as an internal exception

Pros:
- no code churn

Cons:
- desktop protocol remains inconsistent with the server-first standard
- future desktop consumers inherit the wrong vocabulary
- the repo keeps two parallel error taxonomies for the same media domain

### Option 2: Rename only the capability payload fields

Pros:
- fixes the most visible leak in `ToolkitCapabilityMatrix`

Cons:
- media and recording errors still leak tool-specific terminology
- server host and desktop framework still diverge semantically

### Option 3: Recommended

- align `ToolkitCapabilityMatrix` with the server-host `mediaProbeAvailable` standard
- rename public toolkit/media error codes and messages to neutral vocabulary
- remove backend-revealing recording notes
- keep deep private `ffmpeg`/`ffprobe` method names for a later pure-implementation cleanup batch

Pros:
- one desktop/server contract standard
- cleans the public desktop framework surface without overextending the batch
- reduces future refactor risk because downstream code sees one vocabulary

Cons:
- requires coordinated tests in `src-tauri` services

## Decision

Adopt Option 3.

## Design

### Desktop Toolkit Capability Payload

Replace the desktop-only toolkit capability payload fields:

- `ffmpegAvailable`
- `ffprobeAvailable`

with:

- `mediaProbeAvailable`

The authoritative processing flags remain:

- `imageProcessing`
- `videoProcessing`
- `audioProcessing`
- `audioRecording`
- `screenRecording`

This matches the canonical server-host contract.

### Desktop Toolkit Error Contract

Non-zero media command failures should use:

- `TOOLKIT_MEDIA_COMMAND_FAILED`

Recording capability failures should use:

- `TOOLKIT_AUDIO_RECORDING_NOT_AVAILABLE`
- `TOOLKIT_SCREEN_RECORDING_NOT_AVAILABLE`

Messages must describe capability state rather than backend tool requirements.

### Desktop Recording Result Notes

Remove backend notes such as:

- `audio capture uses ffmpeg native backend`
- `screen capture uses ffmpeg platform grab device`

Those notes are implementation leakage, not useful contract data.

### Desktop Media Service Error Contract

Shared media command execution errors should use:

- `MEDIA_COMMAND_ARGS_EMPTY`
- `MEDIA_COMMAND_EXEC_FAILED`
- `MEDIA_COMMAND_STDOUT_MISSING`
- `MEDIA_COMMAND_STDERR_MISSING`
- `MEDIA_COMMAND_CANCELLED`
- `MEDIA_COMMAND_WAIT_FAILED`

Probe-specific failures should use:

- `MEDIA_PROBE_INPUT_EMPTY`
- `MEDIA_PROBE_EXEC_FAILED`
- `MEDIA_PROBE_FAILED`
- `MEDIA_PROBE_JSON_PARSE_FAILED`

Messages should use `media command` and `media probe` wording instead of `ffmpeg` and `ffprobe`.

### Testing Strategy

- add `src-tauri` media service tests for neutral empty-args and empty-input failures
- add `src-tauri` toolkit tests for neutral capability payload serialization
- add `src-tauri` toolkit tests for recording capability failures, non-zero media command failures,
  and note removal
- run `cargo test --manifest-path src-tauri/Cargo.toml` if the local desktop toolchain supports it

## Success Criteria

- desktop `ToolkitCapabilityMatrix` no longer serializes `ffmpegAvailable` or `ffprobeAvailable`
- desktop toolkit errors no longer expose `TOOLKIT_FFMPEG_*`
- desktop recording errors and notes no longer mention `ffmpeg` or `ffprobe`
- desktop media service no longer exposes `MEDIA_FFMPEG_*` or `MEDIA_FFPROBE_*`
- desktop framework contract matches the server-host standard for these surfaces
