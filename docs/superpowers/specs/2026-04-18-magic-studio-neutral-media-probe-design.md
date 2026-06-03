# Magic Studio Neutral Media Probe Design

## Scope

- include: `neutral media probe route`, `neutral media probe client method`, `mediaProbe async job vocabulary`, `toolkit media inspection namespace`
- exclude: renaming internal Rust ffmpeg or ffprobe process helpers
- exclude: changing capability matrix field names in this batch

## Problem

The public API still leaks implementation tooling through:

- `/api/core/v1/media/ffprobe`
- `mediaFfprobeJson()`
- async job kind `probeMedia`
- frontend toolkit namespace `ffmpeg.probe()`

This violates the current server-first standard where external contracts should describe capabilities, not implementation tools.

## Options

### Option 1: Rename only the route

Pros:
- minimal change

Cons:
- TypeScript client, async jobs, and frontend toolkit still leak implementation names

### Option 2: Rename route and client only

Pros:
- reduces server contract leakage

Cons:
- public job and toolkit APIs remain inconsistent

### Option 3: Recommended

- route becomes `POST /api/core/v1/media/probe`
- TypeScript client becomes `mediaProbe(input)`
- async job kind becomes `mediaProbe`
- frontend toolkit namespace becomes `media.available()` and `media.probe()`
- internal Rust media service may continue to call `ffprobe`

Pros:
- public API speaks only in capability terms
- route, client, job, and toolkit names align
- internal implementation stays unchanged and low-risk

Cons:
- requires coordinated rename across more files

## Decision

Adopt Option 3.

## Design

### Route

Replace:

```text
POST /api/core/v1/media/ffprobe
```

with:

```text
POST /api/core/v1/media/probe
```

Request body remains:

```json
{
  "input": "/workspace/video.mp4"
}
```

The `input` field remains intentionally generic because probe supports local files and URL-like inputs.

### TypeScript client

Replace:

- `mediaFfprobeJson(input)`

with:

- `mediaProbe(input)`

### Async jobs

Replace:

- `probeMedia`

with:

- `mediaProbe`

The payload shape remains `{ input: string }`.

### Frontend toolkit

Replace the public namespace:

- `toolkit.ffmpeg.available()`
- `toolkit.ffmpeg.probe(pathOrUrl)`

with:

- `toolkit.media.available()`
- `toolkit.media.probe(pathOrUrl)`

This keeps the capability public and useful while removing direct implementation naming from the toolkit surface.

### Internal implementation

Do not rename:

- `ffprobe_json()`
- `ffmpeg_available()`
- runtime bridge command names

These remain internal implementation details.

## Testing Strategy

- contract parity test requires `/api/core/v1/media/probe`
- client tests cover `mediaProbe()` and reject `probeMedia` public vocabulary
- Rust tests cover:
  - `/api/core/v1/media/probe` route is wired
  - legacy `/api/core/v1/media/ffprobe` is not public
  - `mediaProbe` job is accepted
  - `probeMedia` job is rejected
- frontend toolkit tests cover `toolkit.media.*` and absence of `toolkit.ffmpeg`

## Success Criteria

- no public route contains `ffprobe`
- no public TypeScript client method contains `ffprobe`
- no public async job kind contains `probeMedia`
- no public frontend toolkit namespace contains `ffmpeg`
- Rust internals remain implementation-focused and stable
