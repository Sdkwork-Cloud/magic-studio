import { isExplicitLocalAssetLocator, isLocalFilePath, isManagedAssetLocator } from '@sdkwork/magic-studio-assets/asset-center';
import { imageService } from '@sdkwork/magic-studio-image/services';
import {
  buildUnifiedVideoGenerationRequest,
  videoService,
} from '@sdkwork/magic-studio-video/services';
import {
  createVideoInputResourceRef,
} from '@sdkwork/magic-studio-video/entities';
import type {
  AgiGenerationMode,
  AgiGenerationProduct,
  GenerationOutcome,
} from '@sdkwork/magic-studio-types/agi';
import type {
  MagicStudioFilmAuthoringBatchRequest,
  MagicStudioFilmAuthoringBatchResult,
  MagicStudioFilmAssetBindRequest,
  MagicStudioFilmAssetInventoryResult,
  MagicStudioFilmAssetRelinkRequest,
  MagicStudioFilmAssetRelinkResult,
  MagicStudioFilmExportPackage,
  MagicStudioFilmExportPackageRequest,
  MagicStudioFilmImportPackage,
  MagicStudioFilmImportPackageRequest,
  MagicStudioFilmPublishApproveRequest,
  MagicStudioFilmPublishApproveResult,
  MagicStudioFilmPublishArtifactContent,
  MagicStudioFilmCreateSceneBreakdownRequest,
  MagicStudioFilmCreateSceneBreakdownResult,
  MagicStudioFilmCreateShootingPlanRequest,
  MagicStudioFilmCreateShootingPlanResult,
  MagicStudioFilmGenerateShotVariantsRequest,
  MagicStudioFilmGenerateShotVariantsResult,
  MagicStudioFilmProjectReviewDependencyGraphAnchorNode,
  MagicStudioFilmProjectReviewDependencyGraphBlockerClassNode,
  MagicStudioFilmProjectReviewDependencyGraphCluster,
  MagicStudioFilmProjectReviewDependencyGraphDependencyEdge,
  MagicStudioFilmProjectReviewDependencyGraphDependencyType,
  MagicStudioFilmProjectReviewDependencyGraphEdgeLevel,
  MagicStudioFilmProjectReviewDependencyGraphEdgeReasonCode,
  MagicStudioFilmProjectReviewDependencyGraphLinkLevel,
  MagicStudioFilmProjectReviewDependencyGraphLinkReasonCode,
  MagicStudioFilmProjectReviewDependencyGraphPublish,
  MagicStudioFilmProjectReviewDependencyGraphPublishLink,
  MagicStudioFilmProjectReviewDependencyGraphResult,
  MagicStudioFilmProjectReviewDependencyGraphReviewerNode,
  MagicStudioFilmProjectReviewApprovalBurnDownInterventionOutcome,
  MagicStudioFilmProjectReviewApprovalBurnDownPoint,
  MagicStudioFilmProjectReviewApprovalBurnDownPublishTrend,
  MagicStudioFilmProjectReviewApprovalBurnDownReadinessTrend,
  MagicStudioFilmProjectReviewApprovalBurnDownResult,
  MagicStudioFilmProjectReviewApprovalBurnDownSummary,
  MagicStudioFilmProjectReviewApprovalBurnDownWindowSummary,
  MagicStudioFilmProjectReviewEffectivenessBaselineComparisonMode,
  MagicStudioFilmProjectReviewEffectivenessBaselineIntervention,
  MagicStudioFilmProjectReviewEffectivenessBaselineLevel,
  MagicStudioFilmProjectReviewEffectivenessBaselinePublish,
  MagicStudioFilmProjectReviewEffectivenessBaselineReasonImpact,
  MagicStudioFilmProjectReviewEffectivenessBaselineResult,
  MagicStudioFilmProjectReviewEffectivenessBaselineSource,
  MagicStudioFilmProjectReviewEffectivenessBaselineSummary,
  MagicStudioFilmProjectReviewInterventionExecutionBundle,
  MagicStudioFilmProjectReviewInterventionExecutionCheckpoint,
  MagicStudioFilmProjectReviewInterventionExecutionCheckpointStatus,
  MagicStudioFilmProjectReviewInterventionExecutionEvidence,
  MagicStudioFilmProjectReviewInterventionExecutionEvidenceType,
  MagicStudioFilmProjectReviewInterventionExecutionHistoryResult,
  MagicStudioFilmProjectReviewInterventionExecutionHistorySummary,
  MagicStudioFilmProjectReviewInterventionExecutionIntervention,
  MagicStudioFilmProjectReviewInterventionExecutionPublish,
  MagicStudioFilmProjectReviewInterventionExecutionTargetKind,
  MagicStudioFilmProjectReviewInterventionOutcome,
  MagicStudioFilmProjectReviewInterventionOutcomeBundle,
  MagicStudioFilmProjectReviewInterventionOutcomePublishOutcome,
  MagicStudioFilmProjectReviewInterventionOutcomeReasonImpact,
  MagicStudioFilmProjectReviewInterventionOutcomeStatus,
  MagicStudioFilmProjectReviewInterventionOutcomesResult,
  MagicStudioFilmProjectReviewInterventionOutcomesSummary,
  MagicStudioFilmProjectReviewInterventionPlanIntervention,
  MagicStudioFilmProjectReviewInterventionPlanInterventionType,
  MagicStudioFilmProjectReviewInterventionPlanPriorityLevel,
  MagicStudioFilmProjectReviewInterventionPlanPublishPlan,
  MagicStudioFilmProjectReviewInterventionPlanReasonCode,
  MagicStudioFilmProjectReviewInterventionPlanResult,
  MagicStudioFilmProjectReviewInterventionPlanSummary,
  MagicStudioFilmProjectReviewInterventionPlanWindow,
  MagicStudioFilmProjectReviewInterventionPlanWindowSummary,
  MagicStudioFilmProjectReviewRecoveryOrchestrationBundle,
  MagicStudioFilmProjectReviewRecoveryOrchestrationBundleType,
  MagicStudioFilmProjectReviewRecoveryOrchestrationExecutionLane,
  MagicStudioFilmProjectReviewRecoveryOrchestrationExecutionLaneSummary,
  MagicStudioFilmProjectReviewRecoveryOrchestrationPublishRecovery,
  MagicStudioFilmProjectReviewRecoveryOrchestrationReasonCode,
  MagicStudioFilmProjectReviewRecoveryOrchestrationResult,
  MagicStudioFilmProjectReviewRecoveryOrchestrationStep,
  MagicStudioFilmProjectReviewRecoveryOrchestrationStepType,
  MagicStudioFilmProjectReviewRecoveryOrchestrationSummary,
  MagicStudioFilmProjectReviewDependencyGraphSummary,
  MagicStudioFilmProjectReviewDecisionFreshnessAgeBucket,
  MagicStudioFilmProjectReviewDecisionFreshnessAgeBucketKey,
  MagicStudioFilmProjectReviewDecisionFreshnessLevel,
  MagicStudioFilmProjectReviewDecisionFreshnessPublish,
  MagicStudioFilmProjectReviewDecisionFreshnessReason,
  MagicStudioFilmProjectReviewDecisionFreshnessReasonCode,
  MagicStudioFilmProjectReviewDecisionFreshnessResult,
  MagicStudioFilmProjectReviewDecisionFreshnessReviewer,
  MagicStudioFilmProjectReviewDecisionFreshnessRoundTrend,
  MagicStudioFilmProjectReviewDecisionFreshnessSummary,
  MagicStudioFilmProjectReviewEscalationForecastAnchorHotspot,
  MagicStudioFilmProjectReviewEscalationForecastBlockerClass,
  MagicStudioFilmProjectReviewEscalationForecastLevel,
  MagicStudioFilmProjectReviewEscalationForecastPublish,
  MagicStudioFilmProjectReviewEscalationForecastReason,
  MagicStudioFilmProjectReviewEscalationForecastReasonCode,
  MagicStudioFilmProjectReviewEscalationForecastResult,
  MagicStudioFilmProjectReviewEscalationForecastReviewerHotspot,
  MagicStudioFilmProjectReviewEscalationForecastSummary,
  MagicStudioFilmProjectReviewEscalationForecastThroughput,
  MagicStudioFilmProjectReviewEscalationForecastThroughputLevel,
  MagicStudioFilmProjectReviewGovernanceDriftLevel,
  MagicStudioFilmProjectReviewGovernanceDriftPublish,
  MagicStudioFilmProjectReviewGovernanceDriftReason,
  MagicStudioFilmProjectReviewGovernanceDriftReasonCode,
  MagicStudioFilmProjectReviewGovernanceDriftResult,
  MagicStudioFilmProjectReviewGovernanceDriftReviewerHotspot,
  MagicStudioFilmProjectReviewGovernanceDriftSignalBucket,
  MagicStudioFilmProjectReviewGovernanceDriftSignalBucketKind,
  MagicStudioFilmProjectReviewGovernanceDriftSummary,
  MagicStudioFilmProjectReviewPortfolioDashboardResult,
  MagicStudioFilmProjectReviewPortfolioPublish,
  MagicStudioFilmProjectReviewPortfolioSummary,
  MagicStudioFilmProjectReviewProjectRef,
  MagicStudioFilmProjectReviewQueueItem,
  MagicStudioFilmPublishListQuery,
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
  MagicStudioFilmPublishReviewTimelineResult,
  MagicStudioFilmPublishReviewRoundsResult,
  MagicStudioFilmPublishReviewReviewerAttentionResult,
  MagicStudioFilmPublishReviewReviewerCoverageResult,
  MagicStudioFilmPublishReviewStaleDecisionResult,
  MagicStudioFilmPublishReviewWorklistResult,
  MagicStudioFilmPublishReviewSubmitRequest,
  MagicStudioFilmPublishReviewSubmitResult,
  MagicStudioFilmPublishReopenRequest,
  MagicStudioFilmPublishReopenResult,
  MagicStudioFilmPublishReviewState,
  MagicStudioFilmPublishRestoreRequest,
  MagicStudioFilmPublishRestoreResult,
  MagicStudioFilmProjectReviewReviewerCapacityLevel,
  MagicStudioFilmProjectReviewReviewerCapacityPublish,
  MagicStudioFilmProjectReviewReviewerCapacityResult,
  MagicStudioFilmProjectReviewReviewerCapacityReviewer,
  MagicStudioFilmProjectReviewReviewerCapacitySummary,
  MagicStudioFilmReviewQueueQuery,
  MagicStudioFilmPrepareAnalysisRequest,
  MagicStudioFilmPrepareAnalysisResult,
  MagicStudioFilmPreset,
  MagicStudioFilmPresetApplyRequest,
  MagicStudioFilmPresetWriteRequest,
  MagicStudioFilmRebuildStoryboardRequest,
  MagicStudioFilmRebuildStoryboardResult,
  MagicStudioFilmTemplateInstantiateRequest,
  MagicStudioFilmTemplateListQuery,
  MagicStudioFilmTemplateSnapshotRequest,
  MagicStudioFilmTemplateWriteRequest,
  MagicStudioFilmRefreshAnalysisRequest,
  MagicStudioFilmRefreshAnalysisResult,
  MagicStudioFilmScriptStandardizeRequest,
  MagicStudioFilmScriptStandardizeResult,
  MagicStudioFilmProjectValidateRequest,
  MagicStudioFilmProjectValidation,
  MagicStudioFilmStoryboardPublishRequest,
  MagicStudioFilmStoryboardPublishResult,
} from '@sdkwork/magic-studio-host-types';
import type {
  FilmProject,
  FilmCharacter,
  FilmProp,
  FilmLocation,
  FilmScene,
  FilmShot,
  FilmTemplate,
  FilmAssetMediaResource,
  FilmScriptAnalysisResult,
} from '@sdkwork/magic-studio-types/film';
import type {
  ProjectGraphDocument,
  ProjectGraphEntityType,
  ProjectGraphMediaSource,
  ProjectGraphScene,
  ProjectGraphSequence,
  ProjectGraphShot,
  ProjectGraphSurface,
  ProjectGraphSurfaceBinding
} from '@sdkwork/magic-studio-types/project-graph';
import { createUuid } from '@sdkwork/magic-studio-types/entity';
import { MediaResourceType, MediaScene } from '@sdkwork/magic-studio-types/vocabulary';
import { filmProjectService } from './filmProjectService';
import {
  getFilmServerClient,
  normalizeFilmAnalysisResult,
  normalizeFilmCharacterRecord,
  normalizeFilmProjectRecord,
  normalizeFilmPropRecord,
  normalizeText,
} from './filmServerSupport';

