import type { AnyAsset } from '@sdkwork/react-assets';
import type { AnyMediaResource } from '@sdkwork/react-commons';
import { MediaResourceType } from '@sdkwork/react-commons';

const LOCAL_STORAGE_MODES = new Set([
  'browser-vfs',
  'tauri-fs',
  'local-only',
  'local-first-sync',
]);

const WINDOWS_ABSOLUTE_PATH_PATTERN = /^[a-zA-Z]:[\\/]/;

const isLocalLocator = (value: unknown): boolean => {
  if (typeof value !== 'string' || value.length === 0) return false;

  return (
    value.startsWith('assets://') ||
    value.startsWith('file://') ||
    value.startsWith('blob:') ||
    value.startsWith('data:') ||
    value.startsWith('\\\\') ||
    WINDOWS_ABSOLUTE_PATH_PATTERN.test(value)
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

export function mergeAssetCollections<T extends { id: string }>(
  primary: T[],
  secondary: T[]
): T[] {
  const seen = new Set(primary.map((item) => item.id));
  const merged = [...primary];

  secondary.forEach((item) => {
    if (seen.has(item.id)) return;
    seen.add(item.id);
    merged.push(item);
  });

  return merged;
}

export function mergeRemoteAssetRefresh<T extends AnyAsset>(
  currentAssets: T[],
  fetchedAssets: T[]
): T[] {
  const fetchedIds = new Set(fetchedAssets.map((item) => item.id));
  const optimisticLocalUploads = currentAssets.filter(
    (asset) => !fetchedIds.has(asset.id) && isOptimisticLocalUploadAsset(asset)
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
