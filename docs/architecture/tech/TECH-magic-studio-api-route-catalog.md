> Migrated from `docs/magic-studio-api-route-catalog.md` on 2026-06-24.
> Owner: SDKWork maintainers

# Magic Studio API Route Catalog

> Auto-generated from `packages/sdkwork-magic-studio-server/contracts/magic-studio-server.contract.json`.
> Regenerate with `node scripts/generate-magic-studio-api-route-catalog.mjs`.

## Status

This document is the route-by-route catalog for the current committed canonical Magic Studio server contract.

## Surface Summary

- api version: `v1`
- total routes: 428
- `core`: 39 routes | auth `host` | base `/api/core/v1`
- `app`: 366 routes | auth `user` | base `/api/app/v1`
- `admin`: 23 routes | auth `admin` | base `/api/admin/v1`

## Discovery And Documentation Endpoints

- `coreHealthStatusRead`: `GET /healthz` | success `MagicStudioServerHealthStatusEnvelope` | Read server health status
- `docs`: `GET /docs` | human-readable API documentation
- `liveOpenApi`: `GET /openapi.json` | live OpenAPI document
- `versionedOpenApi`: `GET /openapi/magic-studio-server-v1.json` | versioned OpenAPI document
- `coreRoutesList`: `GET /api/core/v1/routes` | success `MagicStudioApiRouteCatalogEnvelope` | List server routes
- `coreRuntimeSummaryRead`: `GET /api/core/v1/runtime/summary` | success `MagicStudioRuntimeSummaryEnvelope` | Read runtime summary

## Core Routes

### `health` (1 route)

- `coreHealthStatusRead`: `GET /healthz` | success `MagicStudioServerHealthStatusEnvelope` | Read server health status

### `routes` (1 route)

- `coreRoutesList`: `GET /api/core/v1/routes` | success `MagicStudioApiRouteCatalogEnvelope` | List server routes

### `runtime` (1 route)

- `coreRuntimeSummaryRead`: `GET /api/core/v1/runtime/summary` | success `MagicStudioRuntimeSummaryEnvelope` | Read runtime summary

### `toolkit` (1 route)

- `coreToolkitCapabilitiesRead`: `GET /api/core/v1/toolkit/capabilities` | success `MagicStudioToolkitCapabilityMatrixEnvelope` | Read toolkit capabilities

### `filesystem` (11 routes)

- `coreFileSystemReadDir`: `POST /api/core/v1/filesystem/read-dir` | request `MagicStudioFileSystemPathRequest` | success `MagicStudioFileSystemEntryListEnvelope` | List filesystem directory entries
- `coreFileSystemReadText`: `POST /api/core/v1/filesystem/read-text` | request `MagicStudioFileSystemPathRequest` | success `MagicStudioFileSystemTextPayloadEnvelope` | Read filesystem text content
- `coreFileSystemReadBytes`: `POST /api/core/v1/filesystem/read-bytes` | request `MagicStudioFileSystemPathRequest` | success `MagicStudioFileSystemBytesPayloadEnvelope` | Read filesystem binary content
- `coreFileSystemWriteText`: `POST /api/core/v1/filesystem/write-text` | request `MagicStudioFileSystemWriteTextRequest` | success `MagicStudioOperationOkResultEnvelope` | Write filesystem text content
- `coreFileSystemWriteBytes`: `POST /api/core/v1/filesystem/write-bytes` | request `MagicStudioFileSystemWriteBytesRequest` | success `MagicStudioOperationOkResultEnvelope` | Write filesystem binary content
- `coreFileSystemStat`: `POST /api/core/v1/filesystem/stat` | request `MagicStudioFileSystemPathRequest` | success `MagicStudioFileSystemStatEnvelope` | Read filesystem metadata
- `coreFileSystemExists`: `POST /api/core/v1/filesystem/exists` | request `MagicStudioFileSystemPathRequest` | success `MagicStudioFileSystemExistsResultEnvelope` | Check whether a filesystem path exists
- `coreFileSystemEnsureDir`: `POST /api/core/v1/filesystem/ensure-dir` | request `MagicStudioFileSystemPathRequest` | success `MagicStudioOperationOkResultEnvelope` | Ensure a filesystem directory exists
- `coreFileSystemRemove`: `POST /api/core/v1/filesystem/remove` | request `MagicStudioFileSystemPathRequest` | success `MagicStudioOperationOkResultEnvelope` | Remove a filesystem path
- `coreFileSystemRename`: `POST /api/core/v1/filesystem/rename` | request `MagicStudioFileSystemRenameRequest` | success `MagicStudioOperationOkResultEnvelope` | Rename a filesystem path
- `coreFileSystemCopyFile`: `POST /api/core/v1/filesystem/copy-file` | request `MagicStudioFileSystemCopyFileRequest` | success `MagicStudioOperationOkResultEnvelope` | Copy a filesystem file

### `media/probe` (1 route)

- `coreMediaProbe`: `POST /api/core/v1/media/probe` | request `MagicStudioMediaProbeRequest` | success `MagicStudioMediaProbeResultEnvelope` | Probe media metadata

### `media/image` (1 route)

- `coreMediaImageResize`: `POST /api/core/v1/media/image/resize` | request `MagicStudioMediaImageResizeRequest` | success `MagicStudioToolkitCommandResultEnvelope` | Resize a local image with a structured media request

### `media/video` (5 routes)

- `coreMediaVideoConcat`: `POST /api/core/v1/media/video/concat` | request `MagicStudioMediaVideoConcatRequest` | success `MagicStudioToolkitCommandResultEnvelope` | Concatenate local video inputs
- `coreMediaVideoTranscode`: `POST /api/core/v1/media/video/transcode` | request `MagicStudioMediaVideoTranscodeRequest` | success `MagicStudioToolkitCommandResultEnvelope` | Transcode local video with a structured media request
- `coreMediaVideoTrim`: `POST /api/core/v1/media/video/trim` | request `MagicStudioMediaVideoTrimRequest` | success `MagicStudioToolkitCommandResultEnvelope` | Trim local video with copy-safe media arguments
- `coreMediaVideoExtractAudio`: `POST /api/core/v1/media/video/extract-audio` | request `MagicStudioMediaVideoExtractAudioRequest` | success `MagicStudioToolkitCommandResultEnvelope` | Extract audio from local video
- `coreMediaVideoThumbnail`: `POST /api/core/v1/media/video/thumbnail` | request `MagicStudioMediaVideoThumbnailRequest` | success `MagicStudioToolkitCommandResultEnvelope` | Create a thumbnail from local video

### `media/audio` (3 routes)

- `coreMediaAudioConvert`: `POST /api/core/v1/media/audio/convert` | request `MagicStudioMediaAudioConvertRequest` | success `MagicStudioToolkitCommandResultEnvelope` | Convert local audio with a structured media request
- `coreMediaAudioNormalize`: `POST /api/core/v1/media/audio/normalize` | request `MagicStudioMediaAudioNormalizeRequest` | success `MagicStudioToolkitCommandResultEnvelope` | Normalize local audio loudness
- `coreMediaAudioMix`: `POST /api/core/v1/media/audio/mix` | request `MagicStudioMediaAudioMixRequest` | success `MagicStudioToolkitCommandResultEnvelope` | Mix local audio inputs into a single output

### `compression` (2 routes)

- `coreCompressionZip`: `POST /api/core/v1/compression/zip` | request `MagicStudioCompressionZipRequest` | success `MagicStudioCompressionZipResultEnvelope` | Create a zip archive from local paths
- `coreCompressionUnzip`: `POST /api/core/v1/compression/unzip` | request `MagicStudioCompressionUnzipRequest` | success `MagicStudioOperationOkResultEnvelope` | Extract a local zip archive

### `database/sqlite` (3 routes)

- `coreDatabaseSqliteExecute`: `POST /api/core/v1/database/sqlite/execute` | request `MagicStudioSqlExecuteRequest` | success `MagicStudioSqlExecuteResultEnvelope` | Execute a SQLite statement
- `coreDatabaseSqliteQuery`: `POST /api/core/v1/database/sqlite/query` | request `MagicStudioSqlExecuteRequest` | success `MagicStudioSqlRowListEnvelope` | Query SQLite rows
- `coreDatabaseSqliteExecuteBatch`: `POST /api/core/v1/database/sqlite/execute-batch` | request `MagicStudioSqlExecuteBatchRequest` | success `MagicStudioOperationOkResultEnvelope` | Execute a SQLite batch

### `policy` (3 routes)

- `corePolicyValidatePath`: `POST /api/core/v1/policy/validate-path` | request `MagicStudioPolicyPathValidationRequest` | success `MagicStudioPolicyValidationResultEnvelope` | Validate local path access against policy
- `corePolicyValidateCommand`: `POST /api/core/v1/policy/validate-command` | request `MagicStudioPolicyCommandValidationRequest` | success `MagicStudioPolicyValidationResultEnvelope` | Validate local command execution against policy
- `corePolicySnapshotRead`: `GET /api/core/v1/policy/snapshot` | success `MagicStudioPolicySnapshotEnvelope` | Read current policy snapshot

### `migrations` (2 routes)

- `coreMigrationsStatusRead`: `POST /api/core/v1/migrations/status` | request `MagicStudioMigrationStatusRequest` | success `MagicStudioMigrationStatusEnvelope` | Read migration status for a local SQLite database
- `coreMigrationsApply`: `POST /api/core/v1/migrations/apply` | request `MagicStudioMigrationApplyRequest` | success `MagicStudioMigrationApplyResultEnvelope` | Apply a migration plan to a local SQLite database

### `jobs` (4 routes)

- `coreJobsSubmit`: `POST /api/core/v1/jobs` | request `MagicStudioToolkitJobSubmission` | success `MagicStudioToolkitJobSnapshotEnvelope` | Submit an asynchronous local job
- `coreJobsList`: `GET /api/core/v1/jobs` | success `MagicStudioToolkitJobSnapshotListEnvelope` | List asynchronous local jobs
- `coreJobsRead`: `GET /api/core/v1/jobs/:jobId` | success `MagicStudioToolkitJobSnapshotEnvelope` | Read an asynchronous local job
- `coreJobsCancel`: `POST /api/core/v1/jobs/:jobId/cancel` | success `MagicStudioToolkitJobSnapshotEnvelope` | Cancel an asynchronous local job

## App Routes

### `assets` (9 routes)

- `appAssetsList`: `GET /api/app/v1/assets` | success `UnifiedDigitalAssetListEnvelope` | List unified digital assets
- `appAssetsReadStats`: `GET /api/app/v1/assets/stats` | success `AssetCenterStatsEnvelope` | Read unified digital asset statistics
- `appAssetsListCategories`: `GET /api/app/v1/assets/categories` | success `AssetCategoryListEnvelope` | List supported asset categories
- `appAssetsImportFile`: `POST /api/app/v1/assets/import/file` | request `MagicStudioAssetImportFileRequest` | success `UnifiedDigitalAssetEnvelope` | Import a local file into the managed asset catalog
- `appAssetsImportUrl`: `POST /api/app/v1/assets/import/url` | request `MagicStudioAssetImportUrlRequest` | success `UnifiedDigitalAssetEnvelope` | Register a remote URL in the managed asset catalog
- `appAssetsRead`: `GET /api/app/v1/assets/:assetId` | success `UnifiedDigitalAssetEnvelope` | Read a unified digital asset
- `appAssetsUpsert`: `PUT /api/app/v1/assets/:assetId` | request `MagicStudioAssetUpsertRequest` | success `UnifiedDigitalAssetEnvelope` | Create or replace a unified digital asset
- `appAssetsUpdate`: `PATCH /api/app/v1/assets/:assetId` | request `MagicStudioAssetUpdateRequest` | success `UnifiedDigitalAssetEnvelope` | Update unified digital asset metadata
- `appAssetsDelete`: `DELETE /api/app/v1/assets/:assetId` | success `MagicStudioOperationOkResultEnvelope` | Delete a unified digital asset

### `auth` (12 routes)

