# Standardized Check Report: magic-studio-v2 portal-video SDK Compliance (2026-03-06)

## Scope
- App: `apps/magic-studio-v2`
- Package: `packages/sdkwork-react-portal-video`
- Focus pages/components:
  - `src/pages/DiscoverPage.tsx`
  - `src/pages/CommunityPage.tsx`
  - `src/pages/PortalPage.tsx`
  - `src/pages/TheaterPage.tsx`
  - `src/components/CommunityGallery.tsx`
  - `src/components/ViralFeed.tsx`
- SDK baseline:
  - `spring-ai-plus-app-api/sdkwork-sdk-app/sdkwork-app-sdk-typescript`

## Rule Baseline
- Mandatory architecture: `Page/Component -> BusinessService -> Service -> SDK`
- Forbidden:
  - direct `fetch/axios/XMLHttpRequest`
  - direct backend controller path calls in page/component
  - any SDK bypass outside service seam

## Findings Before Fix
1. `src/pages/TheaterPage.tsx`
   - Violation type: local static business data
   - Detail: `DRAMA_SERIES`, `FEATURED_DRAMA` mock sources
   - Impact: theater flow not bound to backend feeds capability
2. `src/components/ViralFeed.tsx`
   - Violation type: local static business data
   - Detail: `MOCK_FEED`
   - Impact: viral section not bound to backend feeds capability

## Rectification
1. Replaced theater data source with `portalVideoBusinessService.getFeaturedWorks`.
2. Added theater filter-to-feed mapping (`tab/contentType/keyword/page/size`) and unified preview behavior.
3. Refactored `ViralFeed` to consume `GalleryItem[]` input only; removed all local mock feed data.
4. Ensured all data path stays in existing SDK seam:
   - `portalVideoBusinessService` -> `portalVideoService` -> `getAppSdkClientWithSession().feed.*`

## Post-Check Results
- Service policy validation: passed.
- Service encapsulation audit: `sdkwork-react-portal-video` row shows:
  - `Violations=0`
  - `SDK Seam=yes`
  - `Services Index Exports=yes`
- Source-level bypass scan (portal-video package):
  - no `fetch/axios/client.http/invokeApiMethod`
  - no remaining feed mock constants (`MOCK_*`, `DRAMA_SERIES`, `FEATURED_DRAMA`, etc.)

## SDK / Backend Upgrade Need
- Missing SDK methods for this scope: none.
- Backend/OpenAPI changes for this scope: none.
- SDK regeneration for this scope: not required.

## Evidence Commands
- `pnpm --dir apps/magic-studio-v2 --filter @sdkwork/react-portal-video typecheck`
- `node scripts/validate-service-encapsulation-policy.mjs`
- `node scripts/audit-service-encapsulation.mjs`
- package scan via `Select-String` (no bypass/no mock hits)

## Residual Risks
1. Global app-level audit still reports violations in other packages (outside `portal-video` scope); continue module-by-module loop.
2. For strict runtime parity, run end-to-end manual verification of theater/discover/community routes against live backend data.

---

## Additional Hardening (Same Date)

1. Unified SDK client entry import in portal-video service:
   - File: `packages/sdkwork-react-portal-video/src/services/portalVideoService.ts`
   - Change: `getAppSdkClientWithSession` import path switched from `@sdkwork/react-auth` to `@sdkwork/react-core`.
2. Verification:
   - `pnpm --filter @sdkwork/react-portal-video typecheck` passed after the change.
3. Architecture impact:
   - Keeps service-side SDK access path aligned with core runtime client policy.
