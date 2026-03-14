# Magic-Studio-V2 Assets SDK Compliance Report (2026-03-06)

## Scope

- Application: `apps/magic-studio-v2`
- Target rule: Service -> SDK only for backend interaction
- SDK package: `spring-ai-plus-app-api/sdkwork-sdk-app/sdkwork-app-sdk-typescript`

## This Round Changes

### 1) SDK capability enhancement

- Added URL-based SDK upload helper in assets package:
  - `importAssetFromUrlBySdk(sourceUrl, type, { name, domain })`
  - Location: `packages/sdkwork-react-assets/src/services/assetSdkQueryService.ts`
- Exported through:
  - `packages/sdkwork-react-assets/src/services/index.ts`
  - `packages/sdkwork-react-assets/src/index.ts`

### 2) Replaced facade import paths with SDK

- `sdkwork-react-video`
  - `src/store/videoStore.tsx`
  - `src/components/VideoLeftGeneratorPanel.tsx`
- `sdkwork-react-audio`
  - `src/store/audioStore.tsx`
- `sdkwork-react-music`
  - `src/store/musicStore.tsx`
- `sdkwork-react-image`
  - `src/store/imageStore.tsx`
  - `src/components/ImageGridEditor.tsx`
  - `src/components/AIImageGeneratorModal.tsx`
- `sdkwork-react-notes`
  - `src/components/NoteEditor.tsx`
- `sdkwork-react-film`
  - `src/store/filmStore.tsx`
  - `src/utils/filmModalAssetImport.ts`
- `sdkwork-react-voicespeaker`
  - `src/services/voiceSpeakerService.ts`
- `sdkwork-react-canvas`
  - `src/components/CanvasNode.tsx`
- `sdkwork-react-magiccut`
  - `src/store/magicCutStore.tsx`
  - `src/components/Timeline/MagicCutTimelineToolbar.tsx`

## Re-Scan Result

Command:

```bash
rg "assetBusinessFacade\.(query|import)|assetCenterService\." apps/magic-studio-v2/packages -n
```

Result:

- No remaining `assetBusinessFacade.import*` or `assetBusinessFacade.query*` usage in business packages.
- Remaining `assetCenterService.*` calls are inside `sdkwork-react-assets` local asset-center runtime paths:
  - `assetUrlResolver.ts` locator resolution
  - `assetService.ts` initialize/register/delete local sync

These are local runtime capabilities, not direct backend API bypass.

## Verification

- `@sdkwork/react-assets` build: passed
- Typecheck passed:
  - `@sdkwork/react-video`
  - `@sdkwork/react-audio`
  - `@sdkwork/react-music`
  - `@sdkwork/react-image`
  - `@sdkwork/react-film`
  - `@sdkwork/react-magiccut`
  - `@sdkwork/react-voicespeaker`
- Typecheck blocked by existing workspace dependency resolution issues:
  - `@sdkwork/react-notes`: missing `@sdkwork/react-auth` type declaration
  - `@sdkwork/react-canvas`: transitive missing `@sdkwork/react-audio` declarations in sibling packages
- `vite build` for several packages is blocked in current environment by `esbuild spawn EPERM`.

## Upgrade Gap

- SDK upload API currently does not accept explicit business metadata payload in one call for all domains.
- Current migration writes core assets through SDK; domain-specific metadata enrichment remains best-effort in client state.

## Conclusion

- This round completed the key compliance objective for assets import/query paths:
  - backend interactions now routed through SDK wrappers;
  - facade import/query bypass paths removed from business modules.
- Next loop should focus on:
  - resolving workspace type dependency issues (`react-notes`, `react-canvas` verification lane),
  - adding automated compliance scan command to CI/workflow.

---

## Additional Hardening (Same Date)

### Service entrypoint unification

- To avoid store/component/application directly importing low-level sdk query helpers,
  this round moved call sites to `assetBusinessService`:
  - `packages/sdkwork-react-assets/src/store/assetStore.tsx`
  - `packages/sdkwork-react-assets/src/components/ChooseAsset.tsx`
  - `packages/sdkwork-react-assets/src/asset-center/application/assetUrlResolver.ts`
  - `packages/sdkwork-react-assets/src/services/impl/CoreAssetQueryService.ts`
- `assetBusinessService` now exposes sdk query functions centrally:
  - `queryAssetsBySdk`
  - `importAssetBySdk`
  - `importAssetFromUrlBySdk`
  - `renameAssetBySdk`
  - `deleteAssetBySdk`
  - `resolveAssetPrimaryUrlBySdk`

### Recheck

- `assetSdkQueryService` direct imports now remain only in service aggregation layer:
  - `assetBusinessService.ts`
  - `services/index.ts`
- `@sdkwork/react-assets` typecheck passed:
  - `pnpm --filter @sdkwork/react-assets typecheck`
- `fetch` scan in assets package:
  - Remaining `fetch` calls are for external/local file content loading (source URL/data URL),
    not direct backend controller invocation.