export type FilmAnalysisResult = FilmScriptAnalysisResult;
export interface FilmStoryboardGenerateOptions {
  language?: string;
  replaceShots?: boolean;
  maxShotsPerScene?: number;
  includeEstablishingShot?: boolean;
}

export interface FilmShotSyncOptions {
  regenerateShotNumbers?: boolean;
  fillSceneBindings?: boolean;
}

export type FilmAssetBindOptions = MagicStudioFilmAssetBindRequest;
export type FilmAssetInventoryResult = MagicStudioFilmAssetInventoryResult;
export type FilmAssetRelinkOptions = MagicStudioFilmAssetRelinkRequest;
export type FilmAssetRelinkResult = MagicStudioFilmAssetRelinkResult;
export type FilmExportPackageOptions = MagicStudioFilmExportPackageRequest;
export type FilmExportPackageResult = MagicStudioFilmExportPackage;
export type FilmImportPackageOptions = MagicStudioFilmImportPackageRequest;
export type FilmImportPackageResult = MagicStudioFilmImportPackage;
export type FilmPreset = MagicStudioFilmPreset;
export type FilmPresetWriteOptions = MagicStudioFilmPresetWriteRequest;
export type FilmPresetApplyOptions = MagicStudioFilmPresetApplyRequest;
export type FilmTemplateListOptions = MagicStudioFilmTemplateListQuery;
export type FilmTemplateWriteOptions = MagicStudioFilmTemplateWriteRequest;
export type FilmTemplateInstantiateOptions = MagicStudioFilmTemplateInstantiateRequest;
export type FilmTemplateSnapshotOptions = MagicStudioFilmTemplateSnapshotRequest;
export type FilmPublishListOptions = MagicStudioFilmPublishListQuery;
export type FilmReviewQueueOptions = MagicStudioFilmReviewQueueQuery;
export type FilmProjectReviewProjectRef = MagicStudioFilmProjectReviewProjectRef;
export type FilmProjectReviewDecisionFreshnessLevel =
  MagicStudioFilmProjectReviewDecisionFreshnessLevel;
export type FilmProjectReviewDecisionFreshnessReasonCode =
  MagicStudioFilmProjectReviewDecisionFreshnessReasonCode;
export type FilmProjectReviewDecisionFreshnessReason =
  MagicStudioFilmProjectReviewDecisionFreshnessReason;
export type FilmProjectReviewDecisionFreshnessAgeBucketKey =
  MagicStudioFilmProjectReviewDecisionFreshnessAgeBucketKey;
export type FilmProjectReviewDecisionFreshnessAgeBucket =
  MagicStudioFilmProjectReviewDecisionFreshnessAgeBucket;
export type FilmProjectReviewDecisionFreshnessRoundTrend =
  MagicStudioFilmProjectReviewDecisionFreshnessRoundTrend;
export type FilmProjectReviewDecisionFreshnessReviewer =
  MagicStudioFilmProjectReviewDecisionFreshnessReviewer;
export type FilmProjectReviewDecisionFreshnessPublish =
  MagicStudioFilmProjectReviewDecisionFreshnessPublish;
export type FilmProjectReviewDecisionFreshnessSummary =
  MagicStudioFilmProjectReviewDecisionFreshnessSummary;
export type FilmProjectReviewDecisionFreshnessResult =
  MagicStudioFilmProjectReviewDecisionFreshnessResult;
export type FilmProjectReviewDependencyGraphDependencyType =
  MagicStudioFilmProjectReviewDependencyGraphDependencyType;
export type FilmProjectReviewDependencyGraphEdgeLevel =
  MagicStudioFilmProjectReviewDependencyGraphEdgeLevel;
export type FilmProjectReviewDependencyGraphLinkLevel =
  MagicStudioFilmProjectReviewDependencyGraphLinkLevel;
export type FilmProjectReviewDependencyGraphEdgeReasonCode =
  MagicStudioFilmProjectReviewDependencyGraphEdgeReasonCode;
export type FilmProjectReviewDependencyGraphLinkReasonCode =
  MagicStudioFilmProjectReviewDependencyGraphLinkReasonCode;
export type FilmProjectReviewDependencyGraphPublish =
  MagicStudioFilmProjectReviewDependencyGraphPublish;
export type FilmProjectReviewDependencyGraphReviewerNode =
  MagicStudioFilmProjectReviewDependencyGraphReviewerNode;
export type FilmProjectReviewDependencyGraphAnchorNode =
  MagicStudioFilmProjectReviewDependencyGraphAnchorNode;
export type FilmProjectReviewDependencyGraphBlockerClassNode =
  MagicStudioFilmProjectReviewDependencyGraphBlockerClassNode;
export type FilmProjectReviewDependencyGraphDependencyEdge =
  MagicStudioFilmProjectReviewDependencyGraphDependencyEdge;
export type FilmProjectReviewDependencyGraphPublishLink =
  MagicStudioFilmProjectReviewDependencyGraphPublishLink;
export type FilmProjectReviewDependencyGraphCluster =
  MagicStudioFilmProjectReviewDependencyGraphCluster;
export type FilmProjectReviewDependencyGraphSummary =
  MagicStudioFilmProjectReviewDependencyGraphSummary;
export type FilmProjectReviewDependencyGraphResult =
  MagicStudioFilmProjectReviewDependencyGraphResult;
export type FilmProjectReviewInterventionPlanPriorityLevel =
  MagicStudioFilmProjectReviewInterventionPlanPriorityLevel;
export type FilmProjectReviewInterventionPlanWindow =
  MagicStudioFilmProjectReviewInterventionPlanWindow;
export type FilmProjectReviewInterventionPlanInterventionType =
  MagicStudioFilmProjectReviewInterventionPlanInterventionType;
export type FilmProjectReviewInterventionPlanReasonCode =
  MagicStudioFilmProjectReviewInterventionPlanReasonCode;
export type FilmProjectReviewInterventionPlanWindowSummary =
  MagicStudioFilmProjectReviewInterventionPlanWindowSummary;
export type FilmProjectReviewInterventionPlanIntervention =
  MagicStudioFilmProjectReviewInterventionPlanIntervention;
export type FilmProjectReviewInterventionPlanPublishPlan =
  MagicStudioFilmProjectReviewInterventionPlanPublishPlan;
export type FilmProjectReviewInterventionPlanSummary =
  MagicStudioFilmProjectReviewInterventionPlanSummary;
export type FilmProjectReviewInterventionPlanResult =
  MagicStudioFilmProjectReviewInterventionPlanResult;
export type FilmProjectReviewRecoveryOrchestrationExecutionLane =
  MagicStudioFilmProjectReviewRecoveryOrchestrationExecutionLane;
export type FilmProjectReviewRecoveryOrchestrationBundleType =
  MagicStudioFilmProjectReviewRecoveryOrchestrationBundleType;
export type FilmProjectReviewRecoveryOrchestrationStepType =
  MagicStudioFilmProjectReviewRecoveryOrchestrationStepType;
export type FilmProjectReviewRecoveryOrchestrationReasonCode =
  MagicStudioFilmProjectReviewRecoveryOrchestrationReasonCode;
export type FilmProjectReviewRecoveryOrchestrationExecutionLaneSummary =
  MagicStudioFilmProjectReviewRecoveryOrchestrationExecutionLaneSummary;
export type FilmProjectReviewRecoveryOrchestrationStep =
  MagicStudioFilmProjectReviewRecoveryOrchestrationStep;
export type FilmProjectReviewRecoveryOrchestrationBundle =
  MagicStudioFilmProjectReviewRecoveryOrchestrationBundle;
export type FilmProjectReviewRecoveryOrchestrationPublishRecovery =
  MagicStudioFilmProjectReviewRecoveryOrchestrationPublishRecovery;
export type FilmProjectReviewRecoveryOrchestrationSummary =
  MagicStudioFilmProjectReviewRecoveryOrchestrationSummary;
export type FilmProjectReviewRecoveryOrchestrationResult =
  MagicStudioFilmProjectReviewRecoveryOrchestrationResult;
export type FilmProjectReviewApprovalBurnDownReadinessTrend =
  MagicStudioFilmProjectReviewApprovalBurnDownReadinessTrend;
