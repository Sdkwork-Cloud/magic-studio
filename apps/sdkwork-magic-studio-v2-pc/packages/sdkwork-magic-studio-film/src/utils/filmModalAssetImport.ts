import {
  importAssetBySdk,
  importAssetFromUrlBySdk,
  resolveAssetPrimaryUrlBySdk
} from '@sdkwork/magic-studio-assets/services';
import {
  assetCenterService,
  readWorkspaceScope,
  resolveAssetUrlByAssetIdFirst
} from '@sdkwork/magic-studio-assets/asset-center';
import { resolveGenerationOutcomePrimaryUrl } from '@sdkwork/magic-studio-core/ai';
import { inlineDataService } from '@sdkwork/magic-studio-core/services';
import {
  deriveAssetRecordClientUuid,
  readAssetRecordMetadataValue,
  resolveAssetRecordAssetUuid,
  resolveAssetRecordClientUuid,
  resolveAssetRecordId,
} from '@sdkwork/magic-studio-commons/utils/assetIdentity';
import type { GenerationOutcome } from '@sdkwork/magic-studio-types/agi';
import type { AssetDomainReference } from '@sdkwork/magic-studio-types/asset-center';
import type { Asset } from '@sdkwork/magic-studio-types/assets';

type FilmImportType = 'image' | 'video' | 'audio' | 'text' | 'file';

export interface ImportedFilmAssetResource {
  id: string | null;
  uuid: string;
  assetId: string;
  assetUuid?: string;
  type: FilmImportType;
  url: string;
}

export interface ImportedFilmAssetRef {
  id: string | null;
  assetId: string;
  uuid: string;
  assetUuid?: string;
  resource: ImportedFilmAssetResource;
}

export interface FilmGeneratedSelectionLike {
  assetId?: string | null;
  assetUuid?: string | null;
  url?: string;
  resource?: {
    assetId?: string | null;
    assetUuid?: string | null;
    url?: string | null;
    metadata?: Record<string, unknown>;
  };
}

type FilmImportMetadata = Record<string, unknown>;

const normalizeValue = (value: string | null | undefined): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const pickFirst = (...values: Array<string | null | undefined>): string | null => {
  for (const value of values) {
    const normalized = normalizeValue(value);
    if (normalized) {
      return normalized;
    }
  }

  return null;
};

const resolveSelectionDeliveryUrl = (selection: FilmGeneratedSelectionLike): string =>
  pickFirst(selection.resource?.url, selection.url) || '';

const readSelectionResourceMetadataValue = (
  selection: FilmGeneratedSelectionLike,
  key: 'assetId' | 'assetUuid'
): string | null => {
  const metadata = selection.resource?.metadata;
  if (!metadata) {
    return null;
  }
  return normalizeValue(metadata[key] as string | null | undefined);
};

const resolveSelectionAssetId = (selection: FilmGeneratedSelectionLike): string | null =>
  pickFirst(
    selection.assetId,
    selection.resource?.assetId,
    readSelectionResourceMetadataValue(selection, 'assetId')
  );

const resolveSelectionAssetUuid = (selection: FilmGeneratedSelectionLike): string | null =>
  pickFirst(
    selection.assetUuid,
    selection.resource?.assetUuid,
    readSelectionResourceMetadataValue(selection, 'assetUuid')
  );

const resolveExplicitUploadAssetUuid = (asset: Asset): string | undefined => {
  const metadataAssetUuid = readAssetRecordMetadataValue(asset, 'assetUuid');
  return metadataAssetUuid || undefined;
};

const normalizeImportedFilmAssetType = (
  value: string | null | undefined
): FilmImportType => {
  switch (value) {
    case 'video':
      return 'video';
    case 'audio':
    case 'music':
    case 'voice':
    case 'speech':
    case 'sfx':
      return 'audio';
    case 'text':
    case 'subtitle':
      return 'text';
    case 'file':
      return 'file';
    case 'image':
    default:
      return 'image';
  }
};

const toImportedFilmAssetRef = ({
  assetId,
  uuid,
  assetUuid,
  type,
  url,
}: {
  assetId: string;
  uuid?: string | null;
  assetUuid?: string | null;
  type: FilmImportType;
  url: string;
}): ImportedFilmAssetRef => {
  const explicitAssetUuid = normalizeValue(assetUuid) || undefined;
  const stableUuid = pickFirst(uuid, explicitAssetUuid) || deriveAssetRecordClientUuid(assetId);

  return {
    id: null,
    assetId,
    uuid: stableUuid,
    ...(explicitAssetUuid ? { assetUuid: explicitAssetUuid } : {}),
    resource: {
      id: null,
      uuid: stableUuid,
      assetId,
      ...(explicitAssetUuid ? { assetUuid: explicitAssetUuid } : {}),
      type,
      url,
    },
  };
};

