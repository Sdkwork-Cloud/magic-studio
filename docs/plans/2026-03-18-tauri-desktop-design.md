# Tauri Desktop Experience Design

## Goal

Make `magic-studio-v2` behave like a polished desktop application when running inside Tauri while preserving a clean web experience in the browser.

## Current State

- The project already contains a functional `src-tauri/` host and can produce a Windows NSIS installer.
- Desktop detection exists in `packages/sdkwork-react-core/src/platform/platform.ts`, but desktop-aware UX rules are not consistently applied across layouts.
- The current Tauri configuration is split between development and production:
  - `src-tauri/tauri.conf.json` uses a frameless transparent window.
  - `src-tauri/tauri.prod.conf.json` uses standard decorations and overlay title bar.
- Sidebar entries are driven by `packages/sdkwork-react-settings/src/constants.ts`, so desktop-only visibility rules are not centralized.
- The existing `WindowControls` component is a basic static control cluster and does not yet provide a professional desktop title bar experience.

## Design Principles

### 1. One Desktop Shell Rule Set

Desktop behavior should be determined by platform capability instead of ad-hoc page checks. Layouts should ask the platform whether the app is running in a desktop shell and render shell-only affordances from that answer.

### 2. Desktop-Only CTAs Must Disappear in Desktop

Prompts such as `Download App` are useful for web conversion but become noise inside the installed desktop app. They should be filtered automatically when the runtime is desktop, without requiring user settings changes.

### 3. Development and Production Must Feel the Same

The Tauri window model should be aligned so that `pnpm tauri:dev` and packaged desktop builds share the same title bar assumptions, button placement, and drag behavior.

### 4. Windows-First Polish, Cross-Platform Safety

The main target for this iteration is a refined Windows desktop experience. The implementation should remain compatible with macOS/Linux, but the design should optimize first for Windows title bar conventions and custom controls.

## Target Architecture

### Frontend Platform Layer

Keep `@sdkwork/react-core` as the platform contract owner and runtime selector.

Add or refine platform APIs so the UI can consume:

- whether the runtime is desktop
- whether native window controls should be shown
- whether the window is maximized
- window actions for minimize, maximize/restore, close

The platform layer remains the only place that knows about Tauri internals.

### Sidebar Visibility

Sidebar templates remain configurable, but runtime-only filtering is added on top:

- configuration defines the superset of entries
- runtime desktop filtering removes `Download App` and similar web-only conversion entries

This preserves settings compatibility while ensuring correct behavior in desktop mode.

### Desktop Title Bar

Introduce a reusable desktop title bar treatment for layouts that own the application chrome:

- visible only in desktop runtime
- dedicated drag region
- explicit no-drag interactive zones
- refined right-side window controls
- consistent spacing, hover, active, and danger states

The main shell and Magic Cut shell should align on shared title bar conventions rather than diverging into separate ad-hoc patterns.

## Interaction Design

### Sidebar

- In desktop mode, hide `Download App`.
- Keep the rest of the navigation structure intact.
- Preserve settings-driven item visibility for user-customizable entries.

### Header

- In desktop mode, show custom window controls at the top-right.
- In web mode, hide native window controls entirely.
- Ensure menus, selectors, and other controls are marked as non-draggable.
- Keep a central drag region so the window can be moved naturally.

### Window Controls

Provide a professional control cluster with:

- minimize
- maximize
- restore when already maximized
- close

Behavior expectations:

- hover and press feedback match desktop conventions
- close is visually distinguished as a destructive action
- maximize icon changes when window state changes

## Tauri Configuration

Unify development and production window assumptions:

- use the same custom-title-bar-compatible window model in dev and build
- keep frameless desktop shell behavior where the React UI owns the chrome
- standardize `beforeDevCommand` and `beforeBuildCommand` to `pnpm`

## Engineering Standardization

Add standard scripts:

- `pnpm tauri:dev`
- `pnpm tauri:build`
- `pnpm tauri:bundle`

Script behavior must match the name:

- `tauri:dev` starts desktop development
- `tauri:build` builds the desktop app
- `tauri:bundle` produces installer artifacts

## Verification

The implementation is complete when all of the following are true:

- `pnpm build` succeeds
- `cargo check` succeeds in `src-tauri/`
- `pnpm tauri:build` succeeds
- `pnpm tauri:bundle` succeeds
- desktop runtime hides `Download App`
- desktop runtime shows polished right-side window controls
- maximize/restore behavior works correctly
- web runtime does not show desktop-only window controls

## Risks and Mitigations

### Risk: Divergent layout behavior

Mitigation:
- centralize shell rules in shared utilities or shared components
- avoid duplicating desktop checks in multiple layouts

### Risk: Broken dragging due to interactive zones

Mitigation:
- explicitly mark drag and no-drag regions
- verify selectors, menus, and buttons remain clickable

### Risk: Configuration drift between dev and prod

Mitigation:
- align Tauri config strategy and script entry points in the same iteration
