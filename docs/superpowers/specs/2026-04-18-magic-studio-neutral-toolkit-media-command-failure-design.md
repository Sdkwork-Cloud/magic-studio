# Magic Studio Neutral Toolkit Media Command Failure Design

## Scope

- include: `Rust toolkit public error code for non-zero media command exits`
- include: `Rust toolkit internal helper naming for media command success checks`
- exclude: changing direct media route error codes in `media.rs`
- exclude: changing internal ffmpeg bridge function names

## Problem

The Rust toolkit public error contract still exposes the implementation-specific code:

- `TOOLKIT_FFMPEG_NON_ZERO_EXIT`

This error is returned for non-zero command exits across toolkit media operations, including:

- image processing
- video processing
- audio processing
- recording

The message already describes the public operation, but the code still leaks the underlying tool.

## Options

### Option 1: Keep the existing code

Pros:
- no code churn

Cons:
- public toolkit failures still expose ffmpeg
- inconsistent with the neutral public vocabulary already established elsewhere

### Option 2: Operation-specific failure codes

- `TOOLKIT_IMAGE_RESIZE_FAILED`
- `TOOLKIT_VIDEO_TRANSCODE_FAILED`
- `TOOLKIT_RECORD_AUDIO_FAILED`
- etc.

Pros:
- very explicit

Cons:
- creates an unnecessarily large error-code surface
- higher maintenance cost without much extra client value

### Option 3: Recommended

- replace `TOOLKIT_FFMPEG_NON_ZERO_EXIT` with `TOOLKIT_MEDIA_COMMAND_FAILED`
- keep the existing operation-specific message text
- rename the internal helper to reflect media-command semantics

Pros:
- neutral public vocabulary
- compact and stable error taxonomy
- consistent with `ToolkitCommandResult`

Cons:
- small Rust test and helper rename

## Decision

Adopt Option 3.

## Design

### Public Error Code

Replace:

- `TOOLKIT_FFMPEG_NON_ZERO_EXIT`

with:

- `TOOLKIT_MEDIA_COMMAND_FAILED`

### Public Error Message

Retain the existing operation-oriented message shape:

- `{operationName} failed with code {exitCode}: {stderr}`

This is already public-contract-safe because it names the requested capability operation rather
than the underlying tool.

### Internal Helper

Rename:

- `ensure_ffmpeg_success(...)`

to:

- `ensure_media_command_succeeded(...)`

This keeps internal code aligned with the public contract and avoids accumulating naming debt.

## Testing Strategy

- add Rust regression tests for recording operations that receive a non-zero media command result
- assert the public code is `TOOLKIT_MEDIA_COMMAND_FAILED`
- assert the message does not mention `ffmpeg`
- run the full Rust host suite after the rename

## Success Criteria

- toolkit public failures no longer expose `TOOLKIT_FFMPEG_NON_ZERO_EXIT`
- non-zero command failures use `TOOLKIT_MEDIA_COMMAND_FAILED`
- internal helper naming matches the neutral public vocabulary