- `appAuthLogin`: `POST /api/app/v1/auth/login` | request `MagicStudioAuthLoginRequest` | success `AuthSessionEnvelope` | Authenticate with username and password
- `appAuthLoginWithPhone`: `POST /api/app/v1/auth/login/phone` | request `MagicStudioAuthPhoneLoginRequest` | success `AuthSessionEnvelope` | Authenticate with phone and verification code
- `appAuthRegister`: `POST /api/app/v1/auth/register` | request `MagicStudioAuthRegisterRequest` | success `AuthSessionEnvelope` | Register a new local identity account
- `appAuthLogout`: `POST /api/app/v1/auth/logout` | success `MagicStudioOperationOkResultEnvelope` | Clear the current authenticated session
- `appAuthRefreshToken`: `POST /api/app/v1/auth/refresh-token` | request `MagicStudioAuthRefreshTokenRequest` | success `AuthSessionEnvelope` | Refresh the current authenticated session
- `appAuthReadSession`: `GET /api/app/v1/auth/session` | success `AuthSessionStateEnvelope` | Read the current authenticated session state
- `appAuthSendVerifyCode`: `POST /api/app/v1/auth/verify-code/send` | request `MagicStudioAuthSendVerifyCodeRequest` | success `MagicStudioOperationOkResultEnvelope` | Issue a local verification code
- `appAuthCheckVerifyCode`: `POST /api/app/v1/auth/verify-code/check` | request `MagicStudioAuthCheckVerifyCodeRequest` | success `AuthVerificationCodeCheckResultEnvelope` | Validate a local verification code
- `appAuthRequestPasswordReset`: `POST /api/app/v1/auth/password-reset/request` | request `MagicStudioAuthPasswordResetRequest` | success `MagicStudioOperationOkResultEnvelope` | Request a password reset verification code
- `appAuthResetPassword`: `POST /api/app/v1/auth/password-reset/confirm` | request `MagicStudioAuthPasswordResetConfirmRequest` | success `MagicStudioOperationOkResultEnvelope` | Reset a password with a verified code
- `appAuthCreateQrCode`: `POST /api/app/v1/auth/qr-code` | success `AuthQrCodePayloadEnvelope` | Create a login QR code payload
- `appAuthReadQrCodeStatus`: `GET /api/app/v1/auth/qr-code/:qrKey` | success `AuthQrCodeStatusResultEnvelope` | Read login QR code status

### `capabilities` (3 routes)

- `appCapabilitiesReadSummary`: `GET /api/app/v1/capabilities/summary` | success `MagicStudioAppCapabilitySummaryEnvelope` | Read the canonical Magic Studio capability summary
- `appCapabilitiesListDomains`: `GET /api/app/v1/capabilities/domains` | success `MagicStudioAppCapabilityDomainListEnvelope` | List canonical Magic Studio capability domains
- `appCapabilitiesListExecution`: `GET /api/app/v1/capabilities/execution` | success `MagicStudioAppExecutionCapabilityListEnvelope` | List canonical Magic Studio execution capabilities

### `chat` (7 routes)

- `appChatListSessions`: `GET /api/app/v1/chat/sessions` | success `ChatSessionListEnvelope` | List canonical chat sessions
- `appChatCreateSession`: `POST /api/app/v1/chat/sessions` | request `MagicStudioChatSessionCreateRequest` | success `ChatSessionEnvelope` | Create a canonical chat session
- `appChatReadSession`: `GET /api/app/v1/chat/sessions/:sessionId` | success `ChatSessionEnvelope` | Read a canonical chat session
- `appChatUpdateSession`: `PATCH /api/app/v1/chat/sessions/:sessionId` | request `MagicStudioChatSessionUpdateRequest` | success `ChatSessionEnvelope` | Update a canonical chat session
- `appChatDeleteSession`: `DELETE /api/app/v1/chat/sessions/:sessionId` | success `MagicStudioOperationOkResultEnvelope` | Delete a canonical chat session
- `appChatReadTranscript`: `GET /api/app/v1/chat/sessions/:sessionId/transcript` | success `ChatTranscriptEnvelope` | Read a canonical chat transcript
- `appChatUpdateTranscript`: `PUT /api/app/v1/chat/sessions/:sessionId/transcript` | request `MagicStudioChatTranscriptUpdateRequest` | success `ChatTranscriptEnvelope` | Replace a canonical chat transcript

### `creation` (29 routes)

- `appCreationReadCapabilities`: `GET /api/app/v1/creation/capabilities` | success `MagicStudioCreationCapabilitiesEnvelope` | Read canonical Magic Studio creation capabilities for a target
- `appCreationListBatches`: `GET /api/app/v1/creation/batches` | success `MagicStudioCreationBatchListEnvelope` | List canonical Magic Studio creation batches
- `appCreationCreateBatch`: `POST /api/app/v1/creation/batches` | request `MagicStudioCreateCreationBatchRequest` | success `MagicStudioCreationBatchEnvelope` | Create a canonical Magic Studio creation batch
- `appCreationReadBatch`: `GET /api/app/v1/creation/batches/:batchId` | success `MagicStudioCreationBatchEnvelope` | Read a canonical Magic Studio creation batch
- `appCreationUpdateBatch`: `PATCH /api/app/v1/creation/batches/:batchId` | request `MagicStudioUpdateCreationBatchRequest` | success `MagicStudioCreationBatchEnvelope` | Update a canonical Magic Studio creation batch
- `appCreationDeleteBatch`: `DELETE /api/app/v1/creation/batches/:batchId` | success `MagicStudioOperationOkResultEnvelope` | Delete a canonical Magic Studio creation batch
- `appCreationMaterializeBatch`: `POST /api/app/v1/creation/batches/:batchId/materialize` | request `MagicStudioMaterializeCreationBatchRequest` | success `MagicStudioCreationBatchMaterializationEnvelope` | Materialize a canonical Magic Studio creation batch item into the current creation session
- `appCreationUpdateBatchItemStatus`: `POST /api/app/v1/creation/batches/:batchId/items/:itemId/status` | request `MagicStudioUpdateCreationBatchItemStatusRequest` | success `MagicStudioCreationBatchEnvelope` | Update canonical lifecycle state for a Magic Studio creation batch item
- `appCreationListPresets`: `GET /api/app/v1/creation/presets` | success `MagicStudioCreationPresetListEnvelope` | List canonical Magic Studio creation presets
- `appCreationCreatePreset`: `POST /api/app/v1/creation/presets` | request `MagicStudioCreateCreationPresetRequest` | success `MagicStudioCreationPresetEnvelope` | Create a canonical Magic Studio creation preset
- `appCreationReadPreset`: `GET /api/app/v1/creation/presets/:presetId` | success `MagicStudioCreationPresetEnvelope` | Read a canonical Magic Studio creation preset
- `appCreationUpdatePreset`: `PATCH /api/app/v1/creation/presets/:presetId` | request `MagicStudioUpdateCreationPresetRequest` | success `MagicStudioCreationPresetEnvelope` | Update a canonical Magic Studio creation preset
- `appCreationDeletePreset`: `DELETE /api/app/v1/creation/presets/:presetId` | success `MagicStudioOperationOkResultEnvelope` | Delete a canonical Magic Studio creation preset
- `appCreationListTemplates`: `GET /api/app/v1/creation/templates` | success `MagicStudioCreationTemplateListEnvelope` | List canonical Magic Studio creation templates
- `appCreationCreateTemplate`: `POST /api/app/v1/creation/templates` | request `MagicStudioCreateCreationTemplateRequest` | success `MagicStudioCreationTemplateEnvelope` | Create a canonical Magic Studio creation template
- `appCreationReadTemplate`: `GET /api/app/v1/creation/templates/:templateId` | success `MagicStudioCreationTemplateEnvelope` | Read a canonical Magic Studio creation template
- `appCreationUpdateTemplate`: `PATCH /api/app/v1/creation/templates/:templateId` | request `MagicStudioUpdateCreationTemplateRequest` | success `MagicStudioCreationTemplateEnvelope` | Update a canonical Magic Studio creation template
- `appCreationDeleteTemplate`: `DELETE /api/app/v1/creation/templates/:templateId` | success `MagicStudioOperationOkResultEnvelope` | Delete a canonical Magic Studio creation template
- `appCreationApplyTemplate`: `POST /api/app/v1/creation/templates/:templateId/apply` | request `MagicStudioApplyCreationTemplateRequest` | success `MagicStudioCreationSessionEnvelope` | Apply a canonical Magic Studio creation template into the current creation session
- `appCreationListHistory`: `GET /api/app/v1/creation/history` | success `MagicStudioCreationHistoryEntryListEnvelope` | List canonical Magic Studio creation history entries
- `appCreationReadHistoryEntry`: `GET /api/app/v1/creation/history/:entryId` | success `MagicStudioCreationHistoryEntryEnvelope` | Read a canonical Magic Studio creation history entry
- `appCreationUpsertHistoryEntry`: `PUT /api/app/v1/creation/history` | request `MagicStudioUpsertCreationHistoryEntryRequest` | success `MagicStudioCreationHistoryEntryEnvelope` | Upsert a canonical Magic Studio imported creation history entry
- `appCreationFavoriteHistoryEntry`: `POST /api/app/v1/creation/history/:entryId/favorite` | request `MagicStudioCreationHistoryFavoriteRequest` | success `MagicStudioCreationHistoryEntryEnvelope` | Set favorite state for a canonical Magic Studio creation history entry
- `appCreationDeleteHistoryEntry`: `DELETE /api/app/v1/creation/history/:entryId` | success `MagicStudioCreationHistoryEntryEnvelope` | Delete a canonical Magic Studio creation history entry
- `appCreationClearHistory`: `DELETE /api/app/v1/creation/history` | success `MagicStudioOperationOkResultEnvelope` | Clear canonical Magic Studio creation history entries
- `appCreationCreateSession`: `POST /api/app/v1/creation/sessions` | request `MagicStudioCreateCreationSessionRequest` | success `MagicStudioCreationSessionEnvelope` | Create the current canonical Magic Studio creation handoff session
- `appCreationReadCurrentSession`: `GET /api/app/v1/creation/sessions/current` | success `MagicStudioCreationSessionSnapshotEnvelope` | Read the current canonical Magic Studio creation handoff session
- `appCreationConsumeCurrentSession`: `POST /api/app/v1/creation/sessions/current/consume` | success `MagicStudioCreationSessionSnapshotEnvelope` | Consume the current canonical Magic Studio creation handoff session
- `appCreationClearCurrentSession`: `DELETE /api/app/v1/creation/sessions/current` | success `MagicStudioOperationOkResultEnvelope` | Clear the current canonical Magic Studio creation handoff session

### `drive` (14 routes)

- `appDriveReadRoot`: `GET /api/app/v1/drive/root` | success `DriveRootDescriptorEnvelope` | Read drive root descriptor
- `appDriveListEntries`: `GET /api/app/v1/drive/entries` | success `DriveItemListEnvelope` | List drive entries
- `appDriveReadStats`: `GET /api/app/v1/drive/stats` | success `DriveStatsEnvelope` | Read drive statistics
- `appDriveReadFileContent`: `GET /api/app/v1/drive/files/:itemId/content` | success `DriveFileContentEnvelope` | Read drive file content
- `appDriveUpdateFileContent`: `PUT /api/app/v1/drive/files/:itemId/content` | request `MagicStudioDriveUpdateFileContentRequest` | success `DriveFileContentEnvelope` | Update drive file content
- `appDriveCreateFolder`: `POST /api/app/v1/drive/folders` | request `MagicStudioDriveCreateFolderRequest` | success `DriveItemEnvelope` | Create a drive folder
- `appDriveUploadFile`: `POST /api/app/v1/drive/uploads` | request `MagicStudioDriveUploadFileRequest` | success `DriveItemEnvelope` | Upload a drive file payload
- `appDriveImportFile`: `POST /api/app/v1/drive/imports/file` | request `MagicStudioDriveImportFileRequest` | success `DriveItemEnvelope` | Import a local file into drive
- `appDriveRenameItem`: `POST /api/app/v1/drive/rename` | request `MagicStudioDriveRenameRequest` | success `DriveItemEnvelope` | Rename a drive item
- `appDriveMoveItems`: `POST /api/app/v1/drive/move` | request `MagicStudioDriveMoveRequest` | success `MagicStudioOperationOkResultEnvelope` | Move drive items
- `appDriveDeleteItems`: `POST /api/app/v1/drive/delete` | request `MagicStudioDriveDeleteRequest` | success `MagicStudioOperationOkResultEnvelope` | Move drive items to trash
- `appDriveRestoreItems`: `POST /api/app/v1/drive/restore` | request `MagicStudioDriveRestoreRequest` | success `MagicStudioOperationOkResultEnvelope` | Restore drive items from trash
- `appDriveEmptyTrash`: `POST /api/app/v1/drive/trash/empty` | success `MagicStudioOperationOkResultEnvelope` | Empty drive trash
- `appDriveFavoriteItem`: `POST /api/app/v1/drive/favorites` | request `MagicStudioDriveFavoriteRequest` | success `DriveItemEnvelope` | Update drive favorite state

