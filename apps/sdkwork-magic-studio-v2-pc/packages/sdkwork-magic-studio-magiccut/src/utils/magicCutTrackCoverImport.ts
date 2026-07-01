import {
  importAssetBySdk,
  importAssetFromUrlBySdk,
  resolveAssetPrimaryUrlBySdk,
} from '@sdkwork/magic-studio-assets/services';
import {
  assetCenterService,
  isCanonicalMagicStudioAssetReference as isStableTrackCoverSource,
  isDesktopAssetLocator,
  isFileAssetLocator,
  isManagedAssetLocator,
  isRenderableAssetUrl as isRenderableTrackCoverUrl,
  readWorkspaceScope,
} from '@sdkwork/magic-studio-assets/asset-center';
import {
  type AssetDomainReference,
} from '@sdkwork/magic-studio-types/asset-center';
import { resolveEntityKey } from '@sdkwork/magic-studio-types/entity';

export interface MagicCutTrackCoverUpload {
  assetId: string;
  reference: string;
  previewUrl?: string;
}

interface UploadLike {
  name: string;
  data: Uint8Array;
}

export interface MagicCutTrackCoverImportContext {
  projectId?: string;
  trackId?: string;
  source?: string;
}

type MagicCutTrackCoverImportedAsset = {
  id: string | null;
  uuid?: string | null;
  path?: string;
  size?: number;
  createdAt?: string | number;
  updatedAt?: string | number;
  metadata?: Record<string, unknown>;
};

const resolveImportedTrackCover = async (
  uploaded: MagicCutTrackCoverImportedAsset,
  fallbackUrl: string
): Promise<MagicCutTrackCoverUpload> => {
  const uploadedKey = resolveEntityKey(uploaded);
  const uploadedPath = String(uploaded.path || '').trim();
  const resolvedUrl =
    (uploaded.id ? await resolveAssetPrimaryUrlBySdk(uploaded.id) : '') ||
    uploadedPath ||
    fallbackUrl;
  const preferredSource = isStableTrackCoverSource(uploadedPath)
    ? uploadedPath
    : resolvedUrl;

  return {
    assetId: uploaded.id || uploadedKey,
    reference: preferredSource,
    previewUrl: isRenderableTrackCoverUrl(resolvedUrl) ? resolvedUrl : undefined,
  };
};

const normalizeMetadata = (
  context: MagicCutTrackCoverImportContext
): Record<string, unknown> | undefined => {
  const entries = Object.entries({
    source: context.source,
    trackId: context.trackId,
  }).filter(([, value]) => value !== undefined);

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
};

const resolveTrackCoverScope = (context: MagicCutTrackCoverImportContext) => {
  const workspaceScope = readWorkspaceScope();
  return {
    workspaceId: workspaceScope.workspaceId,
    projectId: context.projectId || workspaceScope.projectId || undefined,
    domain: 'magiccut' as const,
  };
};

const resolveTrackCoverProjectReference = (
  context: MagicCutTrackCoverImportContext
): AssetDomainReference | undefined => {
  const scope = resolveTrackCoverScope(context);
  if (!scope.projectId) {
    return undefined;
  }

  const metadata = normalizeMetadata(context);
  return {
    domain: 'magiccut',
    entityType: 'project',
    entityId: scope.projectId,
    relation: 'reference',
    slot: 'track-cover',
    ...(metadata ? { metadata } : {}),
  };
};

