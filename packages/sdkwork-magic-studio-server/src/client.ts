import type {
  AssetCenterStats,
  UnifiedDigitalAsset,
} from '@sdkwork/magic-studio-types/asset-center';
import type {
  AuthQrCodePayload,
  AuthQrCodeStatusResult,
  AuthSession,
  AuthSessionState,
  AuthVerificationCodeCheckResult,
} from '@sdkwork/magic-studio-types/auth';
import type {
  ChatSession,
  ChatTranscript,
} from '@sdkwork/magic-studio-types/chat';
import type {
  UserAddress,
  UserBinding,
  UserGenerationHistoryEntry,
  UserLoginHistoryEntry,
  UserProfile,
  UserSecuritySession,
  UserSettings,
  UserTrustedDevice,
  UserTwoFactorSetup,
  UserTwoFactorStatus,
} from '@sdkwork/magic-studio-types/user';
import type { AssetCategory } from '@sdkwork/magic-studio-types/assets';
import type {
  DriveFileContent,
  DriveItem,
  DriveRootDescriptor,
  DriveStats,
} from '@sdkwork/magic-studio-types/drive';
import type {
  Note,
  NoteFolder,
  NoteSummary,
  NoteWorkspaceSnapshot,
  PublishResult,
} from '@sdkwork/magic-studio-types/notes';
import type { Presentation } from '@sdkwork/magic-studio-types/chatppt';
import type {
  CutProject,
  CutTemplate,
} from '@sdkwork/magic-studio-types/magiccut';
import type {
  FilmCharacter,
  FilmProject,
  FilmProp,
  FilmScriptAnalysisResult,
  FilmTemplate,
} from '@sdkwork/magic-studio-types/film';
import type { ProjectGraphDocument } from '@sdkwork/magic-studio-types/project-graph';
import type {
  MagicStudioApiEnvelope,
  MagicStudioApiListEnvelope,
  MagicStudioApiProblemEnvelope,
  MagicStudioAdminExecutionFailure,
  MagicStudioAdminExecutionFailureAcknowledgeRequest,
  MagicStudioAdminExecutionFailureRetryRequest,
  MagicStudioAdminExecutionFailureRetryResult,
  MagicStudioAdminExecutionProvider,
  MagicStudioAdminExecutionProviderDetail,
  MagicStudioAdminExecutionProviderHealth,
  MagicStudioAdminExecutionProviderReconcileRequest,
  MagicStudioAdminJobMetrics,
  MagicStudioAdminPluginRecord,
  MagicStudioAdminPolicyAudit,
  MagicStudioAdminRuntimeAudit,
  MagicStudioAdminStorageProvider,
  MagicStudioAdminWorkspaceReleaseRetentionRun,
  MagicStudioAdminWorkspaceReleaseRetentionRunDetail,
  MagicStudioAdminWorkspaceReleaseRetentionRunRequest,
  MagicStudioAdminWorkspaceReleaseRetentionSchedule,
  MagicStudioAdminWorkspaceReleaseRetentionScheduleCreateRequest,
  MagicStudioAdminWorkspaceReleaseRetentionScheduleTriggerRequest,
  MagicStudioAdminWorkspaceReleaseRetentionScheduleTriggerResult,
  MagicStudioAdminWorkspaceReleaseRetentionScheduleUpdateRequest,
  MagicStudioAppCapabilityDomain,
  MagicStudioAppCapabilitySummary,
  MagicStudioAppExecutionCapability,
  MagicStudioAssetImportFileRequest,
  MagicStudioAssetImportUrlRequest,
  MagicStudioAssetListQuery,
  MagicStudioAssetStatsQuery,
  MagicStudioAssetUpsertRequest,
  MagicStudioAssetUpdateRequest,
  MagicStudioAuthCheckVerifyCodeRequest,
  MagicStudioAuthLoginRequest,
  MagicStudioAuthPasswordResetConfirmRequest,
  MagicStudioAuthPasswordResetRequest,
  MagicStudioAuthPhoneLoginRequest,
  MagicStudioAuthRefreshTokenRequest,
  MagicStudioAuthRegisterRequest,
  MagicStudioAuthSendVerifyCodeRequest,
  MagicStudioAppSettingsDocument,
  MagicStudioAppSettingsUpdateRequest,
  MagicStudioApiRouteCatalogEntry,
  MagicStudioCompressionUnzipRequest,
  MagicStudioCompressionZipRequest,
  MagicStudioCompressionZipResult,
  MagicStudioApplyCreationTemplateRequest,
  MagicStudioCreationBatch,
  MagicStudioCreationBatchListQuery,
  MagicStudioCreationBatchMaterialization,
  MagicStudioCreationCapabilities,
  MagicStudioCreationCapabilitiesQuery,
  MagicStudioCreationPreset,
  MagicStudioCreationPresetListQuery,
  MagicStudioCreationTemplate,
  MagicStudioCreationTemplateListQuery,
  MagicStudioGenerationCatalogModel,
  MagicStudioGenerationCatalogProvider,
  MagicStudioGenerationCatalogQuery,
  MagicStudioGenerationCatalogStyle,
  MagicStudioGenerationCatalogVoice,
  MagicStudioGenerationCatalogVoiceQuery,
  MagicStudioCreationHistoryEntry,
  MagicStudioCreationHistoryFavoriteRequest,
  MagicStudioCreationHistoryListQuery,
  MagicStudioCreateCreationBatchRequest,
  MagicStudioCreateCreationPresetRequest,
  MagicStudioCreateCreationTemplateRequest,
  MagicStudioCreateCreationSessionRequest,
  MagicStudioChatSessionCreateRequest,
  MagicStudioChatSessionsListQuery,
  MagicStudioChatSessionUpdateRequest,
  MagicStudioChatTranscriptUpdateRequest,
  MagicStudioCreationSession,
  MagicStudioCreationSessionQuery,
  MagicStudioCreationSessionSnapshot,
  MagicStudioMaterializeCreationBatchRequest,
  MagicStudioUpdateCreationBatchItemStatusRequest,
  MagicStudioUpdateCreationBatchRequest,
  MagicStudioUpdateCreationPresetRequest,
  MagicStudioUpdateCreationTemplateRequest,
  MagicStudioUpsertCreationHistoryEntryRequest,
  MagicStudioFileSystemBytesPayload,
  MagicStudioFileSystemCopyFileRequest,
  MagicStudioFileSystemEntry,
  MagicStudioFileSystemExistsResult,
  MagicStudioFileSystemPathRequest,
  MagicStudioFileSystemRenameRequest,
  MagicStudioFileSystemStat,
  MagicStudioFileSystemTextPayload,
  MagicStudioFileSystemWriteBytesRequest,
  MagicStudioFileSystemWriteTextRequest,
  MagicStudioHostDescriptor,
  MagicStudioDriveCreateFolderRequest,
  MagicStudioDriveDeleteRequest,
  MagicStudioDriveEntriesQuery,
  MagicStudioDriveFavoriteRequest,
  MagicStudioDriveImportFileRequest,
  MagicStudioDriveMoveRequest,
  MagicStudioDriveRenameRequest,
  MagicStudioDriveRestoreRequest,
  MagicStudioDriveUpdateFileContentRequest,
  MagicStudioDriveUploadFileRequest,
  MagicStudioFilmAssetBindRequest,
  MagicStudioFilmAssetInventoryResult,
  MagicStudioFilmAnalysisRequest,
  MagicStudioFilmAuthoringBatchRequest,
  MagicStudioFilmAuthoringBatchResult,
  MagicStudioFilmAssetRelinkRequest,
  MagicStudioFilmAssetRelinkResult,
  MagicStudioFilmExportPackage,
  MagicStudioFilmExportPackageRequest,
  MagicStudioFilmImportPackage,
  MagicStudioFilmImportPackageRequest,
  MagicStudioFilmProjectReviewDependencyGraphResult,
  MagicStudioFilmProjectReviewInterventionPlanResult,
  MagicStudioFilmProjectReviewApprovalBurnDownResult,
  MagicStudioFilmProjectReviewEffectivenessBaselineResult,
  MagicStudioFilmProjectReviewInterventionExecutionHistoryResult,
  MagicStudioFilmProjectReviewInterventionOutcomesResult,
  MagicStudioFilmProjectReviewRecoveryOrchestrationResult,
  MagicStudioFilmPublishApproveRequest,
  MagicStudioFilmPublishApproveResult,
  MagicStudioFilmPublishArtifactContent,
  MagicStudioFilmPublishListQuery,
  MagicStudioFilmProjectReviewDecisionFreshnessResult,
  MagicStudioFilmProjectReviewEscalationForecastResult,
  MagicStudioFilmProjectReviewGovernanceDriftResult,
  MagicStudioFilmProjectReviewPortfolioDashboardResult,
  MagicStudioFilmProjectReviewQueueItem,
  MagicStudioFilmProjectReviewReviewerCapacityResult,
  MagicStudioFilmPublishRecord,
  MagicStudioFilmPublishRequestChangesRequest,
  MagicStudioFilmPublishRequestChangesResult,
  MagicStudioFilmPublishReviewAssignmentsRequest,
  MagicStudioFilmPublishReviewAssignmentsResult,
  MagicStudioFilmPublishReviewCommentRequest,
  MagicStudioFilmPublishReviewConsensusRequest,
  MagicStudioFilmPublishReviewConsensusResult,
  MagicStudioFilmPublishReviewCommentResolveRequest,
  MagicStudioFilmPublishReviewCommentResolveResult,
  MagicStudioFilmPublishReviewCommentResult,
  MagicStudioFilmPublishReviewActivityResult,
  MagicStudioFilmPublishReviewAnchorResponsibilityResult,
  MagicStudioFilmPublishReviewAnchorsResult,
  MagicStudioFilmPublishReviewDecisionMatrixResult,
  MagicStudioFilmPublishReviewLatencyAnalyticsResult,
  MagicStudioFilmPublishReviewOperationsDashboardResult,
  MagicStudioFilmPublishReviewReadinessResult,
  MagicStudioFilmPublishReviewReviewerBacklogResult,
  MagicStudioFilmPublishReviewReviewerAttentionResult,
  MagicStudioFilmPublishReviewReviewerCoverageResult,
  MagicStudioFilmPublishReviewStaleDecisionResult,
  MagicStudioFilmPublishReviewSubmitRequest,
  MagicStudioFilmPublishReviewSubmitResult,
  MagicStudioFilmPublishReviewTimelineResult,
  MagicStudioFilmPublishReviewWorklistResult,
  MagicStudioFilmPublishReviewRoundsResult,
  MagicStudioFilmPublishReopenRequest,
  MagicStudioFilmPublishReopenResult,
  MagicStudioFilmPublishReviewState,
  MagicStudioFilmPublishRestoreRequest,
  MagicStudioFilmPublishRestoreResult,
  MagicStudioFilmCreateSceneBreakdownRequest,
  MagicStudioFilmCreateSceneBreakdownResult,
  MagicStudioFilmCreateShootingPlanRequest,
  MagicStudioFilmCreateShootingPlanResult,
  MagicStudioFilmGenerateShotVariantsRequest,
  MagicStudioFilmGenerateShotVariantsResult,
  MagicStudioFilmPrepareAnalysisRequest,
  MagicStudioFilmPrepareAnalysisResult,
  MagicStudioFilmPreset,
  MagicStudioFilmPresetApplyRequest,
  MagicStudioFilmPresetWriteRequest,
  MagicStudioFilmProjectCreateRequest,
  MagicStudioFilmProjectListQuery,
  MagicStudioFilmReviewQueueQuery,
  MagicStudioFilmTemplateInstantiateRequest,
  MagicStudioFilmTemplateListQuery,
  MagicStudioFilmTemplateSnapshotRequest,
  MagicStudioFilmTemplateWriteRequest,
  MagicStudioFilmRefreshAnalysisRequest,
  MagicStudioFilmRefreshAnalysisResult,
  MagicStudioFilmRebuildStoryboardRequest,
  MagicStudioFilmRebuildStoryboardResult,
  MagicStudioFilmScriptStandardizeRequest,
  MagicStudioFilmScriptStandardizeResult,
  MagicStudioFilmProjectValidateRequest,
  MagicStudioFilmProjectValidation,
  MagicStudioFilmProjectUpdateRequest,
  MagicStudioFilmShotSyncRequest,
  MagicStudioFilmStoryboardGenerateRequest,
  MagicStudioFilmStoryboardPublishRequest,
  MagicStudioFilmStoryboardPublishResult,
  MagicStudioAudioGenerationRequest,
  MagicStudioCharacterGenerationRequest,
  MagicStudioGenerationPromptEnhanceRequest,
  MagicStudioGenerationPromptEnhanceResult,
  MagicStudioGenerationTask,
  MagicStudioGenerationTaskListQuery,
  MagicStudioImageEditRequest,
  MagicStudioImageGenerationRequest,
  MagicStudioImageUpscaleRequest,
  MagicStudioMusicExtendRequest,
  MagicStudioMusicGenerationRequest,
  MagicStudioMusicRemixRequest,
  MagicStudioMusicSimilarRequest,
  MagicStudioNoteCreateRequest,
  MagicStudioNoteFolderCreateRequest,
  MagicStudioNoteFolderMoveRequest,
  MagicStudioNoteFolderRenameRequest,
  MagicStudioNoteMoveRequest,
  MagicStudioNotePublishRequest,
  MagicStudioNotesListQuery,
  MagicStudioNoteUpdateRequest,
  MagicStudioPresentationCreateRequest,
  MagicStudioPresentationsListQuery,
  MagicStudioPresentationSlideCreateRequest,
  MagicStudioPresentationSlideUpdateRequest,
  MagicStudioPresentationUpdateRequest,
  MagicStudioPortalDiscoverFeedQuery,
  MagicStudioPortalFeed,
  MagicStudioPortalFeedCreateRequest,
  MagicStudioPortalFeaturedFeedQuery,
  MagicStudioTradeOrder,
  MagicStudioTradeOrderCancelRequest,
  MagicStudioTradeOrderCreateRequest,
  MagicStudioTradeOrderListQuery,
  MagicStudioTradeOrderStatistics,
  MagicStudioTradeOrderStatusUpdateRequest,
  MagicStudioTradeMarketplaceTask,
  MagicStudioTradePayment,
  MagicStudioTradePaymentActionResult,
  MagicStudioTradePaymentCreateRequest,
  MagicStudioTradePaymentListQuery,
  MagicStudioTradePaymentRechargeRequest,
  MagicStudioTradePaymentRefundRequest,
  MagicStudioTradeTaskAcceptRequest,
  MagicStudioTradeTaskApproveRequest,
  MagicStudioTradeTaskListQuery,
  MagicStudioTradeTaskSubmitRequest,
  MagicStudioTradeTransaction,
  MagicStudioTradeTransactionListQuery,
  MagicStudioTradeWallet,
  MagicStudioVipPlan,
  MagicStudioVipPurchaseRequest,
  MagicStudioVipPurchaseResult,
  MagicStudioVipStatus,
  MagicStudioVipSubscription,
  MagicStudioVipSubscriptionCancelRequest,
  MagicStudioVipSubscriptionListQuery,
  MagicStudioMediaAudioConvertRequest,
  MagicStudioMediaAudioMixInput,
  MagicStudioMediaAudioMixRequest,
  MagicStudioMediaAudioNormalizeRequest,
  MagicStudioMediaImageResizeRequest,
  MagicStudioMediaProbeRequest,
  MagicStudioMediaProbeResult,
  MagicStudioMediaVideoConcatRequest,
  MagicStudioMediaVideoExtractAudioRequest,
  MagicStudioMediaVideoThumbnailRequest,
  MagicStudioMediaVideoTranscodeRequest,
  MagicStudioMediaVideoTrimRequest,
  MagicStudioMagicCutProjectDuplicateRequest,
  MagicStudioMagicCutProjectListQuery,
  MagicStudioMagicCutProjectCreateRequest,
  MagicStudioMagicCutProjectUpdateRequest,
  MagicStudioMagicCutTemplateInstantiateRequest,
  MagicStudioMagicCutTemplateListQuery,
  MagicStudioMagicCutTemplateSaveRequest,
  MagicStudioMagicCutRenderCapabilities,
  MagicStudioMagicCutRenderListQuery,
  MagicStudioMagicCutRenderCreateRequest,
  MagicStudioMagicCutRenderJob,
  MagicStudioMagicCutRenderArtifact,
  MagicStudioMagicCutRenderArtifactContent,
  MagicStudioMigrationApplyRequest,
  MagicStudioMigrationApplyResult,
  MagicStudioMigrationPlan,
  MagicStudioMigrationStatusRequest,
  MagicStudioMigrationStatus,
  MagicStudioNotificationBatchDeleteRequest,
  MagicStudioNotificationCreateRequest,
  MagicStudioNotificationRecord,
  MagicStudioNotificationUnreadCount,
  MagicStudioOperationOkResult,
  MagicStudioProjectCreateRequest,
  MagicStudioProjectGitSyncRequest,
  MagicStudioProjectGitSyncRetryRequest,
  MagicStudioProjectReleaseCreateRequest,
  MagicStudioProjectReleasePruneRequest,
  MagicStudioProjectReleaseRetentionPolicyApplyRequest,
  MagicStudioProjectReleaseRetentionPolicyRequest,
  MagicStudioProjectSessionUpsertRequest,
  MagicStudioProjectUpdateRequest,
  MagicStudioPolicyCommandValidationRequest,
  MagicStudioPolicyPathValidationRequest,
  MagicStudioPolicySnapshot,
  MagicStudioPolicyValidationResult,
  MagicStudioPluginManifest,
  MagicStudioPromptOptimizeRequest,
  MagicStudioPromptOptimizeResult,
  MagicStudioRuntimeSummary,
  MagicStudioServerDeploymentRecord,
  MagicStudioServerHealthStatus,
  MagicStudioSfxCategory,
  MagicStudioSfxGenerationRequest,
  MagicStudioSqlExecuteBatchRequest,
  MagicStudioSqlExecuteRequest,
  MagicStudioSqlExecuteResult,
  MagicStudioSqlRow,
  MagicStudioToolkitCapabilityMatrix,
  MagicStudioToolkitCommandResult,
  MagicStudioToolkitJobKind,
  MagicStudioToolkitJobSubmission,
  MagicStudioToolkitJobSnapshot,
  MagicStudioToolkitOperation,
  MagicStudioUserAddressCreateRequest,
  MagicStudioUserAddressUpdateRequest,
  MagicStudioUserAvatarUploadRequest,
  MagicStudioUserBindEmailRequest,
  MagicStudioUserBindPhoneRequest,
  MagicStudioUserHistoryQuery,
  MagicStudioUserPasswordChangeRequest,
  MagicStudioUserProfileUpdateRequest,
  MagicStudioUserSettingsUpdateRequest,
  MagicStudioUserThirdPartyBindRequest,
  MagicStudioUserTwoFactorSetupRequest,
  MagicStudioUserTwoFactorVerifyRequest,
  MagicStudioVideoGenerationRequest,
  MagicStudioCustomVoiceCreateRequest,
  MagicStudioCustomVoiceUpdateRequest,
  MagicStudioVoiceCloneTask,
  MagicStudioVoiceCloneTaskCreateRequest,
  MagicStudioVoiceCloneTaskListQuery,
  MagicStudioVoiceListQuery,
  MagicStudioVoicePreviewRequest,
  MagicStudioVoiceSpeaker,
  MagicStudioVoiceSpeechTaskCreateRequest,
  MagicStudioVoiceSpeechTaskListQuery,
  MagicStudioVoiceSpeechTaskUpsertRequest,
  MagicStudioVoiceSpeechTaskUpdateRequest,
  MagicStudioWorkspaceCreateRequest,
  MagicStudioWorkspaceUpdateRequest,
} from '@sdkwork/magic-studio-host-types';
import type {
  StudioProjectGitSyncRecord,
  StudioProject,
  StudioProjectReleaseManifest,
  StudioProjectReleaseRetentionPolicy,
  StudioProjectReleaseRetentionPolicyApplyResult,
  StudioProjectReleasePruneResult,
  StudioProjectReleaseRecord,
  StudioProjectReleaseStats,
  StudioProjectSession,
  StudioProjectSessionSnapshot,
  StudioWorkspace,
} from '@sdkwork/magic-studio-types/workspace';

