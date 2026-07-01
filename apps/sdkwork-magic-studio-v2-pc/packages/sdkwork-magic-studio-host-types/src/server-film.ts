import type {
  FilmProject,
  FilmShootingPlanSummary,
  FilmShotVariantStrategy,
  FilmShotVariantSummary,
  FilmSceneBreakdownSummary,
  FilmSettings,
  FilmTemplate,
} from '@sdkwork/magic-studio-types/film';

export interface MagicStudioFilmProjectListQuery {
  page?: number;
  size?: number;
  keyword?: string;
  sort?: string[];
}

export type MagicStudioFilmTemplateListQuery = MagicStudioFilmProjectListQuery;
export interface MagicStudioFilmReviewQueueQuery
  extends MagicStudioFilmProjectListQuery {
  status?: MagicStudioFilmPublishReviewStatus[];
  reviewerId?: string;
  assignedOnly?: boolean;
  requiredOnly?: boolean;
  unresolvedOnly?: boolean;
}

export interface MagicStudioFilmProjectCreateRequest {
  project: FilmProject;
}

export interface MagicStudioFilmProjectUpdateRequest {
  project: FilmProject;
}

export interface MagicStudioFilmPreset {
  id: string;
  uuid: string;
  type: 'FILM_PRESET';
  name: string;
  description?: string;
  category?: string;
  builtIn: boolean;
  tags: string[];
  settings: FilmSettings;
  createdAt: number;
  updatedAt: number;
}

export interface MagicStudioFilmPresetWriteRequest {
  preset: MagicStudioFilmPreset;
}

export interface MagicStudioFilmPresetApplyRequest {
  presetId: string;
}

export interface MagicStudioFilmTemplateWriteRequest {
  template: FilmTemplate;
}

export interface MagicStudioFilmTemplateInstantiateRequest {
  name?: string;
}

export interface MagicStudioFilmTemplateSnapshotRequest {
  templateId?: string;
  name?: string;
  description?: string;
  category?: string;
  thumbnailUrl?: string;
  tags?: string[];
}

export interface MagicStudioFilmAnalysisRequest {
  content: string;
  language?: string;
}

export interface MagicStudioFilmStoryboardGenerateRequest {
  language?: string;
  replaceShots?: boolean;
  maxShotsPerScene?: number;
  includeEstablishingShot?: boolean;
}

export interface MagicStudioFilmShotSyncRequest {
  regenerateShotNumbers?: boolean;
  fillSceneBindings?: boolean;
}

export type MagicStudioFilmAssetBindEntityType =
  | 'project'
  | 'shot'
  | 'character'
  | 'location'
  | 'prop';

export type MagicStudioFilmAssetBindTargetField =
  | 'media'
  | 'assets'
  | 'refAssets'
  | 'generation.assets'
  | 'generation.video'
  | 'faceImage'
  | 'threeViewImage'
  | 'gridViewImage'
  | 'image';

export type MagicStudioFilmAssetBindMode = 'append' | 'replace' | 'set-primary';
export type MagicStudioFilmAssetRelinkStrategy = 'mapping' | 'locator-rewrite' | 'none';
export type MagicStudioFilmAssetRelinkAction = 'updated' | 'unchanged' | 'unresolved';

export type MagicStudioFilmAssetType =
  | 'image'
  | 'video'
  | 'audio'
  | 'music'
  | 'voice'
  | 'document'
  | 'other';

export interface MagicStudioFilmAssetBindResource {
  assetId?: string;
  assetUuid?: string;
  id?: string;
  uuid?: string;
  type?: MagicStudioFilmAssetType;
  url: string;
  fileId?: string;
  fileName?: string;
  scene?: string;
  metadata?: Record<string, unknown>;
}

export interface MagicStudioFilmAssetBindRequest {
  entityType: MagicStudioFilmAssetBindEntityType;
  entityId: string;
  targetField?: MagicStudioFilmAssetBindTargetField;
  mode?: MagicStudioFilmAssetBindMode;
  asset: MagicStudioFilmAssetBindResource;
}

export interface MagicStudioFilmAssetRelinkLocatorRewrite {
  matchPrefix: string;
  replacePrefix: string;
}

export interface MagicStudioFilmAssetRelinkMapping {
  assetId?: string;
  assetUuid?: string;
  currentLocator?: string;
  nextLocator: string;
  fileId?: string;
  fileName?: string;
  metadata?: Record<string, unknown>;
}

export interface MagicStudioFilmAssetRelinkRequest {
  dryRun?: boolean;
  includeValidation?: boolean;
  locatorRewrites?: MagicStudioFilmAssetRelinkLocatorRewrite[];
  mappings?: MagicStudioFilmAssetRelinkMapping[];
}

export interface MagicStudioFilmAssetRelinkChange {
  action: MagicStudioFilmAssetRelinkAction;
  strategy: MagicStudioFilmAssetRelinkStrategy;
  entityType: MagicStudioFilmAssetBindEntityType;
  entityId: string;
  targetField: MagicStudioFilmAssetBindTargetField;
  path: string;
  index?: number | null;
  assetId?: string | null;
  assetUuid?: string | null;
  previousLocator?: string | null;
  nextLocator?: string | null;
  reason: string;
}

export interface MagicStudioFilmAssetRelinkSummary {
  scannedCount: number;
  updatedCount: number;
  unchangedCount: number;
  unresolvedCount: number;
}

export interface MagicStudioFilmAssetInventoryItem {
  entityType: MagicStudioFilmAssetBindEntityType;
  entityId: string;
  targetField: MagicStudioFilmAssetBindTargetField;
  assetId?: string | null;
  assetUuid?: string | null;
  type?: MagicStudioFilmAssetType | null;
  url?: string | null;
  fileId?: string | null;
  fileName?: string | null;
  scene?: string | null;
}

export interface MagicStudioFilmAssetInventorySummary {
  totalCount: number;
  byEntityType: Record<string, number>;
  byAssetType: Record<string, number>;
  byTargetField: Record<string, number>;
}

export interface MagicStudioFilmAssetInventoryResult {
  projectId: string;
  projectUuid: string;
  projectName: string;
  summary: MagicStudioFilmAssetInventorySummary;
  items: MagicStudioFilmAssetInventoryItem[];
}

export interface MagicStudioFilmAssetRelinkResult {
  project: FilmProject;
  summary: MagicStudioFilmAssetRelinkSummary;
  changes: MagicStudioFilmAssetRelinkChange[];
  validation?: MagicStudioFilmProjectValidation;
}

export interface MagicStudioFilmStoryboardPublishRequest {
  fileName?: string;
  includeValidation?: boolean;
}

export interface MagicStudioFilmStoryboardPublishArtifact {
  relativePath: string;
  kind:
    | 'manifest-json'
    | 'project-snapshot-json'
    | 'review-state-json'
    | 'storyboard-json'
    | 'storyboard-html'
    | 'storyboard-markdown'
    | 'storyboard-archive';
  mimeType: string;
  sizeBytes?: number | null;
}

export type MagicStudioFilmPublishKind = 'storyboard-review';
export type MagicStudioFilmPublishListQuery = MagicStudioFilmProjectListQuery;
export type MagicStudioFilmPublishArtifactKind = MagicStudioFilmStoryboardPublishArtifact['kind'];

export interface MagicStudioFilmPublishSummary {
  sceneCount: number;
  shotCount: number;
  characterCount: number;
  locationCount: number;
  propCount: number;
  mediaCount: number;
}

export interface MagicStudioFilmPublishContents {
  projectSnapshotIncluded: boolean;
  reviewStateIncluded: boolean;
  storyboardHtmlIncluded: boolean;
  storyboardMarkdownIncluded: boolean;
  storyboardJsonIncluded: boolean;
  projectGraphIncluded: boolean;
}

export type MagicStudioFilmPublishReviewStatus =
  | 'pending'
  | 'approved'
  | 'changes-requested';

export type MagicStudioFilmPublishReviewActorType = 'user' | 'system';

export interface MagicStudioFilmPublishReviewActor {
  actorType: MagicStudioFilmPublishReviewActorType;
  actorId?: string | null;
  displayName?: string | null;
}

export interface MagicStudioFilmPublishReviewAnchor {
  artifactKind?: MagicStudioFilmPublishArtifactKind | null;
  path?: string | null;
  sceneUuid?: string | null;
  shotUuid?: string | null;
}

export interface MagicStudioFilmPublishReviewDecision {
  decisionId: string;
  action: 'approved' | 'changes-requested' | 'reopened';
  note?: string | null;
  actor: MagicStudioFilmPublishReviewActor;
  createdAt: number;
}

export type MagicStudioFilmPublishReviewSubmissionKind =
  | 'initial'
  | 'resubmission';

export interface MagicStudioFilmPublishReviewSubmission {
  submissionId: string;
  kind: MagicStudioFilmPublishReviewSubmissionKind;
  note?: string | null;
  actor: MagicStudioFilmPublishReviewActor;
  createdAt: number;
}

export interface MagicStudioFilmPublishReviewAssignment {
  assignmentId: string;
  reviewer: MagicStudioFilmPublishReviewActor;
  required: boolean;
  note?: string | null;
  assignedAt: number;
  updatedAt: number;
}

export type MagicStudioFilmPublishReviewConsensusAction =
  | 'approved'
  | 'changes-requested';

export interface MagicStudioFilmPublishReviewConsensus {
  consensusId: string;
  action: MagicStudioFilmPublishReviewConsensusAction;
  note?: string | null;
  actor: MagicStudioFilmPublishReviewActor;
  assignmentCount: number;
  requiredAssignmentCount: number;
  completedAssignmentCount: number;
  pendingAssignmentCount: number;
  createdAt: number;
}

export interface MagicStudioFilmPublishReviewComment {
  commentId: string;
  body: string;
  actor: MagicStudioFilmPublishReviewActor;
  anchor: MagicStudioFilmPublishReviewAnchor | null;
  parentCommentId: string | null;
  resolved: boolean;
  resolvedAt: number | null;
  resolvedBy: MagicStudioFilmPublishReviewActor | null;
  createdAt: number;
  updatedAt: number;
}

export interface MagicStudioFilmPublishReviewSummary {
  status: MagicStudioFilmPublishReviewStatus;
  commentCount: number;
  openCommentCount: number;
  resolvedCommentCount: number;
  assignmentCount: number;
  requiredAssignmentCount: number;
  completedAssignmentCount: number;
  pendingAssignmentCount: number;
  submissionCount: number;
  consensusCount: number;
  decisionCount: number;
  lastSubmissionAt?: number | null;
  lastCommentAt?: number | null;
  lastConsensusAt?: number | null;
  lastConsensusAction?: MagicStudioFilmPublishReviewConsensusAction | null;
  lastDecisionAt?: number | null;
  lastDecisionAction?: MagicStudioFilmPublishReviewDecision['action'] | null;
}

export interface MagicStudioFilmPublishReviewState {
  version: number;
  publishId: string;
  publishKind: MagicStudioFilmPublishKind;
  status: MagicStudioFilmPublishReviewStatus;
  createdAt: number;
  updatedAt: number;
  summary: MagicStudioFilmPublishReviewSummary;
  submissions: MagicStudioFilmPublishReviewSubmission[];
  assignments: MagicStudioFilmPublishReviewAssignment[];
  consensuses: MagicStudioFilmPublishReviewConsensus[];
  comments: MagicStudioFilmPublishReviewComment[];
  decisions: MagicStudioFilmPublishReviewDecision[];
}

export type MagicStudioFilmPublishReviewTimelineEventType =
  | 'submission'
  | 'assignment'
  | 'comment'
  | 'comment-resolved'
  | 'consensus'
  | 'decision';

export interface MagicStudioFilmPublishReviewTimelineEvent {
  eventId: string;
  eventType: MagicStudioFilmPublishReviewTimelineEventType;
  occurredAt: number;
  roundNumber: number;
  actor: MagicStudioFilmPublishReviewActor | null;
  statusAfter: MagicStudioFilmPublishReviewStatus;
  submission: MagicStudioFilmPublishReviewSubmission | null;
  assignment: MagicStudioFilmPublishReviewAssignment | null;
  comment: MagicStudioFilmPublishReviewComment | null;
  consensus: MagicStudioFilmPublishReviewConsensus | null;
  decision: MagicStudioFilmPublishReviewDecision | null;
}

export type MagicStudioFilmPublishReviewRoundStartReason =
  | 'published'
  | 'submission'
  | 'reopened';

export interface MagicStudioFilmPublishReviewRoundSummary {
  eventCount: number;
  submissionCount: number;
  assignmentCount: number;
  commentCount: number;
  resolvedCommentCount: number;
  consensusCount: number;
  decisionCount: number;
}

export interface MagicStudioFilmPublishReviewRound {
  roundId: string;
  roundNumber: number;
  startReason: MagicStudioFilmPublishReviewRoundStartReason;
  startEventId: string | null;
  startedAt: number;
  startedBy: MagicStudioFilmPublishReviewActor | null;
  latestActivityAt: number;
  closedAt: number | null;
  status: MagicStudioFilmPublishReviewStatus;
  submissionKind: MagicStudioFilmPublishReviewSubmissionKind | null;
  lastDecisionAt: number | null;
  lastDecisionAction: MagicStudioFilmPublishReviewDecision['action'] | null;
  summary: MagicStudioFilmPublishReviewRoundSummary;
  events: MagicStudioFilmPublishReviewTimelineEvent[];
}

export interface MagicStudioFilmPublishReviewAnchorThread {
  threadId: string;
  rootCommentId: string;
  commentCount: number;
  openCommentCount: number;
  resolvedCommentCount: number;
  latestActivityAt: number;
  latestOpenCommentAt?: number | null;
  roundNumbers: number[];
  comments: MagicStudioFilmPublishReviewComment[];
}

