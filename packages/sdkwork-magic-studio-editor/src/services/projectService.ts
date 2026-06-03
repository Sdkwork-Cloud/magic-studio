import {
  readDefaultPlatformRuntime,
  resolveRuntimeMagicStudioServerHostDescriptor,
} from '@sdkwork/magic-studio-core/sdk';
import type {
  StudioProjectGitSyncRecord,
  StudioProjectReleaseManifest,
  StudioProjectReleaseRetentionPolicy,
  StudioProjectReleaseRetentionPolicyApplyResult,
  StudioProjectReleasePruneResult,
  StudioProjectReleaseRecord,
  StudioProjectReleaseStats,
} from '@sdkwork/magic-studio-types/workspace';
import { workspaceBusinessService } from '@sdkwork/magic-studio-workspace';

import type {
  EditorProjectGovernanceScope,
  GitSyncOptions,
  PublishOptions,
} from '../types';

const PROJECT_SERVICE_FEATURE_NAME = 'ProjectService';

function requireProjectGovernanceScope(
  scope: EditorProjectGovernanceScope | null | undefined,
): EditorProjectGovernanceScope {
  if (
    !scope ||
    !scope.workspaceId?.trim() ||
    !scope.projectId?.trim() ||
    !scope.projectRootPath?.trim()
  ) {
    throw new Error(
      '[ProjectService] Project governance actions require a canonical workspace project scope.',
    );
  }

  return scope;
}

function toRuntimeAbsoluteUrl(path: string): string {
  const runtime = readDefaultPlatformRuntime(PROJECT_SERVICE_FEATURE_NAME);
  const host = resolveRuntimeMagicStudioServerHostDescriptor(runtime);
  return `${host.apiBaseUrl}${path}`;
}

