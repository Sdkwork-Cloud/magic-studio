> Migrated from `docs/platform-runtime-capability-matrix.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Platform Runtime Capability Matrix

This document defines the runtime capability model exposed from `@sdkwork/magic-studio-core/platform`.

## Runtime Entry

- API entry: `getPlatformRuntime()`
- Sync platform probe: `isDesktopShellRuntime`
- Runtime-family helpers:
  - `isBrowserHostedRuntimeKind()`
  - `isDesktopShellRuntimeKind()`
- Canonical runtime/public platform vocabulary owner: `@sdkwork/magic-studio-types`
- Shared window-runtime helpers for packages that cannot depend on `@sdkwork/magic-studio-core/platform`:
  - `readWindowPlatformRuntimeKind()`
  - `isBrowserHostedWindowPlatformRuntimeKind()`
  - `isDesktopWindowPlatformRuntimeKind()`
- Legacy compatibility entry: `platform`
- Global injection:
  - `window.__sdkworkPlatformRuntime`

## Runtime Capability Matrix

| Domain | Runtime API | Web | Server Host | Desktop (Tauri + embedded Rust server) | Notes |
| --- | --- | --- | --- | --- | --- |
| Platform/OS | `runtime.system` | Yes | Yes | Yes | Platform kind, os type, path, theme, online state, command existence |
| Storage | `runtime.storage` | Yes | Yes | Yes | `localStorage` in browser/server-host delivery, Tauri store on desktop |
| File System | `runtime.fileSystem` | Yes | Yes | Yes | IndexedDB-backed VFS on `web`; canonical Rust HTTP filesystem on `server` and desktop |
| Network | `runtime.network` | Yes | Yes | Yes | Browser fetch on web/server-host, desktop uses the same fetch semantics against embedded or standalone server |
| Window/App | `runtime.window`, `runtime.app` | Partial | Partial | Yes | Window controls remain desktop-shell only |
| Dialog/Notify | `runtime.dialog` | Yes | Yes | Yes | Browser dialog/notification vs Tauri plugins |
| Clipboard/Shell | `runtime.clipboard`, `runtime.shell` | Yes | Yes | Yes | Clipboard + external opener support |
| PTY | `runtime.terminal` | Mock | Mock | Yes | PTY remains desktop-shell only |
| Embedded Browser | `runtime.browser` | No | No | No | Reserved capability; disabled until a real native embedded-browser implementation exists |
| Native Bridge | `runtime.bridge.invoke` | No | No | Yes | Reserved for shell commands only, not business APIs |

Desktop bridge vocabulary is intentionally closed:

- runtime kind and public app platform vocabularies live in `@sdkwork/magic-studio-types`; `magic-studio-core` and shared window helpers must consume those definitions instead of re-declaring the string unions
- shell commands are limited to the `PlatformShellCommandName` set exported by `@sdkwork/magic-studio-core/platform/runtime`
- shell events are limited to `PlatformShellEventName`
- shell command and event naming authority lives in the dedicated runtime shell vocabulary module; bridge/platform code must not handwrite those identifiers
- public platform types must not expose generic raw `invoke` / `listen` methods; shell bridging is standardized behind `runtime.bridge`
- desktop product file operations must use `runtime.fileSystem`, which resolves to the canonical Rust HTTP filesystem on `server` and `desktop`, instead of direct `plugin-fs` imports
- browser, editor, and feature packages must not import `@tauri-apps/*` directly for product behavior

Standalone server-host delivery is also explicit:

- browser clients may promote from `web` to `server` after same-origin canonical host discovery
- `server` runtime uses browser capabilities for UI concerns, runtime-summary-backed system paths, and canonical Rust HTTP routes for server-owned product capabilities
- feature code must treat `server` as a first-class runtime kind, not as an implicit synonym of `web`
- SDK and app environment normalization must preserve `server` as a first-class public platform value once `window.__sdkworkPlatformRuntime.system.kind()` reports `server`
- app-facing environment accessors must read configuration lazily so same-origin runtime promotion does not get stuck behind an import-time `web` snapshot

## ToolKit Matrix (`getPlatformToolKit()`)

| Tool Domain | API | Web | Desktop | Backing |
| --- | --- | --- | --- | --- |
| Image | `toolKit.image` | Yes | Yes | Browser decode/canvas on web, canonical Rust server for native-heavy workflows on desktop |
| Video | `toolKit.video` | Yes | Yes | Browser metadata/capture on web, canonical Rust server media APIs on desktop |
| Audio | `toolKit.audio` | Yes | Yes | Browser media support on web, canonical Rust server media APIs on desktop |
| Compression | `toolKit.compression` | Partial | Yes | JS/web fallback in browser, canonical Rust server compression APIs on desktop |
| Media Probe | `toolKit.media` | No | Yes | Canonical Rust server media inspection APIs |
| Recorder | `toolKit.recorder` | Yes | Yes | MediaRecorder / getUserMedia / getDisplayMedia / camera |
| File Utilities | `toolKit.fileSystem` | Yes | Yes | Runtime file-system wrappers |
| Database | `toolKit.database` | KV fallback | SQLite + KV | Canonical Rust server SQLite APIs on desktop, storage fallback on web |
| Speech | `toolKit.speech` | Yes | Partial | Browser speech APIs where available |
| Workspace | `toolKit.workspace` | Yes | Yes | Standardized local directory conventions plus runtime file APIs |

## Standard Runtime Rules

1. Desktop business/toolkit/media/compression/database flows must target the canonical Rust server HTTP contract.
2. Tauri invoke commands must not be used as a hidden fallback for those business flows.
3. Desktop bootstrap must wait for embedded server readiness before initializing server-backed SDK/toolkit layers.
4. Capability discovery shown to the frontend must describe the actual host mode and deployment family returned by the canonical server.
5. Public frontend naming must stay runtime-neutral. Use `desktop` / `desktop shell` terminology in app-facing APIs; `Tauri` remains an implementation detail of the shell host.
6. Shared asset and storage DTOs must use `desktop-fs` for desktop-local storage and `desktop://` for explicit desktop-local locators when `assets://` is not the canonical managed URI.

## Migration Guidance

Prefer:

1. `getPlatformRuntime().<domain>.<method>`
2. `getPlatformToolKit().<domain>.<method>`
3. `isBrowserHostedRuntimeKind(...)` / `isDesktopShellRuntimeKind(...)` for host-family branching instead of open-coded string comparisons

Compatibility note:

- `platform` remains a legacy compatibility surface only
- new and migrated feature code should not add new `platform.*` calls when the runtime capability model already exposes the same behavior
- shared packages blocked from importing `getPlatformRuntime()` may use only `window.__sdkworkPlatformRuntime`
- shared packages that branch on runtime family must centralize `window.__sdkworkPlatformRuntime.system.kind()` behind one local helper instead of scattering raw runtime-string checks
- those local helpers should expose both browser-hosted and desktop-shell classifiers so `server` does not get reimplemented as ad hoc `web || server` checks

Desktop-specific note:

- use `runtime.bridge.invoke` only for shell concerns such as PTY and command-existence checks
- use `runtime.bridge.listen` only for shell events such as `pty-output:<sessionId>`
- do not add product/business workflows behind new Tauri command names
- do not branch on runtime-specific window globals in feature code; use `getPlatformRuntime().system.kind()` or `isDesktopShellRuntime`
- if a shared package cannot depend on `@sdkwork/magic-studio-core/platform`, it may only consume the injected `window.__sdkworkPlatformRuntime` capability global; `window.__sdkworkPlatform` is retired
- if a shared package needs runtime-family classification, it must expose one local helper and route all browser-hosted and desktop-shell checks through that helper
- do not reintroduce Tauri-local naming into shared asset models; keep desktop-local vocabulary runtime-neutral
- draggable desktop shell DOM details must go through shared UI helpers instead of handwritten `data-tauri-drag-region` attributes

## Local-First Rules for Media Apps

- Use `runtime.fileSystem` for intermediate local artifacts.
- Use `toolKit.media`, `toolKit.compression`, and `toolKit.database` through the canonical server on desktop.
- Use `toolKit.workspace.ensureLocalDirs()` to create stable local folder roots before ingest/export.
- Keep remote APIs optional; local editing and playback must not depend on public network access.
- Persist durable project/session state through canonical desktop sqlite APIs or web storage fallback.