export interface MagicStudioFilmPublishReviewAnchorGroup {
  anchorId: string;
  anchor: MagicStudioFilmPublishReviewAnchor | null;
  threadCount: number;
  openThreadCount: number;
  commentCount: number;
  openCommentCount: number;
  resolvedCommentCount: number;
  latestActivityAt: number;
  latestOpenCommentAt?: number | null;
  roundNumbers: number[];
  threads: MagicStudioFilmPublishReviewAnchorThread[];
}

export type MagicStudioFilmPublishReviewWorklistItemStatus =
  | 'pending'
  | 'completed';

export interface MagicStudioFilmPublishReviewWorklistItem {
  reviewerKey: string;
  reviewer: MagicStudioFilmPublishReviewActor;
  assignment: MagicStudioFilmPublishReviewAssignment;
  currentRoundNumber?: number | null;
  status: MagicStudioFilmPublishReviewWorklistItemStatus;
  completed: boolean;
  required: boolean;
  needsAttention: boolean;
  authoredCommentCount: number;
  openAuthoredCommentCount: number;
  resolvedAuthoredCommentCount: number;
  lastDecisionAt?: number | null;
  lastDecisionAction?:
    | Extract<MagicStudioFilmPublishReviewDecision['action'], 'approved' | 'changes-requested'>
    | null;
  latestActivityAt: number;
}

export interface MagicStudioFilmPublishReviewWorklistSummary {
  reviewerCount: number;
  assignmentCount: number;
  requiredAssignmentCount: number;
  completedAssignmentCount: number;
  pendingAssignmentCount: number;
  openCommentCount: number;
  publishReadyForApproval: boolean;
  currentRoundNumber?: number | null;
}

export type MagicStudioFilmPublishReviewReadinessBlockerCode =
  | 'review-status-not-pending'
  | 'required-reviewers-pending'
  | 'open-review-comments';

export interface MagicStudioFilmPublishReviewReadinessBlocker {
  code: MagicStudioFilmPublishReviewReadinessBlockerCode;
  message: string;
  count: number;
}

export interface MagicStudioFilmPublishReviewReadinessSummary {
  status: MagicStudioFilmPublishReviewStatus;
  currentRoundNumber?: number | null;
  blockerCount: number;
  pendingRequiredAssignmentCount: number;
  openCommentCount: number;
  openThreadCount: number;
  openAnchorCount: number;
  publishReadyForApproval: boolean;
}

export interface MagicStudioFilmPublishReviewActivityActor {
  actorKey: string;
  actor: MagicStudioFilmPublishReviewActor;
  assignedReviewCount: number;
  requiredReviewCount: number;
  currentRoundParticipant: boolean;
  roundNumbers: number[];
  authoredEventCount: number;
  currentRoundAuthoredEventCount: number;
  submissionCount: number;
  authoredCommentCount: number;
  openAuthoredCommentCount: number;
  resolvedAuthoredCommentCount: number;
  commentResolutionCount: number;
  consensusCount: number;
  decisionCount: number;
  latestActivityAt: number;
  latestDecisionAt?: number | null;
  latestDecisionAction?: MagicStudioFilmPublishReviewDecision['action'] | null;
}

export interface MagicStudioFilmPublishReviewActivitySummary {
  actorCount: number;
  reviewerCount: number;
  currentRoundParticipantCount: number;
  authoredEventCount: number;
  currentRoundAuthoredEventCount: number;
  latestActivityAt: number;
  currentRoundNumber?: number | null;
}

export type MagicStudioFilmPublishReviewDecisionMatrixReviewerBlockerCode =
  | 'required-review-pending'
  | 'open-authored-comments';

export interface MagicStudioFilmPublishReviewDecisionMatrixCell {
  roundNumber: number;
  status: MagicStudioFilmPublishReviewStatus;
  participated: boolean;
  completed: boolean;
  authoredEventCount: number;
  authoredCommentCount: number;
  openAuthoredCommentCount: number;
  resolvedAuthoredCommentCount: number;
  decisionCount: number;
  qualifyingDecisionCount: number;
  latestActivityAt: number;
  lastDecisionAt?: number | null;
  lastDecisionAction?: MagicStudioFilmPublishReviewDecision['action'] | null;
  lastQualifyingDecisionAt?: number | null;
  lastQualifyingDecisionAction?:
    | Extract<MagicStudioFilmPublishReviewDecision['action'], 'approved' | 'changes-requested'>
    | null;
}

export interface MagicStudioFilmPublishReviewDecisionMatrixReviewer {
  reviewerKey: string;
  reviewer: MagicStudioFilmPublishReviewActor;
  assignment: MagicStudioFilmPublishReviewAssignment;
  required: boolean;
  status: MagicStudioFilmPublishReviewStatus;
  completed: boolean;
  currentRoundParticipant: boolean;
  roundNumbers: number[];
  authoredEventCount: number;
  currentRoundAuthoredEventCount: number;
  authoredCommentCount: number;
  openAuthoredCommentCount: number;
  resolvedAuthoredCommentCount: number;
  currentRoundAuthoredCommentCount: number;
  currentRoundOpenAuthoredCommentCount: number;
  currentRoundResolvedAuthoredCommentCount: number;
  currentRoundDecisionCount: number;
  currentRoundQualifyingDecisionCount: number;
  needsAttention: boolean;
  blockerCodes: MagicStudioFilmPublishReviewDecisionMatrixReviewerBlockerCode[];
  latestActivityAt: number;
  latestDecisionAt?: number | null;
  latestDecisionAction?: MagicStudioFilmPublishReviewDecision['action'] | null;
  latestDecisionRoundNumber?: number | null;
  latestQualifyingDecisionAt?: number | null;
  latestQualifyingDecisionAction?:
    | Extract<MagicStudioFilmPublishReviewDecision['action'], 'approved' | 'changes-requested'>
    | null;
  latestQualifyingDecisionRoundNumber?: number | null;
  cells: MagicStudioFilmPublishReviewDecisionMatrixCell[];
}

export interface MagicStudioFilmPublishReviewDecisionMatrixSummary {
  roundCount: number;
  reviewerCount: number;
  requiredReviewerCount: number;
  optionalReviewerCount: number;
  completedReviewerCount: number;
  pendingReviewerCount: number;
  completedRequiredReviewerCount: number;
  pendingRequiredReviewerCount: number;
  currentRoundParticipantCount: number;
  openCommentCount: number;
  publishReadyForApproval: boolean;
  currentRoundNumber?: number | null;
}

export type MagicStudioFilmPublishReviewCoverageStatus =
  | 'uncovered'
  | 'in-progress'
  | 'covered';

export interface MagicStudioFilmPublishReviewReviewerCoverageReviewer {
  reviewerKey: string;
  reviewer: MagicStudioFilmPublishReviewActor;
  assignment: MagicStudioFilmPublishReviewAssignment;
  required: boolean;
  coverageStatus: MagicStudioFilmPublishReviewCoverageStatus;
  currentRoundStatus: MagicStudioFilmPublishReviewStatus;
  completed: boolean;
  currentRoundParticipant: boolean;
  roundNumbers: number[];
  authoredEventCount: number;
  currentRoundAuthoredEventCount: number;
  authoredCommentCount: number;
  openAuthoredCommentCount: number;
  resolvedAuthoredCommentCount: number;
  openThreadExposureCount: number;
  openAnchorExposureCount: number;
  needsAttention: boolean;
  latestActivityAt: number;
  latestDecisionAt?: number | null;
  latestDecisionAction?: MagicStudioFilmPublishReviewDecision['action'] | null;
}

export interface MagicStudioFilmPublishReviewReviewerCoverageSummary {
  reviewerCount: number;
  requiredReviewerCount: number;
  optionalReviewerCount: number;
  coveredReviewerCount: number;
  inProgressReviewerCount: number;
  uncoveredReviewerCount: number;
  pendingRequiredReviewerCount: number;
  currentRoundParticipantCount: number;
  reviewersWithOpenThreadExposureCount: number;
  reviewersWithOpenAnchorExposureCount: number;
  openThreadCount: number;
  openAnchorCount: number;
  publishReadyForApproval: boolean;
  currentRoundNumber?: number | null;
}

export type MagicStudioFilmPublishReviewReviewerBacklogLevel =
  | 'overdue'
  | 'at-risk'
  | 'queued';

export type MagicStudioFilmPublishReviewReviewerBacklogReasonCode =
  | 'required-review-overdue'
  | 'required-review-at-risk'
  | 'current-round-participation-missing'
  | 'stalled-reviewer'
  | 'open-thread-exposure';

export interface MagicStudioFilmPublishReviewReviewerBacklogReason {
  code: MagicStudioFilmPublishReviewReviewerBacklogReasonCode;
  message: string;
  count: number;
}

export interface MagicStudioFilmPublishReviewReviewerBacklogPolicy {
  atRiskAfterMs: number;
  overdueAfterMs: number;
  idleAfterMs: number;
}

export interface MagicStudioFilmPublishReviewReviewerBacklogItem {
  reviewerKey: string;
  reviewer: MagicStudioFilmPublishReviewActor;
  assignment: MagicStudioFilmPublishReviewAssignment;
  required: boolean;
  backlogLevel: MagicStudioFilmPublishReviewReviewerBacklogLevel;
  reasons: MagicStudioFilmPublishReviewReviewerBacklogReason[];
  coverageStatus: MagicStudioFilmPublishReviewCoverageStatus;
  currentRoundStatus: MagicStudioFilmPublishReviewStatus;
  currentRoundParticipant: boolean;
  queueRank: number;
  pendingSinceAt: number;
  pendingAgeMs: number;
  idleAgeMs: number;
  openAuthoredCommentCount: number;
  openThreadExposureCount: number;
  openAnchorExposureCount: number;
  latestActivityAt: number;
  latestDecisionAt?: number | null;
  latestDecisionAction?: MagicStudioFilmPublishReviewDecision['action'] | null;
}

export interface MagicStudioFilmPublishReviewReviewerBacklogSummary {
  itemCount: number;
  overdueCount: number;
  atRiskCount: number;
  queuedCount: number;
  requiredPendingCount: number;
  optionalPendingCount: number;
  reviewersWithoutCurrentRoundParticipationCount: number;
  stalledReviewerCount: number;
  reviewersWithOpenThreadExposureCount: number;
  currentRoundNumber?: number | null;
  currentRoundStartedAt?: number | null;
  nowAt: number;
  policy: MagicStudioFilmPublishReviewReviewerBacklogPolicy;
}

export type MagicStudioFilmPublishReviewAttentionLevel =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low';

export type MagicStudioFilmPublishReviewReviewerAttentionReasonCode =
  | 'required-review-pending'
  | 'current-round-participation-missing'
  | 'open-authored-comments'
  | 'open-thread-exposure';

export interface MagicStudioFilmPublishReviewReviewerAttentionReason {
  code: MagicStudioFilmPublishReviewReviewerAttentionReasonCode;
  message: string;
  count: number;
}

export interface MagicStudioFilmPublishReviewReviewerAttentionItem {
  reviewerKey: string;
  reviewer: MagicStudioFilmPublishReviewActor;
  assignment: MagicStudioFilmPublishReviewAssignment;
  required: boolean;
  attentionLevel: MagicStudioFilmPublishReviewAttentionLevel;
  reasons: MagicStudioFilmPublishReviewReviewerAttentionReason[];
  coverageStatus: MagicStudioFilmPublishReviewCoverageStatus;
  currentRoundStatus: MagicStudioFilmPublishReviewStatus;
  completed: boolean;
  currentRoundParticipant: boolean;
  openAuthoredCommentCount: number;
  openThreadExposureCount: number;
  openAnchorExposureCount: number;
  latestActivityAt: number;
  latestDecisionAt?: number | null;
  latestDecisionAction?: MagicStudioFilmPublishReviewDecision['action'] | null;
}

export interface MagicStudioFilmPublishReviewReviewerAttentionSummary {
  itemCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  requiredPendingCount: number;
  currentRoundParticipationMissingCount: number;
  reviewersWithOpenAuthoredCommentsCount: number;
  reviewersWithOpenThreadExposureCount: number;
  publishReadyForApproval: boolean;
  currentRoundNumber?: number | null;
}

export type MagicStudioFilmPublishReviewDecisionStalenessLevel =
  | 'critical'
  | 'high'
  | 'medium';

export type MagicStudioFilmPublishReviewStaleDecisionReasonCode =
  | 'qualifying-decision-precedes-current-round'
  | 'reopened-after-qualifying-decision'
  | 'new-open-thread-after-decision'
  | 'new-open-comment-after-decision'
  | 'current-round-participation-missing';

export interface MagicStudioFilmPublishReviewStaleDecisionReason {
  code: MagicStudioFilmPublishReviewStaleDecisionReasonCode;
  message: string;
  count: number;
}

export interface MagicStudioFilmPublishReviewStaleDecisionItem {
  reviewerKey: string;
  reviewer: MagicStudioFilmPublishReviewActor;
  assignment: MagicStudioFilmPublishReviewAssignment;
  required: boolean;
  stalenessLevel: MagicStudioFilmPublishReviewDecisionStalenessLevel;
  reasons: MagicStudioFilmPublishReviewStaleDecisionReason[];
  currentRoundParticipant: boolean;
  latestQualifyingDecisionAt: number;
  latestQualifyingDecisionAction:
    | Extract<MagicStudioFilmPublishReviewDecision['action'], 'approved' | 'changes-requested'>
    | null;
  latestQualifyingDecisionRoundNumber?: number | null;
  latestDecisionAt?: number | null;
  latestDecisionAction?: MagicStudioFilmPublishReviewDecision['action'] | null;
  staleSinceAt: number;
  staleAgeMs: number;
  newerOpenThreadCount: number;
  newerOpenCommentCount: number;
  latestNewerOpenCommentAt?: number | null;
  openThreadExposureCount: number;
  openAnchorExposureCount: number;
  latestActivityAt: number;
}

