import type { RegisterExistingAssetInput } from '@sdkwork/react-assets';
import {
  MediaResourceType,
  type AnyMediaResource
} from '@sdkwork/react-commons';
import type {
  AssetBusinessDomain,
  AssetAtomicMediaResource,
  AssetContentKey,
  AssetLocator,
  AssetLocatorProtocol,
  AssetStorageMode,
  CutMediaResourceRef,
  UnifiedDigitalAsset,
  UnifiedAssetPayload
} from '@sdkwork/react-types';

type ResourceMetadata = Record<string, unknown> & {
  assetId: string;
  primaryResourceId?: string;
  storageMode?: AssetStorageMode | string;
  scopeDomain?: string;
  primaryType?: AssetContentKey | string;
};

export type MagicCutTimelineResourceView = AnyMediaResource & {
  metadata: ResourceMetadata;
};

export interface MagicCutAssetStateSlice {
  assets: Record<string, UnifiedDigitalAsset>;
  resourceViews: Record<string, MagicCutTimelineResourceView>;
  resources: Record<string, AnyMediaResource>;
}

type ResourceRefLike = {
  id: string;
  uuid?: string;
};

type ClipLike = {
  resource: ResourceRefLike;
};

type LayerLike = {
  resource?: ResourceRefLike;
};

type AssetStateLike = Partial<MagicCutAssetStateSlice> & {
  clips?: Record<string, ClipLike>;
  layers?: Record<string, LayerLike>;
};

const LOCATOR_PROTOCOLS: Array<{ prefix: string; protocol: AssetLocatorProtocol }> = [
  { prefix: 'assets://', protocol: 'assets' },
  { prefix: 'tauri://', protocol: 'tauri' },
  { prefix: 'file://', protocol: 'file' },
  { prefix: 'https://', protocol: 'https' },
  { prefix: 'http://', protocol: 'http' }
];

const isLocatorLike = (value: unknown): boolean => {
  if (typeof value !== 'string' || value.length === 0) {
    return false;
  }

  return (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('assets://') ||
    value.startsWith('asset:') ||
    value.startsWith('file://') ||
    value.startsWith('tauri://') ||
    value.startsWith('blob:') ||
    value.startsWith('data:') ||
    value.startsWith('/') ||
    value.startsWith('./') ||
    value.startsWith('../') ||
    /^[a-zA-Z]:\\/.test(value)
  );
};

const pickCanonicalAssetId = (
  sourceId: string | undefined,
  metadataAssetId: unknown,
  fallbackId: string
): string => {
  if (typeof metadataAssetId === 'string' && metadataAssetId.length > 0 && !isLocatorLike(metadataAssetId)) {
    return metadataAssetId;
  }
  if (typeof sourceId === 'string' && sourceId.length > 0 && !isLocatorLike(sourceId)) {
    return sourceId;
  }
  return fallbackId;
};

