# Type Contract Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restore a reliable shared type contract across `@sdkwork/react-types`, `@sdkwork/react-commons`, and downstream packages so `pnpm.cmd typecheck` passes and public data structures stop drifting.

**Architecture:** Treat `@sdkwork/react-types` as the single source of truth for cross-package entities and enums. First fix declaration output and package export paths so project references resolve correctly, then remove duplicated public contracts from `react-core` and `react-commons`, and finally tighten locale/view-model types where `string`/`any` currently bypass validation.

**Tech Stack:** TypeScript 5, pnpm workspaces, Turbo, Vite, vite-plugin-dts, React 19

**Execution Strategy:** Execute in four batches with hard review gates. Batch A repairs `@sdkwork/react-types` declaration publishing only. Batch B re-runs `@sdkwork/react-core` typecheck and fixes only residual base-entity and notification-contract issues. Batch C tightens locale contracts. Batch D removes duplicated shared view models only after the earlier batches are green.

**Stop Gates:** Stop immediately if Batch A does not eliminate `TS6305`, if fixing one package requires changing unrelated feature behavior, or if the workspace gate fails for reasons outside the type-contract chain being cleaned up. Report the exact remaining errors before continuing.

**Out of Scope:** Do not refactor unrelated runtime logic, visual components, or SDK integration flows unless a failing typecheck proves they are required to restore the shared contract.

---

## Batch A Execution Card

**Objective:** Eliminate `TS6305` for `@sdkwork/react-types` without widening the change into a monorepo-wide packaging migration.

**Read First:**
- `packages/sdkwork-react-types/package.json`
- `packages/sdkwork-react-types/tsconfig.json`
- `packages/sdkwork-react-types/vite.config.ts`
- `packages/sdkwork-react-core/tsconfig.json`
- `packages/sdkwork-react-i18n/package.json`
- `packages/sdkwork-react-fs/package.json`
- `packages/sdkwork-react-commons/package.json`

**Fast Path:**
1. Run `pnpm.cmd --filter @sdkwork/react-core typecheck` and confirm the current red state includes `TS6305` for `@sdkwork/react-types/dist/src/index.d.ts`.
2. Compare sibling package packaging and confirm the repo currently favors source-entry package metadata.
3. Keep that package-entry pattern unless there is hard evidence it is the root cause.
4. Align only the declaration output layout and TypeScript composite expectation for `@sdkwork/react-types`.
5. Rebuild `@sdkwork/react-types`.
6. Re-run `pnpm.cmd --filter @sdkwork/react-core typecheck`.

**Decision Branches:**
- Branch 1, preferred:
  The package metadata can stay source-entry, and the fix is to make declaration output land where project references expect it, or to make project references expect the declaration path already being emitted.
- Branch 2, fallback:
  If the source-entry pattern itself is proven incompatible for `@sdkwork/react-types`, switch only this package to a dist-entry pattern and document that it is an exception. Do not migrate sibling packages in the same batch.

**Success Criteria:**
- `pnpm.cmd --filter @sdkwork/react-types build` passes.
- `TS6305` disappears from `pnpm.cmd --filter @sdkwork/react-core typecheck`.
- No sibling packages are edited in Batch A.

**Abort Conditions:**
- Fixing `react-types` requires changing unrelated runtime code.
- `TS6305` simply moves to another package in the same chain.
- The only way forward is a repo-wide package-entry migration.

### Task 1: Repair `@sdkwork/react-types` declaration publishing

**Files:**
- Modify: `packages/sdkwork-react-types/package.json`
- Modify: `packages/sdkwork-react-types/tsconfig.json`
- Modify: `packages/sdkwork-react-types/vite.config.ts`
- Verify: `packages/sdkwork-react-types/dist/index.d.ts`
- Verify: sibling package patterns in `packages/sdkwork-react-i18n/package.json`, `packages/sdkwork-react-fs/package.json`, `packages/sdkwork-react-commons/package.json`

**Step 1: Reproduce the contract failure**

Run: `pnpm.cmd --filter @sdkwork/react-core typecheck`
Expected: FAIL with `TS6305` pointing at `@sdkwork/react-types/dist/src/index.d.ts`.

**Step 1.1: Compare with sibling package packaging**

Inspect `@sdkwork/react-i18n`, `@sdkwork/react-fs`, and `@sdkwork/react-commons` packaging to confirm whether the workspace currently follows a source-entry pattern or a dist-entry pattern.

Expected: confirm that this repo mostly uses a source-entry workspace pattern (`main/module/types -> src/index.ts`) even when `dist/` is published.

**Step 2: Choose the minimal repair strategy**

Preferred strategy: keep the existing workspace source-entry pattern and fix only the declaration layout or TypeScript project-reference expectations so `react-core` can consume `react-types` without `TS6305`.

Fallback strategy: switch `react-types` to a dist-entry pattern only if the declaration/layout mismatch cannot be corrected cleanly inside the current workspace model.