export interface MagicStudioFilmPublishReviewStaleDecisionSummary {
  itemCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  previousRoundDecisionCount: number;
  reopenedAfterDecisionCount: number;
  reviewersWithNewOpenThreadCount: number;
  reviewersWithNewOpenCommentCount: number;
  reviewersWithoutCurrentRoundParticipationCount: number;
  currentRoundNumber?: number | null;
  currentRoundStartedAt?: number | null;
  currentRoundStartReason?: MagicStudioFilmPublishReviewRoundStartReason | null;
  nowAt: number;
}

export type MagicStudioFilmPublishReviewAnchorCoverageStatus =
  | 'unowned'
  | 'partial'
  | 'covered';

export type MagicStudioFilmPublishReviewAnchorEscalationLevel =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low';

export interface MagicStudioFilmPublishReviewAnchorResponsibilityReviewer {
  reviewerKey: string;
  reviewer: MagicStudioFilmPublishReviewActor;
  required: boolean;
  engaged: boolean;
  completed: boolean;
  currentRoundParticipant: boolean;
  openCommentCount: number;
  latestCommentAt?: number | null;
}

export interface MagicStudioFilmPublishReviewAnchorResponsibilityItem {
  anchorId: string;
  anchor: MagicStudioFilmPublishReviewAnchor | null;
  threadCount: number;
  openThreadCount: number;
  commentCount: number;
  openCommentCount: number;
  latestActivityAt: number;
  latestOpenCommentAt?: number | null;
  roundNumbers: number[];
  coverageStatus: MagicStudioFilmPublishReviewAnchorCoverageStatus;
  escalationLevel: MagicStudioFilmPublishReviewAnchorEscalationLevel;
  assignedReviewerCount: number;
  requiredReviewerCount: number;
  engagedReviewerCount: number;
  engagedRequiredReviewerCount: number;
  completedReviewerCount: number;
  completedRequiredReviewerCount: number;
  pendingRequiredReviewerCount: number;
  reviewers: MagicStudioFilmPublishReviewAnchorResponsibilityReviewer[];
}

export interface MagicStudioFilmPublishReviewAnchorResponsibilitySummary {
  activeAnchorCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  unownedAnchorCount: number;
  partialAnchorCount: number;
  coveredAnchorCount: number;
  openThreadCount: number;
  openCommentCount: number;
  currentRoundNumber?: number | null;
}

export interface MagicStudioFilmPublishRecord {
  publishId: string;
  publishKind: MagicStudioFilmPublishKind;
  publishedAtMs: number;
  createdAt: number;
  updatedAt: number;
  name: string;
  description?: string;
  projectId: string;
  projectUuid: string;
  projectName: string;
  projectStatus: string;
  fileName: string;
  mimeType: string;
  relativePublishRootPath: string;
  relativeArchivePath: string;
  summary: MagicStudioFilmPublishSummary;
  contents: MagicStudioFilmPublishContents;
  review: MagicStudioFilmPublishReviewSummary;
  artifacts: MagicStudioFilmStoryboardPublishArtifact[];
  manifest: Record<string, unknown>;
}

export interface MagicStudioFilmPublishArtifactContent {
  publishId: string;
  artifactKind: MagicStudioFilmPublishArtifactKind;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  bytesBase64: string;
  textContent?: string | null;
}

export interface MagicStudioFilmPublishReviewTimelineResult {
  publish: MagicStudioFilmPublishRecord;
  reviewState: MagicStudioFilmPublishReviewState;
  events: MagicStudioFilmPublishReviewTimelineEvent[];
}

export interface MagicStudioFilmPublishReviewRoundsResult {
  publish: MagicStudioFilmPublishRecord;
  reviewState: MagicStudioFilmPublishReviewState;
  rounds: MagicStudioFilmPublishReviewRound[];
}

export interface MagicStudioFilmPublishReviewAnchorsResult {
  publish: MagicStudioFilmPublishRecord;
  reviewState: MagicStudioFilmPublishReviewState;
  anchors: MagicStudioFilmPublishReviewAnchorGroup[];
}

export interface MagicStudioFilmPublishReviewWorklistResult {
  publish: MagicStudioFilmPublishRecord;
  reviewState: MagicStudioFilmPublishReviewState;
  currentRound: MagicStudioFilmPublishReviewRound | null;
  summary: MagicStudioFilmPublishReviewWorklistSummary;
  items: MagicStudioFilmPublishReviewWorklistItem[];
}

export interface MagicStudioFilmPublishReviewReadinessResult {
  publish: MagicStudioFilmPublishRecord;
  reviewState: MagicStudioFilmPublishReviewState;
  currentRound: MagicStudioFilmPublishReviewRound | null;
  summary: MagicStudioFilmPublishReviewReadinessSummary;
  blockers: MagicStudioFilmPublishReviewReadinessBlocker[];
  pendingReviewers: MagicStudioFilmPublishReviewWorklistItem[];
  activeAnchors: MagicStudioFilmPublishReviewAnchorGroup[];
}

export interface MagicStudioFilmPublishReviewActivityResult {
  publish: MagicStudioFilmPublishRecord;
  reviewState: MagicStudioFilmPublishReviewState;
  currentRound: MagicStudioFilmPublishReviewRound | null;
  summary: MagicStudioFilmPublishReviewActivitySummary;
  actors: MagicStudioFilmPublishReviewActivityActor[];
}

export interface MagicStudioFilmPublishReviewDecisionMatrixResult {
  publish: MagicStudioFilmPublishRecord;
  reviewState: MagicStudioFilmPublishReviewState;
  currentRound: MagicStudioFilmPublishReviewRound | null;
  rounds: MagicStudioFilmPublishReviewRound[];
  summary: MagicStudioFilmPublishReviewDecisionMatrixSummary;
  reviewers: MagicStudioFilmPublishReviewDecisionMatrixReviewer[];
}

export interface MagicStudioFilmPublishReviewReviewerCoverageResult {
  publish: MagicStudioFilmPublishRecord;
  reviewState: MagicStudioFilmPublishReviewState;
  currentRound: MagicStudioFilmPublishReviewRound | null;
  summary: MagicStudioFilmPublishReviewReviewerCoverageSummary;
  reviewers: MagicStudioFilmPublishReviewReviewerCoverageReviewer[];
}

export interface MagicStudioFilmPublishReviewReviewerBacklogResult {
  publish: MagicStudioFilmPublishRecord;
  reviewState: MagicStudioFilmPublishReviewState;
  currentRound: MagicStudioFilmPublishReviewRound | null;
  summary: MagicStudioFilmPublishReviewReviewerBacklogSummary;
  items: MagicStudioFilmPublishReviewReviewerBacklogItem[];
}

export interface MagicStudioFilmPublishReviewReviewerAttentionResult {
  publish: MagicStudioFilmPublishRecord;
  reviewState: MagicStudioFilmPublishReviewState;
  currentRound: MagicStudioFilmPublishReviewRound | null;
  summary: MagicStudioFilmPublishReviewReviewerAttentionSummary;
  items: MagicStudioFilmPublishReviewReviewerAttentionItem[];
}

export interface MagicStudioFilmPublishReviewStaleDecisionResult {
  publish: MagicStudioFilmPublishRecord;
  reviewState: MagicStudioFilmPublishReviewState;
  currentRound: MagicStudioFilmPublishReviewRound | null;
  summary: MagicStudioFilmPublishReviewStaleDecisionSummary;
  items: MagicStudioFilmPublishReviewStaleDecisionItem[];
}

export interface MagicStudioFilmPublishReviewAnchorResponsibilityResult {
  publish: MagicStudioFilmPublishRecord;
  reviewState: MagicStudioFilmPublishReviewState;
  currentRound: MagicStudioFilmPublishReviewRound | null;
  summary: MagicStudioFilmPublishReviewAnchorResponsibilitySummary;
  anchors: MagicStudioFilmPublishReviewAnchorResponsibilityItem[];
}

export type MagicStudioFilmPublishReviewOperationsDashboardSignalKind =
  | 'readiness-blocker'
  | 'reviewer-backlog'
  | 'reviewer-attention'
  | 'stale-decision'
  | 'anchor-escalation';

export type MagicStudioFilmPublishReviewOperationsDashboardSignalSeverity =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low';

export interface MagicStudioFilmPublishReviewOperationsDashboardSignal {
  signalId: string;
  signalKind: MagicStudioFilmPublishReviewOperationsDashboardSignalKind;
  severity: MagicStudioFilmPublishReviewOperationsDashboardSignalSeverity;
  title: string;
  message: string;
  count: number;
  reviewerKey?: string | null;
  anchorId?: string | null;
  blockerCode?: MagicStudioFilmPublishReviewReadinessBlockerCode | string | null;
  reasonCodes: string[];
  latestAt?: number | null;
}

export interface MagicStudioFilmPublishReviewOperationsDashboardSummary {
  status: MagicStudioFilmPublishReviewStatus;
  currentRoundNumber?: number | null;
  currentRoundStartedAt?: number | null;
  currentRoundElapsedMs?: number | null;
  publishReadyForApproval: boolean;
  blockerCount: number;
  signalCount: number;
  criticalSignalCount: number;
  highSignalCount: number;
  mediumSignalCount: number;
  lowSignalCount: number;
  pendingRequiredAssignmentCount: number;
  overdueReviewerCount: number;
  atRiskReviewerCount: number;
  criticalAttentionCount: number;
  staleDecisionCount: number;
  criticalStaleDecisionCount: number;
  activeAnchorCount: number;
  criticalAnchorCount: number;
  openThreadCount: number;
  openCommentCount: number;
  nowAt: number;
}

export interface MagicStudioFilmPublishReviewOperationsDashboardDecisionMatrix {
  summary: MagicStudioFilmPublishReviewDecisionMatrixSummary;
}

export interface MagicStudioFilmPublishReviewOperationsDashboardReviewerCoverage {
  summary: MagicStudioFilmPublishReviewReviewerCoverageSummary;
}

export interface MagicStudioFilmPublishReviewOperationsDashboardWorklist {
  summary: MagicStudioFilmPublishReviewWorklistSummary;
}

export interface MagicStudioFilmPublishReviewOperationsDashboardReadiness {
  summary: MagicStudioFilmPublishReviewReadinessSummary;
  blockers: MagicStudioFilmPublishReviewReadinessBlocker[];
  pendingReviewers: MagicStudioFilmPublishReviewWorklistItem[];
  activeAnchors: MagicStudioFilmPublishReviewAnchorGroup[];
}

export interface MagicStudioFilmPublishReviewOperationsDashboardBacklog {
  summary: MagicStudioFilmPublishReviewReviewerBacklogSummary;
  items: MagicStudioFilmPublishReviewReviewerBacklogItem[];
}

export interface MagicStudioFilmPublishReviewOperationsDashboardReviewerAttention {
  summary: MagicStudioFilmPublishReviewReviewerAttentionSummary;
  items: MagicStudioFilmPublishReviewReviewerAttentionItem[];
}

export interface MagicStudioFilmPublishReviewOperationsDashboardStaleDecisions {
  summary: MagicStudioFilmPublishReviewStaleDecisionSummary;
  items: MagicStudioFilmPublishReviewStaleDecisionItem[];
}

export interface MagicStudioFilmPublishReviewOperationsDashboardAnchors {
  summary: MagicStudioFilmPublishReviewAnchorResponsibilitySummary;
  anchors: MagicStudioFilmPublishReviewAnchorResponsibilityItem[];
}

export interface MagicStudioFilmPublishReviewOperationsDashboardResult {
  publish: MagicStudioFilmPublishRecord;
  reviewState: MagicStudioFilmPublishReviewState;
  currentRound: MagicStudioFilmPublishReviewRound | null;
  summary: MagicStudioFilmPublishReviewOperationsDashboardSummary;
  decisionMatrix: MagicStudioFilmPublishReviewOperationsDashboardDecisionMatrix;
  reviewerCoverage: MagicStudioFilmPublishReviewOperationsDashboardReviewerCoverage;
  worklist: MagicStudioFilmPublishReviewOperationsDashboardWorklist;
  readiness: MagicStudioFilmPublishReviewOperationsDashboardReadiness;
  backlog: MagicStudioFilmPublishReviewOperationsDashboardBacklog;
  reviewerAttention: MagicStudioFilmPublishReviewOperationsDashboardReviewerAttention;
  staleDecisions: MagicStudioFilmPublishReviewOperationsDashboardStaleDecisions;
  anchors: MagicStudioFilmPublishReviewOperationsDashboardAnchors;
  signals: MagicStudioFilmPublishReviewOperationsDashboardSignal[];
}

export type MagicStudioFilmPublishReviewLatencyAnalyticsAgeBucketKey =
  | 'under-6h'
  | '6-12h'
  | '12-24h'
  | '24h-plus';

export interface MagicStudioFilmPublishReviewLatencyAnalyticsAgeBucket {
  bucketKey: MagicStudioFilmPublishReviewLatencyAnalyticsAgeBucketKey;
  label: string;
  minAgeMs: number;
  maxAgeMs?: number | null;
  count: number;
}

