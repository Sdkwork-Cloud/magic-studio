# Asset Center High Standard Specification (V1 Baseline)

## 1. Core Principles

1. single source of truth: all digital assets are managed by `assetCenterService`
2. domain isolation with unified model: notes/canvas/studios/magiccut/film share one canonical schema
3. strict storage abstraction: browser vfs, tauri fs, remote url, no business-side direct fs coupling
4. strict query contract: Spring Boot pagination request/response shape
5. governance first: lifecycle, references, tags, versioning, statistics

## 2. Canonical Model Rules

Canonical aggregate:

- `UnifiedDigitalAsset`

Canonical payload:

- explicit slots: `video`, `image`, `audio`, `music`, `voice`, `text`, ...
- multi-content set: `assets: AssetMediaResource[]`
- primary indicator in resource: `primary?: AssetContentKey`

Governance extensions:

- `status`: draft/imported/generated/processing/ready/archived/deleted
- `versionInfo`: immutable version lineage
- `references[]`: business entity bindings (domain/entityType/entityId/relation)
- `scope`: workspace + optional project/collection + domain

## 3. Spring Boot Pagination Standard

Request fields:

- `page` (0-based)
- `size`
- `sort` (string array, e.g. `["updatedAt,desc","title,asc"]`)
- `keyword`
- optional filters: `scope`, `types`, `tags`, `status`, `reference`

Response fields:

- `content`
- `pageable`
- `last`
- `totalElements`
- `totalPages`
- `size`
- `number`
- `sort`
- `first`
- `numberOfElements`
- `empty`

## 4. Domain Access Standard

Business code must use:

- write/import/register: `assetCenterService.importAsset(...)` or `assetCenterService.registerExistingAsset(...)`
- read/query: `assetCenterService.query(...)`
- resolve url: `assetCenterService.resolvePrimaryUrl(assetId)`
- status/favorite/reference governance: `setStatus`, `setFavorite`, `bindReference`
- domain facade entry: `assetBusinessFacade`

## 5. Allowed Content Policies by Domain

`DOMAIN_ALLOWED_TYPES` is authoritative and enforced at import/register time.

Examples:

- `notes`: text/image/video/audio/voice/file/subtitle
- `image-studio`: image/file
- `video-studio`: video/image/audio/music/voice/effect/transition/subtitle/file
- `magiccut`: video/image/audio/music/voice/text/effect/transition/subtitle/sfx/file
- `voice-speaker`: voice/audio/file

## 6. Storage Standard

Storage mode:

- `browser-vfs`
- `tauri-fs`
- `remote-url`
- `hybrid`

Locator protocol:

- `assets`
- `file`
- `tauri`
- `http`
- `https`

## 7. Lifecycle Standard

Mandatory lifecycle operations:

- create/import/register
- query and retrieve
- bind/unbind business references (bind available in current baseline)
- mark favorite
- set status
- delete
- statistics report (`stats`)

## 8. Baseline Completion Definition

V1 baseline is considered complete when:

1. all new features use `assetCenterService` / `assetBusinessFacade` only
2. all business modules stop introducing new direct dependency on legacy `assetService`
3. Spring pagination response shape is stable and identical across all asset query entrypoints
4. business references are stored as typed `references[]` rather than ad-hoc loose metadata fields
