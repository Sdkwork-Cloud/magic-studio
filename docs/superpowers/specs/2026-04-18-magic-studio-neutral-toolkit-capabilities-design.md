# Magic Studio Neutral Toolkit Capabilities Design

## Scope

- include: `toolkit capability payload field naming`, `toolkit.media.available() capability source`
- exclude: route path changes
- exclude: internal Rust ffmpeg/ffprobe helper names
- exclude: native bridge command renaming in this document; bridge naming is handled separately by
  `2026-04-18-magic-studio-internal-bridge-command-neutralization-design.md`

## Problem

The public toolkit capability payload still exposes implementation tool names:

- `ffmpegAvailable`
- `ffprobeAvailable`

This conflicts with the server-first standard that external contracts must describe capabilities instead of underlying tools.

## Options

### Option 1: Rename both fields to generic aggregates

- `ffmpegAvailable` -> `mediaProcessingAvailable`
- `ffprobeAvailable` -> `mediaProbeAvailable`

Pros:
- easy one-to-one migration

Cons:
- `mediaProcessingAvailable` is still redundant because the public matrix already exposes `imageProcessing`, `videoProcessing`, and `audioProcessing`

### Option 2: Recommended

- remove public `ffmpegAvailable`
- rename `ffprobeAvailable` to `mediaProbeAvailable`
- keep `imageProcessing`, `videoProcessing`, and `audioProcessing` as the authoritative media processing capability flags
- make `toolkit.media.available()` depend on `mediaProbeAvailable`

Pros:
- public payload contains only user-meaningful capabilities
- avoids redundant aggregate flags
- aligns `toolkit.media.probe()` with `mediaProbeAvailable`

Cons:
- requires coordinated update in client typings, toolkit logic, and tests

### Option 3: Keep current payload and document it as internal

Pros:
- no code churn

Cons:
- leaks implementation details through a public API
- conflicts with the architecture standard

## Decision

Adopt Option 2.

## Design

### Public capability payload

Replace:

```json
{
  "ffmpegAvailable": true,
  "ffprobeAvailable": true,
  "imageProcessing": true,
  "videoProcessing": true,
  "audioProcessing": true
}
```

with:

```json
{
  "mediaProbeAvailable": true,
  "imageProcessing": true,
  "videoProcessing": true,
  "audioProcessing": true
}
```

### Frontend toolkit

`toolkit.media.available()` should represent whether media probing is available. Under server runtime it reads `mediaProbeAvailable`. Under bridge/system fallbacks it may still use implementation-specific checks internally.

### Internal implementation

Rust internals may continue to compute capability state from `ffmpeg` and `ffprobe`. The desktop
bridge command id for this capability is standardized separately as `media_probe_available`.

## Testing Strategy

- client tests assert the public client source no longer exposes `ffmpegAvailable` or `ffprobeAvailable`
- toolkit server test uses `mediaProbeAvailable` and verifies `toolkit.media.available()`
- Rust route test verifies `/api/core/v1/toolkit/capabilities` returns `mediaProbeAvailable` and does not return legacy tool-named fields

## Success Criteria

- no public TypeScript capability type exposes `ffmpegAvailable`
- no public TypeScript capability type exposes `ffprobeAvailable`
- toolkit capability JSON uses `mediaProbeAvailable`
- `toolkit.media.available()` stays functional
- internal ffmpeg/ffprobe implementation details remain encapsulated
- internal bridge transport uses the neutral `media_probe_available` capability id