export type FilmProjectReviewApprovalBurnDownWindowSummary =
  MagicStudioFilmProjectReviewApprovalBurnDownWindowSummary;
export type FilmProjectReviewApprovalBurnDownPoint =
  MagicStudioFilmProjectReviewApprovalBurnDownPoint;
export type FilmProjectReviewApprovalBurnDownInterventionOutcome =
  MagicStudioFilmProjectReviewApprovalBurnDownInterventionOutcome;
export type FilmProjectReviewApprovalBurnDownPublishTrend =
  MagicStudioFilmProjectReviewApprovalBurnDownPublishTrend;
export type FilmProjectReviewApprovalBurnDownSummary =
  MagicStudioFilmProjectReviewApprovalBurnDownSummary;
export type FilmProjectReviewApprovalBurnDownResult =
  MagicStudioFilmProjectReviewApprovalBurnDownResult;
export type FilmProjectReviewInterventionOutcomeStatus =
  MagicStudioFilmProjectReviewInterventionOutcomeStatus;
export type FilmProjectReviewInterventionOutcome =
  MagicStudioFilmProjectReviewInterventionOutcome;
export type FilmProjectReviewInterventionOutcomeBundle =
  MagicStudioFilmProjectReviewInterventionOutcomeBundle;
export type FilmProjectReviewInterventionOutcomeReasonImpact =
  MagicStudioFilmProjectReviewInterventionOutcomeReasonImpact;
export type FilmProjectReviewInterventionOutcomePublishOutcome =
  MagicStudioFilmProjectReviewInterventionOutcomePublishOutcome;
export type FilmProjectReviewInterventionOutcomesSummary =
  MagicStudioFilmProjectReviewInterventionOutcomesSummary;
export type FilmProjectReviewInterventionOutcomesResult =
  MagicStudioFilmProjectReviewInterventionOutcomesResult;
export type FilmProjectReviewEffectivenessBaselineLevel =
  MagicStudioFilmProjectReviewEffectivenessBaselineLevel;
export type FilmProjectReviewEffectivenessBaselineSource =
  MagicStudioFilmProjectReviewEffectivenessBaselineSource;
export type FilmProjectReviewEffectivenessBaselineComparisonMode =
  MagicStudioFilmProjectReviewEffectivenessBaselineComparisonMode;
export type FilmProjectReviewEffectivenessBaselineIntervention =
  MagicStudioFilmProjectReviewEffectivenessBaselineIntervention;
export type FilmProjectReviewEffectivenessBaselineReasonImpact =
  MagicStudioFilmProjectReviewEffectivenessBaselineReasonImpact;
export type FilmProjectReviewEffectivenessBaselinePublish =
  MagicStudioFilmProjectReviewEffectivenessBaselinePublish;
export type FilmProjectReviewEffectivenessBaselineSummary =
  MagicStudioFilmProjectReviewEffectivenessBaselineSummary;
export type FilmProjectReviewEffectivenessBaselineResult =
  MagicStudioFilmProjectReviewEffectivenessBaselineResult;
export type FilmProjectReviewInterventionExecutionEvidenceType =
  MagicStudioFilmProjectReviewInterventionExecutionEvidenceType;
export type FilmProjectReviewInterventionExecutionTargetKind =
  MagicStudioFilmProjectReviewInterventionExecutionTargetKind;
export type FilmProjectReviewInterventionExecutionCheckpointStatus =
  MagicStudioFilmProjectReviewInterventionExecutionCheckpointStatus;
export type FilmProjectReviewInterventionExecutionEvidence =
  MagicStudioFilmProjectReviewInterventionExecutionEvidence;
export type FilmProjectReviewInterventionExecutionCheckpoint =
  MagicStudioFilmProjectReviewInterventionExecutionCheckpoint;
export type FilmProjectReviewInterventionExecutionIntervention =
  MagicStudioFilmProjectReviewInterventionExecutionIntervention;
export type FilmProjectReviewInterventionExecutionBundle =
  MagicStudioFilmProjectReviewInterventionExecutionBundle;
export type FilmProjectReviewInterventionExecutionPublish =
  MagicStudioFilmProjectReviewInterventionExecutionPublish;
export type FilmProjectReviewInterventionExecutionHistorySummary =
  MagicStudioFilmProjectReviewInterventionExecutionHistorySummary;
export type FilmProjectReviewInterventionExecutionHistoryResult =
  MagicStudioFilmProjectReviewInterventionExecutionHistoryResult;
export type FilmProjectReviewEscalationForecastLevel =
  MagicStudioFilmProjectReviewEscalationForecastLevel;
export type FilmProjectReviewEscalationForecastReasonCode =
  MagicStudioFilmProjectReviewEscalationForecastReasonCode;
export type FilmProjectReviewEscalationForecastReason =
  MagicStudioFilmProjectReviewEscalationForecastReason;
export type FilmProjectReviewEscalationForecastThroughputLevel =
  MagicStudioFilmProjectReviewEscalationForecastThroughputLevel;
export type FilmProjectReviewEscalationForecastThroughput =
  MagicStudioFilmProjectReviewEscalationForecastThroughput;
export type FilmProjectReviewEscalationForecastReviewerHotspot =
  MagicStudioFilmProjectReviewEscalationForecastReviewerHotspot;
export type FilmProjectReviewEscalationForecastAnchorHotspot =
  MagicStudioFilmProjectReviewEscalationForecastAnchorHotspot;
export type FilmProjectReviewEscalationForecastBlockerClass =
  MagicStudioFilmProjectReviewEscalationForecastBlockerClass;
export type FilmProjectReviewEscalationForecastPublish =
  MagicStudioFilmProjectReviewEscalationForecastPublish;
export type FilmProjectReviewEscalationForecastSummary =
  MagicStudioFilmProjectReviewEscalationForecastSummary;
export type FilmProjectReviewEscalationForecastResult =
  MagicStudioFilmProjectReviewEscalationForecastResult;
export type FilmProjectReviewGovernanceDriftLevel =
  MagicStudioFilmProjectReviewGovernanceDriftLevel;
export type FilmProjectReviewGovernanceDriftReasonCode =
  MagicStudioFilmProjectReviewGovernanceDriftReasonCode;
export type FilmProjectReviewGovernanceDriftReason =
  MagicStudioFilmProjectReviewGovernanceDriftReason;
export type FilmProjectReviewGovernanceDriftSignalBucketKind =
  MagicStudioFilmProjectReviewGovernanceDriftSignalBucketKind;
export type FilmProjectReviewGovernanceDriftSignalBucket =
  MagicStudioFilmProjectReviewGovernanceDriftSignalBucket;
export type FilmProjectReviewGovernanceDriftReviewerHotspot =
  MagicStudioFilmProjectReviewGovernanceDriftReviewerHotspot;
export type FilmProjectReviewGovernanceDriftPublish =
  MagicStudioFilmProjectReviewGovernanceDriftPublish;
export type FilmProjectReviewGovernanceDriftSummary =
  MagicStudioFilmProjectReviewGovernanceDriftSummary;
export type FilmProjectReviewGovernanceDriftResult =
  MagicStudioFilmProjectReviewGovernanceDriftResult;
export type FilmProjectReviewPortfolioSummary =
  MagicStudioFilmProjectReviewPortfolioSummary;
export type FilmProjectReviewPortfolioPublish =
  MagicStudioFilmProjectReviewPortfolioPublish;
export type FilmProjectReviewPortfolioDashboardResult =
  MagicStudioFilmProjectReviewPortfolioDashboardResult;
export type FilmProjectReviewQueueItem = MagicStudioFilmProjectReviewQueueItem;
export type FilmProjectReviewReviewerCapacityLevel =
  MagicStudioFilmProjectReviewReviewerCapacityLevel;
export type FilmProjectReviewReviewerCapacityPublish =
  MagicStudioFilmProjectReviewReviewerCapacityPublish;
export type FilmProjectReviewReviewerCapacityReviewer =
  MagicStudioFilmProjectReviewReviewerCapacityReviewer;
export type FilmProjectReviewReviewerCapacitySummary =
  MagicStudioFilmProjectReviewReviewerCapacitySummary;
export type FilmProjectReviewReviewerCapacityResult =
  MagicStudioFilmProjectReviewReviewerCapacityResult;
export type FilmPublishRecord = MagicStudioFilmPublishRecord;
export type FilmPublishArtifactContent = MagicStudioFilmPublishArtifactContent;
export type FilmPublishApproveOptions = MagicStudioFilmPublishApproveRequest;
export type FilmPublishApproveResult = MagicStudioFilmPublishApproveResult;
export type FilmPublishRequestChangesOptions = MagicStudioFilmPublishRequestChangesRequest;
export type FilmPublishRequestChangesResult = MagicStudioFilmPublishRequestChangesResult;
export type FilmPublishReviewAssignmentsOptions =
  MagicStudioFilmPublishReviewAssignmentsRequest;
export type FilmPublishReviewAssignmentsResult =
  MagicStudioFilmPublishReviewAssignmentsResult;
export type FilmPublishReviewSubmitOptions =
  MagicStudioFilmPublishReviewSubmitRequest;
export type FilmPublishReviewSubmitResult =
  MagicStudioFilmPublishReviewSubmitResult;
export type FilmPublishReviewConsensusOptions =
  MagicStudioFilmPublishReviewConsensusRequest;
export type FilmPublishReviewConsensusResult =
  MagicStudioFilmPublishReviewConsensusResult;
export type FilmPublishReviewCommentOptions = MagicStudioFilmPublishReviewCommentRequest;
export type FilmPublishReviewCommentResolveOptions =
  MagicStudioFilmPublishReviewCommentResolveRequest;
export type FilmPublishReviewCommentResolveResult =
  MagicStudioFilmPublishReviewCommentResolveResult;
export type FilmPublishReviewCommentResult = MagicStudioFilmPublishReviewCommentResult;
export type FilmPublishReviewAnchorsResult =
  MagicStudioFilmPublishReviewAnchorsResult;
export type FilmPublishReviewActivityResult =
  MagicStudioFilmPublishReviewActivityResult;
export type FilmPublishReviewAnchorResponsibilityResult =
  MagicStudioFilmPublishReviewAnchorResponsibilityResult;
export type FilmPublishReviewDecisionMatrixResult =
  MagicStudioFilmPublishReviewDecisionMatrixResult;
export type FilmPublishReviewLatencyAnalyticsResult =
  MagicStudioFilmPublishReviewLatencyAnalyticsResult;
