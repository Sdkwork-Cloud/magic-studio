import type { BaseEntity, EntityTimestamp } from './base.types.ts';
import type { ImageMediaResource } from './media.types.ts';

export type ProjectType = 'APP' | 'VIDEO' | 'AUDIO' | 'FILM' | 'CANVAS' | 'NOTES' | 'CUT';

export type StudioProjectGitSyncStatus = 'SUCCEEDED' | 'NO_CHANGES' | 'FAILED';

export type StudioProjectReleaseStatus = 'READY' | 'FAILED';

export type StudioProjectReleaseTarget =
  | 'WEB_STATIC'
  | 'VERCEL'
  | 'NETLIFY'
  | 'CLOUDFLARE_PAGES';

export interface StudioProjectSessionOpenFile {
  path: string;
  isPreview?: boolean;
}

export interface StudioProjectSession extends BaseEntity {
  id: string;
  uuid: string;
  workspaceId: string;
  projectId: string;
  openFiles: StudioProjectSessionOpenFile[];
  activeFilePath?: string | null;
  selectedPath?: string | null;
  expandedPaths: string[];
}

export interface StudioProjectSessionSnapshot {
  session: StudioProjectSession | null;
}

export interface StudioProjectGitSyncRecord extends BaseEntity {
  id: string;
  uuid: string;
  workspaceId: string;
  projectId: string;
  retryOfSyncId?: string | null;
  repository: string;
  branch: string;
  status: StudioProjectGitSyncStatus;
  commitHash?: string | null;
  message?: string | null;
  syncedAt?: string | null;
  errorMessage?: string | null;
}

export interface StudioProjectReleaseRecord extends BaseEntity {
  id: string;
  uuid: string;
  workspaceId: string;
  projectId: string;
  rebuildOfReleaseId?: string | null;
  appName: string;
  version: string;
  target: StudioProjectReleaseTarget;
  status: StudioProjectReleaseStatus;
  artifactFileName: string;
  artifactPath: string;
  checksumSha1: string;
  sizeBytes: number;
  includedFileCount: number;
  errorMessage?: string | null;
}

export interface StudioProjectReleaseManifestEntry {
  path: string;
  sizeBytes: number;
  checksumSha1: string;
}

export interface StudioProjectReleaseManifest {
  release: StudioProjectReleaseRecord;
  entries: StudioProjectReleaseManifestEntry[];
}

export interface StudioProjectReleaseStats {
  workspaceId: string;
  projectId: string;
  totalCount: number;
  activeCount: number;
  deletedCount: number;
  totalSizeBytes: number;
  activeSizeBytes: number;
  deletedSizeBytes: number;
  latestReleaseId?: string | null;
  latestActiveReleaseId?: string | null;
  latestDeletedReleaseId?: string | null;
}

export interface StudioProjectReleasePruneResult {
  workspaceId: string;
  projectId: string;
  dryRun: boolean;
  prunedReleaseIds: string[];
  prunedCount: number;
  reclaimedBytes: number;
  remainingStats: StudioProjectReleaseStats;
}

export interface StudioProjectReleaseRetentionPolicy {
  workspaceId: string;
  projectId: string;
  enabled: boolean;
  keepLatestCount: number;
  maxDeletedCount?: number | null;
  pruneDeletedOlderThanDays?: number | null;
  autoApplyOnCreate: boolean;
  createdAt?: EntityTimestamp | null;
  updatedAt?: EntityTimestamp | null;
  lastAppliedAt?: EntityTimestamp | null;
}

export interface StudioProjectReleaseRetentionPolicyApplyResult {
  workspaceId: string;
  projectId: string;
  dryRun: boolean;
  policy: StudioProjectReleaseRetentionPolicy;
  deletedReleaseIds: string[];
  prunedReleaseIds: string[];
  deletedCount: number;
  prunedCount: number;
  reclaimedBytes: number;
  statsBefore: StudioProjectReleaseStats;
  statsAfter: StudioProjectReleaseStats;
}

export interface StudioProject extends BaseEntity {
  id: string;
  uuid: string;
  name: string;
  type: ProjectType;
  description: string;
  workspaceId: string;
  path?: string;
  thumbnailUrl?: string;
  coverImage?: ImageMediaResource;
  archivedAt?: string | null;
  lastOpenedAt?: string | number | null;
}

export interface StudioWorkspace extends BaseEntity {
  id: string;
  uuid: string;
  name: string;
  description?: string;
  projects: StudioProject[];
  path?: string;
  icon?: string;
}
