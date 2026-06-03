import {
  isDesktopAssetLocator,
  isExplicitLocalAssetLocator,
  isManagedAssetLocator,
  type RegisterExistingAssetInput,
} from '@sdkwork/magic-studio-assets/asset-center';
import {
  AssetBusinessDomain,
  AssetLocator,
  AssetLocatorProtocol,
  AssetStorageMode,
  UnifiedDigitalAsset,
  UnifiedAssetPayload,
} from '@sdkwork/magic-studio-types/asset-center';
import {
  AssetAtomicMediaResource,
  AssetContentKey,
  AnyMediaResource,
} from '@sdkwork/magic-studio-types/media';
import { CutMediaResourceRef } from '@sdkwork/magic-studio-types/magiccut';
import {
  buildProjectGraphMediaSource,
  type ProjectGraphDocument,
  type ProjectGraphMediaSource,
} from '@sdkwork/magic-studio-types/project-graph';
import { MediaResourceType } from '@sdkwork/magic-studio-types/vocabulary';

type ResourceMetadata = Record<string, unknown> & {
  assetId: string;
  assetUuid?: string;
  primaryResourceId?: string;
  primaryResourceUuid?: string;
  resourceViewId?: string;
  resourceViewUuid?: string;
  storageMode?: AssetStorageMode | string;
  scopeDomain?: string;
  primaryType?: AssetContentKey | string;
};

export type MagicCutMaterialStorageMode =
  | 'local-first-sync'
  | 'local-only'
  | 'server-only';

export interface DecideMagicCutImportRouteInput {
  storageMode: MagicCutMaterialStorageMode;
  filePath?: string;
  hasBinaryData?: boolean;
}

export interface MagicCutImportRouteDecision {
  kind: 'managed-local' | 'server-upload';
  shouldQueueSync: boolean;
}

export type MagicCutTimelineResourceView = AnyMediaResource & {
  metadata: ResourceMetadata;
};

export const decideMagicCutImportRoute = (
  input: DecideMagicCutImportRouteInput
): MagicCutImportRouteDecision => {
  if (input.storageMode === 'server-only') {
    return {
      kind: 'server-upload',
      shouldQueueSync: false
    };
  }

  const canPersistLocally = Boolean(input.filePath) || Boolean(input.hasBinaryData);
  if (canPersistLocally) {
    return {
      kind: 'managed-local',
      shouldQueueSync: input.storageMode === 'local-first-sync'
    };
  }

  return {
    kind: 'server-upload',
    shouldQueueSync: false
  };
};

export interface MagicCutAssetStateSlice {
  assets: Record<string, UnifiedDigitalAsset>;
  resourceViews: Record<string, MagicCutTimelineResourceView>;
  resources: Record<string, AnyMediaResource>;
  projectGraph?: ProjectGraphDocument;
}

type ResourceRefLike = {
  id: string | null;
  uuid?: string | null;
  assetId?: string | null;
  resourceViewId?: string | null;
};

type ClipLike = {
  resource: ResourceRefLike;
};

type LayerLike = {
  resource?: ResourceRefLike;
};

type ResourceIdentityCarrier = {
  metadata?: Record<string, unknown>;
  id?: string | null;
  uuid?: string | null;
  assetId?: string | null;
  assetUuid?: string | null;
  primaryResourceId?: string | null;
  primaryResourceUuid?: string | null;
  resourceViewId?: string | null;
  resourceViewUuid?: string | null;
};

type AssetStateLike = Partial<MagicCutAssetStateSlice> & {
  clips?: Record<string, ClipLike>;
  layers?: Record<string, LayerLike>;
};

const normalizeOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const readExplicitResourceIdentityValue = (
  resource: ResourceIdentityCarrier,
  key:
    | 'assetId'
    | 'assetUuid'
    | 'primaryResourceId'
    | 'primaryResourceUuid'
    | 'resourceViewId'
    | 'resourceViewUuid'
): string | undefined => {
  const fromField = normalizeOptionalString(resource[key]);
  if (fromField) {
    return fromField;
  }

  return normalizeOptionalString(resource.metadata?.[key]);
};

