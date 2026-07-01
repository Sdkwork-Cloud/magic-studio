import type { MagicStudioRuntimeMode } from './host.ts';
import type { MagicStudioPluginManifest } from './plugin-manifest.ts';
import type { MagicStudioServerDeploymentFamily } from './server-runtime.ts';
import type {
  MagicStudioAppCapabilityAdapterStatus,
  MagicStudioAppExecutionStatus,
} from './server-capability.ts';
import type {
  StudioProjectReleaseRetentionPolicy,
  StudioProjectReleaseStats,
} from '@sdkwork/magic-studio-types/workspace';

export const MAGIC_STUDIO_ADMIN_POLICY_RISK_LEVELS = [
  'low',
  'guarded',
  'elevated',
] as const;

export const MAGIC_STUDIO_ADMIN_STORAGE_PROVIDER_KINDS = [
  'directory',
  'file',
] as const;

export const MAGIC_STUDIO_ADMIN_EXECUTION_PROVIDER_HEALTH_STATUSES = [
  'healthy',
  'degraded',
  'blocked',
] as const;

export const MAGIC_STUDIO_ADMIN_EXECUTION_FAILURE_SEVERITIES = [
  'warning',
  'critical',
] as const;

export const MAGIC_STUDIO_ADMIN_EXECUTION_RETRY_OUTCOMES = [
  'resolved',
  'still-blocked',
] as const;

export const MAGIC_STUDIO_ADMIN_WORKSPACE_RELEASE_RETENTION_RUN_STATUSES = [
  'SUCCEEDED',
  'PARTIAL',
  'FAILED',
] as const;

export const MAGIC_STUDIO_ADMIN_WORKSPACE_RELEASE_RETENTION_PROJECT_RUN_STATUSES = [
  'APPLIED',
  'SKIPPED',
  'FAILED',
] as const;

export type MagicStudioAdminPolicyRiskLevel =
  (typeof MAGIC_STUDIO_ADMIN_POLICY_RISK_LEVELS)[number];

export type MagicStudioAdminStorageProviderKind =
  (typeof MAGIC_STUDIO_ADMIN_STORAGE_PROVIDER_KINDS)[number];

export type MagicStudioAdminExecutionProviderHealthStatus =
  (typeof MAGIC_STUDIO_ADMIN_EXECUTION_PROVIDER_HEALTH_STATUSES)[number];

export type MagicStudioAdminExecutionFailureSeverity =
  (typeof MAGIC_STUDIO_ADMIN_EXECUTION_FAILURE_SEVERITIES)[number];

export type MagicStudioAdminExecutionRetryOutcome =
  (typeof MAGIC_STUDIO_ADMIN_EXECUTION_RETRY_OUTCOMES)[number];

export type MagicStudioAdminWorkspaceReleaseRetentionRunStatus =
  (typeof MAGIC_STUDIO_ADMIN_WORKSPACE_RELEASE_RETENTION_RUN_STATUSES)[number];

export type MagicStudioAdminWorkspaceReleaseRetentionProjectRunStatus =
  (typeof MAGIC_STUDIO_ADMIN_WORKSPACE_RELEASE_RETENTION_PROJECT_RUN_STATUSES)[number];

export interface MagicStudioAdminRuntimeRouteCounts {
  core: number;
  app: number;
  admin: number;
  total: number;
}

export interface MagicStudioAdminRuntimeDomainCounts {
  canonical: number;
  planned: number;
  packageLocal: number;
}

export interface MagicStudioAdminRuntimeExecutionCounts {
  ready: number;
  mixed: number;
  lifecycleOnly: number;
  planned: number;
}

export interface MagicStudioAdminRuntimeAudit {
  deploymentFamily: MagicStudioServerDeploymentFamily;
  runtimeMode: MagicStudioRuntimeMode;
  host: string;
  port: number;
  apiBaseUrl: string;
  apiVersion: string;
  openApiVersion: string;
  runtimeOs: string;
  runtimeArch: string;
  docsPath: string;
  openApiPath: string;
  dataRoot: string;
  routeCounts: MagicStudioAdminRuntimeRouteCounts;
  domainCounts: MagicStudioAdminRuntimeDomainCounts;
  executionCounts: MagicStudioAdminRuntimeExecutionCounts;
}

