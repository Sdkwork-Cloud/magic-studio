import { inlineDataService } from '@sdkwork/magic-studio-core/services';
import {
  isCanonicalMagicStudioAssetReference as isStableSelectionReference,
  isRenderableAssetUrl as isRenderableSelectionUrl,
} from '@sdkwork/magic-studio-core/storage';
import { readAssetRecordMetadataValue } from '@sdkwork/magic-studio-commons/utils/assetIdentity';
import { createUuid } from '@sdkwork/magic-studio-types/entity';
import type { AssetBusinessDomain } from '@sdkwork/magic-studio-types/asset-center';
import type { AssetType } from '@sdkwork/magic-studio-types/assets';

import {
  importAssetBySdk,
  importAssetFromUrlBySdk,
  resolveAssetPrimaryUrlBySdk,
} from './assetSdkQueryService';

export interface PersistGeneratedSelectionLike {
  id?: string | null;
  uuid?: string | null;
  assetId?: string | null;
  assetUuid?: string | null;
  primaryResourceId?: string | null;
  primaryResourceUuid?: string | null;
  resourceViewId?: string | null;
  resourceViewUuid?: string | null;
  path?: string;
  url?: string;
  resource?: {
    assetId?: string | null;
    assetUuid?: string | null;
    primaryResourceId?: string | null;
    primaryResourceUuid?: string | null;
    resourceViewId?: string | null;
    resourceViewUuid?: string | null;
    path?: string | null;
    url?: string | null;
    metadata?: Record<string, unknown>;
  };
}

export interface PersistGeneratedSelectionAssetInput {
  selection: PersistGeneratedSelectionLike;
  type: AssetType;
  domain: AssetBusinessDomain;
  name: string;
}

export interface PersistedGeneratedSelectionAsset {
  artifactId: string | null;
  artifactUuid: string;
  assetId: string;
  assetUuid: string | null;
  primaryResourceId: string | null;
  primaryResourceUuid: string | null;
  resourceViewId: string | null;
  resourceViewUuid: string | null;
  path: string;
  url: string;
  sourceUrl: string;
}

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

const readSelectionResourceMetadataValue = (
  selection: PersistGeneratedSelectionLike,
  key:
    | 'assetId'
    | 'assetUuid'
    | 'primaryResourceId'
    | 'primaryResourceUuid'
    | 'resourceViewId'
    | 'resourceViewUuid'
): string | null => {
  const metadata = selection.resource?.metadata;
  if (!metadata) {
    return null;
  }
  return normalizeValue(metadata[key] as string | null | undefined);
};

const resolveSelectionAssetId = (
  selection: PersistGeneratedSelectionLike
): string | null =>
  pickFirst(
    selection.assetId,
    selection.resource?.assetId,
    readSelectionResourceMetadataValue(selection, 'assetId')
  );

const resolveSelectionAssetUuid = (
  selection: PersistGeneratedSelectionLike
): string | null =>
  pickFirst(
    selection.assetUuid,
    selection.resource?.assetUuid,
    readSelectionResourceMetadataValue(selection, 'assetUuid')
  );

const resolveSelectionPrimaryResourceId = (
  selection: PersistGeneratedSelectionLike
): string | null =>
  pickFirst(
    selection.primaryResourceId,
    selection.resource?.primaryResourceId,
    readSelectionResourceMetadataValue(selection, 'primaryResourceId')
  );

const resolveSelectionPrimaryResourceUuid = (
  selection: PersistGeneratedSelectionLike
): string | null =>
  pickFirst(
    selection.primaryResourceUuid,
    selection.resource?.primaryResourceUuid,
    readSelectionResourceMetadataValue(selection, 'primaryResourceUuid')
  );

const resolveSelectionResourceViewId = (
  selection: PersistGeneratedSelectionLike
): string | null =>
  pickFirst(
    selection.resourceViewId,
    selection.resource?.resourceViewId,
    readSelectionResourceMetadataValue(selection, 'resourceViewId')
  );

const resolveSelectionResourceViewUuid = (
  selection: PersistGeneratedSelectionLike
): string | null =>
  pickFirst(
    selection.resourceViewUuid,
    selection.resource?.resourceViewUuid,
    readSelectionResourceMetadataValue(selection, 'resourceViewUuid')
  );

const buildSelectionIdentity = (
  selection: PersistGeneratedSelectionLike
): { artifactId: string | null; artifactUuid: string } => ({
  artifactId: normalizeValue(selection.id) || null,
  artifactUuid:
    pickFirst(
      selection.uuid,
      resolveSelectionResourceViewUuid(selection),
      resolveSelectionPrimaryResourceUuid(selection),
      resolveSelectionAssetUuid(selection),
      resolveSelectionResourceViewId(selection),
      resolveSelectionPrimaryResourceId(selection),
      resolveSelectionAssetId(selection)
    ) || createUuid(),
});

