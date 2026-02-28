import {
  MediaResourceType,
  type AssetBusinessDomain,
  type AssetContentKey,
  type AssetScope,
  type AssetLocator,
  type AssetAtomicMediaResource,
  type AssetLifecycleStatus,
  type AssetDomainReference,
  type UnifiedAssetPayload,
  type UnifiedDigitalAsset
} from '@sdkwork/react-types';

export interface ImportAssetInput {
  scope: AssetScope;
  type: AssetContentKey;
  name: string;
  data?: Uint8Array | Blob;
  sourcePath?: string;
  remoteUrl?: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
  labels?: string[];
  references?: AssetDomainReference[];
  status?: AssetLifecycleStatus;
  additionalAssets?: AssetAtomicMediaResource[];
}

export interface RegisterExistingAssetInput {
  scope: AssetScope;
  type: AssetContentKey;
  name: string;
  locator: AssetLocator;
  metadata?: Record<string, unknown>;
  tags?: string[];
  labels?: string[];
  references?: AssetDomainReference[];
  status?: AssetLifecycleStatus;
  additionalAssets?: AssetAtomicMediaResource[];
  size?: number;
  assetId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAssetOptions {
  idGenerator?: () => string;
  now?: () => string;
}

export interface AssetMutationResult {
  asset: UnifiedDigitalAsset;
  primaryLocator: AssetLocator;
}

export const ASSET_CENTER_MAX_PAGE_SIZE = 200;

export const ASSET_CENTER_DEFAULT_SORT = ['updatedAt,desc'];

export const ASSET_CENTER_PROTOCOL = 'assets://';

export const DOMAIN_ALLOWED_TYPES: Record<AssetBusinessDomain, AssetContentKey[]> = {
  'asset-center': ['video', 'image', 'audio', 'music', 'voice', 'text', 'character', 'digitalHuman', 'model3d', 'lottie', 'file', 'effect', 'transition', 'subtitle', 'sfx'],
  notes: ['text', 'image', 'video', 'audio', 'voice', 'file', 'subtitle'],
  canvas: ['video', 'image', 'audio', 'music', 'voice', 'text', 'character', 'digitalHuman', 'model3d', 'lottie', 'file', 'effect', 'transition', 'subtitle', 'sfx'],
  'image-studio': ['image', 'file'],
  'video-studio': ['video', 'image', 'audio', 'music', 'voice', 'effect', 'transition', 'subtitle', 'file'],
  'audio-studio': ['audio', 'music', 'voice', 'sfx', 'file'],
  music: ['music', 'audio', 'file'],
  'voice-speaker': ['voice', 'audio', 'file'],
  magiccut: ['video', 'image', 'audio', 'music', 'voice', 'text', 'effect', 'transition', 'subtitle', 'sfx', 'file'],
  film: ['video', 'image', 'audio', 'music', 'voice', 'text', 'character', 'digitalHuman', 'model3d', 'file'],
  'portal-video': ['video', 'image', 'audio', 'music', 'voice', 'text', 'effect', 'transition', 'subtitle', 'file'],
  character: ['character', 'digitalHuman', 'image', 'video', 'voice', 'file'],
  sfx: ['sfx', 'audio', 'file']
};

export const normalizeTags = (tags?: string[]): string[] | undefined => {
  if (!tags || tags.length === 0) return undefined;
  const normalized = Array.from(new Set(tags.map((item) => item.trim()).filter(Boolean)));
  return normalized.length > 0 ? normalized : undefined;
};

export const buildAssetKey = (scope: AssetScope, assetId: string): string => {
  return `${scope.workspaceId}/${scope.domain}/${assetId}`;
};

export const mapContentKeyToMediaType = (type: AssetContentKey): MediaResourceType => {
  switch (type) {
    case 'image':
      return MediaResourceType.IMAGE;
    case 'video':
      return MediaResourceType.VIDEO;
    case 'audio':
      return MediaResourceType.AUDIO;
    case 'music':
      return MediaResourceType.MUSIC;
    case 'voice':
      return MediaResourceType.VOICE;
    case 'text':
      return MediaResourceType.TEXT;
    case 'subtitle':
      return MediaResourceType.SUBTITLE;
    case 'character':
    case 'digitalHuman':
      return MediaResourceType.CHARACTER;
    case 'model3d':
      return MediaResourceType.MODEL_3D;
    case 'lottie':
      return MediaResourceType.LOTTIE;
    case 'effect':
      return MediaResourceType.EFFECT;
    case 'transition':
      return MediaResourceType.TRANSITION;
    case 'sfx':
      return MediaResourceType.AUDIO;
    case 'file':
    default:
      return MediaResourceType.FILE;
  }
};

export const buildUnifiedAssetPayload = (
  primaryType: AssetContentKey,
  primary: AssetAtomicMediaResource,
  assets: AssetAtomicMediaResource[]
): UnifiedAssetPayload => {
  const payload: UnifiedAssetPayload = {
    assets
  };

  switch (primaryType) {
    case 'video':
      payload.video = primary as UnifiedAssetPayload['video'];
      break;
    case 'image':
      payload.image = primary as UnifiedAssetPayload['image'];
      break;
    case 'audio':
      payload.audio = primary as UnifiedAssetPayload['audio'];
      break;
    case 'music':
      payload.music = primary as UnifiedAssetPayload['music'];
      break;
    case 'voice':
      payload.voice = primary as UnifiedAssetPayload['voice'];
      break;
    case 'text':
      payload.text = primary as unknown as UnifiedAssetPayload['text'];
      break;
    case 'character':
      payload.character = primary as UnifiedAssetPayload['character'];
      break;
    case 'digitalHuman':
      payload.digitalHuman = primary as UnifiedAssetPayload['digitalHuman'];
      break;
    case 'model3d':
      payload.model3d = primary as UnifiedAssetPayload['model3d'];
      break;
    case 'lottie':
      payload.lottie = primary as UnifiedAssetPayload['lottie'];
      break;
    case 'file':
      payload.file = primary as UnifiedAssetPayload['file'];
      break;
    case 'effect':
      payload.effect = primary as UnifiedAssetPayload['effect'];
      break;
    case 'transition':
      payload.transition = primary as UnifiedAssetPayload['transition'];
      break;
    case 'subtitle':
      payload.subtitle = primary as UnifiedAssetPayload['subtitle'];
      break;
    case 'sfx':
      payload.sfx = primary as UnifiedAssetPayload['sfx'];
      break;
    default:
      break;
  }

  return payload;
};

export const readUnifiedPayloadPrimary = (
  payload: UnifiedAssetPayload,
  primaryType: AssetContentKey
): AssetAtomicMediaResource | undefined => {
  let primary: UnifiedAssetPayload[AssetContentKey] | undefined;

  switch (primaryType) {
    case 'video':
      primary = payload.video;
      break;
    case 'image':
      primary = payload.image;
      break;
    case 'audio':
      primary = payload.audio;
      break;
    case 'music':
      primary = payload.music;
      break;
    case 'voice':
      primary = payload.voice;
      break;
    case 'text':
      primary = payload.text;
      break;
    case 'character':
      primary = payload.character;
      break;
    case 'digitalHuman':
      primary = payload.digitalHuman;
      break;
    case 'model3d':
      primary = payload.model3d;
      break;
    case 'lottie':
      primary = payload.lottie;
      break;
    case 'file':
      primary = payload.file;
      break;
    case 'effect':
      primary = payload.effect;
      break;
    case 'transition':
      primary = payload.transition;
      break;
    case 'subtitle':
      primary = payload.subtitle;
      break;
    case 'sfx':
      primary = payload.sfx;
      break;
    default:
      primary = undefined;
  }

  return (primary as AssetAtomicMediaResource | undefined) || payload.assets[0];
};