export interface MagicStudioFilmPublishReviewLatencyAnalyticsReviewer {
  reviewerKey: string;
  reviewer: MagicStudioFilmPublishReviewActor;
  assignment: MagicStudioFilmPublishReviewAssignment;
  required: boolean;
  completed: boolean;
  currentRoundParticipant: boolean;
  queueRank?: number | null;
  currentRoundPendingAgeMs?: number | null;
  currentRoundTimeToFirstParticipationMs?: number | null;
  currentRoundTimeToLatestDecisionMs?: number | null;
  currentRoundTimeToLatestQualifyingDecisionMs?: number | null;
  latestDecisionAt?: number | null;
  latestDecisionAction?: MagicStudioFilmPublishReviewDecision['action'] | null;
  latestQualifyingDecisionAt?: number | null;
  latestQualifyingDecisionAction?:
    | Extract<MagicStudioFilmPublishReviewDecision['action'], 'approved' | 'changes-requested'>
    | null;
  latestActivityAt: number;
  openAuthoredCommentCount: number;
  openThreadExposureCount: number;
  openAnchorExposureCount: number;
}

export interface MagicStudioFilmPublishReviewLatencyAnalyticsRound {
  roundId: string;
  roundNumber: number;
  status: MagicStudioFilmPublishReviewStatus;
  startedAt: number;
  closedAt?: number | null;
  current: boolean;
  elapsedMs: number;
  durationMs?: number | null;
  submissionCount: number;
  assignmentCount: number;
  commentCount: number;
  resolvedCommentCount: number;
  consensusCount: number;
  decisionCount: number;
  qualifyingDecisionCount: number;
  participantCount: number;
  qualifyingReviewerCount: number;
}

export interface MagicStudioFilmPublishReviewLatencyAnalyticsOpenThread {
  anchorId: string;
  anchor: MagicStudioFilmPublishReviewAnchor | null;
  threadId: string;
  rootCommentId: string;
  roundNumbers: number[];
  openCommentCount: number;
  firstOpenCommentAt: number;
  latestOpenCommentAt?: number | null;
  oldestOpenCommentAgeMs: number;
  latestOpenCommentAgeMs: number;
  openThreadAgeMs: number;
}

export interface MagicStudioFilmPublishReviewLatencyAnalyticsSummary {
  status: MagicStudioFilmPublishReviewStatus;
  currentRoundNumber?: number | null;
  currentRoundStartedAt?: number | null;
  currentRoundElapsedMs?: number | null;
  nowAt: number;
  roundCount: number;
  reviewerCount: number;
  requiredReviewerCount: number;
  pendingRequiredReviewerCount: number;
  participatingReviewerCount: number;
  completedReviewerCount: number;
  openThreadCount: number;
  openCommentCount: number;
  longestPendingRequiredReviewAgeMs: number;
  longestOpenThreadAgeMs: number;
  longestOpenCommentAgeMs: number;
  averageTimeToFirstParticipationMs?: number | null;
  averageTimeToQualifyingDecisionMs?: number | null;
}

export interface MagicStudioFilmPublishReviewLatencyAnalyticsResult {
  publish: MagicStudioFilmPublishRecord;
  reviewState: MagicStudioFilmPublishReviewState;
  currentRound: MagicStudioFilmPublishReviewRound | null;
  summary: MagicStudioFilmPublishReviewLatencyAnalyticsSummary;
  reviewers: MagicStudioFilmPublishReviewLatencyAnalyticsReviewer[];
  rounds: MagicStudioFilmPublishReviewLatencyAnalyticsRound[];
  openThreads: MagicStudioFilmPublishReviewLatencyAnalyticsOpenThread[];
  threadAgeBuckets: MagicStudioFilmPublishReviewLatencyAnalyticsAgeBucket[];
  commentAgeBuckets: MagicStudioFilmPublishReviewLatencyAnalyticsAgeBucket[];
}

export interface MagicStudioFilmPublishRestoreRequest {
  includeValidation?: boolean;
}

export interface MagicStudioFilmPublishRestoreSummary {
  publishId: string;
  publishKind: MagicStudioFilmPublishKind;
  restoredArtifactKind: MagicStudioFilmPublishArtifactKind;
  counts: MagicStudioFilmProjectCounts;
}

export interface MagicStudioFilmPublishRestoreResult {
  project: FilmProject;
  summary: MagicStudioFilmPublishRestoreSummary;
  validation?: MagicStudioFilmProjectValidation;
}

export interface MagicStudioFilmPublishApproveRequest {
  note?: string;
  actor?: Partial<MagicStudioFilmPublishReviewActor>;
}

export interface MagicStudioFilmPublishRequestChangesRequest {
  reason: string;
  actor?: Partial<MagicStudioFilmPublishReviewActor>;
}

export interface MagicStudioFilmPublishReviewCommentRequest {
  body: string;
  actor?: Partial<MagicStudioFilmPublishReviewActor>;
  anchor?: MagicStudioFilmPublishReviewAnchor;
  parentCommentId?: string;
}

export interface MagicStudioFilmPublishReviewCommentResolveRequest {
  actor?: Partial<MagicStudioFilmPublishReviewActor>;
}

export interface MagicStudioFilmPublishReviewAssignmentWrite {
  reviewer: MagicStudioFilmPublishReviewActor;
  required?: boolean;
  note?: string;
}

export interface MagicStudioFilmPublishReviewAssignmentsRequest {
  assignments: MagicStudioFilmPublishReviewAssignmentWrite[];
}

export interface MagicStudioFilmPublishReviewSubmitRequest {
  note?: string;
  actor?: Partial<MagicStudioFilmPublishReviewActor>;
}

export interface MagicStudioFilmPublishReviewConsensusRequest {
  action: MagicStudioFilmPublishReviewConsensusAction;
  note?: string;
  actor?: Partial<MagicStudioFilmPublishReviewActor>;
}

export interface MagicStudioFilmPublishReopenRequest {
  note?: string;
  actor?: Partial<MagicStudioFilmPublishReviewActor>;
}

export interface MagicStudioFilmPublishApproveResult {
  publish: MagicStudioFilmPublishRecord;
  reviewState: MagicStudioFilmPublishReviewState;
  decision: MagicStudioFilmPublishReviewDecision;
}

export interface MagicStudioFilmPublishRequestChangesResult {
  publish: MagicStudioFilmPublishRecord;
  reviewState: MagicStudioFilmPublishReviewState;
  decision: MagicStudioFilmPublishReviewDecision;
}

export interface MagicStudioFilmPublishReviewCommentResult {
  publish: MagicStudioFilmPublishRecord;
  reviewState: MagicStudioFilmPublishReviewState;
  comment: MagicStudioFilmPublishReviewComment;
}

export interface MagicStudioFilmPublishReviewCommentResolveResult {
  publish: MagicStudioFilmPublishRecord;
  reviewState: MagicStudioFilmPublishReviewState;
  comment: MagicStudioFilmPublishReviewComment;
}

export interface MagicStudioFilmPublishReviewAssignmentsResult {
  publish: MagicStudioFilmPublishRecord;
  reviewState: MagicStudioFilmPublishReviewState;
  assignments: MagicStudioFilmPublishReviewAssignment[];
}

export interface MagicStudioFilmPublishReviewSubmitResult {
  publish: MagicStudioFilmPublishRecord;
  reviewState: MagicStudioFilmPublishReviewState;
  submission: MagicStudioFilmPublishReviewSubmission;
}

export interface MagicStudioFilmPublishReviewConsensusResult {
  publish: MagicStudioFilmPublishRecord;
  reviewState: MagicStudioFilmPublishReviewState;
  consensus: MagicStudioFilmPublishReviewConsensus;
  decision: MagicStudioFilmPublishReviewDecision;
}

export interface MagicStudioFilmPublishReopenResult {
  publish: MagicStudioFilmPublishRecord;
  reviewState: MagicStudioFilmPublishReviewState;
  decision: MagicStudioFilmPublishReviewDecision;
}

export interface MagicStudioFilmProjectReviewQueueItem {
  publish: MagicStudioFilmPublishRecord;
  assignments: MagicStudioFilmPublishReviewAssignment[];
  requiresAttention: boolean;
  latestActivityAt: number;
}

export interface MagicStudioFilmProjectReviewProjectRef {
  projectId: string;
  projectUuid: string;
  projectName: string;
  projectStatus: string | null;
  updatedAt: number;
}

export interface MagicStudioFilmProjectReviewPortfolioSummary {
  publishCount: number;
  pendingPublishCount: number;
  approvedPublishCount: number;
  changesRequestedPublishCount: number;
  readyForApprovalCount: number;
  requiresAttentionCount: number;
  blockerCount: number;
  criticalSignalCount: number;
  highSignalCount: number;
  overdueReviewerCount: number;
  atRiskReviewerCount: number;
  staleDecisionCount: number;
  openThreadCount: number;
  openCommentCount: number;
  nowAt: number;
}

export interface MagicStudioFilmProjectReviewPortfolioPublish {
  publish: MagicStudioFilmPublishRecord;
  reviewState: MagicStudioFilmPublishReviewState;
  currentRound: MagicStudioFilmPublishReviewRound | null;
  operationsSummary: MagicStudioFilmPublishReviewOperationsDashboardSummary;
  latencySummary: MagicStudioFilmPublishReviewLatencyAnalyticsSummary;
  requiresAttention: boolean;
  priorityScore: number;
  latestActivityAt: number;
  topSignals: MagicStudioFilmPublishReviewOperationsDashboardSignal[];
}

export interface MagicStudioFilmProjectReviewPortfolioDashboardResult {
  project: MagicStudioFilmProjectReviewProjectRef;
  summary: MagicStudioFilmProjectReviewPortfolioSummary;
  publishes: MagicStudioFilmProjectReviewPortfolioPublish[];
}

export type MagicStudioFilmProjectReviewReviewerCapacityLevel =
  | 'overloaded'
  | 'at-risk'
  | 'balanced';

export interface MagicStudioFilmProjectReviewReviewerCapacityPublish {
  publish: MagicStudioFilmPublishRecord;
  reviewState: MagicStudioFilmPublishReviewState;
  currentRound: MagicStudioFilmPublishReviewRound | null;
  required: boolean;
  completed: boolean;
  queueRank: number | null;
  currentRoundPendingAgeMs: number | null;
  currentRoundTimeToLatestQualifyingDecisionMs: number | null;
  latestActivityAt: number;
  openThreadExposureCount: number;
  openAnchorExposureCount: number;
  openAuthoredCommentCount: number;
}

export interface MagicStudioFilmProjectReviewReviewerCapacityReviewer {
  reviewerKey: string;
  reviewer: MagicStudioFilmPublishReviewActor;
  capacityLevel: MagicStudioFilmProjectReviewReviewerCapacityLevel;
  publishCount: number;
  requiredPublishCount: number;
  pendingRequiredPublishCount: number;
  overduePublishCount: number;
  atRiskPublishCount: number;
  openThreadExposureCount: number;
  openAnchorExposureCount: number;
  openAuthoredCommentCount: number;
  longestPendingAgeMs: number;
  averageTimeToQualifyingDecisionMs: number | null;
  latestActivityAt: number;
  publishes: MagicStudioFilmProjectReviewReviewerCapacityPublish[];
}

export interface MagicStudioFilmProjectReviewReviewerCapacitySummary {
  reviewerCount: number;
  balancedReviewerCount: number;
  atRiskReviewerCount: number;
  overloadedReviewerCount: number;
  publishCount: number;
  pendingRequiredReviewCount: number;
  overdueReviewCount: number;
  atRiskReviewCount: number;
  openThreadExposureCount: number;
  openAnchorExposureCount: number;
  openAuthoredCommentCount: number;
  nowAt: number;
}

export interface MagicStudioFilmProjectReviewReviewerCapacityResult {
  project: MagicStudioFilmProjectReviewProjectRef;
  summary: MagicStudioFilmProjectReviewReviewerCapacitySummary;
  reviewers: MagicStudioFilmProjectReviewReviewerCapacityReviewer[];
}

export type MagicStudioFilmProjectReviewDecisionFreshnessLevel =
  | 'fresh'
  | 'aging'
  | 'stale'
  | 'no-qualifying-decision';

export type MagicStudioFilmProjectReviewDecisionFreshnessReasonCode =
  | 'no-qualifying-decision'
  | 'qualifying-decision-age-at-risk'
  | 'qualifying-decision-age-overdue'
  | 'reopened-after-qualifying-decision'
  | 'new-open-thread-after-decision'
  | 'new-open-comment-after-decision'
  | 'critical-stale-reviewer'
  | 'high-stale-reviewer'
  | 'medium-stale-reviewer';

export interface MagicStudioFilmProjectReviewDecisionFreshnessReason {
  code: MagicStudioFilmProjectReviewDecisionFreshnessReasonCode;
  message: string;
  count: number;
}

export type MagicStudioFilmProjectReviewDecisionFreshnessAgeBucketKey =
  | 'under-6h'
  | '6-12h'
  | '12-24h'
  | '24h-plus'
  | 'no-qualifying-decision';

export interface MagicStudioFilmProjectReviewDecisionFreshnessAgeBucket {
  key: MagicStudioFilmProjectReviewDecisionFreshnessAgeBucketKey;
  label: string;
  publishCount: number;
}

export interface MagicStudioFilmProjectReviewDecisionFreshnessRoundTrend {
  roundNumber: number;
  publishCount: number;
  currentRoundCount: number;
  reopenedRoundCount: number;
  decisionCount: number;
  qualifyingDecisionCount: number;
  participantCount: number;
  qualifyingReviewerCount: number;
  averageElapsedMs: number | null;
}

export interface MagicStudioFilmProjectReviewDecisionFreshnessReviewer {
  reviewerKey: string;
  reviewer: MagicStudioFilmPublishReviewActor;
  required: boolean;
  currentRoundParticipant: boolean;
  stalenessLevel: MagicStudioFilmPublishReviewDecisionStalenessLevel;
  reasons: MagicStudioFilmPublishReviewStaleDecisionReason[];
  latestQualifyingDecisionAt: number | null;
  latestQualifyingDecisionAction:
    | Extract<MagicStudioFilmPublishReviewDecision['action'], 'approved' | 'changes-requested'>
    | null;
  latestDecisionAt: number | null;
  latestDecisionAction: MagicStudioFilmPublishReviewDecision['action'] | null;
  staleSinceAt: number | null;
  staleAgeMs: number | null;
  newerOpenThreadCount: number;
  newerOpenCommentCount: number;
  latestActivityAt: number | null;
}