export type FilmPublishReviewOperationsDashboardResult =
  MagicStudioFilmPublishReviewOperationsDashboardResult;
export type FilmPublishReviewReadinessResult =
  MagicStudioFilmPublishReviewReadinessResult;
export type FilmPublishReviewReviewerBacklogResult =
  MagicStudioFilmPublishReviewReviewerBacklogResult;
export type FilmPublishReviewTimelineResult =
  MagicStudioFilmPublishReviewTimelineResult;
export type FilmPublishReviewRoundsResult =
  MagicStudioFilmPublishReviewRoundsResult;
export type FilmPublishReviewReviewerAttentionResult =
  MagicStudioFilmPublishReviewReviewerAttentionResult;
export type FilmPublishReviewReviewerCoverageResult =
  MagicStudioFilmPublishReviewReviewerCoverageResult;
export type FilmPublishReviewStaleDecisionResult =
  MagicStudioFilmPublishReviewStaleDecisionResult;
export type FilmPublishReviewWorklistResult =
  MagicStudioFilmPublishReviewWorklistResult;
export type FilmPublishReopenOptions = MagicStudioFilmPublishReopenRequest;
export type FilmPublishReopenResult = MagicStudioFilmPublishReopenResult;
export type FilmPublishReviewState = MagicStudioFilmPublishReviewState;
export type FilmPublishRestoreOptions = MagicStudioFilmPublishRestoreRequest;
export type FilmPublishRestoreResult = MagicStudioFilmPublishRestoreResult;
export type FilmCreateSceneBreakdownOptions = MagicStudioFilmCreateSceneBreakdownRequest;
export type FilmCreateSceneBreakdownResult = MagicStudioFilmCreateSceneBreakdownResult;
export type FilmCreateShootingPlanOptions = MagicStudioFilmCreateShootingPlanRequest;
export type FilmCreateShootingPlanResult = MagicStudioFilmCreateShootingPlanResult;
export type FilmGenerateShotVariantsOptions = MagicStudioFilmGenerateShotVariantsRequest;
export type FilmGenerateShotVariantsResult = MagicStudioFilmGenerateShotVariantsResult;
export type FilmPrepareAnalysisOptions = MagicStudioFilmPrepareAnalysisRequest;
export type FilmPrepareAnalysisResult = MagicStudioFilmPrepareAnalysisResult;
export type FilmProjectValidationOptions = MagicStudioFilmProjectValidateRequest;
export type FilmProjectValidationResult = MagicStudioFilmProjectValidation;
export type FilmRebuildStoryboardOptions = MagicStudioFilmRebuildStoryboardRequest;
export type FilmRebuildStoryboardResult = MagicStudioFilmRebuildStoryboardResult;
export type FilmAuthoringBatchOptions = MagicStudioFilmAuthoringBatchRequest;
export type FilmAuthoringBatchResult = MagicStudioFilmAuthoringBatchResult;
export type FilmRefreshAnalysisOptions = MagicStudioFilmRefreshAnalysisRequest;
export type FilmRefreshAnalysisResult = MagicStudioFilmRefreshAnalysisResult;
export type FilmScriptStandardizeOptions = MagicStudioFilmScriptStandardizeRequest;
export type FilmScriptStandardizeResult = MagicStudioFilmScriptStandardizeResult;
export type FilmStoryboardPublishOptions = MagicStudioFilmStoryboardPublishRequest;
export type FilmStoryboardPublishResult = MagicStudioFilmStoryboardPublishResult;

const SUPPORTED_IMAGE_ASPECT_RATIOS = ['1:1', '3:4', '4:3', '9:16', '16:9'] as const;
type SupportedImageAspectRatio = (typeof SUPPORTED_IMAGE_ASPECT_RATIOS)[number];
const DEFAULT_FILM_IMAGE_MODEL = 'gemini-3-flash-image';
const DEFAULT_FILM_VIDEO_MODEL = 'sdkwork-2.5';
const DEFAULT_FILM_VIDEO_ASPECT_RATIO = '16:9';
const DEFAULT_FILM_VIDEO_RESOLUTION = '720p';
const DEFAULT_FILM_VIDEO_DURATION = '5s';
const DEFAULT_FILM_VIDEO_FPS = 24;
const normalizeImageAspectRatio = (aspectRatio: string): SupportedImageAspectRatio => {
  const normalized = SUPPORTED_IMAGE_ASPECT_RATIOS.find((item) => item === aspectRatio);
  return normalized || '16:9';
};

const inferFilmImageMimeType = (url: string): string => {
  const normalized = url.toLowerCase();
  if (normalized.includes('.jpg') || normalized.includes('.jpeg')) {
    return 'image/jpeg';
  }
  if (normalized.includes('.webp')) {
    return 'image/webp';
  }
  if (normalized.includes('.gif')) {
    return 'image/gif';
  }
  return 'image/png';
};

const DEFAULT_FILM_ANALYSIS_LANGUAGE = 'zh-CN';

const normalizeFilmGraphProduct = (value: unknown): AgiGenerationProduct | undefined => {
  switch (value) {
    case 'text':
    case 'image':
    case 'video':
    case 'audio':
    case 'music':
    case 'sfx':
    case 'speech':
    case 'short-video':
    case 'short-drama-shot':
    case 'edit-image':
    case 'edit-video':
      return value;
    default:
      return undefined;
  }
};

const createFilmGraphIdentity = (uuid: string, timestamp: string | number) => ({
  id: null,
  uuid,
  createdAt: timestamp,
  updatedAt: timestamp
});

const createStableFilmEntityIdentity = () => {
  const key = createUuid();
  return { id: key, uuid: key };
};

const createFilmSequenceUuid = (projectUuid: string): string => `${projectUuid}:film-sequence:primary`;

const createFilmSurfaceBindingUuid = (
  surface: ProjectGraphSurface,
  surfaceEntityUuid: string,
  graphEntityUuid: string
): string => `${surface}:${surfaceEntityUuid}:${graphEntityUuid}`;

const createFilmSurfaceBinding = (
  timestamp: string | number,
  surface: ProjectGraphSurface,
  surfaceEntityId: string | null,
  surfaceEntityUuid: string,
  graphEntityType: ProjectGraphEntityType,
  graphEntityUuid: string
): ProjectGraphSurfaceBinding => ({
  ...createFilmGraphIdentity(
    createFilmSurfaceBindingUuid(surface, surfaceEntityUuid, graphEntityUuid),
    timestamp
  ),
  surface,
  surfaceEntityId,
  surfaceEntityUuid,
  graphEntityType,
  graphEntityId: null,
  graphEntityUuid
});

const resolveFilmStorageMode = (
  asset: FilmAssetMediaResource | undefined
): ProjectGraphMediaSource['storageMode'] => {
  if (!asset) {
    return undefined;
  }

  const metadata = (asset as { metadata?: Record<string, unknown> }).metadata || {};
  const explicitStorageMode = metadata.storageMode;
  if (
    explicitStorageMode === 'browser-vfs' ||
    explicitStorageMode === 'desktop-fs' ||
    explicitStorageMode === 'remote-url' ||
    explicitStorageMode === 'hybrid'
  ) {
    return explicitStorageMode;
  }

  const directLocatorCandidates = [
    (asset as { path?: string }).path,
    asset.url,
    typeof metadata.url === 'string' ? metadata.url : undefined,
  ].filter((value): value is string => typeof value === 'string' && value.length > 0);

  const locator = directLocatorCandidates[0];
  if (!locator) {
    return undefined;
  }

  if (locator.startsWith('http://') || locator.startsWith('https://')) {
    return 'remote-url';
  }

  if (
    isExplicitLocalAssetLocator(locator) ||
    isLocalFilePath(locator)
  ) {
    return 'desktop-fs';
  }

  if (isManagedAssetLocator(locator)) {
    return 'hybrid';
  }

  return 'hybrid';
};

const resolveFilmAssetContentType = (
  asset: FilmAssetMediaResource | undefined
): ProjectGraphMediaSource['primaryType'] => {
  switch (asset?.type || asset?.assetType) {
    case 'image':
      return 'image';
    case 'video':
      return 'video';
    case 'audio':
      return 'audio';
    case 'music':
      return 'music';
    case 'voice':
      return 'voice';
    default:
      return undefined;
  }
};

const buildFilmProjectGraphSource = (
  asset: FilmAssetMediaResource | undefined
): ProjectGraphMediaSource | null => {
  if (!asset) {
    return null;
  }

  const assetId = normalizeText(asset.assetId) || null;
  const resourceViewId = normalizeText(asset.id) || null;
  const primaryResourceId = normalizeText(asset.fileId) || null;
  const primaryType = resolveFilmAssetContentType(asset);

  if (!assetId && !resourceViewId && !primaryResourceId) {
    return null;
  }

  const metadata: Record<string, unknown> = {};
  if (asset.assetType) {
    metadata.assetType = asset.assetType;
  }
  if (asset.scene) {
    metadata.scene = asset.scene;
  }
  if (asset.url) {
    metadata.url = asset.url;
  }

  return {
    assetId,
    primaryResourceId,
    resourceViewId,
    primaryType,
    storageMode: resolveFilmStorageMode(asset),
    scopeDomain: 'film',
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined
  };
};

const resolveFilmSceneOrder = (scene: FilmScene, fallbackIndex: number): number => {
  if (typeof scene.index === 'number' && Number.isFinite(scene.index)) {
    return scene.index;
  }
  if (typeof scene.sceneNumber === 'number' && Number.isFinite(scene.sceneNumber)) {
    return Math.max(0, scene.sceneNumber - 1);
  }
  return fallbackIndex;
};

const resolveFilmShotOrder = (shot: FilmShot, fallbackIndex: number): number => {
  if (typeof shot.index === 'number' && Number.isFinite(shot.index)) {
    return shot.index;
  }
  if (typeof shot.shotNumber === 'number' && Number.isFinite(shot.shotNumber)) {
    return Math.max(0, shot.shotNumber - 1);
  }
  return fallbackIndex;
};

const resolveFilmShotTitle = (shot: FilmShot, fallbackIndex: number): string => {
  if (typeof shot.shotNumber === 'number' && Number.isFinite(shot.shotNumber)) {
    return `Shot ${shot.shotNumber}`;
  }
  return `Shot ${fallbackIndex + 1}`;
};

const resolveFilmShotPrompt = (shot: FilmShot): string | undefined =>
  normalizeText(shot.generation?.prompt) || normalizeText(shot.description);

