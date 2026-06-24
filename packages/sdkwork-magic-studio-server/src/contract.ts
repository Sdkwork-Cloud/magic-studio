import contractJson from '../contracts/magic-studio-server.contract.json' with { type: 'json' };
import openApiComponentsJson from '../contracts/magic-studio-server.openapi-components.json' with { type: 'json' };
import {
  MAGIC_STUDIO_DEFAULT_LOCAL_API_BASE_URL,
  MAGIC_STUDIO_DEFAULT_LOCAL_API_HOST,
  MAGIC_STUDIO_DEFAULT_LOCAL_API_PORT,
  resolveMagicStudioHostConnection,
} from '@sdkwork/magic-studio-host-core';
import type {
  MagicStudioApiContractRoute,
  MagicStudioApiGatewaySummary,
  MagicStudioApiRouteCatalogEntry,
  MagicStudioApiRouteDefinition,
  MagicStudioApiSurface,
  MagicStudioHostDescriptor,
  MagicStudioHostMode,
  MagicStudioServerContract,
} from '@sdkwork/magic-studio-host-types';

export const MAGIC_STUDIO_SERVER_DEFAULT_CONTRACT =
  contractJson as MagicStudioServerContract;
const MAGIC_STUDIO_SERVER_OPENAPI_COMPONENTS = openApiComponentsJson as {
  schemas: Record<string, unknown>;
};
export const MAGIC_STUDIO_SERVER_API_VERSION =
  MAGIC_STUDIO_SERVER_DEFAULT_CONTRACT.apiVersion;
export const MAGIC_STUDIO_SERVER_API_SURFACES = Object.freeze(
  MAGIC_STUDIO_SERVER_DEFAULT_CONTRACT.surfaces.map((surface) => surface.name),
) as readonly MagicStudioApiSurface[];
export const MAGIC_STUDIO_SERVER_OPENAPI_PATH =
  MAGIC_STUDIO_SERVER_DEFAULT_CONTRACT.meta.openApiPath;
export const MAGIC_STUDIO_SERVER_LIVE_OPENAPI_PATH =
  MAGIC_STUDIO_SERVER_DEFAULT_CONTRACT.meta.liveOpenApiPath;
export const MAGIC_STUDIO_SERVER_DOCS_PATH =
  MAGIC_STUDIO_SERVER_DEFAULT_CONTRACT.meta.docsPath;
export const MAGIC_STUDIO_SERVER_SURFACE_BASE_PATHS = Object.freeze(
  Object.fromEntries(
    MAGIC_STUDIO_SERVER_DEFAULT_CONTRACT.surfaces.map((surface) => [
      surface.name,
      surface.basePath,
    ]),
  ) as Record<MagicStudioApiSurface, string>,
);
export const MAGIC_STUDIO_SERVER_APP_USER_CENTER_LOCAL_API_BASE_PATH =
  `${MAGIC_STUDIO_SERVER_SURFACE_BASE_PATHS.app}/user-center`;
const MAGIC_STUDIO_SERVER_GATEWAY_BASE_PATH = deriveGatewayBasePath(
  Object.values(MAGIC_STUDIO_SERVER_SURFACE_BASE_PATHS),
);
const MAGIC_STUDIO_SERVER_ROUTE_DEFINITIONS_BY_ID = Object.freeze(
  createRouteDefinitionsById(MAGIC_STUDIO_SERVER_DEFAULT_CONTRACT.routes),
);

function createRouteDefinitionsById(
  routes: readonly MagicStudioApiContractRoute[],
): Record<string, MagicStudioApiContractRoute> {
  const routesById: Record<string, MagicStudioApiContractRoute> = {};

  for (const route of routes) {
    if (route.id.trim().length === 0) {
      throw new Error('Magic Studio server contract contains a route with an empty id.');
    }

    if (Object.prototype.hasOwnProperty.call(routesById, route.id)) {
      throw new Error(`Magic Studio server contract contains duplicate route id ${route.id}`);
    }

    routesById[route.id] = route;
  }

  return routesById;
}

function requireContractRouteById(routeId: string): MagicStudioApiContractRoute {
  const route = MAGIC_STUDIO_SERVER_ROUTE_DEFINITIONS_BY_ID[routeId];
  if (!route) {
    throw new Error(`Magic Studio server contract is missing route id ${routeId}`);
  }
  return route;
}

function requireContractRoutePathById(routeId: string): string {
  return requireContractRouteById(routeId).path;
}

function requireMetaRouteId(routeId: string, metaFieldName: string): string {
  if (routeId.trim().length === 0) {
    throw new Error(`Magic Studio server contract meta.${metaFieldName} cannot be empty.`);
  }

  requireContractRouteById(routeId);
  return routeId;
}

export const MAGIC_STUDIO_SERVER_HEALTH_PATH =
  requireContractRoutePathById(
    requireMetaRouteId(
      MAGIC_STUDIO_SERVER_DEFAULT_CONTRACT.meta.healthRouteId,
      'healthRouteId',
    ),
  );
export const MAGIC_STUDIO_SERVER_ROUTE_CATALOG_PATH =
  requireContractRoutePathById(
    requireMetaRouteId(
      MAGIC_STUDIO_SERVER_DEFAULT_CONTRACT.meta.routeCatalogRouteId,
      'routeCatalogRouteId',
    ),
  );
export const MAGIC_STUDIO_SERVER_RUNTIME_SUMMARY_PATH =
  requireContractRoutePathById(
    requireMetaRouteId(
      MAGIC_STUDIO_SERVER_DEFAULT_CONTRACT.meta.runtimeSummaryRouteId,
      'runtimeSummaryRouteId',
    ),
  );
export const MAGIC_STUDIO_SERVER_TOOLKIT_CAPABILITIES_PATH =
  requireContractRoutePathById('coreToolkitCapabilitiesRead');
export const MAGIC_STUDIO_SERVER_FILESYSTEM_READ_DIR_PATH =
  requireContractRoutePathById('coreFileSystemReadDir');
export const MAGIC_STUDIO_SERVER_FILESYSTEM_READ_TEXT_PATH =
  requireContractRoutePathById('coreFileSystemReadText');
export const MAGIC_STUDIO_SERVER_FILESYSTEM_READ_BYTES_PATH =
  requireContractRoutePathById('coreFileSystemReadBytes');
export const MAGIC_STUDIO_SERVER_FILESYSTEM_WRITE_TEXT_PATH =
  requireContractRoutePathById('coreFileSystemWriteText');
export const MAGIC_STUDIO_SERVER_FILESYSTEM_WRITE_BYTES_PATH =
  requireContractRoutePathById('coreFileSystemWriteBytes');
export const MAGIC_STUDIO_SERVER_FILESYSTEM_STAT_PATH =
  requireContractRoutePathById('coreFileSystemStat');
export const MAGIC_STUDIO_SERVER_FILESYSTEM_EXISTS_PATH =
  requireContractRoutePathById('coreFileSystemExists');
export const MAGIC_STUDIO_SERVER_FILESYSTEM_ENSURE_DIR_PATH =
  requireContractRoutePathById('coreFileSystemEnsureDir');
export const MAGIC_STUDIO_SERVER_FILESYSTEM_REMOVE_PATH =
  requireContractRoutePathById('coreFileSystemRemove');
export const MAGIC_STUDIO_SERVER_FILESYSTEM_RENAME_PATH =
  requireContractRoutePathById('coreFileSystemRename');
export const MAGIC_STUDIO_SERVER_FILESYSTEM_COPY_FILE_PATH =
  requireContractRoutePathById('coreFileSystemCopyFile');
export const MAGIC_STUDIO_SERVER_APP_PLUGINS_PATH =
  requireContractRoutePathById('appPluginsList');
export const MAGIC_STUDIO_SERVER_APP_SETTINGS_PATH =
  requireContractRoutePathById('appSettingsRead');
export const MAGIC_STUDIO_SERVER_APP_NOTIFICATIONS_PATH =
  requireContractRoutePathById('appNotificationsList');
export const MAGIC_STUDIO_SERVER_APP_NOTIFICATION_MARK_READ_PATH =
  requireContractRoutePathById('appNotificationsMarkRead');
export const MAGIC_STUDIO_SERVER_APP_NOTIFICATIONS_MARK_ALL_READ_PATH =
  requireContractRoutePathById('appNotificationsMarkAllRead');
export const MAGIC_STUDIO_SERVER_APP_NOTIFICATIONS_UNREAD_COUNT_PATH =
  requireContractRoutePathById('appNotificationsReadUnreadCount');
export const MAGIC_STUDIO_SERVER_APP_NOTIFICATIONS_DELETE_PATH =
  requireContractRoutePathById('appNotificationsDeleteBatch');
export const MAGIC_STUDIO_SERVER_APP_WORKSPACES_PATH =
  requireContractRoutePathById('appWorkspacesList');
export const MAGIC_STUDIO_SERVER_APP_WORKSPACE_DETAIL_PATH =
  requireContractRoutePathById('appWorkspacesRead');
export const MAGIC_STUDIO_SERVER_APP_WORKSPACE_RECENT_PROJECTS_PATH =
  requireContractRoutePathById('appWorkspaceProjectsListRecent');
export const MAGIC_STUDIO_SERVER_APP_WORKSPACE_PROJECTS_PATH =
  requireContractRoutePathById('appWorkspaceProjectsList');