export interface MagicStudioFilmProjectReviewDecisionFreshnessPublish {
  publish: MagicStudioFilmPublishRecord;
  reviewState: MagicStudioFilmPublishReviewState;
  currentRound: MagicStudioFilmPublishReviewRound | null;
  freshnessLevel: MagicStudioFilmProjectReviewDecisionFreshnessLevel;
  freshnessReasons: MagicStudioFilmProjectReviewDecisionFreshnessReason[];
  latestQualifyingDecisionAt: number | null;
  latestQualifyingDecisionAction:
    | Extract<MagicStudioFilmPublishReviewDecision['action'], 'approved' | 'changes-requested'>
    | null;
  latestDecisionAt: number | null;
  latestDecisionAction: MagicStudioFilmPublishReviewDecision['action'] | null;
  latestQualifyingDecisionAgeMs: number | null;
  currentRoundNumber: number | null;
  currentRoundStartedAt: number | null;
  currentRoundStartReason: MagicStudioFilmPublishReviewRoundStartReason | null;
  currentRoundDecisionCount: number;
  currentRoundQualifyingDecisionCount: number;
  currentRoundParticipantCount: number;
  openThreadCount: number;
  openCommentCount: number;
  reopenedAfterQualifyingDecisionCount: number;
  reviewersWithOpenThreadRegressionCount: number;
  reviewersWithOpenCommentRegressionCount: number;
  staleReviewerCount: number;
  criticalStaleReviewerCount: number;
  highStaleReviewerCount: number;
  mediumStaleReviewerCount: number;
  latestActivityAt: number;
  topStaleReviewers: MagicStudioFilmProjectReviewDecisionFreshnessReviewer[];
}

export interface MagicStudioFilmProjectReviewDecisionFreshnessSummary {
  publishCount: number;
  freshPublishCount: number;
  agingPublishCount: number;
  stalePublishCount: number;
  noQualifyingDecisionPublishCount: number;
  reopenedAfterQualifyingDecisionPublishCount: number;
  publishesWithCriticalStaleReviewerCount: number;
  publishesWithOpenThreadRegressionCount: number;
  publishesWithOpenCommentRegressionCount: number;
  averageLatestQualifyingDecisionAgeMs: number | null;
  maxLatestQualifyingDecisionAgeMs: number | null;
  nowAt: number;
}

export interface MagicStudioFilmProjectReviewDecisionFreshnessResult {
  project: MagicStudioFilmProjectReviewProjectRef;
  summary: MagicStudioFilmProjectReviewDecisionFreshnessSummary;
  roundTrends: MagicStudioFilmProjectReviewDecisionFreshnessRoundTrend[];
  ageBuckets: MagicStudioFilmProjectReviewDecisionFreshnessAgeBucket[];
  publishes: MagicStudioFilmProjectReviewDecisionFreshnessPublish[];
}

export type MagicStudioFilmProjectReviewGovernanceDriftLevel =
  | 'stable'
  | 'watch'
  | 'drifting'
  | 'critical';

export type MagicStudioFilmProjectReviewGovernanceDriftReasonCode =
  | 'critical-signal-present'
  | 'high-signal-pressure'
  | 'reopened-round-in-flight'
  | 'stale-decision-present'
  | 'overdue-reviewer-backlog'
  | 'critical-anchor-escalation'
  | 'open-thread-pressure'
  | 'open-comment-pressure';

export interface MagicStudioFilmProjectReviewGovernanceDriftReason {
  code: MagicStudioFilmProjectReviewGovernanceDriftReasonCode;
  message: string;
  count: number;
}

export type MagicStudioFilmProjectReviewGovernanceDriftSignalBucketKind =
  MagicStudioFilmPublishReviewOperationsDashboardSignalKind;

export interface MagicStudioFilmProjectReviewGovernanceDriftSignalBucket {
  kind: MagicStudioFilmProjectReviewGovernanceDriftSignalBucketKind;
  label: string;
  publishCount: number;
  signalCount: number;
  criticalSignalCount: number;
  highSignalCount: number;
  mediumSignalCount: number;
  lowSignalCount: number;
}

export interface MagicStudioFilmProjectReviewGovernanceDriftReviewerHotspot {
  reviewerKey: string;
  reviewer: MagicStudioFilmPublishReviewActor;
  publishCount: number;
  criticalPublishCount: number;
  driftPublishCount: number;
  requiredPublishCount: number;
  staleDecisionCount: number;
  overdueBacklogCount: number;
  attentionSignalCount: number;
  openThreadExposureCount: number;
  openAnchorExposureCount: number;
  latestActivityAt: number;
}

export interface MagicStudioFilmProjectReviewGovernanceDriftPublish {
  publish: MagicStudioFilmPublishRecord;
  reviewState: MagicStudioFilmPublishReviewState;
  currentRound: MagicStudioFilmPublishReviewRound | null;
  driftLevel: MagicStudioFilmProjectReviewGovernanceDriftLevel;
  driftReasons: MagicStudioFilmProjectReviewGovernanceDriftReason[];
  priorityScore: number;
  requiresAttention: boolean;
  operationsSummary: MagicStudioFilmPublishReviewOperationsDashboardSummary;
  latencySummary: MagicStudioFilmPublishReviewLatencyAnalyticsSummary;
  latestActivityAt: number;
  topSignals: MagicStudioFilmPublishReviewOperationsDashboardSignal[];
}

export interface MagicStudioFilmProjectReviewGovernanceDriftSummary {
  publishCount: number;
  stablePublishCount: number;
  watchPublishCount: number;
  driftingPublishCount: number;
  criticalPublishCount: number;
  driftedPublishCount: number;
  signalCount: number;
  criticalSignalCount: number;
  highSignalCount: number;
  reopenedRoundPublishCount: number;
  staleDecisionPublishCount: number;
  overdueBacklogPublishCount: number;
  anchorEscalationPublishCount: number;
  criticalAnchorPublishCount: number;
  nowAt: number;
}

export interface MagicStudioFilmProjectReviewGovernanceDriftResult {
  project: MagicStudioFilmProjectReviewProjectRef;
  summary: MagicStudioFilmProjectReviewGovernanceDriftSummary;
  signalBuckets: MagicStudioFilmProjectReviewGovernanceDriftSignalBucket[];
  reviewerHotspots: MagicStudioFilmProjectReviewGovernanceDriftReviewerHotspot[];
  publishes: MagicStudioFilmProjectReviewGovernanceDriftPublish[];
}

export type MagicStudioFilmProjectReviewEscalationForecastLevel =
  | 'stable'
  | 'watch'
  | 'escalating'
  | 'critical';

export type MagicStudioFilmProjectReviewEscalationForecastReasonCode =
  | 'shared-reviewer-bottleneck'
  | 'shared-anchor-escalation'
  | 'shared-blocker-class'
  | 'critical-signal-overlap'
  | 'approval-blocked-beyond-window'
  | 'reopened-round-cluster';

export interface MagicStudioFilmProjectReviewEscalationForecastReason {
  code: MagicStudioFilmProjectReviewEscalationForecastReasonCode;
  message: string;
  count: number;
}

export type MagicStudioFilmProjectReviewEscalationForecastThroughputLevel =
  | 'flowing'
  | 'constrained'
  | 'blocked';

export interface MagicStudioFilmProjectReviewEscalationForecastThroughput {
  windowHours: number;
  level: MagicStudioFilmProjectReviewEscalationForecastThroughputLevel;
  readyNowCount: number;
  projectedReadyWithinWindowCount: number;
  projectedBlockedBeyondWindowCount: number;
  averageCurrentRoundElapsedMs: number | null;
  averageTimeToFirstParticipationMs: number | null;
  averageTimeToQualifyingDecisionMs: number | null;
}

export interface MagicStudioFilmProjectReviewEscalationForecastReviewerHotspot {
  reviewerKey: string;
  reviewer: MagicStudioFilmPublishReviewActor;
  publishCount: number;
  requiredPublishCount: number;
  pendingPublishCount: number;
  criticalPublishCount: number;
  signalCount: number;
  maxCurrentRoundPendingAgeMs: number;
  latestActivityAt: number;
}

export interface MagicStudioFilmProjectReviewEscalationForecastAnchorHotspot {
  anchorId: string;
  label: string;
  publishCount: number;
  signalCount: number;
  criticalPublishCount: number;
  latestActivityAt: number;
}

export interface MagicStudioFilmProjectReviewEscalationForecastBlockerClass {
  blockerClassKey: string;
  label: string;
  publishCount: number;
  signalCount: number;
  criticalPublishCount: number;
}

export interface MagicStudioFilmProjectReviewEscalationForecastPublish {
  publish: MagicStudioFilmPublishRecord;
  reviewState: MagicStudioFilmPublishReviewState;
  currentRound: MagicStudioFilmPublishReviewRound | null;
  forecastLevel: MagicStudioFilmProjectReviewEscalationForecastLevel;
  forecastReasons: MagicStudioFilmProjectReviewEscalationForecastReason[];
  readyForApproval: boolean;
  priorityScore: number;
  estimatedReadyWithinWindow: boolean;
  estimatedRemainingTimeMs: number;
  operationsSummary: MagicStudioFilmPublishReviewOperationsDashboardSummary;
  latencySummary: MagicStudioFilmPublishReviewLatencyAnalyticsSummary;
  latestActivityAt: number;
  sharedReviewerKeys: string[];
  sharedAnchorIds: string[];
  sharedBlockerClassKeys: string[];
  topSignals: MagicStudioFilmPublishReviewOperationsDashboardSignal[];
}

export interface MagicStudioFilmProjectReviewEscalationForecastSummary {
  publishCount: number;
  stablePublishCount: number;
  watchPublishCount: number;
  escalatingPublishCount: number;
  criticalPublishCount: number;
  readyForApprovalCount: number;
  blockedBeyondWindowCount: number;
  sharedReviewerHotspotCount: number;
  sharedAnchorHotspotCount: number;
  sharedBlockerClassCount: number;
  criticalOverlapPublishCount: number;
  reopenedRoundClusterCount: number;
  nowAt: number;
}

export interface MagicStudioFilmProjectReviewEscalationForecastResult {
  project: MagicStudioFilmProjectReviewProjectRef;
  summary: MagicStudioFilmProjectReviewEscalationForecastSummary;
  throughput: MagicStudioFilmProjectReviewEscalationForecastThroughput;
  reviewerHotspots: MagicStudioFilmProjectReviewEscalationForecastReviewerHotspot[];
  anchorHotspots: MagicStudioFilmProjectReviewEscalationForecastAnchorHotspot[];
  blockerClasses: MagicStudioFilmProjectReviewEscalationForecastBlockerClass[];
  publishes: MagicStudioFilmProjectReviewEscalationForecastPublish[];
}

export type MagicStudioFilmProjectReviewDependencyGraphDependencyType =
  | 'reviewer'
  | 'anchor'
  | 'blocker-class';

export type MagicStudioFilmProjectReviewDependencyGraphEdgeLevel =
  | 'stable'
  | 'shared'
  | 'critical';

export type MagicStudioFilmProjectReviewDependencyGraphLinkLevel =
  | 'watch'
  | 'escalating'
  | 'critical';

export type MagicStudioFilmProjectReviewDependencyGraphEdgeReasonCode =
  | 'required-reviewer'
  | 'pending-reviewer'
  | 'reviewer-signal'
  | 'critical-reviewer-signal'
  | 'anchor-escalation'
  | 'critical-anchor-escalation'
  | 'readiness-blocker'
  | 'critical-readiness-blocker';

export type MagicStudioFilmProjectReviewDependencyGraphLinkReasonCode =
  | 'shared-reviewer'
  | 'shared-anchor'
  | 'shared-blocker-class'
  | 'critical-shared-dependency';

export interface MagicStudioFilmProjectReviewDependencyGraphPublish {
  publish: MagicStudioFilmPublishRecord;
  reviewState: MagicStudioFilmPublishReviewState;
  currentRound: MagicStudioFilmPublishReviewRound | null;
  readyForApproval: boolean;
  priorityScore: number;
  dependencyCount: number;
  sharedDependencyCount: number;
  criticalDependencyCount: number;
  operationsSummary: MagicStudioFilmPublishReviewOperationsDashboardSummary;
  latencySummary: MagicStudioFilmPublishReviewLatencyAnalyticsSummary;
  latestActivityAt: number;
}

export type MagicStudioFilmProjectReviewDependencyGraphReviewerNode =
  MagicStudioFilmProjectReviewEscalationForecastReviewerHotspot;

export type MagicStudioFilmProjectReviewDependencyGraphAnchorNode =
  MagicStudioFilmProjectReviewEscalationForecastAnchorHotspot;

export type MagicStudioFilmProjectReviewDependencyGraphBlockerClassNode =
  MagicStudioFilmProjectReviewEscalationForecastBlockerClass;

export interface MagicStudioFilmProjectReviewDependencyGraphDependencyEdge {
  edgeId: string;
  publishId: string;
  dependencyType: MagicStudioFilmProjectReviewDependencyGraphDependencyType;
  dependencyKey: string;
  dependencyLabel: string;
  level: MagicStudioFilmProjectReviewDependencyGraphEdgeLevel;
  sharedAcrossPublishCount: number;
  critical: boolean;
  required: boolean;
  pending: boolean;
  signalCount: number;
  latestActivityAt: number;
  reasonCodes: MagicStudioFilmProjectReviewDependencyGraphEdgeReasonCode[];
}

