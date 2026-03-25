# MagicStudio Storage Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Standardize storage defaults on the `MagicStudio` filesystem model rooted at `~/.sdkwork/magicstudio`, make Magic Cut desktop uploads local-first by default, and expose root overrides in the settings center.

**Architecture:** Centralize path resolution and storage policy in shared settings/core utilities, route asset-center persistence through a project-aware managed filesystem layout, and update Magic Cut import behavior to use local managed assets first and optional background sync second. Keep internal directory names stable while allowing configurable root locations.

**Tech Stack:** React, TypeScript, Vitest, Vite, pnpm, Tauri filesystem APIs, workspace packages `@sdkwork/react-core`, `@sdkwork/react-assets`, `@sdkwork/react-settings`, `@sdkwork/react-magiccut`

---

### Task 1: Define Storage Policy Settings and Default MagicStudio Roots

**Files:**
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-react-settings/src/entities/settings.entity.ts`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-react-settings/src/constants.ts`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-react-settings/src/services/settingsService.ts`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-react-settings/src/store/settingsStore.tsx`
- Test: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-react-settings/tests/materialStorageSettings.test.ts`

**Step 1: Write the failing test**

Create a new settings test covering:

```ts
it('defaults desktop material storage to MagicStudio local-first roots', async () => {
  const settings = DEFAULT_SETTINGS;

  expect(settings.materialStorage.mode).toBe('local-first-sync');
  expect(settings.materialStorage.desktop.rootDir).toContain('.sdkwork');
  expect(settings.materialStorage.desktop.rootDir).toContain('magicstudio');
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm test packages/sdkwork-react-settings/tests/materialStorageSettings.test.ts
```

Expected:
- FAIL because `materialStorage` does not exist yet

**Step 3: Write minimal implementation**

Add:

- new storage policy types to `settings.entity.ts`
- `materialStorage` defaults in `constants.ts`
- merge/persistence support in `settingsService.ts`
- no-op compatible store handling in `settingsStore.tsx`

**Step 4: Run test to verify it passes**

Run:

```bash
pnpm test packages/sdkwork-react-settings/tests/materialStorageSettings.test.ts
```

Expected:
- PASS

**Step 5: Commit**

```bash
git add packages/sdkwork-react-settings/src/entities/settings.entity.ts packages/sdkwork-react-settings/src/constants.ts packages/sdkwork-react-settings/src/services/settingsService.ts packages/sdkwork-react-settings/src/store/settingsStore.tsx packages/sdkwork-react-settings/tests/materialStorageSettings.test.ts
git commit -m "feat: define MagicStudio storage policy settings"
```

### Task 2: Centralize MagicStudio Path Resolution and Legacy Migration

**Files:**
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-react-commons/src/utils/storageConfig.ts`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-react-core/src/storage/magicStudioPaths.ts`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-react-core/src/storage/magicStudioMigration.ts`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-react-core/src/platform/toolkit/createPlatformToolKit.ts`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-react-core/src/platform/web.ts`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-react-core/src/platform/desktop.ts`
- Test: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-react-core/src/storage/__tests__/magicStudioPaths.test.ts`
- Test: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-react-core/src/storage/__tests__/magicStudioMigration.test.ts`

**Step 1: Write the failing path test**

Create a path resolver test:

```ts
it('builds project roots under ~/.sdkwork/magicstudio by default', () => {
  const layout = buildMagicStudioProjectLayout({
    rootDir: '/Users/demo/.sdkwork/magicstudio',
    workspaceId: 'ws-1',
    projectId: 'proj-1',
  });

  expect(layout.projectRoot).toContain('/.sdkwork/magicstudio/workspaces/ws-1/projects/proj-1');
  expect(layout.originalVideoDir).toContain('/media/originals/video');
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm test packages/sdkwork-react-core/src/storage/__tests__/magicStudioPaths.test.ts
```

Expected:
- FAIL because the shared resolver does not exist yet

**Step 3: Write minimal implementation**

Implement:

- centralized path builders for user, workspace, project, media, cache, exports
- default root normalization to `magicstudio`
- root override support
- one-shot cleanup of legacy branded roots

**Step 4: Write the failing migration test**

Create a migration test:

```ts
it('keeps the canonical magicstudio root stable across cleanup passes', async () => {
  const result = await planMagicStudioMigration({
    currentRoot: '/Users/demo/.sdkwork/magicstudio',
    targetRoot: '/Users/demo/.sdkwork/magicstudio',
    targetEmpty: true,
    markerExists: false,
  });

  expect(result.required).toBe(true);
  expect(result.targetRoot.endsWith('/magicstudio')).toBe(true);
});
```

**Step 5: Run test to verify it fails**

Run:

```bash
pnpm test packages/sdkwork-react-core/src/storage/__tests__/magicStudioMigration.test.ts
```

Expected:
- FAIL because migration planner does not exist yet

**Step 6: Implement minimal migration planner**

Add idempotent migration planning and root normalization behavior only.

**Step 7: Run both tests to verify they pass**

Run:

```bash
pnpm test packages/sdkwork-react-core/src/storage/__tests__/magicStudioPaths.test.ts packages/sdkwork-react-core/src/storage/__tests__/magicStudioMigration.test.ts
```

Expected:
- PASS

**Step 8: Commit**

```bash
git add packages/sdkwork-react-commons/src/utils/storageConfig.ts packages/sdkwork-react-core/src/storage/magicStudioPaths.ts packages/sdkwork-react-core/src/storage/magicStudioMigration.ts packages/sdkwork-react-core/src/platform/toolkit/createPlatformToolKit.ts packages/sdkwork-react-core/src/platform/web.ts packages/sdkwork-react-core/src/platform/desktop.ts packages/sdkwork-react-core/src/storage/__tests__/magicStudioPaths.test.ts packages/sdkwork-react-core/src/storage/__tests__/magicStudioMigration.test.ts
git commit -m "feat: centralize MagicStudio path resolution"
```

### Task 3: Route Asset-Center Persistence Through Project-Managed Directories

**Files:**
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-react-assets/src/asset-center/infrastructure/BrowserTauriAssetVfs.ts`
- Create: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-react-assets/src/asset-center/application/magicStudioAssetLayout.ts`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-react-assets/src/asset-center/application/AssetCenterService.ts`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-react-assets/src/asset-center/application/assetCenterAdapters.ts`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-react-assets/src/services/assetService.ts`
- Test: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-react-assets/tests/magicStudioAssetLayout.test.ts`
- Test: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-react-assets/tests/assetCenterProjectManagedImport.test.ts`

**Step 1: Write the failing layout test**

Create a layout test:

```ts
it('routes imported project media into media/originals typed directories', () => {
  const layout = buildManagedAssetTarget({
    workspaceId: 'ws-1',
    projectId: 'proj-1',
    type: 'video',
    assetId: 'asset-1',
    extension: '.mp4',
    rootDir: '/Users/demo/.sdkwork/magicstudio',
  });

  expect(layout.absolutePath).toContain('/workspaces/ws-1/projects/proj-1/media/originals/video/asset-1.mp4');
  expect(layout.virtualPath).toContain('assets://workspaces/ws-1/projects/proj-1/media/originals/video/asset-1.mp4');
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm test packages/sdkwork-react-assets/tests/magicStudioAssetLayout.test.ts
```

Expected:
- FAIL because project-managed layout helper does not exist yet

**Step 3: Implement minimal layout helper**

Add a project-aware asset target builder that distinguishes:

- originals
- generated
- proxies
- optimized
- cache

**Step 4: Write the failing asset-center import test**

Create an integration-style test around `AssetCenterService`:

```ts
it('copies desktop source files into the active project originals directory', async () => {
  const result = await service.importAsset({
    scope: { workspaceId: 'ws-1', projectId: 'proj-1', domain: 'magiccut' },
    type: 'video',
    name: 'clip.mp4',
    sourcePath: '/incoming/clip.mp4',
  });

  expect(result.primaryLocator.uri).toContain('assets://workspaces/ws-1/projects/proj-1/media/originals/video/');
  expect(result.asset.storage.mode).toBe('tauri-fs');
});
```

**Step 5: Run test to verify it fails**

Run:

```bash
pnpm test packages/sdkwork-react-assets/tests/assetCenterProjectManagedImport.test.ts
```

Expected:
- FAIL because current import still uses library root semantics

**Step 6: Implement minimal project-managed import behavior**

Update asset-center persistence to:

- use project-scoped managed directories when project id exists
- keep fallback behavior for non-project assets
- preserve metadata for storage class and original filename

**Step 7: Run both tests to verify they pass**

Run:

```bash
pnpm test packages/sdkwork-react-assets/tests/magicStudioAssetLayout.test.ts packages/sdkwork-react-assets/tests/assetCenterProjectManagedImport.test.ts
```

Expected:
- PASS

**Step 8: Commit**

```bash
git add packages/sdkwork-react-assets/src/asset-center/infrastructure/BrowserTauriAssetVfs.ts packages/sdkwork-react-assets/src/asset-center/application/magicStudioAssetLayout.ts packages/sdkwork-react-assets/src/asset-center/application/AssetCenterService.ts packages/sdkwork-react-assets/src/asset-center/application/assetCenterAdapters.ts packages/sdkwork-react-assets/src/services/assetService.ts packages/sdkwork-react-assets/tests/magicStudioAssetLayout.test.ts packages/sdkwork-react-assets/tests/assetCenterProjectManagedImport.test.ts
git commit -m "feat: store managed assets in MagicStudio project directories"
```

### Task 4: Make Magic Cut Desktop Imports Local-First

**Files:**
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-react-magiccut/src/store/magicCutStore.tsx`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-react-core/src/utils/uploadHelper.ts`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-react-magiccut/src/domain/assets/magicCutAssetState.ts`
- Test: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-react-magiccut/tests/localFirstImport.test.ts`

**Step 1: Write the failing Magic Cut test**

Create a focused import-policy test:

```ts
it('prefers managed local asset import on desktop when material storage is local-first-sync', async () => {
  const result = await decideMagicCutImportRoute({
    runtime: 'desktop',
    storageMode: 'local-first-sync',
    filePath: '/incoming/a.mp4',
  });

  expect(result.kind).toBe('managed-local');
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm --filter @sdkwork/react-magiccut test localFirstImport.test.ts
```

Expected:
- FAIL because Magic Cut still routes directly through server SDK upload

**Step 3: Implement minimal local-first routing**

Update import behavior so desktop uploads:

- use file path when available
- register the copied local asset into asset-center
- build Magic Cut resource views from the managed local asset
- only enqueue sync metadata if sync is enabled

**Step 4: Run test to verify it passes**

Run:

```bash
pnpm --filter @sdkwork/react-magiccut test localFirstImport.test.ts
```

Expected:
- PASS

**Step 5: Commit**

```bash
git add packages/sdkwork-react-magiccut/src/store/magicCutStore.tsx packages/sdkwork-react-core/src/utils/uploadHelper.ts packages/sdkwork-react-magiccut/src/domain/assets/magicCutAssetState.ts packages/sdkwork-react-magiccut/tests/localFirstImport.test.ts
git commit -m "feat: make Magic Cut desktop imports local-first"
```

### Task 5: Add Settings UI for Root Overrides and Material Mode

**Files:**
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-react-settings/src/data/definitions.ts`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-react-settings/src/pages/SettingsPage.tsx`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-react-settings/src/components/StorageSettings.tsx`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-react-i18n/src/locales/en/settings.ts`
- Modify: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-react-i18n/src/locales/zh-CN/settings.ts`
- Test: `D:/javasource/spring-ai-plus/spring-ai-plus-business/apps/magic-studio-v2/packages/sdkwork-react-settings/tests/materialStorageSettingsUi.test.tsx`

**Step 1: Write the failing UI test**

Create a UI test:

```tsx
it('renders MagicStudio root and material mode controls in settings', () => {
  render(<SettingsPage />);

  expect(screen.getByText(/MagicStudio/i)).toBeInTheDocument();
  expect(screen.getByText(/local-first-sync/i)).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
pnpm test packages/sdkwork-react-settings/tests/materialStorageSettingsUi.test.tsx
```

Expected:
- FAIL because the controls are not rendered yet

**Step 3: Implement minimal UI**

Add:

- material storage mode selector
- root directory path inputs
- cache and exports override inputs
- explanatory copy favoring local-first desktop workflow

**Step 4: Run test to verify it passes**

Run:

```bash
pnpm test packages/sdkwork-react-settings/tests/materialStorageSettingsUi.test.tsx
```

Expected:
- PASS

**Step 5: Commit**

```bash
git add packages/sdkwork-react-settings/src/data/definitions.ts packages/sdkwork-react-settings/src/pages/SettingsPage.tsx packages/sdkwork-react-settings/src/components/StorageSettings.tsx packages/sdkwork-react-i18n/src/locales/en/settings.ts packages/sdkwork-react-i18n/src/locales/zh-CN/settings.ts packages/sdkwork-react-settings/tests/materialStorageSettingsUi.test.tsx
git commit -m "feat: expose MagicStudio storage controls in settings"
```

### Task 6: Final Verification

**Files:**
- Verify only

**Step 1: Run focused storage tests**

Run:

```bash
pnpm test packages/sdkwork-react-settings/tests/materialStorageSettings.test.ts packages/sdkwork-react-core/src/storage/__tests__/magicStudioPaths.test.ts packages/sdkwork-react-core/src/storage/__tests__/magicStudioMigration.test.ts packages/sdkwork-react-assets/tests/magicStudioAssetLayout.test.ts packages/sdkwork-react-assets/tests/assetCenterProjectManagedImport.test.ts
```

Expected:
- PASS

**Step 2: Run focused Magic Cut test**

Run:

```bash
pnpm --filter @sdkwork/react-magiccut test localFirstImport.test.ts
```

Expected:
- PASS

**Step 3: Run package typechecks**

Run:

```bash
pnpm --filter @sdkwork/react-settings typecheck
pnpm --filter @sdkwork/react-assets typecheck
pnpm --filter @sdkwork/react-magiccut typecheck
pnpm --filter @sdkwork/react-core typecheck
```

Expected:
- PASS

**Step 4: Run app build**

Run:

```bash
pnpm build
```

Expected:
- PASS

**Step 5: Manual validation checklist**

Verify:

- default local storage root resolves to `~/.sdkwork/magicstudio`
- no new default writes drift away from `magicstudio`
- desktop Magic Cut imports land in `workspaces/{workspaceId}/projects/{projectId}/media/originals/*`
- project caches land in project `cache/*`
- exports land in project `exports/*` unless overridden
- settings center shows editable root override controls
- legacy root detection is idempotent

**Step 6: Commit**

```bash
git add docs/plans/2026-03-18-magicstudio-storage-design.md docs/plans/2026-03-18-magicstudio-storage.md
git commit -m "docs: define MagicStudio storage architecture"
```