### `film` (77 routes)

- `appFilmProjectsList`: `GET /api/app/v1/film/projects` | success `MagicStudioFilmProjectListEnvelope` | List film projects
- `appFilmProjectsCreate`: `POST /api/app/v1/film/projects` | request `MagicStudioFilmProjectCreateRequest` | success `MagicStudioFilmProjectEnvelope` | Create a film project snapshot
- `appFilmPresetsList`: `GET /api/app/v1/film/presets` | success `MagicStudioFilmPresetListEnvelope` | List canonical film presets
- `appFilmPresetsCreate`: `POST /api/app/v1/film/presets` | request `MagicStudioFilmPresetWriteRequest` | success `MagicStudioFilmPresetEnvelope` | Create a custom canonical film preset
- `appFilmTemplatesList`: `GET /api/app/v1/film/templates` | success `MagicStudioFilmTemplateListEnvelope` | List canonical film templates
- `appFilmTemplatesCreate`: `POST /api/app/v1/film/templates` | request `MagicStudioFilmTemplateWriteRequest` | success `MagicStudioFilmTemplateEnvelope` | Create a canonical reusable film template
- `appFilmTemplatesRead`: `GET /api/app/v1/film/templates/:templateId` | success `MagicStudioFilmTemplateEnvelope` | Read a canonical film template
- `appFilmTemplatesUpdate`: `PUT /api/app/v1/film/templates/:templateId` | request `MagicStudioFilmTemplateWriteRequest` | success `MagicStudioFilmTemplateEnvelope` | Update a canonical film template snapshot
- `appFilmTemplatesInstantiate`: `POST /api/app/v1/film/templates/:templateId/instantiate` | request `MagicStudioFilmTemplateInstantiateRequest` | success `MagicStudioFilmProjectEnvelope` | Instantiate a canonical film template into a new film project
- `appFilmTemplatesDelete`: `DELETE /api/app/v1/film/templates/:templateId` | success `MagicStudioOperationOkResultEnvelope` | Delete a canonical film template
- `appFilmProjectsCreateTemplateSnapshot`: `POST /api/app/v1/film/projects/:projectId/template-snapshots` | request `MagicStudioFilmTemplateSnapshotRequest` | success `MagicStudioFilmTemplateEnvelope` | Create a canonical reusable film template snapshot from a film project
- `appFilmProjectsRead`: `GET /api/app/v1/film/projects/:projectId` | success `MagicStudioFilmProjectEnvelope` | Read a film project
- `appFilmProjectsReadProjectGraph`: `GET /api/app/v1/film/projects/:projectId/project-graph` | success `MagicStudioProjectGraphDocumentEnvelope` | Read the canonical film project graph
- `appFilmProjectsReadAssetInventory`: `GET /api/app/v1/film/projects/:projectId/asset-inventory` | success `MagicStudioFilmAssetInventoryResultEnvelope` | Read the canonical film asset inventory and topology summary
- `appFilmProjectsListPublishes`: `GET /api/app/v1/film/projects/:projectId/publishes` | success `MagicStudioFilmPublishRecordListEnvelope` | List canonical film publish history records
- `appFilmProjectsListReviewQueue`: `GET /api/app/v1/film/projects/:projectId/reviews/queue` | success `MagicStudioFilmProjectReviewQueueItemListEnvelope` | List canonical film review queue items for a project
- `appFilmProjectsReadReviewPortfolioDashboard`: `GET /api/app/v1/film/projects/:projectId/reviews/portfolio-dashboard` | success `MagicStudioFilmProjectReviewPortfolioDashboardResultEnvelope` | Read the canonical cross-publish review portfolio dashboard for a film project
- `appFilmProjectsReadReviewReviewerCapacity`: `GET /api/app/v1/film/projects/:projectId/reviews/reviewer-capacity` | success `MagicStudioFilmProjectReviewReviewerCapacityResultEnvelope` | Read the canonical reviewer capacity and SLA exposure projection for a film project
- `appFilmProjectsReadReviewDecisionFreshness`: `GET /api/app/v1/film/projects/:projectId/reviews/decision-freshness` | success `MagicStudioFilmProjectReviewDecisionFreshnessResultEnvelope` | Read the canonical project-level decision freshness projection for a film project
- `appFilmProjectsReadReviewGovernanceDrift`: `GET /api/app/v1/film/projects/:projectId/reviews/governance-drift` | success `MagicStudioFilmProjectReviewGovernanceDriftResultEnvelope` | Read the canonical project-level governance drift supervision projection for a film project
- `appFilmProjectsReadReviewEscalationForecast`: `GET /api/app/v1/film/projects/:projectId/reviews/escalation-forecast` | success `MagicStudioFilmProjectReviewEscalationForecastResultEnvelope` | Read the canonical cross-publish escalation forecast and approval throughput projection for a film project
- `appFilmProjectsReadReviewDependencyGraph`: `GET /api/app/v1/film/projects/:projectId/reviews/dependency-graph` | success `MagicStudioFilmProjectReviewDependencyGraphResultEnvelope` | Read the canonical cross-publish review dependency graph for a film project
- `appFilmProjectsReadReviewInterventionPlan`: `GET /api/app/v1/film/projects/:projectId/reviews/intervention-plan` | success `MagicStudioFilmProjectReviewInterventionPlanResultEnvelope` | Read the canonical cross-publish review intervention plan for a film project
- `appFilmProjectsReadReviewRecoveryOrchestration`: `GET /api/app/v1/film/projects/:projectId/reviews/recovery-orchestration` | success `MagicStudioFilmProjectReviewRecoveryOrchestrationResultEnvelope` | Read the canonical dependency-driven review recovery orchestration plan for a film project
- `appFilmProjectsReadReviewApprovalBurnDown`: `GET /api/app/v1/film/projects/:projectId/reviews/approval-burn-down` | success `MagicStudioFilmProjectReviewApprovalBurnDownResultEnvelope` | Read the canonical approval burn-down and intervention outcome projection for a film project
- `appFilmProjectsReadReviewEffectivenessBaseline`: `GET /api/app/v1/film/projects/:projectId/reviews/effectiveness-baseline` | success `MagicStudioFilmProjectReviewEffectivenessBaselineResultEnvelope` | Read the canonical review effectiveness baseline projection for a film project
- `appFilmProjectsReadReviewInterventionExecutionHistory`: `GET /api/app/v1/film/projects/:projectId/reviews/intervention-execution-history` | success `MagicStudioFilmProjectReviewInterventionExecutionHistoryResultEnvelope` | Read the canonical intervention execution evidence and realized outcome history for a film project
- `appFilmProjectsReadReviewInterventionOutcomes`: `GET /api/app/v1/film/projects/:projectId/reviews/intervention-outcomes` | success `MagicStudioFilmProjectReviewInterventionOutcomesResultEnvelope` | Read the canonical intervention outcome learning projection for a film project
- `appFilmProjectsReadPublish`: `GET /api/app/v1/film/projects/:projectId/publishes/:publishId` | success `MagicStudioFilmPublishRecordEnvelope` | Read a canonical film publish record
- `appFilmProjectsReadPublishReviewState`: `GET /api/app/v1/film/projects/:projectId/publishes/:publishId/reviews/state` | success `MagicStudioFilmPublishReviewStateEnvelope` | Read canonical film publish review state
- `appFilmProjectsReadPublishReviewTimeline`: `GET /api/app/v1/film/projects/:projectId/publishes/:publishId/reviews/timeline` | success `MagicStudioFilmPublishReviewTimelineResultEnvelope` | Read the canonical audit timeline for a film publish review bundle
- `appFilmProjectsReadPublishReviewRounds`: `GET /api/app/v1/film/projects/:projectId/publishes/:publishId/reviews/rounds` | success `MagicStudioFilmPublishReviewRoundsResultEnvelope` | Read canonical review-round projections for a film publish review bundle
- `appFilmProjectsReadPublishReviewAnchors`: `GET /api/app/v1/film/projects/:projectId/publishes/:publishId/reviews/anchors` | success `MagicStudioFilmPublishReviewAnchorsResultEnvelope` | Read canonical review-anchor aggregations for a film publish review bundle
- `appFilmProjectsReadPublishReviewActivity`: `GET /api/app/v1/film/projects/:projectId/publishes/:publishId/reviews/activity` | success `MagicStudioFilmPublishReviewActivityResultEnvelope` | Read the canonical actor activity projection for a film publish review bundle
- `appFilmProjectsReadPublishReviewAnchorResponsibility`: `GET /api/app/v1/film/projects/:projectId/publishes/:publishId/reviews/anchor-responsibility` | success `MagicStudioFilmPublishReviewAnchorResponsibilityResultEnvelope` | Read the canonical open-anchor responsibility and escalation projection for a film publish review bundle
- `appFilmProjectsReadPublishReviewReviewerBacklog`: `GET /api/app/v1/film/projects/:projectId/publishes/:publishId/reviews/reviewer-backlog` | success `MagicStudioFilmPublishReviewReviewerBacklogResultEnvelope` | Read the canonical reviewer backlog and SLA projection for a film publish review bundle
- `appFilmProjectsReadPublishReviewDecisionMatrix`: `GET /api/app/v1/film/projects/:projectId/publishes/:publishId/reviews/decision-matrix` | success `MagicStudioFilmPublishReviewDecisionMatrixResultEnvelope` | Read the canonical round-aware reviewer decision matrix for a film publish review bundle
- `appFilmProjectsReadPublishReviewWorklist`: `GET /api/app/v1/film/projects/:projectId/publishes/:publishId/reviews/reviewer-worklist` | success `MagicStudioFilmPublishReviewWorklistResultEnvelope` | Read the canonical reviewer worklist projection for a film publish review bundle
- `appFilmProjectsReadPublishReviewReadiness`: `GET /api/app/v1/film/projects/:projectId/publishes/:publishId/reviews/readiness` | success `MagicStudioFilmPublishReviewReadinessResultEnvelope` | Read the canonical approval-readiness projection for a film publish review bundle
- `appFilmProjectsReadPublishReviewReviewerAttention`: `GET /api/app/v1/film/projects/:projectId/publishes/:publishId/reviews/reviewer-attention` | success `MagicStudioFilmPublishReviewReviewerAttentionResultEnvelope` | Read the canonical reviewer attention queue for a film publish review bundle
- `appFilmProjectsReadPublishReviewReviewerCoverage`: `GET /api/app/v1/film/projects/:projectId/publishes/:publishId/reviews/reviewer-coverage` | success `MagicStudioFilmPublishReviewReviewerCoverageResultEnvelope` | Read the canonical reviewer coverage projection for a film publish review bundle
- `appFilmProjectsReadPublishReviewOperationsDashboard`: `GET /api/app/v1/film/projects/:projectId/publishes/:publishId/reviews/operations-dashboard` | success `MagicStudioFilmPublishReviewOperationsDashboardResultEnvelope` | Read the canonical review-operations dashboard for a film publish review bundle
- `appFilmProjectsReadPublishReviewStaleDecisions`: `GET /api/app/v1/film/projects/:projectId/publishes/:publishId/reviews/stale-decisions` | success `MagicStudioFilmPublishReviewStaleDecisionResultEnvelope` | Read the canonical stale-decision and drift projection for a film publish review bundle
- `appFilmProjectsReadPublishReviewLatencyAnalytics`: `GET /api/app/v1/film/projects/:projectId/publishes/:publishId/reviews/latency-analytics` | success `MagicStudioFilmPublishReviewLatencyAnalyticsResultEnvelope` | Read the canonical review latency and throughput analytics for a film publish review bundle
- `appFilmProjectsApprovePublish`: `POST /api/app/v1/film/projects/:projectId/publishes/:publishId/approve` | request `MagicStudioFilmPublishApproveRequest` | success `MagicStudioFilmPublishApproveResultEnvelope` | Approve a canonical film publish review bundle
- `appFilmProjectsRequestPublishChanges`: `POST /api/app/v1/film/projects/:projectId/publishes/:publishId/request-changes` | request `MagicStudioFilmPublishRequestChangesRequest` | success `MagicStudioFilmPublishRequestChangesResultEnvelope` | Request changes for a canonical film publish review bundle
- `appFilmProjectsCreatePublishReviewComment`: `POST /api/app/v1/film/projects/:projectId/publishes/:publishId/reviews/comments` | request `MagicStudioFilmPublishReviewCommentRequest` | success `MagicStudioFilmPublishReviewCommentResultEnvelope` | Add a canonical review comment to a film publish bundle
- `appFilmProjectsSubmitPublishReview`: `POST /api/app/v1/film/projects/:projectId/publishes/:publishId/reviews/submit` | request `MagicStudioFilmPublishReviewSubmitRequest` | success `MagicStudioFilmPublishReviewSubmitResultEnvelope` | Submit a canonical film publish bundle into review or resubmit after changes
- `appFilmProjectsConsensusPublishReview`: `POST /api/app/v1/film/projects/:projectId/publishes/:publishId/reviews/consensus` | request `MagicStudioFilmPublishReviewConsensusRequest` | success `MagicStudioFilmPublishReviewConsensusResultEnvelope` | Record a canonical consensus checkpoint for a film publish review bundle
- `appFilmProjectsSetPublishReviewAssignments`: `POST /api/app/v1/film/projects/:projectId/publishes/:publishId/reviews/assignments` | request `MagicStudioFilmPublishReviewAssignmentsRequest` | success `MagicStudioFilmPublishReviewAssignmentsResultEnvelope` | Set canonical review assignments for a film publish bundle
- `appFilmProjectsResolvePublishReviewComment`: `POST /api/app/v1/film/projects/:projectId/publishes/:publishId/reviews/comments/:commentId/resolve` | request `MagicStudioFilmPublishReviewCommentResolveRequest` | success `MagicStudioFilmPublishReviewCommentResolveResultEnvelope` | Resolve a canonical review comment on a film publish bundle
- `appFilmProjectsReopenPublish`: `POST /api/app/v1/film/projects/:projectId/publishes/:publishId/reopen` | request `MagicStudioFilmPublishReopenRequest` | success `MagicStudioFilmPublishReopenResultEnvelope` | Reopen a canonical film publish review bundle
- `appFilmProjectsRestorePublish`: `POST /api/app/v1/film/projects/:projectId/publishes/:publishId/restore` | request `MagicStudioFilmPublishRestoreRequest` | success `MagicStudioFilmPublishRestoreResultEnvelope` | Restore a canonical film publish snapshot into the working project
- `appFilmProjectsDeletePublish`: `DELETE /api/app/v1/film/projects/:projectId/publishes/:publishId` | success `MagicStudioOperationOkResultEnvelope` | Delete a canonical film publish bundle and archive
- `appFilmProjectsReadPublishArtifactContent`: `GET /api/app/v1/film/projects/:projectId/publishes/:publishId/artifacts/:artifactKind/content` | success `MagicStudioFilmPublishArtifactContentEnvelope` | Read canonical film publish artifact content
- `appFilmProjectsUpdate`: `PUT /api/app/v1/film/projects/:projectId` | request `MagicStudioFilmProjectUpdateRequest` | success `MagicStudioFilmProjectEnvelope` | Update a film project snapshot
- `appFilmProjectsDelete`: `DELETE /api/app/v1/film/projects/:projectId` | success `MagicStudioOperationOkResultEnvelope` | Delete a film project
- `appFilmAnalysisScript`: `POST /api/app/v1/film/analysis/script` | request `MagicStudioFilmAnalysisRequest` | success `MagicStudioFilmScriptAnalysisResultEnvelope` | Analyze a film script into canonical film entities
- `appFilmProjectsStandardizeScript`: `POST /api/app/v1/film/projects/:projectId/authoring/standardize-script` | request `MagicStudioFilmScriptStandardizeRequest` | success `MagicStudioFilmScriptStandardizeResultEnvelope` | Standardize canonical film script content before analysis or storyboard work
- `appFilmProjectsPrepareAnalysis`: `POST /api/app/v1/film/projects/:projectId/authoring/prepare-analysis` | request `MagicStudioFilmPrepareAnalysisRequest` | success `MagicStudioFilmPrepareAnalysisResultEnvelope` | Prepare canonical film analysis by standardizing script content and refreshing analysis entities
- `appFilmProjectsRebuildStoryboard`: `POST /api/app/v1/film/projects/:projectId/authoring/rebuild-storyboard` | request `MagicStudioFilmRebuildStoryboardRequest` | success `MagicStudioFilmRebuildStoryboardResultEnvelope` | Rebuild the canonical film storyboard from standardized script and refreshed analysis
- `appFilmProjectsCreateSceneBreakdown`: `POST /api/app/v1/film/projects/:projectId/authoring/create-scene-breakdown` | request `MagicStudioFilmCreateSceneBreakdownRequest` | success `MagicStudioFilmCreateSceneBreakdownResultEnvelope` | Create and persist the canonical film scene breakdown for pre-production planning
- `appFilmProjectsGenerateShotVariants`: `POST /api/app/v1/film/projects/:projectId/authoring/generate-shot-variants` | request `MagicStudioFilmGenerateShotVariantsRequest` | success `MagicStudioFilmGenerateShotVariantsResultEnvelope` | Generate and persist canonical pre-production shot variant plans from the scene breakdown
- `appFilmProjectsCreateShootingPlan`: `POST /api/app/v1/film/projects/:projectId/authoring/create-shooting-plan` | request `MagicStudioFilmCreateShootingPlanRequest` | success `MagicStudioFilmCreateShootingPlanResultEnvelope` | Create and persist the canonical location-aware shooting plan from pre-production data
- `appFilmProjectsGenerateStoryboard`: `POST /api/app/v1/film/projects/:projectId/storyboard/generate` | request `MagicStudioFilmStoryboardGenerateRequest` | success `MagicStudioFilmProjectEnvelope` | Generate canonical storyboard shots for a film project
- `appFilmProjectsSyncShots`: `POST /api/app/v1/film/projects/:projectId/shots/sync` | request `MagicStudioFilmShotSyncRequest` | success `MagicStudioFilmProjectEnvelope` | Normalize and synchronize film shots
- `appFilmProjectsBindAsset`: `POST /api/app/v1/film/projects/:projectId/assets/bind` | request `MagicStudioFilmAssetBindRequest` | success `MagicStudioFilmProjectEnvelope` | Bind a canonical asset to a film project entity
- `appFilmProjectsExportPackage`: `POST /api/app/v1/film/projects/:projectId/export/package` | request `MagicStudioFilmExportPackageRequest` | success `MagicStudioFilmExportPackageEnvelope` | Build a canonical export package for a film project
- `appFilmProjectsPublishStoryboard`: `POST /api/app/v1/film/projects/:projectId/publish/storyboard` | request `MagicStudioFilmStoryboardPublishRequest` | success `MagicStudioFilmStoryboardPublishResultEnvelope` | Publish a canonical storyboard review bundle for a film project
- `appFilmProjectsImportPackage`: `POST /api/app/v1/film/projects/import/package` | request `MagicStudioFilmImportPackageRequest` | success `MagicStudioFilmImportPackageEnvelope` | Import a canonical film project package or JSON snapshot
- `appFilmProjectsValidate`: `POST /api/app/v1/film/projects/validate` | request `MagicStudioFilmProjectValidateRequest` | success `MagicStudioFilmProjectValidationEnvelope` | Validate a canonical film project snapshot
- `appFilmAnalysisCharacters`: `POST /api/app/v1/film/analysis/characters` | request `MagicStudioFilmAnalysisRequest` | success `MagicStudioFilmCharacterListEnvelope` | Extract film characters from script content
- `appFilmAnalysisProps`: `POST /api/app/v1/film/analysis/props` | request `MagicStudioFilmAnalysisRequest` | success `MagicStudioFilmPropListEnvelope` | Extract film props from script content
- `appFilmProjectsRunAuthoringBatch`: `POST /api/app/v1/film/projects/:projectId/authoring/batch` | request `MagicStudioFilmAuthoringBatchRequest` | success `MagicStudioFilmAuthoringBatchResultEnvelope` | Run canonical film authoring batch commands
- `appFilmProjectsRefreshAnalysis`: `POST /api/app/v1/film/projects/:projectId/authoring/refresh-analysis` | request `MagicStudioFilmRefreshAnalysisRequest` | success `MagicStudioFilmRefreshAnalysisResultEnvelope` | Refresh canonical film analysis from script content and optionally rebuild storyboard shots
- `appFilmProjectsApplyPreset`: `POST /api/app/v1/film/projects/:projectId/apply-preset` | request `MagicStudioFilmPresetApplyRequest` | success `MagicStudioFilmProjectEnvelope` | Apply a canonical film preset to project settings
- `appFilmProjectsRelinkAssets`: `POST /api/app/v1/film/projects/:projectId/assets/relink` | request `MagicStudioFilmAssetRelinkRequest` | success `MagicStudioFilmAssetRelinkResultEnvelope` | Relink canonical film asset locators after import or storage migration