export const MAGIC_STUDIO_SERVER_APP_WORKSPACE_PROJECT_DETAIL_PATH =
  requireContractRoutePathById('appWorkspaceProjectsRead');
export const MAGIC_STUDIO_SERVER_APP_WORKSPACE_PROJECT_SESSION_PATH =
  requireContractRoutePathById('appWorkspaceProjectsReadSession');
export const MAGIC_STUDIO_SERVER_APP_WORKSPACE_PROJECT_GIT_SYNC_PATH =
  requireContractRoutePathById('appWorkspaceProjectsGitSync');
export const MAGIC_STUDIO_SERVER_APP_WORKSPACE_PROJECT_GIT_SYNCS_PATH =
  requireContractRoutePathById('appWorkspaceProjectsListGitSyncs');
export const MAGIC_STUDIO_SERVER_APP_WORKSPACE_PROJECT_LATEST_GIT_SYNC_PATH =
  requireContractRoutePathById('appWorkspaceProjectsReadLatestGitSync');
export const MAGIC_STUDIO_SERVER_APP_WORKSPACE_PROJECT_GIT_SYNC_DETAIL_PATH =
  requireContractRoutePathById('appWorkspaceProjectsReadGitSync');
export const MAGIC_STUDIO_SERVER_APP_WORKSPACE_PROJECT_GIT_SYNC_RETRY_PATH =
  requireContractRoutePathById('appWorkspaceProjectsRetryGitSync');
export const MAGIC_STUDIO_SERVER_APP_WORKSPACE_PROJECT_RELEASES_PATH =
  requireContractRoutePathById('appWorkspaceProjectsListReleases');
export const MAGIC_STUDIO_SERVER_APP_WORKSPACE_PROJECT_RELEASE_STATS_PATH =
  requireContractRoutePathById('appWorkspaceProjectsReadReleaseStats');
export const MAGIC_STUDIO_SERVER_APP_WORKSPACE_PROJECT_RELEASE_PRUNE_PATH =
  requireContractRoutePathById('appWorkspaceProjectsPruneReleases');
export const MAGIC_STUDIO_SERVER_APP_WORKSPACE_PROJECT_RELEASE_RETENTION_POLICY_PATH =
  requireContractRoutePathById('appWorkspaceProjectsReadReleaseRetentionPolicy');
export const MAGIC_STUDIO_SERVER_APP_WORKSPACE_PROJECT_RELEASE_RETENTION_POLICY_APPLY_PATH =
  requireContractRoutePathById('appWorkspaceProjectsApplyReleaseRetentionPolicy');
export const MAGIC_STUDIO_SERVER_APP_WORKSPACE_PROJECT_LATEST_RELEASE_PATH =
  requireContractRoutePathById('appWorkspaceProjectsReadLatestRelease');
export const MAGIC_STUDIO_SERVER_APP_WORKSPACE_PROJECT_RELEASE_DETAIL_PATH =
  requireContractRoutePathById('appWorkspaceProjectsReadRelease');
export const MAGIC_STUDIO_SERVER_APP_WORKSPACE_PROJECT_RELEASE_RESTORE_PATH =
  requireContractRoutePathById('appWorkspaceProjectsRestoreRelease');
export const MAGIC_STUDIO_SERVER_APP_WORKSPACE_PROJECT_RELEASE_MANIFEST_PATH =
  requireContractRoutePathById('appWorkspaceProjectsReadReleaseManifest');
export const MAGIC_STUDIO_SERVER_APP_WORKSPACE_PROJECT_RELEASE_ARTIFACT_PATH =
  requireContractRoutePathById('appWorkspaceProjectsReadReleaseArtifact');
export const MAGIC_STUDIO_SERVER_APP_WORKSPACE_PROJECT_RELEASE_REBUILD_PATH =
  requireContractRoutePathById('appWorkspaceProjectsRebuildRelease');
export const MAGIC_STUDIO_SERVER_APP_ASSETS_PATH =
  requireContractRoutePathById('appAssetsList');
export const MAGIC_STUDIO_SERVER_APP_ASSETS_STATS_PATH =
  requireContractRoutePathById('appAssetsReadStats');
export const MAGIC_STUDIO_SERVER_APP_ASSET_CATEGORIES_PATH =
  requireContractRoutePathById('appAssetsListCategories');
export const MAGIC_STUDIO_SERVER_APP_ASSET_IMPORT_FILE_PATH =
  requireContractRoutePathById('appAssetsImportFile');
export const MAGIC_STUDIO_SERVER_APP_ASSET_IMPORT_URL_PATH =
  requireContractRoutePathById('appAssetsImportUrl');
export const MAGIC_STUDIO_SERVER_APP_ASSET_DETAIL_PATH =
  requireContractRoutePathById('appAssetsRead');
export const MAGIC_STUDIO_SERVER_APP_ASSET_UPSERT_PATH =
  requireContractRoutePathById('appAssetsUpsert');
export const MAGIC_STUDIO_SERVER_APP_DRIVE_ROOT_PATH =
  requireContractRoutePathById('appDriveReadRoot');
export const MAGIC_STUDIO_SERVER_APP_DRIVE_ENTRIES_PATH =
  requireContractRoutePathById('appDriveListEntries');
export const MAGIC_STUDIO_SERVER_APP_DRIVE_STATS_PATH =
  requireContractRoutePathById('appDriveReadStats');
export const MAGIC_STUDIO_SERVER_APP_DRIVE_FILE_CONTENT_PATH =
  requireContractRoutePathById('appDriveReadFileContent');
export const MAGIC_STUDIO_SERVER_APP_DRIVE_FOLDERS_PATH =
  requireContractRoutePathById('appDriveCreateFolder');
export const MAGIC_STUDIO_SERVER_APP_DRIVE_UPLOADS_PATH =
  requireContractRoutePathById('appDriveUploadFile');
export const MAGIC_STUDIO_SERVER_APP_DRIVE_IMPORT_FILE_PATH =
  requireContractRoutePathById('appDriveImportFile');
export const MAGIC_STUDIO_SERVER_APP_DRIVE_RENAME_PATH =
  requireContractRoutePathById('appDriveRenameItem');
export const MAGIC_STUDIO_SERVER_APP_DRIVE_MOVE_PATH =
  requireContractRoutePathById('appDriveMoveItems');
export const MAGIC_STUDIO_SERVER_APP_DRIVE_DELETE_PATH =
  requireContractRoutePathById('appDriveDeleteItems');
export const MAGIC_STUDIO_SERVER_APP_DRIVE_RESTORE_PATH =
  requireContractRoutePathById('appDriveRestoreItems');
export const MAGIC_STUDIO_SERVER_APP_DRIVE_EMPTY_TRASH_PATH =
  requireContractRoutePathById('appDriveEmptyTrash');
export const MAGIC_STUDIO_SERVER_APP_DRIVE_FAVORITES_PATH =
  requireContractRoutePathById('appDriveFavoriteItem');
export const MAGIC_STUDIO_SERVER_APP_FILM_PROJECTS_PATH =
  requireContractRoutePathById('appFilmProjectsList');
export const MAGIC_STUDIO_SERVER_APP_FILM_PRESETS_PATH =
  requireContractRoutePathById('appFilmPresetsList');
export const MAGIC_STUDIO_SERVER_APP_FILM_TEMPLATES_PATH =
  requireContractRoutePathById('appFilmTemplatesList');
export const MAGIC_STUDIO_SERVER_APP_FILM_PROJECT_DETAIL_PATH =
  requireContractRoutePathById('appFilmProjectsRead');
export const MAGIC_STUDIO_SERVER_APP_FILM_TEMPLATE_DETAIL_PATH =
  requireContractRoutePathById('appFilmTemplatesRead');
export const MAGIC_STUDIO_SERVER_APP_FILM_PROJECT_GRAPH_PATH =
  requireContractRoutePathById('appFilmProjectsReadProjectGraph');
export const MAGIC_STUDIO_SERVER_APP_FILM_PROJECT_ASSET_INVENTORY_PATH =
  requireContractRoutePathById('appFilmProjectsReadAssetInventory');
export const MAGIC_STUDIO_SERVER_APP_FILM_PROJECT_PUBLISHES_PATH =
  requireContractRoutePathById('appFilmProjectsListPublishes');
export const MAGIC_STUDIO_SERVER_APP_FILM_PROJECT_REVIEW_QUEUE_PATH =
  requireContractRoutePathById('appFilmProjectsListReviewQueue');
export const MAGIC_STUDIO_SERVER_APP_FILM_PROJECT_REVIEW_PORTFOLIO_DASHBOARD_PATH =
  requireContractRoutePathById('appFilmProjectsReadReviewPortfolioDashboard');
export const MAGIC_STUDIO_SERVER_APP_FILM_PROJECT_REVIEWER_CAPACITY_PATH =
  requireContractRoutePathById('appFilmProjectsReadReviewReviewerCapacity');
export const MAGIC_STUDIO_SERVER_APP_FILM_PROJECT_DECISION_FRESHNESS_PATH =
  requireContractRoutePathById('appFilmProjectsReadReviewDecisionFreshness');
export const MAGIC_STUDIO_SERVER_APP_FILM_PROJECT_GOVERNANCE_DRIFT_PATH =
  requireContractRoutePathById('appFilmProjectsReadReviewGovernanceDrift');
