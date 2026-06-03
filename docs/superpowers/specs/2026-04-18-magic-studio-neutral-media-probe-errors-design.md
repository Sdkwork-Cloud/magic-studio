# Magic Studio Neutral Media Probe Errors Design

## Scope

- include: `Rust media probe public error codes`
- include: `Rust media probe public error messages`
- include: `Rust shared media command public error codes in media.rs`
- include: `Rust tests for deterministic media probe error behavior`
- exclude: changing internal function name `ffprobe_json`

## Problem

The public route is already standardized as:

- `/api/core/v1/media/probe`

But the underlying public error contract still exposes ffprobe-specific vocabulary:

- `MEDIA_FFPROBE_INPUT_EMPTY`
- `MEDIA_FFPROBE_EXEC_FAILED`
- `MEDIA_FFPROBE_NON_ZERO_EXIT`
- `MEDIA_FFPROBE_JSON_PARSE_FAILED`
- messages such as `ffprobe input is required`

This creates an inconsistent public API where the route is capability-oriented but failures still
expose the underlying tool.

The same service file also exposed shared ffmpeg-specific command invocation codes such as:

- `MEDIA_FFMPEG_ARGS_EMPTY`
- `MEDIA_FFMPEG_EXEC_FAILED`
- `MEDIA_FFMPEG_CANCELLED`

Those codes can also surface publicly from direct media service execution paths, so they need the
same neutralization treatment.

## Options

### Option 1: Keep ffprobe-specific errors

Pros:
- zero implementation cost

Cons:
- public contract remains inconsistent
- route naming and error vocabulary describe different abstractions

### Option 2: Add aliases and keep old errors

Pros:
- safer in a legacy system

Cons:
- unnecessary compatibility debt for a greenfield app
- duplicates the public error taxonomy

### Option 3: Recommended

- rename all public `MEDIA_FFPROBE_*` codes to `MEDIA_PROBE_*`
- replace messages with media-probe wording
- keep the internal implementation based on ffprobe

Pros:
- route naming and error contracts align
- public API stays capability-oriented
- internal implementation remains encapsulated

Cons:
- requires deterministic command-fixture tests for non-zero exit and invalid JSON

## Decision

Adopt Option 3.

## Design

### Public Error Codes

Replace:

- `MEDIA_FFPROBE_INPUT_EMPTY` -> `MEDIA_PROBE_INPUT_EMPTY`
- `MEDIA_FFPROBE_EXEC_FAILED` -> `MEDIA_PROBE_EXEC_FAILED`
- `MEDIA_FFPROBE_NON_ZERO_EXIT` -> `MEDIA_PROBE_FAILED`
- `MEDIA_FFPROBE_JSON_PARSE_FAILED` -> `MEDIA_PROBE_JSON_PARSE_FAILED`

### Public Error Messages

Replace ffprobe-specific wording with media-probe wording:

- `media probe input is required`
- `media probe failed`
- `media probe response could not be parsed`

For non-zero exit, operational stderr should be preserved in `detail` while the top-level message
stays stable.

### Shared Media Command Error Codes

Replace shared ffmpeg-centric media command codes with neutral command vocabulary:

- `MEDIA_FFMPEG_ARGS_EMPTY` -> `MEDIA_COMMAND_ARGS_EMPTY`
- `MEDIA_FFMPEG_EXEC_FAILED` -> `MEDIA_COMMAND_EXEC_FAILED`
- `MEDIA_FFMPEG_STDOUT_MISSING` -> `MEDIA_COMMAND_STDOUT_MISSING`
- `MEDIA_FFMPEG_STDERR_MISSING` -> `MEDIA_COMMAND_STDERR_MISSING`
- `MEDIA_FFMPEG_CANCELLED` -> `MEDIA_COMMAND_CANCELLED`
- `MEDIA_FFMPEG_WAIT_FAILED` -> `MEDIA_COMMAND_WAIT_FAILED`

Shared public messages become:

- `media command args cannot be empty`
- `media command failed to start`
- `media command execution was cancelled`
- `media command wait failed`

## Testing Strategy

- add a test for empty input that requires no external command
- add a deterministic parse-output test for invalid JSON output
- use the real local `ffprobe` binary to validate non-zero exit handling against an invalid input file
- add a validation test for empty media command args
- assert that codes and messages no longer mention `ffprobe`
- assert that shared media command validation no longer mentions `ffmpeg`

## Success Criteria

- public media probe failures no longer expose `MEDIA_FFPROBE_*`
- public media command validation/execution failures no longer expose `MEDIA_FFMPEG_*`
- public media probe messages do not mention `ffprobe`
- public media command messages do not mention `ffmpeg`
- route and error vocabulary both describe `media probe`