const mapContentKeyToMediaType = (type: AssetContentKey): MediaResourceType => {
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

const mapMediaTypeToContentKey = (type: MediaResourceType | string | undefined): AssetContentKey => {
  switch (type) {
    case MediaResourceType.IMAGE:
      return 'image';
    case MediaResourceType.VIDEO:
      return 'video';
    case MediaResourceType.AUDIO:
      return 'audio';
    case MediaResourceType.MUSIC:
      return 'music';
    case MediaResourceType.VOICE:
      return 'voice';
    case MediaResourceType.TEXT:
      return 'text';
    case MediaResourceType.SUBTITLE:
      return 'subtitle';
    case MediaResourceType.CHARACTER:
      return 'character';
    case MediaResourceType.MODEL_3D:
      return 'model3d';
    case MediaResourceType.LOTTIE:
      return 'lottie';
    case MediaResourceType.EFFECT:
      return 'effect';
    case MediaResourceType.TRANSITION:
      return 'transition';
    case MediaResourceType.FILE:
    default:
      return 'file';
  }
};

const normalizeAssetTypeKey = (type: string | undefined): AssetContentKey => {
  switch (type) {
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
      return type;
    default:
      return 'file';
  }
};

const readUnifiedPayloadPrimary = (
  payload: UnifiedAssetPayload,
  primaryType: AssetContentKey
): AssetAtomicMediaResource | undefined => {
  switch (primaryType) {
    case 'video':
      return payload.video as AssetAtomicMediaResource | undefined;
    case 'image':
      return payload.image as AssetAtomicMediaResource | undefined;
    case 'audio':
      return payload.audio as AssetAtomicMediaResource | undefined;
    case 'music':
      return payload.music as AssetAtomicMediaResource | undefined;
    case 'voice':
      return payload.voice as AssetAtomicMediaResource | undefined;
    case 'text':
      return payload.text as AssetAtomicMediaResource | undefined;
    case 'character':
      return payload.character as AssetAtomicMediaResource | undefined;
    case 'model3d':
      return payload.model3d as AssetAtomicMediaResource | undefined;
    case 'lottie':
      return payload.lottie as AssetAtomicMediaResource | undefined;
    case 'effect':
      return payload.effect as AssetAtomicMediaResource | undefined;
    case 'transition':
      return payload.transition as AssetAtomicMediaResource | undefined;
    case 'subtitle':
      return payload.subtitle as AssetAtomicMediaResource | undefined;
    case 'sfx':
      return payload.sfx as AssetAtomicMediaResource | undefined;
    case 'file':
    default:
      return payload.file as AssetAtomicMediaResource | undefined;
  }
};

const mergeResources = <T extends AnyMediaResource>(current: T | undefined, next: T): T => {
  if (!current) {
    return next;
  }

  return {
    ...current,
    ...next,
    metadata: {
      ...(current.metadata || {}),
      ...(next.metadata || {})
    },
    path: next.path || current.path,
    url: next.url || current.url,
    uuid: next.uuid || current.uuid
  } as T;
};

const mergeAssetPayload = (current: UnifiedAssetPayload, next: UnifiedAssetPayload): UnifiedAssetPayload => {
  const nextAssets = next.assets || [];
  const currentAssets = current.assets || [];
  const assetMap = new Map<string, AssetAtomicMediaResource>();

  currentAssets.forEach((item) => {
    assetMap.set(item.id, item);
  });
  nextAssets.forEach((item) => {
    const existing = assetMap.get(item.id);
    assetMap.set(item.id, existing ? mergeResources(existing, item) : item);
  });

  return {
    ...current,
    ...next,
    assets: Array.from(assetMap.values())
  };
};

const mergeAssets = (
  current: UnifiedDigitalAsset | undefined,
  next: UnifiedDigitalAsset
): UnifiedDigitalAsset => {
  if (!current) {
    return next;
  }

  return {
    ...current,
    ...next,
    id: next.assetId || next.id || current.assetId || current.id,
    uuid: next.uuid || current.uuid,
    assetId: next.assetId || next.id || current.assetId || current.id,
    title: next.title || current.title,
    key: next.key || current.key,
    description: next.description || current.description,
    primaryType: next.primaryType || current.primaryType,
    payload: mergeAssetPayload(current.payload, next.payload),
    scope: {
      ...current.scope,
      ...next.scope
    },
    storage: {
      ...current.storage,
      ...next.storage,
      primary: {
        ...current.storage.primary,
        ...next.storage.primary
      },
      replicas: next.storage.replicas || current.storage.replicas
    },
    versionInfo: {
      ...current.versionInfo,
      ...next.versionInfo
    },
    references: next.references || current.references,
    tags: next.tags || current.tags,
    labels: next.labels || current.labels,
    metadata: {
      ...(current.metadata || {}),
      ...(next.metadata || {})
    },
    createdAt: next.createdAt || current.createdAt,
    updatedAt: next.updatedAt || current.updatedAt
  };
};

const detectProtocol = (locator: string): AssetLocatorProtocol => {
  const matched = LOCATOR_PROTOCOLS.find((item) => locator.startsWith(item.prefix));
  if (matched) {
    return matched.protocol;
  }
  if (locator.startsWith('/') || locator.startsWith('./') || locator.startsWith('../') || /^[a-zA-Z]:\\/.test(locator)) {
    return 'file';
  }
  return 'assets';
};

const inferStorageMode = (locator: string): AssetStorageMode => {
  const protocol = detectProtocol(locator);
  if (protocol === 'http' || protocol === 'https') {
    return 'remote-url';
  }
  if (protocol === 'file' || protocol === 'tauri') {
    return 'tauri-fs';
  }
  return 'hybrid';
};

const buildLocator = (locator: string, fallbackUrl?: string): AssetLocator => {
  const protocol = detectProtocol(locator);
  return {
    protocol,
    uri: locator,
    path: protocol === 'http' || protocol === 'https' ? undefined : locator,
    url: fallbackUrl || (protocol === 'http' || protocol === 'https' ? locator : undefined)
  };
};

const buildAssetPayload = (
  primaryType: AssetContentKey,
  primary: AssetAtomicMediaResource
): UnifiedAssetPayload => {
  const payload: UnifiedAssetPayload = {
    assets: [primary]
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
      payload.text = primary as UnifiedAssetPayload['text'];
      break;
    case 'character':
      payload.character = primary as UnifiedAssetPayload['character'];
      break;
    case 'model3d':
      payload.model3d = primary as UnifiedAssetPayload['model3d'];
      break;
    case 'lottie':
      payload.lottie = primary as UnifiedAssetPayload['lottie'];
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
    case 'file':
    default:
      payload.file = primary as UnifiedAssetPayload['file'];
      break;
  }

  return payload;
};

const toTimestamp = (value: unknown): string | number => {
  if (typeof value === 'string' || typeof value === 'number') {
    return value;
  }
  return new Date().toISOString();
};

const buildUnifiedAssetFromLegacyResource = (
  resource: AnyMediaResource,
  canonicalId: string
): UnifiedDigitalAsset => {
  const normalizedResource = normalizeMagicCutResourceView(resource, canonicalId);
  const metadata = {
    ...(normalizedResource.metadata || {})
  };
  const primaryType = mapMediaTypeToContentKey(normalizedResource.type);
  const locatorValue =
    normalizedResource.path ||
    normalizedResource.url ||
    `assets://${canonicalId}`;
  const primaryResourceId =
    typeof normalizedResource.metadata?.primaryResourceId === 'string' &&
    normalizedResource.metadata.primaryResourceId.length > 0
      ? normalizedResource.metadata.primaryResourceId
      : resource.id || canonicalId;
  const primaryResource: AssetAtomicMediaResource = {
    ...normalizedResource,
    id: primaryResourceId,
    uuid: normalizedResource.uuid || primaryResourceId,
    metadata
  };
  const scopeDomain =
    typeof metadata.scopeDomain === 'string' && metadata.scopeDomain.length > 0
      ? metadata.scopeDomain
      : 'magiccut';
  const workspaceId =
    typeof metadata.workspaceId === 'string' && metadata.workspaceId.length > 0
      ? metadata.workspaceId
      : 'default-workspace';
  const projectId =
    typeof metadata.projectId === 'string' && metadata.projectId.length > 0
      ? metadata.projectId
      : undefined;
  const storageMode =
    typeof metadata.storageMode === 'string' && metadata.storageMode.length > 0
      ? (metadata.storageMode as AssetStorageMode)
      : inferStorageMode(locatorValue);

  return {
    id: canonicalId,
    uuid: normalizedResource.uuid || canonicalId,
    assetId: canonicalId,
    key: `${workspaceId}/${scopeDomain}/${canonicalId}`,
    title: normalizedResource.name || canonicalId,
    primaryType,
    payload: buildAssetPayload(primaryType, primaryResource),
    scope: {
      workspaceId,
      projectId,
      domain: scopeDomain as UnifiedDigitalAsset['scope']['domain']
    },
    storage: {
      mode: storageMode,
      primary: buildLocator(locatorValue, normalizedResource.url),
      cacheable: storageMode !== 'remote-url'
    },
    status: 'ready',
    versionInfo: {
      version: 1
    },
    metadata,
    createdAt: toTimestamp(resource.createdAt),
    updatedAt: toTimestamp(resource.updatedAt)
  };
};

const mergeAssetWithResource = (
  asset: UnifiedDigitalAsset,
  resource: AnyMediaResource,
  canonicalId: string
): UnifiedDigitalAsset => {
  const resourceAsset = buildUnifiedAssetFromLegacyResource(resource, canonicalId);
  return mergeAssets(asset, resourceAsset);
};

const remapClipResourceRefs = <T extends ClipLike>(
  clips: Record<string, T> | undefined,
  aliases: Map<string, string>,
  resourceViews: Record<string, MagicCutTimelineResourceView>
): Record<string, T> => {
  if (!clips) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(clips).map(([clipId, clip]) => {
      const nextResourceId = aliases.get(clip.resource.id) || clip.resource.id;
      const nextResource = resourceViews[nextResourceId];
      return [
        clipId,
        {
          ...clip,
          resource: nextResource
            ? {
                ...clip.resource,
                ...buildMagicCutAssetRef(nextResource),
                uuid: clip.resource.uuid || nextResource?.uuid
              }
            : {
                ...clip.resource,
                id: nextResourceId
              }
        }
      ];
    })
  );
};