export interface MagicStudioAdminJobMetrics {
  total: number;
  pending: number;
  running: number;
  succeeded: number;
  failed: number;
  cancelled: number;
  toolkitJobs: number;
  latestCreatedAtMs: number | null;
  latestUpdatedAtMs: number | null;
}

export interface MagicStudioAdminPolicyAudit {
  riskLevel: MagicStudioAdminPolicyRiskLevel;
  allowDangerousCommands: boolean;
  allowSystemPaths: boolean;
  blockedCommandCount: number;
  blockedPathPrefixCount: number;
  preferredWorkRootCount: number;
  blockedCommands: string[];
  blockedPathPrefixes: string[];
  preferredWorkRoots: string[];
}

export interface MagicStudioAdminStorageProvider {
  key: string;
  name: string;
  kind: MagicStudioAdminStorageProviderKind;
  scope: string;
  path: string;
  exists: boolean;
}

export interface MagicStudioAdminExecutionProvider {
  key: string;
  name: string;
  domain: string;
  pathPrefix: string;
  routeIds: string[];
  operations: string[];
  routeCount: number;
  operationCount: number;
  readyOperationCount: number;
  blockedOperationCount: number;
  executionStatus: MagicStudioAppExecutionStatus;
  adapterStatus: MagicStudioAppCapabilityAdapterStatus;
  description: string;
}

export interface MagicStudioAdminExecutionProviderHealth {
  key: string;
  name: string;
  domain: string;
  status: MagicStudioAdminExecutionProviderHealthStatus;
  executionStatus: MagicStudioAppExecutionStatus;
  adapterStatus: MagicStudioAppCapabilityAdapterStatus;
  operationCount: number;
  readyOperationCount: number;
  blockedOperationCount: number;
  blockedOperations: string[];
  lastEvaluatedAt: string;
}

export interface MagicStudioAdminExecutionFailureAcknowledgement {
  actor: string;
  note?: string | null;
  acknowledgedAt: string;
}

export interface MagicStudioAdminExecutionFailureRetry {
  actor: string;
  note?: string | null;
  requestedAt: string;
  outcome: MagicStudioAdminExecutionRetryOutcome;
}

export interface MagicStudioAdminExecutionFailure {
  id: string;
  providerKey: string;
  providerName: string;
  domain: string;
  operationKey: string;
  executionStatus: MagicStudioAppExecutionStatus;
  adapterStatus: MagicStudioAppCapabilityAdapterStatus;
  severity: MagicStudioAdminExecutionFailureSeverity;
  message: string;
  acknowledged: boolean;
  acknowledgement?: MagicStudioAdminExecutionFailureAcknowledgement | null;
  retryCount: number;
  lastRetry?: MagicStudioAdminExecutionFailureRetry | null;
}

export interface MagicStudioAdminExecutionProviderReconciliation {
  actor: string;
  note?: string | null;
  reconciledAt: string;
  healthStatus: MagicStudioAdminExecutionProviderHealthStatus;
  activeFailureCount: number;
}

export interface MagicStudioAdminExecutionProviderDetail {
  provider: MagicStudioAdminExecutionProvider;
  health: MagicStudioAdminExecutionProviderHealth;
  failures: MagicStudioAdminExecutionFailure[];
  activeFailureCount: number;
  acknowledgedFailureCount: number;
  lastReconciliation?: MagicStudioAdminExecutionProviderReconciliation | null;
}

export interface MagicStudioAdminExecutionProviderReconcileRequest {
  actor?: string;
  note?: string;
}

export interface MagicStudioAdminExecutionFailureAcknowledgeRequest {
  actor?: string;
  note?: string;
}

export interface MagicStudioAdminExecutionFailureRetryRequest {
  actor?: string;
  note?: string;
}