### `magiccut` (19 routes)

- `appMagicCutProjectsList`: `GET /api/app/v1/magiccut/projects` | success `MagicStudioMagicCutProjectListEnvelope` | List MagicCut projects
- `appMagicCutProjectsCreate`: `POST /api/app/v1/magiccut/projects` | request `MagicStudioMagicCutProjectCreateRequest` | success `MagicStudioMagicCutProjectEnvelope` | Create a MagicCut project snapshot
- `appMagicCutProjectsRead`: `GET /api/app/v1/magiccut/projects/:projectId` | success `MagicStudioMagicCutProjectEnvelope` | Read a MagicCut project
- `appMagicCutProjectsUpdate`: `PUT /api/app/v1/magiccut/projects/:projectId` | request `MagicStudioMagicCutProjectUpdateRequest` | success `MagicStudioMagicCutProjectEnvelope` | Update a MagicCut project snapshot
- `appMagicCutProjectsDelete`: `DELETE /api/app/v1/magiccut/projects/:projectId` | success `MagicStudioOperationOkResultEnvelope` | Delete a MagicCut project
- `appMagicCutProjectsDuplicate`: `POST /api/app/v1/magiccut/projects/:projectId/duplicate` | request `MagicStudioMagicCutProjectDuplicateRequest` | success `MagicStudioMagicCutProjectEnvelope` | Duplicate a MagicCut project
- `appMagicCutTemplatesList`: `GET /api/app/v1/magiccut/templates` | success `MagicStudioMagicCutTemplateListEnvelope` | List MagicCut templates
- `appMagicCutTemplatesCreate`: `POST /api/app/v1/magiccut/templates` | request `MagicStudioMagicCutTemplateSaveRequest` | success `MagicStudioMagicCutTemplateEnvelope` | Create a MagicCut template
- `appMagicCutTemplatesRead`: `GET /api/app/v1/magiccut/templates/:templateId` | success `MagicStudioMagicCutTemplateEnvelope` | Read a MagicCut template
- `appMagicCutTemplatesUpdate`: `PUT /api/app/v1/magiccut/templates/:templateId` | request `MagicStudioMagicCutTemplateSaveRequest` | success `MagicStudioMagicCutTemplateEnvelope` | Update a MagicCut template snapshot
- `appMagicCutTemplatesInstantiate`: `POST /api/app/v1/magiccut/templates/:templateId/instantiate` | request `MagicStudioMagicCutTemplateInstantiateRequest` | success `MagicStudioMagicCutProjectEnvelope` | Instantiate a MagicCut template as a new project
- `appMagicCutTemplatesDelete`: `DELETE /api/app/v1/magiccut/templates/:templateId` | success `MagicStudioOperationOkResultEnvelope` | Delete a MagicCut template
- `appMagicCutReadRenderCapabilities`: `GET /api/app/v1/magiccut/render-capabilities` | success `MagicStudioMagicCutRenderCapabilitiesEnvelope` | Read MagicCut render capabilities
- `appMagicCutListRenders`: `GET /api/app/v1/magiccut/renders` | success `MagicStudioMagicCutRenderJobListEnvelope` | List MagicCut render jobs
- `appMagicCutCreateRender`: `POST /api/app/v1/magiccut/projects/:projectId/renders` | request `MagicStudioMagicCutRenderCreateRequest` | success `MagicStudioMagicCutRenderJobEnvelope` | Create a MagicCut render job
- `appMagicCutReadRender`: `GET /api/app/v1/magiccut/renders/:renderId` | success `MagicStudioMagicCutRenderJobEnvelope` | Read a MagicCut render job
- `appMagicCutCancelRender`: `POST /api/app/v1/magiccut/renders/:renderId/cancel` | success `MagicStudioMagicCutRenderJobEnvelope` | Cancel a MagicCut render job
- `appMagicCutListRenderArtifacts`: `GET /api/app/v1/magiccut/renders/:renderId/artifacts` | success `MagicStudioMagicCutRenderArtifactListEnvelope` | List MagicCut render artifacts
- `appMagicCutReadRenderArtifactContent`: `GET /api/app/v1/magiccut/renders/:renderId/artifacts/:artifactId/content` | success `MagicStudioMagicCutRenderArtifactContentEnvelope` | Read MagicCut render artifact content