const resolveSelectionReference = (
  selection: PersistGeneratedSelectionLike
): string => pickFirst(
  selection.resource?.path,
  selection.path,
  selection.resource?.url,
  selection.url
) || '';

const resolveSelectionDeliveryUrl = (
  selection: PersistGeneratedSelectionLike
): string => pickFirst(
  selection.resource?.url,
  selection.url,
  isRenderableSelectionUrl(selection.resource?.path) ? selection.resource?.path : null,
  isRenderableSelectionUrl(selection.path) ? selection.path : null
) || '';

const resolveUploadedSelectionReference = (
  uploadedPath: string | null | undefined,
  resolvedUrl: string | null | undefined,
  sourceReference: string,
  sourceUrl: string
): string =>
  pickFirst(
    isStableSelectionReference(uploadedPath) ? uploadedPath : null,
    resolvedUrl,
    uploadedPath,
    sourceReference,
    sourceUrl
  ) || '';

const resolveUploadedSelectionDeliveryUrl = (
  uploadedPath: string | null | undefined,
  resolvedUrl: string | null | undefined,
  sourceUrl: string
): string =>
  pickFirst(
    resolvedUrl,
    isRenderableSelectionUrl(uploadedPath) ? uploadedPath : null,
    sourceUrl
  ) || '';

export const persistGeneratedSelectionAsset = async ({
  selection,
  type,
  domain,
  name,
}: PersistGeneratedSelectionAssetInput): Promise<PersistedGeneratedSelectionAsset> => {
  const assetId = resolveSelectionAssetId(selection);
  const sourceReference = resolveSelectionReference(selection);
  const sourceUrl = resolveSelectionDeliveryUrl(selection);

  if (assetId) {
    const resolvedUrl = await resolveAssetPrimaryUrlBySdk(assetId);
    const finalUrl = pickFirst(resolvedUrl, sourceUrl);
    const finalReference = pickFirst(sourceReference, finalUrl);
    if (!finalUrl) {
      throw new Error('Generated selection is missing a delivery url');
    }
    if (!finalReference) {
      throw new Error('Generated selection is missing a canonical reference');
    }
    const artifactIdentity = buildSelectionIdentity(selection);
    const assetUuid = resolveSelectionAssetUuid(selection);
    const primaryResourceId = resolveSelectionPrimaryResourceId(selection);
    const resourceViewId = resolveSelectionResourceViewId(selection);

    return {
      ...artifactIdentity,
      assetId,
      assetUuid,
      primaryResourceId,
      primaryResourceUuid: resolveSelectionPrimaryResourceUuid(selection),
      resourceViewId,
      resourceViewUuid: resolveSelectionResourceViewUuid(selection),
      path: finalReference,
      url: finalUrl,
      sourceUrl: sourceUrl || finalUrl,
    };
  }

  if (!sourceUrl) {
    throw new Error('Generated selection is missing a delivery url');
  }

  const inlineData = await inlineDataService.tryExtractInlineData(sourceUrl);
  const uploaded = inlineData
    ? await importAssetBySdk(
        {
          name,
          data: inlineData,
        },
        type,
        { domain }
      )
    : await importAssetFromUrlBySdk(
        sourceUrl,
        type,
        {
          name,
          domain,
        }
      );
  const uploadedAssetUuid = readAssetRecordMetadataValue(uploaded as { metadata?: Record<string, unknown> }, 'assetUuid');
  const resolvedUrl = await resolveAssetPrimaryUrlBySdk(uploaded.id);
  const finalReference = resolveUploadedSelectionReference(
    uploaded.path,
    resolvedUrl,
    sourceReference,
    sourceUrl
  );
  const finalUrl = resolveUploadedSelectionDeliveryUrl(
    uploaded.path,
    resolvedUrl,
    sourceUrl
  );

  return {
    ...buildSelectionIdentity(selection),
    assetId: uploaded.id,
    assetUuid: normalizeValue(uploadedAssetUuid) || null,
    primaryResourceId: resolveSelectionPrimaryResourceId(selection),
    primaryResourceUuid: resolveSelectionPrimaryResourceUuid(selection),
    resourceViewId: resolveSelectionResourceViewId(selection),
    resourceViewUuid: resolveSelectionResourceViewUuid(selection),
    path: finalReference,
    url: finalUrl,
    sourceUrl,
  };
};
