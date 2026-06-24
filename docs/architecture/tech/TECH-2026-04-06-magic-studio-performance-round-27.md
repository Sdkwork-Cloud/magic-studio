> Migrated from `docs/review/2026-04-06-magic-studio-performance-round-27.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Magic Studio V2 Performance Review Round 27

Date: 2026-04-06
Scope: `apps/magic-studio-v2`
Goal: split IAM route CSS by auth/user route and remove repeated full Tailwind preflight/base from lazy route stylesheets.

---

## Stage Conclusion

Round 26 had already moved IAM CSS out of the entry stylesheet, but the lazy route chunk was still oversized.

The Round 27 investigation confirmed two independent issues:

1. `auth` and `user` still shared one `iam.css`, so the route boundary was not fully isolated.
2. The route stylesheet imported full `tailwindcss`, which duplicated theme, base, components, and utilities for each lazy route.

Round 27 completed two steps:

1. Split `iam.css` into `auth.css` and `user.css`.
2. Replace full Tailwind import in those route stylesheets with:
   - `@layer theme, base, components, utilities;`
   - `@import "tailwindcss/theme.css" layer(theme);`
   - `@import "tailwindcss/utilities.css" layer(utilities);`

This preserved route-local Tailwind compilation while removing repeated preflight/base injection.

---

## Problem List

### P1. Auth and user routes still shared one lazy stylesheet

Impact:

1. `LoginPage` and `AuthOAuthCallbackPage` still depended on user-facing route CSS.
2. `ProfilePage` still depended on auth-facing route CSS.
3. Route-level CSS ownership was blurred, making later bundle optimization hard to trust.

### P2. Lazy route stylesheets still imported full Tailwind

Impact:

1. Each lazy route stylesheet carried full Tailwind layer output.
2. Preflight/base were repeated even after moving IAM CSS out of `src/index.css`.
3. CSS size reduction from Round 26 was smaller than expected.

---

## Design And Execution Plan

Recommended approach:

1. Keep global app styles in `src/index.css`.
2. Split IAM route CSS into route-specific entries:
   - `src/styles/auth.css`
   - `src/styles/user.css`
3. Keep route host presentation rules in the route stylesheet that owns the page.
4. Replace full Tailwind import with `theme.css + utilities.css` so route CSS keeps utilities generation but stops duplicating full preflight/base.

Why this approach:

1. Lowest risk to page behavior.
2. Easy to verify through source-boundary tests and build outputs.
3. Preserves future room to continue shrinking route utilities independently.

---

## Input / Output / Change Matrix

### 1. `src/styles/auth.css`

Input:

1. Route-scoped auth host rules.
2. Tailwind utilities required by auth route components.

Output:

1. Dedicated auth route stylesheet.
2. Explicit Tailwind layer imports without full preflight/base import.

Change type: new file in Round 27

### 2. `src/styles/user.css`

Input:

1. Route-scoped user host rules.
2. Tailwind utilities required by user route components.

Output:

1. Dedicated user route stylesheet.
2. Explicit Tailwind layer imports without full preflight/base import.

Change type: new file in Round 27

### 3. `src/pages/LoginPage.tsx`

Input:

1. Lazy auth page wrapper.

Output:

1. Explicit `import '../styles/auth.css';`
2. Login route owns auth CSS dependency directly.

Change type: modified

### 4. `src/pages/AuthOAuthCallbackPage.tsx`

Input:

1. Lazy auth callback wrapper.

Output:

1. Explicit `import '../styles/auth.css';`
2. Callback route owns auth CSS dependency directly.

Change type: modified

### 5. `src/pages/ProfilePage.tsx`

Input:

1. Lazy user page wrapper.

Output:

1. Explicit `import '../styles/user.css';`
2. Profile route owns user CSS dependency directly.

Change type: modified

### 6. `src/index.css`

Input:

1. Global app styles.
2. Shared `sdkwork-ui` Tailwind source tree.

Output:

1. No auth/user route host rules.
2. No IAM route-specific Tailwind scan roots.
3. Global stylesheet remains focused on host-wide styling and shared UI classes.

Change type: modified

### 7. Tests

Input:

1. Previous assumptions around shared `iam.css`.
2. Previous assumption that route CSS imported full Tailwind.

Output:

1. Route CSS boundary tests for `auth.css` and `user.css`.
2. Layer-boundary tests proving route CSS now uses `theme.css + utilities.css`.

Changed tests:

1. `tests/iamCssBoundary.node.test.mjs`
2. `tests/iamCssLayerBoundary.node.test.mjs`
3. `tests/authTailwindCompilation.node.test.mjs`
4. `tests/userTailwindCompilation.node.test.mjs`
5. `tests/authHostVisualParity.node.test.mjs`
6. `tests/userHostVisualParity.node.test.mjs`
7. `tests/authLoginRuntimeStability.node.test.mjs`
8. `tests/authSharedUiParity.node.test.mjs`
9. `tests/iamHostPresentation.node.test.mjs`

---

## Red To Green Closure

### Red

Command:

```powershell
node --test tests/iamCssBoundary.node.test.mjs tests/authTailwindCompilation.node.test.mjs tests/authHostVisualParity.node.test.mjs tests/userHostVisualParity.node.test.mjs tests/authLoginRuntimeStability.node.test.mjs tests/authSharedUiParity.node.test.mjs tests/iamHostPresentation.node.test.mjs
```

Result:

1. Tests failed before route-scoped stylesheets and layer boundaries were fully in place.
2. Failures correctly pointed to missing route CSS ownership and outdated Tailwind import assumptions.

### Green

Command:

```powershell
node --test tests/iamCssBoundary.node.test.mjs tests/authTailwindCompilation.node.test.mjs tests/authHostVisualParity.node.test.mjs tests/userHostVisualParity.node.test.mjs tests/authLoginRuntimeStability.node.test.mjs tests/authSharedUiParity.node.test.mjs tests/iamHostPresentation.node.test.mjs tests/iamCssLayerBoundary.node.test.mjs
```

Result:

1. All route CSS boundary tests passed.
2. Auth and user route stylesheets were independently owned and correctly layered.

---

## Verification

### Node regression

Command:

```powershell
node --test tests/authDesktopWindowControls.node.test.mjs tests/authHostVisualParity.node.test.mjs tests/authLayoutParity.node.test.mjs tests/authLegacyReferenceCleanup.node.test.mjs tests/authLocalComposition.node.test.mjs tests/authLoginRuntimeStability.node.test.mjs tests/authSharedUiParity.node.test.mjs tests/authTailwindCompilation.node.test.mjs tests/authZhCnLocale.node.test.mjs tests/iamCssBoundary.node.test.mjs tests/iamHostDependencyParity.node.test.mjs tests/iamHostPresentation.node.test.mjs tests/iamThemeBridge.node.test.mjs tests/profileLayoutParity.node.test.mjs tests/userCenterHostBranding.node.test.mjs tests/userHostVisualParity.node.test.mjs tests/userLocalComposition.node.test.mjs tests/userSectionAdapterParity.node.test.mjs tests/userSharedShellParity.node.test.mjs tests/userZhCnLocale.node.test.mjs tests/appEntryFocusedSubpathBoundary.node.test.mjs tests/layoutShellBoundary.node.test.mjs tests/magiccutShellBoundary.node.test.mjs tests/magiccutFeatureSubpathBoundary.node.test.mjs tests/startupPerformance.node.test.mjs tests/viteManualChunks.node.test.mjs tests/viteChunkIsolation.node.test.mjs tests/viteReactAlias.node.test.mjs tests/i18nLazyBootstrapBoundary.node.test.mjs
```

Result:

1. 44 / 44 passed.

### Component smoke test

Command:

```powershell
pnpm exec vitest run src/layouts/MainLayout/MainSidebar.test.tsx src/layouts/MagicCutLayout/MagicCutLayoutHeader.test.tsx
```

Result:

1. 4 / 4 passed.

### Build verification

Command:

```powershell
pnpm run build:test
```

Result:

1. Build passed.
2. Auth pages and profile page remained lazy-loaded.
3. Auth route CSS and profile route CSS stayed split from the main entry CSS.

---

## Build Output Comparison

### Round 26 baseline

1. `dist/assets/index-3uHoKPMf.css` `359.71 kB`
2. `dist/assets/iam-DbRhjvWD.css` `323.23 kB`

### Round 27 phase 1: split shared IAM stylesheet

1. `auth-DirMbCAL.css` `320.54 kB`
2. `ProfilePage-BmyfhPwg.css` `320.86 kB`

### Round 27 phase 2: remove full Tailwind route import

1. `dist/assets/auth-Y4IH3gtE.css` `316.86 kB`
2. `dist/assets/ProfilePage-DGLRKkWO.css` `317.18 kB`
3. `dist/assets/index-3uHoKPMf.css` `359.71 kB`

Interpretation:

1. Shared route CSS ownership was fixed.
2. Removing full Tailwind import reduced each route CSS chunk slightly.
3. The remaining dominant cost clearly came from utilities, not preflight/base duplication alone.

---

## Findings

### F1. Route boundary work succeeded

Auth and user no longer shared one route stylesheet.

### F2. Full Tailwind import was not the main cost center

Switching to `theme.css + utilities.css` helped, but only by a few kilobytes.

### F3. Utility generation still dominated route CSS size

The next round needed to investigate actual Tailwind utility coverage, not just preflight duplication.

---

## Next Step Plan

### Priority 1

Audit whether auth/user route stylesheets are scanning the correct runtime package boundaries.

### Priority 2

Inspect whether route CSS size is dominated by:

1. repeated theme tokens
2. actual utility volume
3. overly broad scan roots

### Priority 3

If route scan roots are wrong, fix correctness first before trusting any size analysis.


