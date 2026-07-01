export const MAGIC_STUDIO_SERVER_HEALTH_STATUSES = ['ok'] as const;

export const MAGIC_STUDIO_POLICY_ACCESS_TYPES = ['read', 'write', 'ensureDir'] as const;

export const MAGIC_STUDIO_TOOLKIT_JOB_KINDS = ['toolkit'] as const;

export const MAGIC_STUDIO_TOOLKIT_JOB_STATUSES = [
  'pending',
  'running',
  'succeeded',
  'failed',
  'cancelled',
] as const;

export type MagicStudioServerHealthStatusValue =
  (typeof MAGIC_STUDIO_SERVER_HEALTH_STATUSES)[number];

export type MagicStudioPolicyAccessType = (typeof MAGIC_STUDIO_POLICY_ACCESS_TYPES)[number];

export type MagicStudioToolkitJobKind = (typeof MAGIC_STUDIO_TOOLKIT_JOB_KINDS)[number];

export type MagicStudioToolkitJobStatus = (typeof MAGIC_STUDIO_TOOLKIT_JOB_STATUSES)[number];

export interface MagicStudioServerHealthStatus {
  service: 'magic-studio-server';
  status: MagicStudioServerHealthStatusValue;
}

export interface MagicStudioToolkitCapabilityMatrix {
  mediaProbeAvailable: boolean;
  imageProcessing: boolean;
  videoProcessing: boolean;
  audioProcessing: boolean;
  compression: boolean;
  fileSystem: boolean;
  audioRecording: boolean;
  screenRecording: boolean;
  sqliteEmbedded: boolean;
  runtimeOs: string;
  runtimeArch: string;
}

export interface MagicStudioPolicyValidationPayload {
  access?: MagicStudioPolicyAccessType;
  name?: string;
  path?: string;
}

export interface MagicStudioPolicyPathValidationRequest {
  access: MagicStudioPolicyAccessType;
  path: string;
}

export interface MagicStudioPolicyCommandValidationRequest {
  name: string;
}

export interface MagicStudioPolicyValidationResult {
  allowed: boolean;
  code?: string | null;
  reason?: string | null;
  matchedRule?: string | null;
}

export interface MagicStudioPolicySnapshot {
  allowDangerousCommands: boolean;
  allowSystemPaths: boolean;
  blockedCommands: string[];
  blockedPathPrefixes: string[];
  preferredWorkRoots: string[];
}

export interface MagicStudioMigrationScript {
  version: number;
  name: string;
  sql: string;
  checksum?: string | null;
}

export interface MagicStudioMigrationPlan {
  dryRun?: boolean;
  scripts: MagicStudioMigrationScript[];
}

export interface MagicStudioMigrationStatusRequest {
  dbPath: string;
}

export interface MagicStudioMigrationApplyRequest {
  dbPath: string;
  plan: MagicStudioMigrationPlan;
}

export interface MagicStudioAppliedMigration {
  version: number;
  name: string;
  checksum: string;
  appliedAtMs: number;
}

export interface MagicStudioMigrationStatus {
  currentVersion: number;
  migrations: MagicStudioAppliedMigration[];
}

export interface MagicStudioMigrationApplyResult {
  fromVersion: number;
  toVersion: number;
  appliedVersions: number[];
  skippedVersions: number[];
  dryRun: boolean;
}

export interface MagicStudioToolkitFrameworkError {
  code: string;
  message: string;
}

export interface MagicStudioToolkitCommandResult {
  code: number;
  stdout: string;
  stderr: string;
}

export interface MagicStudioToolkitOperationResult {
  operation: string;
  command?: MagicStudioToolkitCommandResult | null;
  probe?: Record<string, unknown> | null;
  archiveBytes?: number[] | null;
  notes?: string | null;
}

export interface MagicStudioToolkitJobSnapshot {
  id: string;
  kind: MagicStudioToolkitJobKind;
  operation: string;
  status: MagicStudioToolkitJobStatus;
  progress: number;
  stage?: string | null;
  createdAtMs: number;
  updatedAtMs: number;
  error?: MagicStudioToolkitFrameworkError | null;
  result?: MagicStudioToolkitOperationResult | null;
}