### `generation/images` (6 routes)

- `appGenerationImagesCreateTask`: `POST /api/app/v1/generation/images/tasks` | request `MagicStudioImageGenerationRequest` | success `MagicStudioGenerationTaskEnvelope` | Create an image generation task
- `appGenerationImagesCreateVariation`: `POST /api/app/v1/generation/images/variations` | request `MagicStudioImageGenerationRequest` | success `MagicStudioGenerationTaskEnvelope` | Create an image variation task
- `appGenerationImagesCreateEdit`: `POST /api/app/v1/generation/images/edits` | request `MagicStudioImageEditRequest` | success `MagicStudioGenerationTaskEnvelope` | Create an image edit task
- `appGenerationImagesCreateUpscale`: `POST /api/app/v1/generation/images/upscales` | request `MagicStudioImageUpscaleRequest` | success `MagicStudioGenerationTaskEnvelope` | Create an image upscale task
- `appGenerationImagesEnhancePrompt`: `POST /api/app/v1/generation/images/prompt/enhance` | request `MagicStudioGenerationPromptEnhanceRequest` | success `MagicStudioGenerationPromptEnhanceResultEnvelope` | Enhance an image generation prompt
- `appGenerationImagesReadTask`: `GET /api/app/v1/generation/images/tasks/:taskId` | success `MagicStudioGenerationTaskEnvelope` | Read an image generation task

### `generation/videos` (8 routes)

- `appGenerationVideosCreateTask`: `POST /api/app/v1/generation/videos/tasks` | request `MagicStudioVideoGenerationRequest` | success `MagicStudioGenerationTaskEnvelope` | Create a video generation task
- `appGenerationVideosCreateImageToVideo`: `POST /api/app/v1/generation/videos/image-to-video` | request `MagicStudioVideoGenerationRequest` | success `MagicStudioGenerationTaskEnvelope` | Create an image-to-video generation task
- `appGenerationVideosCreateExtend`: `POST /api/app/v1/generation/videos/extend` | request `MagicStudioVideoGenerationRequest` | success `MagicStudioGenerationTaskEnvelope` | Create a video extend task
- `appGenerationVideosCreateStyleTransfer`: `POST /api/app/v1/generation/videos/style-transfer` | request `MagicStudioVideoGenerationRequest` | success `MagicStudioGenerationTaskEnvelope` | Create a video style transfer task
- `appGenerationVideosCreateLipSync`: `POST /api/app/v1/generation/videos/lip-sync` | request `MagicStudioVideoGenerationRequest` | success `MagicStudioGenerationTaskEnvelope` | Create a video lip-sync task
- `appGenerationVideosEnhancePrompt`: `POST /api/app/v1/generation/videos/prompt/enhance` | request `MagicStudioGenerationPromptEnhanceRequest` | success `MagicStudioGenerationPromptEnhanceResultEnvelope` | Enhance a video generation prompt
- `appGenerationVideosReadTask`: `GET /api/app/v1/generation/videos/tasks/:taskId` | success `MagicStudioGenerationTaskEnvelope` | Read a video generation task
- `appGenerationVideosCancelTask`: `POST /api/app/v1/generation/videos/tasks/:taskId/cancel` | success `MagicStudioGenerationTaskEnvelope` | Cancel a video generation task

### `generation/audio` (4 routes)

- `appGenerationAudioCreateTextToSpeech`: `POST /api/app/v1/generation/audio/text-to-speech` | request `MagicStudioAudioGenerationRequest` | success `MagicStudioGenerationTaskEnvelope` | Create an audio text-to-speech generation task
- `appGenerationAudioCreateTranscription`: `POST /api/app/v1/generation/audio/transcriptions` | request `MagicStudioAudioGenerationRequest` | success `MagicStudioGenerationTaskEnvelope` | Create an audio transcription task
- `appGenerationAudioCreateTranslation`: `POST /api/app/v1/generation/audio/translations` | request `MagicStudioAudioGenerationRequest` | success `MagicStudioGenerationTaskEnvelope` | Create an audio translation task
- `appGenerationAudioReadTask`: `GET /api/app/v1/generation/audio/tasks/:taskId` | success `MagicStudioGenerationTaskEnvelope` | Read an audio generation task

### `generation/catalog` (4 routes)

- `appGenerationCatalogListModels`: `GET /api/app/v1/generation/catalog/models` | success `MagicStudioGenerationCatalogModelListEnvelope` | List canonical generation catalog models
- `appGenerationCatalogListStyles`: `GET /api/app/v1/generation/catalog/styles` | success `MagicStudioGenerationCatalogStyleListEnvelope` | List canonical generation catalog styles
- `appGenerationCatalogListProviders`: `GET /api/app/v1/generation/catalog/providers` | success `MagicStudioGenerationCatalogProviderListEnvelope` | List canonical generation catalog providers
- `appGenerationCatalogListVoices`: `GET /api/app/v1/generation/catalog/voices` | success `MagicStudioVoiceSpeakerListEnvelope` | List canonical generation catalog voices

### `generation/music` (5 routes)

- `appGenerationMusicCreateTask`: `POST /api/app/v1/generation/music/tasks` | request `MagicStudioMusicGenerationRequest` | success `MagicStudioGenerationTaskEnvelope` | Create a music generation task
- `appGenerationMusicCreateSimilar`: `POST /api/app/v1/generation/music/similar` | request `MagicStudioMusicSimilarRequest` | success `MagicStudioGenerationTaskEnvelope` | Create a similar-music generation task
- `appGenerationMusicCreateRemix`: `POST /api/app/v1/generation/music/remix` | request `MagicStudioMusicRemixRequest` | success `MagicStudioGenerationTaskEnvelope` | Create a music remix task
- `appGenerationMusicCreateExtend`: `POST /api/app/v1/generation/music/extend` | request `MagicStudioMusicExtendRequest` | success `MagicStudioGenerationTaskEnvelope` | Create a music extend task
- `appGenerationMusicReadTask`: `GET /api/app/v1/generation/music/tasks/:taskId` | success `MagicStudioGenerationTaskEnvelope` | Read a music generation task

### `generation/sfx` (5 routes)

- `appGenerationSfxCreateTask`: `POST /api/app/v1/generation/sfx/tasks` | request `MagicStudioSfxGenerationRequest` | success `MagicStudioGenerationTaskEnvelope` | Create a sound-effect generation task
- `appGenerationSfxListTasks`: `GET /api/app/v1/generation/sfx/tasks` | success `MagicStudioGenerationTaskListEnvelope` | List sound-effect generation tasks
- `appGenerationSfxListCategories`: `GET /api/app/v1/generation/sfx/categories` | success `MagicStudioSfxCategoryListEnvelope` | List sound-effect generation categories
- `appGenerationSfxReadTask`: `GET /api/app/v1/generation/sfx/tasks/:taskId` | success `MagicStudioGenerationTaskEnvelope` | Read a sound-effect generation task
- `appGenerationSfxCancelTask`: `POST /api/app/v1/generation/sfx/tasks/:taskId/cancel` | success `MagicStudioGenerationTaskEnvelope` | Cancel a sound-effect generation task

### `generation/characters` (4 routes)

- `appGenerationCharactersCreateTask`: `POST /api/app/v1/generation/characters/tasks` | request `MagicStudioCharacterGenerationRequest` | success `MagicStudioGenerationTaskEnvelope` | Create a character generation task
- `appGenerationCharactersListTasks`: `GET /api/app/v1/generation/characters/tasks` | success `MagicStudioGenerationTaskListEnvelope` | List character generation tasks
- `appGenerationCharactersReadTask`: `GET /api/app/v1/generation/characters/tasks/:taskId` | success `MagicStudioGenerationTaskEnvelope` | Read a character generation task
- `appGenerationCharactersCancelTask`: `POST /api/app/v1/generation/characters/tasks/:taskId/cancel` | success `MagicStudioGenerationTaskEnvelope` | Cancel a character generation task

### `generation/tasks` (4 routes)

- `appGenerationListTasks`: `GET /api/app/v1/generation/tasks` | success `MagicStudioGenerationTaskListEnvelope` | List canonical generation tasks across image, video, audio, music, sfx, character, and speech products
- `appGenerationReadTask`: `GET /api/app/v1/generation/tasks/:taskId` | success `MagicStudioGenerationTaskEnvelope` | Read a canonical generation task
- `appGenerationDeleteTask`: `DELETE /api/app/v1/generation/tasks/:taskId` | success `MagicStudioGenerationTaskEnvelope` | Delete a canonical generation task
- `appGenerationCancelTask`: `POST /api/app/v1/generation/tasks/:taskId/cancel` | success `MagicStudioGenerationTaskEnvelope` | Cancel a canonical generation task when the underlying product supports cancellation

### `notes` (16 routes)