const remapLayerResourceRefs = <T extends LayerLike>(
  layers: Record<string, T> | undefined,
  aliases: Map<string, string>,
  resourceViews: Record<string, MagicCutTimelineResourceView>
): Record<string, T> => {
  if (!layers) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(layers).map(([layerId, layer]) => {
      if (!layer.resource?.id) {
        return [layerId, layer];
      }
      const nextResourceId = aliases.get(layer.resource.id) || layer.resource.id;
      const nextResource = resourceViews[nextResourceId];
      return [
        layerId,
        {
          ...layer,
          resource: nextResource
            ? {
                ...layer.resource,
                ...buildMagicCutAssetRef(nextResource),
                uuid: layer.resource.uuid || nextResource?.uuid
              }
            : {
                ...layer.resource,
                id: nextResourceId
              }
        }
      ];
    })
  );
};

export const createEmptyMagicCutAssetState = (): MagicCutAssetStateSlice & {
  timelines: Record<string, unknown>;
  tracks: Record<string, unknown>;
  clips: Record<string, never>;
  layers: Record<string, never>;
} => {
  const resourceViews: Record<string, MagicCutTimelineResourceView> = {};
  return {
    assets: {},
    resourceViews,
    resources: resourceViews,
    timelines: {},
    tracks: {},
    clips: {},
    layers: {}
  };
};

