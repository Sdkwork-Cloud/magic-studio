# Tauri Desktop Experience Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the app behave like a polished Tauri desktop application with unified dev/build scripts, desktop-aware sidebar behavior, and refined native window controls.

**Architecture:** Keep `src-tauri/` as the native host and use the React platform layer as the single source of truth for desktop capability. Move desktop-aware presentation decisions into shared shell utilities and components so the main layout and desktop runtime stay aligned.

**Tech Stack:** React, TypeScript, Vite, pnpm, Tauri 2, Rust

---

### Task 1: Formalize Desktop Runtime Capabilities

**Files:**
- Modify: `packages/sdkwork-react-core/src/platform/types.ts`
- Modify: `packages/sdkwork-react-core/src/platform/platform.ts`
- Modify: `packages/sdkwork-react-core/src/platform/desktop.ts`
- Modify: `packages/sdkwork-react-core/src/platform/web.ts`

**Step 1: Write the failing test**

Document the expected surface before changing implementation:

- desktop runtime exposes `isDesktop = true`
- web runtime exposes `isDesktop = false`
- desktop runtime exposes window state helpers needed by title bar UI

**Step 2: Run the smallest verification**

Run:

```bash
pnpm build
```

Expected:
- build passes before refactor so later failures isolate the platform API changes

**Step 3: Implement minimal platform contract changes**

Add platform-level capability methods and desktop/window-state helpers needed by the UI without leaking Tauri-specific code into layouts.

**Step 4: Verify the platform refactor**

Run:

```bash
pnpm build
```

Expected:
- build passes with the expanded contract

### Task 2: Make Sidebar Desktop-Aware

**Files:**
- Modify: `packages/sdkwork-react-settings/src/constants.ts`
- Modify: `src/layouts/MainLayout/MainSidebar.tsx`

**Step 1: Write the failing behavior expectation**

Document the expected behavior:

- web mode can show `Download App`
- desktop mode automatically filters `Download App`
- user visibility settings still apply to all non-runtime-filtered items

**Step 2: Run the current build**

Run:

```bash
pnpm build
```

Expected:
- build passes before sidebar filtering changes

**Step 3: Implement runtime filtering**

Add a desktop-aware filter layer so the sidebar consumes settings config but removes web-only entries when running in the desktop shell.

**Step 4: Verify**

Run:

```bash
pnpm build
```

Expected:
- build passes and sidebar rendering compiles cleanly

### Task 3: Upgrade Window Controls and Shared Title Bar Rules

**Files:**
- Modify: `packages/sdkwork-react-commons/src/components/Desktop/WindowControls/WindowControls.tsx`
- Modify: `packages/sdkwork-react-commons/src/services/windowControlService.ts`
- Modify: `src/layouts/MainLayout/MainGlobalHeader.tsx`
- Modify: `src/layouts/MagicCutLayout/MagicCutLayoutHeader.tsx`
- Modify: `src/index.css`

**Step 1: Write the failing behavior expectation**

Document the expected behavior:

- desktop shows custom controls
- web hides them
- maximize switches to restore
- drag region remains usable
- menus and interactive controls do not accidentally drag the window

**Step 2: Run the current build**

Run:

```bash
pnpm build
```

Expected:
- build passes before shell UI edits

**Step 3: Implement the shared desktop title bar polish**

Refine the controls and header composition:

- desktop-only rendering
- maximize/restore state feedback
- better hover/press styling
- explicit no-drag interactive regions
- consistent spacing and shell hierarchy

**Step 4: Verify**

Run:

```bash
pnpm build
```

Expected:
- build passes with updated headers and controls

### Task 4: Unify Tauri Scripts and Configuration

**Files:**
- Modify: `package.json`
- Modify: `src-tauri/tauri.conf.json`
- Modify: `src-tauri/tauri.prod.conf.json`
- Modify: `README.md`

**Step 1: Write the failing behavior expectation**

Document the expected CLI behavior:

- `pnpm tauri:dev` launches desktop dev
- `pnpm tauri:build` builds the desktop app
- `pnpm tauri:bundle` creates installer artifacts
- dev/build window chrome assumptions are aligned

**Step 2: Reproduce the current mismatch**

Run:

```bash
pnpm tauri build
```

Expected:
- current script behavior does not match its name and should be replaced by standard desktop commands

**Step 3: Implement the script and config cleanup**

Align `package.json` scripts and Tauri window config so development and production share the same shell model.

**Step 4: Verify**

Run:

```bash
pnpm tauri:build
pnpm tauri:bundle
```

Expected:
- both commands complete successfully and generate desktop artifacts

### Task 5: Final Verification

**Files:**
- Verify only

**Step 1: Build the web app**

Run:

```bash
pnpm build
```

Expected:
- PASS

**Step 2: Check the Rust host**

Run:

```bash
cargo check
```

Working directory:

```text
src-tauri
```

Expected:
- PASS

**Step 3: Build the desktop app**

Run:

```bash
pnpm tauri:build
```

Expected:
- PASS

**Step 4: Bundle the installer**

Run:

```bash
pnpm tauri:bundle
```

Expected:
- PASS

**Step 5: Manual spot-check**

Verify:

- desktop hides `Download App`
- desktop shows refined window controls
- maximize/restore works
- header drag region works
- web does not show desktop-only controls

**Step 6: Commit**

```bash
git add package.json README.md src/index.css src/layouts/MainLayout/MainSidebar.tsx src/layouts/MainLayout/MainGlobalHeader.tsx src/layouts/MagicCutLayout/MagicCutLayoutHeader.tsx packages/sdkwork-react-core/src/platform/types.ts packages/sdkwork-react-core/src/platform/platform.ts packages/sdkwork-react-core/src/platform/desktop.ts packages/sdkwork-react-core/src/platform/web.ts packages/sdkwork-react-commons/src/components/Desktop/WindowControls/WindowControls.tsx packages/sdkwork-react-commons/src/services/windowControlService.ts packages/sdkwork-react-settings/src/constants.ts src-tauri/tauri.conf.json src-tauri/tauri.prod.conf.json docs/plans/2026-03-18-tauri-desktop-design.md docs/plans/2026-03-18-tauri-desktop-implementation.md
git commit -m "feat: polish tauri desktop shell experience"
```
