# Unified Asset Center Architecture

## 1. Goal

Build a single asset system across all business domains:

- notes
- canvas
- image studio
- video studio
- audio studio
- music
- voice speaker
- magiccut
- film
- portal-video

The system must support:

- browser VFS (IndexedDB-backed)
- tauri/local filesystem
- remote URL storage

No legacy compatibility constraints are required.

## 2. Canonical Data Model

All canonical types are defined in `@sdkwork/react-types`:

- `UnifiedDigitalAsset`
- `UnifiedAssetPayload`
- `AssetScope`
- `AssetStorageDescriptor`
- `AssetLocator`
- `UnifiedAssetQuery`

Single-content uses explicit fields:

```ts
{
  video?: VideoMediaResource;
  image?: ImageMediaResource;
  audio?: AudioMediaResource;
  ...
}
```

Multi-content uses:

```ts
{
  assets: AssetMediaResource[];
}
```

This is now encoded by `UnifiedAssetPayload` and `AssetMediaResource`.

## 3. Layered Architecture (`@sdkwork/react-assets/src/asset-center`)

- `domain`
  - import command model
  - content type to media type mapping
- `ports`
  - `AssetVfsPort`
  - `AssetIndexPort`
  - `AssetUrlResolverPort`
  - `AssetMediaAnalyzerPort`
- `application`
  - `AssetCenterService` (aggregate operations)
- `infrastructure`
  - `BrowserTauriAssetVfs`
  - `JsonAssetIndexRepository`
  - `DefaultAssetUrlResolver`
  - `CoreMediaAnalysisAdapter`
  - `NoopAssetMediaAnalyzer`

## 4. Storage Strategy

`AssetStorageDescriptor.mode`:

- `browser-vfs`: local persisted storage in browser runtime
- `tauri-fs`: desktop local filesystem
- `remote-url`: server URL only
- `hybrid`: primary + replicas

`AssetLocator` is protocol-driven:

- `assets://...` internal virtual path
- `file://` / tauri local path
- `http(s)://` remote

## 5. Business Domain Rules

- **Notes**: embeds content references by `assetId` + optional inline slot usage.
- **Canvas**: node resources reference `UnifiedDigitalAsset.payload`.
- **Image/Video/Audio/Music/Voice studios**: generation output is written as `UnifiedDigitalAsset`, never ad-hoc blobs.
- **MagicCut**: timeline resources resolve by `assetId` first, persist `assetId`-only references, and route AI generation/import through `assetBusinessFacade.importMagiccutAsset(...)`; linked alternatives go to `payload.assets`.
- **Film**: `refAssets` migrates to `assetId` pointers + scene metadata in resource `metadata`.

## 6. Query and Governance

Query entrypoint:

- `AssetCenterService.query(AssetCenterPageRequest)`
- Domain facade entrypoint:
  - `assetBusinessFacade.queryNotes/queryCanvas/queryImageStudio/...`
  - `assetBusinessFacade.importNotesAsset/importCanvasAsset/...`

Spring Boot pagination standard is mandatory:

- request: `page`, `size`, `sort`, `keyword`
- response: `Page<UnifiedDigitalAsset>`
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

Minimum governance fields:

- `scope.domain`
- `scope.workspaceId`
- `primaryType`
- `status`
- `versionInfo`
- `references[]` (domain/entity binding)

## 7. Spring Boot Pagination Contract (Mandatory)

### Request contract

- `page`: 0-based index, default `0`
- `size`: page size, default `20`
- `sort`: list of sort expressions, e.g. `["updatedAt,desc", "title,asc"]`
- `keyword`: fuzzy search keyword

Canonical query example:

```json
{
  "page": 0,
  "size": 20,
  "sort": ["updatedAt,desc", "title,asc"],
  "keyword": "intro",
  "scope": {
    "workspaceId": "ws_001",
    "domain": "magiccut"
  },
  "types": ["video", "image"]
}
```

### Response contract

Always return Spring-style page object:

```json
{
  "content": [],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20,
    "offset": 0,
    "paged": true,
    "unpaged": false,
    "sort": {
      "sorted": true,
      "unsorted": false,
      "empty": false
    }
  },
  "last": true,
  "totalElements": 0,
  "totalPages": 0,
  "size": 20,
  "number": 0,
  "sort": {
    "sorted": true,
    "unsorted": false,
    "empty": false
  },
  "first": true,
  "numberOfElements": 0,
  "empty": true
}
```

Implementation notes:

- sort supports multi-order (`sort[]`), evaluated in declaration order.
- page and size are normalized (`page >= 0`, `size >= 1`).
- `media` category queries must paginate after filtering target types (video/image), not before.

## 8. Business Access Standard

All business packages must follow one access path:

- Write: `AssetCenterService.importAsset(...)`
- Read/List: `AssetCenterService.query(...)`
- Resolve URL: `AssetCenterService.resolvePrimaryUrl(...)`
- Multi-content attach: `AssetCenterService.attachAssets(...)`

Domain-specific requirements:

- notes: only store `assetId` references in note blocks, no raw path persistence.
- canvas: node payload keeps `assetId` + derived render metadata only.
- image/video/audio/music/voice studio: generation outputs are persisted as unified assets.
- magiccut: timeline clip resource uses primary slot; alternates or derived tracks go to `payload.assets`.
- film/portal-video: scene-level references normalized to `assetId` pointers.

## 9. Migration Plan (Recommended)

1. New features use only `assetCenterService` (no direct new dependency on legacy `assetService`).
2. Migrate read paths first: `notes` -> `canvas` -> `magiccut`.
3. Migrate write paths second: `image/video/audio/music/voice` generation save flows.
4. Migrate film and portal-video references to `assetId` pointer model.
5. Remove legacy mock/query artifacts after all consumers complete migration.

## 10. Non-Goals

- Backward compatibility with old `Asset` shape.
- Maintaining dual type systems for the same domain concept.

## 11. Package Governance Reference

For strict package boundary and dependency direction rules, follow:

- `docs/asset-center-package-plan.md`