const resolveTrackCoverLocator = (
  uploaded: MagicCutTrackCoverImportedAsset,
  resolvedUrl: string
): { protocol: 'http' | 'https' | 'assets' | 'file' | 'desktop'; uri: string; url?: string; path?: string } | null => {
  const uploadedPath = String(uploaded.path || '').trim();
  const candidate =
    (isStableTrackCoverSource(uploadedPath) ? uploadedPath : '') ||
    resolvedUrl ||
    uploadedPath ||
    '';
  if (!candidate) {
    return null;
  }

  if (isManagedAssetLocator(candidate)) {
    return {
      protocol: 'assets',
      uri: candidate,
      path: candidate,
      ...(isRenderableTrackCoverUrl(resolvedUrl) ? { url: resolvedUrl } : {}),
    };
  }

  if (isFileAssetLocator(candidate)) {
    return {
      protocol: 'file',
      uri: candidate,
      path: candidate,
      ...(isRenderableTrackCoverUrl(resolvedUrl) ? { url: resolvedUrl } : {}),
    };
  }

  if (isDesktopAssetLocator(candidate)) {
    return {
      protocol: 'desktop',
      uri: candidate,
      path: candidate,
      ...(isRenderableTrackCoverUrl(resolvedUrl) ? { url: resolvedUrl } : {}),
    };
  }

  if (candidate.startsWith('https://')) {
    return {
      protocol: 'https',
      uri: candidate,
      url: candidate,
    };
  }

  if (candidate.startsWith('http://')) {
    return {
      protocol: 'http',
      uri: candidate,
      url: candidate,
    };
  }

  if (isRenderableTrackCoverUrl(candidate)) {
    return null;
  }

  return {
    protocol: 'assets',
    uri: candidate,
    path: candidate,
    ...(isRenderableTrackCoverUrl(resolvedUrl) ? { url: resolvedUrl } : {}),
  };
};

const normalizeTimestamp = (value: string | number | undefined): string | undefined => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }
  return undefined;
};

const persistTrackCoverReference = async (
  uploaded: MagicCutTrackCoverImportedAsset,
  resolvedUrl: string,
  name: string,
  context: MagicCutTrackCoverImportContext
): Promise<void> => {
  if (!uploaded.id) {
    return;
  }

  const projectReference = resolveTrackCoverProjectReference(context);
  if (!projectReference) {
    return;
  }

  await assetCenterService.initialize();
  const existingAsset = await assetCenterService.findById(uploaded.id);
  if (existingAsset) {
    await assetCenterService.bindReference(uploaded.id, projectReference);
    return;
  }

  const locator = resolveTrackCoverLocator(uploaded, resolvedUrl);
  if (!locator) {
    return;
  }

  const metadata = normalizeMetadata(context);
  const scope = resolveTrackCoverScope(context);
  await assetCenterService.registerExistingAsset({
    scope,
    type: 'image',
    name,
    assetId: uploaded.id,
    locator,
    ...(metadata ? { metadata } : {}),
    references: [projectReference],
    status: 'imported',
    ...(typeof uploaded.size === 'number' ? { size: uploaded.size } : {}),
    ...(normalizeTimestamp(uploaded.createdAt)
      ? { createdAt: normalizeTimestamp(uploaded.createdAt) }
      : {}),
    ...(normalizeTimestamp(uploaded.updatedAt)
      ? { updatedAt: normalizeTimestamp(uploaded.updatedAt) }
      : {}),
  });
};

export const importMagicCutTrackCoverFile = async (
  file: UploadLike,
  context: MagicCutTrackCoverImportContext = {}
): Promise<MagicCutTrackCoverUpload> => {
  const uploaded = await importAssetBySdk(
    {
      name: file.name,
      data: file.data,
    },
    'image',
    { domain: 'magiccut' }
  );

  const imported = await resolveImportedTrackCover(uploaded, '');
  await persistTrackCoverReference(
    uploaded,
    imported.previewUrl || imported.reference,
    file.name,
    context
  );
  return imported;
};

export const importMagicCutTrackCoverFromUrl = async (
  sourceUrl: string,
  fileName = `magiccut_track_cover_${Date.now()}.png`,
  context: MagicCutTrackCoverImportContext = {}
): Promise<MagicCutTrackCoverUpload> => {
  const uploaded = await importAssetFromUrlBySdk(
    sourceUrl,
    'image',
    {
      name: fileName,
      domain: 'magiccut',
    }
  );

  const imported = await resolveImportedTrackCover(uploaded, sourceUrl);
  await persistTrackCoverReference(
    uploaded,
    imported.previewUrl || imported.reference,
    fileName,
    context
  );
  return imported;
};