export const MAGIC_STUDIO_SERVER_APP_FILM_PROJECT_ESCALATION_FORECAST_PATH =
  requireContractRoutePathById('appFilmProjectsReadReviewEscalationForecast');
export const MAGIC_STUDIO_SERVER_APP_FILM_PROJECT_DEPENDENCY_GRAPH_PATH =
  requireContractRoutePathById('appFilmProjectsReadReviewDependencyGraph');
export const MAGIC_STUDIO_SERVER_APP_FILM_PROJECT_INTERVENTION_PLAN_PATH =
  requireContractRoutePathById('appFilmProjectsReadReviewInterventionPlan');
export const MAGIC_STUDIO_SERVER_APP_FILM_PROJECT_RECOVERY_ORCHESTRATION_PATH =
  requireContractRoutePathById('appFilmProjectsReadReviewRecoveryOrchestration');
export const MAGIC_STUDIO_SERVER_APP_FILM_PROJECT_APPROVAL_BURN_DOWN_PATH =
  requireContractRoutePathById('appFilmProjectsReadReviewApprovalBurnDown');
export const MAGIC_STUDIO_SERVER_APP_FILM_PROJECT_EFFECTIVENESS_BASELINE_PATH =
  requireContractRoutePathById('appFilmProjectsReadReviewEffectivenessBaseline');
export const MAGIC_STUDIO_SERVER_APP_FILM_PROJECT_INTERVENTION_EXECUTION_HISTORY_PATH =
  requireContractRoutePathById(
    'appFilmProjectsReadReviewInterventionExecutionHistory',
  );
export const MAGIC_STUDIO_SERVER_APP_FILM_PROJECT_INTERVENTION_OUTCOMES_PATH =
  requireContractRoutePathById('appFilmProjectsReadReviewInterventionOutcomes');
export const MAGIC_STUDIO_SERVER_APP_FILM_PROJECT_PUBLISH_DETAIL_PATH =
  requireContractRoutePathById('appFilmProjectsReadPublish');
export const MAGIC_STUDIO_SERVER_APP_FILM_PROJECT_PUBLISH_REVIEW_STATE_PATH =
  requireContractRoutePathById('appFilmProjectsReadPublishReviewState');
export const MAGIC_STUDIO_SERVER_APP_FILM_PROJECT_PUBLISH_REVIEW_TIMELINE_PATH =
  requireContractRoutePathById('appFilmProjectsReadPublishReviewTimeline');
export const MAGIC_STUDIO_SERVER_APP_FILM_PROJECT_PUBLISH_REVIEW_ROUNDS_PATH =
  requireContractRoutePathById('appFilmProjectsReadPublishReviewRounds');
export const MAGIC_STUDIO_SERVER_APP_FILM_PROJECT_PUBLISH_REVIEW_ANCHORS_PATH =
  requireContractRoutePathById('appFilmProjectsReadPublishReviewAnchors');
export const MAGIC_STUDIO_SERVER_APP_FILM_PROJECT_PUBLISH_REVIEW_ACTIVITY_PATH =
  requireContractRoutePathById('appFilmProjectsReadPublishReviewActivity');
export const MAGIC_STUDIO_SERVER_APP_FILM_PROJECT_PUBLISH_REVIEW_ANCHOR_RESPONSIBILITY_PATH =
  requireContractRoutePathById('appFilmProjectsReadPublishReviewAnchorResponsibility');
export const MAGIC_STUDIO_SERVER_APP_FILM_PROJECT_PUBLISH_REVIEWER_BACKLOG_PATH =
  requireContractRoutePathById('appFilmProjectsReadPublishReviewReviewerBacklog');
export const MAGIC_STUDIO_SERVER_APP_FILM_PROJECT_PUBLISH_REVIEW_DECISION_MATRIX_PATH =
  requireContractRoutePathById('appFilmProjectsReadPublishReviewDecisionMatrix');
export const MAGIC_STUDIO_SERVER_APP_FILM_PROJECT_PUBLISH_REVIEW_WORKLIST_PATH =
  requireContractRoutePathById('appFilmProjectsReadPublishReviewWorklist');
export const MAGIC_STUDIO_SERVER_APP_FILM_PROJECT_PUBLISH_REVIEW_READINESS_PATH =
  requireContractRoutePathById('appFilmProjectsReadPublishReviewReadiness');
export const MAGIC_STUDIO_SERVER_APP_FILM_PROJECT_PUBLISH_REVIEWER_ATTENTION_PATH =
  requireContractRoutePathById('appFilmProjectsReadPublishReviewReviewerAttention');
export const MAGIC_STUDIO_SERVER_APP_FILM_PROJECT_PUBLISH_REVIEWER_COVERAGE_PATH =
  requireContractRoutePathById('appFilmProjectsReadPublishReviewReviewerCoverage');
export const MAGIC_STUDIO_SERVER_APP_FILM_PROJECT_PUBLISH_REVIEW_OPERATIONS_DASHBOARD_PATH =
  requireContractRoutePathById('appFilmProjectsReadPublishReviewOperationsDashboard');
export const MAGIC_STUDIO_SERVER_APP_FILM_PROJECT_PUBLISH_STALE_DECISIONS_PATH =
  requireContractRoutePathById('appFilmProjectsReadPublishReviewStaleDecisions');
export const MAGIC_STUDIO_SERVER_APP_FILM_PROJECT_PUBLISH_REVIEW_LATENCY_ANALYTICS_PATH =
  requireContractRoutePathById('appFilmProjectsReadPublishReviewLatencyAnalytics');
export const MAGIC_STUDIO_SERVER_APP_FILM_PROJECT_PUBLISH_APPROVE_PATH =
  requireContractRoutePathById('appFilmProjectsApprovePublish');
export const MAGIC_STUDIO_SERVER_APP_FILM_PROJECT_PUBLISH_REQUEST_CHANGES_PATH =
  requireContractRoutePathById('appFilmProjectsRequestPublishChanges');
export const MAGIC_STUDIO_SERVER_APP_FILM_PROJECT_PUBLISH_REVIEW_COMMENTS_PATH =
  requireContractRoutePathById('appFilmProjectsCreatePublishReviewComment');
export const MAGIC_STUDIO_SERVER_APP_FILM_PROJECT_PUBLISH_REVIEW_SUBMIT_PATH =
  requireContractRoutePathById('appFilmProjectsSubmitPublishReview');
export const MAGIC_STUDIO_SERVER_APP_FILM_PROJECT_PUBLISH_REVIEW_CONSENSUS_PATH =
  requireContractRoutePathById('appFilmProjectsConsensusPublishReview');
export const MAGIC_STUDIO_SERVER_APP_FILM_PROJECT_PUBLISH_REVIEW_ASSIGNMENTS_PATH =
  requireContractRoutePathById('appFilmProjectsSetPublishReviewAssignments');
export const MAGIC_STUDIO_SERVER_APP_FILM_PROJECT_PUBLISH_REVIEW_COMMENT_RESOLVE_PATH =
  requireContractRoutePathById('appFilmProjectsResolvePublishReviewComment');
export const MAGIC_STUDIO_SERVER_APP_FILM_PROJECT_PUBLISH_REOPEN_PATH =
  requireContractRoutePathById('appFilmProjectsReopenPublish');
export const MAGIC_STUDIO_SERVER_APP_FILM_PROJECT_PUBLISH_ARTIFACT_CONTENT_PATH =
  requireContractRoutePathById('appFilmProjectsReadPublishArtifactContent');
export const MAGIC_STUDIO_SERVER_APP_FILM_PROJECT_PUBLISH_RESTORE_PATH =
  requireContractRoutePathById('appFilmProjectsRestorePublish');
export const MAGIC_STUDIO_SERVER_APP_FILM_PROJECT_TEMPLATE_SNAPSHOTS_PATH =
  requireContractRoutePathById('appFilmProjectsCreateTemplateSnapshot');
export const MAGIC_STUDIO_SERVER_APP_FILM_ANALYSIS_SCRIPT_PATH =
  requireContractRoutePathById('appFilmAnalysisScript');
export const MAGIC_STUDIO_SERVER_APP_FILM_STANDARDIZE_SCRIPT_PATH =
  requireContractRoutePathById('appFilmProjectsStandardizeScript');
export const MAGIC_STUDIO_SERVER_APP_FILM_PREPARE_ANALYSIS_PATH =
  requireContractRoutePathById('appFilmProjectsPrepareAnalysis');
export const MAGIC_STUDIO_SERVER_APP_FILM_REBUILD_STORYBOARD_PATH =
  requireContractRoutePathById('appFilmProjectsRebuildStoryboard');
export const MAGIC_STUDIO_SERVER_APP_FILM_CREATE_SCENE_BREAKDOWN_PATH =
  requireContractRoutePathById('appFilmProjectsCreateSceneBreakdown');
export const MAGIC_STUDIO_SERVER_APP_FILM_CREATE_SHOOTING_PLAN_PATH =
  requireContractRoutePathById('appFilmProjectsCreateShootingPlan');
export const MAGIC_STUDIO_SERVER_APP_FILM_GENERATE_SHOT_VARIANTS_PATH =
  requireContractRoutePathById('appFilmProjectsGenerateShotVariants');