export interface MagicStudioAdminExecutionFailureRetryResult {
  failureId: string;
  providerKey: string;
  outcome: MagicStudioAdminExecutionRetryOutcome;
  retry: MagicStudioAdminExecutionFailureRetry;
  failure?: MagicStudioAdminExecutionFailure | null;
  providerHealth: MagicStudioAdminExecutionProviderHealth;
}

export interface MagicStudioAdminWorkspaceReleaseRetentionRunRequest {
  dryRun?: boolean;
  workspaceIds?: string[];
  projectIds?: string[];
}

export interface MagicStudioAdminWorkspaceReleaseRetentionRunScope {
  workspaceIds: string[];
  projectIds: string[];
}

export interface MagicStudioAdminWorkspaceReleaseRetentionProjectRun {
  workspaceId: string;
  workspaceName: string;
  projectId: string;
  projectName: string;
  status: MagicStudioAdminWorkspaceReleaseRetentionProjectRunStatus;
  message?: string | null;
  policy?: StudioProjectReleaseRetentionPolicy | null;
  statsBefore?: StudioProjectReleaseStats | null;
  statsAfter?: StudioProjectReleaseStats | null;
  deletedReleaseIds: string[];
  prunedReleaseIds: string[];
  deletedCount: number;
  prunedCount: number;
  reclaimedBytes: number;
}

export interface MagicStudioAdminWorkspaceReleaseRetentionRun {
  id: string;
  status: MagicStudioAdminWorkspaceReleaseRetentionRunStatus;
  dryRun: boolean;
  scope: MagicStudioAdminWorkspaceReleaseRetentionRunScope;
  workspaceCount: number;
  projectCount: number;
  appliedProjectCount: number;
  skippedProjectCount: number;
  failedProjectCount: number;
  deletedCount: number;
  prunedCount: number;
  reclaimedBytes: number;
  startedAt: string;
  finishedAt: string;
}

export interface MagicStudioAdminWorkspaceReleaseRetentionRunDetail
  extends MagicStudioAdminWorkspaceReleaseRetentionRun {
  results: MagicStudioAdminWorkspaceReleaseRetentionProjectRun[];
}

export interface MagicStudioAdminWorkspaceReleaseRetentionSchedule {
  id: string;
  name: string;
  enabled: boolean;
  dryRun: boolean;
  intervalMinutes: number;
  scope: MagicStudioAdminWorkspaceReleaseRetentionRunScope;
  lastRunId?: string | null;
  lastRunStatus?: MagicStudioAdminWorkspaceReleaseRetentionRunStatus | null;
  lastStartedAt?: string | null;
  lastFinishedAt?: string | null;
  nextRunAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MagicStudioAdminWorkspaceReleaseRetentionScheduleCreateRequest {
  name: string;
  enabled?: boolean;
  dryRun?: boolean;
  intervalMinutes?: number;
  workspaceIds?: string[];
  projectIds?: string[];
}

export interface MagicStudioAdminWorkspaceReleaseRetentionScheduleUpdateRequest {
  name?: string;
  enabled?: boolean;
  dryRun?: boolean;
  intervalMinutes?: number;
  workspaceIds?: string[];
  projectIds?: string[];
}

export interface MagicStudioAdminWorkspaceReleaseRetentionScheduleTriggerRequest {
  dryRun?: boolean;
}

export interface MagicStudioAdminWorkspaceReleaseRetentionScheduleTriggerResult {
  schedule: MagicStudioAdminWorkspaceReleaseRetentionSchedule;
  run: MagicStudioAdminWorkspaceReleaseRetentionRunDetail;
}

export interface MagicStudioAdminPluginRecord {
  id: string;
  name: string;
  version: string;
  kind: MagicStudioPluginManifest['kind'];
  enabled: boolean;
  routePrefix: string;
  capabilitySet: MagicStudioPluginManifest['capabilitySet'];
  permissions: MagicStudioPluginManifest['permissions'];
  updatedAt: string;
}