export const resolveImportedFilmAssetUrl = (
  imported: ImportedFilmAssetRef | null | undefined
): string => imported?.resource.url || '';

const normalizeFilmImportMetadata = (
  metadata: FilmImportMetadata
): FilmImportMetadata | undefined => {
  const entries = Object.entries(metadata).filter(([, value]) => value !== undefined);
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
};

const resolveFilmReferenceScope = (metadata: FilmImportMetadata) => {
  const workspaceScope = readWorkspaceScope();
  const projectId =
    normalizeValue(metadata.projectId as string | undefined) ||
    workspaceScope.projectId ||
    undefined;

  return {
    workspaceId: workspaceScope.workspaceId,
    projectId,
    domain: 'film' as const,
  };
};

const resolveFilmProjectReference = (
  metadata: FilmImportMetadata
): AssetDomainReference | undefined => {
  const scope = resolveFilmReferenceScope(metadata);
  if (!scope.projectId) {
    return undefined;
  }

  return {
    domain: 'film',
    entityType: 'project',
    entityId: scope.projectId,
    relation: 'reference',
    slot: 'media-resource',
    ...(normalizeFilmImportMetadata(metadata)
      ? { metadata: normalizeFilmImportMetadata(metadata) }
      : {}),
  };
};

const resolveFilmImportedLocator = (
  uploaded: Asset,
  resolvedUrl: string
): { protocol: 'http' | 'https' | 'assets'; uri: string; url?: string; path?: string } | null => {
  const candidate = normalizeValue(resolvedUrl) || normalizeValue(uploaded.path);
  if (!candidate) {
    return null;
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

  return {
    protocol: 'assets',
    uri: candidate,
    path: candidate,
  };
};

const resolveFilmAssetStatus = (
  metadata: FilmImportMetadata,
  uploaded: Asset
): 'generated' | 'imported' | 'ready' => {
  const origin = metadata.origin ?? uploaded.origin;
  if (origin === 'ai') {
    return 'generated';
  }
  if (origin === 'upload') {
    return 'imported';
  }
  return 'ready';
};

const normalizeAssetTimestamp = (value: unknown): string | undefined => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }
  return undefined;
};

const persistFilmProjectReference = async (
  uploaded: Asset,
  type: FilmImportType,
  name: string,
  resolvedUrl: string,
  metadata: FilmImportMetadata
): Promise<void> => {
  if (!uploaded.id) {
    return;
  }

  const projectReference = resolveFilmProjectReference(metadata);
  if (!projectReference) {
    return;
  }

  await assetCenterService.initialize();
  const existingAsset = await assetCenterService.findById(uploaded.id);
  if (existingAsset) {
    await assetCenterService.bindReference(uploaded.id, projectReference);
    return;
  }

  const locator = resolveFilmImportedLocator(uploaded, resolvedUrl);
  if (!locator) {
    return;
  }

  const scope = resolveFilmReferenceScope(metadata);
  const normalizedMetadata = normalizeFilmImportMetadata({
    ...(uploaded.metadata || {}),
    ...metadata,
    origin: metadata.origin ?? uploaded.origin,
  });

  await assetCenterService.registerExistingAsset({
    scope,
    type,
    name,
    assetId: uploaded.id,
    locator,
    ...(normalizedMetadata ? { metadata: normalizedMetadata } : {}),
    references: [projectReference],
    status: resolveFilmAssetStatus(metadata, uploaded),
    ...(typeof uploaded.size === 'number' ? { size: uploaded.size } : {}),
    ...(normalizeAssetTimestamp(uploaded.createdAt)
      ? { createdAt: normalizeAssetTimestamp(uploaded.createdAt) }
      : {}),
    ...(normalizeAssetTimestamp(uploaded.updatedAt)
      ? { updatedAt: normalizeAssetTimestamp(uploaded.updatedAt) }
      : {}),
  });
};

export const importFilmAssetFromUrl = async (
  sourceUrl: string,
  name: string,
  type: FilmImportType,
  metadata: FilmImportMetadata
): Promise<ImportedFilmAssetRef> => {
  const inlineData = await inlineDataService.tryExtractInlineData(sourceUrl);
  const uploaded = inlineData
    ? await importAssetBySdk(
      {
        name,
        data: inlineData
      },
      type,
      { domain: 'film' }
    )
    : await importAssetFromUrlBySdk(
      sourceUrl,
      type,
      {
        name,
        domain: 'film'
      }
    );
  const resolvedUrl =
    (await resolveAssetPrimaryUrlBySdk(uploaded.id)) ||
    uploaded.path ||
    sourceUrl;
  await persistFilmProjectReference(uploaded, type, name, resolvedUrl, metadata);

  return {
    ...toImportedFilmAssetRef({
      assetId: uploaded.id,
      uuid: resolveAssetRecordClientUuid(uploaded),
      assetUuid: resolveExplicitUploadAssetUuid(uploaded),
      type,
      url: resolvedUrl
    })
  };
};