export interface MagicStudioFilmProjectReviewDependencyGraphPublishLink {
  linkId: string;
  publishIds: [string, string];
  level: MagicStudioFilmProjectReviewDependencyGraphLinkLevel;
  sharedDependencyCount: number;
  criticalSharedDependencyCount: number;
  sharedReviewerKeys: string[];
  sharedAnchorIds: string[];
  sharedBlockerClassKeys: string[];
  latestActivityAt: number;
  reasonCodes: MagicStudioFilmProjectReviewDependencyGraphLinkReasonCode[];
}

export interface MagicStudioFilmProjectReviewDependencyGraphCluster {
  clusterId: string;
  publishIds: string[];
  reviewerKeys: string[];
  anchorIds: string[];
  blockerClassKeys: string[];
  linkCount: number;
  sharedDependencyCount: number;
  critical: boolean;
  latestActivityAt: number;
}

export interface MagicStudioFilmProjectReviewDependencyGraphSummary {
  publishCount: number;
  reviewerNodeCount: number;
  anchorNodeCount: number;
  blockerClassNodeCount: number;
  dependencyEdgeCount: number;
  publishLinkCount: number;
  clusterCount: number;
  sharedDependencyEdgeCount: number;
  criticalDependencyEdgeCount: number;
  criticalPublishLinkCount: number;
  sharedDependencyNodeCount: number;
  readyForApprovalCount: number;
  reopenedRoundPublishCount: number;
  nowAt: number;
}

export interface MagicStudioFilmProjectReviewDependencyGraphResult {
  project: MagicStudioFilmProjectReviewProjectRef;
  summary: MagicStudioFilmProjectReviewDependencyGraphSummary;
  publishes: MagicStudioFilmProjectReviewDependencyGraphPublish[];
  reviewers: MagicStudioFilmProjectReviewDependencyGraphReviewerNode[];
  anchors: MagicStudioFilmProjectReviewDependencyGraphAnchorNode[];
  blockerClasses: MagicStudioFilmProjectReviewDependencyGraphBlockerClassNode[];
  dependencyEdges: MagicStudioFilmProjectReviewDependencyGraphDependencyEdge[];
  publishLinks: MagicStudioFilmProjectReviewDependencyGraphPublishLink[];
  clusters: MagicStudioFilmProjectReviewDependencyGraphCluster[];
}

export type MagicStudioFilmProjectReviewInterventionPlanPriorityLevel =
  | 'now'
  | 'next'
  | 'monitor';

export type MagicStudioFilmProjectReviewInterventionPlanWindow =
  | '0-4h'
  | '4-24h'
  | '24h-plus';

export type MagicStudioFilmProjectReviewInterventionPlanInterventionType =
  | 'rebalance-reviewer-load'
  | 'resolve-anchor-escalation'
  | 'clear-blocker-class'
  | 'stabilize-reopened-round'
  | 'fast-track-ready-approval';

export type MagicStudioFilmProjectReviewInterventionPlanReasonCode =
  | 'shared-reviewer-overload'
  | 'shared-anchor-cluster'
  | 'critical-anchor-cluster'
  | 'recurring-blocker-class'
  | 'reopened-round-instability'
  | 'approval-ready-but-queued'
  | 'critical-link-cluster';

export interface MagicStudioFilmProjectReviewInterventionPlanWindowSummary {
  window: MagicStudioFilmProjectReviewInterventionPlanWindow;
  label: string;
  interventionCount: number;
  publishCount: number;
  expectedThroughputGain: number;
}

export interface MagicStudioFilmProjectReviewInterventionPlanIntervention {
  interventionId: string;
  interventionType: MagicStudioFilmProjectReviewInterventionPlanInterventionType;
  priorityLevel: MagicStudioFilmProjectReviewInterventionPlanPriorityLevel;
  window: MagicStudioFilmProjectReviewInterventionPlanWindow;
  title: string;
  message: string;
  affectedPublishIds: string[];
  affectedReviewerKeys: string[];
  affectedAnchorIds: string[];
  affectedBlockerClassKeys: string[];
  expectedThroughputGain: number;
  latestActivityAt: number;
  reasonCodes: MagicStudioFilmProjectReviewInterventionPlanReasonCode[];
}

export interface MagicStudioFilmProjectReviewInterventionPlanPublishPlan {
  publishId: string;
  publish: MagicStudioFilmPublishRecord;
  reviewState: MagicStudioFilmPublishReviewState;
  currentRound: MagicStudioFilmPublishReviewRound | null;
  forecastLevel: MagicStudioFilmProjectReviewEscalationForecastLevel;
  priorityLevel: MagicStudioFilmProjectReviewInterventionPlanPriorityLevel;
  window: MagicStudioFilmProjectReviewInterventionPlanWindow;
  readyForApproval: boolean;
  priorityScore: number;
  latestActivityAt: number;
  estimatedRemainingTimeMs: number;
  dependencyPressureCount: number;
  sharedReviewerKeys: string[];
  sharedAnchorIds: string[];
  sharedBlockerClassKeys: string[];
  interventionIds: string[];
  reasonCodes: MagicStudioFilmProjectReviewInterventionPlanReasonCode[];
}

export interface MagicStudioFilmProjectReviewInterventionPlanSummary {
  publishCount: number;
  interventionCount: number;
  publishPlanCount: number;
  nowInterventionCount: number;
  nextInterventionCount: number;
  monitorInterventionCount: number;
  nowPublishPlanCount: number;
  nextPublishPlanCount: number;
  monitorPublishPlanCount: number;
  readyForApprovalCount: number;
  blockedBeyondWindowCount: number;
  reopenedRoundClusterCount: number;
  expectedThroughputGain: number;
  nowAt: number;
}

export interface MagicStudioFilmProjectReviewInterventionPlanResult {
  project: MagicStudioFilmProjectReviewProjectRef;
  summary: MagicStudioFilmProjectReviewInterventionPlanSummary;
  windows: MagicStudioFilmProjectReviewInterventionPlanWindowSummary[];
  interventions: MagicStudioFilmProjectReviewInterventionPlanIntervention[];
  publishPlans: MagicStudioFilmProjectReviewInterventionPlanPublishPlan[];
}

export type MagicStudioFilmProjectReviewRecoveryOrchestrationExecutionLane =
  | 'stabilize-now'
  | 'recover-today'
  | 'monitor-next';

export type MagicStudioFilmProjectReviewRecoveryOrchestrationBundleType =
  | 'cluster-recovery'
  | 'reviewer-load-recovery'
  | 'anchor-recovery'
  | 'blocker-recovery'
  | 'reopened-round-recovery'
  | 'approval-fast-track';

export type MagicStudioFilmProjectReviewRecoveryOrchestrationStepType =
  | 'approve-ready-publish'
  | 'rebalance-reviewer-ownership'
  | 'clear-anchor-thread'
  | 'clear-blocker-class'
  | 'stabilize-reopened-round'
  | 'coordinate-follow-up';

export type MagicStudioFilmProjectReviewRecoveryOrchestrationReasonCode =
  | MagicStudioFilmProjectReviewInterventionPlanReasonCode
  | 'portfolio-throughput-recovery';

export interface MagicStudioFilmProjectReviewRecoveryOrchestrationExecutionLaneSummary {
  lane: MagicStudioFilmProjectReviewRecoveryOrchestrationExecutionLane;
  label: string;
  priorityLevel: MagicStudioFilmProjectReviewInterventionPlanPriorityLevel;
  window: MagicStudioFilmProjectReviewInterventionPlanWindow;
  bundleCount: number;
  publishCount: number;
  expectedThroughputGain: number;
}

export interface MagicStudioFilmProjectReviewRecoveryOrchestrationStep {
  stepId: string;
  order: number;
  stepType: MagicStudioFilmProjectReviewRecoveryOrchestrationStepType;
  title: string;
  message: string;
  targetPublishIds: string[];
  targetReviewerKeys: string[];
  targetAnchorIds: string[];
  targetBlockerClassKeys: string[];
  completionSignal: string;
}

export interface MagicStudioFilmProjectReviewRecoveryOrchestrationBundle {
  bundleId: string;
  bundleType: MagicStudioFilmProjectReviewRecoveryOrchestrationBundleType;
  priorityLevel: MagicStudioFilmProjectReviewInterventionPlanPriorityLevel;
  window: MagicStudioFilmProjectReviewInterventionPlanWindow;
  executionLane: MagicStudioFilmProjectReviewRecoveryOrchestrationExecutionLane;
  title: string;
  objective: string;
  interventionIds: string[];
  publishIds: string[];
  reviewerKeys: string[];
  anchorIds: string[];
  blockerClassKeys: string[];
  expectedThroughputGain: number;
  latestActivityAt: number;
  reasonCodes: MagicStudioFilmProjectReviewRecoveryOrchestrationReasonCode[];
  steps: MagicStudioFilmProjectReviewRecoveryOrchestrationStep[];
}

export interface MagicStudioFilmProjectReviewRecoveryOrchestrationPublishRecovery {
  publishId: string;
  publish: MagicStudioFilmPublishRecord;
  reviewState: MagicStudioFilmPublishReviewState;
  currentRound: MagicStudioFilmPublishReviewRound | null;
  forecastLevel: MagicStudioFilmProjectReviewEscalationForecastLevel;
  priorityLevel: MagicStudioFilmProjectReviewInterventionPlanPriorityLevel;
  window: MagicStudioFilmProjectReviewInterventionPlanWindow;
  executionLane: MagicStudioFilmProjectReviewRecoveryOrchestrationExecutionLane;
  readyForApproval: boolean;
  priorityScore: number;
  estimatedRemainingTimeMs: number;
  dependencyPressureCount: number;
  bundleIds: string[];
  interventionIds: string[];
  latestActivityAt: number;
  reasonCodes: MagicStudioFilmProjectReviewRecoveryOrchestrationReasonCode[];
}

export interface MagicStudioFilmProjectReviewRecoveryOrchestrationSummary {
  publishCount: number;
  bundleCount: number;
  laneCount: number;
  nowBundleCount: number;
  nextBundleCount: number;
  monitorBundleCount: number;
  readyForApprovalCount: number;
  blockedBeyondWindowCount: number;
  expectedThroughputGain: number;
  nowAt: number;
}

export interface MagicStudioFilmProjectReviewRecoveryOrchestrationResult {
  project: MagicStudioFilmProjectReviewProjectRef;
  summary: MagicStudioFilmProjectReviewRecoveryOrchestrationSummary;
  executionLanes: MagicStudioFilmProjectReviewRecoveryOrchestrationExecutionLaneSummary[];
  bundles: MagicStudioFilmProjectReviewRecoveryOrchestrationBundle[];
  publishRecoveries: MagicStudioFilmProjectReviewRecoveryOrchestrationPublishRecovery[];
}

export type MagicStudioFilmProjectReviewApprovalBurnDownReadinessTrend =
  | 'ready-now'
  | 'entering-ready-window'
  | 'blocked-beyond-window';

export interface MagicStudioFilmProjectReviewApprovalBurnDownWindowSummary {
  window: MagicStudioFilmProjectReviewInterventionPlanWindow;
  label: string;
  order: number;
  publishCount: number;
  readyNowCount: number;
  newlyReadyCount: number;
  remainingBlockedCount: number;
  interventionCount: number;
  bundleCount: number;
  expectedThroughputGain: number;
}

export interface MagicStudioFilmProjectReviewApprovalBurnDownPoint {
  window: MagicStudioFilmProjectReviewInterventionPlanWindow;
  label: string;
  order: number;
  windowResolvedCount: number;
  cumulativeResolvedCount: number;
  remainingBlockedCount: number;
}

export interface MagicStudioFilmProjectReviewApprovalBurnDownInterventionOutcome {
  interventionType: MagicStudioFilmProjectReviewInterventionPlanInterventionType;
  priorityLevel: MagicStudioFilmProjectReviewInterventionPlanPriorityLevel;
  recoveryWindow: MagicStudioFilmProjectReviewInterventionPlanWindow;
  affectedPublishCount: number;
  readyNowCount: number;
  newlyReadyCount: number;
  blockedBeyondWindowCount: number;
  recoveryBundleCount: number;
  projectedLift: number;
  latestActivityAt: number;
  reasonCodes: MagicStudioFilmProjectReviewRecoveryOrchestrationReasonCode[];
}

export interface MagicStudioFilmProjectReviewApprovalBurnDownPublishTrend {
  publishId: string;
  publish: MagicStudioFilmPublishRecord;
  reviewState: MagicStudioFilmPublishReviewState;
  currentRound: MagicStudioFilmPublishReviewRound | null;
  forecastLevel: MagicStudioFilmProjectReviewEscalationForecastLevel;
  priorityLevel: MagicStudioFilmProjectReviewInterventionPlanPriorityLevel;
  recoveryWindow: MagicStudioFilmProjectReviewInterventionPlanWindow;
  executionLane: MagicStudioFilmProjectReviewRecoveryOrchestrationExecutionLane;
  timeToReadyWindow: MagicStudioFilmProjectReviewInterventionPlanWindow;
  readinessTrend: MagicStudioFilmProjectReviewApprovalBurnDownReadinessTrend;
  readyForApproval: boolean;
  priorityScore: number;
  estimatedRemainingTimeMs: number;
  dependencyPressureCount: number;
  bundleIds: string[];
  interventionIds: string[];
  latestActivityAt: number;
  reasonCodes: MagicStudioFilmProjectReviewRecoveryOrchestrationReasonCode[];
}

export interface MagicStudioFilmProjectReviewApprovalBurnDownSummary {
  publishCount: number;
  readyNowCount: number;
  newlyReadyCount: number;
  projectedReadyWithin24hCount: number;
  blockedBeyondWindowCount: number;
  windowCount: number;
  burnDownPointCount: number;
  interventionOutcomeCount: number;
  bundleCount: number;
  expectedThroughputGain: number;
  nowAt: number;
}

