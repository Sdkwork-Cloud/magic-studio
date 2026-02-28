# Asset Center Business Migration Standard

## Objective

Unify all business domains on the same asset kernel:

- type model: `@sdkwork/react-types`
- business operations: `@sdkwork/react-assets/asset-center`
- storage abstraction: VFS (`browser-vfs`, `tauri-fs`, `remote-url`)
- pagination: Spring Boot page contract

## Mandatory API Usage Rules

All business packages must follow:

1. create/import asset: `assetCenterService.importAsset(...)`
2. register existing legacy-imported files into unified index: `assetCenterService.registerExistingAsset(...)`
3. list/search asset: `assetCenterService.query({ page, size, sort, keyword, ... })`
4. resolve playback/render URL: `assetCenterService.resolvePrimaryUrl(assetId)`
5. attach multi-content variants: `assetCenterService.attachAssets(assetId, resources)`

Domain-level standard entrypoint:

- `assetBusinessFacade` (`queryNotes/queryCanvas/queryImageStudio/...`, `importNotesAsset/importCanvasAsset/...`)

Deprecated path (to be removed):

- direct new dependency on legacy `assetService` CRUD for business flow

Bridge rule during migration:

- legacy `assetService` now auto-registers imported/generated assets into `asset-center` index
- query path prefers `assetCenterService` and falls back to legacy only when needed
- `sdkwork-react-assets` shared store (`assetStore`) has switched to `assetBusinessFacade.queryByDomain` and no longer uses legacy query fallback
- shared picker local upload (`ChooseAsset`) now writes through `assetBusinessFacade.importByDomain`
- shared picker supports true multi-select in `ChooseAssetModal(multiple)` with domain-scoped query/import
- shared gallery/voice playback read paths now use `resolveAssetUrlByAssetIdFirst` (assetId-first resolver)

## Domain Checklist

| Domain | Current Status | Required Migration |
|---|---|---|
| notes | migrated to `assetBusinessFacade.importNotesAsset` | continue replacing any raw media URL insertion with `assetId` + reference binding |
| canvas | migrated for node import/generation writes | continue replacing legacy URL resolve paths with `assetCenterService.resolvePrimaryUrl(assetId)` |
| image studio | migrated generation + grid tile persistence | continue standardizing remote-vs-local persistence policy by environment |
| video studio | migrated reference upload + generation write path | migrate page/chat-level result reuse to `assetId` references |
| audio studio | migrated generation write path in store | migrate remaining modal/page-level import paths to unified asset references |
| music | migrated generation write path + history persistence | migrate page/chat-level reuse to `assetId` references |
| voice speaker | migrated import + generation write path | migrate playback/preview read path to `assetId` based resolution |
| magiccut | migrated query + write + playback URL resolve (`assetId`-first) + timeline persistence (`assetId`-only) + timeline toolbar AI-import path | maintenance only: keep new features on `assetBusinessFacade` and `assetId` references |
| film | core shot generation write path migrated (`image/video/audio`) + shot card/preview read path `assetId`-first + Character/Location/Prop modal upload/AI/asset-pick paths migrated to unified `importFilmAsset` + ShotModal upload/AI/asset-pick fully migrated + FilmHomePage upload switched to unified import + prompt serialization normalized to string/base + overview/scene/preview panels switched from `*.url` assumptions to unified asset-reference detection/resolution + Character/Location/Prop auto-generation write paths now import via `importFilmAssetFromUrl` | maintenance only: keep new film features on `importFilmAsset` and `assetId` references |
| portal-video | asset picking read path now `assetId`-first (`assetCenterService.resolvePrimaryUrl`) + local upload path now imports through `importPortalVideoAsset` with unified attachment mapping | continue migrating generation result persistence and downstream material indexing/query |

## URL Resolve Standard (New)

To reduce coupling and remove duplicated resolver logic, all business packages should reuse:

- `resolveAssetUrlByAssetIdFirst(...)` from `@sdkwork/react-assets`
- `getPrimaryAssetIdCandidate(...)` for render cache keys
- `hasResolvableAssetReference(...)` for pointer existence checks (replace direct `*.url` booleans)

Resolver priority:

1. `assetId` candidates from `metadata.assetId -> assetId -> id`
2. direct locator fallback (`url/path/assets://http(s)/file/blob/data`)

## Portal Cross-Studio Launch Session Standard

When `portal-video` routes to downstream studios (`video/image/speech/music/human`),
it must persist a normalized launch session first, then navigate.

Mandatory APIs:

- write: `savePortalLaunchSession(...)`
- read-once: `consumePortalLaunchSession(target)`
- clear: `clearPortalLaunchSession()`

Session governance rules:

1. storage key is unified (`sdkwork.portal.launch.session.v1`)
2. session includes workspace/project scope (`workspaceId`, `projectId`)
3. attachment model is pointer-first (`assetId` preferred, `locator` fallback)
4. script payload uses `content` only for text-like attachments
5. TTL must be enforced (30 minutes), and consumer must clear on read (`consume-once`)
6. short-drama flow must clear stale launch session before entering film editor

Downstream page bootstrap rules:

- each studio page reads only its own `target`
- page config bootstrap priority is `prompt -> script content -> defaults`
- media attachment URL resolution must call `resolveAssetUrlByAssetIdFirst(...)`
- no direct cross-business state sharing between portal and studio stores

## Spring Boot Pagination Rules

Request fields:

- `page` (0-based)
- `size`
- `sort` (`field,direction` list)
- `keyword`

Response fields (must all exist):

- `content`
- `pageable`
- `last`
- `totalElements`
- `totalPages`
- `size`
- `number`
- `first`
- `numberOfElements`
- `empty`
- `sort`

## Data Modeling Rules

Single content slots:

- `video`, `image`, `audio`, `music`, `voice`, `text`, ...

Multi-content:

- `assets: AssetMediaResource[]`

Primary slot marker:

- `primary: AssetContentKey`

## Exit Criteria

Migration is considered complete only when:

1. all listed domains query via `assetCenterService.query`
2. all domain write paths use `assetCenterService.importAsset`
3. runtime no longer depends on legacy `assetService` for core business flows
4. Spring page response shape is consistent across all entrypoints