- `appNotesWorkspaceSnapshot`: `GET /api/app/v1/notes/workspace-snapshot` | success `NoteWorkspaceSnapshotEnvelope` | Read note workspace snapshot
- `appNotesList`: `GET /api/app/v1/notes` | success `NoteSummaryListEnvelope` | List active notes
- `appNotesCreate`: `POST /api/app/v1/notes` | request `MagicStudioNoteCreateRequest` | success `NoteEnvelope` | Create a note
- `appNotesListTrashed`: `GET /api/app/v1/notes/trashed` | success `NoteSummaryListEnvelope` | List trashed notes
- `appNotesRead`: `GET /api/app/v1/notes/:noteId` | success `NoteEnvelope` | Read a note
- `appNotesUpdate`: `PUT /api/app/v1/notes/:noteId` | request `MagicStudioNoteUpdateRequest` | success `NoteEnvelope` | Update a note
- `appNotesCreateFolder`: `POST /api/app/v1/notes/folders` | request `MagicStudioNoteFolderCreateRequest` | success `NoteFolderEnvelope` | Create a note folder
- `appNotesRenameFolder`: `PATCH /api/app/v1/notes/folders/:folderId` | request `MagicStudioNoteFolderRenameRequest` | success `NoteFolderEnvelope` | Rename a note folder
- `appNotesDeleteFolder`: `DELETE /api/app/v1/notes/folders/:folderId` | success `MagicStudioOperationOkResultEnvelope` | Delete an empty note folder
- `appNotesTrash`: `POST /api/app/v1/notes/:noteId/trash` | success `NoteEnvelope` | Move a note to trash
- `appNotesRestore`: `POST /api/app/v1/notes/:noteId/restore` | success `NoteEnvelope` | Restore a note from trash
- `appNotesDelete`: `DELETE /api/app/v1/notes/:noteId` | success `MagicStudioOperationOkResultEnvelope` | Permanently delete a note
- `appNotesClearTrash`: `POST /api/app/v1/notes/trash/clear` | success `MagicStudioOperationOkResultEnvelope` | Permanently clear the note trash
- `appNotesMoveFolder`: `POST /api/app/v1/notes/folders/:folderId/move` | request `MagicStudioNoteFolderMoveRequest` | success `MagicStudioOperationOkResultEnvelope` | Move a note folder
- `appNotesMove`: `POST /api/app/v1/notes/:noteId/move` | request `MagicStudioNoteMoveRequest` | success `MagicStudioOperationOkResultEnvelope` | Move a note
- `appNotesPublish`: `POST /api/app/v1/notes/:noteId/publish` | request `MagicStudioNotePublishRequest` | success `PublishResultEnvelope` | Publish a note through the canonical notes API

### `presentations` (7 routes)

- `appPresentationsList`: `GET /api/app/v1/presentations` | success `MagicStudioPresentationListEnvelope` | List canonical presentations
- `appPresentationsCreate`: `POST /api/app/v1/presentations` | request `MagicStudioPresentationCreateRequest` | success `MagicStudioPresentationEnvelope` | Create a canonical presentation
- `appPresentationsRead`: `GET /api/app/v1/presentations/:presentationId` | success `MagicStudioPresentationEnvelope` | Read a canonical presentation
- `appPresentationsUpdate`: `PATCH /api/app/v1/presentations/:presentationId` | request `MagicStudioPresentationUpdateRequest` | success `MagicStudioPresentationEnvelope` | Update a canonical presentation
- `appPresentationsDelete`: `DELETE /api/app/v1/presentations/:presentationId` | success `MagicStudioOperationOkResultEnvelope` | Delete a canonical presentation
- `appPresentationsCreateSlide`: `POST /api/app/v1/presentations/:presentationId/slides` | request `MagicStudioPresentationSlideCreateRequest` | success `MagicStudioPresentationEnvelope` | Append a slide to a canonical presentation
- `appPresentationsUpdateSlide`: `PATCH /api/app/v1/presentations/:presentationId/slides/:slideId` | request `MagicStudioPresentationSlideUpdateRequest` | success `MagicStudioPresentationEnvelope` | Update a canonical presentation slide

### `notifications` (6 routes)

- `appNotificationsList`: `GET /api/app/v1/notifications` | success `MagicStudioNotificationRecordListEnvelope` | List application notifications
- `appNotificationsCreate`: `POST /api/app/v1/notifications` | request `MagicStudioNotificationCreateRequest` | success `MagicStudioNotificationRecordEnvelope` | Create an application notification
- `appNotificationsReadUnreadCount`: `GET /api/app/v1/notifications/unread-count` | success `MagicStudioNotificationUnreadCountEnvelope` | Read unread notification count
- `appNotificationsMarkAllRead`: `POST /api/app/v1/notifications/read-all` | success `MagicStudioOperationOkResultEnvelope` | Mark all notifications as read
- `appNotificationsMarkRead`: `POST /api/app/v1/notifications/:notificationId/read` | success `MagicStudioOperationOkResultEnvelope` | Mark a notification as read
- `appNotificationsDeleteBatch`: `POST /api/app/v1/notifications/delete` | request `MagicStudioNotificationBatchDeleteRequest` | success `MagicStudioOperationOkResultEnvelope` | Delete application notifications

### `portal` (10 routes)

- `appPortalFeedsCreate`: `POST /api/app/v1/portal/feeds` | request `MagicStudioPortalFeedCreateRequest` | success `MagicStudioPortalFeedEnvelope` | Create a canonical portal feed
- `appPortalFeedsListFeatured`: `GET /api/app/v1/portal/feeds/featured` | success `MagicStudioPortalFeedListEnvelope` | List canonical featured portal feeds
- `appPortalFeedsListDiscover`: `GET /api/app/v1/portal/feeds/discover` | success `MagicStudioPortalFeedListEnvelope` | List canonical discover portal feeds
- `appPortalFeedsRead`: `GET /api/app/v1/portal/feeds/:feedId` | success `MagicStudioPortalFeedEnvelope` | Read a canonical portal feed
- `appPortalFeedsLike`: `POST /api/app/v1/portal/feeds/:feedId/like` | success `MagicStudioPortalFeedEnvelope` | Like a canonical portal feed
- `appPortalFeedsUnlike`: `POST /api/app/v1/portal/feeds/:feedId/unlike` | success `MagicStudioPortalFeedEnvelope` | Unlike a canonical portal feed
- `appPortalFeedsCollect`: `POST /api/app/v1/portal/feeds/:feedId/collect` | success `MagicStudioPortalFeedEnvelope` | Collect a canonical portal feed
- `appPortalFeedsUncollect`: `POST /api/app/v1/portal/feeds/:feedId/uncollect` | success `MagicStudioPortalFeedEnvelope` | Remove a canonical portal feed from collection
- `appPortalFeedsShare`: `POST /api/app/v1/portal/feeds/:feedId/share` | success `MagicStudioPortalFeedEnvelope` | Share a canonical portal feed
- `appPortalFeedsDelete`: `DELETE /api/app/v1/portal/feeds/:feedId` | success `MagicStudioOperationOkResultEnvelope` | Delete a canonical portal feed

### `plugins` (1 route)

- `appPluginsList`: `GET /api/app/v1/plugins` | success `MagicStudioPluginManifestListEnvelope` | List registered plugins

### `prompt` (1 route)

- `appPromptOptimize`: `POST /api/app/v1/prompt/optimize` | request `MagicStudioPromptOptimizeRequest` | success `MagicStudioPromptOptimizeResultEnvelope` | Optimize a prompt for a Magic Studio generation workflow

### `settings` (2 routes)

- `appSettingsRead`: `GET /api/app/v1/settings` | success `MagicStudioAppSettingsDocumentEnvelope` | Read application settings
- `appSettingsUpdate`: `PUT /api/app/v1/settings` | request `MagicStudioAppSettingsUpdateRequest` | success `MagicStudioAppSettingsDocumentEnvelope` | Update application settings

### `trade` (22 routes)

- `appTradeTasksListAvailable`: `GET /api/app/v1/trade/tasks/available` | success `MagicStudioTradeMarketplaceTaskListEnvelope` | List canonical marketplace tasks available to the current user
- `appTradeTasksListPublished`: `GET /api/app/v1/trade/tasks/published` | success `MagicStudioTradeMarketplaceTaskListEnvelope` | List canonical marketplace tasks published by the current user
- `appTradeTasksListAccepted`: `GET /api/app/v1/trade/tasks/accepted` | success `MagicStudioTradeMarketplaceTaskListEnvelope` | List canonical marketplace tasks accepted by the current user
- `appTradeTasksRead`: `GET /api/app/v1/trade/tasks/:taskId` | success `MagicStudioTradeMarketplaceTaskEnvelope` | Read a canonical marketplace task
- `appTradeTasksAccept`: `POST /api/app/v1/trade/tasks/:taskId/accept` | request `MagicStudioTradeTaskAcceptRequest` | success `MagicStudioTradeMarketplaceTaskEnvelope` | Accept a canonical marketplace task for the current user
- `appTradeTasksSubmit`: `POST /api/app/v1/trade/tasks/:taskId/submit` | request `MagicStudioTradeTaskSubmitRequest` | success `MagicStudioTradeMarketplaceTaskEnvelope` | Submit a canonical marketplace task delivery
- `appTradeTasksApprove`: `POST /api/app/v1/trade/tasks/:taskId/approve` | request `MagicStudioTradeTaskApproveRequest` | success `MagicStudioTradeMarketplaceTaskEnvelope` | Approve or reopen a canonical marketplace task delivery
- `appTradeTasksCancel`: `POST /api/app/v1/trade/tasks/:taskId/cancel` | success `MagicStudioTradeMarketplaceTaskEnvelope` | Cancel or release a canonical marketplace task
- `appTradeOrdersList`: `GET /api/app/v1/trade/orders` | success `MagicStudioTradeOrderListEnvelope` | List canonical trade orders for the current user
- `appTradeOrdersRead`: `GET /api/app/v1/trade/orders/:orderId` | success `MagicStudioTradeOrderEnvelope` | Read a canonical trade order
- `appTradeOrdersCreate`: `POST /api/app/v1/trade/orders` | request `MagicStudioTradeOrderCreateRequest` | success `MagicStudioTradeOrderEnvelope` | Create a canonical trade order
- `appTradeOrdersUpdateStatus`: `POST /api/app/v1/trade/orders/:orderId/status` | request `MagicStudioTradeOrderStatusUpdateRequest` | success `MagicStudioTradeOrderEnvelope` | Update a canonical trade order status
- `appTradeOrdersCancel`: `POST /api/app/v1/trade/orders/:orderId/cancel` | request `MagicStudioTradeOrderCancelRequest` | success `MagicStudioTradeOrderEnvelope` | Cancel a canonical pending-payment trade order
- `appTradeOrdersDelete`: `DELETE /api/app/v1/trade/orders/:orderId` | success `MagicStudioOperationOkResultEnvelope` | Delete a completed, cancelled, or refunded canonical trade order
- `appTradeOrdersReadStatistics`: `GET /api/app/v1/trade/orders/statistics` | success `MagicStudioTradeOrderStatisticsEnvelope` | Read canonical trade order statistics for the current user
- `appTradePaymentsList`: `GET /api/app/v1/trade/payments` | success `MagicStudioTradePaymentListEnvelope` | List canonical trade payments for the current user
- `appTradePaymentsRead`: `GET /api/app/v1/trade/payments/:paymentId` | success `MagicStudioTradePaymentEnvelope` | Read a canonical trade payment
- `appTradePaymentsCreate`: `POST /api/app/v1/trade/payments` | request `MagicStudioTradePaymentCreateRequest` | success `MagicStudioTradePaymentActionResultEnvelope` | Initiate a canonical trade payment
- `appTradePaymentsRefund`: `POST /api/app/v1/trade/payments/:paymentId/refund` | request `MagicStudioTradePaymentRefundRequest` | success `MagicStudioTradePaymentEnvelope` | Refund a canonical successful trade payment
- `appTradePaymentsRecharge`: `POST /api/app/v1/trade/payments/recharge` | request `MagicStudioTradePaymentRechargeRequest` | success `MagicStudioTradePaymentActionResultEnvelope` | Recharge the canonical trade wallet
- `appTradeWalletRead`: `GET /api/app/v1/trade/wallet` | success `MagicStudioTradeWalletEnvelope` | Read the canonical trade wallet for the current user
- `appTradeTransactionsList`: `GET /api/app/v1/trade/transactions` | success `MagicStudioTradeTransactionListEnvelope` | List canonical trade wallet transactions for the current user

### `user` (29 routes)

