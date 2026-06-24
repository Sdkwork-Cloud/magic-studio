> Migrated from `docs/review/2026-04-06-magic-studio-performance-round-32.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Magic Studio V2 Performance Review Round 32

Date: 2026-04-06
Scope: `apps/magic-studio-v2`
Goal: close the verified desktop release loop end to end after the git-mode SDK source alignment work, and make the release guards match the real build outputs produced by Vite and Tauri.

---

## Stage Conclusion

Round 32 completed the previously broken verified release chain.

Three independent guard failures were identified and closed:

1. `check-release-api-target` rejected a correct production bundle because it only accepted single-quote and double-quote env literals, while the real Vite bundle emitted template-literal env values
2. `check-tauri-embedded-assets` only searched the legacy `src-tauri/target/release/build` tree, while the current Tauri build writes embedded assets under the shared cargo target directory and may fall back to workspace `.cache/tauri/cargo-target`
3. `check-sdk-mode-parity` compared raw entry-JS bytes and treated chunk-hash filename drift as a runtime parity failure even when the normalized bundle logic was identical

After correcting those three issues, the canonical verified release entrypoint now succeeds:

```powershell
pnpm run tauri:bundle:verified
```

That command completed successfully on Windows on 2026-04-06 and produced:

```text
C:\Users\admin\AppData\Local\SDKWork\MagicStudio\cargo-target\release\bundle\nsis\Magic Studio_0.1.1_x64-setup.exe
```

---

## Problem List

### P1. Release API target verification rejected a valid production bundle

Impact:

1. `verify:release:api-target` failed even though `.env.production` and the built bundle were correct
2. `verify:release:artifacts` could not pass

### P2. Tauri embedded asset verification used an obsolete build-root assumption

Impact:

1. `verify:tauri:embedded-assets` failed after a successful Tauri production build
2. release artifact verification stopped before packaging

### P3. SDK mode parity verification compared raw chunk references instead of normalized runtime-equivalent JS

Impact:

1. `verify:sdk-mode-parity` failed inside `tauri:bundle:verified`
2. the canonical verified bundle entrypoint stayed blocked even after individual artifact guards passed

---

## Root Cause Investigation

### Evidence 1. Real Vite bundle env literals used backticks

Observed in the built bundle:

1. ``MODE:`production` ``
2. ``VITE_API_BASE_URL:`https://api.sdkwork.com` ``
3. ``VITE_APP_ENV:`production` ``

The previous checker only accepted:

1. `MODE:"production"`
2. `MODE:'production'`

This was a parser contract bug, not a build bug.

### Evidence 2. Real Tauri embedded assets lived under the shared cargo target

Observed on disk after `pnpm run tauri:build`:

1. `C:\Users\admin\AppData\Local\SDKWork\MagicStudio\cargo-target\release\build\magic-studio-*\out\tauri-codegen-assets`

The old checker only searched:

1. `src-tauri/target/release/build`

This guard had drifted from the current `scripts/tauri-path.mjs` build-path policy.

### Evidence 3. External and git entry JS differed only by hashed chunk filenames

Measured after separate `build` and `build:git-sdk` runs:

1. the entry `assets/index-<hash>.js` size was identical in both modes
2. after replacing hashed chunk references such as `./feature-image-<hash>.js` and `./shared-app-sdk-<hash>.js`, the two files were byte-for-byte equal

This meant the old parity checker was overfitting on bundle hash churn rather than comparing normalized runtime-equivalent output.

---

## Input / Output / Change Matrix

### 1. `scripts/check-release-api-target.mjs`

Input:

1. `analyzeBuiltBundle(content: string)`
2. bundle content from `dist/assets/*.js`

Output:

1. `{ errors: string[] }`

Change type: modified

Change details:

1. replaced brittle substring checks with literal matching that accepts `"..."`, `'...'`, and `` `...` ``
2. preserved the same error contract while aligning parsing with real Vite output

### 2. `scripts/__tests__/check-release-api-target.test.ts`

Input:

1. minified bundle fixture using template-literal env fields

Output:

1. regression coverage proving correct production bundles do not fail the guard

Change type: modified

### 3. `scripts/check-tauri-embedded-assets.mjs`

Input:

1. `inspectTauriEmbeddedAssets({ distRoot, projectDir, tauriBuildRoot, tauriBuildRoots, env, homeDir, platform, packageName })`

Output:

1. `string[]` violations

Change type: modified

Change details:

1. added multi-root resolution based on current Tauri path policy
2. searches these roots in order after de-duplication:
   - shared cargo target `resolveCargoTargetDir(...)/release/build`
   - workspace fallback `.cache/tauri/cargo-target/release/build`
   - legacy `src-tauri/target/release/build`
3. failure messages now list the searched roots instead of a single obsolete path

