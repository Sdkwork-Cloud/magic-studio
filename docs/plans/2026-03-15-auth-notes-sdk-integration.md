# Auth And Notes SDK Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make `auth` and `notes` run end to end against the real backend SDK contract, adding backend APIs and regenerating the SDK when contract gaps are found.

**Architecture:** Stabilize authentication first so the session client is reliable, then audit and formalize the notes contract. Frontend services must end on generated SDK methods rather than long-term raw HTTP probing.

**Tech Stack:** React, TypeScript, pnpm workspace, generated `@sdkwork/app-sdk`, app-specific React packages, backend OpenAPI generation, Vite, Tauri

---

### Task 1: Audit Current Auth Contract

**Files:**
- Modify: `docs/reports/2026-03-15-auth-notes-contract-audit.md`
- Inspect: `packages/sdkwork-react-auth/src/services/appAuthService.ts`
- Inspect: `packages/sdkwork-react-auth/src/store/authStore.tsx`
- Inspect: `packages/sdkwork-react-core/src/sdk/useAppSdkClient.ts`

**Step 1: Write the failing auth contract test**

Create or extend auth tests to cover:

```ts
it('restores a persisted session only when profile lookup succeeds', async () => {
  expect(await syncCurrentSession()).toBe(true);
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm.cmd exec vitest run packages/sdkwork-react-auth`
Expected: FAIL on current contract mismatch or missing coverage.

**Step 3: Document actual SDK method names and payload shapes**

Record the real `auth` and `user` SDK methods and response fields in the audit report.

**Step 4: Update auth service/store to match the real contract**

Use the generated SDK response shape instead of assumptions where they differ.

**Step 5: Run auth tests again**

Run: `pnpm.cmd exec vitest run packages/sdkwork-react-auth`
Expected: PASS for the audited auth scenarios.

### Task 2: Audit Current Notes Contract

**Files:**
- Modify: `docs/reports/2026-03-15-auth-notes-contract-audit.md`
- Inspect: `packages/sdkwork-react-notes/src/services/noteService.ts`
- Inspect: `packages/sdkwork-react-notes/src/store/noteStore.tsx`

**Step 1: Write the failing notes contract tests**

Create or extend notes tests to cover:

```ts
it('loads notes via generated sdk methods without raw-http-only dependencies', async () => {
  const result = await noteService.findAll({ page: 0, size: 20 });
  expect(result.success).toBe(true);
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm.cmd exec vitest run packages/sdkwork-react-notes`
Expected: FAIL where current assumptions do not match the real SDK.

**Step 3: Record method gaps**

List required note capabilities:
- list notes
- note detail
- note content
- create note
- update note metadata
- update note content
- move note
- favorite/unfavorite
- trash/restore
- permanent delete
- clear trash
- list/create/update/delete/move folder

**Step 4: Mark which capabilities already exist in SDK**

Capture exact method names and missing endpoints in the audit report.

**Step 5: Re-run notes tests**

Run: `pnpm.cmd exec vitest run packages/sdkwork-react-notes`
Expected: still FAIL until contract gaps are fixed downstream.

### Task 3: Add Missing Backend APIs For Auth Or Notes

**Files:**
- Modify: backend auth and notes controller/service files in the server application repo
- Modify: backend OpenAPI-exposed DTOs if required
- Modify: `docs/reports/2026-03-15-auth-notes-contract-audit.md`

**Step 1: For each missing method, write or update backend tests if available**

Add minimal server-side coverage for any newly introduced endpoint behavior.

**Step 2: Implement missing backend endpoints**

Add only the endpoints required by the audited auth and notes flows.

**Step 3: Compile the backend**

Run the backend compile command used by this workspace.
Expected: backend compiles successfully.

**Step 4: Refresh OpenAPI snapshot**

Export the latest `/v3/api-docs/app` snapshot used by the SDK generator.

**Step 5: Regenerate `@sdkwork/app-sdk`**

Run the workspace SDK generation flow and confirm the new methods exist.

### Task 4: Refit Frontend Auth To The Regenerated SDK

**Files:**
- Modify: `packages/sdkwork-react-auth/src/services/appAuthService.ts`
- Modify: `packages/sdkwork-react-auth/src/store/authStore.tsx`
- Modify: `src/pages/LoginPage.tsx`
- Modify: any auth tests added in `packages/sdkwork-react-auth`

**Step 1: Write or update failing tests for final auth behaviors**

Cover login, restore, refresh, logout, and invalid-session clearing.

**Step 2: Run tests to verify RED**

Run: `pnpm.cmd exec vitest run packages/sdkwork-react-auth`
Expected: FAIL before implementation changes.

**Step 3: Implement minimal auth changes**

Align service mapping, session persistence, and store recovery with the regenerated SDK.

**Step 4: Run tests to verify GREEN**

Run: `pnpm.cmd exec vitest run packages/sdkwork-react-auth`
Expected: PASS.

**Step 5: Check login routing behavior**

Confirm `/login` still transitions to `ROUTES.HOME` after successful auth.

### Task 5: Refine Notes Service To Formal SDK Methods

**Files:**
- Modify: `packages/sdkwork-react-notes/src/services/noteService.ts`
- Modify: `packages/sdkwork-react-notes/src/services/noteBusinessService.ts`
- Modify: `packages/sdkwork-react-notes/src/store/noteStore.tsx`
- Modify: notes tests in `packages/sdkwork-react-notes`

**Step 1: Write or update failing tests for final note behaviors**

Cover CRUD, folder operations, trash lifecycle, and debounced content persistence.

**Step 2: Run tests to verify RED**

Run: `pnpm.cmd exec vitest run packages/sdkwork-react-notes`
Expected: FAIL before final service refit.

**Step 3: Replace provisional fallback logic where formal methods now exist**

Keep only minimal compatibility code if strictly required by the final generated SDK shape.

**Step 4: Update store behavior if service semantics changed**

Ensure optimistic updates reconcile correctly with authoritative backend state.

**Step 5: Run tests to verify GREEN**

Run: `pnpm.cmd exec vitest run packages/sdkwork-react-notes`
Expected: PASS.

### Task 6: Integrate And Verify In The App

**Files:**
- Modify: `src/router/packageRoutes.tsx`
- Modify: `src/app/bootstrap.ts`
- Modify: any app-level auth/session guard wiring that proves necessary

**Step 1: Write the failing integration checks**

Cover app bootstrap session restore and authenticated access to notes.

**Step 2: Run targeted tests**

Run: `pnpm.cmd exec vitest run src`
Expected: FAIL before integration fixes if bootstrap or routing is incomplete.

**Step 3: Implement minimal integration changes**

Add bootstrap/session synchronization or route-level handling if needed.

**Step 4: Re-run targeted tests**

Run: `pnpm.cmd exec vitest run src`
Expected: PASS.

### Task 7: Final Verification

**Files:**
- Modify: `docs/reports/2026-03-15-auth-notes-contract-audit.md`

**Step 1: Run notes and auth test suites**

Run: `pnpm.cmd exec vitest run packages/sdkwork-react-auth packages/sdkwork-react-notes`
Expected: PASS.

**Step 2: Run service encapsulation audit**

Run: `pnpm.cmd run audit:services`
Expected: PASS.

**Step 3: Run typecheck**

Run: `pnpm.cmd typecheck`
Expected: PASS.

**Step 4: Run build**

Run: `pnpm.cmd build`
Expected: PASS.

**Step 5: Record verification evidence**

Update the audit report with the exact commands run, major contract decisions, and any remaining risk.
