import type { AgiGenerationMode, AgiGenerationProduct } from './agi.types';
import type { AssetBusinessDomain, AssetStorageMode } from './asset-center.types';
import type { ClientEntityIdentity } from './base.types';
import type { AssetContentKey, AnyMediaResource } from './media.types';

export type ProjectGraphSurface =
  | 'canvas-project'
  | 'canvas-board'
  | 'canvas-element'
  | 'film-project'
  | 'film-scene'
  | 'film-shot'
  | 'magiccut-project'
  | 'magiccut-timeline'
  | 'magiccut-track'
  | 'magiccut-clip';

export type ProjectGraphEntityType =
  | 'workspace'
  | 'project'
  | 'sequence'
  | 'scene'
  | 'shot'
  | 'timeline'
  | 'track'
  | 'clip'
  | 'publish-target';

export type ProjectGraphProjectDomain = 'canvas' | 'film' | 'magiccut' | 'unified';

export interface ProjectGraphMediaSource {
  assetId: string | null;
  primaryResourceId?: string | null;
  resourceViewId?: string | null;
  primaryType?: AssetContentKey;
  storageMode?: AssetStorageMode;
  scopeDomain?: AssetBusinessDomain;
  sourceRecipeId?: string | null;
  sourceRecipeUuid?: string | null;
  sourceExecutionId?: string | null;
  sourceExecutionUuid?: string | null;
  sourceArtifactId?: string | null;
  sourceArtifactUuid?: string | null;
  metadata?: Record<string, unknown>;
}

export interface ProjectGraphWorkspace extends ClientEntityIdentity {
  name: string;
  projectUuids: string[];
  metadata?: Record<string, unknown>;
}

export interface ProjectGraphProject extends ClientEntityIdentity {
  domain: ProjectGraphProjectDomain;
  name: string;
  description?: string;
  workspaceUuid?: string | null;
  sequenceUuids: string[];
  timelineUuids: string[];
  publishTargetUuids: string[];
  metadata?: Record<string, unknown>;
}

export interface ProjectGraphSequence extends ClientEntityIdentity {
  projectUuid: string;
  name: string;
  order: number;
  boardUuid?: string | null;
  timelineUuid?: string | null;
  sceneUuids: string[];
  shotUuids: string[];
  metadata?: Record<string, unknown>;
}

export interface ProjectGraphScene extends ClientEntityIdentity {
  projectUuid: string;
  sequenceUuid: string;
  order: number;
  title?: string;
  summary?: string;
  startTime?: number;
  duration?: number;
  shotUuids: string[];
  metadata?: Record<string, unknown>;
}

export interface ProjectGraphShot extends ClientEntityIdentity {
  projectUuid: string;
  sequenceUuid: string;
  sceneUuid: string;
  order: number;
  title?: string;
  prompt?: string;
  product?: AgiGenerationProduct;
  mode?: AgiGenerationMode;
  clipUuid?: string | null;
  source?: ProjectGraphMediaSource | null;
  metadata?: Record<string, unknown>;
}

export interface ProjectGraphTimeline extends ClientEntityIdentity {
  projectUuid: string;
  sequenceUuid?: string | null;
  name: string;
  fps: number;
  duration: number;
  trackUuids: string[];
  metadata?: Record<string, unknown>;
}

export interface ProjectGraphTrack extends ClientEntityIdentity {
  projectUuid: string;
  timelineUuid: string;
  sceneUuid?: string | null;
  order: number;
  trackType: string;
  name?: string;
  clipUuids: string[];
  metadata?: Record<string, unknown>;
}

export interface ProjectGraphClip extends ClientEntityIdentity {
  projectUuid: string;
  timelineUuid: string;
  trackUuid: string;
  sequenceUuid?: string | null;
  sceneUuid?: string | null;
  shotUuid?: string | null;
  start: number;
  duration: number;
  offset?: number;
  speed?: number;
  clipType?: string;
  source?: ProjectGraphMediaSource | null;
  metadata?: Record<string, unknown>;
}

export interface ProjectGraphPublishTarget extends ClientEntityIdentity {
  projectUuid: string;
  targetType: string;
  locator?: string;
  status?: string;
  metadata?: Record<string, unknown>;
}

export interface ProjectGraphSurfaceBinding extends ClientEntityIdentity {
  surface: ProjectGraphSurface;
  surfaceEntityId: string | null;
  surfaceEntityUuid: string;
  graphEntityType: ProjectGraphEntityType;
  graphEntityId: string | null;
  graphEntityUuid: string;
  metadata?: Record<string, unknown>;
}

