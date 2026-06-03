# Magic Studio V2 Performance Review Round 29

Date: 2026-04-06
Scope: `apps/magic-studio-v2`
Goal: disable Tailwind implicit workspace-wide root scanning for auth and user route stylesheets so the lazy route CSS chunks only contain identity-route utilities.

---

## Stage Conclusion

Round 28 fixed the `@source` ownership boundary, but the route CSS bundles were still far too large:

1. `auth.css` stayed at `316.86 kB`
2. `ProfilePage.css` stayed at `317.18 kB`

That contradicted the expectation that route CSS was now limited to auth/user sources.

Round 29 found the real root cause:

1. Tailwind Vite still applied implicit root scanning when `compiler.root === null`
2. That implicit root scanning pulled in unrelated workspace classes
3. The route CSS chunks therefore still contained foreign utilities from unrelated modules such as `magiccut` and `film`

The fix was to add `source(none)` to the route stylesheet Tailwind imports.

---

## Problem List

### P1. Auth and user route CSS still included unrelated workspace utilities

Impact:

1. Auth route CSS contained utilities only used by non-identity modules.
2. User route CSS contained utilities only used by non-identity modules.
3. Route-level CSS chunk sizes were inflated by unrelated application features.

### P2. Explicit `@source` alone did not disable Tailwind automatic root scanning

Impact:

1. The team could incorrectly assume route CSS isolation was complete.
2. Size analysis against auth/user local source roots remained misleading.

---

## Root Cause Investigation

### Evidence 1. Dist auth CSS contained foreign utilities

Before the fix, the auth route CSS bundle contained utility selectors tied to non-identity modules, including patterns such as:

1. `::-webkit-media-controls-*`
2. `::-webkit-slider-thumb`

Those selectors came from files like:

1. `packages/sdkwork-magic-studio-film/src/components/ShotModal.tsx`
2. `packages/sdkwork-magic-studio-magiccut/src/components/AudioMixer.tsx`

They are unrelated to auth and user route rendering.

### Evidence 2. Tailwind compile API still reported `root: null`

Compiling `src/styles/auth.css` and `src/styles/user.css` showed:

1. `compiled.sources` matched the local auth/user sources correctly
2. but `compiled.root` was still `null`

That meant explicit sources were present, but automatic root scanning was still active.

### Evidence 3. Tailwind Vite plugin behavior

Reading `node_modules/@tailwindcss/vite/dist/index.mjs` showed:

1. when `compiler.root === "none"`, the scanner uses no implicit root
2. when `compiler.root === null`, the scanner falls back to `base/**/*`

This explains why route CSS still saw the full workspace.

### Evidence 4. Minimal experiment confirmed the fix

A local compile experiment that injected:

1. `@import "tailwindcss/theme.css" layer(theme) source(none);`
2. `@import "tailwindcss/utilities.css" layer(utilities) source(none);`

changed the compiler result from:

1. `root: null`

to:

1. `root: "none"`

without losing the explicit auth/user route sources.

---

## Hypothesis

Single hypothesis:

If auth and user route stylesheets add `source(none)` to their Tailwind imports, Tailwind will stop scanning the implicit workspace root, and the route CSS chunks will shrink to the true identity-route utility set.

---

## Input / Output / Change Matrix

### 1. `tests/identityCssLayerBoundary.node.test.mjs`

Input:

1. Only checked for `theme.css` and `utilities.css`
2. Did not require implicit root scanning to be disabled

Output:

1. Now asserts both route stylesheets import Tailwind with `source(none)`

Change type: modified

### 2. `tests/authTailwindCompilation.node.test.mjs`

Input:

1. Confirmed explicit auth sources only
2. Did not check `compiled.root`

Output:

1. Now asserts `compiled.root === "none"`
2. Guards against automatic workspace-wide root scanning regression

Change type: modified

### 3. `tests/userTailwindCompilation.node.test.mjs`

Input:

1. Confirmed explicit user sources only
2. Did not check `compiled.root`

Output:

1. Now asserts `compiled.root === "none"`
2. Guards against automatic workspace-wide root scanning regression

Change type: modified

### 4. `tests/identityCssBoundary.node.test.mjs`

Input:

1. Expected pre-round-29 route import syntax

Output:

1. Updated to expect `source(none)` on theme/utilities imports

Change type: modified

### 5. `src/styles/auth.css`

Input:

1. Imported `theme.css` and `utilities.css`
2. Left implicit workspace root scanning enabled

Output:

1. `@import "tailwindcss/theme.css" layer(theme) source(none);`
2. `@import "tailwindcss/utilities.css" layer(utilities) source(none);`

Change type: modified

### 6. `src/styles/user.css`

Input:

1. Imported `theme.css` and `utilities.css`
2. Left implicit workspace root scanning enabled

Output:

