// Unified asset center type definitions
// Canonical domain model for browser + tauri + remote URL asset workflows

import type { BaseEntity } from './base.types';
import type { Page, PageRequest } from './common.types';
import type {
  AssetAtomicMediaResource,
  AssetContentKey,
  VideoMediaResource,
  ImageMediaResource,
  AudioMediaResource,
  MusicMediaResource,
  VoiceMediaResource,
  TextMediaResource,
  CharacterMediaResource,
  DigitalHumanMediaResource,
  Model3DMediaResource,
  LottieMediaResource,
  FileMediaResource,
  EffectMediaResource,
  TransitionMediaResource,
  SubtitleMediaResource,
  SfxMediaResource
} from './media.types';

// ============================================================================
// Asset Scope
// ============================================================================

export type AssetBusinessDomain =
  | 'asset-center'
  | 'notes'
  | 'canvas'
  | 'image-studio'
  | 'video-studio'
  | 'audio-studio'
  | 'music'
  | 'voice-speaker'
  | 'magiccut'
  | 'film'
  | 'portal-video'
  | 'character'
  | 'sfx';

export interface AssetScope {
  workspaceId: string;
  projectId?: string;
  collectionId?: string;
  domain: AssetBusinessDomain;
}

// ============================================================================
// Storage & Locator
// ============================================================================

export type AssetStorageMode = 'browser-vfs' | 'tauri-fs' | 'remote-url' | 'hybrid';

export type AssetLocatorProtocol = 'assets' | 'file' | 'http' | 'https' | 'tauri';

export interface AssetLocator {
  protocol: AssetLocatorProtocol;
  uri: string;
  path?: string;
  url?: string;
  checksum?: string;
}

export interface AssetStorageDescriptor {
  mode: AssetStorageMode;
  primary: AssetLocator;
  replicas?: AssetLocator[];
  cacheable: boolean;
  encrypted?: boolean;
}

// ============================================================================
// Lifecycle
// ============================================================================

export type AssetLifecycleStatus =
  | 'draft'
  | 'imported'
  | 'generated'
  | 'processing'
  | 'ready'
  | 'archived'
  | 'deleted';

export interface AssetVersionInfo {
  version: number;
  parentAssetId?: string;
  derivedFromResourceId?: string;
}

export type AssetRelationType =
  | 'primary'
  | 'reference'
  | 'derived'
  | 'attachment'
  | 'thumbnail'
  | 'preview';

export interface AssetDomainReference {
  domain: AssetBusinessDomain;
  entityType: string;
  entityId: string;
  relation: AssetRelationType;
  slot?: string;
  order?: number;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Canonical Payload
// ============================================================================

export interface UnifiedAssetPayload {
  video?: VideoMediaResource;
  image?: ImageMediaResource;
  audio?: AudioMediaResource;
  music?: MusicMediaResource;
  voice?: VoiceMediaResource;
  text?: TextMediaResource;
  character?: CharacterMediaResource;
  digitalHuman?: DigitalHumanMediaResource;
  model3d?: Model3DMediaResource;
  lottie?: LottieMediaResource;
  file?: FileMediaResource;
  effect?: EffectMediaResource;
  transition?: TransitionMediaResource;
  subtitle?: SubtitleMediaResource;
  sfx?: SfxMediaResource;
  // Multi-content assets are represented here.
  assets: AssetAtomicMediaResource[];
}

// ============================================================================
// Aggregate Root
// ============================================================================

export interface UnifiedDigitalAsset extends BaseEntity {
  assetId: string;
  key: string;
  title: string;
  description?: string;
  primaryType: AssetContentKey;
  payload: UnifiedAssetPayload;
  scope: AssetScope;
  storage: AssetStorageDescriptor;
  status: AssetLifecycleStatus;
  tags?: string[];
  labels?: string[];
  isFavorite?: boolean;
  versionInfo: AssetVersionInfo;
  references?: AssetDomainReference[];
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Query / Search
// ============================================================================

export interface AssetCenterPageRequest extends PageRequest {
  page: number;
  size: number;
  sort?: string[];
  keyword?: string;
  scope?: Partial<AssetScope>;
  types?: AssetContentKey[];
  origins?: Array<'upload' | 'ai' | 'stock' | 'system'>;
  tags?: string[];
  status?: AssetLifecycleStatus[];
  reference?: Partial<Pick<AssetDomainReference, 'entityType' | 'entityId' | 'relation'>>;
  includeDeleted?: boolean;
}

export interface AssetCenterBatchQueryRequest {
  queries: AssetCenterPageRequest[];
}

export interface AssetCenterStats {
  totalAssets: number;
  totalReady: number;
  totalProcessing: number;
  totalArchived: number;
  totalDeleted: number;
  totalFavorites: number;
  byType: Record<AssetContentKey, number>;
  byDomain: Record<AssetBusinessDomain, number>;
}

export type UnifiedAssetQuery = AssetCenterPageRequest;

export type UnifiedAssetQueryResult = Page<UnifiedDigitalAsset>;

// ============================================================================
// Portal Launch Orchestration
// ============================================================================

export type PortalLaunchTarget =
  | 'short_drama'
  | 'video'
  | 'image'
  | 'one_click'
  | 'human'
  | 'music'
  | 'speech';

export type PortalLaunchAttachmentType =
  | 'image'
  | 'video'
  | 'audio'
  | 'script'
  | 'file';

export interface PortalLaunchAttachmentRef {
  id: string;
  name: string;
  type: PortalLaunchAttachmentType;
  assetId?: string;
  locator?: string;
  content?: string;
}

export interface PortalLaunchSession {
  sessionId: string;
  source: 'portal-video';
  target: PortalLaunchTarget;
  prompt: string;
  genMode?: string;
  model?: string;
  styleId?: string;
  aspectRatio?: string;
  resolution?: string;
  duration?: string;
  attachments: PortalLaunchAttachmentRef[];
  workspaceId: string;
  projectId?: string;
  createdAt: number;
  expiresAt: number;
}

export interface SavePortalLaunchSessionInput {
  target: PortalLaunchTarget;
  prompt?: string;
  genMode?: string;
  model?: string;
  styleId?: string;
  aspectRatio?: string;
  resolution?: string;
  duration?: string;
  attachments?: PortalLaunchAttachmentRef[];
}