Do not change `react-types` package entry points to `dist/*` by default unless you explicitly decide to standardize sibling packages later.

**Step 3: Make declaration generation deterministic**

Adjust `packages/sdkwork-react-types/tsconfig.json` and `packages/sdkwork-react-types/vite.config.ts` so emitted declaration paths match what downstream composite builds resolve. Avoid a mixed “tsc composite expects `dist/src/*` but Vite emits `dist/*`” layout.

Preferred target: either
- emit declarations to `dist/src/*` so they match the current composite expectation, or
- reconfigure the TypeScript project so the expected declaration root becomes `dist/*`.

Pick one layout and make all of these agree on it:
- `tsconfig` composite output expectation
- `vite-plugin-dts` output layout
- any package `types`/`exports` fields that point at generated declarations

**Step 4: Rebuild the package**

Run: `pnpm.cmd --filter @sdkwork/react-types build`
Expected: PASS and produce stable `dist/index.d.ts`.

**Step 4.1: Inspect the actual declaration outputs**

Confirm that the build emits declaration files in the same layout expected by downstream project references. If the chosen layout is `dist/src/*`, verify that `dist/src/index.d.ts` exists. If the chosen layout is `dist/*`, verify that the TypeScript project no longer expects `dist/src/*`.

If the build output and the TypeScript expectation still disagree, stop and correct that mismatch before moving on.

**Step 4.2: Re-run the failing downstream consumer**

Run: `pnpm.cmd --filter @sdkwork/react-core typecheck`
Expected: `TS6305` is gone. Remaining errors, if any, should now be real downstream contract issues.

**Step 5: Commit**

```bash
git add packages/sdkwork-react-types/package.json packages/sdkwork-react-types/tsconfig.json packages/sdkwork-react-types/vite.config.ts
git commit -m "fix: align react-types declaration layout"
```

### Task 2: Revalidate the base entity contract

**Files:**
- Modify: `packages/sdkwork-react-core/src/services/base/LocalStorageService.ts`
- Verify: `packages/sdkwork-react-types/src/base.types.ts`
- Verify: `packages/sdkwork-react-commons/src/types.ts`

**Step 1: Re-run the downstream typecheck**

Run: `pnpm.cmd --filter @sdkwork/react-core typecheck`
Expected: FAIL only on real generic/contract issues after `TS6305` is gone.

**Step 1.1: Trim the error set before editing**

Capture the exact remaining errors after Batch A. If `TS6305` is still present, return to Task 1 instead of editing `LocalStorageService`.

**Step 2: Tighten generic assumptions**

If `LocalStorageService<T extends BaseEntity>` still accesses fields TypeScript cannot prove, refactor the method signatures or local helpers so `id`, `createdAt`, and `updatedAt` are guaranteed through the generic contract instead of via unchecked casts.

**Step 3: Verify the fix**

Run: `pnpm.cmd --filter @sdkwork/react-core typecheck`
Expected: PASS for `LocalStorageService` and notification field access.

**Step 4: Commit**

```bash
git add packages/sdkwork-react-core/src/services/base/LocalStorageService.ts
git commit -m "fix: enforce base entity requirements in local storage service"
```

### Task 3: Consolidate notification types into one public contract

**Files:**
- Modify: `packages/sdkwork-react-core/src/services/notification/entities.ts`
- Modify: `packages/sdkwork-react-core/src/services/notification/notificationService.ts`
- Modify: `packages/sdkwork-react-core/src/services/notification/index.ts`
- Verify: `packages/sdkwork-react-types/src/common.types.ts`
- Verify: `packages/sdkwork-react-notifications/src/services/notificationService.ts`

**Step 1: Remove the duplicate notification model**

Replace the local `NotificationType` union and local `AppNotification` interface in `react-core` with imports from `@sdkwork/react-types` or `@sdkwork/react-commons`.

Preferred source: `@sdkwork/react-types` for the underlying data contract. Use `@sdkwork/react-commons` only where it is already a thin re-export and does not create another ownership layer.

**Step 2: Normalize runtime values at the boundary**

Keep lower/upper-case conversion logic only in service adapters. Public types should stay on the shared enum-based contract.

**Step 3: Verify both consumers compile**

Run: `pnpm.cmd --filter @sdkwork/react-core typecheck`

Run: `pnpm.cmd --filter @sdkwork/react-notifications typecheck`

Expected: PASS with no duplicate notification-shape errors.

If `react-notifications` still compiles only because of local normalization shims, keep those shims at the service boundary and do not reintroduce a second exported notification type.

**Step 4: Commit**

```bash
git add packages/sdkwork-react-core/src/services/notification/entities.ts packages/sdkwork-react-core/src/services/notification/notificationService.ts packages/sdkwork-react-core/src/services/notification/index.ts
git commit -m "refactor: use shared notification contract"
```