export const projectService = {
  syncProjectToGit: async (
    scope: EditorProjectGovernanceScope,
    options: GitSyncOptions,
  ): Promise<StudioProjectGitSyncRecord> => {
    const projectScope = requireProjectGovernanceScope(scope);
    const result = await workspaceBusinessService.syncProjectToGit(
      projectScope.workspaceId,
      projectScope.projectId,
      options,
    );

    if (!result.success || !result.data) {
      throw new Error(result.message || 'Failed to sync project to git');
    }

    return result.data;
  },

  listProjectGitSyncs: async (
    scope: EditorProjectGovernanceScope,
  ): Promise<StudioProjectGitSyncRecord[]> => {
    const projectScope = requireProjectGovernanceScope(scope);
    const result = await workspaceBusinessService.listProjectGitSyncs(
      projectScope.workspaceId,
      projectScope.projectId,
    );

    if (!result.success || !result.data) {
      throw new Error(result.message || 'Failed to list project git syncs');
    }

    return result.data;
  },

  readLatestProjectGitSync: async (
    scope: EditorProjectGovernanceScope,
  ): Promise<StudioProjectGitSyncRecord> => {
    const projectScope = requireProjectGovernanceScope(scope);
    const result = await workspaceBusinessService.readLatestProjectGitSync(
      projectScope.workspaceId,
      projectScope.projectId,
    );

    if (!result.success || !result.data) {
      throw new Error(result.message || 'Failed to read latest project git sync');
    }

    return result.data;
  },

  readProjectGitSync: async (
    scope: EditorProjectGovernanceScope,
    syncId: string,
  ): Promise<StudioProjectGitSyncRecord> => {
    const projectScope = requireProjectGovernanceScope(scope);
    const result = await workspaceBusinessService.readProjectGitSync(
      projectScope.workspaceId,
      projectScope.projectId,
      syncId,
    );

    if (!result.success || !result.data) {
      throw new Error(result.message || 'Failed to read project git sync');
    }

    return result.data;
  },

  retryProjectGitSync: async (
    scope: EditorProjectGovernanceScope,
    syncId: string,
    options: {
      token?: string;
      message?: string;
    } = {},
  ): Promise<StudioProjectGitSyncRecord> => {
    const projectScope = requireProjectGovernanceScope(scope);
    const result = await workspaceBusinessService.retryProjectGitSync(
      projectScope.workspaceId,
      projectScope.projectId,
      syncId,
      options,
    );

    if (!result.success || !result.data) {
      throw new Error(result.message || 'Failed to retry project git sync');
    }

    return result.data;
  },

  createProjectRelease: async (
    scope: EditorProjectGovernanceScope,
    options: PublishOptions,
  ): Promise<StudioProjectReleaseRecord> => {
    const projectScope = requireProjectGovernanceScope(scope);
    const result = await workspaceBusinessService.createProjectRelease(
      projectScope.workspaceId,
      projectScope.projectId,
      options,
    );

    if (!result.success || !result.data) {
      throw new Error(result.message || 'Failed to create project release');
    }

    return result.data;
  },

  listProjectReleases: async (
    scope: EditorProjectGovernanceScope,
  ): Promise<StudioProjectReleaseRecord[]> => {
    const projectScope = requireProjectGovernanceScope(scope);
    const result = await workspaceBusinessService.listProjectReleases(
      projectScope.workspaceId,
      projectScope.projectId,
    );

    if (!result.success || !result.data) {
      throw new Error(result.message || 'Failed to list project releases');
    }

    return result.data;
  },

  readProjectReleaseStats: async (
    scope: EditorProjectGovernanceScope,
  ): Promise<StudioProjectReleaseStats> => {
    const projectScope = requireProjectGovernanceScope(scope);
    const result = await workspaceBusinessService.readProjectReleaseStats(
      projectScope.workspaceId,
      projectScope.projectId,
    );

    if (!result.success || !result.data) {
      throw new Error(result.message || 'Failed to read project release stats');
    }

    return result.data;
  },

  pruneProjectReleases: async (
    scope: EditorProjectGovernanceScope,
    options: {
      dryRun?: boolean;
      releaseIds?: string[];
    } = {},
  ): Promise<StudioProjectReleasePruneResult> => {
    const projectScope = requireProjectGovernanceScope(scope);
    const result = await workspaceBusinessService.pruneProjectReleases(
      projectScope.workspaceId,
      projectScope.projectId,
      options,
    );

    if (!result.success || !result.data) {
      throw new Error(result.message || 'Failed to prune project releases');
    }

    return result.data;
  },

  readProjectReleaseRetentionPolicy: async (
    scope: EditorProjectGovernanceScope,
  ): Promise<StudioProjectReleaseRetentionPolicy> => {
    const projectScope = requireProjectGovernanceScope(scope);
    const result = await workspaceBusinessService.readProjectReleaseRetentionPolicy(
      projectScope.workspaceId,
      projectScope.projectId,
    );

    if (!result.success || !result.data) {
      throw new Error(result.message || 'Failed to read project release retention policy');
    }

    return result.data;
  },

  updateProjectReleaseRetentionPolicy: async (
    scope: EditorProjectGovernanceScope,
    options: {
      enabled: boolean;
      keepLatestCount: number;
      maxDeletedCount?: number | null;
      pruneDeletedOlderThanDays?: number | null;
      autoApplyOnCreate: boolean;
    },
  ): Promise<StudioProjectReleaseRetentionPolicy> => {
    const projectScope = requireProjectGovernanceScope(scope);
    const result = await workspaceBusinessService.updateProjectReleaseRetentionPolicy(
      projectScope.workspaceId,
      projectScope.projectId,
      options,
    );

    if (!result.success || !result.data) {
      throw new Error(result.message || 'Failed to update project release retention policy');
    }

    return result.data;
  },

  applyProjectReleaseRetentionPolicy: async (
    scope: EditorProjectGovernanceScope,
    options: {
      dryRun?: boolean;
    } = {},
  ): Promise<StudioProjectReleaseRetentionPolicyApplyResult> => {
    const projectScope = requireProjectGovernanceScope(scope);
    const result = await workspaceBusinessService.applyProjectReleaseRetentionPolicy(
      projectScope.workspaceId,
      projectScope.projectId,
      options,
    );

    if (!result.success || !result.data) {
      throw new Error(result.message || 'Failed to apply project release retention policy');
    }

    return result.data;
  },

  readLatestProjectRelease: async (
    scope: EditorProjectGovernanceScope,
  ): Promise<StudioProjectReleaseRecord> => {
    const projectScope = requireProjectGovernanceScope(scope);
    const result = await workspaceBusinessService.readLatestProjectRelease(
      projectScope.workspaceId,
      projectScope.projectId,
    );

    if (!result.success || !result.data) {
      throw new Error(result.message || 'Failed to read latest project release');
    }

    return result.data;
  },

  readProjectRelease: async (
    scope: EditorProjectGovernanceScope,
    releaseId: string,
  ): Promise<StudioProjectReleaseRecord> => {
    const projectScope = requireProjectGovernanceScope(scope);
    const result = await workspaceBusinessService.readProjectRelease(
      projectScope.workspaceId,
      projectScope.projectId,
      releaseId,
    );

    if (!result.success || !result.data) {
      throw new Error(result.message || 'Failed to read project release');
    }

    return result.data;
  },

  deleteProjectRelease: async (
    scope: EditorProjectGovernanceScope,
    releaseId: string,
  ): Promise<StudioProjectReleaseRecord> => {
    const projectScope = requireProjectGovernanceScope(scope);
    const result = await workspaceBusinessService.deleteProjectRelease(
      projectScope.workspaceId,
      projectScope.projectId,
      releaseId,
    );

    if (!result.success || !result.data) {
      throw new Error(result.message || 'Failed to delete project release');
    }

    return result.data;
  },

  restoreProjectRelease: async (
    scope: EditorProjectGovernanceScope,
    releaseId: string,
  ): Promise<StudioProjectReleaseRecord> => {
    const projectScope = requireProjectGovernanceScope(scope);
    const result = await workspaceBusinessService.restoreProjectRelease(
      projectScope.workspaceId,
      projectScope.projectId,
      releaseId,
    );

    if (!result.success || !result.data) {
      throw new Error(result.message || 'Failed to restore project release');
    }

    return result.data;
  },

  readProjectReleaseManifest: async (
    scope: EditorProjectGovernanceScope,
    releaseId: string,
  ): Promise<StudioProjectReleaseManifest> => {
    const projectScope = requireProjectGovernanceScope(scope);
    const result = await workspaceBusinessService.readProjectReleaseManifest(
      projectScope.workspaceId,
      projectScope.projectId,
      releaseId,
    );

    if (!result.success || !result.data) {
      throw new Error(result.message || 'Failed to read project release manifest');
    }

    return result.data;
  },

  rebuildProjectRelease: async (
    scope: EditorProjectGovernanceScope,
    releaseId: string,
  ): Promise<StudioProjectReleaseRecord> => {
    const projectScope = requireProjectGovernanceScope(scope);
    const result = await workspaceBusinessService.rebuildProjectRelease(
      projectScope.workspaceId,
      projectScope.projectId,
      releaseId,
    );

    if (!result.success || !result.data) {
      throw new Error(result.message || 'Failed to rebuild project release');
    }

    return result.data;
  },

  resolveProjectReleaseUrl: (release: Pick<StudioProjectReleaseRecord, 'artifactPath'>): string => {
    if (!release.artifactPath?.trim()) {
      throw new Error('[ProjectService] Release artifact path is required.');
    }

    return toRuntimeAbsoluteUrl(release.artifactPath);
  },
};
