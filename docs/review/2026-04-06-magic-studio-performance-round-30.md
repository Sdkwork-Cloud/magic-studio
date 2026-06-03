# Magic Studio V2 Performance Review Round 30

Date: 2026-04-06
Scope: `apps/magic-studio-v2`
Goal: validate whether auth/user route CSS can safely deduplicate Tailwind theme output, then keep only the better implementation and lock the winning budget with an explicit post-build guard.

---

## Stage Conclusion

Round 30 tested a seemingly reasonable optimization:

1. remove `theme.css` from `src/styles/auth.css` and `src/styles/user.css`
2. replace direct theme import with a shared `@reference` contract
3. keep only route-local `utilities.css` output

The experiment did remove the explicit `@layer theme` block from route CSS, but it did not improve the shipped auth route bundle.

Measured result:

1. experimental auth route CSS increased from `22.06 kB` to `24.17 kB`
2. experimental profile route CSS stayed effectively flat at `12.35 kB`
3. the extra auth cost came from larger utility output with repeated fallback values

Because the experimental path regressed the real build artifact, it was rejected and rolled back.

The accepted round-30 change is not the rejected theme-sharing refactor. The accepted change is a new post-build budget guard that protects the better round-29 output from future regressions.

---

## Problem List

### P1. Theme deduplication looked correct in source analysis but regressed real auth bundle size

Impact:

1. an optimization could be merged even though it makes the shipped auth route CSS larger
2. source-level reasoning alone is insufficient for this class of Tailwind optimization

### P2. The project had no explicit post-build guard for identity route CSS budgets

Impact:

1. regressions in auth/profile CSS chunk sizes could slip through if tests only inspect source or compile metadata
2. foreign selectors from unrelated features could return without an explicit build artifact check

---

## Root Cause Investigation

### Evidence 1. Round-29 remained the best shipped baseline

Fresh rollback build produced:

1. `dist/assets/auth-DcVt5bIc.css` `22.06 kB`
2. `dist/assets/ProfilePage-C1V7u-eG.css` `12.35 kB`
3. `dist/assets/index-CqpH9W0S.css` `359.75 kB`

### Evidence 2. The `@reference` experiment removed theme output but expanded auth utilities

Experimental build produced:

1. `dist/assets/auth-BCJWuvJd.css` `24.17 kB`
2. `dist/assets/ProfilePage-BRqIdKJx.css` `12.35 kB`

Auth segment comparison:

1. round-29 auth `themeLayer` about `1,375 B`
2. experimental auth `themeLayer` `0 B`
3. round-29 auth `utilitiesLayer` about `13,882 B`
4. experimental auth `utilitiesLayer` about `17,346 B`

This means the removed theme block was more than offset by larger utility declarations.

### Evidence 3. The regression was driven by fallback expansion inside utilities

In the rejected experimental auth build, utilities expanded into patterns such as:

1. `var(--spacing,.25rem)`
2. `var(--color-zinc-200,oklch(...))`
3. `var(--color-primary-600,var(--theme-primary-600))`

That repeated fallback data inflated the auth route utility block enough to erase the expected savings from removing `@layer theme`.

### Evidence 4. The rejected full `@reference "../index.css"` path also broadened compile sources

That first experiment pulled in:

1. `../../sdkwork-ui/sdkwork-ui-pc-react/src`

through the referenced global stylesheet, which was the wrong source boundary for route-local CSS. A dedicated reference contract fixed the source-boundary problem, but still lost on final bundle size.

---

## Hypothesis

Single hypothesis tested in round 30:

If auth/user route stylesheets stop emitting their own Tailwind theme layer and instead consume a shared reference contract, the route CSS bundles should shrink without reintroducing unrelated sources.

Result:

1. hypothesis rejected for auth build output
2. source-boundary cleanliness improved
3. shipped bundle size did not improve

---

## Input / Output / Change Matrix

### 1. `src/styles/auth.css`

Input:

1. kept the round-29 `theme.css + utilities.css + source(none)` route setup

Output:

1. final accepted state remains the round-29 implementation after rollback

Change type: temporarily modified during experiment, then restored

### 2. `src/styles/user.css`

Input:

1. kept the round-29 `theme.css + utilities.css + source(none)` route setup

Output:

1. final accepted state remains the round-29 implementation after rollback

Change type: temporarily modified during experiment, then restored

### 3. `src/styles/tailwind-reference.css`

Input:

1. did not exist before the experiment

Output:

1. experimental shared theme reference contract
2. removed after the experiment was rejected

Change type: added temporarily, then deleted

### 4. `scripts/check-identity-route-css-budget.mjs`

Input:

1. no explicit build artifact guard for auth/profile route CSS budgets

Output:

1. locates built `auth-*.css` and `ProfilePage-*.css` assets
2. enforces size budgets
3. rejects foreign selectors such as `webkit-media-controls` and `webkit-slider-thumb`
4. supports CLI execution through `node scripts/check-identity-route-css-budget.mjs`

