# Magic Studio V2 Performance Review Round 28

Date: 2026-04-06
Scope: `apps/magic-studio-v2`
Goal: correct auth/user route CSS Tailwind scan roots so they match the actual runtime package boundary, then re-verify build output and bundle conclusions.

---

## Stage Conclusion

Round 27 proved that route CSS could be split and layered correctly, but the scan root itself was still wrong.

`src/styles/auth.css` and `src/styles/user.css` were scanning the shared `sdkwork-appbase` IAM packages, while the app actually renders local runtime wrappers:

1. `@sdkwork/magic-studio-auth` -> `packages/sdkwork-magic-studio-auth/src/index.ts`
2. `@sdkwork/magic-studio-user` -> `packages/sdkwork-magic-studio-user/src/index.ts`

This was a correctness bug first, and a performance analysis risk second.

Round 28 fixed that boundary mismatch.

---

## Problem List

### P1. Route CSS scan roots did not match the runtime package boundary

Impact:

1. Tailwind scan ownership was pointing at the wrong package tree.
2. Route CSS analysis could not be trusted as a representation of actual runtime source usage.
3. A future refactor in local auth/user wrappers could silently miss utilities or over-scan unused ones.

### P2. Performance audit was based on a false input boundary

Impact:

1. Even if CSS size looked correct, the source of generated utilities was not correctly modeled.
2. Any next-step optimization could easily target the wrong package tree.

---

## Root Cause Evidence

### Evidence 1. Vite alias points to local runtime packages

From `vite.config.ts`:

1. `@sdkwork/magic-studio-auth` resolves to `packages/sdkwork-magic-studio-auth/src/index.ts`
2. `@sdkwork/magic-studio-user` resolves to `packages/sdkwork-magic-studio-user/src/index.ts`

### Evidence 2. Local package entrypoints export local pages

From local package entrypoints:

1. `packages/sdkwork-magic-studio-auth/src/index.ts` exports local `LoginPage` and `AuthOAuthCallbackPage`
2. `packages/sdkwork-magic-studio-user/src/index.ts` exports local `ProfilePage`

### Evidence 3. Route CSS still scanned appbase identity trees

Before this fix:

1. `src/styles/auth.css` scanned `../../sdkwork-appbase/packages/pc-react/iam/sdkwork-auth-pc-react/src`
2. `src/styles/user.css` scanned `../../sdkwork-appbase/packages/pc-react/iam/sdkwork-user-pc-react/src`

### Evidence 4. Actual class-bearing files live in local package pages/components

Class-bearing files were confirmed in:

1. `packages/sdkwork-magic-studio-auth/src/pages`
2. `packages/sdkwork-magic-studio-auth/src/components`
3. `packages/sdkwork-magic-studio-user/src/pages`
4. `packages/sdkwork-magic-studio-user/src/components`

---

## Design And Execution Plan

Recommended approach:

1. Update auth route CSS to scan only:
   - `../../packages/sdkwork-magic-studio-auth/src/pages`
   - `../../packages/sdkwork-magic-studio-auth/src/components`
2. Update user route CSS to scan only:
   - `../../packages/sdkwork-magic-studio-user/src/pages`
   - `../../packages/sdkwork-magic-studio-user/src/components`
3. Tighten tests so they fail unless route CSS follows the real runtime package boundary.
4. Re-run the full identity regression suite and build.

Why this approach:

1. Fixes correctness without broad refactor.
2. Keeps scan roots focused on real class-bearing runtime sources.
3. Produces a trustworthy baseline for the next size-optimization round.

---

## Input / Output / Change Matrix

### 1. `src/styles/auth.css`

Input:

1. Old auth scan root pointed at appbase IAM package.

Output:

1. Auth scan root now points at local auth pages and components.

Change type: modified

### 2. `src/styles/user.css`

Input:

1. Old user scan root pointed at appbase IAM package.

Output:

1. User scan root now points at local user pages and components.

Change type: modified

### 3. `tests/identityCssBoundary.node.test.mjs`

Input:

1. Expected appbase identity scan roots.

Output:

1. Now asserts local runtime pages/components as the only route scan roots.

Change type: modified

### 4. `tests/authSharedUiParity.node.test.mjs`

Input:

1. Only checked separation between global CSS and appbase identity sources.

Output:

1. Now checks that auth/user route CSS scan the correct local runtime packages.

Change type: modified

### 5. `tests/authTailwindCompilation.node.test.mjs`

Input:

1. Compiled against appbase auth source assumption.
2. Used generic sample utility set that was not specific to local runtime pages.

Output:

1. Asserts `compiled.sources` for local auth pages/components.
2. Uses local auth-specific sample classes:
   - `rounded-[32px]`
   - `md:min-h-[720px]`
   - `tracking-[0.22em]`
   - `max-w-[320px]`

