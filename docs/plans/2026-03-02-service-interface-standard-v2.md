# Service Interface Standard v2

Date: 2026-03-02  
Status: Iteration Passed (v2.7 candidate, pending policy confirmation)

## 1. Goals

1. Keep all interaction side effects in service layer only.
2. Preserve progressive delivery: migrate boundary first, then swap implementation.
3. Reserve SDK integration seams with adapter injection (`set/get/reset`).
4. Keep UI and store deterministic and testable.

## 2. Layering Rules

1. UI layer (`components/pages`)
- Can call store/service APIs only.
- Must not directly call `fetch`, `localStorage/sessionStorage`, `navigator.clipboard`, or `@tauri-apps/api/core.invoke`.

2. Store layer
- Can orchestrate state and call services.
- Must not directly call platform APIs or persistence/network APIs.

3. Service layer (`src/services/**`)
- Owns all side effects and platform interactions.
- Must expose typed interfaces.
- For external dependencies, provide adapter injection seam.

4. Infrastructure exceptions
- Allowed direct platform interaction:
  - `packages/sdkwork-react-core/src/platform/**`
  - `packages/sdkwork-app-sdk-typescript/**`
- These are boundary adapters by design.

## 3. Required File Contract Per Feature Package

1. `src/services/index.ts` must exist and export service APIs.
2. Every new interaction service should expose:
- `service` object
- `setXxxAdapter(adapter)`
- `getXxxAdapter()`
- `resetXxxAdapter()`
3. Existing business services can use `createServiceAdapterController(...)` from commons.

## 4. Interface Contract

1. Public service methods must use explicit parameter and return types.
2. No `any` in exported service API signatures.
3. Error contract:
- Cross-boundary business service interfaces (`*BusinessService`, `*BusinessAdapter`) must return `Promise<ServiceResult<T>>`.
- Internal infra helper: can return raw promise (`Promise<ArrayBuffer>`, etc.) if caller performs business error mapping.

## 5. Forbidden Direct Calls Outside Service Layer

1. `fetch(...)`
2. `localStorage` / `sessionStorage`
3. `navigator.clipboard`
4. `invoke(...)` from `@tauri-apps/api/core`
5. `window.__sdkworkPlatform`
6. `window.__sdkworkUploadHelper`

Enforcement:
- Use `scripts/audit-service-encapsulation.mjs`.
- Policy file: `docs/plans/service-encapsulation-policy.json`.
- Policy validation command: `pnpm.cmd run audit:services:policy`.
- Policy PR review-gate command: `pnpm.cmd run audit:services:policy:review-gate` (CI provides `POLICY_BASE_FILE` and PR labels).
- Strict gate command: `pnpm.cmd run audit:services`.
- Local full verification command: `pnpm.cmd run verify:service-standards`.
- CI workflow: `.github/workflows/service-standards.yml`.
- CI execution strategy: run `audit:services` and `build` as independent steps.
- CI policy review gate:
  - Any policy change requires label `service-policy-reviewed`.
  - High-risk policy key changes require extra label `service-policy-high-risk-reviewed`.
- CI artifact policy: upload service audit reports as workflow artifacts (retention 14 days).
- Required CI gate target:
  - direct interaction violations must be zero.
  - SDK adapter seam gaps must be zero.
  - services index contract gaps must be zero.
  - root services export gaps must be zero.
  - empty `src/services` directories must be zero.
  - exported `any` in service API signatures must be zero.
  - business service Promise contract gaps must be zero.

## 6. Migration Workflow

1. Identify direct calls via audit script.
2. Create or extend corresponding service.
3. Move side effect into service with same runtime behavior.
4. Add adapter seam (`set/get/reset`) if missing.
5. Replace caller usage (UI/store/provider/engine).
6. Run audit + build.

## 7. Definition of Done (Per Iteration)

1. `pnpm.cmd run audit:services` passes.
2. `pnpm.cmd run audit:services:policy` passes.
3. strict audit output shows:
- packages with violations: 0
- total violations: 0
- packages missing SDK seam: 0
- packages missing services index contract: 0
- packages missing root services export: 0
- packages with empty services dir: 0
- exported `any` hits in service API lines: 0
- business service Promise contract gaps: 0
4. `pnpm.cmd run verify:service-standards` passes.
5. Root `pnpm.cmd run build` passes.
6. Service-bearing feature packages expose services from root `src/index.ts`.
7. Changelog note documents newly introduced adapter seams.

## 8. Current Open Policy Decisions (Need Confirmation)

1. Is it acceptable to force `Promise<ServiceResult<T>>` even for pure capability checks (for example `hasNativeImportCapability`), or should those stay `Promise<boolean>` to reduce wrapper overhead?
2. Should `src/services` be mandatory for every package, or exempt pure type/sdk boundary packages?
3. Should infra exceptions remain limited to `react-core/platform` and `app-sdk-typescript`, or broaden to other boundary packages?
4. Should package root `src/index.ts` always re-export `./services` to guarantee SDK-side injection entry points?
5. Should service-bearing package contracts force both `src/services/index.ts` export and root `src/index.ts` re-export, or allow internal-only service modules in special cases?
6. Should enforcement artifacts (`scripts/audit-service-encapsulation.mjs`, standards docs, audit reports) be tracked in VCS by default?
7. Should policy changes (exemptions/allowed boundary files) require architectural review before merge?
8. Is label-based gate (`service-policy-reviewed`, `service-policy-high-risk-reviewed`) sufficient, or should policy changes require CODEOWNERS mandatory approval?
9. Should audit reports stay artifact-only (default), or also be periodically snapshotted into VCS (for release baselines)?

## 9. Recommended Defaults

1. Enforce `ServiceResult<T>` at cross-boundary business APIs and business adapters.
2. Exempt pure type/system boundary packages from mandatory `src/services`.
3. Keep exceptions minimal and explicit (current two package families only).
4. Do not keep empty `src/services` directories; either add valid service exports or delete the empty directory.
5. Feature packages should re-export `./services` from root `src/index.ts`.
6. Track enforcement scripts and standards docs in VCS so CI and local standards remain consistent.
7. Keep policy file under version control and review every exemption change.
8. Keep PR label gate (`service-policy-reviewed`) for policy-file changes until CODEOWNERS is introduced.
9. Use risk-based escalation label (`service-policy-high-risk-reviewed`) for high-risk policy key changes.
10. Keep daily audit reports as generated artifacts (ignored in VCS), and only persist curated baseline snapshots when needed.

## 10. Iteration 2026-03-02 Result Snapshot

1. direct interaction violations: 0
2. packages missing SDK seam: 0
3. packages missing services index contract: 0
4. packages missing root services export: 0
5. empty services directories: 0
6. exported `any` in service API signatures: 0
7. business service Promise contract gaps: 0
8. strict audit command `pnpm.cmd run audit:services`: pass
9. policy validation command `pnpm.cmd run audit:services:policy`: pass
10. local full verification command `pnpm.cmd run verify:service-standards`: pass
11. CI artifact upload for audit reports: enabled
