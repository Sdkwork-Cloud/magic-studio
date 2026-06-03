# Magic Studio V2 Performance Review Round 31

Date: 2026-04-06
Scope: `apps/magic-studio-v2`
Goal: wire the identity route CSS budget guard into the broader verified release pipeline so the accepted auth/profile CSS budgets are enforced before desktop bundle release.

---

## Stage Conclusion

Round 30 added the identity route CSS budget guard, but it still relied on humans remembering to run it.

Round 31 closes that gap:

1. `verify:identity-route-css-budget` remains the dedicated build artifact guard
2. `tauri:bundle:verified` now executes that guard after `tauri:build`
3. the verified desktop release pipeline will reject route CSS budget regressions before bundle packaging

This round did not change runtime CSS behavior. It changed the release verification boundary so the existing good route CSS baseline is harder to regress.

---

## Problem List

### P1. The route CSS budget guard was not part of the verified release pipeline

Impact:

1. auth/profile route CSS regressions could still slip through release automation if the standalone guard was skipped
2. the round-30 guard had value, but not enough enforcement

---

## Root Cause Investigation

### Evidence 1. `verify:identity-route-css-budget` already existed but was isolated

Before round 31:

1. `package.json` had `verify:identity-route-css-budget`
2. `tauri:bundle:verified` did not call it

### Evidence 2. Existing release verification already uses a single canonical script chain

The repo already treats:

1. `tauri:bundle:verified`

as the canonical release gate for desktop bundle production.

That makes it the correct place to add the identity route CSS budget guard rather than creating a second parallel release path.

---

## Hypothesis

Single hypothesis:

If `tauri:bundle:verified` executes `verify:identity-route-css-budget` immediately after `tauri:build`, identity route CSS regressions will be enforced as part of the verified release pipeline without changing runtime behavior.

Result:

1. confirmed by script contract test
2. confirmed by fresh build plus budget verification

---

## Input / Output / Change Matrix

### 1. `scripts/__tests__/release-bundle-verification.test.ts`

Input:

1. checked the verified release pipeline
2. did not require `verify:identity-route-css-budget`

Output:

1. now asserts the dedicated route CSS budget script exists
2. now asserts `tauri:bundle:verified` includes `pnpm run verify:identity-route-css-budget`

Change type: modified

### 2. `package.json`

Input:

1. `tauri:bundle:verified` skipped the identity route CSS budget guard

Output:

1. `tauri:bundle:verified` now runs `verify:identity-route-css-budget` after `tauri:build`

Change type: modified

---

## Red To Green Closure

### Red

Command:

```powershell
pnpm exec vitest run scripts/__tests__/release-bundle-verification.test.ts
```

Result before updating `package.json`:

1. `1 / 1` failed
2. failure showed `tauri:bundle:verified` did not contain `verify:identity-route-css-budget`

### Green

Command:

```powershell
pnpm exec vitest run scripts/__tests__/release-bundle-verification.test.ts scripts/__tests__/check-identity-route-css-budget.test.ts
```

Result after updating `package.json`:

1. `3 / 3` passed

---

## Accepted Implementation

### A1. Promote the route CSS budget guard into the verified release pipeline

`tauri:bundle:verified` now runs:

1. `verify:mode-style-parity`
2. `verify:sdk-mode-parity`
3. `tauri:build`
4. `verify:identity-route-css-budget`
5. remaining bundle verification steps

This ordering is deliberate:

1. the route CSS budget guard needs a fresh built `dist`
2. it should fail before later bundle verification and packaging steps

---

## Verification

### Release pipeline contract test

Command:

```powershell
pnpm exec vitest run scripts/__tests__/release-bundle-verification.test.ts scripts/__tests__/check-identity-route-css-budget.test.ts
```

Result:

1. `3 / 3` passed

### Fresh build

Command:

```powershell
pnpm run build:test
```

Result:

1. build passed
2. auth route CSS `22.06 kB`
3. profile route CSS `12.35 kB`

### Fresh route CSS budget verification

Command:

```powershell
pnpm run verify:identity-route-css-budget
```

Result:

1. passed

---

## Findings

### F1. The right next step after adding a guard is enforcing it in the canonical release path

This round completed that enforcement step without changing runtime code.

### F2. The verified release pipeline is now more aligned with the documented performance boundary

The accepted auth/profile route CSS budgets are no longer only documented or manually runnable. They are now part of the verified release script contract.

---

## Next Step Plan

### Priority 1

Decide whether `build:test` or another CI-oriented build entry should also chain `verify:identity-route-css-budget`, not only the Tauri verified release flow.

### Priority 2

If the team wants broader coverage, create a reusable composite build-artifact verification script so route CSS budget, self-contained bundle checks, and release target checks share one common entrypoint.

### Priority 3

Only after the verification chain is fully wired should the next performance iteration revisit `@property` overhead or other route CSS size experiments.