export const normalizeMagicCutResourceView = (
  resource: AnyMediaResource,
  fallbackId?: string
): MagicCutTimelineResourceView => {
  const effectiveFallbackId = fallbackId || resource.id;
  const canonicalId = pickCanonicalAssetId(resource.id, resource.metadata?.assetId, effectiveFallbackId);
  const locatorValue = resource.path || resource.url || `assets://${canonicalId}`;
  const metadata: ResourceMetadata = {
    ...(resource.metadata || {}),
    assetId: canonicalId,
    primaryResourceId:
      typeof resource.metadata?.primaryResourceId === 'string' && resource.metadata.primaryResourceId.length > 0
        ? resource.metadata.primaryResourceId
        : resource.id,
    storageMode:
      typeof resource.metadata?.storageMode === 'string' && resource.metadata.storageMode.length > 0
        ? resource.metadata.storageMode
        : inferStorageMode(locatorValue),
    scopeDomain:
      typeof resource.metadata?.scopeDomain === 'string' && resource.metadata.scopeDomain.length > 0
        ? resource.metadata.scopeDomain
        : 'magiccut',
    primaryType:
      (typeof resource.metadata?.primaryType === 'string' && resource.metadata.primaryType.length > 0
        ? resource.metadata.primaryType
        : mapMediaTypeToContentKey(resource.type)) as AssetContentKey
  };

  return {
    ...resource,
    id: canonicalId,
    uuid: resource.uuid || canonicalId,
    path: resource.path || locatorValue,
    url: resource.url || resource.path || locatorValue,
    metadata
  } as MagicCutTimelineResourceView;
};