import {
  MAGIC_STUDIO_SERVER_ADMIN_EXECUTION_FAILURES_PATH,
  MAGIC_STUDIO_SERVER_ADMIN_EXECUTION_PROVIDERS_PATH,
  MAGIC_STUDIO_SERVER_ADMIN_EXECUTION_PROVIDER_HEALTH_PATH,
  MAGIC_STUDIO_SERVER_ADMIN_JOBS_METRICS_PATH,
  MAGIC_STUDIO_SERVER_ADMIN_PLUGINS_PATH,
  MAGIC_STUDIO_SERVER_ADMIN_POLICY_AUDITS_PATH,
  MAGIC_STUDIO_SERVER_ADMIN_DEPLOYMENTS_PATH,
  MAGIC_STUDIO_SERVER_ADMIN_RUNTIME_AUDITS_PATH,
  MAGIC_STUDIO_SERVER_ADMIN_STORAGE_PROVIDERS_PATH,
  MAGIC_STUDIO_SERVER_ADMIN_WORKSPACE_RELEASE_RETENTION_RUNS_PATH,
  MAGIC_STUDIO_SERVER_ADMIN_WORKSPACE_RELEASE_RETENTION_SCHEDULES_PATH,
  MAGIC_STUDIO_SERVER_APP_ASSET_CATEGORIES_PATH,
  MAGIC_STUDIO_SERVER_APP_ASSET_IMPORT_FILE_PATH,
  MAGIC_STUDIO_SERVER_APP_ASSET_IMPORT_URL_PATH,
  MAGIC_STUDIO_SERVER_APP_ASSETS_PATH,
  MAGIC_STUDIO_SERVER_APP_ASSETS_STATS_PATH,
  MAGIC_STUDIO_SERVER_APP_CAPABILITIES_DOMAINS_PATH,
  MAGIC_STUDIO_SERVER_APP_CAPABILITIES_EXECUTION_PATH,
  MAGIC_STUDIO_SERVER_APP_CAPABILITIES_SUMMARY_PATH,
  MAGIC_STUDIO_SERVER_APP_CREATION_CAPABILITIES_PATH,
  MAGIC_STUDIO_SERVER_APP_CREATION_BATCHES_PATH,
  MAGIC_STUDIO_SERVER_APP_CREATION_PRESETS_PATH,
  MAGIC_STUDIO_SERVER_APP_CREATION_TEMPLATES_PATH,
  MAGIC_STUDIO_SERVER_APP_CREATION_HISTORY_ENTRY_PATH,
  MAGIC_STUDIO_SERVER_APP_CREATION_HISTORY_FAVORITE_PATH,
  MAGIC_STUDIO_SERVER_APP_CREATION_HISTORY_PATH,
  MAGIC_STUDIO_SERVER_APP_CREATION_CONSUME_CURRENT_SESSION_PATH,
  MAGIC_STUDIO_SERVER_APP_CREATION_CURRENT_SESSION_PATH,
  MAGIC_STUDIO_SERVER_APP_CREATION_SESSIONS_PATH,
  MAGIC_STUDIO_SERVER_APP_CHAT_SESSIONS_PATH,
  MAGIC_STUDIO_SERVER_APP_CHAT_SESSION_DETAIL_PATH,
  MAGIC_STUDIO_SERVER_APP_CHAT_SESSION_TRANSCRIPT_PATH,
  MAGIC_STUDIO_SERVER_APP_AUTH_LOGIN_PATH,
  MAGIC_STUDIO_SERVER_APP_AUTH_LOGIN_PHONE_PATH,
  MAGIC_STUDIO_SERVER_APP_AUTH_LOGOUT_PATH,
  MAGIC_STUDIO_SERVER_APP_AUTH_PASSWORD_RESET_CONFIRM_PATH,
  MAGIC_STUDIO_SERVER_APP_AUTH_PASSWORD_RESET_REQUEST_PATH,
  MAGIC_STUDIO_SERVER_APP_AUTH_QR_CODE_PATH,
  MAGIC_STUDIO_SERVER_APP_AUTH_REFRESH_TOKEN_PATH,
  MAGIC_STUDIO_SERVER_APP_AUTH_REGISTER_PATH,
  MAGIC_STUDIO_SERVER_APP_AUTH_SESSION_PATH,
  MAGIC_STUDIO_SERVER_APP_AUTH_VERIFY_CODE_CHECK_PATH,
  MAGIC_STUDIO_SERVER_APP_AUTH_VERIFY_CODE_SEND_PATH,
  MAGIC_STUDIO_SERVER_APP_DRIVE_DELETE_PATH,
  MAGIC_STUDIO_SERVER_APP_DRIVE_EMPTY_TRASH_PATH,
  MAGIC_STUDIO_SERVER_APP_DRIVE_ENTRIES_PATH,
  MAGIC_STUDIO_SERVER_APP_DRIVE_FAVORITES_PATH,
  MAGIC_STUDIO_SERVER_APP_DRIVE_FILE_CONTENT_PATH,
  MAGIC_STUDIO_SERVER_APP_DRIVE_FOLDERS_PATH,
  MAGIC_STUDIO_SERVER_APP_DRIVE_IMPORT_FILE_PATH,
  MAGIC_STUDIO_SERVER_APP_FILM_ANALYSIS_CHARACTERS_PATH,
  MAGIC_STUDIO_SERVER_APP_FILM_ANALYSIS_PROPS_PATH,
  MAGIC_STUDIO_SERVER_APP_FILM_ANALYSIS_SCRIPT_PATH,
  MAGIC_STUDIO_SERVER_APP_FILM_AUTHORING_BATCH_PATH,
  MAGIC_STUDIO_SERVER_APP_FILM_APPLY_PRESET_PATH,
  MAGIC_STUDIO_SERVER_APP_FILM_IMPORT_PACKAGE_PATH,
  MAGIC_STUDIO_SERVER_APP_FILM_PUBLISH_STORYBOARD_PATH,
  MAGIC_STUDIO_SERVER_APP_FILM_PRESETS_PATH,
  MAGIC_STUDIO_SERVER_APP_FILM_PROJECTS_PATH,
  MAGIC_STUDIO_SERVER_APP_FILM_TEMPLATES_PATH,
  MAGIC_STUDIO_SERVER_APP_FILM_TEMPLATE_DETAIL_PATH,
  MAGIC_STUDIO_SERVER_APP_FILM_TEMPLATE_INSTANTIATE_PATH,
  MAGIC_STUDIO_SERVER_APP_FILM_REFRESH_ANALYSIS_PATH,
  MAGIC_STUDIO_SERVER_APP_FILM_PROJECT_ASSET_INVENTORY_PATH,
  MAGIC_STUDIO_SERVER_APP_FILM_VALIDATE_PROJECT_PATH,
  MAGIC_STUDIO_SERVER_APP_MAGICCUT_PROJECT_DUPLICATE_PATH,
  MAGIC_STUDIO_SERVER_APP_MAGICCUT_PROJECTS_PATH,
  MAGIC_STUDIO_SERVER_APP_MAGICCUT_PROJECT_DETAIL_PATH,
  MAGIC_STUDIO_SERVER_APP_MAGICCUT_RENDER_ARTIFACTS_PATH,
  MAGIC_STUDIO_SERVER_APP_MAGICCUT_RENDER_ARTIFACT_CONTENT_PATH,
  MAGIC_STUDIO_SERVER_APP_MAGICCUT_RENDER_CANCEL_PATH,
  MAGIC_STUDIO_SERVER_APP_MAGICCUT_RENDER_CAPABILITIES_PATH,
  MAGIC_STUDIO_SERVER_APP_MAGICCUT_RENDER_DETAIL_PATH,
  MAGIC_STUDIO_SERVER_APP_MAGICCUT_RENDERS_PATH,
  MAGIC_STUDIO_SERVER_APP_MAGICCUT_TEMPLATES_PATH,
  MAGIC_STUDIO_SERVER_APP_MAGICCUT_TEMPLATE_DETAIL_PATH,
  MAGIC_STUDIO_SERVER_APP_MAGICCUT_TEMPLATE_INSTANTIATE_PATH,
  MAGIC_STUDIO_SERVER_APP_DRIVE_MOVE_PATH,
  MAGIC_STUDIO_SERVER_APP_DRIVE_RENAME_PATH,
  MAGIC_STUDIO_SERVER_APP_DRIVE_RESTORE_PATH,
  MAGIC_STUDIO_SERVER_APP_DRIVE_ROOT_PATH,
  MAGIC_STUDIO_SERVER_APP_DRIVE_STATS_PATH,
  MAGIC_STUDIO_SERVER_APP_DRIVE_UPLOADS_PATH,
  MAGIC_STUDIO_SERVER_APP_GENERATION_TASK_CANCEL_PATH,
  MAGIC_STUDIO_SERVER_APP_GENERATION_TASKS_PATH,
  MAGIC_STUDIO_SERVER_APP_GENERATION_AUDIO_TASK_DETAIL_PATH,
  MAGIC_STUDIO_SERVER_APP_GENERATION_AUDIO_TEXT_TO_SPEECH_PATH,
  MAGIC_STUDIO_SERVER_APP_GENERATION_AUDIO_TRANSCRIPTIONS_PATH,
  MAGIC_STUDIO_SERVER_APP_GENERATION_AUDIO_TRANSLATIONS_PATH,
  MAGIC_STUDIO_SERVER_APP_GENERATION_CATALOG_MODELS_PATH,
  MAGIC_STUDIO_SERVER_APP_GENERATION_CATALOG_PROVIDERS_PATH,
  MAGIC_STUDIO_SERVER_APP_GENERATION_CATALOG_STYLES_PATH,
  MAGIC_STUDIO_SERVER_APP_GENERATION_CATALOG_VOICES_PATH,
  MAGIC_STUDIO_SERVER_APP_GENERATION_CHARACTER_TASK_CANCEL_PATH,
  MAGIC_STUDIO_SERVER_APP_GENERATION_CHARACTER_TASK_DETAIL_PATH,
  MAGIC_STUDIO_SERVER_APP_GENERATION_CHARACTER_TASKS_PATH,
  MAGIC_STUDIO_SERVER_APP_GENERATION_IMAGE_EDITS_PATH,
  MAGIC_STUDIO_SERVER_APP_GENERATION_IMAGE_PROMPT_ENHANCE_PATH,
  MAGIC_STUDIO_SERVER_APP_GENERATION_IMAGE_TASK_DETAIL_PATH,
  MAGIC_STUDIO_SERVER_APP_GENERATION_IMAGE_TASKS_PATH,
  MAGIC_STUDIO_SERVER_APP_GENERATION_IMAGE_UPSCALES_PATH,
  MAGIC_STUDIO_SERVER_APP_GENERATION_IMAGE_VARIATIONS_PATH,
  MAGIC_STUDIO_SERVER_APP_GENERATION_MUSIC_EXTEND_PATH,
  MAGIC_STUDIO_SERVER_APP_GENERATION_MUSIC_REMIX_PATH,
  MAGIC_STUDIO_SERVER_APP_GENERATION_MUSIC_SIMILAR_PATH,
  MAGIC_STUDIO_SERVER_APP_GENERATION_MUSIC_TASK_DETAIL_PATH,
  MAGIC_STUDIO_SERVER_APP_GENERATION_MUSIC_TASKS_PATH,
  MAGIC_STUDIO_SERVER_APP_GENERATION_SFX_CATEGORIES_PATH,
  MAGIC_STUDIO_SERVER_APP_GENERATION_SFX_TASK_CANCEL_PATH,
  MAGIC_STUDIO_SERVER_APP_GENERATION_SFX_TASK_DETAIL_PATH,
  MAGIC_STUDIO_SERVER_APP_GENERATION_SFX_TASKS_PATH,
  MAGIC_STUDIO_SERVER_APP_GENERATION_VIDEO_EXTEND_PATH,
  MAGIC_STUDIO_SERVER_APP_GENERATION_VIDEO_IMAGE_TO_VIDEO_PATH,
  MAGIC_STUDIO_SERVER_APP_GENERATION_VIDEO_LIP_SYNC_PATH,
  MAGIC_STUDIO_SERVER_APP_GENERATION_VIDEO_PROMPT_ENHANCE_PATH,
  MAGIC_STUDIO_SERVER_APP_GENERATION_VIDEO_STYLE_TRANSFER_PATH,
  MAGIC_STUDIO_SERVER_APP_GENERATION_VIDEO_TASK_CANCEL_PATH,
  MAGIC_STUDIO_SERVER_APP_GENERATION_VIDEO_TASK_DETAIL_PATH,
  MAGIC_STUDIO_SERVER_APP_GENERATION_VIDEO_TASKS_PATH,
  MAGIC_STUDIO_SERVER_APP_VOICE_CLONE_TASKS_PATH,
  MAGIC_STUDIO_SERVER_APP_VOICE_SPEECH_TASKS_PATH,
  MAGIC_STUDIO_SERVER_APP_VOICES_CUSTOM_PATH,
  MAGIC_STUDIO_SERVER_APP_VOICES_MARKET_PATH,
  MAGIC_STUDIO_SERVER_APP_VOICES_WORKSPACE_PATH,
  MAGIC_STUDIO_SERVER_APP_NOTE_FOLDERS_PATH,
  MAGIC_STUDIO_SERVER_APP_PORTAL_DISCOVER_FEEDS_PATH,
  MAGIC_STUDIO_SERVER_APP_PORTAL_FEEDS_PATH,
  MAGIC_STUDIO_SERVER_APP_PORTAL_FEATURED_FEEDS_PATH,
  MAGIC_STUDIO_SERVER_APP_NOTES_CLEAR_TRASH_PATH,
  MAGIC_STUDIO_SERVER_APP_NOTES_PATH,
  MAGIC_STUDIO_SERVER_APP_NOTES_TRASHED_PATH,
  MAGIC_STUDIO_SERVER_APP_NOTES_WORKSPACE_SNAPSHOT_PATH,
  MAGIC_STUDIO_SERVER_APP_PRESENTATIONS_PATH,
  MAGIC_STUDIO_SERVER_APP_PRESENTATION_DETAIL_PATH,
  MAGIC_STUDIO_SERVER_APP_PRESENTATION_SLIDES_PATH,
  MAGIC_STUDIO_SERVER_APP_PRESENTATION_SLIDE_DETAIL_PATH,
  MAGIC_STUDIO_SERVER_APP_TRADE_TASKS_ACCEPTED_PATH,
  MAGIC_STUDIO_SERVER_APP_TRADE_TASKS_AVAILABLE_PATH,
  MAGIC_STUDIO_SERVER_APP_TRADE_TASKS_PUBLISHED_PATH,
  MAGIC_STUDIO_SERVER_APP_TRADE_ORDERS_PATH,
  MAGIC_STUDIO_SERVER_APP_TRADE_ORDER_STATISTICS_PATH,
  MAGIC_STUDIO_SERVER_APP_TRADE_PAYMENTS_PATH,
  MAGIC_STUDIO_SERVER_APP_TRADE_TRANSACTIONS_PATH,
  MAGIC_STUDIO_SERVER_APP_TRADE_WALLET_PATH,
  MAGIC_STUDIO_SERVER_APP_VIP_PLANS_PATH,
  MAGIC_STUDIO_SERVER_APP_VIP_PURCHASE_PATH,
  MAGIC_STUDIO_SERVER_APP_VIP_STATUS_PATH,
  MAGIC_STUDIO_SERVER_APP_VIP_SUBSCRIPTIONS_PATH,
  MAGIC_STUDIO_SERVER_APP_NOTIFICATIONS_DELETE_PATH,
  MAGIC_STUDIO_SERVER_APP_NOTIFICATIONS_MARK_ALL_READ_PATH,
  MAGIC_STUDIO_SERVER_APP_NOTIFICATIONS_PATH,
  MAGIC_STUDIO_SERVER_APP_NOTIFICATIONS_UNREAD_COUNT_PATH,
  MAGIC_STUDIO_SERVER_APP_PLUGINS_PATH,
  MAGIC_STUDIO_SERVER_APP_PROMPT_OPTIMIZE_PATH,
  MAGIC_STUDIO_SERVER_APP_SETTINGS_PATH,
  MAGIC_STUDIO_SERVER_APP_USER_AVATAR_PATH,
  MAGIC_STUDIO_SERVER_APP_USER_ADDRESSES_PATH,
  MAGIC_STUDIO_SERVER_APP_USER_BINDINGS_PATH,
  MAGIC_STUDIO_SERVER_APP_USER_BIND_EMAIL_PATH,
  MAGIC_STUDIO_SERVER_APP_USER_BIND_PHONE_PATH,
  MAGIC_STUDIO_SERVER_APP_USER_BIND_PLATFORM_PATH,
  MAGIC_STUDIO_SERVER_APP_USER_CHANGE_PASSWORD_PATH,
  MAGIC_STUDIO_SERVER_APP_USER_DEFAULT_ADDRESS_PATH,
  MAGIC_STUDIO_SERVER_APP_USER_DEVICES_PATH,
  MAGIC_STUDIO_SERVER_APP_USER_GENERATION_HISTORY_PATH,
  MAGIC_STUDIO_SERVER_APP_USER_LOGIN_HISTORY_PATH,
  MAGIC_STUDIO_SERVER_APP_USER_PROFILE_PATH,
  MAGIC_STUDIO_SERVER_APP_USER_SESSIONS_PATH,
  MAGIC_STUDIO_SERVER_APP_USER_SETTINGS_PATH,
  MAGIC_STUDIO_SERVER_APP_USER_TWO_FACTOR_PATH,
  MAGIC_STUDIO_SERVER_APP_USER_TWO_FACTOR_SETUP_PATH,
  MAGIC_STUDIO_SERVER_APP_USER_TWO_FACTOR_VERIFY_PATH,
  MAGIC_STUDIO_SERVER_APP_WORKSPACE_RECENT_PROJECTS_PATH,
  MAGIC_STUDIO_SERVER_APP_WORKSPACES_PATH,
  MAGIC_STUDIO_SERVER_COMPRESSION_UNZIP_PATH,
  MAGIC_STUDIO_SERVER_COMPRESSION_ZIP_PATH,
  MAGIC_STUDIO_SERVER_FILESYSTEM_COPY_FILE_PATH,
  MAGIC_STUDIO_SERVER_FILESYSTEM_ENSURE_DIR_PATH,
  MAGIC_STUDIO_SERVER_FILESYSTEM_EXISTS_PATH,
  MAGIC_STUDIO_SERVER_FILESYSTEM_READ_BYTES_PATH,
  MAGIC_STUDIO_SERVER_FILESYSTEM_READ_DIR_PATH,
  MAGIC_STUDIO_SERVER_FILESYSTEM_READ_TEXT_PATH,
  MAGIC_STUDIO_SERVER_FILESYSTEM_REMOVE_PATH,
  MAGIC_STUDIO_SERVER_FILESYSTEM_RENAME_PATH,
  MAGIC_STUDIO_SERVER_FILESYSTEM_STAT_PATH,
  MAGIC_STUDIO_SERVER_FILESYSTEM_WRITE_BYTES_PATH,
  MAGIC_STUDIO_SERVER_FILESYSTEM_WRITE_TEXT_PATH,
  MAGIC_STUDIO_SERVER_HEALTH_PATH,
  MAGIC_STUDIO_SERVER_JOBS_PATH,
  MAGIC_STUDIO_SERVER_LIVE_OPENAPI_PATH,
  MAGIC_STUDIO_SERVER_MEDIA_AUDIO_CONVERT_PATH,
  MAGIC_STUDIO_SERVER_MEDIA_AUDIO_MIX_PATH,
  MAGIC_STUDIO_SERVER_MEDIA_AUDIO_NORMALIZE_PATH,
  MAGIC_STUDIO_SERVER_MEDIA_IMAGE_RESIZE_PATH,
  MAGIC_STUDIO_SERVER_MEDIA_PROBE_PATH,
  MAGIC_STUDIO_SERVER_MEDIA_VIDEO_CONCAT_PATH,
  MAGIC_STUDIO_SERVER_MEDIA_VIDEO_EXTRACT_AUDIO_PATH,
  MAGIC_STUDIO_SERVER_MEDIA_VIDEO_THUMBNAIL_PATH,
  MAGIC_STUDIO_SERVER_MEDIA_VIDEO_TRANSCODE_PATH,
  MAGIC_STUDIO_SERVER_MEDIA_VIDEO_TRIM_PATH,
  MAGIC_STUDIO_SERVER_MIGRATION_APPLY_PATH,
  MAGIC_STUDIO_SERVER_MIGRATION_STATUS_PATH,
  MAGIC_STUDIO_SERVER_POLICY_SNAPSHOT_PATH,
  MAGIC_STUDIO_SERVER_POLICY_VALIDATE_COMMAND_PATH,
  MAGIC_STUDIO_SERVER_POLICY_VALIDATE_PATH_PATH,
  MAGIC_STUDIO_SERVER_ROUTE_CATALOG_PATH,
  MAGIC_STUDIO_SERVER_RUNTIME,
  MAGIC_STUDIO_SERVER_RUNTIME_SUMMARY_PATH,
  MAGIC_STUDIO_SERVER_SQLITE_EXECUTE_BATCH_PATH,
  MAGIC_STUDIO_SERVER_SQLITE_EXECUTE_PATH,
  MAGIC_STUDIO_SERVER_SQLITE_QUERY_PATH,
  MAGIC_STUDIO_SERVER_TOOLKIT_CAPABILITIES_PATH,
  resolveMagicStudioServerRoutePath,
} from './contract.ts';

export interface MagicStudioServerClientOptions {
  baseUrl?: string;
  fetch?: typeof fetch;
  host?: MagicStudioHostDescriptor;
}

