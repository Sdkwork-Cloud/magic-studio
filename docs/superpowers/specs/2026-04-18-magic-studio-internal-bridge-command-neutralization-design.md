# Magic Studio Internal Bridge Command Neutralization Design

## Scope

- include: `src-tauri internal Tauri command identifiers`
- include: `magic-studio-core desktop bridge invoke identifiers`
- include: `desktop media probe availability semantics`
- include: `architecture docs that still publish legacy bridge command ids`
- exclude: public server route path changes
- exclude: private Rust service method renaming

## Problem

The public server-first contract is now capability-oriented, but the remaining desktop bridge layer
still exposes implementation-loaded command ids:

- `media_ffmpeg_available`
- `media_ffmpeg_exec`
- `media_ffprobe_json`
- `native_zip_bytes`
- `native_unzip`
- `db_execute`
- `db_query`
- `db_execute_batch`

That leaves three architectural problems:

1. The internal protocol still publishes legacy tool names and transport history.
2. React desktop fallback and Tauri registration use a different vocabulary from the canonical Rust
   server.
3. `toolkit.media.available()` is publicly a probe capability, but the bridge command name implies
   command-execution availability instead.

For a greenfield codebase, this is unnecessary debt.

## Options

### Option 1: Keep legacy internal ids

Pros:
- no implementation churn

Cons:
- the desktop bridge remains the one boundary that still leaks tool names
- internal docs contradict the server-first standard
- future bridge consumers would inherit the wrong vocabulary

### Option 2: Rename only the obviously non-neutral ids

- `native_*` -> `compression_*`
- `db_*` -> `database_*`
- keep `media_ffmpeg_*`

Pros:
- smaller rename

Cons:
- the highest-value naming debt remains in the media command path
- the bridge still diverges from the public capability vocabulary

### Option 3: Recommended

- rename every bridge command id to capability-oriented names
- align `toolkit.media.available()` with probe availability semantics
- update React desktop fallback, Tauri command exports, command registration, and docs together

Proposed ids:

- `media_probe_available`
- `media_command_execute`
- `media_probe`
- `compression_zip_bytes`
- `compression_unzip`
- `database_execute`
- `database_query`
- `database_execute_batch`

Pros:
- one naming system across server routes, toolkit vocabulary, and bridge transport
- removes the last tool-name leakage at the protocol boundary
- fixes the `media.available()` semantic mismatch instead of only relabeling it

Cons:
- requires coordinated changes across TypeScript, Rust, tests, and docs

## Decision

Adopt Option 3.

## Design

### Naming Taxonomy

Internal bridge command ids follow:

- `<domain>_<operation>` for direct capability actions
- `<domain>_<subsystem>_<operation>` when the action belongs to a stable subsystem

Applied to this batch:

- `media_probe_available` for probe capability detection
- `media_command_execute` for local media-command execution
- `media_probe` for structured probe reads
- `compression_zip_bytes` for archive creation into memory
- `compression_unzip` for archive extraction
- `database_execute`, `database_query`, `database_execute_batch` for sqlite operations

### Media Probe Availability

`toolkit.media.available()` represents probe availability, not transcoding availability.

Desktop bridge behavior should therefore be:

- `media_probe_available` checks for `ffprobe`
- media-processing operations continue to validate command execution when they actually run

This matches the canonical server capability payload:

- `mediaProbeAvailable`

and avoids conflating probe reads with broader media processing.

### React-Core Desktop Fallback

`createPlatformToolKit.ts` must invoke only the neutral bridge ids listed above. Old strings such as
`media_ffprobe_json` and `db_execute` must disappear from the desktop fallback path entirely.

### Tauri Command Layer

The Tauri adapter surface should export and register the same neutral ids as React invokes. The Rust
service implementations may still keep private `ffmpeg_*` and `ffprobe_*` method names for now,
because those are no longer protocol identifiers.

### Documentation

Architecture docs must stop publishing the legacy bridge ids as recommended or existing command
names. The repository should describe one canonical internal protocol, not both the old and new
forms.

## Testing Strategy

- add a focused React desktop fallback test that exercises bridge-backed media, compression, and
  database flows and asserts the invoked neutral command ids
- add source assertions that Tauri command exports and registrations use only the neutral ids
- keep the existing server-first Node slice and Rust host regression suite green

## Success Criteria

- no bridge invoke call site uses `media_ffmpeg_*`, `native_*`, or `db_*`
- `src-tauri/src/main.rs` registers only neutral bridge command identifiers for these domains
- `toolkit.media.available()` uses `media_probe_available`
- architecture docs no longer publish the legacy internal ids as canonical