const resolveFilmShotProduct = (
  shot: FilmShot,
  source: ProjectGraphMediaSource | null
): ProjectGraphShot['product'] => {
  const explicitProduct = normalizeFilmGraphProduct(shot.generation?.product);
  if (explicitProduct) {
    return explicitProduct;
  }

  switch (source?.primaryType) {
    case 'image':
      return 'image';
    case 'video':
      return 'video';
    case 'audio':
      return 'audio';
    case 'music':
      return 'music';
    case 'voice':
      return 'speech';
    default:
      return undefined;
  }
};

const resolveFilmShotMode = (product: ProjectGraphShot['product']): AgiGenerationMode | undefined => {
  switch (product) {
    case 'image':
      return 'text-to-image';
    case 'video':
    case 'short-video':
    case 'short-drama-shot':
      return 'text-to-video';
    case 'audio':
    case 'sfx':
      return 'text-to-audio';
    case 'speech':
      return 'text-to-speech';
    case 'music':
      return 'text-to-music';
    default:
      return undefined;
  }
};

type FilmGraphSceneAccumulator = {
  scene: ProjectGraphScene;
  order: number;
  shotUuids: string[];
};

export const buildFilmProjectGraph = (project: FilmProject): ProjectGraphDocument => {
  const timestamp = project.updatedAt ?? project.createdAt ?? Date.now();
  const sequenceUuid = createFilmSequenceUuid(project.uuid);
  const scenes: Record<string, ProjectGraphScene> = {};
  const shots: Record<string, ProjectGraphShot> = {};
  const surfaceBindings: ProjectGraphSurfaceBinding[] = [
    createFilmSurfaceBinding(
      timestamp,
      'film-project',
      project.id || null,
      project.uuid,
      'project',
      project.uuid
    )
  ];
  const sceneLookup = new Map<string, string>();
  const sceneAccumulators = new Map<string, FilmGraphSceneAccumulator>();

  [...project.scenes]
    .sort((left, right) => resolveFilmSceneOrder(left, 0) - resolveFilmSceneOrder(right, 0))
    .forEach((scene, fallbackIndex) => {
      const sceneUuid = normalizeText(scene.uuid) || normalizeText(scene.id) || `${project.uuid}:scene:${fallbackIndex}`;
      const order = resolveFilmSceneOrder(scene, fallbackIndex);
      const graphScene: ProjectGraphScene = {
        ...createFilmGraphIdentity(sceneUuid, scene.updatedAt ?? scene.createdAt ?? timestamp),
        projectUuid: project.uuid,
        sequenceUuid,
        order,
        title:
          typeof scene.sceneNumber === 'number' && Number.isFinite(scene.sceneNumber)
            ? `Scene ${scene.sceneNumber}`
            : `Scene ${fallbackIndex + 1}`,
        summary: normalizeText(scene.summary),
        shotUuids: [],
        metadata: {
          sourceSceneId: scene.id,
          locationId: scene.locationId,
          locationUuid: scene.locationUuid,
          characterIds: scene.characterIds,
          characterUuids: scene.characterUuids,
          propUuids: scene.propUuids,
          moodTags: scene.moodTags,
          visualPrompt: scene.visualPrompt
        }
      };

      scenes[sceneUuid] = graphScene;
      sceneAccumulators.set(sceneUuid, {
        scene: graphScene,
        order,
        shotUuids: []
      });
      sceneLookup.set(sceneUuid, sceneUuid);
      if (scene.id) {
        sceneLookup.set(scene.id, sceneUuid);
      }

      surfaceBindings.push(
        createFilmSurfaceBinding(
          timestamp,
          'film-scene',
          scene.id || null,
          sceneUuid,
          'scene',
          sceneUuid
        )
      );
    });

  const resolveOrCreateSceneUuid = (shot: FilmShot, fallbackIndex: number): string => {
    const explicitKey = normalizeText(shot.sceneUuid) || normalizeText(shot.sceneId);
    if (explicitKey && sceneLookup.has(explicitKey)) {
      return sceneLookup.get(explicitKey)!;
    }

    const syntheticSceneUuid = `${project.uuid}:scene:unassigned:${normalizeText(shot.uuid) || normalizeText(shot.id) || fallbackIndex}`;
    if (!sceneAccumulators.has(syntheticSceneUuid)) {
      const order = sceneAccumulators.size;
      const syntheticScene: ProjectGraphScene = {
        ...createFilmGraphIdentity(syntheticSceneUuid, shot.updatedAt ?? shot.createdAt ?? timestamp),
        projectUuid: project.uuid,
        sequenceUuid,
        order,
        title: `Scene ${order + 1}`,
        summary: 'Unassigned film shots',
        shotUuids: [],
        metadata: {
          synthetic: true
        }
      };
      scenes[syntheticSceneUuid] = syntheticScene;
      sceneAccumulators.set(syntheticSceneUuid, {
        scene: syntheticScene,
        order,
        shotUuids: []
      });
      sceneLookup.set(syntheticSceneUuid, syntheticSceneUuid);
      surfaceBindings.push(
        createFilmSurfaceBinding(
          timestamp,
          'film-scene',
          null,
          syntheticSceneUuid,
          'scene',
          syntheticSceneUuid
        )
      );
    }

    return syntheticSceneUuid;
  };

  [...project.shots]
    .sort((left, right) => resolveFilmShotOrder(left, 0) - resolveFilmShotOrder(right, 0))
    .forEach((shot, fallbackIndex) => {
      const shotUuid = normalizeText(shot.uuid) || normalizeText(shot.id) || `${project.uuid}:shot:${fallbackIndex}`;
      const sceneUuid = resolveOrCreateSceneUuid(shot, fallbackIndex);
      const sceneAccumulator = sceneAccumulators.get(sceneUuid);
      const sourceAsset = shot.generation?.assets?.[0] || shot.assets?.[0];
      const source = buildFilmProjectGraphSource(sourceAsset);
      const product = resolveFilmShotProduct(shot, source);

      const graphShot: ProjectGraphShot = {
        ...createFilmGraphIdentity(shotUuid, shot.updatedAt ?? shot.createdAt ?? timestamp),
        projectUuid: project.uuid,
        sequenceUuid,
        sceneUuid,
        order: resolveFilmShotOrder(shot, fallbackIndex),
        title: resolveFilmShotTitle(shot, fallbackIndex),
        prompt: resolveFilmShotPrompt(shot),
        product,
        mode: resolveFilmShotMode(product),
        clipUuid: null,
        source,
        metadata: {
          sourceShotId: shot.id,
          sceneId: shot.sceneId,
          locationUuid: shot.locationUuid,
          description: shot.description,
          duration: shot.duration,
          characterIds: shot.characterIds,
          generationStatus: shot.generation?.status,
          modelId: shot.generation?.modelId,
          assetIds: [
            ...(shot.assets || []).map((asset) => asset.assetId),
            ...(shot.generation?.assets || []).map((asset) => asset.assetId)
          ].filter((value): value is string => typeof value === 'string' && value.length > 0)
        }
      };

      shots[shotUuid] = graphShot;
      if (sceneAccumulator) {
        sceneAccumulator.shotUuids.push(shotUuid);
        sceneAccumulator.scene.shotUuids = [...sceneAccumulator.shotUuids];
      }

      surfaceBindings.push(
        createFilmSurfaceBinding(
          timestamp,
          'film-shot',
          shot.id || null,
          shotUuid,
          'shot',
          shotUuid
        )
      );
    });

  const orderedScenes = [...sceneAccumulators.values()].sort((left, right) => left.order - right.order);
  const orderedSceneUuids = orderedScenes.map((entry) => entry.scene.uuid);
  const orderedShotUuids = orderedScenes.flatMap((entry) => entry.shotUuids);

  let timelineCursor = 0;
  orderedScenes.forEach((entry) => {
    const duration = entry.shotUuids.reduce((total, shotUuid) => total + (shots[shotUuid]?.metadata?.duration as number || 0), 0);
    entry.scene.startTime = timelineCursor;
    entry.scene.duration = duration > 0 ? duration : undefined;
    timelineCursor += duration;
  });

  const sequence: ProjectGraphSequence = {
    ...createFilmGraphIdentity(sequenceUuid, timestamp),
    projectUuid: project.uuid,
    name: normalizeText(project.script?.title) || normalizeText(project.name) || 'Film Sequence',
    order: 0,
    sceneUuids: orderedSceneUuids,
    shotUuids: orderedShotUuids,
    metadata: {
      sourceSurface: 'film',
      projectStatus: project.status,
      settings: {
        aspectRatio: project.settings?.aspectRatio || project.settings?.aspect,
        resolution: project.settings?.resolution,
        fps: project.settings?.fps,
        style: project.settings?.style
      }
    }
  };

  return {
    version: 1,
    project: {
      ...createFilmGraphIdentity(project.uuid, timestamp),
      domain: 'film',
      name: project.name,
      description: project.description,
      workspaceUuid: null,
      sequenceUuids: [sequenceUuid],
      timelineUuids: [],
      publishTargetUuids: [],
      metadata: {
        sourceSurface: 'film',
        status: project.status
      }
    },
    sequences: {
      [sequenceUuid]: sequence
    },
    scenes,
    shots,
    timelines: {},
    tracks: {},
    clips: {},
    publishTargets: {},
    surfaceBindings,
    metadata: {
      sourceSurface: 'film',
      sceneCount: orderedSceneUuids.length,
      shotCount: orderedShotUuids.length
    }
  };
};

export const normalizeFilmProject = (
  project: FilmProject,
  options: {
    preferExistingProjectGraph?: boolean;
  } = {}
): FilmProject => ({
  ...project,
  projectGraph:
    options.preferExistingProjectGraph !== false && project.projectGraph
      ? project.projectGraph
      : buildFilmProjectGraph(project)
});

const normalizeFilmTemplate = (template: FilmTemplate): FilmTemplate => ({
  ...template,
  projectData: normalizeFilmProject(template.projectData),
});

