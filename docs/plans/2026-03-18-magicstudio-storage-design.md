# MagicStudio Storage Architecture Design

## Goal

Unify all new storage under `MagicStudio`, make desktop-local project media the default for Magic Cut imports, adopt a professional NLE-style directory model, and expose root-directory overrides in the global settings center without sacrificing a stable internal filesystem contract.

## Core Decisions

### 1. Product and Storage Naming

- All new filesystem naming changes from `OpenStudio` to `MagicStudio`.
- The default storage root becomes `~/.sdkwork/magicstudio`.
- On Windows the equivalent default root is `%USERPROFILE%\.sdkwork\magicstudio`.
- Existing `open-studio` / `OpenStudio` paths are treated as legacy inputs for migration only.

### 2. Storage Philosophy

MagicStudio adopts a **project-centered, local-first** storage model modeled after professional editing tools such as Premiere Pro, Final Cut Pro, and DaVinci Resolve:

- project files are separate from generated caches
- original media is separate from proxies and optimized media
- autosaves and backups are separate from primary project state
- exports are separate from editable source material
- internal cache can be rebuilt without damaging user source content

Desktop behavior prioritizes local filesystem ownership and fast editability. Server sync is optional and secondary.

### 3. Default Material Persistence Mode

The default global material persistence mode is:

- `local-first-sync` on desktop

Behavior:

- local upload is written to the local filesystem first
- the project references the local managed asset immediately
- optional server sync can happen asynchronously later

Additional supported modes:

- `local-only`
- `server-only`

`server-only` is not the default and should be presented as an advanced mode because it reduces offline resilience and direct filesystem operability.

### 4. Stable Internal Layout, Configurable Roots

MagicStudio allows users to customize **root locations**, not arbitrary internal folder names.

Allowed configuration:

- root storage directory
- project content root override
- cache root override
- exports root override
- sync enablement and strategy

Not allowed:

- arbitrary renaming of canonical internal folders such as `media/originals` or `cache/render`

This preserves portability, diagnostics, packaging, relinking, and consistent team support.

## Target Filesystem Layout

### Default Root

```text
~/.sdkwork/magicstudio/
```

### Canonical Tree

```text
~/.sdkwork/magicstudio/
  users/
    {userId}/
      user.json
      preferences.json
      presets/
      templates/
      luts/
      shortcuts/

  workspaces/
    {workspaceId}/
      workspace.json
      projects/
        {projectId}/
          project.json
          project.lock
          autosave/
            project-YYYYMMDD-HHMMSS.json
          backups/
            project-YYYYMMDD-HHMMSS.json
          ingest/
            manifests/
            relink/
          media/
            originals/
              video/
              image/
              audio/
              text/
              other/
            generated/
              video/
              image/
              audio/
              text/
            proxies/
              video/
              image/
            optimized/
            conformed/
          cache/
            render/
            waveforms/
            thumbnails/
            peaks/
            analysis/
            temp/
          exports/
            drafts/
            masters/
            packages/
          snapshots/
          trash/

  system/
    settings.json
    indexes/
      assets-index.json
      projects-index.json
      workspaces-index.json
    sync/
      queue/
      checkpoints/
    logs/
    temp/
```

## Directory Semantics

### `users/`

Stores user-specific but project-independent material:

- preferences
- reusable presets
- reusable templates
- LUT packs
- user shortcuts

### `workspaces/{workspaceId}/projects/{projectId}/project.json`

Stores the canonical editable project state only.

This file must not embed binary media payloads. It references managed assets by asset id and canonical managed locator.

### `media/originals/`

Stores original imported local material.

Rules:

- desktop local uploads default here
- folder is media-type segmented
- file names are managed by MagicStudio, not raw source names
- original display names remain in metadata

### `media/generated/`

Stores first-class generated material that should survive across sessions and packaging.

Examples:

- AI-generated images
- generated voice files
- generated captions or text payload files

### `media/proxies/`

Stores project-local proxy media.

Rules:

- never treated as source-of-truth originals
- safe to rebuild
- must preserve clear mapping back to source asset id

### `media/optimized/`

Stores optimized transcodes similar to professional NLE optimized media.

### `media/conformed/`

Stores conformed audio or other imported-normalized derivatives required by the editing engine.

### `cache/`

Stores rebuildable artifacts only:

- render cache
- waveform cache
- thumbnail cache
- analysis cache
- temporary intermediates

This directory is safe to purge from product tooling.

### `autosave/` and `backups/`

`autosave/` is high-frequency rolling safety state.

`backups/` is lower-frequency historical preservation state.

This mirrors the separation used by professional editing products between autosaves and manual or scheduled backups.

### `exports/`

Stores user-facing deliverables only:

- drafts
- final masters
- project packages

Exports must not be mixed with editable source media or rebuildable cache.

### `trash/`

Managed-delete target for local assets and project artifacts before final purge.

## Asset Identity and Path Rules

### Managed File Naming