Change type: added

### 5. `scripts/__tests__/check-identity-route-css-budget.test.ts`

Input:

1. no automated test for the new route CSS budget guard

Output:

1. verifies passing fixtures stay within budget
2. verifies oversize and foreign-selector regressions are reported

Change type: added

### 6. `package.json`

Input:

1. no dedicated script entry for route CSS budget verification

Output:

1. added `verify:identity-route-css-budget`

Change type: modified

---

## Red To Green Closure

### Red

Command:

```powershell
pnpm exec vitest run scripts/__tests__/check-identity-route-css-budget.test.ts
```

Initial result:

1. failed because `scripts/check-identity-route-css-budget.mjs` did not exist

### Green

Command:

```powershell
pnpm exec vitest run scripts/__tests__/check-identity-route-css-budget.test.ts
```

Result after implementing the script:

1. `2 / 2` passed

---

## Accepted Implementation

### A1. Reject the `@reference` theme-sharing refactor

The experiment was fully executed, measured, and rolled back because it made the shipped auth route CSS worse.

### A2. Keep the round-29 route stylesheet architecture

Auth and user route CSS remain on the proven setup:

1. `@import "tailwindcss/theme.css" layer(theme) source(none);`
2. `@import "tailwindcss/utilities.css" layer(utilities) source(none);`
3. explicit local `@source` roots only

### A3. Add a build artifact budget guard

The new script now protects the winning route CSS boundary from future regressions by checking:

1. auth route CSS size
2. profile route CSS size
3. foreign selector absence

---

## Verification

### Identity and performance regression suite

Command:

```powershell
node --test tests/authDesktopWindowControls.node.test.mjs tests/authHostVisualParity.node.test.mjs tests/authLayoutParity.node.test.mjs tests/authLegacyReferenceCleanup.node.test.mjs tests/authLocalComposition.node.test.mjs tests/authLoginRuntimeStability.node.test.mjs tests/authSharedUiParity.node.test.mjs tests/authTailwindCompilation.node.test.mjs tests/authZhCnLocale.node.test.mjs tests/identityCssBoundary.node.test.mjs tests/identityCssLayerBoundary.node.test.mjs tests/identityHostDependencyParity.node.test.mjs tests/identityHostPresentation.node.test.mjs tests/identityThemeBridge.node.test.mjs tests/profileLayoutParity.node.test.mjs tests/userCenterHostBranding.node.test.mjs tests/userHostVisualParity.node.test.mjs tests/userLocalComposition.node.test.mjs tests/userSectionAdapterParity.node.test.mjs tests/userSharedShellParity.node.test.mjs tests/userTailwindCompilation.node.test.mjs tests/userZhCnLocale.node.test.mjs tests/appEntryFocusedSubpathBoundary.node.test.mjs tests/layoutShellBoundary.node.test.mjs tests/magiccutShellBoundary.node.test.mjs tests/magiccutFeatureSubpathBoundary.node.test.mjs tests/startupPerformance.node.test.mjs tests/viteManualChunks.node.test.mjs tests/viteChunkIsolation.node.test.mjs tests/viteReactAlias.node.test.mjs tests/i18nLazyBootstrapBoundary.node.test.mjs
```

Result:

1. `44 / 44` passed

### Component smoke test

Command:

```powershell
pnpm exec vitest run src/layouts/MainLayout/MainSidebar.test.tsx src/layouts/MagicCutLayout/MagicCutLayoutHeader.test.tsx
```

Result:

1. `4 / 4` passed

### Budget guard unit test

Command:

```powershell
pnpm exec vitest run scripts/__tests__/check-identity-route-css-budget.test.ts
```

Result:

1. `2 / 2` passed

### Build verification

Command:

```powershell
pnpm run build:test
```

Result:

1. build passed
2. auth route CSS returned to `22.06 kB`
3. profile route CSS stayed at `12.35 kB`

### Budget guard against the fresh build

Command:

```powershell
pnpm run verify:identity-route-css-budget
```

Result:

1. passed
2. the fresh build stayed within the accepted auth/profile budgets

---

## Findings

### F1. Removing route theme output is not automatically a win

For the auth route in this codebase, removing the explicit theme layer caused larger utility output and a worse final bundle.

### F2. Build artifact truth matters more than source cleanliness for this optimization

The rejected refactor looked cleaner at the stylesheet-contract level but lost on the shipped CSS asset that users actually download.

### F3. The correct round-30 permanent change is the guard, not the refactor

The new route CSS budget script is the durable improvement that came out of this iteration.

---

## Next Step Plan

### Priority 1

Wire `verify:identity-route-css-budget` into the broader build verification chain once the team is ready to enforce the budget in CI.

### Priority 2

Investigate whether the remaining route CSS overhead is now dominated by `@property` output rather than `@layer theme`, and only continue if a real build artifact win is demonstrable.

### Priority 3

If future optimizations are tested again, require build artifact comparison as a first-class acceptance gate rather than accepting source-level cleanliness alone.