const resolveExplicitAssetUuid = (
  resource: ResourceIdentityCarrier
): string | undefined => {
  const explicitAssetUuid = readExplicitResourceIdentityValue(resource, 'assetUuid');
  if (explicitAssetUuid) {
    return explicitAssetUuid;
  }

  const uuid = normalizeOptionalString(resource.uuid);
  const resourceViewUuid = readExplicitResourceIdentityValue(resource, 'resourceViewUuid');
  const primaryResourceUuid = readExplicitResourceIdentityValue(resource, 'primaryResourceUuid');
  const assetId = readExplicitResourceIdentityValue(resource, 'assetId');

  if (
    uuid &&
    uuid !== resourceViewUuid &&
    uuid !== primaryResourceUuid &&
    uuid !== assetId
  ) {
    return uuid;
  }

  return undefined;
};

const resolveResourceRefLookupKey = (
  resource: ResourceRefLike | undefined
): string | null => {
  if (!resource) {
    return null;
  }

  return resource.resourceViewId || resource.assetId || resource.uuid || resource.id || null;
};

const isLocatorLike = (value: unknown): boolean => {
  if (typeof value !== 'string' || value.length === 0) {
    return false;
  }

  return (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    isManagedAssetLocator(value) ||
    value.startsWith('asset:') ||
    isExplicitLocalAssetLocator(value) ||
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

const resolveAtomicResourceKey = (
  resource: Pick<AssetAtomicMediaResource, 'id' | 'uuid' | 'assetId' | 'primaryResourceId' | 'resourceViewId'>
): string =>
  normalizeOptionalString(resource.uuid) ||
  normalizeOptionalString(resource.id) ||
  normalizeOptionalString(resource.primaryResourceId) ||
  normalizeOptionalString(resource.resourceViewId) ||
  normalizeOptionalString(resource.assetId) ||
  'unresolved-atomic-resource';

const resolveRegistrationLocatorKey = (
  asset: Pick<MagicCutImportedAssetLike, 'id' | 'uuid' | 'path'>
): string =>
  normalizeOptionalString(asset.id) ||
  normalizeOptionalString(asset.uuid) ||
  normalizeOptionalString(asset.path) ||
  'runtime-asset';

const isRenderableUrlCandidate = (value: string | undefined): value is string => {
  if (!value) {
    return false;
  }

  return (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('blob:') ||
    value.startsWith('data:') ||
    value.startsWith('asset:')
  );
};

const resolveCanonicalLocatorReference = (
  path: string | undefined,
  url: string | undefined,
  fallback: string
): string => {
  return path || url || fallback;
};

const resolveDeliveryUrl = (
  url: string | undefined,
  path: string | undefined
): string | undefined => {
  if (isRenderableUrlCandidate(url)) {
    return url;
  }

  if (isRenderableUrlCandidate(path)) {
    return path;
  }

  return undefined;
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
    assetMap.set(resolveAtomicResourceKey(item), item);
  });
  nextAssets.forEach((item) => {
    const itemKey = resolveAtomicResourceKey(item);
    const existing = assetMap.get(itemKey);
    assetMap.set(itemKey, existing ? mergeResources(existing, item) : item);
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
  if (isManagedAssetLocator(locator)) {
    return 'assets';
  }
  if (isDesktopAssetLocator(locator)) {
    return 'desktop';
  }
  if (isExplicitLocalAssetLocator(locator)) {
    return 'file';
  }
  if (locator.startsWith('/') || locator.startsWith('./') || locator.startsWith('../') || /^[a-zA-Z]:\\/.test(locator)) {
    return 'file';
  }
  if (locator.startsWith('https://')) {
    return 'https';
  }
  if (locator.startsWith('http://')) {
    return 'http';
  }
  return 'assets';
};

const inferStorageMode = (locator: string): AssetStorageMode => {
  const protocol = detectProtocol(locator);
  if (protocol === 'http' || protocol === 'https') {
    return 'remote-url';
  }
  if (protocol === 'file' || protocol === 'desktop') {
    return 'desktop-fs';
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
  const explicitPrimaryResourceId = readExplicitResourceIdentityValue(
    normalizedResource,
    'primaryResourceId'
  );
  const explicitPrimaryResourceUuid = readExplicitResourceIdentityValue(
    normalizedResource,
    'primaryResourceUuid'
  );
  const primaryResourceId =
    explicitPrimaryResourceId ||
    normalizeOptionalString(normalizedResource.id) ||
    canonicalId;
  const primaryResource: AssetAtomicMediaResource = {
    ...normalizedResource,
    id: primaryResourceId,
    uuid: explicitPrimaryResourceUuid || primaryResourceId || normalizedResource.uuid || canonicalId,
    assetId: canonicalId,
    primaryResourceId: explicitPrimaryResourceId,
    resourceViewId: readExplicitResourceIdentityValue(normalizedResource, 'resourceViewId'),
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
    uuid: resolveExplicitAssetUuid(normalizedResource) || normalizedResource.uuid || canonicalId,
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
      const currentResourceKey = resolveResourceRefLookupKey(clip.resource);
      const nextResourceId = currentResourceKey ? aliases.get(currentResourceKey) || currentResourceKey : null;
      if (!nextResourceId) {
        return [clipId, clip];
      }
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
      const currentResourceKey = resolveResourceRefLookupKey(layer.resource);
      if (!currentResourceKey) {
        return [layerId, layer];
      }
      const nextResourceId = aliases.get(currentResourceKey) || currentResourceKey;
      const nextResource = resourceViews[nextResourceId];
      return [
        layerId,
        {
          ...layer,
          resource: nextResource
            ? {
                ...(layer.resource || {}),
                ...buildMagicCutAssetRef(nextResource),
                uuid: layer.resource?.uuid || nextResource?.uuid
              }
            : {
                ...(layer.resource || {}),
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
    projectGraph: undefined,
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
  const explicitAssetId = readExplicitResourceIdentityValue(resource, 'assetId');
  const explicitAssetUuid = readExplicitResourceIdentityValue(resource, 'assetUuid');
  const explicitPrimaryResourceId = readExplicitResourceIdentityValue(resource, 'primaryResourceId');
  const explicitPrimaryResourceUuid = readExplicitResourceIdentityValue(resource, 'primaryResourceUuid');
  const explicitResourceViewId = readExplicitResourceIdentityValue(resource, 'resourceViewId');
  const explicitResourceViewUuid = readExplicitResourceIdentityValue(resource, 'resourceViewUuid');
  const effectiveFallbackId =
    fallbackId ||
    explicitAssetId ||
    normalizeOptionalString(resource.id) ||
    normalizeOptionalString(resource.uuid) ||
    'runtime-resource';
  const canonicalId = pickCanonicalAssetId(
    explicitAssetId || normalizeOptionalString(resource.id),
    explicitAssetId,
    effectiveFallbackId
  );
  const locatorValue = resolveCanonicalLocatorReference(
    normalizeOptionalString(resource.path),
    normalizeOptionalString(resource.url),
    `assets://${canonicalId}`
  );
  const deliveryUrl = resolveDeliveryUrl(
    normalizeOptionalString(resource.url),
    normalizeOptionalString(resource.path)
  );
  const metadata: ResourceMetadata = {
    ...(resource.metadata || {}),
    assetId: canonicalId,
    ...(explicitAssetUuid ? { assetUuid: explicitAssetUuid } : {}),
    ...(explicitPrimaryResourceId ? { primaryResourceId: explicitPrimaryResourceId } : {}),
    ...(explicitPrimaryResourceUuid ? { primaryResourceUuid: explicitPrimaryResourceUuid } : {}),
    ...(explicitResourceViewId ? { resourceViewId: explicitResourceViewId } : {}),
    ...(explicitResourceViewUuid ? { resourceViewUuid: explicitResourceViewUuid } : {}),
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
    uuid: normalizeOptionalString(resource.uuid) || explicitResourceViewUuid || explicitAssetUuid || canonicalId,
    assetId: canonicalId,
    primaryResourceId: explicitPrimaryResourceId,
    resourceViewId: explicitResourceViewId,
    path: normalizeOptionalString(resource.path) || locatorValue,
    url: deliveryUrl,
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
  const locatorUri = resolveCanonicalLocatorReference(
    normalizeOptionalString(primary?.path),
    normalizeOptionalString(asset.storage.primary.uri) ||
      normalizeOptionalString(primary?.url) ||
      normalizeOptionalString(asset.storage.primary.url),
    ''
  );
  const resolvedUrl = resolveDeliveryUrl(
    normalizeOptionalString(primary?.url) || normalizeOptionalString(asset.storage.primary.url),
    normalizeOptionalString(primary?.path) || normalizeOptionalString(asset.storage.primary.uri)
  );
  const primaryMetadata = ((primary?.metadata || {}) as Record<string, unknown>);
  const assetMetadata = ((asset.metadata || {}) as Record<string, unknown>);
  const explicitAssetUuid = resolveExplicitAssetUuid(asset);
  const explicitResourceViewId =
    normalizeOptionalString(primary?.resourceViewId) ||
    normalizeOptionalString(primaryMetadata.resourceViewId) ||
    normalizeOptionalString(assetMetadata.resourceViewId);
  const explicitResourceViewUuid =
    normalizeOptionalString(primaryMetadata.resourceViewUuid) ||
    normalizeOptionalString(assetMetadata.resourceViewUuid);
  const primaryIdCandidate = normalizeOptionalString(primary?.id);
  const primaryUuidCandidate = normalizeOptionalString(primary?.uuid);
  const explicitPrimaryResourceId =
    normalizeOptionalString(primary?.primaryResourceId) ||
    normalizeOptionalString(primaryMetadata.primaryResourceId) ||
    normalizeOptionalString(assetMetadata.primaryResourceId) ||
    (primaryIdCandidate &&
    primaryIdCandidate !== canonicalId &&
    primaryIdCandidate !== explicitResourceViewId
      ? primaryIdCandidate
      : undefined);
  const explicitPrimaryResourceUuid =
    normalizeOptionalString((primary as Record<string, unknown> | undefined)?.primaryResourceUuid) ||
    normalizeOptionalString(primaryMetadata.primaryResourceUuid) ||
    normalizeOptionalString(assetMetadata.primaryResourceUuid) ||
    (primaryUuidCandidate &&
    primaryUuidCandidate !== explicitResourceViewUuid &&
    primaryUuidCandidate !== explicitAssetUuid
      ? primaryUuidCandidate
      : undefined);
  const mergedMetadata: ResourceMetadata = {
    ...primaryMetadata,
    ...assetMetadata,
    assetId: canonicalId,
    ...(explicitAssetUuid ? { assetUuid: explicitAssetUuid } : {}),
    ...(explicitPrimaryResourceId ? { primaryResourceId: explicitPrimaryResourceId } : {}),
    ...(explicitPrimaryResourceUuid ? { primaryResourceUuid: explicitPrimaryResourceUuid } : {}),
    ...(explicitResourceViewId ? { resourceViewId: explicitResourceViewId } : {}),
    ...(explicitResourceViewUuid ? { resourceViewUuid: explicitResourceViewUuid } : {}),
    storageMode: asset.storage.mode,
    scopeDomain: asset.scope.domain,
    primaryType: asset.primaryType
  };
  const origin =
    (typeof (primary as { origin?: unknown } | undefined)?.origin === 'string'
      ? (primary as { origin?: string }).origin
      : undefined) ||
    (typeof mergedMetadata.origin === 'string' ? mergedMetadata.origin : undefined);

  return {
    ...(primary as MagicCutTimelineResourceView | undefined),
    id: canonicalId,
    uuid: explicitResourceViewUuid || asset.uuid || canonicalId,
    assetId: canonicalId,
    primaryResourceId: explicitPrimaryResourceId,
    resourceViewId: explicitResourceViewId,
    name: asset.title || primary?.name || canonicalId,
    type: mapContentKeyToMediaType(asset.primaryType),
    path: locatorUri || undefined,
    url: resolvedUrl || undefined,
    origin: origin as MagicCutTimelineResourceView['origin'],
    isFavorite: asset.isFavorite,
    tags: asset.tags,
    metadata: mergedMetadata,
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt
  } as MagicCutTimelineResourceView;
};

export const buildMagicCutAssetRef = (
  resource: Pick<
    AnyMediaResource,
    'id' | 'uuid' | 'metadata' | 'assetId' | 'primaryResourceId' | 'resourceViewId'
  >
): CutMediaResourceRef => {
  const assetId = readExplicitResourceIdentityValue(resource, 'assetId');
  const resourceViewId = readExplicitResourceIdentityValue(resource, 'resourceViewId');
  const primaryResourceId = readExplicitResourceIdentityValue(resource, 'primaryResourceId');

  return {
    type: 'MediaResource',
    id: resource.id,
    uuid:
      normalizeOptionalString(resource.uuid) ||
      readExplicitResourceIdentityValue(resource, 'resourceViewUuid') ||
      readExplicitResourceIdentityValue(resource, 'assetUuid') ||
      primaryResourceId ||
      resourceViewId ||
      assetId ||
      normalizeOptionalString(resource.id) ||
      'unresolved-resource',
    assetId,
    resourceViewId,
    primaryResourceId,
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

export const buildMagicCutProjectGraphSource = (
  resource: Pick<
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
): ProjectGraphMediaSource => buildProjectGraphMediaSource(resource);

const matchesMagicCutAssetRef = (
  resource: ResourceRefLike | undefined,
  assetId: string
): boolean => {
  if (!resource) {
    return false;
  }

  return (
    resource.id === assetId ||
    resource.assetId === assetId
  );
};

export const isMagicCutAssetInUse = (
  stateLike: Pick<AssetStateLike, 'clips' | 'layers'>,
  assetId: string
): boolean => {
  if (!assetId) {
    return false;
  }

  const clipResources = Object.values(stateLike.clips || {});
  if (clipResources.some((clip) => matchesMagicCutAssetRef(clip.resource, assetId))) {
    return true;
  }

  return Object.values(stateLike.layers || {}).some((layer) =>
    matchesMagicCutAssetRef(layer.resource, assetId)
  );
};

export const removeMagicCutAssetFromState = <T extends AssetStateLike>(
  stateLike: T,
  assetId: string
): T & MagicCutAssetStateSlice => {
  const nextAssets = {
    ...(stateLike.assets || {})
  };
  delete nextAssets[assetId];

  const currentResourceViews = stateLike.resourceViews || stateLike.resources || {};
  const nextResourceViews = {
    ...currentResourceViews
  };
  delete nextResourceViews[assetId];

  return {
    ...stateLike,
    assets: nextAssets,
    resourceViews: nextResourceViews,
    resources: nextResourceViews
  } as T & MagicCutAssetStateSlice;
};

export interface MagicCutImportedAssetLike {
  id: string | null;
  uuid?: string;
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
  const assetId = normalizeOptionalString(asset.id);
  const assetUuid = normalizeOptionalString(asset.uuid);
  const locatorKey = resolveRegistrationLocatorKey(asset);
  const locatorValue = resolveCanonicalLocatorReference(
    normalizeOptionalString(asset.path),
    normalizeOptionalString(resolvedUrl),
    `assets://${locatorKey}`
  );
  const deliveryUrl = resolveDeliveryUrl(
    normalizeOptionalString(resolvedUrl),
    normalizeOptionalString(asset.path)
  );
  const normalizedType = normalizeAssetTypeKey(asset.type);
  const normalizedOrigin = asset.origin || 'upload';

  return {
    ...(assetId ? { assetId } : {}),
    scope,
    type: normalizedType,
    name: asset.name,
    locator: buildLocator(locatorValue, deliveryUrl),
    metadata: {
      ...(asset.metadata || {}),
      ...(assetUuid ? { assetUuid, resourceViewUuid: assetUuid } : {}),
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
    ...createEmptyMagicCutAssetState(),
    ...input,
    assets: { ...(input.assets || {}) },
    resourceViews: { ...(input.resourceViews || {}) },
    resources: { ...(input.resources || input.resourceViews || {}) },
    projectGraph: input.projectGraph
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
