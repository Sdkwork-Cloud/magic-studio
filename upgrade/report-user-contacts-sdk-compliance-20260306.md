# Standardized Check Report: magic-studio-v2 user contacts SDK Compliance (2026-03-06)

## Scope
- App: `apps/magic-studio-v2`
- Package: `packages/sdkwork-react-user`
- Focus:
  - `src/services/socialContactService.ts`
  - `src/services/userCenterService.ts`
  - `src/pages/ProfilePage.tsx` (contacts section)
- SDK baseline:
  - `spring-ai-plus-app-api/sdkwork-sdk-app/sdkwork-app-sdk-typescript`

## Rule Baseline
- Mandatory architecture: `Page -> Service -> SDK`
- Forbidden:
  - direct `fetch/axios/XMLHttpRequest` to backend
  - direct controller path calls (e.g. `/app/v3/api/...`) in app services
  - bypassing SDK in contacts/user-center business paths

## Findings Before Fix
1. Contacts capability was missing in `react-user` service seam.
   - Impact: profile page lacked standardized contacts/friend-request workflow through SDK service layer.

## Rectification
1. Added SDK-only contacts service:
   - `src/services/socialContactService.ts`
   - Implemented:
     - `getContactStats`
     - `listContacts`
     - `deleteContact`
     - `updateFriendRemark`
     - `listFriendRequests`
     - `sendFriendRequest`
     - `processFriendRequest`
   - All calls route through `getAppSdkClientWithSession().social.*`.
2. Integrated contacts module in profile page:
   - Added `contacts` section UI and actions:
     - contact stats
     - contact search/list
     - friend requests list
     - accept/reject/delete/update remark
3. Exported contacts service from package public entry:
   - `src/index.ts`

## Post-Check Results
- `@sdkwork/react-user` typecheck: passed
  - command: `pnpm --filter @sdkwork/react-user typecheck`
- Source scan (react-user service scope): no direct backend bypass found
  - command: `rg -n "fetch\\(|axios\\.|/app/v3|/api/|http://|https://" apps/magic-studio-v2/packages/sdkwork-react-user/src`

## SDK / Backend Upgrade Need
- Missing SDK methods for this scope: none (social + user endpoints are available in current SDK).
- Backend/OpenAPI changes required for this scope: none.
- SDK regeneration required for this scope: no.

## Notes
- Fixed a profile language option text corruption in `ProfilePage.tsx` to avoid UI regression while validating this module.

## Additional Hardening (Same Date)
1. Unified SDK client entry imports in services to `@sdkwork/react-core`:
   - `packages/sdkwork-react-user/src/services/userCenterService.ts`
   - `packages/sdkwork-react-user/src/services/socialContactService.ts`
2. Recheck result:
   - Service layer has no `@sdkwork/react-auth` SDK client import.
   - No `fetch/axios/XMLHttpRequest` direct backend request path found in service scope.
3. Verification:
   - `pnpm --filter @sdkwork/react-user typecheck` passed after import-path unification.

## Service Layer Architecture Hardening (Same Date)
1. Added business seam and adapter controller:
   - `packages/sdkwork-react-user/src/services/userBusinessService.ts`
   - Uses `createServiceAdapterController` and exports:
     - `userBusinessService`
     - `setUserBusinessAdapter`
     - `getUserBusinessAdapter`
     - `resetUserBusinessAdapter`
2. Added service aggregation contract:
   - `packages/sdkwork-react-user/src/services/index.ts`
   - `packages/sdkwork-react-user/src/index.ts` now re-exports `./services`.
3. Updated page call path to strict layered route:
   - `ProfilePage.tsx`: `Page -> userBusinessService -> userCenter/socialContact service -> SDK`.
4. Verification:
   - `pnpm --filter @sdkwork/react-user typecheck` passed.
   - `node scripts/audit-service-encapsulation.mjs` shows:
     - `Packages missing SDK seam: 0`
     - `Packages missing services index contract: 0`
     - `Packages missing root services export: 0`