export interface MagicStudioFilmProjectReviewApprovalBurnDownResult {
  project: MagicStudioFilmProjectReviewProjectRef;
  summary: MagicStudioFilmProjectReviewApprovalBurnDownSummary;
  windows: MagicStudioFilmProjectReviewApprovalBurnDownWindowSummary[];
  burnDown: MagicStudioFilmProjectReviewApprovalBurnDownPoint[];
  interventionOutcomes: MagicStudioFilmProjectReviewApprovalBurnDownInterventionOutcome[];
  publishTrend: MagicStudioFilmProjectReviewApprovalBurnDownPublishTrend[];
}

export type MagicStudioFilmProjectReviewInterventionOutcomeStatus =
  | 'ready-now'
  | 'recoverable-in-window'
  | 'blocked-beyond-window';

export interface MagicStudioFilmProjectReviewInterventionOutcome {
  interventionType: MagicStudioFilmProjectReviewInterventionPlanInterventionType;
  priorityLevel: MagicStudioFilmProjectReviewInterventionPlanPriorityLevel;
  recoveryWindow: MagicStudioFilmProjectReviewInterventionPlanWindow;
  affectedPublishCount: number;
  readyNowCount: number;
  recoverableInWindowCount: number;
  blockedBeyondWindowCount: number;
  recoveryBundleCount: number;
  projectedLift: number;
  blockerPressureCount: number;
  criticalOverlapCount: number;
  latestActivityAt: number;
  reasonCodes: MagicStudioFilmProjectReviewRecoveryOrchestrationReasonCode[];
}

export interface MagicStudioFilmProjectReviewInterventionOutcomeBundle {
  bundleId: string;
  bundleType: MagicStudioFilmProjectReviewRecoveryOrchestrationBundleType;
  priorityLevel: MagicStudioFilmProjectReviewInterventionPlanPriorityLevel;
  executionLane: MagicStudioFilmProjectReviewRecoveryOrchestrationExecutionLane;
  publishCount: number;
  readyNowCount: number;
  recoverableInWindowCount: number;
  blockedBeyondWindowCount: number;
  projectedLift: number;
  latestActivityAt: number;
  interventionTypes: MagicStudioFilmProjectReviewInterventionPlanInterventionType[];
  reasonCodes: MagicStudioFilmProjectReviewRecoveryOrchestrationReasonCode[];
}

export interface MagicStudioFilmProjectReviewInterventionOutcomeReasonImpact {
  reasonCode: MagicStudioFilmProjectReviewRecoveryOrchestrationReasonCode;
  affectedPublishCount: number;
  interventionTypeCount: number;
  readyNowCount: number;
  recoverableInWindowCount: number;
  blockedBeyondWindowCount: number;
  projectedLift: number;
}

export interface MagicStudioFilmProjectReviewInterventionOutcomePublishOutcome {
  publishId: string;
  publish: MagicStudioFilmPublishRecord;
  reviewState: MagicStudioFilmPublishReviewState;
  currentRound: MagicStudioFilmPublishReviewRound | null;
  forecastLevel: MagicStudioFilmProjectReviewEscalationForecastLevel;
  priorityLevel: MagicStudioFilmProjectReviewInterventionPlanPriorityLevel;
  outcomeStatus: MagicStudioFilmProjectReviewInterventionOutcomeStatus;
  recoveryWindow: MagicStudioFilmProjectReviewInterventionPlanWindow;
  timeToReadyWindow: MagicStudioFilmProjectReviewInterventionPlanWindow;
  executionLane: MagicStudioFilmProjectReviewRecoveryOrchestrationExecutionLane;
  readinessTrend: MagicStudioFilmProjectReviewApprovalBurnDownReadinessTrend;
  readyForApproval: boolean;
  priorityScore: number;
  estimatedRemainingTimeMs: number;
  dependencyPressureCount: number;
  bundleIds: string[];
  interventionIds: string[];
  interventionTypes: MagicStudioFilmProjectReviewInterventionPlanInterventionType[];
  latestActivityAt: number;
  reasonCodes: MagicStudioFilmProjectReviewRecoveryOrchestrationReasonCode[];
}

export interface MagicStudioFilmProjectReviewInterventionOutcomesSummary {
  publishCount: number;
  interventionTypeCount: number;
  bundleCount: number;
  reasonImpactCount: number;
  readyNowCount: number;
  recoverableInWindowCount: number;
  blockedBeyondWindowCount: number;
  expectedThroughputGain: number;
  nowAt: number;
}

export interface MagicStudioFilmProjectReviewInterventionOutcomesResult {
  project: MagicStudioFilmProjectReviewProjectRef;
  summary: MagicStudioFilmProjectReviewInterventionOutcomesSummary;
  interventions: MagicStudioFilmProjectReviewInterventionOutcome[];
  bundles: MagicStudioFilmProjectReviewInterventionOutcomeBundle[];
  reasonImpacts: MagicStudioFilmProjectReviewInterventionOutcomeReasonImpact[];
  publishOutcomes: MagicStudioFilmProjectReviewInterventionOutcomePublishOutcome[];
}

export type MagicStudioFilmProjectReviewEffectivenessBaselineLevel =
  | 'better-than-baseline'
  | 'on-baseline'
  | 'below-baseline'
  | 'in-flight-within-baseline'
  | 'in-flight-beyond-baseline';

export type MagicStudioFilmProjectReviewEffectivenessBaselineSource =
  | 'publish-history'
  | 'project-history'
  | 'system-default';

export type MagicStudioFilmProjectReviewEffectivenessBaselineComparisonMode =
  | 'observed-qualifying-decision'
  | 'current-round-elapsed';

export interface MagicStudioFilmProjectReviewEffectivenessBaselineIntervention {
  interventionType: MagicStudioFilmProjectReviewInterventionPlanInterventionType;
  publishCount: number;
  realizedPublishCount: number;
  readyForApprovalCount: number;
  betterThanBaselineCount: number;
  onBaselineCount: number;
  belowBaselineCount: number;
  inFlightWithinBaselineCount: number;
  inFlightBeyondBaselineCount: number;
  reopenedAfterQualifyingDecisionCount: number;
  averageComparisonTimeMs: number | null;
  averageObservedTimeToQualifyingDecisionMs: number | null;
  averageBaselineDeltaMs: number | null;
  reasonCodes: MagicStudioFilmProjectReviewRecoveryOrchestrationReasonCode[];
}

export interface MagicStudioFilmProjectReviewEffectivenessBaselineReasonImpact {
  reasonCode: MagicStudioFilmProjectReviewRecoveryOrchestrationReasonCode;
  publishCount: number;
  interventionTypeCount: number;
  realizedPublishCount: number;
  betterThanBaselineCount: number;
  onBaselineCount: number;
  belowBaselineCount: number;
  inFlightWithinBaselineCount: number;
  inFlightBeyondBaselineCount: number;
  averageBaselineDeltaMs: number | null;
}

export interface MagicStudioFilmProjectReviewEffectivenessBaselinePublish {
  publishId: string;
  publish: MagicStudioFilmPublishRecord;
  reviewState: MagicStudioFilmPublishReviewState;
  currentRound: MagicStudioFilmPublishReviewRound | null;
  currentRoundStartReason: MagicStudioFilmPublishReviewRoundStartReason | null;
  forecastLevel: MagicStudioFilmProjectReviewEscalationForecastLevel;
  priorityLevel: MagicStudioFilmProjectReviewInterventionPlanPriorityLevel;
  recoveryWindow: MagicStudioFilmProjectReviewInterventionPlanWindow;
  outcomeStatus: MagicStudioFilmProjectReviewInterventionOutcomeStatus;
  effectivenessLevel: MagicStudioFilmProjectReviewEffectivenessBaselineLevel;
  baselineSource: MagicStudioFilmProjectReviewEffectivenessBaselineSource;
  comparisonMode: MagicStudioFilmProjectReviewEffectivenessBaselineComparisonMode;
  baselineTimeToQualifyingDecisionMs: number;
  comparisonTimeMs: number;
  baselineDeltaMs: number;
  observedTimeToQualifyingDecisionMs: number | null;
  currentRoundElapsedMs: number | null;
  latestQualifyingDecisionAt: number | null;
  latestQualifyingDecisionAction:
    | Extract<MagicStudioFilmPublishReviewDecision['action'], 'approved' | 'changes-requested'>
    | null;
  latestDecisionAt: number | null;
  latestDecisionAction: MagicStudioFilmPublishReviewDecision['action'] | null;
  reopenedAfterQualifyingDecisionCount: number;
  readyForApproval: boolean;
  priorityScore: number;
  estimatedRemainingTimeMs: number;
  dependencyPressureCount: number;
  interventionTypes: MagicStudioFilmProjectReviewInterventionPlanInterventionType[];
  reasonCodes: MagicStudioFilmProjectReviewRecoveryOrchestrationReasonCode[];
  latestActivityAt: number;
}

export interface MagicStudioFilmProjectReviewEffectivenessBaselineSummary {
  publishCount: number;
  realizedPublishCount: number;
  publishHistoryBaselineCount: number;
  projectHistoryBaselineCount: number;
  systemDefaultBaselineCount: number;
  betterThanBaselineCount: number;
  onBaselineCount: number;
  belowBaselineCount: number;
  inFlightWithinBaselineCount: number;
  inFlightBeyondBaselineCount: number;
  reopenedAfterQualifyingDecisionPublishCount: number;
  readyForApprovalCount: number;
  averageBaselineTimeToQualifyingDecisionMs: number | null;
  averageComparisonTimeMs: number | null;
  averageObservedTimeToQualifyingDecisionMs: number | null;
  averageBaselineDeltaMs: number | null;
  nowAt: number;
}

export interface MagicStudioFilmProjectReviewEffectivenessBaselineResult {
  project: MagicStudioFilmProjectReviewProjectRef;
  summary: MagicStudioFilmProjectReviewEffectivenessBaselineSummary;
  interventionTypes: MagicStudioFilmProjectReviewEffectivenessBaselineIntervention[];
  reasonImpacts: MagicStudioFilmProjectReviewEffectivenessBaselineReasonImpact[];
  publishes: MagicStudioFilmProjectReviewEffectivenessBaselinePublish[];
}

export type MagicStudioFilmProjectReviewInterventionExecutionEvidenceType =
  | 'approval-cleared'
  | 'assignment-adjusted'
  | 'anchor-thread-resolved'
  | 'blocker-progressed'
  | 'reopened-round-progressed'
  | 'follow-up-observed';

export type MagicStudioFilmProjectReviewInterventionExecutionTargetKind =
  | 'publish'
  | 'anchor';

export type MagicStudioFilmProjectReviewInterventionExecutionCheckpointStatus =
  | 'completed'
  | 'partial'
  | 'pending';

export interface MagicStudioFilmProjectReviewInterventionExecutionEvidence {
  evidenceId: string;
  evidenceType: MagicStudioFilmProjectReviewInterventionExecutionEvidenceType;
  publishId: string | null;
  reviewerKey: string | null;
  anchorId: string | null;
  blockerClassKey: string | null;
  occurredAt: number;
  roundNumber: number | null;
  actor: MagicStudioFilmPublishReviewActor | null;
  sourceEventId: string | null;
  sourceEventType: MagicStudioFilmPublishReviewTimelineEventType | null;
  message: string;
}

export interface MagicStudioFilmProjectReviewInterventionExecutionCheckpoint {
  checkpointId: string;
  interventionId: string;
  interventionType: MagicStudioFilmProjectReviewInterventionPlanInterventionType;
  priorityLevel: MagicStudioFilmProjectReviewInterventionPlanPriorityLevel;
  recoveryWindow: MagicStudioFilmProjectReviewInterventionPlanWindow;
  stepType: MagicStudioFilmProjectReviewRecoveryOrchestrationStepType;
  evidenceType: MagicStudioFilmProjectReviewInterventionExecutionEvidenceType;
  completionSignal: string;
  status: MagicStudioFilmProjectReviewInterventionExecutionCheckpointStatus;
  targetKind: MagicStudioFilmProjectReviewInterventionExecutionTargetKind;
  targetCount: number;
  completedTargetCount: number;
  pendingTargetCount: number;
  expectedThroughputGain: number;
  evidenceCount: number;
  evidenceBackedPublishCount: number;
  thresholdAt: number;
  latestActivityAt: number;
  latestEvidenceAt: number | null;
  bundleIds: string[];
  targetPublishIds: string[];
  targetReviewerKeys: string[];
  targetAnchorIds: string[];
  targetBlockerClassKeys: string[];
  reasonCodes: MagicStudioFilmProjectReviewRecoveryOrchestrationReasonCode[];
  title: string;
  message: string;
  evidence: MagicStudioFilmProjectReviewInterventionExecutionEvidence[];
}

export interface MagicStudioFilmProjectReviewInterventionExecutionIntervention {
  interventionType: MagicStudioFilmProjectReviewInterventionPlanInterventionType;
  priorityLevel: MagicStudioFilmProjectReviewInterventionPlanPriorityLevel;
  recoveryWindow: MagicStudioFilmProjectReviewInterventionPlanWindow;
  publishCount: number;
  bundleCount: number;
  checkpointCount: number;
  completedCheckpointCount: number;
  partialCheckpointCount: number;
  pendingCheckpointCount: number;
  evidenceCount: number;
  evidenceBackedPublishCount: number;
  expectedThroughputGain: number;
  approvedPublishCount: number;
  readyForApprovalCount: number;
  recoverableInWindowCount: number;
  blockedBeyondWindowCount: number;
  betterThanBaselineCount: number;
  onBaselineCount: number;
  belowBaselineCount: number;
  inFlightWithinBaselineCount: number;
  inFlightBeyondBaselineCount: number;
  reopenedAfterQualifyingDecisionCount: number;
  latestEvidenceAt: number | null;
  latestActivityAt: number;
  reasonCodes: MagicStudioFilmProjectReviewRecoveryOrchestrationReasonCode[];
}

