import { createUuid } from '@sdkwork/magic-studio-types/entity';
import type { GenerationResultSelection } from '@sdkwork/magic-studio-generation-history';
import { isRenderableAssetUrl } from '../../asset-center';

import type { Asset, AssetMetadata, AssetType } from '../../entities';

type SelectionIdentityResourceLike = {
  assetId?: string | null;
  assetUuid?: string | null;
  primaryResourceId?: string | null;
  primaryResourceUuid?: string | null;
  resourceViewId?: string | null;
  resourceViewUuid?: string | null;
  path?: string | null;
  metadata?: Record<string, unknown>;
};

type ResolvedSelectionIdentity = {
  assetId: string | null;
  assetUuid: string | null;
  primaryResourceId: string | null;
  primaryResourceUuid: string | null;
  resourceViewId: string | null;
  resourceViewUuid: string | null;
};

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

const isRenderableSelectionUrl = (value: string | null | undefined): boolean => {
  const normalized = normalizeValue(value);
  if (!normalized) {
    return false;
  }

  return isRenderableAssetUrl(normalized);
};

const resolveSelectionReference = (
  selection: GenerationResultSelection
): string => pickFirst(
  (selection.resource as SelectionIdentityResourceLike | undefined)?.path,
  (selection as GenerationResultSelection & { path?: string | null }).path,
  selection.resource?.url,
  selection.url
) || '';

const resolveSelectionDeliveryUrl = (
  selection: GenerationResultSelection
): string => pickFirst(
  selection.resource?.url,
  selection.url,
  isRenderableSelectionUrl(
    (selection.resource as SelectionIdentityResourceLike | undefined)?.path
  )
    ? (selection.resource as SelectionIdentityResourceLike | undefined)?.path
    : null,
  isRenderableSelectionUrl(
    (selection as GenerationResultSelection & { path?: string | null }).path
  )
    ? (selection as GenerationResultSelection & { path?: string | null }).path
    : null
) || '';

const readIdentityMetadataValue = (
  metadata: Record<string, unknown> | undefined,
  key:
    | 'assetId'
    | 'assetUuid'
    | 'primaryResourceId'
    | 'primaryResourceUuid'
    | 'resourceViewId'
    | 'resourceViewUuid'
): string | null => normalizeValue(metadata?.[key] as string | null | undefined);

const resolveSelectionIdentity = (
  selection: GenerationResultSelection
): ResolvedSelectionIdentity => {
  const resource = selection.resource as SelectionIdentityResourceLike | undefined;
  const metadata = resource?.metadata;

  return {
    assetId: pickFirst(
      selection.assetId,
      resource?.assetId,
      readIdentityMetadataValue(metadata, 'assetId')
    ),
    assetUuid: pickFirst(
      selection.assetUuid,
      resource?.assetUuid,
      readIdentityMetadataValue(metadata, 'assetUuid')
    ),
    primaryResourceId: pickFirst(
      selection.primaryResourceId,
      resource?.primaryResourceId,
      readIdentityMetadataValue(metadata, 'primaryResourceId')
    ),
    primaryResourceUuid: pickFirst(
      selection.primaryResourceUuid,
      resource?.primaryResourceUuid,
      readIdentityMetadataValue(metadata, 'primaryResourceUuid')
    ),
    resourceViewId: pickFirst(
      selection.resourceViewId,
      resource?.resourceViewId,
      readIdentityMetadataValue(metadata, 'resourceViewId')
    ),
    resourceViewUuid: pickFirst(
      selection.resourceViewUuid,
      resource?.resourceViewUuid,
      readIdentityMetadataValue(metadata, 'resourceViewUuid')
    ),
  };
};

const mapSelectionTypeToAssetType = (
  type: GenerationResultSelection['type']
): AssetType => {
  switch (type) {
    case 'image':
      return 'image';
    case 'video':
      return 'video';
    case 'audio':
      return 'audio';
    case 'sfx':
      return 'sfx';
    case 'music':
      return 'music';
    case 'voice':
      return 'voice';
    case 'speech':
      return 'audio';
    default:
      return 'file';
  }
};

const buildSelectionAssetName = (
  type: GenerationResultSelection['type']
): string => {
  switch (type) {
    case 'video':
      return 'AI Generated Video';
    case 'audio':
      return 'AI Generated Audio';
    case 'sfx':
      return 'AI Generated Sound Effect';
    case 'music':
      return 'AI Generated Music';
    case 'voice':
      return 'AI Generated Voice';
    case 'speech':
      return 'AI Generated Speech';
    case 'image':
    default:
      return 'AI Generated Image';
  }
};

const buildSelectionAssetMetadata = (
  selection: GenerationResultSelection,
  identity: ResolvedSelectionIdentity
): AssetMetadata => ({
  sourceTaskKey: selection.taskKey,
  sourceTaskId: selection.taskId,
  sourceTaskUuid: selection.taskUuid,
  selectionKey: selection.key,
  resultIndex: selection.resultIndex,
  assetId: identity.assetId || undefined,
  assetUuid: identity.assetUuid || undefined,
  primaryResourceId: identity.primaryResourceId || undefined,
  primaryResourceUuid: identity.primaryResourceUuid || undefined,
  resourceViewId: identity.resourceViewId || undefined,
  resourceViewUuid: identity.resourceViewUuid || undefined,
});

const resolveTransientSelectionAssetId = (
  selection: GenerationResultSelection,
  identity: ResolvedSelectionIdentity
): string =>
  pickFirst(
    identity.assetId,
    selection.id,
    selection.key,
    selection.uuid,
    identity.assetUuid
  ) || createUuid();

export const toAssetFromGeneratedSelection = (
  selection: GenerationResultSelection
): Asset => {
  const identity = resolveSelectionIdentity(selection);
  const id = resolveTransientSelectionAssetId(selection, identity);
  const createdAt = selection.createdAt ?? Date.now();
  const metadata = buildSelectionAssetMetadata(selection, identity);
  const reference = resolveSelectionReference(selection);
  const deliveryUrl = resolveSelectionDeliveryUrl(selection);

  return {
    id,
    uuid:
      pickFirst(
        identity.assetUuid,
        identity.resourceViewUuid,
        identity.primaryResourceUuid,
        selection.uuid,
        identity.resourceViewId,
        identity.primaryResourceId,
        identity.assetId,
        selection.key
    ) || createUuid(),
    name: buildSelectionAssetName(selection.type),
    type: mapSelectionTypeToAssetType(selection.type),
    path: reference || deliveryUrl,
    size: 0,
    createdAt,
    updatedAt: createdAt,
    origin: 'ai',
    metadata,
  };
};