export const MAGIC_STUDIO_SERVER_APP_FILM_ANALYSIS_CHARACTERS_PATH =
  requireContractRoutePathById('appFilmAnalysisCharacters');
export const MAGIC_STUDIO_SERVER_APP_FILM_ANALYSIS_PROPS_PATH =
  requireContractRoutePathById('appFilmAnalysisProps');
export const MAGIC_STUDIO_SERVER_APP_FILM_STORYBOARD_GENERATE_PATH =
  requireContractRoutePathById('appFilmProjectsGenerateStoryboard');
export const MAGIC_STUDIO_SERVER_APP_FILM_SHOTS_SYNC_PATH =
  requireContractRoutePathById('appFilmProjectsSyncShots');
export const MAGIC_STUDIO_SERVER_APP_FILM_AUTHORING_BATCH_PATH =
  requireContractRoutePathById('appFilmProjectsRunAuthoringBatch');
export const MAGIC_STUDIO_SERVER_APP_FILM_REFRESH_ANALYSIS_PATH =
  requireContractRoutePathById('appFilmProjectsRefreshAnalysis');
export const MAGIC_STUDIO_SERVER_APP_FILM_TEMPLATE_INSTANTIATE_PATH =
  requireContractRoutePathById('appFilmTemplatesInstantiate');
export const MAGIC_STUDIO_SERVER_APP_FILM_APPLY_PRESET_PATH =
  requireContractRoutePathById('appFilmProjectsApplyPreset');
export const MAGIC_STUDIO_SERVER_APP_FILM_ASSETS_RELINK_PATH =
  requireContractRoutePathById('appFilmProjectsRelinkAssets');
export const MAGIC_STUDIO_SERVER_APP_FILM_ASSETS_BIND_PATH =
  requireContractRoutePathById('appFilmProjectsBindAsset');
export const MAGIC_STUDIO_SERVER_APP_FILM_EXPORT_PACKAGE_PATH =
  requireContractRoutePathById('appFilmProjectsExportPackage');
export const MAGIC_STUDIO_SERVER_APP_FILM_PUBLISH_STORYBOARD_PATH =
  requireContractRoutePathById('appFilmProjectsPublishStoryboard');
export const MAGIC_STUDIO_SERVER_APP_FILM_IMPORT_PACKAGE_PATH =
  requireContractRoutePathById('appFilmProjectsImportPackage');
export const MAGIC_STUDIO_SERVER_APP_FILM_VALIDATE_PROJECT_PATH =
  requireContractRoutePathById('appFilmProjectsValidate');
export const MAGIC_STUDIO_SERVER_APP_MAGICCUT_PROJECTS_PATH =
  requireContractRoutePathById('appMagicCutProjectsList');
export const MAGIC_STUDIO_SERVER_APP_MAGICCUT_PROJECT_DETAIL_PATH =
  requireContractRoutePathById('appMagicCutProjectsRead');
export const MAGIC_STUDIO_SERVER_APP_MAGICCUT_PROJECT_DUPLICATE_PATH =
  requireContractRoutePathById('appMagicCutProjectsDuplicate');
export const MAGIC_STUDIO_SERVER_APP_MAGICCUT_TEMPLATES_PATH =
  requireContractRoutePathById('appMagicCutTemplatesList');
export const MAGIC_STUDIO_SERVER_APP_MAGICCUT_TEMPLATE_DETAIL_PATH =
  requireContractRoutePathById('appMagicCutTemplatesRead');
export const MAGIC_STUDIO_SERVER_APP_MAGICCUT_TEMPLATE_INSTANTIATE_PATH =
  requireContractRoutePathById('appMagicCutTemplatesInstantiate');
export const MAGIC_STUDIO_SERVER_APP_MAGICCUT_RENDER_CAPABILITIES_PATH =
  requireContractRoutePathById('appMagicCutReadRenderCapabilities');
export const MAGIC_STUDIO_SERVER_APP_MAGICCUT_RENDERS_PATH =
  requireContractRoutePathById('appMagicCutListRenders');
export const MAGIC_STUDIO_SERVER_APP_MAGICCUT_PROJECT_RENDERS_PATH =
  requireContractRoutePathById('appMagicCutCreateRender');
export const MAGIC_STUDIO_SERVER_APP_MAGICCUT_RENDER_DETAIL_PATH =
  requireContractRoutePathById('appMagicCutReadRender');
export const MAGIC_STUDIO_SERVER_APP_MAGICCUT_RENDER_CANCEL_PATH =
  requireContractRoutePathById('appMagicCutCancelRender');
export const MAGIC_STUDIO_SERVER_APP_MAGICCUT_RENDER_ARTIFACTS_PATH =
  requireContractRoutePathById('appMagicCutListRenderArtifacts');
export const MAGIC_STUDIO_SERVER_APP_MAGICCUT_RENDER_ARTIFACT_CONTENT_PATH =
  requireContractRoutePathById('appMagicCutReadRenderArtifactContent');
export const MAGIC_STUDIO_SERVER_APP_AUTH_SESSION_PATH =
  requireContractRoutePathById('appAuthReadSession');
export const MAGIC_STUDIO_SERVER_APP_AUTH_LOGIN_PATH =
  requireContractRoutePathById('appAuthLogin');
export const MAGIC_STUDIO_SERVER_APP_AUTH_LOGIN_PHONE_PATH =
  requireContractRoutePathById('appAuthLoginWithPhone');
export const MAGIC_STUDIO_SERVER_APP_AUTH_REGISTER_PATH =
  requireContractRoutePathById('appAuthRegister');
export const MAGIC_STUDIO_SERVER_APP_AUTH_LOGOUT_PATH =
  requireContractRoutePathById('appAuthLogout');
export const MAGIC_STUDIO_SERVER_APP_AUTH_REFRESH_TOKEN_PATH =
  requireContractRoutePathById('appAuthRefreshToken');
export const MAGIC_STUDIO_SERVER_APP_AUTH_VERIFY_CODE_SEND_PATH =
  requireContractRoutePathById('appAuthSendVerifyCode');
export const MAGIC_STUDIO_SERVER_APP_AUTH_VERIFY_CODE_CHECK_PATH =
  requireContractRoutePathById('appAuthCheckVerifyCode');
export const MAGIC_STUDIO_SERVER_APP_AUTH_PASSWORD_RESET_REQUEST_PATH =
  requireContractRoutePathById('appAuthRequestPasswordReset');
export const MAGIC_STUDIO_SERVER_APP_AUTH_PASSWORD_RESET_CONFIRM_PATH =
  requireContractRoutePathById('appAuthResetPassword');
export const MAGIC_STUDIO_SERVER_APP_AUTH_QR_CODE_PATH =
  requireContractRoutePathById('appAuthCreateQrCode');
export const MAGIC_STUDIO_SERVER_APP_AUTH_QR_CODE_DETAIL_PATH =
  requireContractRoutePathById('appAuthReadQrCodeStatus');
export const MAGIC_STUDIO_SERVER_APP_USER_PROFILE_PATH =
  requireContractRoutePathById('appUserReadProfile');
export const MAGIC_STUDIO_SERVER_APP_USER_AVATAR_PATH =
  requireContractRoutePathById('appUserUploadAvatar');
export const MAGIC_STUDIO_SERVER_APP_USER_SETTINGS_PATH =
  requireContractRoutePathById('appUserReadSettings');
export const MAGIC_STUDIO_SERVER_APP_USER_CHANGE_PASSWORD_PATH =
  requireContractRoutePathById('appUserChangePassword');
export const MAGIC_STUDIO_SERVER_APP_USER_ADDRESSES_PATH =
  requireContractRoutePathById('appUserListAddresses');
export const MAGIC_STUDIO_SERVER_APP_USER_DEFAULT_ADDRESS_PATH =
  requireContractRoutePathById('appUserReadDefaultAddress');
export const MAGIC_STUDIO_SERVER_APP_USER_ADDRESS_DETAIL_PATH =
  requireContractRoutePathById('appUserUpdateAddress');
export const MAGIC_STUDIO_SERVER_APP_USER_ADDRESS_DEFAULT_PATH =
  requireContractRoutePathById('appUserSetDefaultAddress');
export const MAGIC_STUDIO_SERVER_APP_USER_LOGIN_HISTORY_PATH =
  requireContractRoutePathById('appUserReadLoginHistory');
export const MAGIC_STUDIO_SERVER_APP_USER_GENERATION_HISTORY_PATH =
  requireContractRoutePathById('appUserReadGenerationHistory');
export const MAGIC_STUDIO_SERVER_APP_USER_SESSIONS_PATH =
  requireContractRoutePathById('appUserListSessions');
export const MAGIC_STUDIO_SERVER_APP_USER_DEVICES_PATH =
  requireContractRoutePathById('appUserListDevices');
export const MAGIC_STUDIO_SERVER_APP_USER_TWO_FACTOR_PATH =
  requireContractRoutePathById('appUserReadTwoFactorStatus');
export const MAGIC_STUDIO_SERVER_APP_USER_TWO_FACTOR_SETUP_PATH =
  requireContractRoutePathById('appUserSetupTwoFactor');
export const MAGIC_STUDIO_SERVER_APP_USER_TWO_FACTOR_VERIFY_PATH =
  requireContractRoutePathById('appUserVerifyTwoFactor');