export interface MagicStudioFilmProjectReviewInterventionExecutionBundle {
  bundleId: string;
  bundleType: MagicStudioFilmProjectReviewRecoveryOrchestrationBundleType;
  priorityLevel: MagicStudioFilmProjectReviewInterventionPlanPriorityLevel;
  recoveryWindow: MagicStudioFilmProjectReviewInterventionPlanWindow;
  executionLane: MagicStudioFilmProjectReviewRecoveryOrchestrationExecutionLane;
  publishCount: number;
  checkpointCount: number;
  completedCheckpointCount: number;
  partialCheckpointCount: number;
  pendingCheckpointCount: number;
  evidenceCount: number;
  evidenceBackedPublishCount: number;
  expectedThroughputGain: number;
  approvedPublishCount: number;
  readyForApprovalCount: number;
  recoverableInWindowCount: number;
  blockedBeyondWindowCount: number;
  betterThanBaselineCount: number;
  onBaselineCount: number;
  belowBaselineCount: number;
  inFlightWithinBaselineCount: number;
  inFlightBeyondBaselineCount: number;
  reopenedAfterQualifyingDecisionCount: number;
  latestEvidenceAt: number | null;
  latestActivityAt: number;
  interventionTypes: MagicStudioFilmProjectReviewInterventionPlanInterventionType[];
  reasonCodes: MagicStudioFilmProjectReviewRecoveryOrchestrationReasonCode[];
}

export interface MagicStudioFilmProjectReviewInterventionExecutionPublish {
  publishId: string;
  publish: MagicStudioFilmPublishRecord;
  reviewState: MagicStudioFilmPublishReviewState;
  currentRound: MagicStudioFilmPublishReviewRound | null;
  currentRoundStartReason: MagicStudioFilmPublishReviewRoundStartReason | null;
  forecastLevel: MagicStudioFilmProjectReviewEscalationForecastLevel;
  priorityLevel: MagicStudioFilmProjectReviewInterventionPlanPriorityLevel;
  recoveryWindow: MagicStudioFilmProjectReviewInterventionPlanWindow;
  executionLane: MagicStudioFilmProjectReviewRecoveryOrchestrationExecutionLane;
  outcomeStatus: MagicStudioFilmProjectReviewInterventionOutcomeStatus;
  effectivenessLevel: MagicStudioFilmProjectReviewEffectivenessBaselineLevel;
  checkpointStatus: MagicStudioFilmProjectReviewInterventionExecutionCheckpointStatus;
  checkpointCount: number;
  completedCheckpointCount: number;
  partialCheckpointCount: number;
  pendingCheckpointCount: number;
  evidenceCount: number;
  latestEvidenceAt: number | null;
  latestQualifyingDecisionAt: number | null;
  latestQualifyingDecisionAction:
    | Extract<MagicStudioFilmPublishReviewDecision['action'], 'approved' | 'changes-requested'>
    | null;
  latestDecisionAt: number | null;
  latestDecisionAction: MagicStudioFilmPublishReviewDecision['action'] | null;
  reopenedAfterQualifyingDecisionCount: number;
  readyForApproval: boolean;
  priorityScore: number;
  estimatedRemainingTimeMs: number;
  dependencyPressureCount: number;
  bundleIds: string[];
  interventionIds: string[];
  interventionTypes: MagicStudioFilmProjectReviewInterventionPlanInterventionType[];
  reasonCodes: MagicStudioFilmProjectReviewRecoveryOrchestrationReasonCode[];
  latestActivityAt: number;
}

export interface MagicStudioFilmProjectReviewInterventionExecutionHistorySummary {
  publishCount: number;
  interventionTypeCount: number;
  bundleCount: number;
  checkpointCount: number;
  completedCheckpointCount: number;
  partialCheckpointCount: number;
  pendingCheckpointCount: number;
  evidenceCount: number;
  evidenceBackedPublishCount: number;
  expectedThroughputGain: number;
  approvedPublishCount: number;
  readyForApprovalCount: number;
  recoverableInWindowCount: number;
  blockedBeyondWindowCount: number;
  betterThanBaselineCount: number;
  onBaselineCount: number;
  belowBaselineCount: number;
  inFlightWithinBaselineCount: number;
  inFlightBeyondBaselineCount: number;
  reopenedAfterQualifyingDecisionPublishCount: number;
  nowAt: number;
}

export interface MagicStudioFilmProjectReviewInterventionExecutionHistoryResult {
  project: MagicStudioFilmProjectReviewProjectRef;
  summary: MagicStudioFilmProjectReviewInterventionExecutionHistorySummary;
  interventions: MagicStudioFilmProjectReviewInterventionExecutionIntervention[];
  bundles: MagicStudioFilmProjectReviewInterventionExecutionBundle[];
  checkpoints: MagicStudioFilmProjectReviewInterventionExecutionCheckpoint[];
  publishes: MagicStudioFilmProjectReviewInterventionExecutionPublish[];
}

export interface MagicStudioFilmStoryboardPublishResult {
  publishId: string;
  projectId: string;
  projectUuid: string;
  projectName: string;
  fileName: string;
  mimeType: string;
  relativePublishRootPath: string;
  relativeArchivePath: string;
  sizeBytes: number;
  bytesBase64: string;
  manifest: Record<string, unknown>;
  artifacts: MagicStudioFilmStoryboardPublishArtifact[];
  validation?: MagicStudioFilmProjectValidation;
}

export interface MagicStudioFilmExportPackageRequest {
  fileName?: string;
  includeAssetInventory?: boolean;
}

export type MagicStudioFilmImportSourceKind =
  | 'project-json'
  | 'package-zip'
  | 'project-document';

export type MagicStudioFilmImportConflictPolicy = 'rename' | 'replace';

export interface MagicStudioFilmImportPackageRequest {
  sourceKind?: MagicStudioFilmImportSourceKind;
  fileName?: string;
  mimeType?: string;
  bytesBase64?: string;
  project?: FilmProject;
  conflictPolicy?: MagicStudioFilmImportConflictPolicy;
}

export interface MagicStudioFilmExportPackageFile {
  relativePath: string;
  kind: 'project-json' | 'manifest-json' | 'asset-inventory-json';
  sizeBytes?: number | null;
}

export interface MagicStudioFilmExportPackage {
  exportId: string;
  projectId: string;
  projectUuid: string;
  projectName: string;
  fileName: string;
  mimeType: string;
  relativeExportRootPath: string;
  relativeArchivePath: string;
  sizeBytes: number;
  bytesBase64: string;
  manifest: Record<string, unknown>;
  files: MagicStudioFilmExportPackageFile[];
}

export interface MagicStudioFilmImportPackage {
  importId: string;
  sourceKind: MagicStudioFilmImportSourceKind;
  conflictPolicy: MagicStudioFilmImportConflictPolicy;
  fileName?: string;
  mimeType?: string;
  projectId: string;
  projectUuid: string;
  projectName: string;
  importedAt: number;
  manifest?: Record<string, unknown>;
  warnings: string[];
  project: FilmProject;
}

export type MagicStudioFilmValidationSeverity = 'error' | 'warning';

export interface MagicStudioFilmValidationIssue {
  severity: MagicStudioFilmValidationSeverity;
  code: string;
  path: string;
  message: string;
  suggestion?: string | null;
}

export interface MagicStudioFilmValidationSummary {
  errorCount: number;
  warningCount: number;
  duplicateEntityCount: number;
  unresolvedReferenceCount: number;
  orphanShotCount: number;
}

export interface MagicStudioFilmProjectCounts {
  characters: number;
  locations: number;
  props: number;
  scenes: number;
  shots: number;
  media: number;
}

export interface MagicStudioFilmProjectValidateRequest {
  projectId?: string;
  project?: FilmProject;
  includeNormalizedProject?: boolean;
}

export interface MagicStudioFilmProjectValidation {
  valid: boolean;
  source: 'stored-project' | 'inline-project';
  projectId: string;
  projectUuid: string;
  projectName: string;
  summary: MagicStudioFilmValidationSummary;
  counts: MagicStudioFilmProjectCounts;
  issues: MagicStudioFilmValidationIssue[];
  normalizedProject?: FilmProject;
}

export interface MagicStudioFilmScriptStandardizeRequest {
  includeValidation?: boolean;
}

export interface MagicStudioFilmScriptStandardizeSummary {
  changed: boolean;
  lineCountBefore: number;
  lineCountAfter: number;
  sceneHeadingCount: number;
  dialogueCueCount: number;
}

export interface MagicStudioFilmScriptStandardizeResult {
  project: FilmProject;
  summary: MagicStudioFilmScriptStandardizeSummary;
  validation?: MagicStudioFilmProjectValidation;
}

export interface MagicStudioFilmPrepareAnalysisRequest {
  language?: string;
  replaceShots?: boolean;
  includeValidation?: boolean;
}

export interface MagicStudioFilmPrepareAnalysisSummary {
  standardizedScript: MagicStudioFilmScriptStandardizeSummary;
  analysis: MagicStudioFilmRefreshAnalysisSummary;
}

export interface MagicStudioFilmPrepareAnalysisResult {
  project: FilmProject;
  summary: MagicStudioFilmPrepareAnalysisSummary;
  validation?: MagicStudioFilmProjectValidation;
}

export interface MagicStudioFilmRebuildStoryboardRequest {
  language?: string;
  maxShotsPerScene?: number;
  includeEstablishingShot?: boolean;
  includeValidation?: boolean;
}

export interface MagicStudioFilmRebuildStoryboardSummary {
  standardizedScript: MagicStudioFilmScriptStandardizeSummary;
  analysis: MagicStudioFilmRefreshAnalysisSummary;
  sceneCount: number;
  shotCount: number;
}

export interface MagicStudioFilmRebuildStoryboardResult {
  project: FilmProject;
  summary: MagicStudioFilmRebuildStoryboardSummary;
  validation?: MagicStudioFilmProjectValidation;
}

export interface MagicStudioFilmCreateSceneBreakdownRequest {
  language?: string;
  refreshAnalysis?: boolean;
  includeValidation?: boolean;
}

export interface MagicStudioFilmCreateSceneBreakdownSummary {
  analysisRefreshed: boolean;
  breakdown: FilmSceneBreakdownSummary;
}

export interface MagicStudioFilmCreateSceneBreakdownResult {
  project: FilmProject;
  summary: MagicStudioFilmCreateSceneBreakdownSummary;
  validation?: MagicStudioFilmProjectValidation;
}

export interface MagicStudioFilmGenerateShotVariantsRequest {
  sceneUuids?: string[];
  strategies?: FilmShotVariantStrategy[];
  variantCountPerScene?: number;
  replaceExisting?: boolean;
  includeValidation?: boolean;
}

export interface MagicStudioFilmGenerateShotVariantsSummary {
  replacedExisting: boolean;
  generated: FilmShotVariantSummary;
}

export interface MagicStudioFilmGenerateShotVariantsResult {
  project: FilmProject;
  summary: MagicStudioFilmGenerateShotVariantsSummary;
  validation?: MagicStudioFilmProjectValidation;
}

export interface MagicStudioFilmCreateShootingPlanRequest {
  maxScenesPerDay?: number;
  groupByLocation?: boolean;
  splitByTimeOfDay?: boolean;
  preferShotVariants?: boolean;
  includeValidation?: boolean;
}

export interface MagicStudioFilmCreateShootingPlanSummary {
  groupedByLocation: boolean;
  splitByTimeOfDay: boolean;
  usedShotVariants: boolean;
  plan: FilmShootingPlanSummary;
}

export interface MagicStudioFilmCreateShootingPlanResult {
  project: FilmProject;
  summary: MagicStudioFilmCreateShootingPlanSummary;
  validation?: MagicStudioFilmProjectValidation;
}

export type MagicStudioFilmAuthoringCommand =
  | 'standardize-script'
  | 'hydrate-analysis'
  | 'reindex-scenes'
  | 'generate-storyboard'
  | 'sync-shots';

export interface MagicStudioFilmAuthoringBatchCommandRequest {
  command: MagicStudioFilmAuthoringCommand;
  language?: string;
  replaceShots?: boolean;
  maxShotsPerScene?: number;
  includeEstablishingShot?: boolean;
  regenerateShotNumbers?: boolean;
  fillSceneBindings?: boolean;
}

export interface MagicStudioFilmAuthoringBatchRequest {
  commands: MagicStudioFilmAuthoringBatchCommandRequest[];
  includeValidation?: boolean;
}

export interface MagicStudioFilmAuthoringBatchCommandResult {
  command: MagicStudioFilmAuthoringCommand;
  applied: boolean;
  message: string;
  counts: MagicStudioFilmProjectCounts;
}

export interface MagicStudioFilmAuthoringBatchResult {
  project: FilmProject;
  results: MagicStudioFilmAuthoringBatchCommandResult[];
  validation?: MagicStudioFilmProjectValidation;
}

export interface MagicStudioFilmRefreshAnalysisRequest {
  language?: string;
  replaceShots?: boolean;
  regenerateStoryboard?: boolean;
  includeValidation?: boolean;
}

export interface MagicStudioFilmRefreshAnalysisSummary {
  counts: MagicStudioFilmProjectCounts;
  storyboardRegenerated: boolean;
  shotsCleared: boolean;
  shotsSynchronized: boolean;
}

export interface MagicStudioFilmRefreshAnalysisResult {
  project: FilmProject;
  summary: MagicStudioFilmRefreshAnalysisSummary;
  validation?: MagicStudioFilmProjectValidation;
}