- `appUserReadProfile`: `GET /api/app/v1/user/profile` | success `UserProfileEnvelope` | Read the current user profile
- `appUserUpdateProfile`: `PATCH /api/app/v1/user/profile` | request `MagicStudioUserProfileUpdateRequest` | success `UserProfileEnvelope` | Update the current user profile
- `appUserUploadAvatar`: `POST /api/app/v1/user/avatar` | request `MagicStudioUserAvatarUploadRequest` | success `UserProfileEnvelope` | Upload a current user avatar payload
- `appUserReadSettings`: `GET /api/app/v1/user/settings` | success `UserSettingsEnvelope` | Read the current user settings
- `appUserUpdateSettings`: `PUT /api/app/v1/user/settings` | request `MagicStudioUserSettingsUpdateRequest` | success `UserSettingsEnvelope` | Update the current user settings
- `appUserChangePassword`: `POST /api/app/v1/user/password/change` | request `MagicStudioUserPasswordChangeRequest` | success `MagicStudioOperationOkResultEnvelope` | Change the current user password
- `appUserListAddresses`: `GET /api/app/v1/user/addresses` | success `UserAddressListEnvelope` | List the current user addresses
- `appUserReadDefaultAddress`: `GET /api/app/v1/user/addresses/default` | success `UserAddressOptionalEnvelope` | Read the current user default address
- `appUserCreateAddress`: `POST /api/app/v1/user/addresses` | request `MagicStudioUserAddressCreateRequest` | success `UserAddressEnvelope` | Create a current user address
- `appUserUpdateAddress`: `PATCH /api/app/v1/user/addresses/:addressId` | request `MagicStudioUserAddressUpdateRequest` | success `UserAddressEnvelope` | Update a current user address
- `appUserDeleteAddress`: `DELETE /api/app/v1/user/addresses/:addressId` | success `MagicStudioOperationOkResultEnvelope` | Delete a current user address
- `appUserSetDefaultAddress`: `POST /api/app/v1/user/addresses/:addressId/default` | success `UserAddressEnvelope` | Set the current user default address
- `appUserReadLoginHistory`: `GET /api/app/v1/user/history/login` | success `UserLoginHistoryEntryListEnvelope` | List current user login history records
- `appUserReadGenerationHistory`: `GET /api/app/v1/user/history/generation` | success `UserGenerationHistoryEntryListEnvelope` | List current user generation history records
- `appUserListSessions`: `GET /api/app/v1/user/sessions` | success `UserSecuritySessionListEnvelope` | List the current user security sessions
- `appUserRevokeSession`: `DELETE /api/app/v1/user/sessions/:sessionId` | success `MagicStudioOperationOkResultEnvelope` | Revoke a current user security session
- `appUserListDevices`: `GET /api/app/v1/user/devices` | success `UserTrustedDeviceListEnvelope` | List the current user trusted devices
- `appUserRevokeDevice`: `DELETE /api/app/v1/user/devices/:deviceId` | success `MagicStudioOperationOkResultEnvelope` | Revoke a current user trusted device
- `appUserReadTwoFactorStatus`: `GET /api/app/v1/user/two-factor` | success `UserTwoFactorStatusEnvelope` | Read the current user two-factor status
- `appUserSetupTwoFactor`: `POST /api/app/v1/user/two-factor/setup` | request `MagicStudioUserTwoFactorSetupRequest` | success `UserTwoFactorSetupEnvelope` | Start current user TOTP two-factor setup
- `appUserVerifyTwoFactor`: `POST /api/app/v1/user/two-factor/verify` | request `MagicStudioUserTwoFactorVerifyRequest` | success `UserTwoFactorStatusEnvelope` | Verify and enable current user TOTP two-factor setup
- `appUserDisableTwoFactor`: `DELETE /api/app/v1/user/two-factor` | success `UserTwoFactorStatusEnvelope` | Disable current user two-factor authentication
- `appUserListBindings`: `GET /api/app/v1/user/bindings` | success `UserBindingListEnvelope` | List current user account bindings
- `appUserBindEmail`: `POST /api/app/v1/user/bind/email` | request `MagicStudioUserBindEmailRequest` | success `UserProfileEnvelope` | Bind an email to the current user
- `appUserUnbindEmail`: `DELETE /api/app/v1/user/bind/email` | success `UserProfileEnvelope` | Unbind the current user email
- `appUserBindPhone`: `POST /api/app/v1/user/bind/phone` | request `MagicStudioUserBindPhoneRequest` | success `UserProfileEnvelope` | Bind a phone number to the current user
- `appUserUnbindPhone`: `DELETE /api/app/v1/user/bind/phone` | success `UserProfileEnvelope` | Unbind the current user phone number
- `appUserBindThirdParty`: `POST /api/app/v1/user/bind/:platform` | request `MagicStudioUserThirdPartyBindRequest` | success `UserBindingEnvelope` | Bind a third-party account to the current user
- `appUserUnbindThirdParty`: `DELETE /api/app/v1/user/bind/:platform` | success `MagicStudioOperationOkResultEnvelope` | Unbind a third-party account from the current user

### `vip` (5 routes)

- `appVipPlansList`: `GET /api/app/v1/vip/plans` | success `MagicStudioVipPlanListEnvelope` | List canonical VIP plans
- `appVipReadStatus`: `GET /api/app/v1/vip/status` | success `MagicStudioVipStatusEnvelope` | Read canonical VIP status for the current user
- `appVipPurchase`: `POST /api/app/v1/vip/purchase` | request `MagicStudioVipPurchaseRequest` | success `MagicStudioVipPurchaseResultEnvelope` | Purchase or extend a canonical VIP subscription
- `appVipSubscriptionsList`: `GET /api/app/v1/vip/subscriptions` | success `MagicStudioVipSubscriptionListEnvelope` | List canonical VIP subscriptions for the current user
- `appVipSubscriptionsCancel`: `POST /api/app/v1/vip/subscriptions/:subscriptionId/cancel` | request `MagicStudioVipSubscriptionCancelRequest` | success `MagicStudioVipSubscriptionEnvelope` | Cancel a canonical VIP subscription

### `voices` (20 routes)

- `appVoicesListMarket`: `GET /api/app/v1/voices/market` | success `MagicStudioVoiceSpeakerListEnvelope` | List market voice speakers
- `appVoicesListWorkspace`: `GET /api/app/v1/voices/workspace` | success `MagicStudioVoiceSpeakerListEnvelope` | List workspace voice speakers
- `appVoicesListCustom`: `GET /api/app/v1/voices/custom` | success `MagicStudioVoiceSpeakerListEnvelope` | List custom voice speakers
- `appVoicesCreateCustom`: `POST /api/app/v1/voices/custom` | request `MagicStudioCustomVoiceCreateRequest` | success `MagicStudioVoiceSpeakerEnvelope` | Create a custom voice speaker
- `appVoicesUpdateCustom`: `PATCH /api/app/v1/voices/custom/:speakerId` | request `MagicStudioCustomVoiceUpdateRequest` | success `MagicStudioVoiceSpeakerEnvelope` | Update a custom voice speaker
- `appVoicesDeleteCustom`: `DELETE /api/app/v1/voices/custom/:speakerId` | success `MagicStudioOperationOkResultEnvelope` | Delete a custom voice speaker
- `appVoicesReadSpeaker`: `GET /api/app/v1/voices/:speakerId` | success `MagicStudioVoiceSpeakerEnvelope` | Read a voice speaker
- `appVoicesListCloneTasks`: `GET /api/app/v1/voices/clone-tasks` | success `MagicStudioVoiceCloneTaskListEnvelope` | List voice clone tasks
- `appVoicesCreateCloneTask`: `POST /api/app/v1/voices/clone-tasks` | request `MagicStudioVoiceCloneTaskCreateRequest` | success `MagicStudioVoiceCloneTaskEnvelope` | Create a voice clone task
- `appVoicesReadCloneTask`: `GET /api/app/v1/voices/clone-tasks/:taskId` | success `MagicStudioVoiceCloneTaskEnvelope` | Read a voice clone task
- `appVoicesDeleteCloneTask`: `DELETE /api/app/v1/voices/clone-tasks/:taskId` | success `MagicStudioOperationOkResultEnvelope` | Delete a voice clone task
- `appVoicesCancelCloneTask`: `POST /api/app/v1/voices/clone-tasks/:taskId/cancel` | success `MagicStudioVoiceCloneTaskEnvelope` | Cancel a voice clone task
- `appVoicesUpdatePreview`: `POST /api/app/v1/voices/:speakerId/preview` | request `MagicStudioVoicePreviewRequest` | success `MagicStudioVoiceSpeakerEnvelope` | Update a voice speaker preview
- `appVoicesListSpeechTasks`: `GET /api/app/v1/voices/speech/tasks` | success `MagicStudioGenerationTaskListEnvelope` | List voice speech tasks
- `appVoicesCreateSpeechTask`: `POST /api/app/v1/voices/speech/tasks` | request `MagicStudioVoiceSpeechTaskCreateRequest` | success `MagicStudioGenerationTaskEnvelope` | Create a voice speech task
- `appVoicesReadSpeechTask`: `GET /api/app/v1/voices/speech/tasks/:taskId` | success `MagicStudioGenerationTaskEnvelope` | Read a voice speech task
- `appVoicesUpdateSpeechTask`: `PATCH /api/app/v1/voices/speech/tasks/:taskId` | request `MagicStudioVoiceSpeechTaskUpdateRequest` | success `MagicStudioGenerationTaskEnvelope` | Update a voice speech task
- `appVoicesUpsertSpeechTask`: `PUT /api/app/v1/voices/speech/tasks/:taskId` | request `MagicStudioVoiceSpeechTaskUpsertRequest` | success `MagicStudioGenerationTaskEnvelope` | Upsert a voice speech task
- `appVoicesDeleteSpeechTask`: `DELETE /api/app/v1/voices/speech/tasks/:taskId` | success `MagicStudioOperationOkResultEnvelope` | Delete a voice speech task
- `appVoicesCancelSpeechTask`: `POST /api/app/v1/voices/speech/tasks/:taskId/cancel` | success `MagicStudioGenerationTaskEnvelope` | Cancel a voice speech task

### `workspaces` (37 routes)