export const MAGIC_STUDIO_SERVER_APP_USER_BINDINGS_PATH =
  requireContractRoutePathById('appUserListBindings');
export const MAGIC_STUDIO_SERVER_APP_USER_BIND_EMAIL_PATH =
  requireContractRoutePathById('appUserBindEmail');
export const MAGIC_STUDIO_SERVER_APP_USER_BIND_PHONE_PATH =
  requireContractRoutePathById('appUserBindPhone');
export const MAGIC_STUDIO_SERVER_APP_USER_BIND_PLATFORM_PATH =
  requireContractRoutePathById('appUserBindThirdParty');
export const MAGIC_STUDIO_SERVER_APP_GENERATION_TASKS_PATH =
  requireContractRoutePathById('appGenerationListTasks');
export const MAGIC_STUDIO_SERVER_APP_GENERATION_TASK_DETAIL_PATH =
  requireContractRoutePathById('appGenerationReadTask');
export const MAGIC_STUDIO_SERVER_APP_GENERATION_TASK_CANCEL_PATH =
  requireContractRoutePathById('appGenerationCancelTask');
export const MAGIC_STUDIO_SERVER_APP_GENERATION_IMAGE_TASKS_PATH =
  requireContractRoutePathById('appGenerationImagesCreateTask');
export const MAGIC_STUDIO_SERVER_APP_GENERATION_IMAGE_VARIATIONS_PATH =
  requireContractRoutePathById('appGenerationImagesCreateVariation');
export const MAGIC_STUDIO_SERVER_APP_GENERATION_IMAGE_EDITS_PATH =
  requireContractRoutePathById('appGenerationImagesCreateEdit');
export const MAGIC_STUDIO_SERVER_APP_GENERATION_IMAGE_UPSCALES_PATH =
  requireContractRoutePathById('appGenerationImagesCreateUpscale');
export const MAGIC_STUDIO_SERVER_APP_GENERATION_IMAGE_PROMPT_ENHANCE_PATH =
  requireContractRoutePathById('appGenerationImagesEnhancePrompt');
export const MAGIC_STUDIO_SERVER_APP_GENERATION_IMAGE_TASK_DETAIL_PATH =
  requireContractRoutePathById('appGenerationImagesReadTask');
export const MAGIC_STUDIO_SERVER_APP_GENERATION_VIDEO_TASKS_PATH =
  requireContractRoutePathById('appGenerationVideosCreateTask');
export const MAGIC_STUDIO_SERVER_APP_GENERATION_VIDEO_IMAGE_TO_VIDEO_PATH =
  requireContractRoutePathById('appGenerationVideosCreateImageToVideo');
export const MAGIC_STUDIO_SERVER_APP_GENERATION_VIDEO_EXTEND_PATH =
  requireContractRoutePathById('appGenerationVideosCreateExtend');
export const MAGIC_STUDIO_SERVER_APP_GENERATION_VIDEO_STYLE_TRANSFER_PATH =
  requireContractRoutePathById('appGenerationVideosCreateStyleTransfer');
export const MAGIC_STUDIO_SERVER_APP_GENERATION_VIDEO_LIP_SYNC_PATH =
  requireContractRoutePathById('appGenerationVideosCreateLipSync');
export const MAGIC_STUDIO_SERVER_APP_GENERATION_VIDEO_PROMPT_ENHANCE_PATH =
  requireContractRoutePathById('appGenerationVideosEnhancePrompt');
export const MAGIC_STUDIO_SERVER_APP_GENERATION_VIDEO_TASK_DETAIL_PATH =
  requireContractRoutePathById('appGenerationVideosReadTask');
export const MAGIC_STUDIO_SERVER_APP_GENERATION_VIDEO_TASK_CANCEL_PATH =
  requireContractRoutePathById('appGenerationVideosCancelTask');
export const MAGIC_STUDIO_SERVER_APP_GENERATION_AUDIO_TEXT_TO_SPEECH_PATH =
  requireContractRoutePathById('appGenerationAudioCreateTextToSpeech');
export const MAGIC_STUDIO_SERVER_APP_GENERATION_AUDIO_TRANSCRIPTIONS_PATH =
  requireContractRoutePathById('appGenerationAudioCreateTranscription');
export const MAGIC_STUDIO_SERVER_APP_GENERATION_AUDIO_TRANSLATIONS_PATH =
  requireContractRoutePathById('appGenerationAudioCreateTranslation');
export const MAGIC_STUDIO_SERVER_APP_GENERATION_AUDIO_TASK_DETAIL_PATH =
  requireContractRoutePathById('appGenerationAudioReadTask');
export const MAGIC_STUDIO_SERVER_APP_GENERATION_MUSIC_TASKS_PATH =
  requireContractRoutePathById('appGenerationMusicCreateTask');
export const MAGIC_STUDIO_SERVER_APP_GENERATION_MUSIC_SIMILAR_PATH =
  requireContractRoutePathById('appGenerationMusicCreateSimilar');
export const MAGIC_STUDIO_SERVER_APP_GENERATION_MUSIC_REMIX_PATH =
  requireContractRoutePathById('appGenerationMusicCreateRemix');
export const MAGIC_STUDIO_SERVER_APP_GENERATION_MUSIC_EXTEND_PATH =
  requireContractRoutePathById('appGenerationMusicCreateExtend');
export const MAGIC_STUDIO_SERVER_APP_GENERATION_MUSIC_TASK_DETAIL_PATH =
  requireContractRoutePathById('appGenerationMusicReadTask');
export const MAGIC_STUDIO_SERVER_APP_GENERATION_SFX_TASKS_PATH =
  requireContractRoutePathById('appGenerationSfxCreateTask');
export const MAGIC_STUDIO_SERVER_APP_GENERATION_SFX_CATEGORIES_PATH =
  requireContractRoutePathById('appGenerationSfxListCategories');
export const MAGIC_STUDIO_SERVER_APP_GENERATION_SFX_TASK_DETAIL_PATH =
  requireContractRoutePathById('appGenerationSfxReadTask');
export const MAGIC_STUDIO_SERVER_APP_GENERATION_SFX_TASK_CANCEL_PATH =
  requireContractRoutePathById('appGenerationSfxCancelTask');
export const MAGIC_STUDIO_SERVER_APP_GENERATION_CHARACTER_TASKS_PATH =
  requireContractRoutePathById('appGenerationCharactersListTasks');
export const MAGIC_STUDIO_SERVER_APP_GENERATION_CHARACTER_TASK_DETAIL_PATH =
  requireContractRoutePathById('appGenerationCharactersReadTask');
export const MAGIC_STUDIO_SERVER_APP_GENERATION_CHARACTER_TASK_CANCEL_PATH =
  requireContractRoutePathById('appGenerationCharactersCancelTask');
export const MAGIC_STUDIO_SERVER_APP_GENERATION_CATALOG_MODELS_PATH =
  requireContractRoutePathById('appGenerationCatalogListModels');
export const MAGIC_STUDIO_SERVER_APP_GENERATION_CATALOG_STYLES_PATH =
  requireContractRoutePathById('appGenerationCatalogListStyles');
export const MAGIC_STUDIO_SERVER_APP_GENERATION_CATALOG_PROVIDERS_PATH =
  requireContractRoutePathById('appGenerationCatalogListProviders');
export const MAGIC_STUDIO_SERVER_APP_GENERATION_CATALOG_VOICES_PATH =
  requireContractRoutePathById('appGenerationCatalogListVoices');
export const MAGIC_STUDIO_SERVER_APP_VOICES_MARKET_PATH =
  requireContractRoutePathById('appVoicesListMarket');
export const MAGIC_STUDIO_SERVER_APP_VOICES_WORKSPACE_PATH =
  requireContractRoutePathById('appVoicesListWorkspace');
export const MAGIC_STUDIO_SERVER_APP_VOICES_CUSTOM_PATH =
  requireContractRoutePathById('appVoicesListCustom');
export const MAGIC_STUDIO_SERVER_APP_VOICE_SPEAKER_DETAIL_PATH =
  requireContractRoutePathById('appVoicesReadSpeaker');
export const MAGIC_STUDIO_SERVER_APP_VOICE_CLONE_TASKS_PATH =
  requireContractRoutePathById('appVoicesCreateCloneTask');
export const MAGIC_STUDIO_SERVER_APP_VOICE_CLONE_TASK_DETAIL_PATH =
  requireContractRoutePathById('appVoicesReadCloneTask');
export const MAGIC_STUDIO_SERVER_APP_VOICE_PREVIEW_PATH =
  requireContractRoutePathById('appVoicesUpdatePreview');
export const MAGIC_STUDIO_SERVER_APP_VOICE_SPEECH_TASKS_PATH =
  requireContractRoutePathById('appVoicesListSpeechTasks');
export const MAGIC_STUDIO_SERVER_APP_VOICE_SPEECH_TASK_DETAIL_PATH =
  requireContractRoutePathById('appVoicesReadSpeechTask');
export const MAGIC_STUDIO_SERVER_APP_VOICE_SPEECH_TASK_CANCEL_PATH =
  requireContractRoutePathById('appVoicesCancelSpeechTask');
export const MAGIC_STUDIO_SERVER_APP_CAPABILITIES_SUMMARY_PATH =
  requireContractRoutePathById('appCapabilitiesReadSummary');