export interface ProjectGraphDocument {
  version: 1;
  workspace?: ProjectGraphWorkspace;
  project: ProjectGraphProject;
  sequences: Record<string, ProjectGraphSequence>;
  scenes: Record<string, ProjectGraphScene>;
  shots: Record<string, ProjectGraphShot>;
  timelines: Record<string, ProjectGraphTimeline>;
  tracks: Record<string, ProjectGraphTrack>;
  clips: Record<string, ProjectGraphClip>;
  publishTargets: Record<string, ProjectGraphPublishTarget>;
  surfaceBindings: ProjectGraphSurfaceBinding[];
  metadata?: Record<string, unknown>;
}

type ProjectGraphMediaSourceLike = Partial<
  Pick<
    AnyMediaResource,
    | 'id'
    | 'assetId'
    | 'primaryResourceId'
    | 'resourceViewId'
    | 'metadata'
    | 'sourceRecipeId'
    | 'sourceRecipeUuid'
    | 'sourceExecutionId'
    | 'sourceExecutionUuid'
    | 'sourceArtifactId'
    | 'sourceArtifactUuid'
  >
>;

const normalizeNonEmptyString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeContentKey = (value: unknown): AssetContentKey | undefined => {
  switch (value) {
    case 'image':
    case 'video':
    case 'audio':
    case 'music':
    case 'voice':
    case 'text':
    case 'character':
    case 'model3d':
    case 'lottie':
    case 'file':
    case 'effect':
    case 'transition':
    case 'subtitle':
    case 'sfx':
      return value;
    default:
      return undefined;
  }
};

const normalizeStorageMode = (value: unknown): AssetStorageMode | undefined => {
  switch (value) {
    case 'browser-vfs':
    case 'desktop-fs':
    case 'remote-url':
    case 'hybrid':
      return value;
    default:
      return undefined;
  }
};

const normalizeBusinessDomain = (value: unknown): AssetBusinessDomain | undefined => {
  switch (value) {
    case 'asset-center':
    case 'notes':
    case 'canvas':
    case 'image-studio':
    case 'video-studio':
    case 'audio-studio':
    case 'music':
    case 'voice-speaker':
    case 'magiccut':
    case 'film':
    case 'portal-video':
    case 'character':
    case 'sfx':
      return value;
    default:
      return undefined;
  }
};

export const buildProjectGraphMediaSource = (
  resource: ProjectGraphMediaSourceLike
): ProjectGraphMediaSource => {
  const metadata = (resource.metadata || {}) as Record<string, unknown>;
  const assetId =
    normalizeNonEmptyString(resource.assetId) ||
    normalizeNonEmptyString(metadata.assetId);
  const resourceId = normalizeNonEmptyString(resource.id);
  const resourceViewId =
    normalizeNonEmptyString(resource.resourceViewId) ||
    normalizeNonEmptyString(metadata.resourceViewId) ||
    (resourceId && resourceId !== assetId ? resourceId : null);

  return {
    assetId: assetId || null,
    primaryResourceId:
      normalizeNonEmptyString(resource.primaryResourceId) ||
      normalizeNonEmptyString(metadata.primaryResourceId),
    resourceViewId,
    primaryType: normalizeContentKey(metadata.primaryType),
    storageMode: normalizeStorageMode(metadata.storageMode),
    scopeDomain: normalizeBusinessDomain(metadata.scopeDomain),
    sourceRecipeId:
      normalizeNonEmptyString(resource.sourceRecipeId) ||
      normalizeNonEmptyString(metadata.sourceRecipeId),
    sourceRecipeUuid:
      normalizeNonEmptyString(resource.sourceRecipeUuid) ||
      normalizeNonEmptyString(metadata.sourceRecipeUuid),
    sourceExecutionId:
      normalizeNonEmptyString(resource.sourceExecutionId) ||
      normalizeNonEmptyString(metadata.sourceExecutionId),
    sourceExecutionUuid:
      normalizeNonEmptyString(resource.sourceExecutionUuid) ||
      normalizeNonEmptyString(metadata.sourceExecutionUuid),
    sourceArtifactId:
      normalizeNonEmptyString(resource.sourceArtifactId) ||
      normalizeNonEmptyString(metadata.sourceArtifactId),
    sourceArtifactUuid:
      normalizeNonEmptyString(resource.sourceArtifactUuid) ||
      normalizeNonEmptyString(metadata.sourceArtifactUuid),
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
  };
};