### 4. `scripts/__tests__/check-tauri-embedded-assets.test.ts`

Input:

1. shared cargo-target fixture
2. workspace fallback cargo-target fixture

Output:

1. regression coverage for both current supported Tauri build roots

Change type: added

### 5. `scripts/check-sdk-mode-parity.mjs`

Input:

1. `captureDesktopVisualSignature({ distRoot })`
2. built entry JS bundles from external and git SDK modes

Output:

1. normalized signature for HTML shell, CSS bundles, JS bundles, and root static assets
2. `compareDesktopVisualSignatures(...)` violations

Change type: modified

Change details:

1. JS bundle hashing now normalizes hashed chunk references before comparison
2. parity still fails on real JS logic drift, but no longer fails on equivalent chunk filename churn

### 6. `scripts/__tests__/check-sdk-mode-parity.test.ts`

Input:

1. bundle fixtures with only hashed chunk-reference differences

Output:

1. regression coverage proving normalized-equivalent JS no longer triggers a parity violation

Change type: modified

---

## Red To Green Closure

### Release API target guard

Red:

```powershell
pnpm run verify:release:api-target
```

Observed failure:

1. `Built bundle MODE must be "production"`
2. `Built bundle VITE_API_BASE_URL must be https://api.sdkwork.com`
3. `Built bundle VITE_APP_ENV must be "production"`

Green:

```powershell
pnpm exec vitest run scripts/__tests__/check-release-api-target.test.ts
pnpm run verify:release:api-target
```

Result:

1. tests passed
2. real bundle verification passed

### Tauri embedded asset guard

Red:

```powershell
pnpm run verify:release:artifacts
```

Observed failure:

1. `Could not find Tauri embedded assets for package "magic-studio" under ...\src-tauri\target\release\build`

Green:

```powershell
pnpm exec vitest run scripts/__tests__/check-tauri-embedded-assets.test.ts
pnpm run verify:tauri:embedded-assets
```

Result:

1. tests passed for shared and workspace fallback cargo target roots
2. real Tauri embedded asset verification passed

### SDK mode parity guard

Red:

```powershell
pnpm run tauri:bundle:verified
```

Observed failure:

1. `[sdk-parity] git compiled JS differs from external`

Green:

```powershell
pnpm exec vitest run scripts/__tests__/check-sdk-mode-parity.test.ts scripts/__tests__/check-build-mode-style-parity.test.ts
pnpm run verify:sdk-mode-parity
```

Result:

1. tests passed
2. real external-vs-git parity verification passed

---

## Verification

### Targeted regression suite

Command:

```powershell
pnpm exec vitest run scripts/__tests__/check-release-api-target.test.ts scripts/__tests__/check-tauri-embedded-assets.test.ts scripts/__tests__/check-sdk-mode-parity.test.ts scripts/__tests__/check-build-mode-style-parity.test.ts scripts/__tests__/release-bundle-verification.test.ts scripts/__tests__/tauri-path.test.ts
```

Result:

1. `6` test files passed
2. `21` tests passed

### SDK alias and source policy guard

Command:

```powershell
node --test tests/sdkModeWorkspaceAliasParity.node.test.mjs
```

Result:

1. `3` tests passed

### Real release artifact verification

Command:

```powershell
pnpm run verify:release:artifacts
```

Result:

1. `verify:identity-route-css-budget` passed
2. `verify:bundle:self-contained` passed
3. `verify:release:api-target` passed
4. `verify:tauri:embedded-assets` passed

### Canonical verified bundle entrypoint

Command:

```powershell
pnpm run tauri:bundle:verified
```

Result:

1. completed successfully
2. NSIS bundle was produced

---

## Findings

### F1. The remaining release blockers were all verification-drift bugs, not product-runtime bugs

The app and desktop build pipeline were already substantially correct. The failing guards had drifted away from real Vite and Tauri output formats and locations.

### F2. Byte-level parity checks need normalization at the same abstraction layer as the release contract

Comparing raw compiled JS bytes is too strict when the contract is runtime equivalence after hash normalization. The correct comparison boundary is normalized asset references plus normalized entry shell, not raw bundle text.

### F3. Reusing shared path policy is safer than maintaining a second build-root assumption

The Tauri embedded asset guard is now aligned with the same cargo target policy that the actual build command uses, reducing future path drift.

---

## Next Step Plan

### Priority 1

Add a compact machine-readable release verification report if CI needs to archive the verified build evidence without scraping console logs.

### Priority 2

Consider reducing duplicate rebuilds inside `tauri:bundle:verified`, because the current verified path runs multiple full Vite builds before packaging.

### Priority 3

If Linux and macOS verified packaging are required, run the same `tauri:bundle:verified` entrypoint on those operating systems and confirm the Tauri embedded asset guard resolves the expected non-Windows cargo target roots as intended.