export interface MagicStudioServerClient {
  readonly host: MagicStudioHostDescriptor;
  healthz(): Promise<MagicStudioApiEnvelope<MagicStudioServerHealthStatus>>;
  readOpenApiDocument(): Promise<Record<string, unknown>>;
  readRouteCatalog(): Promise<MagicStudioApiListEnvelope<MagicStudioApiRouteCatalogEntry>>;
  readRuntimeSummary(): Promise<MagicStudioApiEnvelope<MagicStudioRuntimeSummary>>;
  readToolkitCapabilities(): Promise<MagicStudioApiEnvelope<MagicStudioToolkitCapabilityMatrix>>;
  readAppCapabilitySummary(): Promise<MagicStudioApiEnvelope<MagicStudioAppCapabilitySummary>>;
  listAppCapabilityDomains(): Promise<
    MagicStudioApiListEnvelope<MagicStudioAppCapabilityDomain>
  >;
  listAppExecutionCapabilities(): Promise<
    MagicStudioApiListEnvelope<MagicStudioAppExecutionCapability>
  >;
  readCreationCapabilities(
    query?: MagicStudioCreationCapabilitiesQuery,
  ): Promise<MagicStudioApiEnvelope<MagicStudioCreationCapabilities>>;
  listCreationBatches(
    query?: MagicStudioCreationBatchListQuery,
  ): Promise<MagicStudioApiListEnvelope<MagicStudioCreationBatch>>;
  createCreationBatch(
    payload: MagicStudioCreateCreationBatchRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioCreationBatch>>;
  readCreationBatch(
    batchId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioCreationBatch>>;
  updateCreationBatch(
    batchId: string,
    payload: MagicStudioUpdateCreationBatchRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioCreationBatch>>;
  deleteCreationBatch(
    batchId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioOperationOkResult>>;
  materializeCreationBatch(
    batchId: string,
    payload: MagicStudioMaterializeCreationBatchRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioCreationBatchMaterialization>>;
  updateCreationBatchItemStatus(
    batchId: string,
    itemId: string,
    payload: MagicStudioUpdateCreationBatchItemStatusRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioCreationBatch>>;
  listCreationPresets(
    query?: MagicStudioCreationPresetListQuery,
  ): Promise<MagicStudioApiListEnvelope<MagicStudioCreationPreset>>;
  createCreationPreset(
    payload: MagicStudioCreateCreationPresetRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioCreationPreset>>;
  readCreationPreset(
    presetId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioCreationPreset>>;
  updateCreationPreset(
    presetId: string,
    payload: MagicStudioUpdateCreationPresetRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioCreationPreset>>;
  deleteCreationPreset(
    presetId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioOperationOkResult>>;
  listCreationTemplates(
    query?: MagicStudioCreationTemplateListQuery,
  ): Promise<MagicStudioApiListEnvelope<MagicStudioCreationTemplate>>;
  createCreationTemplate(
    payload: MagicStudioCreateCreationTemplateRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioCreationTemplate>>;
  readCreationTemplate(
    templateId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioCreationTemplate>>;
  updateCreationTemplate(
    templateId: string,
    payload: MagicStudioUpdateCreationTemplateRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioCreationTemplate>>;
  deleteCreationTemplate(
    templateId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioOperationOkResult>>;
  applyCreationTemplate(
    templateId: string,
    payload: MagicStudioApplyCreationTemplateRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioCreationSession>>;
  listGenerationCatalogModels(
    query?: MagicStudioGenerationCatalogQuery,
  ): Promise<MagicStudioApiListEnvelope<MagicStudioGenerationCatalogModel>>;
  listGenerationCatalogStyles(
    query?: MagicStudioGenerationCatalogQuery,
  ): Promise<MagicStudioApiListEnvelope<MagicStudioGenerationCatalogStyle>>;
  listGenerationCatalogProviders(
    query?: MagicStudioGenerationCatalogQuery,
  ): Promise<MagicStudioApiListEnvelope<MagicStudioGenerationCatalogProvider>>;
  listGenerationCatalogVoices(
    query?: MagicStudioGenerationCatalogVoiceQuery,
  ): Promise<MagicStudioApiListEnvelope<MagicStudioGenerationCatalogVoice>>;
  readCreationHistoryEntry(
    entryId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioCreationHistoryEntry>>;
  listCreationHistory(
    query?: MagicStudioCreationHistoryListQuery,
  ): Promise<MagicStudioApiListEnvelope<MagicStudioCreationHistoryEntry>>;
  upsertCreationHistoryEntry(
    payload: MagicStudioUpsertCreationHistoryEntryRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioCreationHistoryEntry>>;
  setCreationHistoryEntryFavorite(
    entryId: string,
    payload: MagicStudioCreationHistoryFavoriteRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioCreationHistoryEntry>>;
  deleteCreationHistoryEntry(
    entryId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioCreationHistoryEntry>>;
  clearCreationHistory(
    query?: MagicStudioCreationHistoryListQuery,
  ): Promise<MagicStudioApiEnvelope<MagicStudioOperationOkResult>>;
  createCreationSession(
    payload: MagicStudioCreateCreationSessionRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioCreationSession>>;
  readCurrentCreationSession(
    query?: MagicStudioCreationSessionQuery,
  ): Promise<MagicStudioApiEnvelope<MagicStudioCreationSessionSnapshot>>;
  consumeCurrentCreationSession(
    query?: MagicStudioCreationSessionQuery,
  ): Promise<MagicStudioApiEnvelope<MagicStudioCreationSessionSnapshot>>;
  clearCurrentCreationSession(
    query?: MagicStudioCreationSessionQuery,
  ): Promise<MagicStudioApiEnvelope<MagicStudioOperationOkResult>>;
  listChatSessions(
    query?: MagicStudioChatSessionsListQuery,
  ): Promise<MagicStudioApiListEnvelope<ChatSession>>;
  createChatSession(
    payload: MagicStudioChatSessionCreateRequest,
  ): Promise<MagicStudioApiEnvelope<ChatSession>>;
  readChatSession(
    sessionId: string,
  ): Promise<MagicStudioApiEnvelope<ChatSession>>;
  updateChatSession(
    sessionId: string,
    payload: MagicStudioChatSessionUpdateRequest,
  ): Promise<MagicStudioApiEnvelope<ChatSession>>;
  deleteChatSession(
    sessionId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioOperationOkResult>>;
  readChatTranscript(
    sessionId: string,
  ): Promise<MagicStudioApiEnvelope<ChatTranscript>>;
  updateChatTranscript(
    sessionId: string,
    payload: MagicStudioChatTranscriptUpdateRequest,
  ): Promise<MagicStudioApiEnvelope<ChatTranscript>>;
  readFileSystemDirectory(
    payload: MagicStudioFileSystemPathRequest,
  ): Promise<MagicStudioApiListEnvelope<MagicStudioFileSystemEntry>>;
  readFileSystemText(
    payload: MagicStudioFileSystemPathRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFileSystemTextPayload>>;
  readFileSystemBytes(
    payload: MagicStudioFileSystemPathRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFileSystemBytesPayload>>;
  writeFileSystemText(
    payload: MagicStudioFileSystemWriteTextRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioOperationOkResult>>;
  writeFileSystemBytes(
    payload: MagicStudioFileSystemWriteBytesRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioOperationOkResult>>;
  statFileSystemPath(
    payload: MagicStudioFileSystemPathRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFileSystemStat>>;
  checkFileSystemPathExists(
    payload: MagicStudioFileSystemPathRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFileSystemExistsResult>>;
  ensureFileSystemDirectory(
    payload: MagicStudioFileSystemPathRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioOperationOkResult>>;
  removeFileSystemPath(
    payload: MagicStudioFileSystemPathRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioOperationOkResult>>;
  renameFileSystemPath(
    payload: MagicStudioFileSystemRenameRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioOperationOkResult>>;
  copyFileSystemFile(
    payload: MagicStudioFileSystemCopyFileRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioOperationOkResult>>;
  listPlugins(): Promise<MagicStudioApiListEnvelope<MagicStudioPluginManifest>>;
  readAuthSession(): Promise<MagicStudioApiEnvelope<AuthSessionState>>;
  login(
    payload: MagicStudioAuthLoginRequest,
  ): Promise<MagicStudioApiEnvelope<AuthSession>>;
  loginWithPhone(
    payload: MagicStudioAuthPhoneLoginRequest,
  ): Promise<MagicStudioApiEnvelope<AuthSession>>;
  register(
    payload: MagicStudioAuthRegisterRequest,
  ): Promise<MagicStudioApiEnvelope<AuthSession>>;
  logout(): Promise<MagicStudioApiEnvelope<MagicStudioOperationOkResult>>;
  refreshSession(
    payload: MagicStudioAuthRefreshTokenRequest,
  ): Promise<MagicStudioApiEnvelope<AuthSession>>;
  sendVerifyCode(
    payload: MagicStudioAuthSendVerifyCodeRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioOperationOkResult>>;
  checkVerifyCode(
    payload: MagicStudioAuthCheckVerifyCodeRequest,
  ): Promise<MagicStudioApiEnvelope<AuthVerificationCodeCheckResult>>;
  requestPasswordReset(
    payload: MagicStudioAuthPasswordResetRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioOperationOkResult>>;
  resetPassword(
    payload: MagicStudioAuthPasswordResetConfirmRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioOperationOkResult>>;
  createLoginQrCode(): Promise<MagicStudioApiEnvelope<AuthQrCodePayload>>;
  readLoginQrCodeStatus(
    qrKey: string,
  ): Promise<MagicStudioApiEnvelope<AuthQrCodeStatusResult>>;
  readAppSettings(): Promise<MagicStudioApiEnvelope<MagicStudioAppSettingsDocument>>;
  updateAppSettings(
    payload: MagicStudioAppSettingsUpdateRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioAppSettingsDocument>>;
  listNotifications(): Promise<MagicStudioApiListEnvelope<MagicStudioNotificationRecord>>;
  createNotification(
    payload: MagicStudioNotificationCreateRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioNotificationRecord>>;
  markNotificationAsRead(
    notificationId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioOperationOkResult>>;
  markAllNotificationsAsRead(): Promise<MagicStudioApiEnvelope<MagicStudioOperationOkResult>>;
  readNotificationUnreadCount(): Promise<MagicStudioApiEnvelope<MagicStudioNotificationUnreadCount>>;
  deleteNotifications(
    payload: MagicStudioNotificationBatchDeleteRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioOperationOkResult>>;
  listWorkspaces(): Promise<MagicStudioApiListEnvelope<StudioWorkspace>>;
  createWorkspace(
    payload: MagicStudioWorkspaceCreateRequest,
  ): Promise<MagicStudioApiEnvelope<StudioWorkspace>>;
  readWorkspace(
    workspaceId: string,
  ): Promise<MagicStudioApiEnvelope<StudioWorkspace>>;
  updateWorkspace(
    workspaceId: string,
    payload: MagicStudioWorkspaceUpdateRequest,
  ): Promise<MagicStudioApiEnvelope<StudioWorkspace>>;
  deleteWorkspace(
    workspaceId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioOperationOkResult>>;
  listRecentWorkspaceProjects(): Promise<MagicStudioApiListEnvelope<StudioProject>>;
  listWorkspaceProjects(
    workspaceId: string,
  ): Promise<MagicStudioApiListEnvelope<StudioProject>>;
  createWorkspaceProject(
    workspaceId: string,
    payload: MagicStudioProjectCreateRequest,
  ): Promise<MagicStudioApiEnvelope<StudioProject>>;
  readWorkspaceProject(
    workspaceId: string,
    projectId: string,
  ): Promise<MagicStudioApiEnvelope<StudioProject>>;
  openWorkspaceProject(
    workspaceId: string,
    projectId: string,
  ): Promise<MagicStudioApiEnvelope<StudioProject>>;
  duplicateWorkspaceProject(
    workspaceId: string,
    projectId: string,
  ): Promise<MagicStudioApiEnvelope<StudioProject>>;
  archiveWorkspaceProject(
    workspaceId: string,
    projectId: string,
  ): Promise<MagicStudioApiEnvelope<StudioProject>>;
  restoreWorkspaceProject(
    workspaceId: string,
    projectId: string,
  ): Promise<MagicStudioApiEnvelope<StudioProject>>;
  readWorkspaceProjectSession(
    workspaceId: string,
    projectId: string,
  ): Promise<MagicStudioApiEnvelope<StudioProjectSessionSnapshot>>;
  upsertWorkspaceProjectSession(
    workspaceId: string,
    projectId: string,
    payload: MagicStudioProjectSessionUpsertRequest,
  ): Promise<MagicStudioApiEnvelope<StudioProjectSession>>;
  deleteWorkspaceProjectSession(
    workspaceId: string,
    projectId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioOperationOkResult>>;
  syncWorkspaceProjectToGit(
    workspaceId: string,
    projectId: string,
    payload: MagicStudioProjectGitSyncRequest,
  ): Promise<MagicStudioApiEnvelope<StudioProjectGitSyncRecord>>;
  listWorkspaceProjectGitSyncs(
    workspaceId: string,
    projectId: string,
  ): Promise<MagicStudioApiListEnvelope<StudioProjectGitSyncRecord>>;
  readLatestWorkspaceProjectGitSync(
    workspaceId: string,
    projectId: string,
  ): Promise<MagicStudioApiEnvelope<StudioProjectGitSyncRecord>>;
  readWorkspaceProjectGitSync(
    workspaceId: string,
    projectId: string,
    syncId: string,
  ): Promise<MagicStudioApiEnvelope<StudioProjectGitSyncRecord>>;
  retryWorkspaceProjectGitSync(
    workspaceId: string,
    projectId: string,
    syncId: string,
    payload: MagicStudioProjectGitSyncRetryRequest,
  ): Promise<MagicStudioApiEnvelope<StudioProjectGitSyncRecord>>;
  listWorkspaceProjectReleases(
    workspaceId: string,
    projectId: string,
  ): Promise<MagicStudioApiListEnvelope<StudioProjectReleaseRecord>>;
  readWorkspaceProjectReleaseStats(
    workspaceId: string,
    projectId: string,
  ): Promise<MagicStudioApiEnvelope<StudioProjectReleaseStats>>;
  pruneWorkspaceProjectReleases(
    workspaceId: string,
    projectId: string,
    payload: MagicStudioProjectReleasePruneRequest,
  ): Promise<MagicStudioApiEnvelope<StudioProjectReleasePruneResult>>;
  readWorkspaceProjectReleaseRetentionPolicy(
    workspaceId: string,
    projectId: string,
  ): Promise<MagicStudioApiEnvelope<StudioProjectReleaseRetentionPolicy>>;
  updateWorkspaceProjectReleaseRetentionPolicy(
    workspaceId: string,
    projectId: string,
    payload: MagicStudioProjectReleaseRetentionPolicyRequest,
  ): Promise<MagicStudioApiEnvelope<StudioProjectReleaseRetentionPolicy>>;
  applyWorkspaceProjectReleaseRetentionPolicy(
    workspaceId: string,
    projectId: string,
    payload: MagicStudioProjectReleaseRetentionPolicyApplyRequest,
  ): Promise<MagicStudioApiEnvelope<StudioProjectReleaseRetentionPolicyApplyResult>>;
  createWorkspaceProjectRelease(
    workspaceId: string,
    projectId: string,
    payload: MagicStudioProjectReleaseCreateRequest,
  ): Promise<MagicStudioApiEnvelope<StudioProjectReleaseRecord>>;
  readLatestWorkspaceProjectRelease(
    workspaceId: string,
    projectId: string,
  ): Promise<MagicStudioApiEnvelope<StudioProjectReleaseRecord>>;
  readWorkspaceProjectRelease(
    workspaceId: string,
    projectId: string,
    releaseId: string,
  ): Promise<MagicStudioApiEnvelope<StudioProjectReleaseRecord>>;
  deleteWorkspaceProjectRelease(
    workspaceId: string,
    projectId: string,
    releaseId: string,
  ): Promise<MagicStudioApiEnvelope<StudioProjectReleaseRecord>>;
  restoreWorkspaceProjectRelease(
    workspaceId: string,
    projectId: string,
    releaseId: string,
  ): Promise<MagicStudioApiEnvelope<StudioProjectReleaseRecord>>;
  readWorkspaceProjectReleaseManifest(
    workspaceId: string,
    projectId: string,
    releaseId: string,
  ): Promise<MagicStudioApiEnvelope<StudioProjectReleaseManifest>>;
  rebuildWorkspaceProjectRelease(
    workspaceId: string,
    projectId: string,
    releaseId: string,
  ): Promise<MagicStudioApiEnvelope<StudioProjectReleaseRecord>>;
  updateWorkspaceProject(
    workspaceId: string,
    projectId: string,
    payload: MagicStudioProjectUpdateRequest,
  ): Promise<MagicStudioApiEnvelope<StudioProject>>;
  deleteWorkspaceProject(
    workspaceId: string,
    projectId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioOperationOkResult>>;
  listAssets(
    query?: MagicStudioAssetListQuery,
  ): Promise<MagicStudioApiListEnvelope<UnifiedDigitalAsset>>;
  readAssetStats(
    query?: MagicStudioAssetStatsQuery,
  ): Promise<MagicStudioApiEnvelope<AssetCenterStats>>;
  listAssetCategories(): Promise<MagicStudioApiListEnvelope<AssetCategory>>;
  importAssetFile(
    payload: MagicStudioAssetImportFileRequest,
  ): Promise<MagicStudioApiEnvelope<UnifiedDigitalAsset>>;
  importAssetUrl(
    payload: MagicStudioAssetImportUrlRequest,
  ): Promise<MagicStudioApiEnvelope<UnifiedDigitalAsset>>;
  readAsset(assetId: string): Promise<MagicStudioApiEnvelope<UnifiedDigitalAsset>>;
  upsertAsset(
    assetId: string,
    payload: MagicStudioAssetUpsertRequest,
  ): Promise<MagicStudioApiEnvelope<UnifiedDigitalAsset>>;
  updateAsset(
    assetId: string,
    payload: MagicStudioAssetUpdateRequest,
  ): Promise<MagicStudioApiEnvelope<UnifiedDigitalAsset>>;
  deleteAsset(
    assetId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioOperationOkResult>>;
  readDriveRoot(): Promise<MagicStudioApiEnvelope<DriveRootDescriptor>>;
  listDriveEntries(
    query?: MagicStudioDriveEntriesQuery,
  ): Promise<MagicStudioApiListEnvelope<DriveItem>>;
  readDriveStats(): Promise<MagicStudioApiEnvelope<DriveStats>>;
  listFilmProjects(
    query?: MagicStudioFilmProjectListQuery,
  ): Promise<MagicStudioApiListEnvelope<FilmProject>>;
  createFilmProject(
    payload: MagicStudioFilmProjectCreateRequest,
  ): Promise<MagicStudioApiEnvelope<FilmProject>>;
  listFilmPresets(): Promise<MagicStudioApiListEnvelope<MagicStudioFilmPreset>>;
  createFilmPreset(
    payload: MagicStudioFilmPresetWriteRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFilmPreset>>;
  listFilmTemplates(
    query?: MagicStudioFilmTemplateListQuery,
  ): Promise<MagicStudioApiListEnvelope<FilmTemplate>>;
  createFilmTemplate(
    payload: MagicStudioFilmTemplateWriteRequest,
  ): Promise<MagicStudioApiEnvelope<FilmTemplate>>;
  readFilmTemplate(
    templateId: string,
  ): Promise<MagicStudioApiEnvelope<FilmTemplate>>;
  updateFilmTemplate(
    templateId: string,
    payload: MagicStudioFilmTemplateWriteRequest,
  ): Promise<MagicStudioApiEnvelope<FilmTemplate>>;
  instantiateFilmTemplate(
    templateId: string,
    payload?: MagicStudioFilmTemplateInstantiateRequest,
  ): Promise<MagicStudioApiEnvelope<FilmProject>>;
  deleteFilmTemplate(
    templateId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioOperationOkResult>>;
  createFilmTemplateSnapshot(
    projectId: string,
    payload?: MagicStudioFilmTemplateSnapshotRequest,
  ): Promise<MagicStudioApiEnvelope<FilmTemplate>>;
  readFilmProject(
    projectId: string,
  ): Promise<MagicStudioApiEnvelope<FilmProject>>;
  readFilmProjectGraph(
    projectId: string,
  ): Promise<MagicStudioApiEnvelope<ProjectGraphDocument>>;
  readFilmProjectAssetInventory(
    projectId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFilmAssetInventoryResult>>;
  listFilmProjectPublishes(
    projectId: string,
    query?: MagicStudioFilmPublishListQuery,
  ): Promise<MagicStudioApiListEnvelope<MagicStudioFilmPublishRecord>>;
  listFilmProjectReviewQueue(
    projectId: string,
    query?: MagicStudioFilmReviewQueueQuery,
  ): Promise<MagicStudioApiListEnvelope<MagicStudioFilmProjectReviewQueueItem>>;
  readFilmProjectReviewPortfolioDashboard(
    projectId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFilmProjectReviewPortfolioDashboardResult>>;
  readFilmProjectReviewReviewerCapacity(
    projectId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFilmProjectReviewReviewerCapacityResult>>;
  readFilmProjectReviewDecisionFreshness(
    projectId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFilmProjectReviewDecisionFreshnessResult>>;
  readFilmProjectReviewGovernanceDrift(
    projectId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFilmProjectReviewGovernanceDriftResult>>;
  readFilmProjectReviewEscalationForecast(
    projectId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFilmProjectReviewEscalationForecastResult>>;
  readFilmProjectReviewDependencyGraph(
    projectId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFilmProjectReviewDependencyGraphResult>>;
  readFilmProjectReviewInterventionPlan(
    projectId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFilmProjectReviewInterventionPlanResult>>;
  readFilmProjectReviewRecoveryOrchestration(
    projectId: string,
  ): Promise<
    MagicStudioApiEnvelope<MagicStudioFilmProjectReviewRecoveryOrchestrationResult>
  >;
  readFilmProjectReviewApprovalBurnDown(
    projectId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFilmProjectReviewApprovalBurnDownResult>>;
  readFilmProjectReviewEffectivenessBaseline(
    projectId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFilmProjectReviewEffectivenessBaselineResult>>;
  readFilmProjectReviewInterventionExecutionHistory(
    projectId: string,
  ): Promise<
    MagicStudioApiEnvelope<MagicStudioFilmProjectReviewInterventionExecutionHistoryResult>
  >;
  readFilmProjectReviewInterventionOutcomes(
    projectId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFilmProjectReviewInterventionOutcomesResult>>;
  readFilmProjectPublish(
    projectId: string,
    publishId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFilmPublishRecord>>;
  readFilmProjectPublishReviewState(
    projectId: string,
    publishId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFilmPublishReviewState>>;
  readFilmProjectPublishReviewTimeline(
    projectId: string,
    publishId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFilmPublishReviewTimelineResult>>;
  readFilmProjectPublishReviewRounds(
    projectId: string,
    publishId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFilmPublishReviewRoundsResult>>;
  readFilmProjectPublishReviewAnchors(
    projectId: string,
    publishId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFilmPublishReviewAnchorsResult>>;
  readFilmProjectPublishReviewActivity(
    projectId: string,
    publishId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFilmPublishReviewActivityResult>>;
  readFilmProjectPublishReviewAnchorResponsibility(
    projectId: string,
    publishId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFilmPublishReviewAnchorResponsibilityResult>>;
  readFilmProjectPublishReviewReviewerBacklog(
    projectId: string,
    publishId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFilmPublishReviewReviewerBacklogResult>>;
  readFilmProjectPublishReviewDecisionMatrix(
    projectId: string,
    publishId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFilmPublishReviewDecisionMatrixResult>>;
  readFilmProjectPublishReviewReadiness(
    projectId: string,
    publishId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFilmPublishReviewReadinessResult>>;
  readFilmProjectPublishReviewReviewerAttention(
    projectId: string,
    publishId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFilmPublishReviewReviewerAttentionResult>>;
  readFilmProjectPublishReviewReviewerCoverage(
    projectId: string,
    publishId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFilmPublishReviewReviewerCoverageResult>>;
  readFilmProjectPublishReviewOperationsDashboard(
    projectId: string,
    publishId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFilmPublishReviewOperationsDashboardResult>>;
  readFilmProjectPublishReviewStaleDecisions(
    projectId: string,
    publishId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFilmPublishReviewStaleDecisionResult>>;
  readFilmProjectPublishReviewLatencyAnalytics(
    projectId: string,
    publishId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFilmPublishReviewLatencyAnalyticsResult>>;
  readFilmProjectPublishReviewWorklist(
    projectId: string,
    publishId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFilmPublishReviewWorklistResult>>;
  approveFilmProjectPublish(
    projectId: string,
    publishId: string,
    payload?: MagicStudioFilmPublishApproveRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFilmPublishApproveResult>>;
  requestFilmProjectPublishChanges(
    projectId: string,
    publishId: string,
    payload: MagicStudioFilmPublishRequestChangesRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFilmPublishRequestChangesResult>>;
  createFilmProjectPublishReviewComment(
    projectId: string,
    publishId: string,
    payload: MagicStudioFilmPublishReviewCommentRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFilmPublishReviewCommentResult>>;
  submitFilmProjectPublishReview(
    projectId: string,
    publishId: string,
    payload?: MagicStudioFilmPublishReviewSubmitRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFilmPublishReviewSubmitResult>>;
  consensusFilmProjectPublishReview(
    projectId: string,
    publishId: string,
    payload: MagicStudioFilmPublishReviewConsensusRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFilmPublishReviewConsensusResult>>;
  resolveFilmProjectPublishReviewComment(
    projectId: string,
    publishId: string,
    commentId: string,
    payload?: MagicStudioFilmPublishReviewCommentResolveRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFilmPublishReviewCommentResolveResult>>;
  setFilmProjectPublishReviewAssignments(
    projectId: string,
    publishId: string,
    payload: MagicStudioFilmPublishReviewAssignmentsRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFilmPublishReviewAssignmentsResult>>;
  reopenFilmProjectPublish(
    projectId: string,
    publishId: string,
    payload?: MagicStudioFilmPublishReopenRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFilmPublishReopenResult>>;
  restoreFilmProjectPublish(
    projectId: string,
    publishId: string,
    payload?: MagicStudioFilmPublishRestoreRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFilmPublishRestoreResult>>;
  deleteFilmProjectPublish(
    projectId: string,
    publishId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioOperationOkResult>>;
  readFilmProjectPublishArtifactContent(
    projectId: string,
    publishId: string,
    artifactKind: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFilmPublishArtifactContent>>;
  updateFilmProject(
    projectId: string,
    payload: MagicStudioFilmProjectUpdateRequest,
  ): Promise<MagicStudioApiEnvelope<FilmProject>>;
  deleteFilmProject(
    projectId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioOperationOkResult>>;
  analyzeFilmScript(
    payload: MagicStudioFilmAnalysisRequest,
  ): Promise<MagicStudioApiEnvelope<FilmScriptAnalysisResult>>;
  standardizeFilmScript(
    projectId: string,
    payload?: MagicStudioFilmScriptStandardizeRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFilmScriptStandardizeResult>>;
  prepareFilmProjectAnalysis(
    projectId: string,
    payload?: MagicStudioFilmPrepareAnalysisRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFilmPrepareAnalysisResult>>;
  rebuildFilmProjectStoryboard(
    projectId: string,
    payload?: MagicStudioFilmRebuildStoryboardRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFilmRebuildStoryboardResult>>;
  createFilmProjectSceneBreakdown(
    projectId: string,
    payload?: MagicStudioFilmCreateSceneBreakdownRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFilmCreateSceneBreakdownResult>>;
  createFilmProjectShootingPlan(
    projectId: string,
    payload?: MagicStudioFilmCreateShootingPlanRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFilmCreateShootingPlanResult>>;
  generateFilmProjectShotVariants(
    projectId: string,
    payload?: MagicStudioFilmGenerateShotVariantsRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFilmGenerateShotVariantsResult>>;
  generateFilmStoryboard(
    projectId: string,
    payload?: MagicStudioFilmStoryboardGenerateRequest,
  ): Promise<MagicStudioApiEnvelope<FilmProject>>;
  syncFilmShots(
    projectId: string,
    payload?: MagicStudioFilmShotSyncRequest,
  ): Promise<MagicStudioApiEnvelope<FilmProject>>;
  runFilmAuthoringBatch(
    projectId: string,
    payload: MagicStudioFilmAuthoringBatchRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFilmAuthoringBatchResult>>;
  refreshFilmProjectAnalysis(
    projectId: string,
    payload?: MagicStudioFilmRefreshAnalysisRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFilmRefreshAnalysisResult>>;
  applyFilmPreset(
    projectId: string,
    payload: MagicStudioFilmPresetApplyRequest,
  ): Promise<MagicStudioApiEnvelope<FilmProject>>;
  relinkFilmAssets(
    projectId: string,
    payload: MagicStudioFilmAssetRelinkRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFilmAssetRelinkResult>>;
  bindFilmAsset(
    projectId: string,
    payload: MagicStudioFilmAssetBindRequest,
  ): Promise<MagicStudioApiEnvelope<FilmProject>>;
  exportFilmPackage(
    projectId: string,
    payload?: MagicStudioFilmExportPackageRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFilmExportPackage>>;
  publishFilmStoryboard(
    projectId: string,
    payload?: MagicStudioFilmStoryboardPublishRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFilmStoryboardPublishResult>>;
  importFilmPackage(
    payload: MagicStudioFilmImportPackageRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFilmImportPackage>>;
  validateFilmProject(
    payload: MagicStudioFilmProjectValidateRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioFilmProjectValidation>>;
  extractFilmCharacters(
    payload: MagicStudioFilmAnalysisRequest,
  ): Promise<MagicStudioApiListEnvelope<FilmCharacter>>;
  extractFilmProps(
    payload: MagicStudioFilmAnalysisRequest,
  ): Promise<MagicStudioApiListEnvelope<FilmProp>>;
  listMagicCutProjects(
    query?: MagicStudioMagicCutProjectListQuery,
  ): Promise<MagicStudioApiListEnvelope<CutProject>>;
  createMagicCutProject(
    payload: MagicStudioMagicCutProjectCreateRequest,
  ): Promise<MagicStudioApiEnvelope<CutProject>>;
  readMagicCutProject(
    projectId: string,
  ): Promise<MagicStudioApiEnvelope<CutProject>>;
  updateMagicCutProject(
    projectId: string,
    payload: MagicStudioMagicCutProjectUpdateRequest,
  ): Promise<MagicStudioApiEnvelope<CutProject>>;
  deleteMagicCutProject(
    projectId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioOperationOkResult>>;
  duplicateMagicCutProject(
    projectId: string,
    payload?: MagicStudioMagicCutProjectDuplicateRequest,
  ): Promise<MagicStudioApiEnvelope<CutProject>>;
  listMagicCutTemplates(
    query?: MagicStudioMagicCutTemplateListQuery,
  ): Promise<MagicStudioApiListEnvelope<CutTemplate>>;
  createMagicCutTemplate(
    payload: MagicStudioMagicCutTemplateSaveRequest,
  ): Promise<MagicStudioApiEnvelope<CutTemplate>>;
  readMagicCutTemplate(
    templateId: string,
  ): Promise<MagicStudioApiEnvelope<CutTemplate>>;
  updateMagicCutTemplate(
    templateId: string,
    payload: MagicStudioMagicCutTemplateSaveRequest,
  ): Promise<MagicStudioApiEnvelope<CutTemplate>>;
  instantiateMagicCutTemplate(
    templateId: string,
    payload?: MagicStudioMagicCutTemplateInstantiateRequest,
  ): Promise<MagicStudioApiEnvelope<CutProject>>;
  deleteMagicCutTemplate(
    templateId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioOperationOkResult>>;
  readMagicCutRenderCapabilities(): Promise<
    MagicStudioApiEnvelope<MagicStudioMagicCutRenderCapabilities>
  >;
  listMagicCutRenders(
    query?: MagicStudioMagicCutRenderListQuery,
  ): Promise<MagicStudioApiListEnvelope<MagicStudioMagicCutRenderJob>>;
  createMagicCutRender(
    projectId: string,
    payload: MagicStudioMagicCutRenderCreateRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioMagicCutRenderJob>>;
  readMagicCutRender(
    renderId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioMagicCutRenderJob>>;
  cancelMagicCutRender(
    renderId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioMagicCutRenderJob>>;
  listMagicCutRenderArtifacts(
    renderId: string,
  ): Promise<MagicStudioApiListEnvelope<MagicStudioMagicCutRenderArtifact>>;
  readMagicCutRenderArtifactContent(
    renderId: string,
    artifactId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioMagicCutRenderArtifactContent>>;
  readDriveFileContent(
    itemId: string,
  ): Promise<MagicStudioApiEnvelope<DriveFileContent>>;
  updateDriveFileContent(
    itemId: string,
    payload: MagicStudioDriveUpdateFileContentRequest,
  ): Promise<MagicStudioApiEnvelope<DriveFileContent>>;
  createDriveFolder(
    payload: MagicStudioDriveCreateFolderRequest,
  ): Promise<MagicStudioApiEnvelope<DriveItem>>;
  uploadDriveFile(
    payload: MagicStudioDriveUploadFileRequest,
  ): Promise<MagicStudioApiEnvelope<DriveItem>>;
  importDriveFile(
    payload: MagicStudioDriveImportFileRequest,
  ): Promise<MagicStudioApiEnvelope<DriveItem>>;
  renameDriveItem(
    payload: MagicStudioDriveRenameRequest,
  ): Promise<MagicStudioApiEnvelope<DriveItem>>;
  moveDriveItems(
    payload: MagicStudioDriveMoveRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioOperationOkResult>>;
  deleteDriveItems(
    payload: MagicStudioDriveDeleteRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioOperationOkResult>>;
  restoreDriveItems(
    payload: MagicStudioDriveRestoreRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioOperationOkResult>>;
  emptyDriveTrash(): Promise<MagicStudioApiEnvelope<MagicStudioOperationOkResult>>;
  favoriteDriveItem(
    payload: MagicStudioDriveFavoriteRequest,
  ): Promise<MagicStudioApiEnvelope<DriveItem>>;
  readNotesWorkspaceSnapshot(): Promise<MagicStudioApiEnvelope<NoteWorkspaceSnapshot>>;
  listNotes(
    query?: MagicStudioNotesListQuery,
  ): Promise<MagicStudioApiListEnvelope<NoteSummary>>;
  createNote(
    payload: MagicStudioNoteCreateRequest,
  ): Promise<MagicStudioApiEnvelope<Note>>;
  listTrashedNotes(
    query?: MagicStudioNotesListQuery,
  ): Promise<MagicStudioApiListEnvelope<NoteSummary>>;
  readNote(
    noteId: string,
  ): Promise<MagicStudioApiEnvelope<Note>>;
  updateNote(
    noteId: string,
    payload: MagicStudioNoteUpdateRequest,
  ): Promise<MagicStudioApiEnvelope<Note>>;
  createNoteFolder(
    payload: MagicStudioNoteFolderCreateRequest,
  ): Promise<MagicStudioApiEnvelope<NoteFolder>>;
  renameNoteFolder(
    folderId: string,
    payload: MagicStudioNoteFolderRenameRequest,
  ): Promise<MagicStudioApiEnvelope<NoteFolder>>;
  deleteNoteFolder(
    folderId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioOperationOkResult>>;
  trashNote(
    noteId: string,
  ): Promise<MagicStudioApiEnvelope<Note>>;
  restoreNote(
    noteId: string,
  ): Promise<MagicStudioApiEnvelope<Note>>;
  deleteNote(
    noteId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioOperationOkResult>>;
  clearNotesTrash(): Promise<MagicStudioApiEnvelope<MagicStudioOperationOkResult>>;
  moveNoteFolder(
    folderId: string,
    payload: MagicStudioNoteFolderMoveRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioOperationOkResult>>;
  moveNote(
    noteId: string,
    payload: MagicStudioNoteMoveRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioOperationOkResult>>;
  publishNote(
    noteId: string,
    payload: MagicStudioNotePublishRequest,
  ): Promise<MagicStudioApiEnvelope<PublishResult>>;
  listPresentations(
    query?: MagicStudioPresentationsListQuery,
  ): Promise<MagicStudioApiListEnvelope<Presentation>>;
  createPresentation(
    payload: MagicStudioPresentationCreateRequest,
  ): Promise<MagicStudioApiEnvelope<Presentation>>;
  readPresentation(
    presentationId: string,
  ): Promise<MagicStudioApiEnvelope<Presentation>>;
  updatePresentation(
    presentationId: string,
    payload: MagicStudioPresentationUpdateRequest,
  ): Promise<MagicStudioApiEnvelope<Presentation>>;
  deletePresentation(
    presentationId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioOperationOkResult>>;
  createPresentationSlide(
    presentationId: string,
    payload: MagicStudioPresentationSlideCreateRequest,
  ): Promise<MagicStudioApiEnvelope<Presentation>>;
  updatePresentationSlide(
    presentationId: string,
    slideId: string,
    payload: MagicStudioPresentationSlideUpdateRequest,
  ): Promise<MagicStudioApiEnvelope<Presentation>>;
  createPortalFeed(
    payload: MagicStudioPortalFeedCreateRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioPortalFeed>>;
  listPortalFeaturedFeeds(
    query?: MagicStudioPortalFeaturedFeedQuery,
  ): Promise<MagicStudioApiListEnvelope<MagicStudioPortalFeed>>;
  listPortalDiscoverFeeds(
    query?: MagicStudioPortalDiscoverFeedQuery,
  ): Promise<MagicStudioApiListEnvelope<MagicStudioPortalFeed>>;
  readPortalFeed(
    feedId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioPortalFeed>>;
  likePortalFeed(
    feedId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioPortalFeed>>;
  unlikePortalFeed(
    feedId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioPortalFeed>>;
  collectPortalFeed(
    feedId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioPortalFeed>>;
  uncollectPortalFeed(
    feedId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioPortalFeed>>;
  sharePortalFeed(
    feedId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioPortalFeed>>;
  deletePortalFeed(
    feedId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioOperationOkResult>>;
  listTradeAvailableTasks(
    query?: MagicStudioTradeTaskListQuery,
  ): Promise<MagicStudioApiListEnvelope<MagicStudioTradeMarketplaceTask>>;
  listTradePublishedTasks(
    query?: MagicStudioTradeTaskListQuery,
  ): Promise<MagicStudioApiListEnvelope<MagicStudioTradeMarketplaceTask>>;
  listTradeAcceptedTasks(
    query?: MagicStudioTradeTaskListQuery,
  ): Promise<MagicStudioApiListEnvelope<MagicStudioTradeMarketplaceTask>>;
  readTradeTask(
    taskId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioTradeMarketplaceTask>>;
  acceptTradeTask(
    taskId: string,
    payload?: MagicStudioTradeTaskAcceptRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioTradeMarketplaceTask>>;
  submitTradeTask(
    taskId: string,
    payload: MagicStudioTradeTaskSubmitRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioTradeMarketplaceTask>>;
  approveTradeTask(
    taskId: string,
    payload: MagicStudioTradeTaskApproveRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioTradeMarketplaceTask>>;
  cancelTradeTask(
    taskId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioTradeMarketplaceTask>>;
  listTradeOrders(
    query?: MagicStudioTradeOrderListQuery,
  ): Promise<MagicStudioApiListEnvelope<MagicStudioTradeOrder>>;
  readTradeOrder(
    orderId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioTradeOrder>>;
  createTradeOrder(
    payload: MagicStudioTradeOrderCreateRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioTradeOrder>>;
  updateTradeOrderStatus(
    orderId: string,
    payload: MagicStudioTradeOrderStatusUpdateRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioTradeOrder>>;
  cancelTradeOrder(
    orderId: string,
    payload?: MagicStudioTradeOrderCancelRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioTradeOrder>>;
  deleteTradeOrder(
    orderId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioOperationOkResult>>;
  readTradeOrderStatistics(): Promise<MagicStudioApiEnvelope<MagicStudioTradeOrderStatistics>>;
  listTradePayments(
    query?: MagicStudioTradePaymentListQuery,
  ): Promise<MagicStudioApiListEnvelope<MagicStudioTradePayment>>;
  readTradePayment(
    paymentId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioTradePayment>>;
  createTradePayment(
    payload: MagicStudioTradePaymentCreateRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioTradePaymentActionResult>>;
  refundTradePayment(
    paymentId: string,
    payload: MagicStudioTradePaymentRefundRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioTradePayment>>;
  rechargeTradeWallet(
    payload: MagicStudioTradePaymentRechargeRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioTradePaymentActionResult>>;
  readTradeWallet(): Promise<MagicStudioApiEnvelope<MagicStudioTradeWallet>>;
  listTradeTransactions(
    query?: MagicStudioTradeTransactionListQuery,
  ): Promise<MagicStudioApiListEnvelope<MagicStudioTradeTransaction>>;
  listVipPlans(): Promise<MagicStudioApiListEnvelope<MagicStudioVipPlan>>;
  readVipStatus(): Promise<MagicStudioApiEnvelope<MagicStudioVipStatus>>;
  purchaseVip(
    payload: MagicStudioVipPurchaseRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioVipPurchaseResult>>;
  listVipSubscriptions(
    query?: MagicStudioVipSubscriptionListQuery,
  ): Promise<MagicStudioApiListEnvelope<MagicStudioVipSubscription>>;
  cancelVipSubscription(
    subscriptionId: string,
    payload?: MagicStudioVipSubscriptionCancelRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioVipSubscription>>;
  readUserProfile(): Promise<MagicStudioApiEnvelope<UserProfile>>;
  updateUserProfile(
    payload: MagicStudioUserProfileUpdateRequest,
  ): Promise<MagicStudioApiEnvelope<UserProfile>>;
  uploadUserAvatar(
    payload: MagicStudioUserAvatarUploadRequest,
  ): Promise<MagicStudioApiEnvelope<UserProfile>>;
  readUserSettings(): Promise<MagicStudioApiEnvelope<UserSettings>>;
  updateUserSettings(
    payload: MagicStudioUserSettingsUpdateRequest,
  ): Promise<MagicStudioApiEnvelope<UserSettings>>;
  changeUserPassword(
    payload: MagicStudioUserPasswordChangeRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioOperationOkResult>>;
  listUserAddresses(): Promise<MagicStudioApiListEnvelope<UserAddress>>;
  readDefaultUserAddress(): Promise<MagicStudioApiEnvelope<UserAddress | null>>;
  createUserAddress(
    payload: MagicStudioUserAddressCreateRequest,
  ): Promise<MagicStudioApiEnvelope<UserAddress>>;
  updateUserAddress(
    addressId: string,
    payload: MagicStudioUserAddressUpdateRequest,
  ): Promise<MagicStudioApiEnvelope<UserAddress>>;
  deleteUserAddress(
    addressId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioOperationOkResult>>;
  setDefaultUserAddress(
    addressId: string,
  ): Promise<MagicStudioApiEnvelope<UserAddress>>;
  readUserLoginHistory(
    query?: MagicStudioUserHistoryQuery,
  ): Promise<MagicStudioApiListEnvelope<UserLoginHistoryEntry>>;
  readUserGenerationHistory(
    query?: MagicStudioUserHistoryQuery,
  ): Promise<MagicStudioApiListEnvelope<UserGenerationHistoryEntry>>;
  listUserSessions(): Promise<MagicStudioApiListEnvelope<UserSecuritySession>>;
  revokeUserSession(
    sessionId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioOperationOkResult>>;
  listUserDevices(): Promise<MagicStudioApiListEnvelope<UserTrustedDevice>>;
  revokeUserDevice(
    deviceId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioOperationOkResult>>;
  readUserTwoFactorStatus(): Promise<MagicStudioApiEnvelope<UserTwoFactorStatus>>;
  setupUserTwoFactor(
    payload?: MagicStudioUserTwoFactorSetupRequest,
  ): Promise<MagicStudioApiEnvelope<UserTwoFactorSetup>>;
  verifyUserTwoFactor(
    payload: MagicStudioUserTwoFactorVerifyRequest,
  ): Promise<MagicStudioApiEnvelope<UserTwoFactorStatus>>;
  disableUserTwoFactor(): Promise<MagicStudioApiEnvelope<UserTwoFactorStatus>>;
  listUserBindings(): Promise<MagicStudioApiListEnvelope<UserBinding>>;
  bindUserEmail(
    payload: MagicStudioUserBindEmailRequest,
  ): Promise<MagicStudioApiEnvelope<UserProfile>>;
  unbindUserEmail(): Promise<MagicStudioApiEnvelope<UserProfile>>;
  bindUserPhone(
    payload: MagicStudioUserBindPhoneRequest,
  ): Promise<MagicStudioApiEnvelope<UserProfile>>;
  unbindUserPhone(): Promise<MagicStudioApiEnvelope<UserProfile>>;
  bindUserPlatform(
    platform: string,
    payload: MagicStudioUserThirdPartyBindRequest,
  ): Promise<MagicStudioApiEnvelope<UserBinding>>;
  unbindUserPlatform(
    platform: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioOperationOkResult>>;
  listGenerationTasks(
    query?: MagicStudioGenerationTaskListQuery,
  ): Promise<MagicStudioApiListEnvelope<MagicStudioGenerationTask>>;
  readGenerationTask(
    taskId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioGenerationTask>>;
  deleteGenerationTask(
    taskId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioGenerationTask>>;
  cancelGenerationTask(
    taskId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioGenerationTask>>;
  createImageGenerationTask(
    payload: MagicStudioImageGenerationRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioGenerationTask>>;
  createImageVariationTask(
    payload: MagicStudioImageGenerationRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioGenerationTask>>;
  createImageEditTask(
    payload: MagicStudioImageEditRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioGenerationTask>>;
  createImageUpscaleTask(
    payload: MagicStudioImageUpscaleRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioGenerationTask>>;
  enhanceImageGenerationPrompt(
    payload: MagicStudioGenerationPromptEnhanceRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioGenerationPromptEnhanceResult>>;
  readImageGenerationTask(
    taskId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioGenerationTask>>;
  createVideoGenerationTask(
    payload: MagicStudioVideoGenerationRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioGenerationTask>>;
  createImageToVideoTask(
    payload: MagicStudioVideoGenerationRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioGenerationTask>>;
  createVideoExtendTask(
    payload: MagicStudioVideoGenerationRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioGenerationTask>>;
  createVideoStyleTransferTask(
    payload: MagicStudioVideoGenerationRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioGenerationTask>>;
  createVideoLipSyncTask(
    payload: MagicStudioVideoGenerationRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioGenerationTask>>;
  enhanceVideoGenerationPrompt(
    payload: MagicStudioGenerationPromptEnhanceRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioGenerationPromptEnhanceResult>>;
  readVideoGenerationTask(
    taskId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioGenerationTask>>;
  cancelVideoGenerationTask(
    taskId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioGenerationTask>>;
  createAudioTextToSpeechTask(
    payload: MagicStudioAudioGenerationRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioGenerationTask>>;
  createAudioTranscriptionTask(
    payload: MagicStudioAudioGenerationRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioGenerationTask>>;
  createAudioTranslationTask(
    payload: MagicStudioAudioGenerationRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioGenerationTask>>;
  readAudioGenerationTask(
    taskId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioGenerationTask>>;
  createMusicGenerationTask(
    payload: MagicStudioMusicGenerationRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioGenerationTask>>;
  createMusicSimilarTask(
    payload: MagicStudioMusicSimilarRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioGenerationTask>>;
  createMusicRemixTask(
    payload: MagicStudioMusicRemixRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioGenerationTask>>;
  createMusicExtendTask(
    payload: MagicStudioMusicExtendRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioGenerationTask>>;
  readMusicGenerationTask(
    taskId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioGenerationTask>>;
  createSfxGenerationTask(
    payload: MagicStudioSfxGenerationRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioGenerationTask>>;
  listSfxGenerationTasks(
    query?: MagicStudioGenerationTaskListQuery,
  ): Promise<MagicStudioApiListEnvelope<MagicStudioGenerationTask>>;
  listSfxGenerationCategories(): Promise<MagicStudioApiListEnvelope<MagicStudioSfxCategory>>;
  readSfxGenerationTask(
    taskId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioGenerationTask>>;
  cancelSfxGenerationTask(
    taskId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioGenerationTask>>;
  createCharacterGenerationTask(
    payload: MagicStudioCharacterGenerationRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioGenerationTask>>;
  listCharacterGenerationTasks(
    query?: MagicStudioGenerationTaskListQuery,
  ): Promise<MagicStudioApiListEnvelope<MagicStudioGenerationTask>>;
  readCharacterGenerationTask(
    taskId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioGenerationTask>>;
  cancelCharacterGenerationTask(
    taskId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioGenerationTask>>;
  listMarketVoices(
    query?: MagicStudioVoiceListQuery,
  ): Promise<MagicStudioApiListEnvelope<MagicStudioVoiceSpeaker>>;
  listWorkspaceVoices(
    query?: MagicStudioVoiceListQuery,
  ): Promise<MagicStudioApiListEnvelope<MagicStudioVoiceSpeaker>>;
  listCustomVoices(
    query?: MagicStudioVoiceListQuery,
  ): Promise<MagicStudioApiListEnvelope<MagicStudioVoiceSpeaker>>;
  createCustomVoice(
    payload: MagicStudioCustomVoiceCreateRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioVoiceSpeaker>>;
  readVoiceSpeaker(
    speakerId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioVoiceSpeaker>>;
  updateCustomVoice(
    speakerId: string,
    payload: MagicStudioCustomVoiceUpdateRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioVoiceSpeaker>>;
  deleteCustomVoice(
    speakerId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioOperationOkResult>>;
  createVoiceCloneTask(
    payload: MagicStudioVoiceCloneTaskCreateRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioVoiceCloneTask>>;
  listVoiceCloneTasks(
    query?: MagicStudioVoiceCloneTaskListQuery,
  ): Promise<MagicStudioApiListEnvelope<MagicStudioVoiceCloneTask>>;
  readVoiceCloneTask(
    taskId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioVoiceCloneTask>>;
  deleteVoiceCloneTask(
    taskId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioOperationOkResult>>;
  cancelVoiceCloneTask(
    taskId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioVoiceCloneTask>>;
  updateVoicePreview(
    speakerId: string,
    payload: MagicStudioVoicePreviewRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioVoiceSpeaker>>;
  listVoiceSpeechTasks(
    query?: MagicStudioVoiceSpeechTaskListQuery,
  ): Promise<MagicStudioApiListEnvelope<MagicStudioGenerationTask>>;
  createVoiceSpeechTask(
    payload: MagicStudioVoiceSpeechTaskCreateRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioGenerationTask>>;
  readVoiceSpeechTask(
    taskId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioGenerationTask>>;
  updateVoiceSpeechTask(
    taskId: string,
    payload: MagicStudioVoiceSpeechTaskUpdateRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioGenerationTask>>;
  upsertVoiceSpeechTask(
    taskId: string,
    payload: MagicStudioVoiceSpeechTaskUpsertRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioGenerationTask>>;
  deleteVoiceSpeechTask(
    taskId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioOperationOkResult>>;
  cancelVoiceSpeechTask(
    taskId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioGenerationTask>>;
  optimizePrompt(
    payload: MagicStudioPromptOptimizeRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioPromptOptimizeResult>>;
  listDeployments(): Promise<MagicStudioApiListEnvelope<MagicStudioServerDeploymentRecord>>;
  readRuntimeAudit(): Promise<MagicStudioApiEnvelope<MagicStudioAdminRuntimeAudit>>;
  readJobMetrics(): Promise<MagicStudioApiEnvelope<MagicStudioAdminJobMetrics>>;
  readPolicyAudit(): Promise<MagicStudioApiEnvelope<MagicStudioAdminPolicyAudit>>;
  listStorageProviders(): Promise<MagicStudioApiListEnvelope<MagicStudioAdminStorageProvider>>;
  listAdminExecutionProviders(): Promise<
    MagicStudioApiListEnvelope<MagicStudioAdminExecutionProvider>
  >;
  readAdminExecutionProvider(
    providerKey: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioAdminExecutionProviderDetail>>;
  reconcileAdminExecutionProvider(
    providerKey: string,
    payload?: MagicStudioAdminExecutionProviderReconcileRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioAdminExecutionProviderDetail>>;
  listAdminExecutionProviderHealth(): Promise<
    MagicStudioApiListEnvelope<MagicStudioAdminExecutionProviderHealth>
  >;
  listAdminExecutionFailures(): Promise<
    MagicStudioApiListEnvelope<MagicStudioAdminExecutionFailure>
  >;
  acknowledgeAdminExecutionFailure(
    failureId: string,
    payload?: MagicStudioAdminExecutionFailureAcknowledgeRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioAdminExecutionFailure>>;
  retryAdminExecutionFailure(
    failureId: string,
    payload?: MagicStudioAdminExecutionFailureRetryRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioAdminExecutionFailureRetryResult>>;
  listAdminWorkspaceReleaseRetentionRuns(): Promise<
    MagicStudioApiListEnvelope<MagicStudioAdminWorkspaceReleaseRetentionRun>
  >;
  createAdminWorkspaceReleaseRetentionRun(
    payload?: MagicStudioAdminWorkspaceReleaseRetentionRunRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioAdminWorkspaceReleaseRetentionRunDetail>>;
  readAdminWorkspaceReleaseRetentionRun(
    runId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioAdminWorkspaceReleaseRetentionRunDetail>>;
  listAdminWorkspaceReleaseRetentionSchedules(): Promise<
    MagicStudioApiListEnvelope<MagicStudioAdminWorkspaceReleaseRetentionSchedule>
  >;
  createAdminWorkspaceReleaseRetentionSchedule(
    payload: MagicStudioAdminWorkspaceReleaseRetentionScheduleCreateRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioAdminWorkspaceReleaseRetentionSchedule>>;
  readAdminWorkspaceReleaseRetentionSchedule(
    scheduleId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioAdminWorkspaceReleaseRetentionSchedule>>;
  updateAdminWorkspaceReleaseRetentionSchedule(
    scheduleId: string,
    payload: MagicStudioAdminWorkspaceReleaseRetentionScheduleUpdateRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioAdminWorkspaceReleaseRetentionSchedule>>;
  triggerAdminWorkspaceReleaseRetentionSchedule(
    scheduleId: string,
    payload?: MagicStudioAdminWorkspaceReleaseRetentionScheduleTriggerRequest,
  ): Promise<
    MagicStudioApiEnvelope<MagicStudioAdminWorkspaceReleaseRetentionScheduleTriggerResult>
  >;
  listAdminPlugins(): Promise<MagicStudioApiListEnvelope<MagicStudioAdminPluginRecord>>;
  enablePlugin(
    pluginId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioAdminPluginRecord>>;
  disablePlugin(
    pluginId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioAdminPluginRecord>>;
  readPolicySnapshot(): Promise<MagicStudioApiEnvelope<MagicStudioPolicySnapshot>>;
  validatePolicyPath(
    payload: MagicStudioPolicyPathValidationRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioPolicyValidationResult>>;
  validatePolicyCommand(
    payload: MagicStudioPolicyCommandValidationRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioPolicyValidationResult>>;
  readMigrationStatus(
    payload: MagicStudioMigrationStatusRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioMigrationStatus>>;
  applyMigrations(
    payload: MagicStudioMigrationApplyRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioMigrationApplyResult>>;
  mediaProbe(payload: MagicStudioMediaProbeRequest): Promise<MagicStudioApiEnvelope<MagicStudioMediaProbeResult>>;
  mediaImageResize(
    payload: MagicStudioMediaImageResizeRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioToolkitCommandResult>>;
  mediaVideoConcat(
    payload: MagicStudioMediaVideoConcatRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioToolkitCommandResult>>;
  mediaVideoTranscode(
    payload: MagicStudioMediaVideoTranscodeRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioToolkitCommandResult>>;
  mediaVideoTrim(
    payload: MagicStudioMediaVideoTrimRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioToolkitCommandResult>>;
  mediaVideoExtractAudio(
    payload: MagicStudioMediaVideoExtractAudioRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioToolkitCommandResult>>;
  mediaVideoCreateThumbnail(
    payload: MagicStudioMediaVideoThumbnailRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioToolkitCommandResult>>;
  mediaAudioConvert(
    payload: MagicStudioMediaAudioConvertRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioToolkitCommandResult>>;
  mediaAudioNormalize(
    payload: MagicStudioMediaAudioNormalizeRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioToolkitCommandResult>>;
  mediaAudioMix(
    payload: MagicStudioMediaAudioMixRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioToolkitCommandResult>>;
  zipLocalPaths(
    payload: MagicStudioCompressionZipRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioCompressionZipResult>>;
  unzipToDirectory(
    payload: MagicStudioCompressionUnzipRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioOperationOkResult>>;
  executeSql(
    payload: MagicStudioSqlExecuteRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioSqlExecuteResult>>;
  querySql<T extends MagicStudioSqlRow = MagicStudioSqlRow>(
    payload: MagicStudioSqlExecuteRequest,
  ): Promise<MagicStudioApiListEnvelope<T>>;
  executeSqlBatch(
    payload: MagicStudioSqlExecuteBatchRequest,
  ): Promise<MagicStudioApiEnvelope<MagicStudioOperationOkResult>>;
  submitToolkitJob(
    payload: MagicStudioToolkitJobSubmission,
  ): Promise<MagicStudioApiEnvelope<MagicStudioToolkitJobSnapshot>>;
  readToolkitJob(
    jobId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioToolkitJobSnapshot>>;
  listToolkitJobs(): Promise<MagicStudioApiListEnvelope<MagicStudioToolkitJobSnapshot>>;
  cancelToolkitJob(
    jobId: string,
  ): Promise<MagicStudioApiEnvelope<MagicStudioToolkitJobSnapshot>>;
}

export interface MagicStudioServerClientErrorOptions {
  status: number;
  code?: string;
  detail?: string;
  retryable?: boolean;
  requestId?: string;
  timestamp?: string;
  fieldErrors?: Record<string, string>;
  cause?: unknown;
}

export class MagicStudioServerClientError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly detail?: string;
  readonly retryable: boolean;
  readonly requestId?: string;
  readonly timestamp?: string;
  readonly fieldErrors?: Record<string, string>;

  constructor(message: string, options: MagicStudioServerClientErrorOptions) {
    super(message, options.cause ? { cause: options.cause } : undefined);
    this.name = 'MagicStudioServerClientError';
    this.status = options.status;
    this.code = options.code;
    this.detail = options.detail;
    this.retryable = options.retryable ?? false;
    this.requestId = options.requestId;
    this.timestamp = options.timestamp;
    this.fieldErrors = options.fieldErrors;
  }
}

export function isMagicStudioServerClientError(
  error: unknown,
): error is MagicStudioServerClientError {
  return error instanceof MagicStudioServerClientError;
}

export function isMagicStudioServerResourceNotFoundError(
  error: unknown,
  acceptedCodes: readonly string[],
): error is MagicStudioServerClientError {
  return (
    isMagicStudioServerClientError(error)
    && error.status === 404
    && typeof error.code === 'string'
    && acceptedCodes.includes(error.code)
  );
}

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

function appendQueryValue(
  searchParams: URLSearchParams,
  key: string,
  value: unknown,
): void {
  if (value === undefined || value === null) {
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      appendQueryValue(searchParams, key, item);
    }
    return;
  }

  searchParams.append(key, String(value));
}

function withQuery(
  path: string,
  query?: object,
): string {
  if (!query) {
    return path;
  }

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(query as Record<string, unknown>)) {
    appendQueryValue(searchParams, key, value);
  }

  const serialized = searchParams.toString();
  return serialized ? `${path}?${serialized}` : path;
}

async function readJson<T>(
  fetchImpl: typeof fetch,
  url: string,
  init: RequestInit,
): Promise<T> {
  const response = await fetchImpl(url, init);
  const text = await response.text();
  let payload: unknown = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch (error) {
      if (response.ok) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Invalid JSON response for ${url}: ${message}`);
      }
      payload = text;
    }
  }

  if (!response.ok) {
    const problem =
      payload && typeof payload === 'object' && 'error' in payload
        ? (payload as MagicStudioApiProblemEnvelope)
        : null;
    const message =
      problem?.error?.message
      || (typeof payload === 'string' && payload.trim())
      || `HTTP ${response.status} for ${url}`;
    throw new MagicStudioServerClientError(message, {
      status: response.status,
      code: problem?.error?.code,
      detail: problem?.error?.detail,
      retryable: problem?.error?.retryable,
      requestId: problem?.requestId,
      timestamp: problem?.timestamp,
      fieldErrors: problem?.error?.fieldErrors,
    });
  }

  return payload as T;
}

function getJson<T>(fetchImpl: typeof fetch, baseUrl: string, path: string): Promise<T> {
  return readJson(fetchImpl, joinUrl(baseUrl, path), {
    method: 'GET',
  });
}

function sendJson<T>(
  fetchImpl: typeof fetch,
  baseUrl: string,
  path: string,
  init: RequestInit,
): Promise<T> {
  return readJson(fetchImpl, joinUrl(baseUrl, path), init);
}

function postJson<TResponse, TRequest>(
  fetchImpl: typeof fetch,
  baseUrl: string,
  path: string,
  payload: TRequest,
): Promise<TResponse> {
  return readJson(fetchImpl, joinUrl(baseUrl, path), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

function putJson<TResponse, TRequest>(
  fetchImpl: typeof fetch,
  baseUrl: string,
  path: string,
  payload: TRequest,
): Promise<TResponse> {
  return readJson(fetchImpl, joinUrl(baseUrl, path), {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

function patchJson<TResponse, TRequest>(
  fetchImpl: typeof fetch,
  baseUrl: string,
  path: string,
  payload: TRequest,
): Promise<TResponse> {
  return readJson(fetchImpl, joinUrl(baseUrl, path), {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export function createMagicStudioServerClient(
  options: MagicStudioServerClientOptions = {},
): MagicStudioServerClient {
  const host = options.host ?? MAGIC_STUDIO_SERVER_RUNTIME;
  const baseUrl = options.baseUrl?.trim() || host.apiBaseUrl;
  const fetchImpl = options.fetch ?? fetch;

  return {
    host: {
      ...host,
      apiBaseUrl: baseUrl,
    },
    healthz: async () => getJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_HEALTH_PATH),
    readOpenApiDocument: async () =>
      getJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_LIVE_OPENAPI_PATH),
    readRouteCatalog: async () =>
      getJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_ROUTE_CATALOG_PATH),
    readRuntimeSummary: async () =>
      getJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_RUNTIME_SUMMARY_PATH),
    readToolkitCapabilities: async () =>
      getJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_TOOLKIT_CAPABILITIES_PATH),
    readAppCapabilitySummary: async () =>
      getJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_CAPABILITIES_SUMMARY_PATH),
    listAppCapabilityDomains: async () =>
      getJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_CAPABILITIES_DOMAINS_PATH),
    listAppExecutionCapabilities: async () =>
      getJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_CAPABILITIES_EXECUTION_PATH),
    readCreationCapabilities: async (query) =>
      getJson(
        fetchImpl,
        baseUrl,
        withQuery(MAGIC_STUDIO_SERVER_APP_CREATION_CAPABILITIES_PATH, query),
      ),
    listCreationBatches: async (query) =>
      getJson(
        fetchImpl,
        baseUrl,
        withQuery(MAGIC_STUDIO_SERVER_APP_CREATION_BATCHES_PATH, query),
      ),
    createCreationBatch: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_CREATION_BATCHES_PATH, payload),
    readCreationBatch: async (batchId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appCreationReadBatch', {
          batchId,
        }),
      ),
    updateCreationBatch: async (batchId, payload) =>
      patchJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appCreationUpdateBatch', {
          batchId,
        }),
        payload,
      ),
    deleteCreationBatch: async (batchId) =>
      sendJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appCreationDeleteBatch', {
          batchId,
        }),
        {
          method: 'DELETE',
        },
      ),
    materializeCreationBatch: async (batchId, payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appCreationMaterializeBatch', {
          batchId,
        }),
        payload,
      ),
    updateCreationBatchItemStatus: async (batchId, itemId, payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appCreationUpdateBatchItemStatus', {
          batchId,
          itemId,
        }),
        payload,
      ),
    listCreationPresets: async (query) =>
      getJson(
        fetchImpl,
        baseUrl,
        withQuery(MAGIC_STUDIO_SERVER_APP_CREATION_PRESETS_PATH, query),
      ),
    createCreationPreset: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_CREATION_PRESETS_PATH, payload),
    readCreationPreset: async (presetId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appCreationReadPreset', {
          presetId,
        }),
      ),
    updateCreationPreset: async (presetId, payload) =>
      patchJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appCreationUpdatePreset', {
          presetId,
        }),
        payload,
      ),
    deleteCreationPreset: async (presetId) =>
      sendJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appCreationDeletePreset', {
          presetId,
        }),
        {
          method: 'DELETE',
        },
      ),
    listCreationTemplates: async (query) =>
      getJson(
        fetchImpl,
        baseUrl,
        withQuery(MAGIC_STUDIO_SERVER_APP_CREATION_TEMPLATES_PATH, query),
      ),
    createCreationTemplate: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_CREATION_TEMPLATES_PATH, payload),
    readCreationTemplate: async (templateId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appCreationReadTemplate', {
          templateId,
        }),
      ),
    updateCreationTemplate: async (templateId, payload) =>
      patchJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appCreationUpdateTemplate', {
          templateId,
        }),
        payload,
      ),
    deleteCreationTemplate: async (templateId) =>
      sendJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appCreationDeleteTemplate', {
          templateId,
        }),
        {
          method: 'DELETE',
        },
      ),
    applyCreationTemplate: async (templateId, payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appCreationApplyTemplate', {
          templateId,
        }),
        payload,
      ),
    listGenerationCatalogModels: async (query) =>
      getJson(
        fetchImpl,
        baseUrl,
        withQuery(MAGIC_STUDIO_SERVER_APP_GENERATION_CATALOG_MODELS_PATH, query),
      ),
    listGenerationCatalogStyles: async (query) =>
      getJson(
        fetchImpl,
        baseUrl,
        withQuery(MAGIC_STUDIO_SERVER_APP_GENERATION_CATALOG_STYLES_PATH, query),
      ),
    listGenerationCatalogProviders: async (query) =>
      getJson(
        fetchImpl,
        baseUrl,
        withQuery(MAGIC_STUDIO_SERVER_APP_GENERATION_CATALOG_PROVIDERS_PATH, query),
      ),
    listGenerationCatalogVoices: async (query) =>
      getJson(
        fetchImpl,
        baseUrl,
        withQuery(MAGIC_STUDIO_SERVER_APP_GENERATION_CATALOG_VOICES_PATH, query),
      ),
    listGenerationTasks: async (query) =>
      getJson(
        fetchImpl,
        baseUrl,
        withQuery(MAGIC_STUDIO_SERVER_APP_GENERATION_TASKS_PATH, query),
      ),
    readGenerationTask: async (taskId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appGenerationReadTask', {
          taskId,
        }),
      ),
    deleteGenerationTask: async (taskId) =>
      sendJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appGenerationDeleteTask', {
          taskId,
        }),
        {
          method: 'DELETE',
        },
      ),
    cancelGenerationTask: async (taskId) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appGenerationCancelTask', {
          taskId,
        }),
        null,
      ),
    readCreationHistoryEntry: async (entryId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appCreationReadHistoryEntry', {
          entryId,
        }),
      ),
    listCreationHistory: async (query) =>
      getJson(
        fetchImpl,
        baseUrl,
        withQuery(MAGIC_STUDIO_SERVER_APP_CREATION_HISTORY_PATH, query),
      ),
    upsertCreationHistoryEntry: async (payload) =>
      putJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_CREATION_HISTORY_PATH, payload),
    setCreationHistoryEntryFavorite: async (entryId, payload) =>
      sendJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appCreationFavoriteHistoryEntry', {
          entryId,
        }),
        {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ),
    deleteCreationHistoryEntry: async (entryId) =>
      sendJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appCreationDeleteHistoryEntry', {
          entryId,
        }),
        {
          method: 'DELETE',
        },
      ),
    clearCreationHistory: async (query) =>
      sendJson(
        fetchImpl,
        baseUrl,
        withQuery(MAGIC_STUDIO_SERVER_APP_CREATION_HISTORY_PATH, query),
        {
          method: 'DELETE',
        },
      ),
    createCreationSession: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_CREATION_SESSIONS_PATH, payload),
    readCurrentCreationSession: async (query) =>
      getJson(
        fetchImpl,
        baseUrl,
        withQuery(MAGIC_STUDIO_SERVER_APP_CREATION_CURRENT_SESSION_PATH, query),
      ),
    consumeCurrentCreationSession: async (query) =>
      sendJson(
        fetchImpl,
        baseUrl,
        withQuery(MAGIC_STUDIO_SERVER_APP_CREATION_CONSUME_CURRENT_SESSION_PATH, query),
        {
          method: 'POST',
        },
      ),
    clearCurrentCreationSession: async (query) =>
      sendJson(
        fetchImpl,
        baseUrl,
        withQuery(MAGIC_STUDIO_SERVER_APP_CREATION_CURRENT_SESSION_PATH, query),
        {
          method: 'DELETE',
        },
      ),
    listChatSessions: async (query) =>
      getJson(fetchImpl, baseUrl, withQuery(MAGIC_STUDIO_SERVER_APP_CHAT_SESSIONS_PATH, query)),
    createChatSession: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_CHAT_SESSIONS_PATH, payload),
    readChatSession: async (sessionId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appChatReadSession', {
          sessionId,
        }),
      ),
    updateChatSession: async (sessionId, payload) =>
      patchJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appChatUpdateSession', {
          sessionId,
        }),
        payload,
      ),
    deleteChatSession: async (sessionId) =>
      sendJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appChatDeleteSession', {
          sessionId,
        }),
        {
          method: 'DELETE',
        },
      ),
    readChatTranscript: async (sessionId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appChatReadTranscript', {
          sessionId,
        }),
      ),
    updateChatTranscript: async (sessionId, payload) =>
      putJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appChatUpdateTranscript', {
          sessionId,
        }),
        payload,
      ),
    readFileSystemDirectory: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_FILESYSTEM_READ_DIR_PATH, payload),
    readFileSystemText: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_FILESYSTEM_READ_TEXT_PATH, payload),
    readFileSystemBytes: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_FILESYSTEM_READ_BYTES_PATH, payload),
    writeFileSystemText: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_FILESYSTEM_WRITE_TEXT_PATH, payload),
    writeFileSystemBytes: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_FILESYSTEM_WRITE_BYTES_PATH, payload),
    statFileSystemPath: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_FILESYSTEM_STAT_PATH, payload),
    checkFileSystemPathExists: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_FILESYSTEM_EXISTS_PATH, payload),
    ensureFileSystemDirectory: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_FILESYSTEM_ENSURE_DIR_PATH, payload),
    removeFileSystemPath: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_FILESYSTEM_REMOVE_PATH, payload),
    renameFileSystemPath: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_FILESYSTEM_RENAME_PATH, payload),
    copyFileSystemFile: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_FILESYSTEM_COPY_FILE_PATH, payload),
    listPlugins: async () => getJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_PLUGINS_PATH),
    readAuthSession: async () =>
      getJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_AUTH_SESSION_PATH),
    login: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_AUTH_LOGIN_PATH, payload),
    loginWithPhone: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_AUTH_LOGIN_PHONE_PATH, payload),
    register: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_AUTH_REGISTER_PATH, payload),
    logout: async () =>
      sendJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_AUTH_LOGOUT_PATH, {
        method: 'POST',
      }),
    refreshSession: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_AUTH_REFRESH_TOKEN_PATH, payload),
    sendVerifyCode: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_AUTH_VERIFY_CODE_SEND_PATH, payload),
    checkVerifyCode: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_AUTH_VERIFY_CODE_CHECK_PATH, payload),
    requestPasswordReset: async (payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        MAGIC_STUDIO_SERVER_APP_AUTH_PASSWORD_RESET_REQUEST_PATH,
        payload,
      ),
    resetPassword: async (payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        MAGIC_STUDIO_SERVER_APP_AUTH_PASSWORD_RESET_CONFIRM_PATH,
        payload,
      ),
    createLoginQrCode: async () =>
      sendJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_AUTH_QR_CODE_PATH, {
        method: 'POST',
      }),
    readLoginQrCodeStatus: async (qrKey) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appAuthReadQrCodeStatus', {
          qrKey,
        }),
      ),
    readAppSettings: async () =>
      getJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_SETTINGS_PATH),
    updateAppSettings: async (payload) =>
      putJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_SETTINGS_PATH, payload),
    listNotifications: async () =>
      getJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_NOTIFICATIONS_PATH),
    createNotification: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_NOTIFICATIONS_PATH, payload),
    markNotificationAsRead: async (notificationId) =>
      sendJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appNotificationsMarkRead', {
          notificationId,
        }),
        {
          method: 'POST',
        },
      ),
    markAllNotificationsAsRead: async () =>
      sendJson(
        fetchImpl,
        baseUrl,
        MAGIC_STUDIO_SERVER_APP_NOTIFICATIONS_MARK_ALL_READ_PATH,
        {
          method: 'POST',
        },
      ),
    readNotificationUnreadCount: async () =>
      getJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_NOTIFICATIONS_UNREAD_COUNT_PATH),
    deleteNotifications: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_NOTIFICATIONS_DELETE_PATH, payload),
    listWorkspaces: async () =>
      getJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_WORKSPACES_PATH),
    createWorkspace: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_WORKSPACES_PATH, payload),
    readWorkspace: async (workspaceId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appWorkspacesRead', {
          workspaceId,
        }),
      ),
    updateWorkspace: async (workspaceId, payload) =>
      patchJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appWorkspacesUpdate', {
          workspaceId,
        }),
        payload,
      ),
    deleteWorkspace: async (workspaceId) =>
      sendJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appWorkspacesDelete', {
          workspaceId,
        }),
        {
          method: 'DELETE',
        },
      ),
    listRecentWorkspaceProjects: async () =>
      getJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_WORKSPACE_RECENT_PROJECTS_PATH),
    listWorkspaceProjects: async (workspaceId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appWorkspaceProjectsList', {
          workspaceId,
        }),
      ),
    createWorkspaceProject: async (workspaceId, payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appWorkspaceProjectsCreate', {
          workspaceId,
        }),
        payload,
      ),
    readWorkspaceProject: async (workspaceId, projectId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appWorkspaceProjectsRead', {
          workspaceId,
          projectId,
        }),
      ),
    openWorkspaceProject: async (workspaceId, projectId) =>
      sendJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appWorkspaceProjectsOpen', {
          workspaceId,
          projectId,
        }),
        {
          method: 'POST',
        },
      ),
    duplicateWorkspaceProject: async (workspaceId, projectId) =>
      sendJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appWorkspaceProjectsDuplicate', {
          workspaceId,
          projectId,
        }),
        {
          method: 'POST',
        },
      ),
    archiveWorkspaceProject: async (workspaceId, projectId) =>
      sendJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appWorkspaceProjectsArchive', {
          workspaceId,
          projectId,
        }),
        {
          method: 'POST',
        },
      ),
    restoreWorkspaceProject: async (workspaceId, projectId) =>
      sendJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appWorkspaceProjectsRestore', {
          workspaceId,
          projectId,
        }),
        {
          method: 'POST',
        },
      ),
    readWorkspaceProjectSession: async (workspaceId, projectId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appWorkspaceProjectsReadSession', {
          workspaceId,
          projectId,
        }),
      ),
    upsertWorkspaceProjectSession: async (workspaceId, projectId, payload) =>
      putJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appWorkspaceProjectsUpsertSession', {
          workspaceId,
          projectId,
        }),
        payload,
      ),
    deleteWorkspaceProjectSession: async (workspaceId, projectId) =>
      sendJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appWorkspaceProjectsDeleteSession', {
          workspaceId,
          projectId,
        }),
        {
          method: 'DELETE',
        },
      ),
    syncWorkspaceProjectToGit: async (workspaceId, projectId, payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appWorkspaceProjectsGitSync', {
          workspaceId,
          projectId,
        }),
        payload,
      ),
    listWorkspaceProjectGitSyncs: async (workspaceId, projectId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appWorkspaceProjectsListGitSyncs', {
          workspaceId,
          projectId,
        }),
      ),
    readLatestWorkspaceProjectGitSync: async (workspaceId, projectId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appWorkspaceProjectsReadLatestGitSync', {
          workspaceId,
          projectId,
        }),
      ),
    readWorkspaceProjectGitSync: async (workspaceId, projectId, syncId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appWorkspaceProjectsReadGitSync', {
          workspaceId,
          projectId,
          syncId,
        }),
      ),
    retryWorkspaceProjectGitSync: async (workspaceId, projectId, syncId, payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appWorkspaceProjectsRetryGitSync', {
          workspaceId,
          projectId,
          syncId,
        }),
        payload,
      ),
    listWorkspaceProjectReleases: async (workspaceId, projectId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appWorkspaceProjectsListReleases', {
          workspaceId,
          projectId,
        }),
      ),
    readWorkspaceProjectReleaseStats: async (workspaceId, projectId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appWorkspaceProjectsReadReleaseStats', {
          workspaceId,
          projectId,
        }),
      ),
    pruneWorkspaceProjectReleases: async (workspaceId, projectId, payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appWorkspaceProjectsPruneReleases', {
          workspaceId,
          projectId,
        }),
        payload,
      ),
    readWorkspaceProjectReleaseRetentionPolicy: async (workspaceId, projectId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appWorkspaceProjectsReadReleaseRetentionPolicy', {
          workspaceId,
          projectId,
        }),
      ),
    updateWorkspaceProjectReleaseRetentionPolicy: async (workspaceId, projectId, payload) =>
      putJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appWorkspaceProjectsUpdateReleaseRetentionPolicy', {
          workspaceId,
          projectId,
        }),
        payload,
      ),
    applyWorkspaceProjectReleaseRetentionPolicy: async (workspaceId, projectId, payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appWorkspaceProjectsApplyReleaseRetentionPolicy', {
          workspaceId,
          projectId,
        }),
        payload,
      ),
    createWorkspaceProjectRelease: async (workspaceId, projectId, payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appWorkspaceProjectsCreateRelease', {
          workspaceId,
          projectId,
        }),
        payload,
      ),
    readLatestWorkspaceProjectRelease: async (workspaceId, projectId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appWorkspaceProjectsReadLatestRelease', {
          workspaceId,
          projectId,
        }),
      ),
    readWorkspaceProjectRelease: async (workspaceId, projectId, releaseId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appWorkspaceProjectsReadRelease', {
          workspaceId,
          projectId,
          releaseId,
        }),
      ),
    deleteWorkspaceProjectRelease: async (workspaceId, projectId, releaseId) =>
      sendJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appWorkspaceProjectsDeleteRelease', {
          workspaceId,
          projectId,
          releaseId,
        }),
        {
          method: 'DELETE',
        },
      ),
    restoreWorkspaceProjectRelease: async (workspaceId, projectId, releaseId) =>
      sendJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appWorkspaceProjectsRestoreRelease', {
          workspaceId,
          projectId,
          releaseId,
        }),
        {
          method: 'POST',
        },
      ),
    readWorkspaceProjectReleaseManifest: async (workspaceId, projectId, releaseId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appWorkspaceProjectsReadReleaseManifest', {
          workspaceId,
          projectId,
          releaseId,
        }),
      ),
    rebuildWorkspaceProjectRelease: async (workspaceId, projectId, releaseId) =>
      sendJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appWorkspaceProjectsRebuildRelease', {
          workspaceId,
          projectId,
          releaseId,
        }),
        {
          method: 'POST',
        },
      ),
    updateWorkspaceProject: async (workspaceId, projectId, payload) =>
      patchJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appWorkspaceProjectsUpdate', {
          workspaceId,
          projectId,
        }),
        payload,
      ),
    deleteWorkspaceProject: async (workspaceId, projectId) =>
      sendJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appWorkspaceProjectsDelete', {
          workspaceId,
          projectId,
        }),
        {
          method: 'DELETE',
        },
      ),
    listAssets: async (query) =>
      getJson(fetchImpl, baseUrl, withQuery(MAGIC_STUDIO_SERVER_APP_ASSETS_PATH, query)),
    readAssetStats: async (query) =>
      getJson(
        fetchImpl,
        baseUrl,
        withQuery(MAGIC_STUDIO_SERVER_APP_ASSETS_STATS_PATH, query),
      ),
    listAssetCategories: async () =>
      getJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_ASSET_CATEGORIES_PATH),
    importAssetFile: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_ASSET_IMPORT_FILE_PATH, payload),
    importAssetUrl: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_ASSET_IMPORT_URL_PATH, payload),
    readAsset: async (assetId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appAssetsRead', {
          assetId,
        }),
      ),
    upsertAsset: async (assetId, payload) =>
      putJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appAssetsUpsert', {
          assetId,
        }),
        payload,
      ),
    updateAsset: async (assetId, payload) =>
      patchJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appAssetsUpdate', {
          assetId,
        }),
        payload,
      ),
    deleteAsset: async (assetId) =>
      sendJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appAssetsDelete', {
          assetId,
        }),
        {
          method: 'DELETE',
        },
      ),
    readDriveRoot: async () =>
      getJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_DRIVE_ROOT_PATH),
    listDriveEntries: async (query) =>
      getJson(
        fetchImpl,
        baseUrl,
        withQuery(MAGIC_STUDIO_SERVER_APP_DRIVE_ENTRIES_PATH, query),
      ),
    readDriveStats: async () =>
      getJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_DRIVE_STATS_PATH),
    listFilmProjects: async (query) =>
      getJson(
        fetchImpl,
        baseUrl,
        withQuery(MAGIC_STUDIO_SERVER_APP_FILM_PROJECTS_PATH, query),
      ),
    createFilmProject: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_FILM_PROJECTS_PATH, payload),
    listFilmPresets: async () =>
      getJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_FILM_PRESETS_PATH),
    createFilmPreset: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_FILM_PRESETS_PATH, payload),
    listFilmTemplates: async (query) =>
      getJson(fetchImpl, baseUrl, withQuery(MAGIC_STUDIO_SERVER_APP_FILM_TEMPLATES_PATH, query)),
    createFilmTemplate: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_FILM_TEMPLATES_PATH, payload),
    readFilmTemplate: async (templateId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appFilmTemplatesRead', {
          templateId,
        }),
      ),
    updateFilmTemplate: async (templateId, payload) =>
      putJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appFilmTemplatesRead', {
          templateId,
        }),
        payload,
      ),
    instantiateFilmTemplate: async (templateId, payload = {}) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appFilmTemplatesInstantiate', {
          templateId,
        }),
        payload,
      ),
    deleteFilmTemplate: async (templateId) =>
      sendJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appFilmTemplatesRead', {
          templateId,
        }),
        {
          method: 'DELETE',
        },
      ),
    createFilmTemplateSnapshot: async (projectId, payload = {}) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appFilmProjectsCreateTemplateSnapshot', {
          projectId,
        }),
        payload,
      ),
    readFilmProject: async (projectId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appFilmProjectsRead', {
          projectId,
        }),
      ),
    readFilmProjectGraph: async (projectId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appFilmProjectsReadProjectGraph', {
          projectId,
        }),
      ),
    readFilmProjectAssetInventory: async (projectId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appFilmProjectsReadAssetInventory', {
          projectId,
        }),
      ),
    listFilmProjectPublishes: async (projectId, query) =>
      getJson(
        fetchImpl,
        baseUrl,
        withQuery(
          resolveMagicStudioServerRoutePath('appFilmProjectsListPublishes', {
            projectId,
          }),
          query,
        ),
      ),
    listFilmProjectReviewQueue: async (projectId, query) =>
      getJson(
        fetchImpl,
        baseUrl,
        withQuery(
          resolveMagicStudioServerRoutePath('appFilmProjectsListReviewQueue', {
            projectId,
          }),
          query,
        ),
      ),
    readFilmProjectReviewPortfolioDashboard: async (projectId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath(
          'appFilmProjectsReadReviewPortfolioDashboard',
          {
            projectId,
          },
        ),
      ),
    readFilmProjectReviewReviewerCapacity: async (projectId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath(
          'appFilmProjectsReadReviewReviewerCapacity',
          {
            projectId,
          },
        ),
      ),
    readFilmProjectReviewDecisionFreshness: async (projectId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath(
          'appFilmProjectsReadReviewDecisionFreshness',
          {
            projectId,
          },
        ),
      ),
    readFilmProjectReviewGovernanceDrift: async (projectId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath(
          'appFilmProjectsReadReviewGovernanceDrift',
          {
            projectId,
          },
        ),
      ),
    readFilmProjectReviewEscalationForecast: async (projectId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath(
          'appFilmProjectsReadReviewEscalationForecast',
          {
            projectId,
          },
        ),
      ),
    readFilmProjectReviewDependencyGraph: async (projectId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath(
          'appFilmProjectsReadReviewDependencyGraph',
          {
            projectId,
          },
        ),
      ),
    readFilmProjectReviewInterventionPlan: async (projectId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath(
          'appFilmProjectsReadReviewInterventionPlan',
          {
            projectId,
          },
        ),
      ),
    readFilmProjectReviewRecoveryOrchestration: async (projectId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath(
          'appFilmProjectsReadReviewRecoveryOrchestration',
          {
            projectId,
          },
        ),
      ),
    readFilmProjectReviewApprovalBurnDown: async (projectId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appFilmProjectsReadReviewApprovalBurnDown', {
          projectId,
        }),
      ),
    readFilmProjectReviewEffectivenessBaseline: async (projectId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath(
          'appFilmProjectsReadReviewEffectivenessBaseline',
          {
            projectId,
          },
        ),
      ),
    readFilmProjectReviewInterventionExecutionHistory: async (projectId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath(
          'appFilmProjectsReadReviewInterventionExecutionHistory',
          {
            projectId,
          },
        ),
      ),
    readFilmProjectReviewInterventionOutcomes: async (projectId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appFilmProjectsReadReviewInterventionOutcomes', {
          projectId,
        }),
      ),
    readFilmProjectPublish: async (projectId, publishId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appFilmProjectsReadPublish', {
          projectId,
          publishId,
        }),
      ),
    readFilmProjectPublishReviewState: async (projectId, publishId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appFilmProjectsReadPublishReviewState', {
          projectId,
          publishId,
        }),
      ),
    readFilmProjectPublishReviewTimeline: async (projectId, publishId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appFilmProjectsReadPublishReviewTimeline', {
          projectId,
          publishId,
        }),
      ),
    readFilmProjectPublishReviewRounds: async (projectId, publishId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appFilmProjectsReadPublishReviewRounds', {
          projectId,
          publishId,
        }),
      ),
    readFilmProjectPublishReviewAnchors: async (projectId, publishId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appFilmProjectsReadPublishReviewAnchors', {
          projectId,
          publishId,
        }),
      ),
    readFilmProjectPublishReviewActivity: async (projectId, publishId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appFilmProjectsReadPublishReviewActivity', {
          projectId,
          publishId,
        }),
      ),
    readFilmProjectPublishReviewAnchorResponsibility: async (projectId, publishId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath(
          'appFilmProjectsReadPublishReviewAnchorResponsibility',
          {
            projectId,
            publishId,
          },
        ),
      ),
    readFilmProjectPublishReviewReviewerBacklog: async (projectId, publishId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath(
          'appFilmProjectsReadPublishReviewReviewerBacklog',
          {
            projectId,
            publishId,
          },
        ),
      ),
    readFilmProjectPublishReviewDecisionMatrix: async (projectId, publishId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath(
          'appFilmProjectsReadPublishReviewDecisionMatrix',
          {
            projectId,
            publishId,
          },
        ),
      ),
    readFilmProjectPublishReviewReadiness: async (projectId, publishId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appFilmProjectsReadPublishReviewReadiness', {
          projectId,
          publishId,
        }),
      ),
    readFilmProjectPublishReviewReviewerAttention: async (projectId, publishId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath(
          'appFilmProjectsReadPublishReviewReviewerAttention',
          {
            projectId,
            publishId,
          },
        ),
      ),
    readFilmProjectPublishReviewReviewerCoverage: async (projectId, publishId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath(
          'appFilmProjectsReadPublishReviewReviewerCoverage',
          {
            projectId,
            publishId,
          },
        ),
      ),
    readFilmProjectPublishReviewOperationsDashboard: async (projectId, publishId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath(
          'appFilmProjectsReadPublishReviewOperationsDashboard',
          {
            projectId,
            publishId,
          },
        ),
      ),
    readFilmProjectPublishReviewStaleDecisions: async (projectId, publishId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath(
          'appFilmProjectsReadPublishReviewStaleDecisions',
          {
            projectId,
            publishId,
          },
        ),
      ),
    readFilmProjectPublishReviewLatencyAnalytics: async (projectId, publishId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath(
          'appFilmProjectsReadPublishReviewLatencyAnalytics',
          {
            projectId,
            publishId,
          },
        ),
      ),
    readFilmProjectPublishReviewWorklist: async (projectId, publishId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appFilmProjectsReadPublishReviewWorklist', {
          projectId,
          publishId,
        }),
      ),
    approveFilmProjectPublish: async (projectId, publishId, payload = {}) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appFilmProjectsApprovePublish', {
          projectId,
          publishId,
        }),
        payload,
      ),
    requestFilmProjectPublishChanges: async (projectId, publishId, payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appFilmProjectsRequestPublishChanges', {
          projectId,
          publishId,
        }),
        payload,
      ),
    createFilmProjectPublishReviewComment: async (projectId, publishId, payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appFilmProjectsCreatePublishReviewComment', {
          projectId,
          publishId,
        }),
        payload,
      ),
    submitFilmProjectPublishReview: async (projectId, publishId, payload = {}) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appFilmProjectsSubmitPublishReview', {
          projectId,
          publishId,
        }),
        payload,
      ),
    consensusFilmProjectPublishReview: async (projectId, publishId, payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appFilmProjectsConsensusPublishReview', {
          projectId,
          publishId,
        }),
        payload,
      ),
    resolveFilmProjectPublishReviewComment: async (projectId, publishId, commentId, payload = {}) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appFilmProjectsResolvePublishReviewComment', {
          projectId,
          publishId,
          commentId,
        }),
        payload,
      ),
    setFilmProjectPublishReviewAssignments: async (projectId, publishId, payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appFilmProjectsSetPublishReviewAssignments', {
          projectId,
          publishId,
        }),
        payload,
      ),
    reopenFilmProjectPublish: async (projectId, publishId, payload = {}) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appFilmProjectsReopenPublish', {
          projectId,
          publishId,
        }),
        payload,
      ),
    restoreFilmProjectPublish: async (projectId, publishId, payload = {}) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appFilmProjectsRestorePublish', {
          projectId,
          publishId,
        }),
        payload,
      ),
    deleteFilmProjectPublish: async (projectId, publishId) =>
      sendJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appFilmProjectsDeletePublish', {
          projectId,
          publishId,
        }),
        {
          method: 'DELETE',
        },
      ),
    readFilmProjectPublishArtifactContent: async (projectId, publishId, artifactKind) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appFilmProjectsReadPublishArtifactContent', {
          projectId,
          publishId,
          artifactKind,
        }),
      ),
    updateFilmProject: async (projectId, payload) =>
      putJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appFilmProjectsUpdate', {
          projectId,
        }),
        payload,
      ),
    deleteFilmProject: async (projectId) =>
      sendJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appFilmProjectsDelete', {
          projectId,
        }),
        {
          method: 'DELETE',
        },
      ),
    analyzeFilmScript: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_FILM_ANALYSIS_SCRIPT_PATH, payload),
    standardizeFilmScript: async (projectId, payload = {}) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appFilmProjectsStandardizeScript', {
          projectId,
        }),
        payload,
      ),
    prepareFilmProjectAnalysis: async (projectId, payload = {}) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appFilmProjectsPrepareAnalysis', {
          projectId,
        }),
        payload,
      ),
    rebuildFilmProjectStoryboard: async (projectId, payload = {}) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appFilmProjectsRebuildStoryboard', {
          projectId,
        }),
        payload,
      ),
    createFilmProjectSceneBreakdown: async (projectId, payload = {}) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appFilmProjectsCreateSceneBreakdown', {
          projectId,
        }),
        payload,
      ),
    createFilmProjectShootingPlan: async (projectId, payload = {}) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appFilmProjectsCreateShootingPlan', {
          projectId,
        }),
        payload,
      ),
    generateFilmProjectShotVariants: async (projectId, payload = {}) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appFilmProjectsGenerateShotVariants', {
          projectId,
        }),
        payload,
      ),
    generateFilmStoryboard: async (projectId, payload = {}) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appFilmProjectsGenerateStoryboard', {
          projectId,
        }),
        payload,
      ),
    syncFilmShots: async (projectId, payload = {}) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appFilmProjectsSyncShots', {
          projectId,
        }),
        payload,
      ),
    runFilmAuthoringBatch: async (projectId, payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appFilmProjectsRunAuthoringBatch', {
          projectId,
        }),
        payload,
      ),
    refreshFilmProjectAnalysis: async (projectId, payload = {}) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appFilmProjectsRefreshAnalysis', {
          projectId,
        }),
        payload,
      ),
    applyFilmPreset: async (projectId, payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appFilmProjectsApplyPreset', {
          projectId,
        }),
        payload,
      ),
    relinkFilmAssets: async (projectId, payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appFilmProjectsRelinkAssets', {
          projectId,
        }),
        payload,
      ),
    bindFilmAsset: async (projectId, payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appFilmProjectsBindAsset', {
          projectId,
        }),
        payload,
      ),
    exportFilmPackage: async (projectId, payload = {}) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appFilmProjectsExportPackage', {
          projectId,
        }),
        payload,
      ),
    publishFilmStoryboard: async (projectId, payload = {}) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appFilmProjectsPublishStoryboard', {
          projectId,
        }),
        payload,
      ),
    importFilmPackage: async (payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        MAGIC_STUDIO_SERVER_APP_FILM_IMPORT_PACKAGE_PATH,
        payload,
      ),
    validateFilmProject: async (payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        MAGIC_STUDIO_SERVER_APP_FILM_VALIDATE_PROJECT_PATH,
        payload,
      ),
    extractFilmCharacters: async (payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        MAGIC_STUDIO_SERVER_APP_FILM_ANALYSIS_CHARACTERS_PATH,
        payload,
      ),
    extractFilmProps: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_FILM_ANALYSIS_PROPS_PATH, payload),
    listMagicCutProjects: async (query) =>
      getJson(
        fetchImpl,
        baseUrl,
        withQuery(MAGIC_STUDIO_SERVER_APP_MAGICCUT_PROJECTS_PATH, query),
      ),
    createMagicCutProject: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_MAGICCUT_PROJECTS_PATH, payload),
    readMagicCutProject: async (projectId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appMagicCutProjectsRead', {
          projectId,
        }),
      ),
    updateMagicCutProject: async (projectId, payload) =>
      putJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appMagicCutProjectsUpdate', {
          projectId,
        }),
        payload,
      ),
    deleteMagicCutProject: async (projectId) =>
      sendJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appMagicCutProjectsDelete', {
          projectId,
        }),
        {
          method: 'DELETE',
        },
      ),
    duplicateMagicCutProject: async (projectId, payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appMagicCutProjectsDuplicate', {
          projectId,
        }),
        payload ?? {},
      ),
    listMagicCutTemplates: async (query) =>
      getJson(
        fetchImpl,
        baseUrl,
        withQuery(MAGIC_STUDIO_SERVER_APP_MAGICCUT_TEMPLATES_PATH, query),
      ),
    createMagicCutTemplate: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_MAGICCUT_TEMPLATES_PATH, payload),
    readMagicCutTemplate: async (templateId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appMagicCutTemplatesRead', {
          templateId,
        }),
      ),
    updateMagicCutTemplate: async (templateId, payload) =>
      putJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appMagicCutTemplatesUpdate', {
          templateId,
        }),
        payload,
      ),
    instantiateMagicCutTemplate: async (templateId, payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appMagicCutTemplatesInstantiate', {
          templateId,
        }),
        payload ?? {},
      ),
    deleteMagicCutTemplate: async (templateId) =>
      sendJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appMagicCutTemplatesDelete', {
          templateId,
        }),
        {
          method: 'DELETE',
        },
      ),
    readMagicCutRenderCapabilities: async () =>
      getJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_MAGICCUT_RENDER_CAPABILITIES_PATH),
    listMagicCutRenders: async (query) =>
      getJson(
        fetchImpl,
        baseUrl,
        withQuery(MAGIC_STUDIO_SERVER_APP_MAGICCUT_RENDERS_PATH, query),
      ),
    createMagicCutRender: async (projectId, payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appMagicCutCreateRender', {
          projectId,
        }),
        payload,
      ),
    readMagicCutRender: async (renderId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appMagicCutReadRender', {
          renderId,
        }),
      ),
    cancelMagicCutRender: async (renderId) =>
      sendJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appMagicCutCancelRender', {
          renderId,
        }),
        {
          method: 'POST',
        },
      ),
    listMagicCutRenderArtifacts: async (renderId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appMagicCutListRenderArtifacts', {
          renderId,
        }),
      ),
    readMagicCutRenderArtifactContent: async (renderId, artifactId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appMagicCutReadRenderArtifactContent', {
          renderId,
          artifactId,
        }),
      ),
    readDriveFileContent: async (itemId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appDriveReadFileContent', {
          itemId,
        }),
      ),
    updateDriveFileContent: async (itemId, payload) =>
      putJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appDriveUpdateFileContent', {
          itemId,
        }),
        payload,
      ),
    createDriveFolder: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_DRIVE_FOLDERS_PATH, payload),
    uploadDriveFile: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_DRIVE_UPLOADS_PATH, payload),
    importDriveFile: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_DRIVE_IMPORT_FILE_PATH, payload),
    renameDriveItem: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_DRIVE_RENAME_PATH, payload),
    moveDriveItems: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_DRIVE_MOVE_PATH, payload),
    deleteDriveItems: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_DRIVE_DELETE_PATH, payload),
    restoreDriveItems: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_DRIVE_RESTORE_PATH, payload),
    emptyDriveTrash: async () =>
      sendJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_DRIVE_EMPTY_TRASH_PATH, {
        method: 'POST',
      }),
    favoriteDriveItem: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_DRIVE_FAVORITES_PATH, payload),
    readNotesWorkspaceSnapshot: async () =>
      getJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_NOTES_WORKSPACE_SNAPSHOT_PATH),
    listNotes: async (query) =>
      getJson(fetchImpl, baseUrl, withQuery(MAGIC_STUDIO_SERVER_APP_NOTES_PATH, query)),
    createNote: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_NOTES_PATH, payload),
    listTrashedNotes: async (query) =>
      getJson(fetchImpl, baseUrl, withQuery(MAGIC_STUDIO_SERVER_APP_NOTES_TRASHED_PATH, query)),
    readNote: async (noteId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appNotesRead', {
          noteId,
        }),
      ),
    updateNote: async (noteId, payload) =>
      putJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appNotesUpdate', {
          noteId,
        }),
        payload,
      ),
    createNoteFolder: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_NOTE_FOLDERS_PATH, payload),
    renameNoteFolder: async (folderId, payload) =>
      patchJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appNotesRenameFolder', {
          folderId,
        }),
        payload,
      ),
    deleteNoteFolder: async (folderId) =>
      sendJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appNotesDeleteFolder', {
          folderId,
        }),
        {
          method: 'DELETE',
        },
      ),
    trashNote: async (noteId) =>
      sendJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appNotesTrash', {
          noteId,
        }),
        {
          method: 'POST',
        },
      ),
    restoreNote: async (noteId) =>
      sendJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appNotesRestore', {
          noteId,
        }),
        {
          method: 'POST',
        },
      ),
    deleteNote: async (noteId) =>
      sendJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appNotesDelete', {
          noteId,
        }),
        {
          method: 'DELETE',
        },
      ),
    clearNotesTrash: async () =>
      sendJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_NOTES_CLEAR_TRASH_PATH, {
        method: 'POST',
      }),
    moveNoteFolder: async (folderId, payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appNotesMoveFolder', {
          folderId,
        }),
        payload,
      ),
    moveNote: async (noteId, payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appNotesMove', {
          noteId,
        }),
        payload,
      ),
    publishNote: async (noteId, payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appNotesPublish', {
          noteId,
        }),
        payload,
      ),
    listPresentations: async (query) =>
      getJson(fetchImpl, baseUrl, withQuery(MAGIC_STUDIO_SERVER_APP_PRESENTATIONS_PATH, query)),
    createPresentation: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_PRESENTATIONS_PATH, payload),
    readPresentation: async (presentationId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appPresentationsRead', {
          presentationId,
        }),
      ),
    updatePresentation: async (presentationId, payload) =>
      patchJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appPresentationsUpdate', {
          presentationId,
        }),
        payload,
      ),
    deletePresentation: async (presentationId) =>
      sendJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appPresentationsDelete', {
          presentationId,
        }),
        {
          method: 'DELETE',
        },
      ),
    createPresentationSlide: async (presentationId, payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appPresentationsCreateSlide', {
          presentationId,
        }),
        payload,
      ),
    updatePresentationSlide: async (presentationId, slideId, payload) =>
      patchJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appPresentationsUpdateSlide', {
          presentationId,
          slideId,
        }),
        payload,
      ),
    createPortalFeed: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_PORTAL_FEEDS_PATH, payload),
    listPortalFeaturedFeeds: async (query) =>
      getJson(
        fetchImpl,
        baseUrl,
        withQuery(MAGIC_STUDIO_SERVER_APP_PORTAL_FEATURED_FEEDS_PATH, query),
      ),
    listPortalDiscoverFeeds: async (query) =>
      getJson(
        fetchImpl,
        baseUrl,
        withQuery(MAGIC_STUDIO_SERVER_APP_PORTAL_DISCOVER_FEEDS_PATH, query),
      ),
    readPortalFeed: async (feedId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appPortalFeedsRead', {
          feedId,
        }),
      ),
    likePortalFeed: async (feedId) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appPortalFeedsLike', {
          feedId,
        }),
        {},
      ),
    unlikePortalFeed: async (feedId) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appPortalFeedsUnlike', {
          feedId,
        }),
        {},
      ),
    collectPortalFeed: async (feedId) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appPortalFeedsCollect', {
          feedId,
        }),
        {},
      ),
    uncollectPortalFeed: async (feedId) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appPortalFeedsUncollect', {
          feedId,
        }),
        {},
      ),
    sharePortalFeed: async (feedId) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appPortalFeedsShare', {
          feedId,
        }),
        {},
      ),
    deletePortalFeed: async (feedId) =>
      sendJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appPortalFeedsDelete', {
          feedId,
        }),
        {
          method: 'DELETE',
        },
      ),
    listTradeAvailableTasks: async (query) =>
      getJson(
        fetchImpl,
        baseUrl,
        withQuery(MAGIC_STUDIO_SERVER_APP_TRADE_TASKS_AVAILABLE_PATH, query),
      ),
    listTradePublishedTasks: async (query) =>
      getJson(
        fetchImpl,
        baseUrl,
        withQuery(MAGIC_STUDIO_SERVER_APP_TRADE_TASKS_PUBLISHED_PATH, query),
      ),
    listTradeAcceptedTasks: async (query) =>
      getJson(
        fetchImpl,
        baseUrl,
        withQuery(MAGIC_STUDIO_SERVER_APP_TRADE_TASKS_ACCEPTED_PATH, query),
      ),
    readTradeTask: async (taskId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appTradeTasksRead', {
          taskId,
        }),
      ),
    acceptTradeTask: async (taskId, payload = {}) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appTradeTasksAccept', {
          taskId,
        }),
        payload,
      ),
    submitTradeTask: async (taskId, payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appTradeTasksSubmit', {
          taskId,
        }),
        payload,
      ),
    approveTradeTask: async (taskId, payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appTradeTasksApprove', {
          taskId,
        }),
        payload,
      ),
    cancelTradeTask: async (taskId) =>
      sendJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appTradeTasksCancel', {
          taskId,
        }),
        {
          method: 'POST',
        },
      ),
    listTradeOrders: async (query) =>
      getJson(
        fetchImpl,
        baseUrl,
        withQuery(MAGIC_STUDIO_SERVER_APP_TRADE_ORDERS_PATH, query),
      ),
    readTradeOrder: async (orderId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appTradeOrdersRead', {
          orderId,
        }),
      ),
    createTradeOrder: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_TRADE_ORDERS_PATH, payload),
    updateTradeOrderStatus: async (orderId, payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appTradeOrdersUpdateStatus', {
          orderId,
        }),
        payload,
      ),
    cancelTradeOrder: async (orderId, payload = {}) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appTradeOrdersCancel', {
          orderId,
        }),
        payload,
      ),
    deleteTradeOrder: async (orderId) =>
      sendJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appTradeOrdersDelete', {
          orderId,
        }),
        {
          method: 'DELETE',
        },
      ),
    readTradeOrderStatistics: async () =>
      getJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_TRADE_ORDER_STATISTICS_PATH),
    listTradePayments: async (query) =>
      getJson(
        fetchImpl,
        baseUrl,
        withQuery(MAGIC_STUDIO_SERVER_APP_TRADE_PAYMENTS_PATH, query),
      ),
    readTradePayment: async (paymentId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appTradePaymentsRead', {
          paymentId,
        }),
      ),
    createTradePayment: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_TRADE_PAYMENTS_PATH, payload),
    refundTradePayment: async (paymentId, payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appTradePaymentsRefund', {
          paymentId,
        }),
        payload,
      ),
    rechargeTradeWallet: async (payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appTradePaymentsRecharge'),
        payload,
      ),
    readTradeWallet: async () =>
      getJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_TRADE_WALLET_PATH),
    listTradeTransactions: async (query) =>
      getJson(
        fetchImpl,
        baseUrl,
        withQuery(MAGIC_STUDIO_SERVER_APP_TRADE_TRANSACTIONS_PATH, query),
      ),
    listVipPlans: async () =>
      getJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_VIP_PLANS_PATH),
    readVipStatus: async () =>
      getJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_VIP_STATUS_PATH),
    purchaseVip: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_VIP_PURCHASE_PATH, payload),
    listVipSubscriptions: async (query) =>
      getJson(
        fetchImpl,
        baseUrl,
        withQuery(MAGIC_STUDIO_SERVER_APP_VIP_SUBSCRIPTIONS_PATH, query),
      ),
    cancelVipSubscription: async (subscriptionId, payload = {}) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appVipSubscriptionsCancel', {
          subscriptionId,
        }),
        payload,
      ),
    readUserProfile: async () =>
      getJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_USER_PROFILE_PATH),
    updateUserProfile: async (payload) =>
      patchJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_USER_PROFILE_PATH, payload),
    uploadUserAvatar: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_USER_AVATAR_PATH, payload),
    readUserSettings: async () =>
      getJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_USER_SETTINGS_PATH),
    updateUserSettings: async (payload) =>
      putJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_USER_SETTINGS_PATH, payload),
    changeUserPassword: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_USER_CHANGE_PASSWORD_PATH, payload),
    listUserAddresses: async () =>
      getJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_USER_ADDRESSES_PATH),
    readDefaultUserAddress: async () =>
      getJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_USER_DEFAULT_ADDRESS_PATH),
    createUserAddress: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_USER_ADDRESSES_PATH, payload),
    updateUserAddress: async (addressId, payload) =>
      patchJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appUserUpdateAddress', {
          addressId,
        }),
        payload,
      ),
    deleteUserAddress: async (addressId) =>
      sendJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appUserDeleteAddress', {
          addressId,
        }),
        {
          method: 'DELETE',
        },
      ),
    setDefaultUserAddress: async (addressId) =>
      sendJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appUserSetDefaultAddress', {
          addressId,
        }),
        {
          method: 'POST',
        },
      ),
    readUserLoginHistory: async (query) =>
      getJson(
        fetchImpl,
        baseUrl,
        withQuery(MAGIC_STUDIO_SERVER_APP_USER_LOGIN_HISTORY_PATH, query),
      ),
    readUserGenerationHistory: async (query) =>
      getJson(
        fetchImpl,
        baseUrl,
        withQuery(MAGIC_STUDIO_SERVER_APP_USER_GENERATION_HISTORY_PATH, query),
      ),
    listUserSessions: async () =>
      getJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_USER_SESSIONS_PATH),
    revokeUserSession: async (sessionId) =>
      sendJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appUserRevokeSession', {
          sessionId,
        }),
        {
          method: 'DELETE',
        },
      ),
    listUserDevices: async () =>
      getJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_USER_DEVICES_PATH),
    revokeUserDevice: async (deviceId) =>
      sendJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appUserRevokeDevice', {
          deviceId,
        }),
        {
          method: 'DELETE',
        },
      ),
    readUserTwoFactorStatus: async () =>
      getJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_USER_TWO_FACTOR_PATH),
    setupUserTwoFactor: async (payload = {}) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_USER_TWO_FACTOR_SETUP_PATH, payload),
    verifyUserTwoFactor: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_USER_TWO_FACTOR_VERIFY_PATH, payload),
    disableUserTwoFactor: async () =>
      sendJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_USER_TWO_FACTOR_PATH, {
        method: 'DELETE',
      }),
    listUserBindings: async () =>
      getJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_USER_BINDINGS_PATH),
    bindUserEmail: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_USER_BIND_EMAIL_PATH, payload),
    unbindUserEmail: async () =>
      sendJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_USER_BIND_EMAIL_PATH, {
        method: 'DELETE',
      }),
    bindUserPhone: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_USER_BIND_PHONE_PATH, payload),
    unbindUserPhone: async () =>
      sendJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_USER_BIND_PHONE_PATH, {
        method: 'DELETE',
      }),
    bindUserPlatform: async (platform, payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appUserBindThirdParty', {
          platform,
        }),
        payload,
      ),
    unbindUserPlatform: async (platform) =>
      sendJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appUserUnbindThirdParty', {
          platform,
        }),
        {
          method: 'DELETE',
        },
      ),
    createImageGenerationTask: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_GENERATION_IMAGE_TASKS_PATH, payload),
    createImageVariationTask: async (payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        MAGIC_STUDIO_SERVER_APP_GENERATION_IMAGE_VARIATIONS_PATH,
        payload,
      ),
    createImageEditTask: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_GENERATION_IMAGE_EDITS_PATH, payload),
    createImageUpscaleTask: async (payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        MAGIC_STUDIO_SERVER_APP_GENERATION_IMAGE_UPSCALES_PATH,
        payload,
      ),
    enhanceImageGenerationPrompt: async (payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        MAGIC_STUDIO_SERVER_APP_GENERATION_IMAGE_PROMPT_ENHANCE_PATH,
        payload,
      ),
    readImageGenerationTask: async (taskId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appGenerationImagesReadTask', {
          taskId,
        }),
      ),
    createVideoGenerationTask: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_GENERATION_VIDEO_TASKS_PATH, payload),
    createImageToVideoTask: async (payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        MAGIC_STUDIO_SERVER_APP_GENERATION_VIDEO_IMAGE_TO_VIDEO_PATH,
        payload,
      ),
    createVideoExtendTask: async (payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        MAGIC_STUDIO_SERVER_APP_GENERATION_VIDEO_EXTEND_PATH,
        payload,
      ),
    createVideoStyleTransferTask: async (payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        MAGIC_STUDIO_SERVER_APP_GENERATION_VIDEO_STYLE_TRANSFER_PATH,
        payload,
      ),
    createVideoLipSyncTask: async (payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        MAGIC_STUDIO_SERVER_APP_GENERATION_VIDEO_LIP_SYNC_PATH,
        payload,
      ),
    enhanceVideoGenerationPrompt: async (payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        MAGIC_STUDIO_SERVER_APP_GENERATION_VIDEO_PROMPT_ENHANCE_PATH,
        payload,
      ),
    readVideoGenerationTask: async (taskId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appGenerationVideosReadTask', {
          taskId,
        }),
      ),
    cancelVideoGenerationTask: async (taskId) =>
      sendJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appGenerationVideosCancelTask', {
          taskId,
        }),
        {
          method: 'POST',
        },
      ),
    createAudioTextToSpeechTask: async (payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        MAGIC_STUDIO_SERVER_APP_GENERATION_AUDIO_TEXT_TO_SPEECH_PATH,
        payload,
      ),
    createAudioTranscriptionTask: async (payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        MAGIC_STUDIO_SERVER_APP_GENERATION_AUDIO_TRANSCRIPTIONS_PATH,
        payload,
      ),
    createAudioTranslationTask: async (payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        MAGIC_STUDIO_SERVER_APP_GENERATION_AUDIO_TRANSLATIONS_PATH,
        payload,
      ),
    readAudioGenerationTask: async (taskId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appGenerationAudioReadTask', {
          taskId,
        }),
      ),
    createMusicGenerationTask: async (payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        MAGIC_STUDIO_SERVER_APP_GENERATION_MUSIC_TASKS_PATH,
        payload,
      ),
    createMusicSimilarTask: async (payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        MAGIC_STUDIO_SERVER_APP_GENERATION_MUSIC_SIMILAR_PATH,
        payload,
      ),
    createMusicRemixTask: async (payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        MAGIC_STUDIO_SERVER_APP_GENERATION_MUSIC_REMIX_PATH,
        payload,
      ),
    createMusicExtendTask: async (payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        MAGIC_STUDIO_SERVER_APP_GENERATION_MUSIC_EXTEND_PATH,
        payload,
      ),
    readMusicGenerationTask: async (taskId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appGenerationMusicReadTask', {
          taskId,
        }),
      ),
    createSfxGenerationTask: async (payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        MAGIC_STUDIO_SERVER_APP_GENERATION_SFX_TASKS_PATH,
        payload,
      ),
    listSfxGenerationTasks: async (query) =>
      getJson(
        fetchImpl,
        baseUrl,
        withQuery(MAGIC_STUDIO_SERVER_APP_GENERATION_SFX_TASKS_PATH, query),
      ),
    listSfxGenerationCategories: async () =>
      getJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_GENERATION_SFX_CATEGORIES_PATH),
    readSfxGenerationTask: async (taskId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appGenerationSfxReadTask', {
          taskId,
        }),
      ),
    cancelSfxGenerationTask: async (taskId) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appGenerationSfxCancelTask', {
          taskId,
        }),
        null,
      ),
    createCharacterGenerationTask: async (payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        MAGIC_STUDIO_SERVER_APP_GENERATION_CHARACTER_TASKS_PATH,
        payload,
      ),
    listCharacterGenerationTasks: async (query) =>
      getJson(
        fetchImpl,
        baseUrl,
        withQuery(MAGIC_STUDIO_SERVER_APP_GENERATION_CHARACTER_TASKS_PATH, query),
      ),
    readCharacterGenerationTask: async (taskId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appGenerationCharactersReadTask', {
          taskId,
        }),
      ),
    cancelCharacterGenerationTask: async (taskId) =>
      sendJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appGenerationCharactersCancelTask', {
          taskId,
        }),
        {
          method: 'POST',
        },
      ),
    listMarketVoices: async (query) =>
      getJson(
        fetchImpl,
        baseUrl,
        withQuery(MAGIC_STUDIO_SERVER_APP_VOICES_MARKET_PATH, query),
      ),
    listWorkspaceVoices: async (query) =>
      getJson(
        fetchImpl,
        baseUrl,
        withQuery(MAGIC_STUDIO_SERVER_APP_VOICES_WORKSPACE_PATH, query),
      ),
    listCustomVoices: async (query) =>
      getJson(
        fetchImpl,
        baseUrl,
        withQuery(MAGIC_STUDIO_SERVER_APP_VOICES_CUSTOM_PATH, query),
      ),
    createCustomVoice: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_VOICES_CUSTOM_PATH, payload),
    readVoiceSpeaker: async (speakerId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appVoicesReadSpeaker', {
          speakerId,
        }),
      ),
    updateCustomVoice: async (speakerId, payload) =>
      patchJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appVoicesUpdateCustom', {
          speakerId,
        }),
        payload,
      ),
    deleteCustomVoice: async (speakerId) =>
      sendJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appVoicesDeleteCustom', {
          speakerId,
        }),
        {
          method: 'DELETE',
        },
      ),
    createVoiceCloneTask: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_VOICE_CLONE_TASKS_PATH, payload),
    listVoiceCloneTasks: async (query) =>
      getJson(
        fetchImpl,
        baseUrl,
        withQuery(MAGIC_STUDIO_SERVER_APP_VOICE_CLONE_TASKS_PATH, query),
      ),
    readVoiceCloneTask: async (taskId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appVoicesReadCloneTask', {
          taskId,
        }),
      ),
    deleteVoiceCloneTask: async (taskId) =>
      sendJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appVoicesDeleteCloneTask', {
          taskId,
        }),
        {
          method: 'DELETE',
        },
      ),
    cancelVoiceCloneTask: async (taskId) =>
      sendJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appVoicesCancelCloneTask', {
          taskId,
        }),
        {
          method: 'POST',
        },
      ),
    updateVoicePreview: async (speakerId, payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appVoicesUpdatePreview', {
          speakerId,
        }),
        payload,
      ),
    listVoiceSpeechTasks: async (query) =>
      getJson(
        fetchImpl,
        baseUrl,
        withQuery(MAGIC_STUDIO_SERVER_APP_VOICE_SPEECH_TASKS_PATH, query),
      ),
    createVoiceSpeechTask: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_VOICE_SPEECH_TASKS_PATH, payload),
    readVoiceSpeechTask: async (taskId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appVoicesReadSpeechTask', {
          taskId,
        }),
      ),
    updateVoiceSpeechTask: async (taskId, payload) =>
      patchJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appVoicesUpdateSpeechTask', {
          taskId,
        }),
        payload,
      ),
    upsertVoiceSpeechTask: async (taskId, payload) =>
      putJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appVoicesUpsertSpeechTask', {
          taskId,
        }),
        payload,
      ),
    deleteVoiceSpeechTask: async (taskId) =>
      sendJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appVoicesDeleteSpeechTask', {
          taskId,
        }),
        {
          method: 'DELETE',
        },
      ),
    cancelVoiceSpeechTask: async (taskId) =>
      sendJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('appVoicesCancelSpeechTask', {
          taskId,
        }),
        {
          method: 'POST',
        },
      ),
    optimizePrompt: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_APP_PROMPT_OPTIMIZE_PATH, payload),
    listDeployments: async () =>
      getJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_ADMIN_DEPLOYMENTS_PATH),
    readRuntimeAudit: async () =>
      getJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_ADMIN_RUNTIME_AUDITS_PATH),
    readJobMetrics: async () =>
      getJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_ADMIN_JOBS_METRICS_PATH),
    readPolicyAudit: async () =>
      getJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_ADMIN_POLICY_AUDITS_PATH),
    listStorageProviders: async () =>
      getJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_ADMIN_STORAGE_PROVIDERS_PATH),
    listAdminExecutionProviders: async () =>
      getJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_ADMIN_EXECUTION_PROVIDERS_PATH),
    readAdminExecutionProvider: async (providerKey) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('adminExecutionProvidersRead', {
          providerKey,
        }),
      ),
    reconcileAdminExecutionProvider: async (providerKey, payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('adminExecutionProvidersReconcile', {
          providerKey,
        }),
        payload ?? {},
      ),
    listAdminExecutionProviderHealth: async () =>
      getJson(
        fetchImpl,
        baseUrl,
        MAGIC_STUDIO_SERVER_ADMIN_EXECUTION_PROVIDER_HEALTH_PATH,
      ),
    listAdminExecutionFailures: async () =>
      getJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_ADMIN_EXECUTION_FAILURES_PATH),
    acknowledgeAdminExecutionFailure: async (failureId, payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('adminExecutionFailuresAcknowledge', {
          failureId,
        }),
        payload ?? {},
      ),
    retryAdminExecutionFailure: async (failureId, payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('adminExecutionFailuresRetry', {
          failureId,
        }),
        payload ?? {},
      ),
    listAdminWorkspaceReleaseRetentionRuns: async () =>
      getJson(
        fetchImpl,
        baseUrl,
        MAGIC_STUDIO_SERVER_ADMIN_WORKSPACE_RELEASE_RETENTION_RUNS_PATH,
      ),
    createAdminWorkspaceReleaseRetentionRun: async (payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        MAGIC_STUDIO_SERVER_ADMIN_WORKSPACE_RELEASE_RETENTION_RUNS_PATH,
        payload ?? {},
      ),
    readAdminWorkspaceReleaseRetentionRun: async (runId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('adminWorkspaceReleaseRetentionRunsRead', {
          runId,
        }),
      ),
    listAdminWorkspaceReleaseRetentionSchedules: async () =>
      getJson(
        fetchImpl,
        baseUrl,
        MAGIC_STUDIO_SERVER_ADMIN_WORKSPACE_RELEASE_RETENTION_SCHEDULES_PATH,
      ),
    createAdminWorkspaceReleaseRetentionSchedule: async (payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        MAGIC_STUDIO_SERVER_ADMIN_WORKSPACE_RELEASE_RETENTION_SCHEDULES_PATH,
        payload,
      ),
    readAdminWorkspaceReleaseRetentionSchedule: async (scheduleId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('adminWorkspaceReleaseRetentionSchedulesRead', {
          scheduleId,
        }),
      ),
    updateAdminWorkspaceReleaseRetentionSchedule: async (scheduleId, payload) =>
      sendJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('adminWorkspaceReleaseRetentionSchedulesUpdate', {
          scheduleId,
        }),
        {
          method: 'PATCH',
          body: JSON.stringify(payload),
          headers: {
            'content-type': 'application/json',
          },
        },
      ),
    triggerAdminWorkspaceReleaseRetentionSchedule: async (scheduleId, payload) =>
      postJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('adminWorkspaceReleaseRetentionSchedulesTrigger', {
          scheduleId,
        }),
        payload ?? {},
      ),
    listAdminPlugins: async () =>
      getJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_ADMIN_PLUGINS_PATH),
    enablePlugin: async (pluginId) =>
      sendJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('adminPluginsEnable', {
          pluginId,
        }),
        {
          method: 'POST',
        },
      ),
    disablePlugin: async (pluginId) =>
      sendJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('adminPluginsDisable', {
          pluginId,
        }),
        {
          method: 'POST',
        },
      ),
    readPolicySnapshot: async () =>
      getJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_POLICY_SNAPSHOT_PATH),
    validatePolicyPath: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_POLICY_VALIDATE_PATH_PATH, payload),
    validatePolicyCommand: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_POLICY_VALIDATE_COMMAND_PATH, payload),
    readMigrationStatus: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_MIGRATION_STATUS_PATH, payload),
    applyMigrations: async (payload) => {
      const requestPayload: MagicStudioMigrationApplyRequest & {
        plan: MagicStudioMigrationPlan;
      } = payload;
      return postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_MIGRATION_APPLY_PATH, requestPayload);
    },
    mediaProbe: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_MEDIA_PROBE_PATH, payload),
    mediaImageResize: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_MEDIA_IMAGE_RESIZE_PATH, payload),
    mediaVideoConcat: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_MEDIA_VIDEO_CONCAT_PATH, payload),
    mediaVideoTranscode: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_MEDIA_VIDEO_TRANSCODE_PATH, payload),
    mediaVideoTrim: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_MEDIA_VIDEO_TRIM_PATH, payload),
    mediaVideoExtractAudio: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_MEDIA_VIDEO_EXTRACT_AUDIO_PATH, payload),
    mediaVideoCreateThumbnail: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_MEDIA_VIDEO_THUMBNAIL_PATH, payload),
    mediaAudioConvert: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_MEDIA_AUDIO_CONVERT_PATH, payload),
    mediaAudioNormalize: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_MEDIA_AUDIO_NORMALIZE_PATH, payload),
    mediaAudioMix: async (payload) => {
      const requestPayload: MagicStudioMediaAudioMixRequest & {
        inputs: MagicStudioMediaAudioMixInput[];
      } = payload;
      return postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_MEDIA_AUDIO_MIX_PATH, requestPayload);
    },
    zipLocalPaths: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_COMPRESSION_ZIP_PATH, payload),
    unzipToDirectory: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_COMPRESSION_UNZIP_PATH, payload),
    executeSql: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_SQLITE_EXECUTE_PATH, payload),
    querySql: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_SQLITE_QUERY_PATH, payload),
    executeSqlBatch: async (payload) =>
      postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_SQLITE_EXECUTE_BATCH_PATH, payload),
    submitToolkitJob: async (payload) => {
      const requestPayload: MagicStudioToolkitJobSubmission & {
        kind: MagicStudioToolkitJobKind;
        operation: MagicStudioToolkitOperation;
      } = payload;
      return postJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_JOBS_PATH, requestPayload);
    },
    readToolkitJob: async (jobId) =>
      getJson(
        fetchImpl,
        baseUrl,
        resolveMagicStudioServerRoutePath('coreJobsRead', { jobId }),
      ),
    listToolkitJobs: async () => getJson(fetchImpl, baseUrl, MAGIC_STUDIO_SERVER_JOBS_PATH),
    cancelToolkitJob: async (jobId) =>
      readJson(
        fetchImpl,
        joinUrl(baseUrl, resolveMagicStudioServerRoutePath('coreJobsCancel', { jobId })),
        {
          method: 'POST',
        },
      ),
  };
}