### Task 4: Unify locale typing across settings and i18n

**Files:**
- Modify: `packages/sdkwork-react-i18n/src/types.ts`
- Modify: `packages/sdkwork-react-i18n/src/packageTypes.ts`
- Modify: `packages/sdkwork-react-i18n/src/packageRegistry.ts`
- Modify: `packages/sdkwork-react-settings/src/entities/settings.entity.ts`
- Modify: `packages/sdkwork-react-settings/src/store/settingsStore.tsx`

**Step 1: Choose one app-locale model**

Use one canonical app locale union for persisted settings and service APIs. If package resources must stay `en-US`, keep a mapping type internally instead of exposing both contracts as peer public types.

Recommended canonical app locale: keep the app-facing persisted setting small and stable, then map internally to package-resource locale keys. Do not expose both `Locale` and `SupportedLocale` as equally authoritative public contracts.

**Step 2: Remove `string`/`as any` escape hatches**

Change `general.language` from `string` to a real union type and update `usePackageTranslation`/settings sync code to accept only valid locales.

**Step 3: Verify locale consumers**

Run: `pnpm.cmd --filter @sdkwork/react-i18n typecheck`

Run: `pnpm.cmd --filter @sdkwork/react-settings typecheck`

Expected: PASS with no locale-cast workarounds.

Also confirm that settings defaults and language auto-detection still resolve to a valid persisted locale without `as any`.

**Step 4: Commit**

```bash
git add packages/sdkwork-react-i18n/src/types.ts packages/sdkwork-react-i18n/src/packageTypes.ts packages/sdkwork-react-i18n/src/packageRegistry.ts packages/sdkwork-react-settings/src/entities/settings.entity.ts packages/sdkwork-react-settings/src/store/settingsStore.tsx
git commit -m "refactor: unify locale contracts"
```

### Task 5: Remove duplicated shared view-model definitions

**Files:**
- Modify: `packages/sdkwork-react-commons/src/types.ts`
- Modify: `packages/sdkwork-react-commons/src/index.ts`
- Modify: `packages/sdkwork-react-portal-video/src/entities/portal.entity.ts`
- Modify: `packages/sdkwork-react-assets/src/components/CreationChatInput/StyleSelector.tsx`
- Verify: any current imports of `GalleryItem`, `StyleOption`, `InputAttachmentData`

**Step 1: Pick an ownership boundary**

Keep cross-package DTOs in `@sdkwork/react-types`. Keep `react-commons` limited to UI-only wrappers or direct re-exports. Do not maintain duplicate public interfaces with the same names.

This task is intentionally last. If earlier batches already restore typecheck and the duplicate types are not yet causing incorrect behavior, this task may be split into a follow-up cleanup PR to reduce blast radius.

**Step 2: Collapse duplicate shapes**

Replace local copies of `StyleOption`, `GalleryItem`, and `InputAttachmentData` where possible with imports from the chosen source package. Only keep component-local extensions if they are truly private and differently named.

**Step 3: Verify dependents**

Run: `pnpm.cmd --filter @sdkwork/react-commons typecheck`

Run: `pnpm.cmd --filter @sdkwork/react-assets typecheck`

Run: `pnpm.cmd --filter @sdkwork/react-portal-video typecheck`

Expected: PASS with no shape drift or forced casts.

If a component truly needs a richer local UI shape, rename it so it does not shadow the shared DTO name.

**Step 4: Commit**

```bash
git add packages/sdkwork-react-commons/src/types.ts packages/sdkwork-react-commons/src/index.ts packages/sdkwork-react-portal-video/src/entities/portal.entity.ts packages/sdkwork-react-assets/src/components/CreationChatInput/StyleSelector.tsx
git commit -m "refactor: deduplicate shared view model types"
```

### Task 6: Full verification and cleanup

**Files:**
- Verify only

**Step 1: Run focused package checks**

Run: `pnpm.cmd --filter @sdkwork/react-types build`

Run: `pnpm.cmd --filter @sdkwork/react-core typecheck`

Run: `pnpm.cmd --filter @sdkwork/react-i18n typecheck`

Run: `pnpm.cmd --filter @sdkwork/react-settings typecheck`

Run: `pnpm.cmd --filter @sdkwork/react-notifications typecheck`

Expected: PASS.

**Step 2: Run workspace gate**

Run: `pnpm.cmd typecheck`
Expected: PASS across the workspace, or fail only on unrelated pre-existing packages that are explicitly documented as outside this cleanup.

**Step 3: Optional build gate**

Run: `pnpm.cmd build`
Expected: PASS if no unrelated build regressions exist.

If the monorepo remains noisy because of pre-existing unrelated changes, record exactly which failures are outside the type-contract cleanup and stop there instead of widening scope.

**Step 4: Commit**

```bash
git add .
git commit -m "chore: stabilize shared type contracts"
```
