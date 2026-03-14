# Standardized Check Report: magic-studio-v2 auth SDK Compliance (2026-03-06)

## Scope
- App: `apps/magic-studio-v2`
- Package: `packages/sdkwork-react-auth`
- Focus:
  - `src/services/appAuthService.ts`
  - `src/services/useAppSdkClient.ts`
  - `src/services/appAuthBusinessService.ts`

## Rule Baseline
- Mandatory architecture: `Component/Store -> BusinessService -> Service -> SDK`
- Forbidden:
  - direct backend controller path calls outside service seam
  - direct HTTP calls bypassing SDK

## Findings Before Fix
1. `react-auth` service layer had no explicit business adapter seam.
   - Missing `createServiceAdapterController` or `set/get/reset*Adapter` export contract.
   - Impact: failed encapsulation-policy seam check.

## Rectification
1. Added auth business adapter seam:
   - File: `packages/sdkwork-react-auth/src/services/appAuthBusinessService.ts`
   - Uses `createServiceAdapterController` with `appAuthService` as local adapter.
   - Exposes:
     - `appAuthBusinessService`
     - `setAppAuthBusinessAdapter`
     - `getAppAuthBusinessAdapter`
     - `resetAppAuthBusinessAdapter`
2. Exported business seam from service entry:
   - File: `packages/sdkwork-react-auth/src/services/index.ts`

## Verification Evidence
1. Encapsulation audit:
   - Command: `node scripts/audit-service-encapsulation.mjs`
   - Result:
     - `Packages missing SDK seam: 0`
     - `Packages missing services index contract: 0`
     - `Packages missing root services export: 0`
     - `Packages with violations: 0`
2. Typecheck status:
   - Command: `pnpm --filter @sdkwork/react-auth typecheck`
   - Result: blocked by existing workspace dependency resolution issue in SDK package:
     - missing `@sdkwork/sdk-common` declarations in `spring-ai-plus-app-api/sdkwork-sdk-app/sdkwork-app-sdk-typescript`
   - Assessment: not introduced by this auth seam change.

## SDK / Backend Upgrade Need
- Missing SDK methods for auth flow in current scope: none.
- Backend/OpenAPI changes required for this scope: none.
- SDK regeneration required for this scope: no.
