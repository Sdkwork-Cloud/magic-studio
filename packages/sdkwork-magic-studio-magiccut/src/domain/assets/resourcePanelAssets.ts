import type { AnyAsset } from '@sdkwork/magic-studio-assets/entities';
import {
  isExplicitLocalAssetLocator,
  isLocalFilePath,
  isManagedAssetLocator,
} from '@sdkwork/magic-studio-assets/asset-center';
import {
  resolveEntityKey,
  type EntityIdentityLike,
} from '@sdkwork/magic-studio-types/entity';
import type { AnyMediaResource } from '@sdkwork/magic-studio-types/media';
import { MediaResourceType } from '@sdkwork/magic-studio-types/vocabulary';

const LOCAL_STORAGE_MODES = new Set([
  'browser-vfs',
  'desktop-fs',
  'local-only',
  'local-first-sync',
]);

const isLocalLocator = (value: unknown): boolean => {
  if (typeof value !== 'string' || value.length === 0) return false;

  return (
    isManagedAssetLocator(value) ||
    isExplicitLocalAssetLocator(value) ||
    value.startsWith('blob:') ||
    value.startsWith('data:') ||
    isLocalFilePath(value)
  );
};

const isOptimisticLocalUploadAsset = (asset: AnyAsset): boolean => {
  const metadata = (asset.metadata ?? {}) as Record<string, unknown>;
  const origin =
    typeof asset.origin === 'string'
      ? asset.origin
      : typeof metadata.origin === 'string'
        ? metadata.origin
        : undefined;

  if (origin !== 'upload') return false;

  const storageMode =
    typeof metadata.storageMode === 'string' ? metadata.storageMode : undefined;

  if (storageMode && LOCAL_STORAGE_MODES.has(storageMode)) return true;

  return isLocalLocator(asset.path) || isLocalLocator(asset.url);
};

export function collectLocalAssetsForCategory(
  resources: Record<string, AnyMediaResource>,
  category: string
): AnyAsset[] {
  const items = Object.values(resources);

  return items.filter((resource) => {
    const type = resource.type as MediaResourceType;

    if (category === 'video') return type === MediaResourceType.VIDEO;
    if (category === 'image') return type === MediaResourceType.IMAGE;
    if (category === 'music') return type === MediaResourceType.MUSIC;
    if (category === 'voice') return type === MediaResourceType.VOICE;
    if (category === 'text') {
      return type === MediaResourceType.TEXT || type === MediaResourceType.SUBTITLE;
    }
    if (category === 'audio' || category === 'sfx') {
      return (
        type === MediaResourceType.AUDIO ||
        type === MediaResourceType.VOICE ||
        type === MediaResourceType.SPEECH
      );
    }
    if (category === 'effects') return type === MediaResourceType.EFFECT;
    if (category === 'transitions') return type === MediaResourceType.TRANSITION;

    return true;
  }) as AnyAsset[];
}

const resolveAssetCollectionKey = (asset: EntityIdentityLike): string =>
  resolveEntityKey(asset);

export function mergeAssetCollections<T extends EntityIdentityLike>(
  primary: T[],
  secondary: T[]
): T[] {
  const seen = new Set(primary.map((item) => resolveAssetCollectionKey(item)));
  const merged = [...primary];

  secondary.forEach((item) => {
    const itemKey = resolveAssetCollectionKey(item);
    if (seen.has(itemKey)) return;
    seen.add(itemKey);
    merged.push(item);
  });

  return merged;
}

export function mergeRemoteAssetRefresh<T extends AnyAsset>(
  currentAssets: T[],
  fetchedAssets: T[]
): T[] {
  const fetchedIds = new Set(fetchedAssets.map((item) => resolveAssetCollectionKey(item)));
  const optimisticLocalUploads = currentAssets.filter(
    (asset) => !fetchedIds.has(resolveAssetCollectionKey(asset)) && isOptimisticLocalUploadAsset(asset)
  );

  return mergeAssetCollections(optimisticLocalUploads, fetchedAssets);
}

const LOCAL_FIRST_RESOURCE_PANEL_CATEGORIES = new Set([
  'video',
  'image',
  'music',
  'audio',
  'voice',
  'sfx',
  'text',
]);

export type ResourcePanelStorageMode =
  | 'local-first-sync'
  | 'local-only'
  | 'server-only';

export const shouldQueryLocalResourcePanelAssets = (
  category: string,
  storageMode: ResourcePanelStorageMode
): boolean =>
  storageMode !== 'server-only' &&
  LOCAL_FIRST_RESOURCE_PANEL_CATEGORIES.has(category);

export async function queryResourcePanelAssets<T>(input: {
  category: string;
  storageMode: ResourcePanelStorageMode;
  queryLocal: () => Promise<T>;
  queryRemote: () => Promise<T>;
}): Promise<T> {
  if (shouldQueryLocalResourcePanelAssets(input.category, input.storageMode)) {
    return input.queryLocal();
  }

  try {
    return await input.queryRemote();
  } catch (error) {
    if (!LOCAL_FIRST_RESOURCE_PANEL_CATEGORIES.has(input.category)) {
      throw error;
    }
    return input.queryLocal();
  }
}

export function filterAssetCollectionByQuery<T extends AnyAsset>(
  assets: T[],
  query: string
): T[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return assets;

  return assets.filter((asset) => {
    const metadata = (asset.metadata ?? {}) as Record<string, unknown>;
    const searchableParts = [
      asset.name,
      typeof metadata.text === 'string' ? metadata.text : '',
      typeof metadata.prompt === 'string' ? metadata.prompt : '',
      typeof (asset as { category?: unknown }).category === 'string'
        ? String((asset as { category?: unknown }).category)
        : '',
      ...(Array.isArray(asset.tags)
        ? asset.tags.map((tag) => String(tag))
        : typeof asset.tags === 'string'
          ? [asset.tags]
          : []),
    ];

    return searchableParts.some((part) => part.toLowerCase().includes(normalizedQuery));
  });
}
