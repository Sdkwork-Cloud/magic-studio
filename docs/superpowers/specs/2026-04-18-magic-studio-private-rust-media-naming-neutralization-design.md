# Magic Studio Private Rust Media Naming Neutralization Design

## Scope

- include: `src-tauri/src/framework/services/media.rs` private `MediaService` method naming
- include: `src-tauri/src/framework/services/toolkit.rs` private media helper naming and test stub naming
- include: `src-tauri/src/commands/media_commands.rs` internal call-site alignment
- include: `packages/sdkwork-magic-studio-server/src-host/src/services/media.rs` private `MediaService` method naming
- include: `packages/sdkwork-magic-studio-server/src-host/src/services/toolkit.rs` private media helper naming and test stub naming
- include: `packages/sdkwork-magic-studio-server/src-host/src/routes/core.rs` internal call-site alignment
- exclude: public route path changes
- exclude: public contract JSON changes
- exclude: actual `ffmpeg` / `ffprobe` executable usage

## Problem

The public and protocol-facing Magic Studio contract is already standardized around neutral,
capability-oriented media vocabulary:

- `media_probe_available`
- `media_command_execute`
- `media_probe`
- `mediaProbeAvailable`
- `TOOLKIT_MEDIA_COMMAND_FAILED`

But the last private Rust layer still leaks implementation-specific names through traits, helpers,
and test doubles:

- `ffmpeg_available`
- `ffmpeg_exec`
- `ffmpeg_exec_controlled`
- `ffprobe_json`
- `with_ffmpeg_progress_args`
- `parse_ffmpeg_time_to_seconds`
- `run_ffmpeg_with_progress`

This is avoidable design debt in a greenfield application:

- the public standard says "media capability"
- the internal standard still says "specific backend tool"
- future contributors will keep propagating the wrong naming into new code

## Options

### Option 1: Leave private Rust naming untouched

Pros:
- no churn in stable private implementations

Cons:
- the repo preserves two semantic standards for the same domain
- future internal APIs will keep inheriting backend-specific wording
- architecture docs cannot honestly claim the media stack is standardized end-to-end

### Option 2: Rename only trait methods

Pros:
- removes the biggest internal abstraction leak

Cons:
- helper functions, test doubles, and call sites still normalize on `ffmpeg` / `ffprobe`
- the codebase remains semantically split within the same files

### Option 3: Recommended

- rename private media trait methods across both Rust runtimes
- rename toolkit progress helpers and test fixtures to the same neutral vocabulary
- update internal command and route call sites to consume the new private API names
- keep real executable names `ffmpeg` / `ffprobe` only where the runtime launches those binaries or
  checks command availability

Pros:
- one internal vocabulary across desktop and server-host runtimes
- preserves real backend execution while removing abstraction leakage
- gives future feature work a stable, standard internal naming baseline

Cons:
- requires coordinated changes across both runtimes and their tests

## Decision

Adopt Option 3.

## Design

### Internal Media Trait Standard

Use capability-oriented names for the private media trait in both runtimes:

- `ffmpeg_available` -> `media_command_available`
- `ffmpeg_exec` -> `media_command_execute`
- `ffmpeg_exec_controlled` -> `media_command_execute_controlled`
- `ffprobe_json` -> `media_probe`

These names describe what the abstraction does, not which binary currently implements it.

### Internal Toolkit Helper Standard

Use neutral helper names in toolkit services:

- `with_ffmpeg_progress_args` -> `with_media_progress_args`
- `parse_ffmpeg_time_to_seconds` -> `parse_media_progress_time_to_seconds`
- `run_ffmpeg_with_progress` -> `run_media_command_with_progress`

These helpers are shared orchestration primitives and should not encode a backend tool name in the
helper identity.

### Test Fixture Standard

Rename private test doubles and fixture fields to match the standardized runtime vocabulary:

- `ffmpeg_available` -> `media_command_available`
- `ffmpeg_command_result` -> `media_command_result`
- `ffprobe_value` -> `media_probe_value`

Tests should model the architectural vocabulary the production code intends to preserve.

### Allowed Backend-Specific Terms

The following remain valid where they describe real implementation details rather than abstractions:

- `Command::new("ffmpeg")`
- `Command::new("ffprobe")`
- command policy checks such as `ensure_command_allowed("ffmpeg")`
- documentation that explicitly describes the backend implementation choice

The standard is not "never mention ffmpeg"; it is "do not expose backend tool names as the primary
abstraction boundary."

### Testing Strategy

- add a focused Node source-assertion test that rejects legacy private media helper names in the
  targeted Rust files
- run the source test first and confirm RED
- rename production and test code until the source test turns GREEN
- run both cargo suites and the existing Node parity slice afterward
- re-scan production paths for leftover private helper leaks

## Success Criteria

- no targeted Rust media trait, helper, or test-double name uses `ffmpeg_*` or `ffprobe_*` as its
  primary abstraction identity
- `src-tauri` and server-host runtimes use the same private media naming vocabulary
- public server-first behavior remains unchanged
- real executable launch points may still reference `ffmpeg` / `ffprobe` only as backend details