1. `@import "tailwindcss/theme.css" layer(theme) source(none);`
2. `@import "tailwindcss/utilities.css" layer(utilities) source(none);`

Change type: modified

---

## Red To Green Closure

### Red

Command:

```powershell
node --test tests/identityCssLayerBoundary.node.test.mjs tests/authTailwindCompilation.node.test.mjs tests/userTailwindCompilation.node.test.mjs
```

Result:

1. 3 / 3 failed
2. `compiled.root` was `null`, not `"none"`
3. Route stylesheet source did not contain `source(none)`

### Green

Command:

```powershell
node --test tests/identityCssLayerBoundary.node.test.mjs tests/authTailwindCompilation.node.test.mjs tests/userTailwindCompilation.node.test.mjs
```

Result after updating `src/styles/auth.css` and `src/styles/user.css`:

1. 3 / 3 passed
2. `compiled.root === "none"` for both route stylesheets
3. Route stylesheets now explicitly disable implicit global root scanning

---

## Verification

### Identity and performance regression suite

Command:

```powershell
node --test tests/authDesktopWindowControls.node.test.mjs tests/authHostVisualParity.node.test.mjs tests/authLayoutParity.node.test.mjs tests/authLegacyReferenceCleanup.node.test.mjs tests/authLocalComposition.node.test.mjs tests/authLoginRuntimeStability.node.test.mjs tests/authSharedUiParity.node.test.mjs tests/authTailwindCompilation.node.test.mjs tests/authZhCnLocale.node.test.mjs tests/identityCssBoundary.node.test.mjs tests/identityCssLayerBoundary.node.test.mjs tests/identityHostDependencyParity.node.test.mjs tests/identityHostPresentation.node.test.mjs tests/identityThemeBridge.node.test.mjs tests/profileLayoutParity.node.test.mjs tests/userCenterHostBranding.node.test.mjs tests/userHostVisualParity.node.test.mjs tests/userLocalComposition.node.test.mjs tests/userSectionAdapterParity.node.test.mjs tests/userSharedShellParity.node.test.mjs tests/userTailwindCompilation.node.test.mjs tests/userZhCnLocale.node.test.mjs tests/appEntryFocusedSubpathBoundary.node.test.mjs tests/layoutShellBoundary.node.test.mjs tests/magiccutShellBoundary.node.test.mjs tests/magiccutFeatureSubpathBoundary.node.test.mjs tests/startupPerformance.node.test.mjs tests/viteManualChunks.node.test.mjs tests/viteChunkIsolation.node.test.mjs tests/viteReactAlias.node.test.mjs tests/i18nLazyBootstrapBoundary.node.test.mjs
```

Result:

1. 44 / 44 passed

### Component smoke test

Command:

```powershell
pnpm exec vitest run src/layouts/MainLayout/MainSidebar.test.tsx src/layouts/MagicCutLayout/MagicCutLayoutHeader.test.tsx
```

Result:

1. 4 / 4 passed

### Build verification

Command:

```powershell
pnpm run build:test
```

Result:

1. Build passed
2. Route CSS chunks stayed split from the entry stylesheet
3. Foreign selectors such as `webkit-media-controls` and `webkit-slider-thumb` no longer appeared in auth/profile route CSS bundles

---

## Build Output Comparison

### Before round 29

1. `dist/assets/auth-Y4IH3gtE.css` `316.86 kB`
2. `dist/assets/ProfilePage-DGLRKkWO.css` `317.18 kB`
3. `dist/assets/index-3uHoKPMf.css` `359.71 kB`

### After round 29

1. `dist/assets/auth-DcVt5bIc.css` `22.06 kB`
2. `dist/assets/ProfilePage-C1V7u-eG.css` `12.35 kB`
3. `dist/assets/index-3uHoKPMf.css` `359.71 kB`

### Delta

1. Auth route CSS reduced by about `294.80 kB`
2. User route CSS reduced by about `304.83 kB`
3. Entry CSS stayed stable, which means the gain came from true route isolation rather than moving cost back into the global stylesheet

---

## Findings

### F1. The dominant route CSS inflation was caused by implicit root scanning

This was the real cause of the oversized auth/user route stylesheets.

### F2. Explicit `@source` is not enough by itself in this setup

When using the Tailwind Vite integration here, the route stylesheet also needs `source(none)` to prevent workspace-wide fallback scanning.

### F3. Route CSS is now genuinely route-scoped

The resulting auth and user CSS bundles now align with the true identity-route utility set.

---

## Next Step Plan

### Priority 1

Audit whether the remaining `22.06 kB` auth CSS and `12.35 kB` user CSS still duplicate theme/property output that could be shared once globally.

### Priority 2

Evaluate whether the repeated `@property` block can be centralized without breaking route isolation or animation/filter utilities.

### Priority 3

If the next optimization is safe, add explicit regression coverage around post-build route CSS budgets so oversized foreign-utility regressions are caught earlier.

