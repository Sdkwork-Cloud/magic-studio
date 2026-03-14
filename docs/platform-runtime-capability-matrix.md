# Platform Runtime Capability Matrix

This document describes the cross-platform capability framework exposed from `@sdkwork/react-core/platform`.

## Runtime Entry

- API entry: `getPlatformRuntime()`
- Legacy compatibility entry: `platform`
- Global injection:
  - `window.__sdkworkPlatform`
  - `window.__sdkworkPlatformRuntime`

## Capability Matrix

| Domain | Runtime API | Web | Desktop (Tauri/Rust) | Notes |
| --- | --- | --- | --- | --- |
| Platform/OS | `runtime.system` | Yes | Yes | Platform kind, os type, path, theme, online, executable checks |
| Storage | `runtime.storage` | Yes | Yes | Backed by `localStorage` on web and Tauri store on desktop |
| File System | `runtime.fileSystem` | Yes | Yes | IndexedDB-backed VFS on web, native fs plugin on desktop |
| Network | `runtime.network` | Yes | Yes | Uses browser fetch (web) and tauri http plugin (desktop) |
| Window/App | `runtime.window`, `runtime.app` | Partial | Yes | Window controls are no-op on web |
| Dialog/Notify | `runtime.dialog` | Yes | Yes | Browser dialog/notification vs tauri plugin |
| Clipboard/Shell | `runtime.clipboard`, `runtime.shell` | Yes | Yes | Clipboard + external opener |
| PTY | `runtime.terminal` | Mock | Yes | Desktop uses rust `pty` commands |
| Embedded Browser | `runtime.browser` | No | Yes | Desktop implementation can evolve independently |
| Native Bridge | `runtime.bridge.invoke` | No | Yes | Unified command bridge for Rust extensions |

## ToolKit Matrix (`getPlatformToolKit()`)

| Tool Domain | API | Web | Desktop | Backing |
| --- | --- | --- | --- | --- |
| Image | `toolKit.image` | Yes | Yes | DOM decode/canvas |
| Video | `toolKit.video` | Yes | Yes | DOM metadata/capture + ffmpeg workflow wrappers |
| Audio | `toolKit.audio` | Yes | Yes | DOM metadata + ffmpeg convert/normalize/mix |
| Compression | `toolKit.compression` | Partial | Yes | JSZip entries + Rust zip/unzip for local paths |
| FFmpeg | `toolKit.ffmpeg` | No | Yes | Rust command bridge (`media_ffmpeg_*`) |
| Recorder | `toolKit.recorder` | Yes | Yes | MediaRecorder / getUserMedia / getDisplayMedia / camera |
| File Utilities | `toolKit.fileSystem` | Yes | Yes | runtime fs wrappers |
| Database | `toolKit.database` | KV fallback | SQLite + KV | Rust sqlite commands + `initSchema` + transaction helper |
| Speech | `toolKit.speech` | Yes | Partial | Web Speech API (synthesis/recognition) |
| Workspace | `toolKit.workspace` | Yes | Yes | standardized local directories for projects/media/cache/db |

## Migration Guidance

Prefer:

1. `getPlatformRuntime().<domain>.<method>`
2. `getPlatformToolKit().<domain>.<method>`

Fallback:

1. Existing `platform.<method>` calls remain valid.

## Local-First Rules for Media Apps

- Use `runtime.fileSystem` for all intermediate artifacts (frames, waveforms, transcodes, temp files).
- Use `toolKit.ffmpeg` and `toolKit.database` on desktop for deterministic local processing and metadata persistence.
- Use `toolKit.workspace.ensureLocalDirs()` to create stable local folder roots before ingest/export.
- Keep remote APIs optional; local editing and playback must not depend on network availability.
- Persist project/session state through sqlite (desktop) or runtime storage fallback (web).
