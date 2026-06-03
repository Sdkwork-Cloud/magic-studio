import {
  createRuntimeMagicStudioServerClient,
  isMagicStudioServerRuntimeSupported,
  readDefaultPlatformRuntime,
} from '@sdkwork/magic-studio-core/sdk';
import {
  isCanonicalMagicStudioAssetReference,
  isRenderableAssetUrl,
  normalizeMagicStudioAssetReference,
  resolveRuntimeMagicStudioRootLayout,
  resolveMagicStudioAssetReferenceName,
} from '@sdkwork/magic-studio-core/storage';
import { vfs } from '@sdkwork/magic-studio-fs';
import {
  isMagicStudioServerClientError,
  isMagicStudioServerResourceNotFoundError,
  type MagicStudioServerClient,
} from '@sdkwork/magic-studio-server';
import {
  createUuid,
  deriveClientEntityUuidFromId,
  matchesEntityKey,
} from '@sdkwork/magic-studio-types/entity';
import type { ImageMediaResource } from '@sdkwork/magic-studio-types/media';
import type { Page, PageRequest } from '@sdkwork/magic-studio-types/pagination';
import {
  type IBaseService,
  Result,
  type ServiceResult,
} from '@sdkwork/magic-studio-types/service';
import { MediaResourceType } from '@sdkwork/magic-studio-types/vocabulary';
import type {
  ProjectType,
  StudioProjectGitSyncRecord,
  StudioProjectGitSyncStatus,
  StudioProject,
  StudioProjectReleaseManifest,
  StudioProjectReleaseRetentionPolicy,
  StudioProjectReleaseRetentionPolicyApplyResult,
  StudioProjectReleaseManifestEntry,
  StudioProjectReleasePruneResult,
  StudioProjectReleaseRecord,
  StudioProjectReleaseStatus,
  StudioProjectReleaseStats,
  StudioProjectReleaseTarget,
  StudioProjectSession,
  StudioProjectSessionOpenFile,
  StudioProjectSessionSnapshot,
  StudioWorkspace,
} from '@sdkwork/magic-studio-types/workspace';
import { pathUtils } from '@sdkwork/magic-studio-commons/utils/helpers';

type WorkspaceServerClient = Pick<
  MagicStudioServerClient,
  | 'listWorkspaces'
  | 'createWorkspace'
  | 'readWorkspace'
  | 'updateWorkspace'
  | 'deleteWorkspace'
  | 'listRecentWorkspaceProjects'
  | 'listWorkspaceProjects'
  | 'createWorkspaceProject'
  | 'openWorkspaceProject'
  | 'duplicateWorkspaceProject'
  | 'archiveWorkspaceProject'
  | 'restoreWorkspaceProject'
  | 'readWorkspaceProjectSession'
  | 'upsertWorkspaceProjectSession'
  | 'deleteWorkspaceProjectSession'
  | 'syncWorkspaceProjectToGit'
  | 'listWorkspaceProjectGitSyncs'
  | 'readLatestWorkspaceProjectGitSync'
  | 'readWorkspaceProjectGitSync'
  | 'retryWorkspaceProjectGitSync'
  | 'listWorkspaceProjectReleases'
  | 'readWorkspaceProjectReleaseStats'
  | 'pruneWorkspaceProjectReleases'
  | 'readWorkspaceProjectReleaseRetentionPolicy'
  | 'updateWorkspaceProjectReleaseRetentionPolicy'
  | 'applyWorkspaceProjectReleaseRetentionPolicy'
  | 'createWorkspaceProjectRelease'
  | 'readLatestWorkspaceProjectRelease'
  | 'readWorkspaceProjectRelease'
  | 'deleteWorkspaceProjectRelease'
  | 'restoreWorkspaceProjectRelease'
  | 'readWorkspaceProjectReleaseManifest'
  | 'rebuildWorkspaceProjectRelease'
  | 'deleteWorkspaceProject'
  | 'importAssetFile'
>;

type ImportedAsset = Awaited<ReturnType<WorkspaceServerClient['importAssetFile']>>['data'];
type WorkspaceRootLayout = Awaited<ReturnType<typeof resolveRuntimeMagicStudioRootLayout>>;

export interface WorkspaceServiceOptions {
  serverClient?: WorkspaceServerClient;
}

const CLIENT_ENTITY_PREFIX = 'client-entity:';
const DEFAULT_PAGE_SIZE = 1000;
const FALLBACK_WORKSPACE_NAME = 'Workspace';
const FALLBACK_PROJECT_NAME = 'Project';
const FALLBACK_PROJECT_COVER_NAME = 'cover.png';
const PROJECT_COVER_IMPORT_DIR = 'workspace-project-covers';
const WORKSPACE_FEATURE_NAME = 'WorkspaceService';
const WORKSPACE_NOT_FOUND_CODES = ['WORKSPACE_NOT_FOUND'] as const;

const PROJECT_TYPE_SET: ReadonlySet<ProjectType> = new Set<ProjectType>([
  'APP',
  'VIDEO',
  'AUDIO',
  'FILM',
  'CANVAS',
  'NOTES',
  'CUT',
]);
const PROJECT_GIT_SYNC_STATUS_SET: ReadonlySet<StudioProjectGitSyncStatus> =
  new Set<StudioProjectGitSyncStatus>(['SUCCEEDED', 'NO_CHANGES', 'FAILED']);
const PROJECT_RELEASE_STATUS_SET: ReadonlySet<StudioProjectReleaseStatus> =
  new Set<StudioProjectReleaseStatus>(['READY', 'FAILED']);
const PROJECT_RELEASE_TARGET_SET: ReadonlySet<StudioProjectReleaseTarget> =
  new Set<StudioProjectReleaseTarget>([
    'WEB_STATIC',
    'VERCEL',
    'NETLIFY',
    'CLOUDFLARE_PAGES',
  ]);

function readText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function readOptionalText(value: unknown): string | undefined {
  const text = readText(value);
  return text || undefined;
}

function toTimestamp(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const text = readText(value);
  if (text) {
    const parsed = new Date(text).getTime();
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return Date.now();
}

function toOptionalTimestamp(value: unknown): number | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const text = readText(value);
  if (!text) {
    return undefined;
  }

  const parsed = new Date(text).getTime();
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toNonNegativeNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
  }

  return 0;
}

function toIdString(value: unknown, fallback = ''): string {
  const text = readText(value);
  if (text) {
    return text;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return fallback;
}

function toProjectType(value: unknown): ProjectType {
  const normalized = readText(value).toUpperCase() as ProjectType;
  return PROJECT_TYPE_SET.has(normalized) ? normalized : 'APP';
}

function toProjectGitSyncStatus(value: unknown): StudioProjectGitSyncStatus {
  const normalized = readText(value).toUpperCase() as StudioProjectGitSyncStatus;
  return PROJECT_GIT_SYNC_STATUS_SET.has(normalized) ? normalized : 'FAILED';
}

function toProjectReleaseStatus(value: unknown): StudioProjectReleaseStatus {
  const normalized = readText(value).toUpperCase() as StudioProjectReleaseStatus;
  return PROJECT_RELEASE_STATUS_SET.has(normalized) ? normalized : 'FAILED';
}

function toProjectReleaseTarget(value: unknown): StudioProjectReleaseTarget {
  const normalized = readText(value).toUpperCase() as StudioProjectReleaseTarget;
  return PROJECT_RELEASE_TARGET_SET.has(normalized) ? normalized : 'WEB_STATIC';
}

function stripUndefinedFields<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  ) as T;
}

function normalizeProjectCoverReference(value: unknown): string | undefined {
  return normalizeMagicStudioAssetReference(value) || undefined;
}

function buildPersistedEntityUuid(id: string): string {
  return deriveClientEntityUuidFromId(id);
}

function resolvePersistedEntityIdFromKey(key: string): string {
  const normalized = readText(key);
  if (!normalized) {
    return '';
  }

  return normalized.startsWith(CLIENT_ENTITY_PREFIX)
    ? normalized.slice(CLIENT_ENTITY_PREFIX.length)
    : normalized;
}

function resolvePersistedEntityUuidFromKey(key: string): string {
  const normalized = readText(key);
  if (!normalized) {
    return '';
  }

  return normalized.startsWith(CLIENT_ENTITY_PREFIX)
    ? normalized
    : buildPersistedEntityUuid(normalized);
}