export const filmService = {
  
  createProject: (name: string, description?: string): FilmProject => {
    const now = Date.now();
    const uuid = createUuid();
    
    return normalizeFilmProject({
      id: uuid,
      uuid,
      type: 'FILM_PROJECT',
      name,
      description: description || 'A new masterpiece',
      status: 'DRAFT',
      input: {
        ...createStableFilmEntityIdentity(),
        type: 'FILM_USER_INPUT',
        text: '',
        language: 'zh',
        createdAt: now,
        updatedAt: now,
      },
      script: {
        ...createStableFilmEntityIdentity(),
        type: 'FILM_SCRIPT',
        title: name,
        genres: [],
        styles: [],
        content: '',
        standardized: false,
        version: '1.0.0',
        createdAt: now,
        updatedAt: now,
      },
      characters: [],
      props: [],
      locations: [],
      scenes: [],
      shots: [],
      media: [],
      settings: {
        ...createStableFilmEntityIdentity(),
        theme: 'default',
        style: 'cinematic',
        aspect: '16:9',
        resolution: '1080P',
        fps: 24,
        quality: 'standard',
        createdAt: now,
        updatedAt: now
      },
      createdAt: now,
      updatedAt: now,
    }, { preferExistingProjectGraph: false });
  },

  createEmptyCharacter: (): FilmCharacter => {
      const now = Date.now();
      return {
          ...createStableFilmEntityIdentity(),
          type: 'FILM_CHARACTER',
          name: 'New Character',
          characterType: 'HUMAN',
          status: 'ACTIVE',
          description: '',
          appearance: { ageGroup: 'Unknown', gender: 'Unknown' },
          personality: { traits: [] },
          refAssets: [],
          createdAt: now,
          updatedAt: now
      };
  },

  getCharacterAssetByScene: (character: FilmCharacter, scene: MediaScene): FilmAssetMediaResource | undefined => {
      return character.refAssets?.find(a => a.scene === scene);
  },

  getCharacterAvatar: (character: FilmCharacter): FilmAssetMediaResource | undefined => {
      return filmService.getCharacterAssetByScene(character, MediaScene.AVATAR);
  },

  createEmptyProp: (): FilmProp => {
      const now = Date.now();
      return {
          ...createStableFilmEntityIdentity(),
          type: 'FILM_PROP',
          name: 'New Prop',
          description: '',
          tags: [],
          refAssets: [],
          createdAt: now,
          updatedAt: now
      };
  },

  createEmptyLocation: (): FilmLocation => {
      const now = Date.now();
      return {
          ...createStableFilmEntityIdentity(),
          type: 'FILM_LOCATION',
          name: 'New Location',
          indoor: true,
          timeOfDay: 'DAY',
          tags: [],
          atmosphereTags: [],
          refAssets: [],
          createdAt: now,
          updatedAt: now
      };
  },

  createEmptyShot: (sceneUuid?: string, index: number = 1, locationUuid?: string): FilmShot => {
      const now = Date.now();
      return {
          ...createStableFilmEntityIdentity(),
          type: 'FILM_SHOT',
          shotNumber: index + 1,
          index,
          sceneUuid,
          locationUuid,
          duration: 3,
          description: '',
          dialogue: { items: [] },
          characterIds: [],
          generation: {
              status: 'PENDING',
              prompt: '',
              base: '',
              assets: []
          },
          assets: [],
          createdAt: now,
          updatedAt: now
      };
  },
  
  saveProject: async (project: FilmProject): Promise<void> => {
      await filmProjectService.save(project);
  },
  
  loadProject: async (uuid: string): Promise<FilmProject | null> => {
      const res = await filmProjectService.findById(uuid);
      return res.data ? normalizeFilmProject(res.data) : null;
  },
  
  getAllProjects: async (): Promise<FilmProject[]> => {
      const res = await filmProjectService.findAll({ page: 0, size: 1000 });
      return (res.data?.content || []).map((project) => normalizeFilmProject(project));
  },

  listPresets: async (): Promise<FilmPreset[]> => {
      const response = await getFilmServerClient().listFilmPresets();
      return (response.items || []) as FilmPreset[];
  },

  createPreset: async (
      options: FilmPresetWriteOptions
  ): Promise<FilmPreset> => {
      const response = await getFilmServerClient().createFilmPreset(options);
      return response.data as FilmPreset;
  },

  listTemplates: async (
      options: FilmTemplateListOptions = {}
  ): Promise<FilmTemplate[]> => {
      const response = await getFilmServerClient().listFilmTemplates(options);
      return ((response.items || []) as FilmTemplate[]).map(normalizeFilmTemplate);
  },

  createTemplate: async (
      options: FilmTemplateWriteOptions
  ): Promise<FilmTemplate> => {
      const response = await getFilmServerClient().createFilmTemplate(options);
      return normalizeFilmTemplate(response.data as FilmTemplate);
  },

  readTemplate: async (templateId: string): Promise<FilmTemplate> => {
      const response = await getFilmServerClient().readFilmTemplate(templateId);
      return normalizeFilmTemplate(response.data as FilmTemplate);
  },

  updateTemplate: async (
      templateId: string,
      options: FilmTemplateWriteOptions
  ): Promise<FilmTemplate> => {
      const response = await getFilmServerClient().updateFilmTemplate(templateId, options);
      return normalizeFilmTemplate(response.data as FilmTemplate);
  },

  instantiateTemplate: async (
      templateId: string,
      options: FilmTemplateInstantiateOptions = {}
  ): Promise<FilmProject> => {
      const response = await getFilmServerClient().instantiateFilmTemplate(templateId, options);
      const project = normalizeFilmProjectRecord(response.data);
      if (!project) {
          throw new Error('Film template instantiate returned empty project data');
      }
      return normalizeFilmProject(project);
  },

  deleteTemplate: async (templateId: string): Promise<void> => {
      await getFilmServerClient().deleteFilmTemplate(templateId);
  },

  createTemplateSnapshot: async (
      projectId: string,
      options: FilmTemplateSnapshotOptions = {}
  ): Promise<FilmTemplate> => {
      const response = await getFilmServerClient().createFilmTemplateSnapshot(projectId, options);
      return normalizeFilmTemplate(response.data as FilmTemplate);
  },

  deleteProject: async (uuid: string): Promise<void> => {
      await filmProjectService.deleteById(uuid);
  },

  analyzeScript: async (content: string): Promise<FilmAnalysisResult> => {
    const response = await getFilmServerClient().analyzeFilmScript({
      content,
      language: DEFAULT_FILM_ANALYSIS_LANGUAGE,
    });

    return normalizeFilmAnalysisResult(response.data);
  },

  extractCharacters: async (content: string): Promise<FilmCharacter[]> => {
      const response = await getFilmServerClient().extractFilmCharacters({
          content,
          language: DEFAULT_FILM_ANALYSIS_LANGUAGE,
      });

      return (response.items || [])
          .map(normalizeFilmCharacterRecord)
          .filter((item): item is FilmCharacter => item !== null);
  },

  extractProps: async (content: string): Promise<FilmProp[]> => {
      const response = await getFilmServerClient().extractFilmProps({
          content,
          language: DEFAULT_FILM_ANALYSIS_LANGUAGE,
      });

      return (response.items || [])
          .map(normalizeFilmPropRecord)
          .filter((item): item is FilmProp => item !== null);
  },

  readProjectGraph: async (projectId: string): Promise<ProjectGraphDocument> => {
      const response = await getFilmServerClient().readFilmProjectGraph(projectId);
      return response.data as ProjectGraphDocument;
  },

  readAssetInventory: async (projectId: string): Promise<FilmAssetInventoryResult> => {
      const response = await getFilmServerClient().readFilmProjectAssetInventory(projectId);
      return response.data as FilmAssetInventoryResult;
  },

  listPublishes: async (
      projectId: string,
      options: FilmPublishListOptions = {}
  ): Promise<FilmPublishRecord[]> => {
      const response = await getFilmServerClient().listFilmProjectPublishes(projectId, options);
      return (response.items || []) as FilmPublishRecord[];
  },

  listReviewQueue: async (
      projectId: string,
      options: FilmReviewQueueOptions = {}
  ): Promise<FilmProjectReviewQueueItem[]> => {
      const response = await getFilmServerClient().listFilmProjectReviewQueue(
          projectId,
          options
      );
      return (response.items || []) as FilmProjectReviewQueueItem[];
  },

  readProjectReviewPortfolioDashboard: async (
      projectId: string
  ): Promise<FilmProjectReviewPortfolioDashboardResult> => {
      const response = await getFilmServerClient().readFilmProjectReviewPortfolioDashboard(
          projectId
      );
      return response.data as FilmProjectReviewPortfolioDashboardResult;
  },

  readProjectReviewReviewerCapacity: async (
      projectId: string
  ): Promise<FilmProjectReviewReviewerCapacityResult> => {
      const response = await getFilmServerClient().readFilmProjectReviewReviewerCapacity(
          projectId
      );
      return response.data as FilmProjectReviewReviewerCapacityResult;
  },

  readProjectReviewDecisionFreshness: async (
      projectId: string
  ): Promise<FilmProjectReviewDecisionFreshnessResult> => {
      const response = await getFilmServerClient().readFilmProjectReviewDecisionFreshness(
          projectId
      );
      return response.data as FilmProjectReviewDecisionFreshnessResult;
  },

  readProjectReviewGovernanceDrift: async (
      projectId: string
  ): Promise<FilmProjectReviewGovernanceDriftResult> => {
      const response = await getFilmServerClient().readFilmProjectReviewGovernanceDrift(
          projectId
      );
      return response.data as FilmProjectReviewGovernanceDriftResult;
  },

  readProjectReviewEscalationForecast: async (
      projectId: string
  ): Promise<FilmProjectReviewEscalationForecastResult> => {
      const response = await getFilmServerClient().readFilmProjectReviewEscalationForecast(
          projectId
      );
      return response.data as FilmProjectReviewEscalationForecastResult;
  },

  readProjectReviewDependencyGraph: async (
      projectId: string
  ): Promise<FilmProjectReviewDependencyGraphResult> => {
      const response = await getFilmServerClient().readFilmProjectReviewDependencyGraph(
          projectId
      );
      return response.data as FilmProjectReviewDependencyGraphResult;
  },

  readProjectReviewInterventionPlan: async (
      projectId: string
  ): Promise<FilmProjectReviewInterventionPlanResult> => {
      const response = await getFilmServerClient().readFilmProjectReviewInterventionPlan(
          projectId
      );
      return response.data as FilmProjectReviewInterventionPlanResult;
  },

  readProjectReviewRecoveryOrchestration: async (
      projectId: string
  ): Promise<FilmProjectReviewRecoveryOrchestrationResult> => {
      const response = await getFilmServerClient().readFilmProjectReviewRecoveryOrchestration(
          projectId
      );
      return response.data as FilmProjectReviewRecoveryOrchestrationResult;
  },

  readProjectReviewApprovalBurnDown: async (
      projectId: string
  ): Promise<FilmProjectReviewApprovalBurnDownResult> => {
      const response = await getFilmServerClient().readFilmProjectReviewApprovalBurnDown(
          projectId
      );
      return response.data as FilmProjectReviewApprovalBurnDownResult;
  },

  readProjectReviewInterventionOutcomes: async (
      projectId: string
  ): Promise<FilmProjectReviewInterventionOutcomesResult> => {
      const response = await getFilmServerClient().readFilmProjectReviewInterventionOutcomes(
          projectId
      );
      return response.data as FilmProjectReviewInterventionOutcomesResult;
  },

  readProjectReviewEffectivenessBaseline: async (
      projectId: string
  ): Promise<FilmProjectReviewEffectivenessBaselineResult> => {
      const response = await getFilmServerClient().readFilmProjectReviewEffectivenessBaseline(
          projectId
      );
      return response.data as FilmProjectReviewEffectivenessBaselineResult;
  },

  readProjectReviewInterventionExecutionHistory: async (
      projectId: string
  ): Promise<FilmProjectReviewInterventionExecutionHistoryResult> => {
      const response =
          await getFilmServerClient().readFilmProjectReviewInterventionExecutionHistory(
              projectId
          );
      return response.data as FilmProjectReviewInterventionExecutionHistoryResult;
  },

  readPublish: async (projectId: string, publishId: string): Promise<FilmPublishRecord> => {
      const response = await getFilmServerClient().readFilmProjectPublish(projectId, publishId);
      return response.data as FilmPublishRecord;
  },

  readPublishReviewState: async (
      projectId: string,
      publishId: string
  ): Promise<FilmPublishReviewState> => {
      const response = await getFilmServerClient().readFilmProjectPublishReviewState(
          projectId,
          publishId
      );
      return response.data as FilmPublishReviewState;
  },

  readPublishReviewTimeline: async (
      projectId: string,
      publishId: string
  ): Promise<FilmPublishReviewTimelineResult> => {
      const response = await getFilmServerClient().readFilmProjectPublishReviewTimeline(
          projectId,
          publishId
      );
      return response.data as FilmPublishReviewTimelineResult;
  },

  readPublishReviewRounds: async (
      projectId: string,
      publishId: string
  ): Promise<FilmPublishReviewRoundsResult> => {
      const response = await getFilmServerClient().readFilmProjectPublishReviewRounds(
          projectId,
          publishId
      );
      return response.data as FilmPublishReviewRoundsResult;
  },

  readPublishReviewAnchors: async (
      projectId: string,
      publishId: string
  ): Promise<FilmPublishReviewAnchorsResult> => {
      const response = await getFilmServerClient().readFilmProjectPublishReviewAnchors(
          projectId,
          publishId
      );
      return response.data as FilmPublishReviewAnchorsResult;
  },

  readPublishReviewActivity: async (
      projectId: string,
      publishId: string
  ): Promise<FilmPublishReviewActivityResult> => {
      const response = await getFilmServerClient().readFilmProjectPublishReviewActivity(
          projectId,
          publishId
      );
      return response.data as FilmPublishReviewActivityResult;
  },

  readPublishReviewAnchorResponsibility: async (
      projectId: string,
      publishId: string
  ): Promise<FilmPublishReviewAnchorResponsibilityResult> => {
      const response = await getFilmServerClient().readFilmProjectPublishReviewAnchorResponsibility(
          projectId,
          publishId
      );
      return response.data as FilmPublishReviewAnchorResponsibilityResult;
  },

  readPublishReviewReviewerBacklog: async (
      projectId: string,
      publishId: string
  ): Promise<FilmPublishReviewReviewerBacklogResult> => {
      const response = await getFilmServerClient().readFilmProjectPublishReviewReviewerBacklog(
          projectId,
          publishId
      );
      return response.data as FilmPublishReviewReviewerBacklogResult;
  },

  readPublishReviewDecisionMatrix: async (
      projectId: string,
      publishId: string
  ): Promise<FilmPublishReviewDecisionMatrixResult> => {
      const response = await getFilmServerClient().readFilmProjectPublishReviewDecisionMatrix(
          projectId,
          publishId
      );
      return response.data as FilmPublishReviewDecisionMatrixResult;
  },

  readPublishReviewReadiness: async (
      projectId: string,
      publishId: string
  ): Promise<FilmPublishReviewReadinessResult> => {
      const response = await getFilmServerClient().readFilmProjectPublishReviewReadiness(
          projectId,
          publishId
      );
      return response.data as FilmPublishReviewReadinessResult;
  },

  readPublishReviewReviewerAttention: async (
      projectId: string,
      publishId: string
  ): Promise<FilmPublishReviewReviewerAttentionResult> => {
      const response = await getFilmServerClient().readFilmProjectPublishReviewReviewerAttention(
          projectId,
          publishId
      );
      return response.data as FilmPublishReviewReviewerAttentionResult;
  },

  readPublishReviewReviewerCoverage: async (
      projectId: string,
      publishId: string
  ): Promise<FilmPublishReviewReviewerCoverageResult> => {
      const response = await getFilmServerClient().readFilmProjectPublishReviewReviewerCoverage(
          projectId,
          publishId
      );
      return response.data as FilmPublishReviewReviewerCoverageResult;
  },

  readPublishReviewOperationsDashboard: async (
      projectId: string,
      publishId: string
  ): Promise<FilmPublishReviewOperationsDashboardResult> => {
      const response = await getFilmServerClient().readFilmProjectPublishReviewOperationsDashboard(
          projectId,
          publishId
      );
      return response.data as FilmPublishReviewOperationsDashboardResult;
  },

  readPublishReviewStaleDecisions: async (
      projectId: string,
      publishId: string
  ): Promise<FilmPublishReviewStaleDecisionResult> => {
      const response = await getFilmServerClient().readFilmProjectPublishReviewStaleDecisions(
          projectId,
          publishId
      );
      return response.data as FilmPublishReviewStaleDecisionResult;
  },

  readPublishReviewLatencyAnalytics: async (
      projectId: string,
      publishId: string
  ): Promise<FilmPublishReviewLatencyAnalyticsResult> => {
      const response = await getFilmServerClient().readFilmProjectPublishReviewLatencyAnalytics(
          projectId,
          publishId
      );
      return response.data as FilmPublishReviewLatencyAnalyticsResult;
  },

  readPublishReviewWorklist: async (
      projectId: string,
      publishId: string
  ): Promise<FilmPublishReviewWorklistResult> => {
      const response = await getFilmServerClient().readFilmProjectPublishReviewWorklist(
          projectId,
          publishId
      );
      return response.data as FilmPublishReviewWorklistResult;
  },

  approvePublish: async (
      projectId: string,
      publishId: string,
      options: FilmPublishApproveOptions = {}
  ): Promise<FilmPublishApproveResult> => {
      const response = await getFilmServerClient().approveFilmProjectPublish(
          projectId,
          publishId,
          options
      );
      return response.data as FilmPublishApproveResult;
  },

  requestPublishChanges: async (
      projectId: string,
      publishId: string,
      options: FilmPublishRequestChangesOptions
  ): Promise<FilmPublishRequestChangesResult> => {
      const response = await getFilmServerClient().requestFilmProjectPublishChanges(
          projectId,
          publishId,
          options
      );
      return response.data as FilmPublishRequestChangesResult;
  },

  addPublishReviewComment: async (
      projectId: string,
      publishId: string,
      options: FilmPublishReviewCommentOptions
  ): Promise<FilmPublishReviewCommentResult> => {
      const response = await getFilmServerClient().createFilmProjectPublishReviewComment(
          projectId,
          publishId,
          options
      );
      return response.data as FilmPublishReviewCommentResult;
  },

  submitPublishReview: async (
      projectId: string,
      publishId: string,
      options: FilmPublishReviewSubmitOptions = {}
  ): Promise<FilmPublishReviewSubmitResult> => {
      const response = await getFilmServerClient().submitFilmProjectPublishReview(
          projectId,
          publishId,
          options
      );
      return response.data as FilmPublishReviewSubmitResult;
  },

  consensusPublishReview: async (
      projectId: string,
      publishId: string,
      options: FilmPublishReviewConsensusOptions
  ): Promise<FilmPublishReviewConsensusResult> => {
      const response = await getFilmServerClient().consensusFilmProjectPublishReview(
          projectId,
          publishId,
          options
      );
      return response.data as FilmPublishReviewConsensusResult;
  },

  resolvePublishReviewComment: async (
      projectId: string,
      publishId: string,
      commentId: string,
      options: FilmPublishReviewCommentResolveOptions = {}
  ): Promise<FilmPublishReviewCommentResolveResult> => {
      const response = await getFilmServerClient().resolveFilmProjectPublishReviewComment(
          projectId,
          publishId,
          commentId,
          options
      );
      return response.data as FilmPublishReviewCommentResolveResult;
  },

  setPublishReviewAssignments: async (
      projectId: string,
      publishId: string,
      options: FilmPublishReviewAssignmentsOptions
  ): Promise<FilmPublishReviewAssignmentsResult> => {
      const response = await getFilmServerClient().setFilmProjectPublishReviewAssignments(
          projectId,
          publishId,
          options
      );
      return response.data as FilmPublishReviewAssignmentsResult;
  },

  reopenPublish: async (
      projectId: string,
      publishId: string,
      options: FilmPublishReopenOptions = {}
  ): Promise<FilmPublishReopenResult> => {
      const response = await getFilmServerClient().reopenFilmProjectPublish(
          projectId,
          publishId,
          options
      );
      return response.data as FilmPublishReopenResult;
  },

  deletePublish: async (projectId: string, publishId: string): Promise<void> => {
      await getFilmServerClient().deleteFilmProjectPublish(projectId, publishId);
  },

  restorePublish: async (
      projectId: string,
      publishId: string,
      options: FilmPublishRestoreOptions = {}
  ): Promise<FilmPublishRestoreResult> => {
      const response = await getFilmServerClient().restoreFilmProjectPublish(
          projectId,
          publishId,
          options
      );
      const result = response.data as FilmPublishRestoreResult;
      return {
          ...result,
          project: normalizeFilmProject(result.project),
          validation: result.validation?.normalizedProject
              ? {
                  ...result.validation,
                  normalizedProject: normalizeFilmProject(result.validation.normalizedProject),
                }
              : result.validation,
      };
  },

  readPublishArtifactContent: async (
      projectId: string,
      publishId: string,
      artifactKind: string
  ): Promise<FilmPublishArtifactContent> => {
      const response = await getFilmServerClient().readFilmProjectPublishArtifactContent(
          projectId,
          publishId,
          artifactKind
      );
      return response.data as FilmPublishArtifactContent;
  },

  standardizeScript: async (
      projectId: string,
      options: FilmScriptStandardizeOptions = {}
  ): Promise<FilmScriptStandardizeResult> => {
      const response = await getFilmServerClient().standardizeFilmScript(projectId, options);
      const result = response.data as FilmScriptStandardizeResult;
      return {
          ...result,
          project: normalizeFilmProject(result.project),
          validation: result.validation?.normalizedProject
              ? {
                  ...result.validation,
                  normalizedProject: normalizeFilmProject(result.validation.normalizedProject),
                }
              : result.validation,
      };
  },

  prepareAnalysis: async (
      projectId: string,
      options: FilmPrepareAnalysisOptions = {}
  ): Promise<FilmPrepareAnalysisResult> => {
      const response = await getFilmServerClient().prepareFilmProjectAnalysis(projectId, options);
      const result = response.data as FilmPrepareAnalysisResult;
      return {
          ...result,
          project: normalizeFilmProject(result.project),
          validation: result.validation?.normalizedProject
              ? {
                  ...result.validation,
                  normalizedProject: normalizeFilmProject(result.validation.normalizedProject),
                }
              : result.validation,
      };
  },

  rebuildStoryboard: async (
      projectId: string,
      options: FilmRebuildStoryboardOptions = {}
  ): Promise<FilmRebuildStoryboardResult> => {
      const response = await getFilmServerClient().rebuildFilmProjectStoryboard(projectId, options);
      const result = response.data as FilmRebuildStoryboardResult;
      return {
          ...result,
          project: normalizeFilmProject(result.project),
          validation: result.validation?.normalizedProject
              ? {
                  ...result.validation,
                  normalizedProject: normalizeFilmProject(result.validation.normalizedProject),
                }
              : result.validation,
      };
  },

  createSceneBreakdown: async (
      projectId: string,
      options: FilmCreateSceneBreakdownOptions = {}
  ): Promise<FilmCreateSceneBreakdownResult> => {
      const response = await getFilmServerClient().createFilmProjectSceneBreakdown(
          projectId,
          options
      );
      const result = response.data as FilmCreateSceneBreakdownResult;
      return {
          ...result,
          project: normalizeFilmProject(result.project),
          validation: result.validation?.normalizedProject
              ? {
                  ...result.validation,
                  normalizedProject: normalizeFilmProject(result.validation.normalizedProject),
                }
              : result.validation,
      };
  },

  createShootingPlan: async (
      projectId: string,
      options: FilmCreateShootingPlanOptions = {}
  ): Promise<FilmCreateShootingPlanResult> => {
      const response = await getFilmServerClient().createFilmProjectShootingPlan(
          projectId,
          options
      );
      const result = response.data as FilmCreateShootingPlanResult;
      return {
          ...result,
          project: normalizeFilmProject(result.project),
          validation: result.validation?.normalizedProject
              ? {
                  ...result.validation,
                  normalizedProject: normalizeFilmProject(result.validation.normalizedProject),
                }
              : result.validation,
      };
  },

  generateShotVariants: async (
      projectId: string,
      options: FilmGenerateShotVariantsOptions = {}
  ): Promise<FilmGenerateShotVariantsResult> => {
      const response = await getFilmServerClient().generateFilmProjectShotVariants(
          projectId,
          options
      );
      const result = response.data as FilmGenerateShotVariantsResult;
      return {
          ...result,
          project: normalizeFilmProject(result.project),
          validation: result.validation?.normalizedProject
              ? {
                  ...result.validation,
                  normalizedProject: normalizeFilmProject(result.validation.normalizedProject),
                }
              : result.validation,
      };
  },

  generateStoryboard: async (
      projectId: string,
      options: FilmStoryboardGenerateOptions = {}
  ): Promise<FilmProject> => {
      const response = await getFilmServerClient().generateFilmStoryboard(projectId, {
          language: options.language || DEFAULT_FILM_ANALYSIS_LANGUAGE,
          replaceShots: options.replaceShots,
          maxShotsPerScene: options.maxShotsPerScene,
          includeEstablishingShot: options.includeEstablishingShot,
      });
      const project = normalizeFilmProjectRecord(response.data);
      if (!project) {
          throw new Error('Film storyboard generation returned empty project data');
      }
      return normalizeFilmProject(project);
  },

  syncShots: async (
      projectId: string,
      options: FilmShotSyncOptions = {}
  ): Promise<FilmProject> => {
      const response = await getFilmServerClient().syncFilmShots(projectId, {
          regenerateShotNumbers: options.regenerateShotNumbers,
          fillSceneBindings: options.fillSceneBindings,
      });
      const project = normalizeFilmProjectRecord(response.data);
      if (!project) {
          throw new Error('Film shot sync returned empty project data');
      }
      return normalizeFilmProject(project);
  },

  bindAsset: async (
      projectId: string,
      payload: FilmAssetBindOptions
  ): Promise<FilmProject> => {
      const response = await getFilmServerClient().bindFilmAsset(projectId, payload);
      const project = normalizeFilmProjectRecord(response.data);
      if (!project) {
          throw new Error('Film asset bind returned empty project data');
      }
      return normalizeFilmProject(project);
  },

  relinkAssets: async (
      projectId: string,
      options: FilmAssetRelinkOptions
  ): Promise<FilmAssetRelinkResult> => {
      const response = await getFilmServerClient().relinkFilmAssets(projectId, options);
      const result = response.data as FilmAssetRelinkResult;
      return {
          ...result,
          project: normalizeFilmProject(result.project),
          validation: result.validation?.normalizedProject
              ? {
                  ...result.validation,
                  normalizedProject: normalizeFilmProject(result.validation.normalizedProject),
                }
              : result.validation,
      };
  },

  exportPackage: async (
      projectId: string,
      options: FilmExportPackageOptions = {}
  ): Promise<FilmExportPackageResult> => {
      const response = await getFilmServerClient().exportFilmPackage(projectId, options);
      return response.data as FilmExportPackageResult;
  },

  publishStoryboard: async (
      projectId: string,
      options: FilmStoryboardPublishOptions = {}
  ): Promise<FilmStoryboardPublishResult> => {
      const response = await getFilmServerClient().publishFilmStoryboard(projectId, options);
      return response.data as FilmStoryboardPublishResult;
  },

  importPackage: async (
      options: FilmImportPackageOptions
  ): Promise<FilmImportPackageResult> => {
      const response = await getFilmServerClient().importFilmPackage(options);
      const result = response.data as FilmImportPackageResult;
      const project = normalizeFilmProjectRecord(result.project);
      if (!project) {
          throw new Error('Film import package returned empty project data');
      }

      return {
          ...result,
          project: normalizeFilmProject(project),
      };
  },

  validateProject: async (
      options: FilmProjectValidationOptions
  ): Promise<FilmProjectValidationResult> => {
      const response = await getFilmServerClient().validateFilmProject(options);
      const result = response.data as FilmProjectValidationResult;
      if (result.normalizedProject) {
          return {
              ...result,
              normalizedProject: normalizeFilmProject(result.normalizedProject),
          };
      }
      return result;
  },

  runAuthoringBatch: async (
      projectId: string,
      options: FilmAuthoringBatchOptions
  ): Promise<FilmAuthoringBatchResult> => {
      const response = await getFilmServerClient().runFilmAuthoringBatch(projectId, options);
      const result = response.data as FilmAuthoringBatchResult;
      return {
          ...result,
          project: normalizeFilmProject(result.project),
          validation: result.validation?.normalizedProject
              ? {
                  ...result.validation,
                  normalizedProject: normalizeFilmProject(result.validation.normalizedProject),
                }
              : result.validation,
      };
  },

  refreshAnalysis: async (
      projectId: string,
      options: FilmRefreshAnalysisOptions = {}
  ): Promise<FilmRefreshAnalysisResult> => {
      const response = await getFilmServerClient().refreshFilmProjectAnalysis(projectId, options);
      const result = response.data as FilmRefreshAnalysisResult;
      return {
          ...result,
          project: normalizeFilmProject(result.project),
          validation: result.validation?.normalizedProject
              ? {
                  ...result.validation,
                  normalizedProject: normalizeFilmProject(result.validation.normalizedProject),
                }
              : result.validation,
      };
  },

  applyPreset: async (
      projectId: string,
      options: FilmPresetApplyOptions
  ): Promise<FilmProject> => {
      const response = await getFilmServerClient().applyFilmPreset(projectId, options);
      const project = normalizeFilmProjectRecord(response.data);
      if (!project) {
          throw new Error('Film preset apply returned empty project data');
      }
      return normalizeFilmProject(project);
  },

  generateImage: async (prompt: string, aspectRatio: string = '16:9'): Promise<GenerationOutcome> => {
    return imageService.generateImage({
        prompt,
        aspectRatio: normalizeImageAspectRatio(aspectRatio),
        model: DEFAULT_FILM_IMAGE_MODEL,
    });
  },
  
  generateVideo: async (prompt: string, imageUrl?: string): Promise<GenerationOutcome> => {
    const referenceImage = imageUrl
        ? createVideoInputResourceRef({
            type: 'image',
            url: imageUrl,
            name: 'Film Reference',
            mimeType: inferFilmImageMimeType(imageUrl),
            resource: {
                url: imageUrl,
                name: 'Film Reference',
                type: MediaResourceType.IMAGE,
                mimeType: inferFilmImageMimeType(imageUrl),
            },
        })
        : undefined;

    const request = buildUnifiedVideoGenerationRequest({
        mode: referenceImage ? 'smart_reference' : 'text',
        prompt,
        negativePrompt: '',
        model: DEFAULT_FILM_VIDEO_MODEL,
        styleId: 'none',
        aspectRatio: DEFAULT_FILM_VIDEO_ASPECT_RATIO,
        resolution: DEFAULT_FILM_VIDEO_RESOLUTION,
        duration: DEFAULT_FILM_VIDEO_DURATION,
        fps: DEFAULT_FILM_VIDEO_FPS,
        image: referenceImage,
    });

    return videoService.generateVideo(request);
  },
};
