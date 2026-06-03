# Magic Studio Typed Image Resize Design

## Scope

- include: `typed image resize route`, `typed image resize job vocabulary`, `shared Rust image resize DTO`, `sync/job parity`
- exclude: redesigning browser `toolkit.image` blob APIs
- exclude: introducing generalized image convert/optimize routes before a concrete need exists

## Problem

`resizeImage` is the last meaningful media transformation that still lives outside the canonical typed media standard.

- synchronous video and audio operations now use explicit resource-first routes and DTOs
- asynchronous jobs reuse the same typed video and audio DTOs
- image resize still exists as a toolkit-job-only ad hoc operation that manually constructs ffmpeg arguments inside `ToolkitService`

This leaves the public API inconsistent and keeps image transformation outside the shared service contract.

## Options Considered

### Option 1: Internal-only refactor

- keep `resizeImage` as a toolkit job name
- move its ffmpeg arg construction into `MediaService`
- do not add a public sync route

Pros:
- smallest code change

Cons:
- public API remains asymmetrical
- no canonical sync/job image vocabulary
- keeps image operations as second-class citizens in the server contract

### Option 2: Typed route with legacy job name

- add `/api/core/v1/media/image/resize`
- keep async job kind as `resizeImage`

Pros:
- introduces sync typed image route quickly

Cons:
- sync route and async job still use different naming conventions
- preserves unnecessary vocabulary drift in a greenfield application

### Option 3: Recommended

- add `POST /api/core/v1/media/image/resize`
- introduce `ImageResizeRequest { inputPath, outputPath, width, height, overwrite }`
- rename async job kind from `resizeImage` to `imageResize`
- route handler and async job both delegate to shared `MediaService::image_resize[_controlled]`

Pros:
- resource-first naming matches `videoTranscode`, `videoTrim`, `audioConvert`, `audioMix`
- sync route and async jobs share the same DTO and service code path
- removes the last major typed-media outlier without compatibility baggage

Cons:
- slightly larger migration than an internal-only refactor

## Decision

Adopt Option 3.

## Design

### Canonical route

Add:

```text
POST /api/core/v1/media/image/resize
```

The route belongs to the core media surface and is derived from the canonical contract JSON like the rest of the typed media family.

### Canonical DTO

Use a single Rust/TypeScript-aligned payload:

```json
{
  "inputPath": "/workspace/input.png",
  "outputPath": "/workspace/output.png",
  "width": 1024,
  "height": 1024,
  "overwrite": true
}
```

Rules:

- `inputPath` must be non-empty and policy-readable
- `outputPath` must be non-empty and policy-writable
- `width` and `height` must be positive integers
- `overwrite` defaults to `true`

### Service boundary

`MediaService` becomes the single owner of image resize validation and ffmpeg argument construction.

- add `ImageResizeRequest`
- add `image_resize()`
- add `image_resize_controlled()`

`ToolkitService` must stop assembling resize ffmpeg args directly and instead call the typed media service, exactly like typed video and audio jobs already do.

### Async job vocabulary

Rename the job operation from:

- `resizeImage`

to:

- `imageResize`

This aligns image jobs with the resource-first typed media vocabulary already established elsewhere.

### Error handling

Continue using the standard problem envelope and existing media service validation rules.

- malformed payloads: `400`
- policy denials: `403`
- removed legacy job kinds: request rejection during deserialization/validation

## Testing Strategy

- contract parity test must require `/api/core/v1/media/image/resize`
- TypeScript client tests must cover `mediaImageResize()` and reject legacy `resizeImage` job vocabulary
- frontend job client tests must submit canonical `imageResize` payloads
- Rust route tests must cover:
  - new image resize route wired
  - new image resize job accepted
  - legacy `resizeImage` job rejected
- broader server-first regression slice must stay green

## Success Criteria

- image resize is part of the canonical server contract
- sync and async image resize share one DTO and one service implementation path
- public async jobs no longer expose `resizeImage`
- no public route or client surface leaks raw ffmpeg semantics for image resize