function buildPage<T>(items: T[], pageRequest?: PageRequest): Page<T> {
  const size = Math.max(1, pageRequest?.size || DEFAULT_PAGE_SIZE);
  const page = Math.max(0, pageRequest?.page || 0);
  const totalElements = items.length;
  const start = page * size;
  const content = items.slice(start, start + size);
  const totalPages = totalElements === 0 ? 0 : Math.ceil(totalElements / size);

  return {
    content,
    pageable: {
      pageNumber: page,
      pageSize: size,
      offset: start,
      paged: true,
      unpaged: false,
      sort: { sorted: true, unsorted: false, empty: false },
    },
    last: totalPages === 0 ? true : page >= totalPages - 1,
    totalPages,
    totalElements,
    size,
    number: page,
    first: page === 0,
    numberOfElements: content.length,
    empty: content.length === 0,
    sort: { sorted: true, unsorted: false, empty: false },
  };
}

function buildCoverImageResource(reference: string | undefined): ImageMediaResource | undefined {
  const coverReference = normalizeProjectCoverReference(reference);
  if (!coverReference) {
    return undefined;
  }

  const pureReference = coverReference.split('?')[0]?.split('#')[0] || coverReference;
  const fileName = resolveMagicStudioAssetReferenceName(
    coverReference,
    FALLBACK_PROJECT_COVER_NAME,
  );
  const extension = pathUtils.extname(fileName).replace('.', '') || 'png';

  return {
    id: null,
    uuid: `workspace-cover:${pureReference}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    type: MediaResourceType.IMAGE,
    name: fileName,
    url: isRenderableAssetUrl(coverReference) ? coverReference : undefined,
    path: coverReference,
    origin: 'system',
    extension,
  };
}

function isNotFoundError(error: unknown): boolean {
  return isMagicStudioServerResourceNotFoundError(error, WORKSPACE_NOT_FOUND_CODES);
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (isMagicStudioServerClientError(error)) {
    return error.message || error.detail || fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  return fallback;
}

export class WorkspaceService implements IBaseService<StudioWorkspace> {
  private readonly serverClient?: WorkspaceServerClient;
  private cachedServerClient?: WorkspaceServerClient;
  private cachedRootLayoutPromise?: Promise<WorkspaceRootLayout>;

  constructor(options: WorkspaceServiceOptions = {}) {
    this.serverClient = options.serverClient;
  }

  private getServerClient(): WorkspaceServerClient {
    if (this.serverClient) {
      return this.serverClient;
    }

    if (!this.cachedServerClient) {
      const runtime = readDefaultPlatformRuntime(WORKSPACE_FEATURE_NAME);
      if (!isMagicStudioServerRuntimeSupported(runtime)) {
        throw new Error(
          '[WorkspaceService] Workspace capabilities require the canonical Magic Studio server runtime',
        );
      }
      this.cachedServerClient = createRuntimeMagicStudioServerClient(runtime);
    }

    return this.cachedServerClient;
  }

  private async getRootLayout(): Promise<WorkspaceRootLayout> {
    if (!this.cachedRootLayoutPromise) {
      const runtime = readDefaultPlatformRuntime(WORKSPACE_FEATURE_NAME);
      this.cachedRootLayoutPromise = resolveRuntimeMagicStudioRootLayout(runtime);
    }

    return this.cachedRootLayoutPromise;
  }

  private normalizeProject(
    project: Partial<StudioProject>,
    workspaceKey?: string,
  ): StudioProject {
    const projectId = toIdString(project.id, createUuid());
    const workspaceId =
      readOptionalText(project.workspaceId) ||
      (workspaceKey ? resolvePersistedEntityUuidFromKey(workspaceKey) : '');
    const thumbnailUrl = normalizeProjectCoverReference(project.thumbnailUrl);

    return {
      ...project,
      id: projectId,
      uuid: readOptionalText(project.uuid) || buildPersistedEntityUuid(projectId),
      name: readText(project.name) || FALLBACK_PROJECT_NAME,
      description: readText(project.description),
      type: toProjectType(project.type),
      workspaceId,
      thumbnailUrl,
      coverImage: buildCoverImageResource(thumbnailUrl),
      archivedAt: readOptionalText(project.archivedAt) ?? null,
      lastOpenedAt: toOptionalTimestamp(project.lastOpenedAt) ?? null,
      createdAt: toTimestamp(project.createdAt),
      updatedAt: toTimestamp(project.updatedAt),
    } as StudioProject;
  }

  private normalizeProjectSessionOpenFile(
    entry: Partial<StudioProjectSessionOpenFile> | null | undefined,
  ): StudioProjectSessionOpenFile | null {
    const path = readText(entry?.path);
    if (!path) {
      return null;
    }

    return {
      path,
      isPreview: Boolean(entry?.isPreview),
    };
  }

  private normalizeProjectSession(
    session: Partial<StudioProjectSession> | null | undefined,
    workspaceKey?: string,
    projectKey?: string,
  ): StudioProjectSession | null {
    if (!session) {
      return null;
    }

    const projectId = toIdString(session.projectId, projectKey ? resolvePersistedEntityIdFromKey(projectKey) : '');
    const sessionId = toIdString(
      session.id,
      projectId ? `project-session-${projectId}` : createUuid(),
    );
    const workspaceId =
      readOptionalText(session.workspaceId) ||
      (workspaceKey ? resolvePersistedEntityUuidFromKey(workspaceKey) : '');
    const openFiles = Array.isArray(session.openFiles)
      ? session.openFiles
          .map((entry) => this.normalizeProjectSessionOpenFile(entry))
          .filter((entry): entry is StudioProjectSessionOpenFile => Boolean(entry))
      : [];

    return {
      ...session,
      id: sessionId,
      uuid: readOptionalText(session.uuid) || buildPersistedEntityUuid(sessionId),
      workspaceId,
      projectId: readOptionalText(session.projectId) || resolvePersistedEntityUuidFromKey(projectId),
      openFiles,
      activeFilePath: readOptionalText(session.activeFilePath) ?? null,
      selectedPath: readOptionalText(session.selectedPath) ?? null,
      expandedPaths: Array.isArray(session.expandedPaths)
        ? session.expandedPaths.map((entry) => readText(entry)).filter(Boolean)
        : [],
      createdAt: toTimestamp(session.createdAt),
      updatedAt: toTimestamp(session.updatedAt),
      deletedAt:
        session.deletedAt === null ? null : readOptionalText(session.deletedAt),
    } as StudioProjectSession;
  }

  private normalizeProjectSessionSnapshot(
    snapshot: Partial<StudioProjectSessionSnapshot> | null | undefined,
    workspaceKey?: string,
    projectKey?: string,
  ): StudioProjectSessionSnapshot {
    return {
      session: this.normalizeProjectSession(snapshot?.session, workspaceKey, projectKey),
    };
  }

  private normalizeProjectGitSyncRecord(
    record: Partial<StudioProjectGitSyncRecord>,
    workspaceKey?: string,
    projectKey?: string,
  ): StudioProjectGitSyncRecord {
    const syncId = toIdString(record.id, createUuid());
    const workspaceId =
      readOptionalText(record.workspaceId) ||
      (workspaceKey ? resolvePersistedEntityUuidFromKey(workspaceKey) : '');
    const projectId =
      readOptionalText(record.projectId) ||
      (projectKey ? resolvePersistedEntityUuidFromKey(projectKey) : '');

    return {
      ...record,
      id: syncId,
      uuid: readOptionalText(record.uuid) || buildPersistedEntityUuid(syncId),
      workspaceId,
      projectId,
      retryOfSyncId: readOptionalText(record.retryOfSyncId) ?? null,
      repository: readText(record.repository),
      branch: readText(record.branch) || 'main',
      status: toProjectGitSyncStatus(record.status),
      commitHash: readOptionalText(record.commitHash) ?? null,
      message: readOptionalText(record.message) ?? null,
      syncedAt: readOptionalText(record.syncedAt) ?? null,
      errorMessage: readOptionalText(record.errorMessage) ?? null,
      createdAt: toTimestamp(record.createdAt),
      updatedAt: toTimestamp(record.updatedAt),
      deletedAt: record.deletedAt === null ? null : readOptionalText(record.deletedAt),
    } as StudioProjectGitSyncRecord;
  }

  private normalizeProjectReleaseRecord(
    record: Partial<StudioProjectReleaseRecord>,
    workspaceKey?: string,
    projectKey?: string,
  ): StudioProjectReleaseRecord {
    const releaseId = toIdString(record.id, createUuid());
    const workspaceId =
      readOptionalText(record.workspaceId) ||
      (workspaceKey ? resolvePersistedEntityUuidFromKey(workspaceKey) : '');
    const projectId =
      readOptionalText(record.projectId) ||
      (projectKey ? resolvePersistedEntityUuidFromKey(projectKey) : '');

    return {
      ...record,
      id: releaseId,
      uuid: readOptionalText(record.uuid) || buildPersistedEntityUuid(releaseId),
      workspaceId,
      projectId,
      rebuildOfReleaseId: readOptionalText(record.rebuildOfReleaseId) ?? null,
      appName: readText(record.appName) || FALLBACK_PROJECT_NAME,
      version: readText(record.version) || '1.0.0',
      target: toProjectReleaseTarget(record.target),
      status: toProjectReleaseStatus(record.status),
      artifactFileName: readText(record.artifactFileName) || `${releaseId}.zip`,
      artifactPath: readText(record.artifactPath),
      checksumSha1: readText(record.checksumSha1),
      sizeBytes: toNonNegativeNumber(record.sizeBytes),
      includedFileCount: toNonNegativeNumber(record.includedFileCount),
      errorMessage: readOptionalText(record.errorMessage) ?? null,
      createdAt: toTimestamp(record.createdAt),
      updatedAt: toTimestamp(record.updatedAt),
      deletedAt: record.deletedAt === null ? null : readOptionalText(record.deletedAt),
    } as StudioProjectReleaseRecord;
  }

  private normalizeProjectReleaseManifestEntry(
    entry: Partial<StudioProjectReleaseManifestEntry>,
  ): StudioProjectReleaseManifestEntry {
    return {
      path: readText(entry.path),
      sizeBytes: toNonNegativeNumber(entry.sizeBytes),
      checksumSha1: readText(entry.checksumSha1).toLowerCase(),
    } satisfies StudioProjectReleaseManifestEntry;
  }

  private normalizeProjectReleaseManifest(
    manifest: Partial<StudioProjectReleaseManifest>,
    workspaceKey?: string,
    projectKey?: string,
  ): StudioProjectReleaseManifest {
    return {
      release: this.normalizeProjectReleaseRecord(manifest.release ?? {}, workspaceKey, projectKey),
      entries: Array.isArray(manifest.entries)
        ? manifest.entries.map((entry) => this.normalizeProjectReleaseManifestEntry(entry))
        : [],
    } satisfies StudioProjectReleaseManifest;
  }

  private normalizeProjectReleaseStats(
    stats: Partial<StudioProjectReleaseStats>,
    workspaceKey?: string,
    projectKey?: string,
  ): StudioProjectReleaseStats {
    return {
      workspaceId:
        readOptionalText(stats.workspaceId) ||
        (workspaceKey ? resolvePersistedEntityUuidFromKey(workspaceKey) : ''),
      projectId:
        readOptionalText(stats.projectId) ||
        (projectKey ? resolvePersistedEntityUuidFromKey(projectKey) : ''),
      totalCount: toNonNegativeNumber(stats.totalCount),
      activeCount: toNonNegativeNumber(stats.activeCount),
      deletedCount: toNonNegativeNumber(stats.deletedCount),
      totalSizeBytes: toNonNegativeNumber(stats.totalSizeBytes),
      activeSizeBytes: toNonNegativeNumber(stats.activeSizeBytes),
      deletedSizeBytes: toNonNegativeNumber(stats.deletedSizeBytes),
      latestReleaseId: readOptionalText(stats.latestReleaseId) ?? null,
      latestActiveReleaseId: readOptionalText(stats.latestActiveReleaseId) ?? null,
      latestDeletedReleaseId: readOptionalText(stats.latestDeletedReleaseId) ?? null,
    } satisfies StudioProjectReleaseStats;
  }

  private normalizeProjectReleasePruneResult(
    result: Partial<StudioProjectReleasePruneResult>,
    workspaceKey?: string,
    projectKey?: string,
  ): StudioProjectReleasePruneResult {
    return {
      workspaceId:
        readOptionalText(result.workspaceId) ||
        (workspaceKey ? resolvePersistedEntityUuidFromKey(workspaceKey) : ''),
      projectId:
        readOptionalText(result.projectId) ||
        (projectKey ? resolvePersistedEntityUuidFromKey(projectKey) : ''),
      dryRun: Boolean(result.dryRun),
      prunedReleaseIds: Array.isArray(result.prunedReleaseIds)
        ? result.prunedReleaseIds.map((entry) => readText(entry)).filter(Boolean)
        : [],
      prunedCount: toNonNegativeNumber(result.prunedCount),
      reclaimedBytes: toNonNegativeNumber(result.reclaimedBytes),
      remainingStats: this.normalizeProjectReleaseStats(
        result.remainingStats ?? {},
        workspaceKey,
        projectKey,
      ),
    } satisfies StudioProjectReleasePruneResult;
  }

  private normalizeProjectReleaseRetentionPolicy(
    policy: Partial<StudioProjectReleaseRetentionPolicy>,
    workspaceKey?: string,
    projectKey?: string,
  ): StudioProjectReleaseRetentionPolicy {
    return {
      workspaceId:
        readOptionalText(policy.workspaceId) ||
        (workspaceKey ? resolvePersistedEntityUuidFromKey(workspaceKey) : ''),
      projectId:
        readOptionalText(policy.projectId) ||
        (projectKey ? resolvePersistedEntityUuidFromKey(projectKey) : ''),
      enabled: Boolean(policy.enabled),
      keepLatestCount: toNonNegativeNumber(policy.keepLatestCount) || 1,
      maxDeletedCount:
        policy.maxDeletedCount == null ? null : toNonNegativeNumber(policy.maxDeletedCount),
      pruneDeletedOlderThanDays:
        policy.pruneDeletedOlderThanDays == null
          ? null
          : toNonNegativeNumber(policy.pruneDeletedOlderThanDays),
      autoApplyOnCreate: Boolean(policy.autoApplyOnCreate),
      createdAt: toOptionalTimestamp(policy.createdAt) ?? null,
      updatedAt: toOptionalTimestamp(policy.updatedAt) ?? null,
      lastAppliedAt: toOptionalTimestamp(policy.lastAppliedAt) ?? null,
    } satisfies StudioProjectReleaseRetentionPolicy;
  }

  private normalizeProjectReleaseRetentionPolicyApplyResult(
    result: Partial<StudioProjectReleaseRetentionPolicyApplyResult>,
    workspaceKey?: string,
    projectKey?: string,
  ): StudioProjectReleaseRetentionPolicyApplyResult {
    return {
      workspaceId:
        readOptionalText(result.workspaceId) ||
        (workspaceKey ? resolvePersistedEntityUuidFromKey(workspaceKey) : ''),
      projectId:
        readOptionalText(result.projectId) ||
        (projectKey ? resolvePersistedEntityUuidFromKey(projectKey) : ''),
      dryRun: Boolean(result.dryRun),
      policy: this.normalizeProjectReleaseRetentionPolicy(
        result.policy ?? {},
        workspaceKey,
        projectKey,
      ),
      deletedReleaseIds: Array.isArray(result.deletedReleaseIds)
        ? result.deletedReleaseIds.map((entry) => readText(entry)).filter(Boolean)
        : [],
      prunedReleaseIds: Array.isArray(result.prunedReleaseIds)
        ? result.prunedReleaseIds.map((entry) => readText(entry)).filter(Boolean)
        : [],
      deletedCount: toNonNegativeNumber(result.deletedCount),
      prunedCount: toNonNegativeNumber(result.prunedCount),
      reclaimedBytes: toNonNegativeNumber(result.reclaimedBytes),
      statsBefore: this.normalizeProjectReleaseStats(result.statsBefore ?? {}, workspaceKey, projectKey),
      statsAfter: this.normalizeProjectReleaseStats(result.statsAfter ?? {}, workspaceKey, projectKey),
    } satisfies StudioProjectReleaseRetentionPolicyApplyResult;
  }

  private normalizeWorkspace(workspace: Partial<StudioWorkspace>): StudioWorkspace {
    const workspaceId = toIdString(workspace.id, createUuid());
    const workspaceUuid =
      readOptionalText(workspace.uuid) || buildPersistedEntityUuid(workspaceId);
    const projects = Array.isArray(workspace.projects)
      ? workspace.projects.map((project) =>
          this.normalizeProject(
            {
              ...project,
              workspaceId: readOptionalText(project.workspaceId) || workspaceUuid,
            },
            workspaceId,
          ),
        )
      : [];

    return {
      ...workspace,
      id: workspaceId,
      uuid: workspaceUuid,
      name: readText(workspace.name) || FALLBACK_WORKSPACE_NAME,
      description: readText(workspace.description),
      icon: readOptionalText(workspace.icon),
      projects,
      createdAt: toTimestamp(workspace.createdAt),
      updatedAt: toTimestamp(workspace.updatedAt),
    } as StudioWorkspace;
  }

  private async importProjectCoverImage(
    workspaceKey: string,
    coverImage: { data: Uint8Array; name: string },
  ): Promise<string> {
    const workspaceId = resolvePersistedEntityIdFromKey(workspaceKey);
    if (!workspaceId) {
      throw new Error('Workspace id is required for project cover import');
    }

    const rootLayout = await this.getRootLayout();
    const importRoot = pathUtils.join(rootLayout.systemTempRoot, PROJECT_COVER_IMPORT_DIR);
    const originalName = readText(coverImage.name) || FALLBACK_PROJECT_COVER_NAME;
    const extension = pathUtils.extname(originalName) || '.png';
    const tempPath = pathUtils.join(importRoot, `${createUuid()}${extension}`);
    const bytes = new Uint8Array(coverImage.data.byteLength);
    bytes.set(coverImage.data);

    try {
      await vfs.createDir(rootLayout.systemTempRoot);
    } catch {
      // Keep running if the temp root already exists.
    }

    try {
      await vfs.createDir(importRoot);
    } catch {
      // Keep running if the import root already exists.
    }

    await vfs.writeFileBinary(tempPath, bytes);

    try {
      const response = await this.getServerClient().importAssetFile({
        scope: {
          workspaceId,
          domain: 'asset-center',
        },
        type: 'image',
        sourcePath: tempPath,
        name: originalName,
        metadata: {
          source: 'workspace-project-cover',
        },
      });

      const reference = this.resolveImportedAssetReference(response.data);
      if (!reference) {
        throw new Error(
          'Project cover import completed without a canonical project cover reference.',
        );
      }

      return reference;
    } finally {
      try {
        await vfs.delete(tempPath);
      } catch {
        // Best-effort cleanup for temporary import files.
      }
    }
  }

  private resolveImportedAssetReference(asset: ImportedAsset | null | undefined): string | undefined {
    const primary = asset?.storage?.primary;

    for (const candidate of [primary?.uri, primary?.url, primary?.path]) {
      const normalized = normalizeProjectCoverReference(candidate);
      if (normalized && isCanonicalMagicStudioAssetReference(normalized)) {
        return normalized;
      }
    }

    for (const candidate of [primary?.url, primary?.uri, primary?.path]) {
      const normalized = normalizeProjectCoverReference(candidate);
      if (normalized && isRenderableAssetUrl(normalized)) {
        return normalized;
      }
    }

    return undefined;
  }

  private async findAllFromServer(
    pageRequest?: PageRequest,
  ): Promise<ServiceResult<Page<StudioWorkspace>>> {
    const response = await this.getServerClient().listWorkspaces();
    let workspaces = response.items.map((workspace) => this.normalizeWorkspace(workspace));

    if (pageRequest?.keyword) {
      const keyword = pageRequest.keyword.toLowerCase();
      workspaces = workspaces.filter((workspace) =>
        workspace.name.toLowerCase().includes(keyword),
      );
    }

    workspaces.sort((left, right) => toTimestamp(right.updatedAt) - toTimestamp(left.updatedAt));

    return Result.success(buildPage(workspaces, pageRequest));
  }

  private async findWorkspaceByIdFromServer(
    id: string,
  ): Promise<ServiceResult<StudioWorkspace | null>> {
    const workspaceId = resolvePersistedEntityIdFromKey(id);
    if (!workspaceId) {
      return Result.error('Workspace id is required');
    }

    try {
      const response = await this.getServerClient().readWorkspace(workspaceId);
      return Result.success(this.normalizeWorkspace(response.data));
    } catch (error: unknown) {
      if (isNotFoundError(error)) {
        return Result.success(null);
      }
      return Result.error(toErrorMessage(error, 'Failed to load workspace detail'));
    }
  }

  private async saveWorkspaceToServer(
    entity: Partial<StudioWorkspace>,
  ): Promise<ServiceResult<StudioWorkspace>> {
    const workspaceKey = readText(entity.uuid) || readText(entity.id);
    if (!workspaceKey) {
      return Result.error('Workspace id is required for update');
    }

    const payload = stripUndefinedFields({
      name: entity.name !== undefined ? readText(entity.name) || FALLBACK_WORKSPACE_NAME : undefined,
      description: entity.description !== undefined ? readText(entity.description) : undefined,
      icon: entity.icon !== undefined ? readOptionalText(entity.icon) : undefined,
    });

    if (Object.keys(payload).length === 0) {
      return Result.error('Workspace update requires at least one field');
    }

    const response = await this.getServerClient().updateWorkspace(
      resolvePersistedEntityIdFromKey(workspaceKey),
      payload,
    );
    return Result.success(this.normalizeWorkspace(response.data));
  }

  private async createWorkspaceToServer(
    name: string,
    description?: string,
    icon?: string,
  ): Promise<ServiceResult<StudioWorkspace>> {
    const response = await this.getServerClient().createWorkspace({
      name: readText(name) || FALLBACK_WORKSPACE_NAME,
      description: readOptionalText(description),
      icon: readOptionalText(icon),
    });

    return Result.success(this.normalizeWorkspace(response.data));
  }

  private async createProjectToServer(
    workspaceId: string,
    name: string,
    type: ProjectType,
    description: string,
    coverImage?: { data: Uint8Array; name: string },
  ): Promise<ServiceResult<StudioProject>> {
    const persistedWorkspaceId = resolvePersistedEntityIdFromKey(workspaceId);
    if (!persistedWorkspaceId) {
      return Result.error('Workspace id is required');
    }

    const thumbnailUrl = coverImage
      ? await this.importProjectCoverImage(persistedWorkspaceId, coverImage)
      : undefined;

    const response = await this.getServerClient().createWorkspaceProject(
      persistedWorkspaceId,
      stripUndefinedFields({
        name: readText(name) || FALLBACK_PROJECT_NAME,
        type: toProjectType(type),
        description: readOptionalText(description),
        thumbnailUrl,
      }),
    );

    return Result.success(
      this.normalizeProject(
        {
          ...response.data,
          thumbnailUrl: normalizeProjectCoverReference(response.data.thumbnailUrl) || thumbnailUrl,
        },
        persistedWorkspaceId,
      ),
    );
  }

  private async deleteWorkspaceFromServer(workspaceId: string): Promise<ServiceResult<void>> {
    const persistedWorkspaceId = resolvePersistedEntityIdFromKey(workspaceId);
    if (!persistedWorkspaceId) {
      return Result.error('Workspace id is required');
    }

    await this.getServerClient().deleteWorkspace(persistedWorkspaceId);
    return Result.success(undefined);
  }

  private async deleteProjectFromServer(
    workspaceId: string,
    projectId: string,
  ): Promise<ServiceResult<void>> {
    const persistedWorkspaceId = resolvePersistedEntityIdFromKey(workspaceId);
    const persistedProjectId = resolvePersistedEntityIdFromKey(projectId);
    if (!persistedWorkspaceId) {
      return Result.error('Workspace id is required');
    }
    if (!persistedProjectId) {
      return Result.error('Project id is required');
    }

    await this
      .getServerClient()
      .deleteWorkspaceProject(persistedWorkspaceId, persistedProjectId);
    return Result.success(undefined);
  }

  private async runProjectLifecycleAction(
    workspaceId: string,
    projectId: string,
    action: (client: WorkspaceServerClient, persistedWorkspaceId: string, persistedProjectId: string) => Promise<{
      data: StudioProject;
    }>,
  ): Promise<ServiceResult<StudioProject>> {
    const persistedWorkspaceId = resolvePersistedEntityIdFromKey(workspaceId);
    const persistedProjectId = resolvePersistedEntityIdFromKey(projectId);
    if (!persistedWorkspaceId) {
      return Result.error('Workspace id is required');
    }
    if (!persistedProjectId) {
      return Result.error('Project id is required');
    }

    const response = await action(
      this.getServerClient(),
      persistedWorkspaceId,
      persistedProjectId,
    );
    return Result.success(this.normalizeProject(response.data, persistedWorkspaceId));
  }

  private async readProjectSessionFromServer(
    workspaceId: string,
    projectId: string,
  ): Promise<ServiceResult<StudioProjectSession | null>> {
    const persistedWorkspaceId = resolvePersistedEntityIdFromKey(workspaceId);
    const persistedProjectId = resolvePersistedEntityIdFromKey(projectId);
    if (!persistedWorkspaceId) {
      return Result.error('Workspace id is required');
    }
    if (!persistedProjectId) {
      return Result.error('Project id is required');
    }

    const response = await this.getServerClient().readWorkspaceProjectSession(
      persistedWorkspaceId,
      persistedProjectId,
    );
    const snapshot = this.normalizeProjectSessionSnapshot(
      response.data,
      persistedWorkspaceId,
      persistedProjectId,
    );
    return Result.success(snapshot.session);
  }

  private async saveProjectSessionToServer(
    workspaceId: string,
    projectId: string,
    session: {
      openFiles: StudioProjectSessionOpenFile[];
      activeFilePath?: string | null;
      selectedPath?: string | null;
      expandedPaths?: string[];
    },
  ): Promise<ServiceResult<StudioProjectSession>> {
    const persistedWorkspaceId = resolvePersistedEntityIdFromKey(workspaceId);
    const persistedProjectId = resolvePersistedEntityIdFromKey(projectId);
    if (!persistedWorkspaceId) {
      return Result.error('Workspace id is required');
    }
    if (!persistedProjectId) {
      return Result.error('Project id is required');
    }

    const response = await this.getServerClient().upsertWorkspaceProjectSession(
      persistedWorkspaceId,
      persistedProjectId,
      {
        openFiles: session.openFiles.map((entry) => ({
          path: readText(entry.path),
          isPreview: Boolean(entry.isPreview),
        })),
        activeFilePath: session.activeFilePath === null ? null : readOptionalText(session.activeFilePath),
        selectedPath: session.selectedPath === null ? null : readOptionalText(session.selectedPath),
        expandedPaths: (session.expandedPaths || []).map((entry) => readText(entry)).filter(Boolean),
      },
    );

    const normalized = this.normalizeProjectSession(
      response.data,
      persistedWorkspaceId,
      persistedProjectId,
    );
    if (!normalized) {
      return Result.error('Project session response was empty');
    }

    return Result.success(normalized);
  }

  private async deleteProjectSessionFromServer(
    workspaceId: string,
    projectId: string,
  ): Promise<ServiceResult<void>> {
    const persistedWorkspaceId = resolvePersistedEntityIdFromKey(workspaceId);
    const persistedProjectId = resolvePersistedEntityIdFromKey(projectId);
    if (!persistedWorkspaceId) {
      return Result.error('Workspace id is required');
    }
    if (!persistedProjectId) {
      return Result.error('Project id is required');
    }

    await this.getServerClient().deleteWorkspaceProjectSession(
      persistedWorkspaceId,
      persistedProjectId,
    );
    return Result.success(undefined);
  }

  private async syncProjectToGitFromServer(
    workspaceId: string,
    projectId: string,
    input: {
      repository: string;
      branch: string;
      token?: string;
      message?: string;
    },
  ): Promise<ServiceResult<StudioProjectGitSyncRecord>> {
    const persistedWorkspaceId = resolvePersistedEntityIdFromKey(workspaceId);
    const persistedProjectId = resolvePersistedEntityIdFromKey(projectId);
    if (!persistedWorkspaceId) {
      return Result.error('Workspace id is required');
    }
    if (!persistedProjectId) {
      return Result.error('Project id is required');
    }

    const response = await this.getServerClient().syncWorkspaceProjectToGit(
      persistedWorkspaceId,
      persistedProjectId,
      stripUndefinedFields({
        repository: readText(input.repository),
        branch: readText(input.branch) || 'main',
        token: readOptionalText(input.token),
        message: readOptionalText(input.message),
      }),
    );
    return Result.success(
      this.normalizeProjectGitSyncRecord(response.data, persistedWorkspaceId, persistedProjectId),
    );
  }

  private async listProjectGitSyncsFromServer(
    workspaceId: string,
    projectId: string,
  ): Promise<ServiceResult<StudioProjectGitSyncRecord[]>> {
    const persistedWorkspaceId = resolvePersistedEntityIdFromKey(workspaceId);
    const persistedProjectId = resolvePersistedEntityIdFromKey(projectId);
    if (!persistedWorkspaceId) {
      return Result.error('Workspace id is required');
    }
    if (!persistedProjectId) {
      return Result.error('Project id is required');
    }

    const response = await this.getServerClient().listWorkspaceProjectGitSyncs(
      persistedWorkspaceId,
      persistedProjectId,
    );
    return Result.success(
      response.items.map((record) =>
        this.normalizeProjectGitSyncRecord(record, persistedWorkspaceId, persistedProjectId),
      ),
    );
  }

  private async readLatestProjectGitSyncFromServer(
    workspaceId: string,
    projectId: string,
  ): Promise<ServiceResult<StudioProjectGitSyncRecord>> {
    const persistedWorkspaceId = resolvePersistedEntityIdFromKey(workspaceId);
    const persistedProjectId = resolvePersistedEntityIdFromKey(projectId);
    if (!persistedWorkspaceId) {
      return Result.error('Workspace id is required');
    }
    if (!persistedProjectId) {
      return Result.error('Project id is required');
    }

    const response = await this.getServerClient().readLatestWorkspaceProjectGitSync(
      persistedWorkspaceId,
      persistedProjectId,
    );
    return Result.success(
      this.normalizeProjectGitSyncRecord(response.data, persistedWorkspaceId, persistedProjectId),
    );
  }

  private async readProjectGitSyncFromServer(
    workspaceId: string,
    projectId: string,
    syncId: string,
  ): Promise<ServiceResult<StudioProjectGitSyncRecord>> {
    const persistedWorkspaceId = resolvePersistedEntityIdFromKey(workspaceId);
    const persistedProjectId = resolvePersistedEntityIdFromKey(projectId);
    if (!persistedWorkspaceId) {
      return Result.error('Workspace id is required');
    }
    if (!persistedProjectId) {
      return Result.error('Project id is required');
    }

    const response = await this.getServerClient().readWorkspaceProjectGitSync(
      persistedWorkspaceId,
      persistedProjectId,
      resolvePersistedEntityIdFromKey(syncId) || syncId,
    );
    return Result.success(
      this.normalizeProjectGitSyncRecord(response.data, persistedWorkspaceId, persistedProjectId),
    );
  }

  private async retryProjectGitSyncFromServer(
    workspaceId: string,
    projectId: string,
    syncId: string,
    input: {
      token?: string;
      message?: string;
    },
  ): Promise<ServiceResult<StudioProjectGitSyncRecord>> {
    const persistedWorkspaceId = resolvePersistedEntityIdFromKey(workspaceId);
    const persistedProjectId = resolvePersistedEntityIdFromKey(projectId);
    if (!persistedWorkspaceId) {
      return Result.error('Workspace id is required');
    }
    if (!persistedProjectId) {
      return Result.error('Project id is required');
    }

    const response = await this.getServerClient().retryWorkspaceProjectGitSync(
      persistedWorkspaceId,
      persistedProjectId,
      resolvePersistedEntityIdFromKey(syncId) || syncId,
      stripUndefinedFields({
        token: readOptionalText(input.token),
        message: readOptionalText(input.message),
      }),
    );
    return Result.success(
      this.normalizeProjectGitSyncRecord(response.data, persistedWorkspaceId, persistedProjectId),
    );
  }

  private async listProjectReleasesFromServer(
    workspaceId: string,
    projectId: string,
  ): Promise<ServiceResult<StudioProjectReleaseRecord[]>> {
    const persistedWorkspaceId = resolvePersistedEntityIdFromKey(workspaceId);
    const persistedProjectId = resolvePersistedEntityIdFromKey(projectId);
    if (!persistedWorkspaceId) {
      return Result.error('Workspace id is required');
    }
    if (!persistedProjectId) {
      return Result.error('Project id is required');
    }

    const response = await this.getServerClient().listWorkspaceProjectReleases(
      persistedWorkspaceId,
      persistedProjectId,
    );
    return Result.success(
      response.items.map((record) =>
        this.normalizeProjectReleaseRecord(record, persistedWorkspaceId, persistedProjectId),
      ),
    );
  }

  private async readProjectReleaseStatsFromServer(
    workspaceId: string,
    projectId: string,
  ): Promise<ServiceResult<StudioProjectReleaseStats>> {
    const persistedWorkspaceId = resolvePersistedEntityIdFromKey(workspaceId);
    const persistedProjectId = resolvePersistedEntityIdFromKey(projectId);
    if (!persistedWorkspaceId) {
      return Result.error('Workspace id is required');
    }
    if (!persistedProjectId) {
      return Result.error('Project id is required');
    }

    const response = await this.getServerClient().readWorkspaceProjectReleaseStats(
      persistedWorkspaceId,
      persistedProjectId,
    );
    return Result.success(
      this.normalizeProjectReleaseStats(response.data, persistedWorkspaceId, persistedProjectId),
    );
  }

  private async pruneProjectReleasesFromServer(
    workspaceId: string,
    projectId: string,
    input: {
      dryRun?: boolean;
      releaseIds?: string[];
    },
  ): Promise<ServiceResult<StudioProjectReleasePruneResult>> {
    const persistedWorkspaceId = resolvePersistedEntityIdFromKey(workspaceId);
    const persistedProjectId = resolvePersistedEntityIdFromKey(projectId);
    if (!persistedWorkspaceId) {
      return Result.error('Workspace id is required');
    }
    if (!persistedProjectId) {
      return Result.error('Project id is required');
    }

    const response = await this.getServerClient().pruneWorkspaceProjectReleases(
      persistedWorkspaceId,
      persistedProjectId,
      stripUndefinedFields({
        dryRun: input.dryRun === undefined ? undefined : Boolean(input.dryRun),
        releaseIds: Array.isArray(input.releaseIds)
          ? input.releaseIds.map((entry) => readText(entry)).filter(Boolean)
          : undefined,
      }),
    );
    return Result.success(
      this.normalizeProjectReleasePruneResult(
        response.data,
        persistedWorkspaceId,
        persistedProjectId,
      ),
    );
  }

  private async readProjectReleaseRetentionPolicyFromServer(
    workspaceId: string,
    projectId: string,
  ): Promise<ServiceResult<StudioProjectReleaseRetentionPolicy>> {
    const persistedWorkspaceId = resolvePersistedEntityIdFromKey(workspaceId);
    const persistedProjectId = resolvePersistedEntityIdFromKey(projectId);
    if (!persistedWorkspaceId) {
      return Result.error('Workspace id is required');
    }
    if (!persistedProjectId) {
      return Result.error('Project id is required');
    }

    const response = await this.getServerClient().readWorkspaceProjectReleaseRetentionPolicy(
      persistedWorkspaceId,
      persistedProjectId,
    );
    return Result.success(
      this.normalizeProjectReleaseRetentionPolicy(
        response.data,
        persistedWorkspaceId,
        persistedProjectId,
      ),
    );
  }

  private async updateProjectReleaseRetentionPolicyFromServer(
    workspaceId: string,
    projectId: string,
    input: {
      enabled: boolean;
      keepLatestCount: number;
      maxDeletedCount?: number | null;
      pruneDeletedOlderThanDays?: number | null;
      autoApplyOnCreate: boolean;
    },
  ): Promise<ServiceResult<StudioProjectReleaseRetentionPolicy>> {
    const persistedWorkspaceId = resolvePersistedEntityIdFromKey(workspaceId);
    const persistedProjectId = resolvePersistedEntityIdFromKey(projectId);
    if (!persistedWorkspaceId) {
      return Result.error('Workspace id is required');
    }
    if (!persistedProjectId) {
      return Result.error('Project id is required');
    }

    const response = await this.getServerClient().updateWorkspaceProjectReleaseRetentionPolicy(
      persistedWorkspaceId,
      persistedProjectId,
      {
        enabled: Boolean(input.enabled),
        keepLatestCount: Math.max(1, toNonNegativeNumber(input.keepLatestCount) || 1),
        maxDeletedCount:
          input.maxDeletedCount == null ? null : toNonNegativeNumber(input.maxDeletedCount),
        pruneDeletedOlderThanDays:
          input.pruneDeletedOlderThanDays == null
            ? null
            : Math.max(1, toNonNegativeNumber(input.pruneDeletedOlderThanDays) || 1),
        autoApplyOnCreate: Boolean(input.autoApplyOnCreate),
      },
    );
    return Result.success(
      this.normalizeProjectReleaseRetentionPolicy(
        response.data,
        persistedWorkspaceId,
        persistedProjectId,
      ),
    );
  }

  private async applyProjectReleaseRetentionPolicyFromServer(
    workspaceId: string,
    projectId: string,
    input: {
      dryRun?: boolean;
    },
  ): Promise<ServiceResult<StudioProjectReleaseRetentionPolicyApplyResult>> {
    const persistedWorkspaceId = resolvePersistedEntityIdFromKey(workspaceId);
    const persistedProjectId = resolvePersistedEntityIdFromKey(projectId);
    if (!persistedWorkspaceId) {
      return Result.error('Workspace id is required');
    }
    if (!persistedProjectId) {
      return Result.error('Project id is required');
    }

    const response = await this.getServerClient().applyWorkspaceProjectReleaseRetentionPolicy(
      persistedWorkspaceId,
      persistedProjectId,
      stripUndefinedFields({
        dryRun: input.dryRun === undefined ? undefined : Boolean(input.dryRun),
      }),
    );
    return Result.success(
      this.normalizeProjectReleaseRetentionPolicyApplyResult(
        response.data,
        persistedWorkspaceId,
        persistedProjectId,
      ),
    );
  }

  private async createProjectReleaseFromServer(
    workspaceId: string,
    projectId: string,
    input: {
      appName: string;
      version: string;
      target: StudioProjectReleaseTarget;
      autoDeploy?: boolean;
    },
  ): Promise<ServiceResult<StudioProjectReleaseRecord>> {
    const persistedWorkspaceId = resolvePersistedEntityIdFromKey(workspaceId);
    const persistedProjectId = resolvePersistedEntityIdFromKey(projectId);
    if (!persistedWorkspaceId) {
      return Result.error('Workspace id is required');
    }
    if (!persistedProjectId) {
      return Result.error('Project id is required');
    }

    const response = await this.getServerClient().createWorkspaceProjectRelease(
      persistedWorkspaceId,
      persistedProjectId,
      stripUndefinedFields({
        appName: readText(input.appName) || FALLBACK_PROJECT_NAME,
        version: readText(input.version) || '1.0.0',
        target: toProjectReleaseTarget(input.target),
        autoDeploy: input.autoDeploy === undefined ? undefined : Boolean(input.autoDeploy),
      }),
    );
    return Result.success(
      this.normalizeProjectReleaseRecord(response.data, persistedWorkspaceId, persistedProjectId),
    );
  }

  private async readLatestProjectReleaseFromServer(
    workspaceId: string,
    projectId: string,
  ): Promise<ServiceResult<StudioProjectReleaseRecord>> {
    const persistedWorkspaceId = resolvePersistedEntityIdFromKey(workspaceId);
    const persistedProjectId = resolvePersistedEntityIdFromKey(projectId);
    if (!persistedWorkspaceId) {
      return Result.error('Workspace id is required');
    }
    if (!persistedProjectId) {
      return Result.error('Project id is required');
    }

    const response = await this.getServerClient().readLatestWorkspaceProjectRelease(
      persistedWorkspaceId,
      persistedProjectId,
    );
    return Result.success(
      this.normalizeProjectReleaseRecord(response.data, persistedWorkspaceId, persistedProjectId),
    );
  }

  private async readProjectReleaseFromServer(
    workspaceId: string,
    projectId: string,
    releaseId: string,
  ): Promise<ServiceResult<StudioProjectReleaseRecord>> {
    const persistedWorkspaceId = resolvePersistedEntityIdFromKey(workspaceId);
    const persistedProjectId = resolvePersistedEntityIdFromKey(projectId);
    if (!persistedWorkspaceId) {
      return Result.error('Workspace id is required');
    }
    if (!persistedProjectId) {
      return Result.error('Project id is required');
    }

    const response = await this.getServerClient().readWorkspaceProjectRelease(
      persistedWorkspaceId,
      persistedProjectId,
      resolvePersistedEntityIdFromKey(releaseId) || releaseId,
    );
    return Result.success(
      this.normalizeProjectReleaseRecord(response.data, persistedWorkspaceId, persistedProjectId),
    );
  }

  private async deleteProjectReleaseFromServer(
    workspaceId: string,
    projectId: string,
    releaseId: string,
  ): Promise<ServiceResult<StudioProjectReleaseRecord>> {
    const persistedWorkspaceId = resolvePersistedEntityIdFromKey(workspaceId);
    const persistedProjectId = resolvePersistedEntityIdFromKey(projectId);
    if (!persistedWorkspaceId) {
      return Result.error('Workspace id is required');
    }
    if (!persistedProjectId) {
      return Result.error('Project id is required');
    }

    const response = await this.getServerClient().deleteWorkspaceProjectRelease(
      persistedWorkspaceId,
      persistedProjectId,
      resolvePersistedEntityIdFromKey(releaseId) || releaseId,
    );
    return Result.success(
      this.normalizeProjectReleaseRecord(response.data, persistedWorkspaceId, persistedProjectId),
    );
  }

  private async restoreProjectReleaseFromServer(
    workspaceId: string,
    projectId: string,
    releaseId: string,
  ): Promise<ServiceResult<StudioProjectReleaseRecord>> {
    const persistedWorkspaceId = resolvePersistedEntityIdFromKey(workspaceId);
    const persistedProjectId = resolvePersistedEntityIdFromKey(projectId);
    if (!persistedWorkspaceId) {
      return Result.error('Workspace id is required');
    }
    if (!persistedProjectId) {
      return Result.error('Project id is required');
    }

    const response = await this.getServerClient().restoreWorkspaceProjectRelease(
      persistedWorkspaceId,
      persistedProjectId,
      resolvePersistedEntityIdFromKey(releaseId) || releaseId,
    );
    return Result.success(
      this.normalizeProjectReleaseRecord(response.data, persistedWorkspaceId, persistedProjectId),
    );
  }

  private async readProjectReleaseManifestFromServer(
    workspaceId: string,
    projectId: string,
    releaseId: string,
  ): Promise<ServiceResult<StudioProjectReleaseManifest>> {
    const persistedWorkspaceId = resolvePersistedEntityIdFromKey(workspaceId);
    const persistedProjectId = resolvePersistedEntityIdFromKey(projectId);
    if (!persistedWorkspaceId) {
      return Result.error('Workspace id is required');
    }
    if (!persistedProjectId) {
      return Result.error('Project id is required');
    }

    const response = await this.getServerClient().readWorkspaceProjectReleaseManifest(
      persistedWorkspaceId,
      persistedProjectId,
      resolvePersistedEntityIdFromKey(releaseId) || releaseId,
    );
    return Result.success(
      this.normalizeProjectReleaseManifest(response.data, persistedWorkspaceId, persistedProjectId),
    );
  }

  private async rebuildProjectReleaseFromServer(
    workspaceId: string,
    projectId: string,
    releaseId: string,
  ): Promise<ServiceResult<StudioProjectReleaseRecord>> {
    const persistedWorkspaceId = resolvePersistedEntityIdFromKey(workspaceId);
    const persistedProjectId = resolvePersistedEntityIdFromKey(projectId);
    if (!persistedWorkspaceId) {
      return Result.error('Workspace id is required');
    }
    if (!persistedProjectId) {
      return Result.error('Project id is required');
    }

    const response = await this.getServerClient().rebuildWorkspaceProjectRelease(
      persistedWorkspaceId,
      persistedProjectId,
      resolvePersistedEntityIdFromKey(releaseId) || releaseId,
    );
    return Result.success(
      this.normalizeProjectReleaseRecord(response.data, persistedWorkspaceId, persistedProjectId),
    );
  }

  async initialize(): Promise<void> {
    const rootLayout = await this.getRootLayout();
    try {
      await vfs.createDir(rootLayout.workspacesRoot);
    } catch {
      // Keep running if directory already exists.
    }
  }

  async findAll(pageRequest?: PageRequest): Promise<ServiceResult<Page<StudioWorkspace>>> {
    try {
      return await this.findAllFromServer(pageRequest);
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to query workspace list'));
    }
  }

  async findById(id: string): Promise<ServiceResult<StudioWorkspace | null>> {
    try {
      return await this.findWorkspaceByIdFromServer(id);
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to load workspace detail'));
    }
  }

  async existsById(id: string): Promise<boolean> {
    const result = await this.findById(id);
    return Boolean(result.success && result.data);
  }

  async save(entity: Partial<StudioWorkspace>): Promise<ServiceResult<StudioWorkspace>> {
    try {
      return await this.saveWorkspaceToServer(entity);
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to update workspace'));
    }
  }

  async saveAll(_entities: Partial<StudioWorkspace>[]): Promise<ServiceResult<StudioWorkspace[]>> {
    throw new Error('Batch save not supported');
  }

  async deleteById(id: string): Promise<ServiceResult<void>> {
    return this.deleteWorkspace(id);
  }

  async delete(entity: StudioWorkspace): Promise<ServiceResult<void>> {
    return this.deleteWorkspace(entity.uuid);
  }

  async deleteAll(ids: string[]): Promise<ServiceResult<void>> {
    for (const id of ids) {
      const result = await this.deleteById(id);
      if (!result.success) {
        return Result.error(result.message || 'Failed to delete workspaces');
      }
    }

    return Result.success(undefined);
  }

  async findAllById(ids: string[]): Promise<ServiceResult<StudioWorkspace[]>> {
    const all = await this.findAll();
    const found =
      all.data?.content.filter((workspace) =>
        ids.some((id) => matchesEntityKey(workspace, id)),
      ) || [];
    return Result.success(found);
  }

  async count(): Promise<number> {
    const all = await this.findAll();
    return all.data?.totalElements || 0;
  }

  async createWorkspace(
    name: string,
    description?: string,
    icon?: string,
  ): Promise<ServiceResult<StudioWorkspace>> {
    try {
      return await this.createWorkspaceToServer(name, description, icon);
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to create workspace'));
    }
  }

  async createProject(
    workspaceId: string,
    name: string,
    type: ProjectType,
    description: string,
    coverImage?: { data: Uint8Array; name: string },
  ): Promise<ServiceResult<StudioProject>> {
    try {
      return await this.createProjectToServer(
        workspaceId,
        name,
        type,
        description,
        coverImage,
      );
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to create project'));
    }
  }

  async deleteWorkspace(workspaceId: string): Promise<ServiceResult<void>> {
    try {
      return await this.deleteWorkspaceFromServer(workspaceId);
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to delete workspace'));
    }
  }

  async deleteProject(workspaceId: string, projectId: string): Promise<ServiceResult<void>> {
    try {
      return await this.deleteProjectFromServer(workspaceId, projectId);
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to delete project'));
    }
  }

  async saveProject(projectData: {
    workspaceId: string;
    name: string;
    type: ProjectType;
    description: string;
    coverImage?: { data: Uint8Array; name: string };
  }): Promise<ServiceResult<StudioProject>>;
  async saveProject(
    workspaceId: string,
    projectData: {
      name: string;
      type: ProjectType;
      description: string;
      coverImage?: { data: Uint8Array; name: string };
    },
  ): Promise<ServiceResult<StudioProject>>;
  async saveProject(
    workspaceOrProjectData:
      | string
      | {
          workspaceId: string;
          name: string;
          type: ProjectType;
          description: string;
          coverImage?: { data: Uint8Array; name: string };
        },
    maybeProjectData?: {
      name: string;
      type: ProjectType;
      description: string;
      coverImage?: { data: Uint8Array; name: string };
    },
  ): Promise<ServiceResult<StudioProject>> {
    if (typeof workspaceOrProjectData === 'string') {
      return this.createProject(
        workspaceOrProjectData,
        maybeProjectData?.name || FALLBACK_PROJECT_NAME,
        maybeProjectData?.type || 'APP',
        maybeProjectData?.description || '',
        maybeProjectData?.coverImage,
      );
    }

    return this.createProject(
      workspaceOrProjectData.workspaceId,
      workspaceOrProjectData.name,
      workspaceOrProjectData.type,
      workspaceOrProjectData.description,
      workspaceOrProjectData.coverImage,
    );
  }

  async updateWorkspace(uuid: string, name: string): Promise<ServiceResult<void>> {
    const result = await this.save({ uuid, name });
    if (!result.success) {
      return Result.error(result.message || 'Update failed');
    }

    return Result.success(undefined);
  }

  async listProjects(workspaceId: string): Promise<ServiceResult<StudioProject[]>> {
    try {
      const persistedWorkspaceId = resolvePersistedEntityIdFromKey(workspaceId);
      if (!persistedWorkspaceId) {
        return Result.error('Workspace id is required');
      }

      const response = await this.getServerClient().listWorkspaceProjects(persistedWorkspaceId);
      return Result.success(
        response.items.map((project) => this.normalizeProject(project, persistedWorkspaceId)),
      );
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to list workspace projects'));
    }
  }

  async listRecentProjects(): Promise<ServiceResult<StudioProject[]>> {
    try {
      const response = await this.getServerClient().listRecentWorkspaceProjects();
      return Result.success(response.items.map((project) => this.normalizeProject(project)));
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to list recent projects'));
    }
  }

  async readProjectSession(
    workspaceId: string,
    projectId: string,
  ): Promise<ServiceResult<StudioProjectSession | null>> {
    try {
      return await this.readProjectSessionFromServer(workspaceId, projectId);
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to read project session'));
    }
  }

  async saveProjectSession(
    workspaceId: string,
    projectId: string,
    session: {
      openFiles: StudioProjectSessionOpenFile[];
      activeFilePath?: string | null;
      selectedPath?: string | null;
      expandedPaths?: string[];
    },
  ): Promise<ServiceResult<StudioProjectSession>> {
    try {
      return await this.saveProjectSessionToServer(workspaceId, projectId, session);
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to save project session'));
    }
  }

  async clearProjectSession(
    workspaceId: string,
    projectId: string,
  ): Promise<ServiceResult<void>> {
    try {
      return await this.deleteProjectSessionFromServer(workspaceId, projectId);
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to clear project session'));
    }
  }

  async syncProjectToGit(
    workspaceId: string,
    projectId: string,
    input: {
      repository: string;
      branch: string;
      token?: string;
      message?: string;
    },
  ): Promise<ServiceResult<StudioProjectGitSyncRecord>> {
    try {
      return await this.syncProjectToGitFromServer(workspaceId, projectId, input);
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to sync project to git'));
    }
  }

  async listProjectGitSyncs(
    workspaceId: string,
    projectId: string,
  ): Promise<ServiceResult<StudioProjectGitSyncRecord[]>> {
    try {
      return await this.listProjectGitSyncsFromServer(workspaceId, projectId);
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to list project git syncs'));
    }
  }

  async readLatestProjectGitSync(
    workspaceId: string,
    projectId: string,
  ): Promise<ServiceResult<StudioProjectGitSyncRecord>> {
    try {
      return await this.readLatestProjectGitSyncFromServer(workspaceId, projectId);
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to read latest project git sync'));
    }
  }

  async readProjectGitSync(
    workspaceId: string,
    projectId: string,
    syncId: string,
  ): Promise<ServiceResult<StudioProjectGitSyncRecord>> {
    try {
      return await this.readProjectGitSyncFromServer(workspaceId, projectId, syncId);
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to read project git sync'));
    }
  }

  async retryProjectGitSync(
    workspaceId: string,
    projectId: string,
    syncId: string,
    input: {
      token?: string;
      message?: string;
    } = {},
  ): Promise<ServiceResult<StudioProjectGitSyncRecord>> {
    try {
      return await this.retryProjectGitSyncFromServer(workspaceId, projectId, syncId, input);
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to retry project git sync'));
    }
  }

  async listProjectReleases(
    workspaceId: string,
    projectId: string,
  ): Promise<ServiceResult<StudioProjectReleaseRecord[]>> {
    try {
      return await this.listProjectReleasesFromServer(workspaceId, projectId);
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to list project releases'));
    }
  }

  async readProjectReleaseStats(
    workspaceId: string,
    projectId: string,
  ): Promise<ServiceResult<StudioProjectReleaseStats>> {
    try {
      return await this.readProjectReleaseStatsFromServer(workspaceId, projectId);
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to read project release stats'));
    }
  }

  async pruneProjectReleases(
    workspaceId: string,
    projectId: string,
    input: {
      dryRun?: boolean;
      releaseIds?: string[];
    } = {},
  ): Promise<ServiceResult<StudioProjectReleasePruneResult>> {
    try {
      return await this.pruneProjectReleasesFromServer(workspaceId, projectId, input);
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to prune project releases'));
    }
  }

  async readProjectReleaseRetentionPolicy(
    workspaceId: string,
    projectId: string,
  ): Promise<ServiceResult<StudioProjectReleaseRetentionPolicy>> {
    try {
      return await this.readProjectReleaseRetentionPolicyFromServer(workspaceId, projectId);
    } catch (error: unknown) {
      return Result.error(
        toErrorMessage(error, 'Failed to read project release retention policy'),
      );
    }
  }

  async updateProjectReleaseRetentionPolicy(
    workspaceId: string,
    projectId: string,
    input: {
      enabled: boolean;
      keepLatestCount: number;
      maxDeletedCount?: number | null;
      pruneDeletedOlderThanDays?: number | null;
      autoApplyOnCreate: boolean;
    },
  ): Promise<ServiceResult<StudioProjectReleaseRetentionPolicy>> {
    try {
      return await this.updateProjectReleaseRetentionPolicyFromServer(
        workspaceId,
        projectId,
        input,
      );
    } catch (error: unknown) {
      return Result.error(
        toErrorMessage(error, 'Failed to update project release retention policy'),
      );
    }
  }

  async applyProjectReleaseRetentionPolicy(
    workspaceId: string,
    projectId: string,
    input: {
      dryRun?: boolean;
    } = {},
  ): Promise<ServiceResult<StudioProjectReleaseRetentionPolicyApplyResult>> {
    try {
      return await this.applyProjectReleaseRetentionPolicyFromServer(
        workspaceId,
        projectId,
        input,
      );
    } catch (error: unknown) {
      return Result.error(
        toErrorMessage(error, 'Failed to apply project release retention policy'),
      );
    }
  }

  async createProjectRelease(
    workspaceId: string,
    projectId: string,
    input: {
      appName: string;
      version: string;
      target: StudioProjectReleaseTarget;
      autoDeploy?: boolean;
    },
  ): Promise<ServiceResult<StudioProjectReleaseRecord>> {
    try {
      return await this.createProjectReleaseFromServer(workspaceId, projectId, input);
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to create project release'));
    }
  }

  async readLatestProjectRelease(
    workspaceId: string,
    projectId: string,
  ): Promise<ServiceResult<StudioProjectReleaseRecord>> {
    try {
      return await this.readLatestProjectReleaseFromServer(workspaceId, projectId);
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to read latest project release'));
    }
  }

  async readProjectRelease(
    workspaceId: string,
    projectId: string,
    releaseId: string,
  ): Promise<ServiceResult<StudioProjectReleaseRecord>> {
    try {
      return await this.readProjectReleaseFromServer(workspaceId, projectId, releaseId);
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to read project release'));
    }
  }

  async deleteProjectRelease(
    workspaceId: string,
    projectId: string,
    releaseId: string,
  ): Promise<ServiceResult<StudioProjectReleaseRecord>> {
    try {
      return await this.deleteProjectReleaseFromServer(workspaceId, projectId, releaseId);
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to delete project release'));
    }
  }

  async restoreProjectRelease(
    workspaceId: string,
    projectId: string,
    releaseId: string,
  ): Promise<ServiceResult<StudioProjectReleaseRecord>> {
    try {
      return await this.restoreProjectReleaseFromServer(workspaceId, projectId, releaseId);
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to restore project release'));
    }
  }

  async readProjectReleaseManifest(
    workspaceId: string,
    projectId: string,
    releaseId: string,
  ): Promise<ServiceResult<StudioProjectReleaseManifest>> {
    try {
      return await this.readProjectReleaseManifestFromServer(workspaceId, projectId, releaseId);
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to read project release manifest'));
    }
  }

  async rebuildProjectRelease(
    workspaceId: string,
    projectId: string,
    releaseId: string,
  ): Promise<ServiceResult<StudioProjectReleaseRecord>> {
    try {
      return await this.rebuildProjectReleaseFromServer(workspaceId, projectId, releaseId);
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to rebuild project release'));
    }
  }

  async openProject(
    workspaceId: string,
    projectId: string,
  ): Promise<ServiceResult<StudioProject>> {
    try {
      return await this.runProjectLifecycleAction(
        workspaceId,
        projectId,
        (client, persistedWorkspaceId, persistedProjectId) =>
          client.openWorkspaceProject(persistedWorkspaceId, persistedProjectId),
      );
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to open project'));
    }
  }

  async duplicateProject(
    workspaceId: string,
    projectId: string,
  ): Promise<ServiceResult<StudioProject>> {
    try {
      return await this.runProjectLifecycleAction(
        workspaceId,
        projectId,
        (client, persistedWorkspaceId, persistedProjectId) =>
          client.duplicateWorkspaceProject(persistedWorkspaceId, persistedProjectId),
      );
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to duplicate project'));
    }
  }

  async archiveProject(
    workspaceId: string,
    projectId: string,
  ): Promise<ServiceResult<StudioProject>> {
    try {
      return await this.runProjectLifecycleAction(
        workspaceId,
        projectId,
        (client, persistedWorkspaceId, persistedProjectId) =>
          client.archiveWorkspaceProject(persistedWorkspaceId, persistedProjectId),
      );
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to archive project'));
    }
  }

  async restoreProject(
    workspaceId: string,
    projectId: string,
  ): Promise<ServiceResult<StudioProject>> {
    try {
      return await this.runProjectLifecycleAction(
        workspaceId,
        projectId,
        (client, persistedWorkspaceId, persistedProjectId) =>
          client.restoreWorkspaceProject(persistedWorkspaceId, persistedProjectId),
      );
    } catch (error: unknown) {
      return Result.error(toErrorMessage(error, 'Failed to restore project'));
    }
  }
}

export const workspaceService: WorkspaceService = new WorkspaceService();

export const getWorkspaces = workspaceService.findAll.bind(workspaceService);
