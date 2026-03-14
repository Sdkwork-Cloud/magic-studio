# Local Media ToolKit Architecture

## Goal

Build a reusable local-first media foundation for video generation and editing applications on top of React + Tauri + Rust.

## Core Principles

- Local-first: media ingest, transcoding, caching, and metadata persistence should work without external services.
- Capability abstraction: UI/business modules call toolkit interfaces, never raw browser/tauri APIs.
- Runtime parity: same API surface for browser and desktop, with graceful fallback.
- Deterministic artifacts: every generated file has explicit path + metadata entry.

## Tool Domains

- Image: decode, metadata, resize, format conversion.
- Video: metadata, frame capture, ffprobe integration.
- Audio/Voice: metadata + microphone recording primitives.
- Speech: local speech synthesis/recognition abstraction for voice UX and command workflows.
- Recording: screen + mic capture as reusable recorder handles.
- Compression: zip/unzip via native bridge, JS fallback for in-memory entries.
- FFmpeg: native execution pipeline for transcode, concat, extract, normalize.
- File system: normalized read/write/exists/copy/remove wrappers.
- Database: sqlite command bridge for desktop + storage fallback for web.

## Rust Native Command Layer

Recommended command namespace:

- `media_ffmpeg_exec`
- `media_ffprobe_json`
- `db_execute`
- `db_query`
- `db_execute_batch`

Commands are invoked only through `runtime.bridge.invoke`, keeping JS surface stable.

## Suggested Open-Source Integrations

- FFmpeg:
  - Desktop: system ffmpeg/ffprobe via Rust command execution.
  - Optional: bundled ffmpeg binary management per platform.
- GStreamer (optional):
  - Desktop advanced pipeline for ultra-low-latency preview/encode workflows.
  - Can be bridged through Rust command adapters while preserving toolkit API.
- WebRTC / LiveKit (optional):
  - Real-time collaboration and live stream input for editor sessions.
  - Keep this as an extension layer above toolkit capabilities.
- OpenCV / imageproc (optional):
  - Native accelerated frame analysis, tracking, and vision effects pipeline.
  - Expose as extra Rust commands behind `runtime.bridge.invoke`.
- SQLite:
  - Desktop: `rusqlite` with `bundled` feature for consistent runtime.
  - Web fallback: runtime storage kv for lightweight preferences/state.
- Compression:
  - Desktop: Rust `zip` crate for file paths and large archives.
  - Web: JSZip for in-memory assets.
- Browser media:
  - `MediaRecorder`, `getUserMedia`, `getDisplayMedia` for cross-platform recording path.

## Localized Workflow for Video Products

1. Ingest: save all imported media into project-local storage roots.
2. Index: persist file descriptors and timeline metadata in sqlite.
3. Process: run ffmpeg tasks locally (preview proxy, transcode, extract audio, thumbnails).
4. Cache: maintain deterministic cache dirs for thumbnails/waveforms/proxy files.
5. Export: write output file + database export record + optional zip package.
6. Voice UX: run speech synthesis/recognition locally when browser/runtime supports it.

## Data Persistence Schema (Minimum)

- `projects`:
  - `id`, `name`, `created_at`, `updated_at`, `settings_json`
- `assets`:
  - `id`, `project_id`, `path`, `mime`, `size_bytes`, `duration_sec`, `meta_json`
- `jobs`:
  - `id`, `project_id`, `type`, `status`, `input_json`, `output_json`, `error`, `created_at`, `updated_at`
- `exports`:
  - `id`, `project_id`, `output_path`, `preset`, `status`, `meta_json`, `created_at`

## Reuse Strategy Across Apps

- Publish all capability APIs from `@sdkwork/react-core/platform`.
- Keep app-specific orchestration in feature packages (e.g. magiccut/video/audio).
- Add adapter injection points only at toolkit manager level to avoid API fragmentation.