export const MAGIC_STUDIO_SERVER_APP_CAPABILITIES_DOMAINS_PATH =
  requireContractRoutePathById('appCapabilitiesListDomains');
export const MAGIC_STUDIO_SERVER_APP_CAPABILITIES_EXECUTION_PATH =
  requireContractRoutePathById('appCapabilitiesListExecution');
export const MAGIC_STUDIO_SERVER_APP_CREATION_CAPABILITIES_PATH =
  requireContractRoutePathById('appCreationReadCapabilities');
export const MAGIC_STUDIO_SERVER_APP_CREATION_BATCHES_PATH =
  requireContractRoutePathById('appCreationListBatches');
export const MAGIC_STUDIO_SERVER_APP_CREATION_BATCH_DETAIL_PATH =
  requireContractRoutePathById('appCreationReadBatch');
export const MAGIC_STUDIO_SERVER_APP_CREATION_BATCH_MATERIALIZE_PATH =
  requireContractRoutePathById('appCreationMaterializeBatch');
export const MAGIC_STUDIO_SERVER_APP_CREATION_BATCH_ITEM_STATUS_PATH =
  requireContractRoutePathById('appCreationUpdateBatchItemStatus');
export const MAGIC_STUDIO_SERVER_APP_CREATION_PRESETS_PATH =
  requireContractRoutePathById('appCreationListPresets');
export const MAGIC_STUDIO_SERVER_APP_CREATION_PRESET_DETAIL_PATH =
  requireContractRoutePathById('appCreationReadPreset');
export const MAGIC_STUDIO_SERVER_APP_CREATION_TEMPLATES_PATH =
  requireContractRoutePathById('appCreationListTemplates');
export const MAGIC_STUDIO_SERVER_APP_CREATION_TEMPLATE_DETAIL_PATH =
  requireContractRoutePathById('appCreationReadTemplate');
export const MAGIC_STUDIO_SERVER_APP_CREATION_TEMPLATE_APPLY_PATH =
  requireContractRoutePathById('appCreationApplyTemplate');
export const MAGIC_STUDIO_SERVER_APP_CREATION_HISTORY_PATH =
  requireContractRoutePathById('appCreationListHistory');
export const MAGIC_STUDIO_SERVER_APP_CREATION_HISTORY_ENTRY_PATH =
  requireContractRoutePathById('appCreationReadHistoryEntry');
export const MAGIC_STUDIO_SERVER_APP_CREATION_HISTORY_FAVORITE_PATH =
  requireContractRoutePathById('appCreationFavoriteHistoryEntry');
export const MAGIC_STUDIO_SERVER_APP_CREATION_SESSIONS_PATH =
  requireContractRoutePathById('appCreationCreateSession');
export const MAGIC_STUDIO_SERVER_APP_CREATION_CURRENT_SESSION_PATH =
  requireContractRoutePathById('appCreationReadCurrentSession');
export const MAGIC_STUDIO_SERVER_APP_CREATION_CONSUME_CURRENT_SESSION_PATH =
  requireContractRoutePathById('appCreationConsumeCurrentSession');
export const MAGIC_STUDIO_SERVER_APP_CHAT_SESSIONS_PATH =
  requireContractRoutePathById('appChatListSessions');
export const MAGIC_STUDIO_SERVER_APP_CHAT_SESSION_DETAIL_PATH =
  requireContractRoutePathById('appChatReadSession');
export const MAGIC_STUDIO_SERVER_APP_CHAT_SESSION_TRANSCRIPT_PATH =
  requireContractRoutePathById('appChatReadTranscript');
export const MAGIC_STUDIO_SERVER_APP_PRESENTATIONS_PATH =
  requireContractRoutePathById('appPresentationsList');
export const MAGIC_STUDIO_SERVER_APP_PRESENTATION_DETAIL_PATH =
  requireContractRoutePathById('appPresentationsRead');
export const MAGIC_STUDIO_SERVER_APP_PRESENTATION_SLIDES_PATH =
  requireContractRoutePathById('appPresentationsCreateSlide');
export const MAGIC_STUDIO_SERVER_APP_PRESENTATION_SLIDE_DETAIL_PATH =
  requireContractRoutePathById('appPresentationsUpdateSlide');
export const MAGIC_STUDIO_SERVER_APP_PROMPT_OPTIMIZE_PATH =
  requireContractRoutePathById('appPromptOptimize');
export const MAGIC_STUDIO_SERVER_APP_NOTES_WORKSPACE_SNAPSHOT_PATH =
  requireContractRoutePathById('appNotesWorkspaceSnapshot');
export const MAGIC_STUDIO_SERVER_APP_NOTES_PATH =
  requireContractRoutePathById('appNotesList');
export const MAGIC_STUDIO_SERVER_APP_NOTES_TRASHED_PATH =
  requireContractRoutePathById('appNotesListTrashed');
export const MAGIC_STUDIO_SERVER_APP_NOTE_DETAIL_PATH =
  requireContractRoutePathById('appNotesRead');
export const MAGIC_STUDIO_SERVER_APP_NOTE_FOLDERS_PATH =
  requireContractRoutePathById('appNotesCreateFolder');
export const MAGIC_STUDIO_SERVER_APP_NOTE_FOLDER_DETAIL_PATH =
  requireContractRoutePathById('appNotesRenameFolder');
export const MAGIC_STUDIO_SERVER_APP_NOTE_TRASH_PATH =
  requireContractRoutePathById('appNotesTrash');
export const MAGIC_STUDIO_SERVER_APP_NOTE_RESTORE_PATH =
  requireContractRoutePathById('appNotesRestore');
export const MAGIC_STUDIO_SERVER_APP_NOTE_DELETE_PATH =
  requireContractRoutePathById('appNotesDelete');
export const MAGIC_STUDIO_SERVER_APP_NOTES_CLEAR_TRASH_PATH =
  requireContractRoutePathById('appNotesClearTrash');
export const MAGIC_STUDIO_SERVER_APP_NOTE_FOLDER_MOVE_PATH =
  requireContractRoutePathById('appNotesMoveFolder');
export const MAGIC_STUDIO_SERVER_APP_NOTE_MOVE_PATH =
  requireContractRoutePathById('appNotesMove');
export const MAGIC_STUDIO_SERVER_APP_NOTE_PUBLISH_PATH =
  requireContractRoutePathById('appNotesPublish');
export const MAGIC_STUDIO_SERVER_APP_PORTAL_FEEDS_PATH =
  requireContractRoutePathById('appPortalFeedsCreate');
export const MAGIC_STUDIO_SERVER_APP_PORTAL_FEATURED_FEEDS_PATH =
  requireContractRoutePathById('appPortalFeedsListFeatured');
export const MAGIC_STUDIO_SERVER_APP_PORTAL_DISCOVER_FEEDS_PATH =
  requireContractRoutePathById('appPortalFeedsListDiscover');
export const MAGIC_STUDIO_SERVER_APP_PORTAL_FEED_DETAIL_PATH =
  requireContractRoutePathById('appPortalFeedsRead');
export const MAGIC_STUDIO_SERVER_APP_PORTAL_FEED_LIKE_PATH =
  requireContractRoutePathById('appPortalFeedsLike');
export const MAGIC_STUDIO_SERVER_APP_PORTAL_FEED_UNLIKE_PATH =
  requireContractRoutePathById('appPortalFeedsUnlike');
export const MAGIC_STUDIO_SERVER_APP_PORTAL_FEED_COLLECT_PATH =
  requireContractRoutePathById('appPortalFeedsCollect');
export const MAGIC_STUDIO_SERVER_APP_PORTAL_FEED_UNCOLLECT_PATH =
  requireContractRoutePathById('appPortalFeedsUncollect');
export const MAGIC_STUDIO_SERVER_APP_PORTAL_FEED_SHARE_PATH =
  requireContractRoutePathById('appPortalFeedsShare');
export const MAGIC_STUDIO_SERVER_APP_TRADE_TASKS_AVAILABLE_PATH =
  requireContractRoutePathById('appTradeTasksListAvailable');
export const MAGIC_STUDIO_SERVER_APP_TRADE_TASKS_PUBLISHED_PATH =
  requireContractRoutePathById('appTradeTasksListPublished');
export const MAGIC_STUDIO_SERVER_APP_TRADE_TASKS_ACCEPTED_PATH =
  requireContractRoutePathById('appTradeTasksListAccepted');
export const MAGIC_STUDIO_SERVER_APP_TRADE_TASK_DETAIL_PATH =
  requireContractRoutePathById('appTradeTasksRead');
export const MAGIC_STUDIO_SERVER_APP_TRADE_TASK_ACCEPT_PATH =
  requireContractRoutePathById('appTradeTasksAccept');
export const MAGIC_STUDIO_SERVER_APP_TRADE_TASK_SUBMIT_PATH =
  requireContractRoutePathById('appTradeTasksSubmit');
export const MAGIC_STUDIO_SERVER_APP_TRADE_TASK_APPROVE_PATH =
  requireContractRoutePathById('appTradeTasksApprove');
export const MAGIC_STUDIO_SERVER_APP_TRADE_TASK_CANCEL_PATH =
  requireContractRoutePathById('appTradeTasksCancel');
