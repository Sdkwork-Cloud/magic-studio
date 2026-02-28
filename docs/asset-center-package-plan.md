# Asset Center Package Planning (High-Standard Baseline)

## 1. Package Responsibility Matrix

| Package | Layer Role | Owns | Must Not Own |
|---|---|---|---|
| `@sdkwork/react-types` | Canonical schema | all domain DTO/model contracts | runtime logic, storage calls |
| `@sdkwork/react-fs` | Infrastructure abstraction | VFS interfaces + browser/tauri providers | business/domain rules |
| `@sdkwork/react-assets` (`asset-center/*`) | Domain + application kernel | asset aggregate behavior, query/write governance | UI page composition |
| `@sdkwork/react-assets` (`components/*`) | Shared asset UI | asset picker/list/generation shell | canonical model mutation rules |
| business packages (`notes/canvas/image/video/audio/music/voice/magiccut/...`) | Domain features | business workflows + domain interaction | direct storage/index internals |

## 2. Allowed Dependency Direction

Strict direction:

`business package -> @sdkwork/react-assets -> @sdkwork/react-fs + @sdkwork/react-types`

`business package -> @sdkwork/react-types` is allowed for pure typing.

Forbidden direction:

- `business package -> @sdkwork/react-fs` direct data persistence bypass
- `business package -> asset-center/infrastructure/*` direct import
- cross-business direct imports for persistence/query behavior

## 3. Asset-Center Internal Subpackages

`@sdkwork/react-assets/src/asset-center` is split as:

- `domain`
  - command/query input models
  - content/domain policies (`DOMAIN_ALLOWED_TYPES`)
  - naming, key, tag normalization rules
- `application`
  - `AssetCenterService`
  - `AssetBusinessFacade`
  - adapters (`UnifiedDigitalAsset <-> business-facing models`)
- `ports`
  - VFS/index/url/analyzer interfaces
- `infrastructure`
  - browser+tauri VFS bridge
  - json index repository
  - URL resolver/analyzer implementations

## 4. Business Access Contract (Mandatory)

Each business package must access asset center through one of:

- `assetBusinessFacade` (preferred for domain-scoped operations)
- `assetCenterService` (for generic asset-center operations)

Write path standard:

- import/upload/generated output must call `importXxxAsset(...)` or `importAsset(...)`
- generated URL/data must be normalized to:
  - binary (`Uint8Array`) when source is `data:` / `blob:`
  - remote locator when source is http(s)

Read/query standard:

- must use Spring page request fields (`page`, `size`, `sort`, `keyword`)
- must return Spring page shape in all list endpoints

## 4.1 Portal Orchestration Boundary (Mandatory)

Portal-to-studio handoff is treated as an application-layer orchestration concern and
must stay inside `@sdkwork/react-assets/asset-center/application`.

Rules:

1. `portal-video` can only call shared orchestration APIs from `@sdkwork/react-assets`
2. `portal-video` must not import state/services from `video/image/audio/music/character` packages
3. downstream studio pages must consume launch context through `consumePortalLaunchSession(target)`
4. launch attachments must use canonical pointer contract:
   - `assetId` as primary pointer
   - `locator` as fallback locator
   - `content` only for script/text attachment payloads
5. launch context is ephemeral (TTL + consume-once), not a durable history store

## 5. Scope and Domain Governance

Scope source standard:

- `workspaceId`: `localStorage['sdkwork_workspace_id']` fallback `default-workspace`
- `projectId`: `localStorage['sdkwork_project_id']` optional

Domain assignment standard:

- notes -> `notes`
- canvas -> `canvas`
- image -> `image-studio`
- video -> `video-studio`
- audio -> `audio-studio`
- music -> `music`
- voice -> `voice-speaker`
- magiccut -> `magiccut`
- film -> `film`
- portal -> `portal-video`

## 6. Data Contract Standards

Canonical payload:

- explicit slots: `video`, `image`, `audio`, `music`, `voice`, ...
- multi-content collection: `assets: AssetMediaResource[]`

Canonical identity:

- business state should prefer storing `assetId` + render cache metadata
- avoid persisting raw filesystem paths in business entities

## 7. Release Gate Checklist (Per Package)

Before merging any business package change:

1. no new direct dependency on legacy `assetService` CRUD path
2. write path uses domain facade import API
3. read path uses spring paging fields and response shape
4. local/remote source normalization is implemented (`data/blob/http`)
5. module still respects dependency direction rules

## 8. Current Migration Baseline (2026-02)

Completed high-priority write/query migrations:

- notes (write)
- canvas (write: upload + generation)
- image (write: generation + editor tile save)
- video (reference upload + generation write)
- voice speaker (upload/record + generation write)
- magiccut (query + write + playback resolve + `assetId`-only persistence + timeline toolbar AI import convergence)
- assets shared store/core query (read adapters + spring normalization)
- assets shared picker/store runtime now domain-scoped (`AssetStoreProvider.domain`) and unified import/query paths no longer rely on legacy `assetService` fallback
- `ChooseAssetModal` now supports native multi-selection with explicit selection state, avoiding business-side manual one-by-one picking
- shared asset grid/voice playback and image reference resolution have moved to assetId-first URL resolving (`resolveAssetUrlByAssetIdFirst`)
- shared asset URL resolver consolidation (`assetId`-first resolver exported from `@sdkwork/react-assets`, reused by film/magiccut/portal helpers)
- film overview/preview/scene read-path convergence (`hasResolvableAssetReference` + resolver-based rendering) and auto-generation write-path convergence for character/location/prop panels (`importFilmAssetFromUrl`)

Pending high-priority items:

- audio/music remaining UI flows that still carry non-asset-center URL-only assumptions
- portal-video generation-result persistence + indexing migration to unified asset-center query/write path
- align all portal/session consumers to use `@sdkwork/react-types` as single source of truth