Managed on-disk names use stable ids plus normalized extension:

```text
{assetId}{extension}
```

Examples:

- `c41d7e4e-2f4b-45b6-a3ee-74ff0d57f1a1.mp4`
- `9d57ef39-18ae-47da-9775-1ea9b9fb8f4e.png`

Reason:

- avoids collisions
- preserves deterministic relinking
- simplifies packaging and sync

The original user-facing filename is stored in metadata.

### Managed Virtual Locator

Canonical local managed locators should resolve to a project-explicit virtual path:

```text
assets://workspaces/{workspaceId}/projects/{projectId}/media/originals/video/{assetId}.mp4
```

Benefits:

- clear project ownership
- predictable relinking
- stable serialization across desktop/web

### Asset Metadata Additions

Managed imported assets should include at least:

- `workspaceId`
- `projectId`
- `storageMode`
- `storageClass` such as `original`, `generated`, `proxy`, `optimized`, `cache`
- `originalName`
- `managedFileName`
- `managedRootVersion`

## Global Settings Model

Add a dedicated storage policy section in app settings.

### Proposed Shape

```ts
materialStorage: {
  mode: 'local-first-sync' | 'local-only' | 'server-only';
  desktop: {
    rootDir: string;
    projectsRootDir?: string;
    cacheRootDir?: string;
    exportsRootDir?: string;
  };
  sync: {
    enabled: boolean;
    autoUploadOnImport: boolean;
  };
  naming: {
    keepOriginalFilenameInMetadata: boolean;
  };
}
```

### Default Values

```ts
materialStorage: {
  mode: 'local-first-sync',
  desktop: {
    rootDir: '~/.sdkwork/magicstudio'
  },
  sync: {
    enabled: false,
    autoUploadOnImport: false
  },
  naming: {
    keepOriginalFilenameInMetadata: true
  }
}
```

## Runtime Behavior by Environment

### Desktop

Desktop uses the managed local filesystem as the default source of truth for local uploads.

Flow:

1. user selects file
2. file is copied into project `media/originals/*`
3. asset-center registers a managed local asset
4. Magic Cut references the local asset immediately
5. optional sync queue receives a background upload task if sync is enabled

### Web

Web keeps using browser-managed virtual storage but adopts the same logical layout contract:

- project-relative asset ownership
- same storage mode metadata
- same managed locator structure where possible

This keeps serialization consistent across runtimes even if the physical backing store differs.

## Migration Strategy

Migration must be silent, idempotent, and conservative.

### Legacy Sources

- `open-studio`
- `OpenStudio`
- current library and workspace roots derived from old constants

### Migration Rules

1. Detect legacy root on startup when the new root is empty or settings reference legacy defaults.
2. Move or copy legacy content into `~/.sdkwork/magicstudio`.
3. Rewrite indexes and settings references to the new root.
4. Keep a migration marker so the process is not repeated.
5. Never destroy legacy data until the migration has succeeded.

### Scope

Migration should include:

- settings storage path defaults
- asset library roots
- workspace and project directories
- project-local references where serialized locators embed legacy path prefixes

## Component Responsibilities

### `@sdkwork/react-settings`

Owns:

- persistent global storage policy settings
- default root configuration
- settings UI for root overrides and mode selection

### `@sdkwork/react-core`

Owns:

- root path expansion and normalization
- desktop filesystem root resolution
- migration helpers
- workspace toolkit defaults for `MagicStudio`

### `@sdkwork/react-assets`

Owns:

- managed asset path building
- local project asset routing
- locator resolution
- asset-center registration with project-aware local paths

### `@sdkwork/react-magiccut`

Owns:

- using the local-first import route for desktop uploads
- attaching imported resources to the active project scope
- enqueueing optional sync work

## Implementation Standard

### Path Resolution

Never build important storage paths ad hoc inside feature components.

All managed paths should come from a centralized resolver that knows:

- root overrides
- workspace id
- project id
- asset storage class
- current platform

### Internal Folder Contract

All internal folder names remain product-owned constants. UI should present friendly labels, but code should rely on fixed directory contracts.

### Cleanup and Purge

Project-local cache and trash must be separately purgeable.

Future cleanup tooling should be able to:

- purge project cache
- purge project proxies
- purge global temp and logs
- compact autosaves and backups

## Verification Targets

Implementation is successful when:

- new defaults write under `~/.sdkwork/magicstudio`
- no new default path writes under `open-studio`
- desktop Magic Cut local upload writes into active project `media/originals/*`
- imported assets resolve correctly from local managed paths
- settings center allows changing root overrides
- migration from old roots is idempotent
- serialization preserves workspace/project ownership metadata
- tests cover path layout, migration, and local-first import flow

## Non-Goals for This Iteration

- multi-user concurrent locking semantics beyond project lock file creation
- networked collaborative project filesystem merging
- arbitrary user-defined folder naming inside managed project trees
- full remote sync engine implementation beyond queue scaffolding and metadata support