export const MAGIC_STUDIO_SERVER_APP_TRADE_ORDERS_PATH =
  requireContractRoutePathById('appTradeOrdersList');
export const MAGIC_STUDIO_SERVER_APP_TRADE_ORDER_DETAIL_PATH =
  requireContractRoutePathById('appTradeOrdersRead');
export const MAGIC_STUDIO_SERVER_APP_TRADE_ORDER_STATUS_PATH =
  requireContractRoutePathById('appTradeOrdersUpdateStatus');
export const MAGIC_STUDIO_SERVER_APP_TRADE_ORDER_CANCEL_PATH =
  requireContractRoutePathById('appTradeOrdersCancel');
export const MAGIC_STUDIO_SERVER_APP_TRADE_ORDER_STATISTICS_PATH =
  requireContractRoutePathById('appTradeOrdersReadStatistics');
export const MAGIC_STUDIO_SERVER_APP_TRADE_PAYMENTS_PATH =
  requireContractRoutePathById('appTradePaymentsList');
export const MAGIC_STUDIO_SERVER_APP_TRADE_PAYMENT_DETAIL_PATH =
  requireContractRoutePathById('appTradePaymentsRead');
export const MAGIC_STUDIO_SERVER_APP_TRADE_PAYMENT_REFUND_PATH =
  requireContractRoutePathById('appTradePaymentsRefund');
export const MAGIC_STUDIO_SERVER_APP_TRADE_PAYMENT_RECHARGE_PATH =
  requireContractRoutePathById('appTradePaymentsRecharge');
export const MAGIC_STUDIO_SERVER_APP_TRADE_WALLET_PATH =
  requireContractRoutePathById('appTradeWalletRead');
export const MAGIC_STUDIO_SERVER_APP_TRADE_TRANSACTIONS_PATH =
  requireContractRoutePathById('appTradeTransactionsList');
export const MAGIC_STUDIO_SERVER_APP_VIP_PLANS_PATH =
  requireContractRoutePathById('appVipPlansList');
export const MAGIC_STUDIO_SERVER_APP_VIP_STATUS_PATH =
  requireContractRoutePathById('appVipReadStatus');
export const MAGIC_STUDIO_SERVER_APP_VIP_PURCHASE_PATH =
  requireContractRoutePathById('appVipPurchase');
export const MAGIC_STUDIO_SERVER_APP_VIP_SUBSCRIPTIONS_PATH =
  requireContractRoutePathById('appVipSubscriptionsList');
export const MAGIC_STUDIO_SERVER_APP_VIP_SUBSCRIPTION_CANCEL_PATH =
  requireContractRoutePathById('appVipSubscriptionsCancel');
export const MAGIC_STUDIO_SERVER_ADMIN_DEPLOYMENTS_PATH =
  requireContractRoutePathById('adminDeploymentsList');
export const MAGIC_STUDIO_SERVER_ADMIN_RUNTIME_AUDITS_PATH =
  requireContractRoutePathById('adminRuntimeAuditsRead');
export const MAGIC_STUDIO_SERVER_ADMIN_JOBS_METRICS_PATH =
  requireContractRoutePathById('adminJobsMetricsRead');
export const MAGIC_STUDIO_SERVER_ADMIN_POLICY_AUDITS_PATH =
  requireContractRoutePathById('adminPolicyAuditsRead');
export const MAGIC_STUDIO_SERVER_ADMIN_STORAGE_PROVIDERS_PATH =
  requireContractRoutePathById('adminStorageProvidersList');
export const MAGIC_STUDIO_SERVER_ADMIN_EXECUTION_PROVIDERS_PATH =
  requireContractRoutePathById('adminExecutionProvidersList');
export const MAGIC_STUDIO_SERVER_ADMIN_EXECUTION_PROVIDER_DETAIL_PATH =
  requireContractRoutePathById('adminExecutionProvidersRead');
export const MAGIC_STUDIO_SERVER_ADMIN_EXECUTION_PROVIDER_RECONCILE_PATH =
  requireContractRoutePathById('adminExecutionProvidersReconcile');
export const MAGIC_STUDIO_SERVER_ADMIN_EXECUTION_PROVIDER_HEALTH_PATH =
  requireContractRoutePathById('adminExecutionProvidersReadHealth');
export const MAGIC_STUDIO_SERVER_ADMIN_EXECUTION_FAILURES_PATH =
  requireContractRoutePathById('adminExecutionFailuresList');
export const MAGIC_STUDIO_SERVER_ADMIN_EXECUTION_FAILURE_ACKNOWLEDGE_PATH =
  requireContractRoutePathById('adminExecutionFailuresAcknowledge');
export const MAGIC_STUDIO_SERVER_ADMIN_EXECUTION_FAILURE_RETRY_PATH =
  requireContractRoutePathById('adminExecutionFailuresRetry');
export const MAGIC_STUDIO_SERVER_ADMIN_WORKSPACE_RELEASE_RETENTION_RUNS_PATH =
  requireContractRoutePathById('adminWorkspaceReleaseRetentionRunsList');
export const MAGIC_STUDIO_SERVER_ADMIN_WORKSPACE_RELEASE_RETENTION_RUN_DETAIL_PATH =
  requireContractRoutePathById('adminWorkspaceReleaseRetentionRunsRead');
export const MAGIC_STUDIO_SERVER_ADMIN_WORKSPACE_RELEASE_RETENTION_SCHEDULES_PATH =
  requireContractRoutePathById('adminWorkspaceReleaseRetentionSchedulesList');
export const MAGIC_STUDIO_SERVER_ADMIN_WORKSPACE_RELEASE_RETENTION_SCHEDULE_DETAIL_PATH =
  requireContractRoutePathById('adminWorkspaceReleaseRetentionSchedulesRead');
export const MAGIC_STUDIO_SERVER_ADMIN_WORKSPACE_RELEASE_RETENTION_SCHEDULE_TRIGGER_PATH =
  requireContractRoutePathById('adminWorkspaceReleaseRetentionSchedulesTrigger');
export const MAGIC_STUDIO_SERVER_ADMIN_PLUGINS_PATH =
  requireContractRoutePathById('adminPluginsList');
export const MAGIC_STUDIO_SERVER_ADMIN_PLUGIN_ENABLE_PATH =
  requireContractRoutePathById('adminPluginsEnable');
export const MAGIC_STUDIO_SERVER_ADMIN_PLUGIN_DISABLE_PATH =
  requireContractRoutePathById('adminPluginsDisable');
export const MAGIC_STUDIO_SERVER_POLICY_SNAPSHOT_PATH =
  requireContractRoutePathById('corePolicySnapshotRead');
export const MAGIC_STUDIO_SERVER_POLICY_VALIDATE_PATH_PATH =
  requireContractRoutePathById('corePolicyValidatePath');
export const MAGIC_STUDIO_SERVER_POLICY_VALIDATE_COMMAND_PATH =
  requireContractRoutePathById('corePolicyValidateCommand');
export const MAGIC_STUDIO_SERVER_MIGRATION_STATUS_PATH =
  requireContractRoutePathById('coreMigrationsStatusRead');
export const MAGIC_STUDIO_SERVER_MIGRATION_APPLY_PATH =
  requireContractRoutePathById('coreMigrationsApply');
export const MAGIC_STUDIO_SERVER_MEDIA_PROBE_PATH =
  requireContractRoutePathById('coreMediaProbe');
export const MAGIC_STUDIO_SERVER_MEDIA_IMAGE_RESIZE_PATH =
  requireContractRoutePathById('coreMediaImageResize');
export const MAGIC_STUDIO_SERVER_MEDIA_VIDEO_CONCAT_PATH =
  requireContractRoutePathById('coreMediaVideoConcat');
export const MAGIC_STUDIO_SERVER_MEDIA_VIDEO_TRANSCODE_PATH =
  requireContractRoutePathById('coreMediaVideoTranscode');
export const MAGIC_STUDIO_SERVER_MEDIA_VIDEO_TRIM_PATH =
  requireContractRoutePathById('coreMediaVideoTrim');
export const MAGIC_STUDIO_SERVER_MEDIA_VIDEO_EXTRACT_AUDIO_PATH =
  requireContractRoutePathById('coreMediaVideoExtractAudio');
export const MAGIC_STUDIO_SERVER_MEDIA_VIDEO_THUMBNAIL_PATH =
  requireContractRoutePathById('coreMediaVideoThumbnail');
export const MAGIC_STUDIO_SERVER_MEDIA_AUDIO_CONVERT_PATH =
  requireContractRoutePathById('coreMediaAudioConvert');
export const MAGIC_STUDIO_SERVER_MEDIA_AUDIO_NORMALIZE_PATH =
  requireContractRoutePathById('coreMediaAudioNormalize');
export const MAGIC_STUDIO_SERVER_MEDIA_AUDIO_MIX_PATH =
  requireContractRoutePathById('coreMediaAudioMix');
export const MAGIC_STUDIO_SERVER_COMPRESSION_ZIP_PATH =
  requireContractRoutePathById('coreCompressionZip');
export const MAGIC_STUDIO_SERVER_COMPRESSION_UNZIP_PATH =
  requireContractRoutePathById('coreCompressionUnzip');
export const MAGIC_STUDIO_SERVER_SQLITE_EXECUTE_PATH =
  requireContractRoutePathById('coreDatabaseSqliteExecute');