export const resolveFilmGeneratedSelectionAsset = async (
  selection: FilmGeneratedSelectionLike,
  name: string,
  type: FilmImportType,
  metadata: Record<string, unknown>
): Promise<ImportedFilmAssetRef> => {
  const assetId = resolveSelectionAssetId(selection);
  const assetUuid = resolveSelectionAssetUuid(selection);
  const sourceUrl = resolveSelectionDeliveryUrl(selection);
  if (assetId) {
    const resolvedUrl = await resolveAssetPrimaryUrlBySdk(assetId);
    const finalUrl = resolvedUrl || sourceUrl;
    if (!finalUrl) {
      throw new Error('Generated selection is missing a delivery url');
    }
    return toImportedFilmAssetRef({
      assetId,
      uuid: assetUuid,
      assetUuid,
      type,
      url: finalUrl
    });
  }

  if (!sourceUrl) {
    throw new Error('Generated selection is missing a delivery url');
  }

  return importFilmAssetFromUrl(sourceUrl, name, type, metadata);
};

export const resolveFilmGeneratedOutcomeAsset = async (
  outcome: GenerationOutcome,
  name: string,
  type: FilmImportType,
  metadata: Record<string, unknown>
): Promise<ImportedFilmAssetRef> => {
  const assetId = outcome.delivery.assetId || outcome.primaryArtifact.assetId || null;
  const sourceUrl = resolveGenerationOutcomePrimaryUrl(outcome) || outcome.delivery.url;
  const outcomeWithAssetUuid = outcome as GenerationOutcome & {
    delivery?: { assetUuid?: string | null };
    primaryArtifact?: { assetUuid?: string | null };
  };
  const assetUuid =
    pickFirst(
      outcomeWithAssetUuid.delivery?.assetUuid,
      outcomeWithAssetUuid.primaryArtifact?.assetUuid
    ) || undefined;

  if (assetId) {
    const resolvedUrl = await resolveAssetPrimaryUrlBySdk(assetId);
    const finalUrl = resolvedUrl || sourceUrl;
    if (!finalUrl) {
      throw new Error('Generation outcome is missing a delivery url');
    }
    return toImportedFilmAssetRef({
      assetId,
      uuid: assetUuid,
      assetUuid,
      type,
      url: finalUrl
    });
  }

  if (!sourceUrl) {
    throw new Error('Generation outcome is missing a delivery url');
  }

  return importFilmAssetFromUrl(sourceUrl, name, type, metadata);
};

export const importFilmAssetFromFile = async (
  file: File,
  type: FilmImportType,
  metadata: FilmImportMetadata
): Promise<ImportedFilmAssetRef> => {
  const data = new Uint8Array(await file.arrayBuffer());
  const uploaded = await importAssetBySdk(
    {
      name: file.name,
      data
    },
    type,
    { domain: 'film' }
  );
  const resolvedUrl =
    (await resolveAssetPrimaryUrlBySdk(uploaded.id)) ||
    uploaded.path ||
    '';
  await persistFilmProjectReference(uploaded, type, file.name, resolvedUrl, metadata);

  return {
    ...toImportedFilmAssetRef({
      assetId: uploaded.id,
      uuid: resolveAssetRecordClientUuid(uploaded),
      assetUuid: resolveExplicitUploadAssetUuid(uploaded),
      type,
      url: resolvedUrl
    })
  };
};

export const resolveChosenAsset = async (asset: Asset): Promise<ImportedFilmAssetRef | null> => {
  const assetId = resolveAssetRecordId(asset);
  if (!assetId) {
    return null;
  }
  const assetWithLocator = asset as Asset & {
    url?: string;
    remoteUrl?: string;
  };
  const resolved = await resolveAssetUrlByAssetIdFirst({
    id: assetId,
    path: asset.path,
    url: assetWithLocator.remoteUrl || assetWithLocator.url
  });
  if (!resolved) {
    return null;
  }
  return toImportedFilmAssetRef({
    assetId,
    uuid: resolveAssetRecordClientUuid(asset) || assetId,
    assetUuid: resolveAssetRecordAssetUuid(asset),
    type: normalizeImportedFilmAssetType(asset.type),
    url: resolved
  });
};