export const buildMagicCutResourceView = (
  asset: UnifiedDigitalAsset
): MagicCutTimelineResourceView => {
  const primary =
    readUnifiedPayloadPrimary(asset.payload, asset.primaryType) ||
    asset.payload.assets[0];
  const canonicalId = asset.assetId || asset.id;
  const locatorUri = primary?.path || asset.storage.primary.uri || primary?.url || asset.storage.primary.url || '';
  const resolvedUrl = primary?.url || asset.storage.primary.url || primary?.path || asset.storage.primary.uri || '';
  const mergedMetadata: ResourceMetadata = {
    ...(primary?.metadata || {}),
    ...(asset.metadata || {}),
    assetId: canonicalId,
    primaryResourceId: primary?.id,
    storageMode: asset.storage.mode,
    scopeDomain: asset.scope.domain,
    primaryType: asset.primaryType
  };

  return {
    ...(primary as MagicCutTimelineResourceView | undefined),
    id: canonicalId,
    uuid: asset.uuid || canonicalId,
    name: asset.title || primary?.name || canonicalId,
    type: mapContentKeyToMediaType(asset.primaryType),
    path: locatorUri || undefined,
    url: resolvedUrl || undefined,
    metadata: mergedMetadata,
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt
  } as MagicCutTimelineResourceView;
};

export const buildMagicCutAssetRef = (
  resource: Pick<AnyMediaResource, 'id' | 'uuid' | 'metadata'>
): CutMediaResourceRef => {
  const assetId =
    typeof resource.metadata?.assetId === 'string' && resource.metadata.assetId.length > 0
      ? resource.metadata.assetId
      : resource.id;
  const resourceViewId = resource.id || assetId;

  return {
    type: 'MediaResource',
    id: resourceViewId,
    uuid: resource.uuid || assetId,
    assetId,
    resourceViewId,
    primaryResourceId:
      typeof resource.metadata?.primaryResourceId === 'string' && resource.metadata.primaryResourceId.length > 0
        ? resource.metadata.primaryResourceId
        : undefined,
    primaryType:
      typeof resource.metadata?.primaryType === 'string' && resource.metadata.primaryType.length > 0
        ? (resource.metadata.primaryType as AssetContentKey)
        : undefined,
    storageMode:
      typeof resource.metadata?.storageMode === 'string' && resource.metadata.storageMode.length > 0
        ? (resource.metadata.storageMode as AssetStorageMode)
        : undefined,
    scopeDomain:
      typeof resource.metadata?.scopeDomain === 'string' && resource.metadata.scopeDomain.length > 0
        ? (resource.metadata.scopeDomain as AssetBusinessDomain)
        : undefined
  };
};

export interface MagicCutImportedAssetLike {
  id: string;
  name: string;
  type?: string;
  path?: string;
  size?: number;
  origin?: 'upload' | 'ai' | 'stock' | 'system';
  metadata?: Record<string, unknown>;
  createdAt?: string | number;
  updatedAt?: string | number;
}

export const buildMagicCutAssetRegistrationInput = (
  asset: MagicCutImportedAssetLike,
  resolvedUrl: string,
  scope: RegisterExistingAssetInput['scope']
): RegisterExistingAssetInput => {
  const locatorValue = resolvedUrl || asset.path || `assets://${asset.id}`;
  const normalizedType = normalizeAssetTypeKey(asset.type);
  const normalizedOrigin = asset.origin || 'upload';

  return {
    assetId: asset.id,
    scope,
    type: normalizedType,
    name: asset.name,
    locator: buildLocator(locatorValue, resolvedUrl || asset.path),
    metadata: {
      ...(asset.metadata || {}),
      origin: normalizedOrigin
    },
    status:
      normalizedOrigin === 'ai'
        ? 'generated'
        : normalizedOrigin === 'upload'
          ? 'imported'
          : 'ready',
    size: Number(asset.size || 0),
    createdAt: typeof asset.createdAt === 'string' ? asset.createdAt : String(asset.createdAt || ''),
    updatedAt: typeof asset.updatedAt === 'string' ? asset.updatedAt : String(asset.updatedAt || '')
  };
};

