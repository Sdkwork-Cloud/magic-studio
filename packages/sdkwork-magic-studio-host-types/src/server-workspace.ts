import type {
  ProjectType,
  StudioProjectReleaseTarget,
} from '@sdkwork/magic-studio-types/workspace';

export const MAGIC_STUDIO_WORKSPACE_PROJECT_TYPES = [
  'APP',
  'VIDEO',
  'AUDIO',
  'FILM',
  'CANVAS',
  'NOTES',
  'CUT',
] as const satisfies readonly ProjectType[];

export const MAGIC_STUDIO_PROJECT_RELEASE_TARGETS = [
  'WEB_STATIC',
  'VERCEL',
  'NETLIFY',
  'CLOUDFLARE_PAGES',
] as const satisfies readonly StudioProjectReleaseTarget[];

export type MagicStudioProjectType = ProjectType;
export type MagicStudioProjectReleaseTargetValue = StudioProjectReleaseTarget;

export interface MagicStudioWorkspaceCreateRequest {
  name: string;
  description?: string;
  icon?: string;
}

export interface MagicStudioWorkspaceUpdateRequest {
  name?: string;
  description?: string;
  icon?: string;
}

export interface MagicStudioProjectCreateRequest {
  name: string;
  type: ProjectType;
  description?: string;
  thumbnailUrl?: string;
}

export interface MagicStudioProjectUpdateRequest {
  name?: string;
  type?: ProjectType;
  description?: string;
  thumbnailUrl?: string;
}

export interface MagicStudioProjectSessionOpenFileInput {
  path: string;
  isPreview?: boolean;
}

export interface MagicStudioProjectSessionUpsertRequest {
  openFiles: MagicStudioProjectSessionOpenFileInput[];
  activeFilePath?: string | null;
  selectedPath?: string | null;
  expandedPaths?: string[];
}

export interface MagicStudioProjectGitSyncRequest {
  repository: string;
  branch: string;
  token?: string;
  message?: string;
}

export interface MagicStudioProjectGitSyncRetryRequest {
  token?: string;
  message?: string;
}

export interface MagicStudioProjectReleaseCreateRequest {
  appName: string;
  version: string;
  target: StudioProjectReleaseTarget;
  autoDeploy?: boolean;
}

export interface MagicStudioProjectReleasePruneRequest {
  dryRun?: boolean;
  releaseIds?: string[];
}

export interface MagicStudioProjectReleaseRetentionPolicyRequest {
  enabled: boolean;
  keepLatestCount: number;
  maxDeletedCount?: number | null;
  pruneDeletedOlderThanDays?: number | null;
  autoApplyOnCreate: boolean;
}

export interface MagicStudioProjectReleaseRetentionPolicyApplyRequest {
  dryRun?: boolean;
}
