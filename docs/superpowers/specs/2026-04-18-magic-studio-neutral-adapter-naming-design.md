# Magic Studio Neutral Adapter Naming Design

## Scope

- include: `magic-studio-core internal media-probe parsing helper names`
- include: `Rust route-layer concat request DTO naming`
- exclude: low-level service methods that intentionally wrap ffmpeg/ffprobe binaries
- exclude: changing public routes, client methods, or payload shapes

## Problem

The public API surface has already been neutralized, but a few adapter-layer names directly adjacent
to that public surface still carry retired tool vocabulary:

- `parseFfprobeAsVideoMetadata`
- `parseFfprobeAsAudioMetadata`
- `MediaFfmpegConcatRequest`

These names are not public contracts, but they sit in high-level adapters where the canonical
vocabulary should remain aligned with the public server-first architecture.

## Options

### Option 1: Keep current internal names

Pros:
- zero code churn

Cons:
- leaves low-value naming debt near the public boundary
- makes public and adapter layers use different vocabularies for the same concepts

### Option 2: Recommended

- rename probe parsing helpers to `parseMediaProbeAs...`
- rename route-layer concat DTO to `MediaVideoConcatRequest`
- keep low-level service/binary wrapper names unchanged

Pros:
- high-level adapter code matches public vocabulary
- low implementation cost
- avoids overreaching into lower-level binary integration details

Cons:
- requires small source-assertion test updates

## Decision

Adopt Option 2.

## Design

### React-Core Helper Naming

Replace:

- `parseFfprobeAsVideoMetadata`
- `parseFfprobeAsAudioMetadata`

with:

- `parseMediaProbeAsVideoMetadata`
- `parseMediaProbeAsAudioMetadata`

### Rust Route DTO Naming

Replace:

- `MediaFfmpegConcatRequest`

with:

- `MediaVideoConcatRequest`

This aligns the route handler DTO with the public route:

- `/api/core/v1/media/video/concat`

## Testing Strategy

- add source assertions that old adapter-layer names are absent
- assert the new neutral names are present
- run focused Node regression for the affected source files

## Success Criteria

- high-level adapter names near the public boundary align with public vocabulary
- no public behavior changes
- low-level binary integration names remain untouched where appropriate