export const MAGIC_STUDIO_SERVER_SQLITE_QUERY_PATH =
  requireContractRoutePathById('coreDatabaseSqliteQuery');
export const MAGIC_STUDIO_SERVER_SQLITE_EXECUTE_BATCH_PATH =
  requireContractRoutePathById('coreDatabaseSqliteExecuteBatch');
export const MAGIC_STUDIO_SERVER_JOBS_PATH =
  requireContractRoutePathById('coreJobsList');
export const MAGIC_STUDIO_SERVER_JOB_DETAIL_PATH =
  requireContractRoutePathById('coreJobsRead');
export const MAGIC_STUDIO_SERVER_JOB_CANCEL_PATH =
  requireContractRoutePathById('coreJobsCancel');

function deriveGatewayBasePath(surfaceBasePaths: readonly string[]): string {
  if (surfaceBasePaths.length === 0) {
    return '';
  }

  const segmentsByPath = surfaceBasePaths.map((basePath) =>
    basePath.split('/').filter(Boolean),
  );
  const sharedSegments: string[] = [];
  const shortestSegmentLength = Math.min(
    ...segmentsByPath.map((segments) => segments.length),
  );

  for (let index = 0; index < shortestSegmentLength; index += 1) {
    const sharedSegment = segmentsByPath[0]?.[index];
    if (!sharedSegment) {
      break;
    }

    if (!segmentsByPath.every((segments) => segments[index] === sharedSegment)) {
      break;
    }

    sharedSegments.push(sharedSegment);
  }

  return sharedSegments.length > 0 ? `/${sharedSegments.join('/')}` : '';
}

function createRoute(
  id: string,
  surface: MagicStudioApiSurface,
  authMode: MagicStudioApiRouteDefinition['authMode'],
  method: MagicStudioApiRouteDefinition['method'],
  path: string,
  summary: string,
): MagicStudioApiRouteDefinition {
  return {
    id,
    authMode,
    method,
    path,
    surface,
    summary,
  };
}

export interface MagicStudioServerHostResolutionInput {
  runtimeMode?: MagicStudioHostMode;
  explicitBaseUrl?: string;
  explicitHost?: string;
  explicitPort?: number;
  preferSameOrigin?: boolean;
  locationOrigin?: string;
}

export function createMagicStudioServerHostDescriptor(
  kind: MagicStudioHostMode = 'server',
  overrides: Partial<MagicStudioHostDescriptor> = {},
): MagicStudioHostDescriptor {
  return {
    kind,
    host: MAGIC_STUDIO_DEFAULT_LOCAL_API_HOST,
    port: MAGIC_STUDIO_DEFAULT_LOCAL_API_PORT,
    apiBaseUrl: MAGIC_STUDIO_DEFAULT_LOCAL_API_BASE_URL,
    healthPath: MAGIC_STUDIO_SERVER_HEALTH_PATH,
    docsPath: MAGIC_STUDIO_SERVER_DOCS_PATH,
    openApiPath: MAGIC_STUDIO_SERVER_LIVE_OPENAPI_PATH,
    routeCatalogPath: MAGIC_STUDIO_SERVER_ROUTE_CATALOG_PATH,
    runtimeSummaryPath: MAGIC_STUDIO_SERVER_RUNTIME_SUMMARY_PATH,
    ...overrides,
  };
}

export function resolveMagicStudioServerHostDescriptor(
  input: MagicStudioServerHostResolutionInput = {},
): MagicStudioHostDescriptor {
  const connection = resolveMagicStudioHostConnection(input);
  return createMagicStudioServerHostDescriptor(connection.kind, connection);
}

function fillRoutePathTemplate(
  templatePath: string,
  params: Readonly<Record<string, string | number>> = {},
): string {
  const parameterNames = templatePath.match(/:([A-Za-z0-9_]+)/g)?.map((token) => token.slice(1)) ?? [];

  for (const parameterName of Object.keys(params)) {
    if (!parameterNames.includes(parameterName)) {
      throw new Error(
        `Magic Studio server route template ${templatePath} does not declare parameter ${parameterName}.`,
      );
    }
  }

  return parameterNames.reduce((resolvedPath, parameterName) => {
    const parameterValue = params[parameterName];
    if (parameterValue === undefined) {
      throw new Error(
        `Magic Studio server route template ${templatePath} is missing parameter ${parameterName}.`,
      );
    }

    return resolvedPath.replace(
      `:${parameterName}`,
      encodeURIComponent(String(parameterValue)),
    );
  }, templatePath);
}

function toOpenApiPath(path: string): string {
  return path
    .split('/')
    .map((segment) => (segment.startsWith(':') ? `{${segment.slice(1)}}` : segment))
    .join('/');
}

export function resolveMagicStudioServerRoutePath(
  routeId: string,
  params: Readonly<Record<string, string | number>> = {},
): string {
  return fillRoutePathTemplate(requireContractRoutePathById(routeId), params);
}

export function resolveMagicStudioServerOpenApiPath(routeId: string): string {
  return toOpenApiPath(requireContractRoutePathById(routeId));
}

export function buildMagicStudioServerRouteDefinitions(): MagicStudioApiRouteDefinition[] {
  return MAGIC_STUDIO_SERVER_DEFAULT_CONTRACT.routes.map((route) =>
    createRoute(
      route.id,
      route.surface,
      route.authMode,
      route.method,
      route.path,
      route.summary,
    ),
  );
}

export function buildMagicStudioServerRouteCatalog(): MagicStudioApiRouteCatalogEntry[] {
  return buildMagicStudioServerRouteDefinitions().map((route) => ({
    ...route,
    openApiPath: resolveMagicStudioServerOpenApiPath(route.id),
    operationId: route.id,
  }));
}

export function createMagicStudioServerGatewaySummary(): MagicStudioApiGatewaySummary {
  const routes = buildMagicStudioServerRouteCatalog();
  const routesBySurface = Object.fromEntries(
    MAGIC_STUDIO_SERVER_API_SURFACES.map((surface) => [surface, 0]),
  ) as Record<MagicStudioApiSurface, number>;

  for (const route of routes) {
    routesBySurface[route.surface] += 1;
  }

  return {
    basePath: MAGIC_STUDIO_SERVER_GATEWAY_BASE_PATH,
    docsPath: MAGIC_STUDIO_SERVER_DOCS_PATH,
    liveOpenApiPath: MAGIC_STUDIO_SERVER_LIVE_OPENAPI_PATH,
    openApiPath: MAGIC_STUDIO_SERVER_OPENAPI_PATH,
    routeCatalogPath: MAGIC_STUDIO_SERVER_ROUTE_CATALOG_PATH,
    routeCount: routes.length,
    routesBySurface,
    surfaces: MAGIC_STUDIO_SERVER_DEFAULT_CONTRACT.surfaces.map((surface) => ({
      authMode: surface.authMode,
      basePath: surface.basePath,
      description: surface.description,
      name: surface.name,
      routeCount: routesBySurface[surface.name],
    })),
  };
}

export function createMagicStudioServerOpenApiDocument() {
  const routes = MAGIC_STUDIO_SERVER_DEFAULT_CONTRACT.routes;
  const paths = routes.reduce<Record<string, Record<string, unknown>>>((accumulator, route) => {
    const openApiPath = resolveMagicStudioServerOpenApiPath(route.id);
    const pathItem = accumulator[openApiPath] ?? {};

    pathItem[route.method.toLowerCase()] = {
      operationId: route.id,
      summary: route.summary,
      tags: [route.surface],
      ...(route.requestBodySchema
        ? {
            requestBody: createOpenApiRequestBody(route.requestBodySchema),
          }
        : {}),
      responses: createOpenApiResponses(route),
    };

    accumulator[openApiPath] = pathItem;
    return accumulator;
  }, {});

  return {
    openapi: '3.1.0',
    info: {
      title: 'Magic Studio Server API',
      version: MAGIC_STUDIO_SERVER_API_VERSION,
      description:
        'Canonical local server API for Magic Studio multi-runtime delivery.',
    },
    servers: [
      {
        url: MAGIC_STUDIO_DEFAULT_LOCAL_API_BASE_URL,
        description: 'Local Magic Studio server',
      },
    ],
    paths,
    components: MAGIC_STUDIO_SERVER_OPENAPI_COMPONENTS,
    'x-sdkwork-api-cloud-gateway': createMagicStudioServerGatewaySummary(),
  };
}

export const MAGIC_STUDIO_SERVER_RUNTIME =
  createMagicStudioServerHostDescriptor('server');

function createOpenApiResponses(route: MagicStudioApiContractRoute) {
  const defaultResponse = {
    description: 'Problem response',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/MagicStudioApiProblemEnvelope',
        },
      },
    },
  };

  if (!route.successResponseSchema) {
    return {
      '200': { description: 'Successful response' },
      default: defaultResponse,
    };
  }

  return {
    '200': {
      description: 'Successful response',
      content: {
        'application/json': {
          schema: {
            $ref: `#/components/schemas/${route.successResponseSchema}`,
          },
        },
      },
    },
    default: defaultResponse,
  };
}

function createOpenApiRequestBody(requestBodySchema: string) {
  return {
    required: true,
    content: {
      'application/json': {
        schema: {
          $ref: `#/components/schemas/${requestBodySchema}`,
        },
      },
    },
  };
}