- `appWorkspacesList`: `GET /api/app/v1/workspaces` | success `StudioWorkspaceListEnvelope` | List workspaces
- `appWorkspacesCreate`: `POST /api/app/v1/workspaces` | request `MagicStudioWorkspaceCreateRequest` | success `StudioWorkspaceEnvelope` | Create a workspace
- `appWorkspacesRead`: `GET /api/app/v1/workspaces/:workspaceId` | success `StudioWorkspaceEnvelope` | Read a workspace
- `appWorkspacesUpdate`: `PATCH /api/app/v1/workspaces/:workspaceId` | request `MagicStudioWorkspaceUpdateRequest` | success `StudioWorkspaceEnvelope` | Update a workspace
- `appWorkspacesDelete`: `DELETE /api/app/v1/workspaces/:workspaceId` | success `MagicStudioOperationOkResultEnvelope` | Delete a workspace
- `appWorkspaceProjectsListRecent`: `GET /api/app/v1/workspaces/recent-projects` | success `StudioProjectListEnvelope` | List recent workspace projects
- `appWorkspaceProjectsList`: `GET /api/app/v1/workspaces/:workspaceId/projects` | success `StudioProjectListEnvelope` | List workspace projects
- `appWorkspaceProjectsCreate`: `POST /api/app/v1/workspaces/:workspaceId/projects` | request `MagicStudioProjectCreateRequest` | success `StudioProjectEnvelope` | Create a workspace project
- `appWorkspaceProjectsRead`: `GET /api/app/v1/workspaces/:workspaceId/projects/:projectId` | success `StudioProjectEnvelope` | Read a workspace project
- `appWorkspaceProjectsOpen`: `POST /api/app/v1/workspaces/:workspaceId/projects/:projectId/open` | success `StudioProjectEnvelope` | Mark a workspace project as opened
- `appWorkspaceProjectsDuplicate`: `POST /api/app/v1/workspaces/:workspaceId/projects/:projectId/duplicate` | success `StudioProjectEnvelope` | Duplicate a workspace project
- `appWorkspaceProjectsArchive`: `POST /api/app/v1/workspaces/:workspaceId/projects/:projectId/archive` | success `StudioProjectEnvelope` | Archive a workspace project
- `appWorkspaceProjectsRestore`: `POST /api/app/v1/workspaces/:workspaceId/projects/:projectId/restore` | success `StudioProjectEnvelope` | Restore an archived workspace project
- `appWorkspaceProjectsReadSession`: `GET /api/app/v1/workspaces/:workspaceId/projects/:projectId/session` | success `StudioProjectSessionSnapshotEnvelope` | Read a workspace project session
- `appWorkspaceProjectsUpsertSession`: `PUT /api/app/v1/workspaces/:workspaceId/projects/:projectId/session` | request `MagicStudioProjectSessionUpsertRequest` | success `StudioProjectSessionEnvelope` | Upsert a workspace project session
- `appWorkspaceProjectsDeleteSession`: `DELETE /api/app/v1/workspaces/:workspaceId/projects/:projectId/session` | success `MagicStudioOperationOkResultEnvelope` | Delete a workspace project session
- `appWorkspaceProjectsGitSync`: `POST /api/app/v1/workspaces/:workspaceId/projects/:projectId/git-sync` | request `MagicStudioProjectGitSyncRequest` | success `StudioProjectGitSyncEnvelope` | Synchronize a workspace project to a git remote
- `appWorkspaceProjectsListGitSyncs`: `GET /api/app/v1/workspaces/:workspaceId/projects/:projectId/git-syncs` | success `StudioProjectGitSyncListEnvelope` | List workspace project git sync records
- `appWorkspaceProjectsReadLatestGitSync`: `GET /api/app/v1/workspaces/:workspaceId/projects/:projectId/git-syncs/latest` | success `StudioProjectGitSyncEnvelope` | Read the latest workspace project git sync record
- `appWorkspaceProjectsReadGitSync`: `GET /api/app/v1/workspaces/:workspaceId/projects/:projectId/git-syncs/:syncId` | success `StudioProjectGitSyncEnvelope` | Read a workspace project git sync record
- `appWorkspaceProjectsRetryGitSync`: `POST /api/app/v1/workspaces/:workspaceId/projects/:projectId/git-syncs/:syncId/retry` | request `MagicStudioProjectGitSyncRetryRequest` | success `StudioProjectGitSyncEnvelope` | Retry a workspace project git sync from a canonical sync record
- `appWorkspaceProjectsListReleases`: `GET /api/app/v1/workspaces/:workspaceId/projects/:projectId/releases` | success `StudioProjectReleaseListEnvelope` | List workspace project releases
- `appWorkspaceProjectsReadReleaseStats`: `GET /api/app/v1/workspaces/:workspaceId/projects/:projectId/releases/stats` | success `StudioProjectReleaseStatsEnvelope` | Read workspace project release retention statistics
- `appWorkspaceProjectsPruneReleases`: `POST /api/app/v1/workspaces/:workspaceId/projects/:projectId/releases/prune` | request `MagicStudioProjectReleasePruneRequest` | success `StudioProjectReleasePruneResultEnvelope` | Permanently prune soft-deleted workspace project releases
- `appWorkspaceProjectsReadReleaseRetentionPolicy`: `GET /api/app/v1/workspaces/:workspaceId/projects/:projectId/releases/retention-policy` | success `StudioProjectReleaseRetentionPolicyEnvelope` | Read workspace project release retention policy
- `appWorkspaceProjectsUpdateReleaseRetentionPolicy`: `PUT /api/app/v1/workspaces/:workspaceId/projects/:projectId/releases/retention-policy` | request `MagicStudioProjectReleaseRetentionPolicyRequest` | success `StudioProjectReleaseRetentionPolicyEnvelope` | Replace workspace project release retention policy
- `appWorkspaceProjectsApplyReleaseRetentionPolicy`: `POST /api/app/v1/workspaces/:workspaceId/projects/:projectId/releases/retention-policy/apply` | request `MagicStudioProjectReleaseRetentionPolicyApplyRequest` | success `StudioProjectReleaseRetentionPolicyApplyResultEnvelope` | Apply workspace project release retention policy
- `appWorkspaceProjectsCreateRelease`: `POST /api/app/v1/workspaces/:workspaceId/projects/:projectId/releases` | request `MagicStudioProjectReleaseCreateRequest` | success `StudioProjectReleaseEnvelope` | Create a workspace project release
- `appWorkspaceProjectsReadLatestRelease`: `GET /api/app/v1/workspaces/:workspaceId/projects/:projectId/releases/latest` | success `StudioProjectReleaseEnvelope` | Read the latest workspace project release
- `appWorkspaceProjectsReadRelease`: `GET /api/app/v1/workspaces/:workspaceId/projects/:projectId/releases/:releaseId` | success `StudioProjectReleaseEnvelope` | Read a workspace project release
- `appWorkspaceProjectsDeleteRelease`: `DELETE /api/app/v1/workspaces/:workspaceId/projects/:projectId/releases/:releaseId` | success `StudioProjectReleaseEnvelope` | Soft delete a workspace project release
- `appWorkspaceProjectsRestoreRelease`: `POST /api/app/v1/workspaces/:workspaceId/projects/:projectId/releases/:releaseId/restore` | success `StudioProjectReleaseEnvelope` | Restore a soft-deleted workspace project release
- `appWorkspaceProjectsReadReleaseManifest`: `GET /api/app/v1/workspaces/:workspaceId/projects/:projectId/releases/:releaseId/manifest` | success `StudioProjectReleaseManifestEnvelope` | Read a workspace project release manifest
- `appWorkspaceProjectsReadReleaseArtifact`: `GET /api/app/v1/workspaces/:workspaceId/projects/:projectId/releases/:releaseId/artifact` | success `undefined` | Download a workspace project release artifact
- `appWorkspaceProjectsRebuildRelease`: `POST /api/app/v1/workspaces/:workspaceId/projects/:projectId/releases/:releaseId/rebuild` | success `StudioProjectReleaseEnvelope` | Rebuild a workspace project release from its canonical release configuration
- `appWorkspaceProjectsUpdate`: `PATCH /api/app/v1/workspaces/:workspaceId/projects/:projectId` | request `MagicStudioProjectUpdateRequest` | success `StudioProjectEnvelope` | Update a workspace project
- `appWorkspaceProjectsDelete`: `DELETE /api/app/v1/workspaces/:workspaceId/projects/:projectId` | success `MagicStudioOperationOkResultEnvelope` | Delete a workspace project

## Admin Routes

### `deployments` (1 route)

- `adminDeploymentsList`: `GET /api/admin/v1/deployments` | success `MagicStudioServerDeploymentRecordListEnvelope` | List deployment records

### `governance` (15 routes)

- `adminExecutionProvidersList`: `GET /api/admin/v1/governance/execution/providers` | success `MagicStudioAdminExecutionProviderListEnvelope` | List execution providers
- `adminExecutionProvidersRead`: `GET /api/admin/v1/governance/execution/providers/:providerKey` | success `MagicStudioAdminExecutionProviderDetailEnvelope` | Read execution provider governance detail
- `adminExecutionProvidersReconcile`: `POST /api/admin/v1/governance/execution/providers/:providerKey/reconcile` | request `MagicStudioAdminExecutionProviderReconcileRequest` | success `MagicStudioAdminExecutionProviderDetailEnvelope` | Reconcile execution provider governance state
- `adminExecutionProvidersReadHealth`: `GET /api/admin/v1/governance/execution/providers/health` | success `MagicStudioAdminExecutionProviderHealthListEnvelope` | List execution provider health records
- `adminExecutionFailuresList`: `GET /api/admin/v1/governance/execution/failures` | success `MagicStudioAdminExecutionFailureListEnvelope` | List execution failures
- `adminExecutionFailuresAcknowledge`: `POST /api/admin/v1/governance/execution/failures/:failureId/acknowledge` | request `MagicStudioAdminExecutionFailureAcknowledgeRequest` | success `MagicStudioAdminExecutionFailureEnvelope` | Acknowledge execution failure
- `adminExecutionFailuresRetry`: `POST /api/admin/v1/governance/execution/failures/:failureId/retry` | request `MagicStudioAdminExecutionFailureRetryRequest` | success `MagicStudioAdminExecutionFailureRetryResultEnvelope` | Retry execution failure governance evaluation
- `adminWorkspaceReleaseRetentionRunsList`: `GET /api/admin/v1/governance/workspace-release-retention/runs` | success `MagicStudioAdminWorkspaceReleaseRetentionRunListEnvelope` | List workspace release retention runs
- `adminWorkspaceReleaseRetentionRunsCreate`: `POST /api/admin/v1/governance/workspace-release-retention/runs` | request `MagicStudioAdminWorkspaceReleaseRetentionRunRequest` | success `MagicStudioAdminWorkspaceReleaseRetentionRunDetailEnvelope` | Create a workspace release retention run
- `adminWorkspaceReleaseRetentionRunsRead`: `GET /api/admin/v1/governance/workspace-release-retention/runs/:runId` | success `MagicStudioAdminWorkspaceReleaseRetentionRunDetailEnvelope` | Read workspace release retention run detail
- `adminWorkspaceReleaseRetentionSchedulesList`: `GET /api/admin/v1/governance/workspace-release-retention/schedules` | success `MagicStudioAdminWorkspaceReleaseRetentionScheduleListEnvelope` | List workspace release retention schedules
- `adminWorkspaceReleaseRetentionSchedulesCreate`: `POST /api/admin/v1/governance/workspace-release-retention/schedules` | request `MagicStudioAdminWorkspaceReleaseRetentionScheduleCreateRequest` | success `MagicStudioAdminWorkspaceReleaseRetentionScheduleEnvelope` | Create a workspace release retention schedule
- `adminWorkspaceReleaseRetentionSchedulesRead`: `GET /api/admin/v1/governance/workspace-release-retention/schedules/:scheduleId` | success `MagicStudioAdminWorkspaceReleaseRetentionScheduleEnvelope` | Read workspace release retention schedule
- `adminWorkspaceReleaseRetentionSchedulesUpdate`: `PATCH /api/admin/v1/governance/workspace-release-retention/schedules/:scheduleId` | request `MagicStudioAdminWorkspaceReleaseRetentionScheduleUpdateRequest` | success `MagicStudioAdminWorkspaceReleaseRetentionScheduleEnvelope` | Update workspace release retention schedule
- `adminWorkspaceReleaseRetentionSchedulesTrigger`: `POST /api/admin/v1/governance/workspace-release-retention/schedules/:scheduleId/trigger` | request `MagicStudioAdminWorkspaceReleaseRetentionScheduleTriggerRequest` | success `MagicStudioAdminWorkspaceReleaseRetentionScheduleTriggerResultEnvelope` | Trigger workspace release retention schedule

### `jobs` (1 route)

- `adminJobsMetricsRead`: `GET /api/admin/v1/jobs/metrics` | success `MagicStudioAdminJobMetricsEnvelope` | Read job metrics

### `plugins` (3 routes)

- `adminPluginsList`: `GET /api/admin/v1/plugins` | success `MagicStudioAdminPluginRecordListEnvelope` | List plugin governance records
- `adminPluginsEnable`: `POST /api/admin/v1/plugins/:pluginId/enable` | success `MagicStudioAdminPluginRecordEnvelope` | Enable a plugin
- `adminPluginsDisable`: `POST /api/admin/v1/plugins/:pluginId/disable` | success `MagicStudioAdminPluginRecordEnvelope` | Disable a plugin

### `policy` (1 route)

- `adminPolicyAuditsRead`: `GET /api/admin/v1/policy/audits` | success `MagicStudioAdminPolicyAuditEnvelope` | Read policy audit

### `runtime` (1 route)

- `adminRuntimeAuditsRead`: `GET /api/admin/v1/runtime/audits` | success `MagicStudioAdminRuntimeAuditEnvelope` | Read runtime audit

### `storage` (1 route)

- `adminStorageProvidersList`: `GET /api/admin/v1/storage/providers` | success `MagicStudioAdminStorageProviderListEnvelope` | List storage providers