Change type: modified

### 6. `tests/userTailwindCompilation.node.test.mjs`

Input:

1. Compiled against appbase user source assumption.
2. Used sample utility set not specific to local runtime profile page.

Output:

1. Asserts `compiled.sources` for local user pages/components.
2. Uses local user-specific sample classes:
   - `bg-[#0f172a]`
   - `border-white/10`
   - `bg-white/[0.06]`
   - `xl:grid-cols-[minmax(0,1fr)_22rem]`

Change type: modified

---

## Red To Green Closure

### Red

Command:

```powershell
node --test tests/identityCssBoundary.node.test.mjs tests/authSharedUiParity.node.test.mjs tests/authTailwindCompilation.node.test.mjs tests/userTailwindCompilation.node.test.mjs
```

Result:

1. 4 / 4 failed.
2. Failures explicitly showed `auth.css` and `user.css` still pointed at appbase scan roots.
3. `compiled.sources` also proved Tailwind still registered the wrong source path.

### Green

Command:

```powershell
node --test tests/identityCssBoundary.node.test.mjs tests/authSharedUiParity.node.test.mjs tests/authTailwindCompilation.node.test.mjs tests/userTailwindCompilation.node.test.mjs
```

Result after fixing `src/styles/auth.css` and `src/styles/user.css`:

1. 4 / 4 passed.
2. Route CSS scan roots now match the runtime package boundary.

---

## Verification

### Identity and performance regression suite

Command:

```powershell
node --test tests/authDesktopWindowControls.node.test.mjs tests/authHostVisualParity.node.test.mjs tests/authLayoutParity.node.test.mjs tests/authLegacyReferenceCleanup.node.test.mjs tests/authLocalComposition.node.test.mjs tests/authLoginRuntimeStability.node.test.mjs tests/authSharedUiParity.node.test.mjs tests/authTailwindCompilation.node.test.mjs tests/authZhCnLocale.node.test.mjs tests/identityCssBoundary.node.test.mjs tests/identityCssLayerBoundary.node.test.mjs tests/identityHostDependencyParity.node.test.mjs tests/identityHostPresentation.node.test.mjs tests/identityThemeBridge.node.test.mjs tests/profileLayoutParity.node.test.mjs tests/userCenterHostBranding.node.test.mjs tests/userHostVisualParity.node.test.mjs tests/userLocalComposition.node.test.mjs tests/userSectionAdapterParity.node.test.mjs tests/userSharedShellParity.node.test.mjs tests/userTailwindCompilation.node.test.mjs tests/userZhCnLocale.node.test.mjs tests/appEntryFocusedSubpathBoundary.node.test.mjs tests/layoutShellBoundary.node.test.mjs tests/magiccutShellBoundary.node.test.mjs tests/magiccutFeatureSubpathBoundary.node.test.mjs tests/startupPerformance.node.test.mjs tests/viteManualChunks.node.test.mjs tests/viteChunkIsolation.node.test.mjs tests/viteReactAlias.node.test.mjs tests/i18nLazyBootstrapBoundary.node.test.mjs
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
2. Route CSS chunks remained split:
   - `dist/assets/auth-Y4IH3gtE.css`
   - `dist/assets/ProfilePage-DGLRKkWO.css`
3. Entry CSS stayed separate:
   - `dist/assets/index-3uHoKPMf.css`

### Key build numbers

1. `dist/assets/auth-Y4IH3gtE.css` `316.86 kB`
2. `dist/assets/ProfilePage-DGLRKkWO.css` `317.18 kB`
3. `dist/assets/index-3uHoKPMf.css` `359.71 kB`
4. `dist/assets/index-nUpWNh_U.js` `144.05 kB`

---

## Findings

### F1. This round fixed correctness, not size

The route CSS scan root now matches the package actually rendered by the runtime.

### F2. Bundle size stayed effectively unchanged

That means the previous route CSS size was not inflated mainly by scanning the wrong IAM package tree.

### F3. Remaining cost is in the real local auth/user utility set

The next optimization round should focus on actual utility output, not on correcting source ownership again.

---

## Next Step Plan

### Priority 1

Measure how much of `auth.css` and `user.css` is:

1. Tailwind theme token output
2. Tailwind utility output
3. host-authored CSS rules

### Priority 2

Audit the biggest utility families in local auth/user pages and components, especially:

1. arbitrary spacing and radius values
2. arbitrary shadows
3. gradient and color-mix utilities
4. dark-mode duplicated variants

### Priority 3

Evaluate whether a smaller shared IAM token layer can be referenced once globally while route CSS keeps only utilities.