export const upsertMagicCutAsset = <T extends AssetStateLike>(
  stateLike: T,
  asset: UnifiedDigitalAsset
): T & MagicCutAssetStateSlice => {
  const assets = { ...(stateLike.assets || {}) };
  const existingAsset = assets[asset.assetId || asset.id];
  const mergedAsset = mergeAssets(existingAsset, asset);
  const assetId = mergedAsset.assetId || mergedAsset.id;
  assets[assetId] = mergedAsset;

  const baseView = buildMagicCutResourceView(mergedAsset);
  const previousViews = stateLike.resourceViews || stateLike.resources || {};
  const currentView = previousViews[assetId];
  const mergedView = mergeResources(currentView, baseView);
  const resourceViews = {
    ...previousViews,
    [assetId]: mergedView
  };

  return {
    ...stateLike,
    assets,
    resourceViews,
    resources: resourceViews
  } as T & MagicCutAssetStateSlice;
};

export const normalizeMagicCutAssetState = <T extends AssetStateLike>(
  input: T
): T & MagicCutAssetStateSlice => {
  let normalized = {
    ...input,
    ...createEmptyMagicCutAssetState(),
    assets: { ...(input.assets || {}) },
    resourceViews: { ...(input.resourceViews || {}) },
    resources: { ...(input.resources || input.resourceViews || {}) }
  } as T & MagicCutAssetStateSlice;

  const aliases = new Map<string, string>();

  Object.entries(input.assets || {}).forEach(([assetKey, asset]) => {
    const canonicalId = asset.assetId || asset.id || assetKey;
    aliases.set(assetKey, canonicalId);
    if (asset.id && asset.id !== canonicalId) {
      aliases.set(asset.id, canonicalId);
    }
    normalized = upsertMagicCutAsset(normalized, asset);
  });

  const legacyResourceMap = new Map<string, AnyMediaResource>();
  Object.entries(input.resourceViews || {}).forEach(([resourceKey, resource]) => {
    legacyResourceMap.set(resourceKey, resource);
  });
  Object.entries(input.resources || {}).forEach(([resourceKey, resource]) => {
    const existing = legacyResourceMap.get(resourceKey);
    legacyResourceMap.set(resourceKey, existing ? mergeResources(existing, resource as MagicCutTimelineResourceView) : resource);
  });

  legacyResourceMap.forEach((resource, resourceKey) => {
    const normalizedResource = normalizeMagicCutResourceView(resource, resourceKey);
    const canonicalId = normalizedResource.metadata.assetId;

    aliases.set(resourceKey, canonicalId);
    if (resource.id && resource.id !== canonicalId) {
      aliases.set(resource.id, canonicalId);
    }

    const existingAsset = normalized.assets[canonicalId];
    const nextAsset = existingAsset
      ? mergeAssetWithResource(existingAsset, normalizedResource, canonicalId)
      : buildUnifiedAssetFromLegacyResource(normalizedResource, canonicalId);

    normalized = upsertMagicCutAsset(normalized, nextAsset);
    const mergedView = mergeResources(
      normalized.resourceViews[canonicalId],
      normalizedResource
    );
    const resourceViews = {
      ...normalized.resourceViews,
      [canonicalId]: mergedView
    };
    normalized = {
      ...normalized,
      resourceViews,
      resources: resourceViews
    };
  });

  const clips = remapClipResourceRefs(input.clips, aliases, normalized.resourceViews);
  const layers = remapLayerResourceRefs(input.layers, aliases, normalized.resourceViews);

  return {
    ...normalized,
    clips: (input.clips ? clips : input.clips) as T['clips'],
    layers: (input.layers ? layers : input.layers) as T['layers']
  };
};
