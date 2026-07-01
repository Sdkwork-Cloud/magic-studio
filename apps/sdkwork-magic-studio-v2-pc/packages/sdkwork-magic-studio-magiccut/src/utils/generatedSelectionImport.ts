import {
    assetCenterService,
    isCanonicalMagicStudioAssetReference as isStableSelectionReference,
    isRenderableAssetUrl as isRenderableSelectionUrl,
} from '@sdkwork/magic-studio-assets/asset-center';
import {
    importAssetBySdk,
    importAssetFromUrlBySdk,
    resolveAssetPrimaryUrlBySdk,
} from '@sdkwork/magic-studio-assets/services';
import { inlineDataService } from '@sdkwork/magic-studio-core/services';
import {
    type AnyMediaResource,
    type AssetContentKey,
} from '@sdkwork/magic-studio-types/media';
import { resolveEntityKey } from '@sdkwork/magic-studio-types/entity';
import { MediaResourceType } from '@sdkwork/magic-studio-types/vocabulary';

import { buildMagicCutResourceView } from '../domain/assets/magicCutAssetState';
import { normalizeResourceForTimeline } from './assetReferenceNormalization';

export interface GeneratedSelectionLike {
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
    duration?: number;
}

export interface ResolveMagicCutGeneratedSelectionResourceInput {
    selection: GeneratedSelectionLike;
    type: AssetContentKey;
    name: string;
    metadata?: Record<string, unknown>;
}

const mapContentKeyToMediaResourceType = (type: AssetContentKey): MediaResourceType => {
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
        case 'effect':
            return MediaResourceType.EFFECT;
        case 'transition':
            return MediaResourceType.TRANSITION;
        case 'lottie':
            return MediaResourceType.LOTTIE;
        case 'model3d':
            return MediaResourceType.MODEL_3D;
        case 'sfx':
            return MediaResourceType.AUDIO;
        case 'file':
        default:
            return MediaResourceType.FILE;
    }
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

const isRenderableSelectionReference = (value: string | null | undefined): boolean => {
    const normalized = normalizeValue(value);
    return Boolean(normalized && isRenderableSelectionUrl(normalized));
};

const resolveSelectionReference = (selection: GeneratedSelectionLike): string =>
    pickFirst(
        selection.resource?.path,
        selection.path,
        selection.resource?.url,
        selection.url
    ) || '';

const resolveSelectionDeliveryUrl = (selection: GeneratedSelectionLike): string =>
    pickFirst(
        selection.resource?.url,
        selection.url,
        isRenderableSelectionReference(selection.resource?.path) ? selection.resource?.path : null,
        isRenderableSelectionReference(selection.path) ? selection.path : null
    ) || '';

const readSelectionResourceMetadataValue = (
    selection: GeneratedSelectionLike,
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

const resolveSelectionAssetId = (selection: GeneratedSelectionLike): string | null =>
    pickFirst(
        selection.assetId,
        selection.resource?.assetId,
        readSelectionResourceMetadataValue(selection, 'assetId')
    );

const resolveSelectionAssetUuid = (selection: GeneratedSelectionLike): string | null =>
    pickFirst(
        selection.assetUuid,
        selection.resource?.assetUuid,
        readSelectionResourceMetadataValue(selection, 'assetUuid')
    );

const resolveSelectionPrimaryResourceId = (selection: GeneratedSelectionLike): string | null =>
    pickFirst(
        selection.primaryResourceId,
        selection.resource?.primaryResourceId,
        readSelectionResourceMetadataValue(selection, 'primaryResourceId')
    );

const resolveSelectionPrimaryResourceUuid = (selection: GeneratedSelectionLike): string | null =>
    pickFirst(
        selection.primaryResourceUuid,
        selection.resource?.primaryResourceUuid,
        readSelectionResourceMetadataValue(selection, 'primaryResourceUuid')
    );

const resolveSelectionResourceViewId = (selection: GeneratedSelectionLike): string | null =>
    pickFirst(
        selection.resourceViewId,
        selection.resource?.resourceViewId,
        readSelectionResourceMetadataValue(selection, 'resourceViewId')
    );

const resolveSelectionResourceViewUuid = (selection: GeneratedSelectionLike): string | null =>
    pickFirst(
        selection.resourceViewUuid,
        selection.resource?.resourceViewUuid,
        readSelectionResourceMetadataValue(selection, 'resourceViewUuid')
    );

const buildSelectionBackedResource = ({
    selection,
    type,
    name,
    reference,
    url,
    metadata,
}: ResolveMagicCutGeneratedSelectionResourceInput & {
    reference: string;
    url: string;
}): AnyMediaResource => {
    const assetId = resolveSelectionAssetId(selection) || undefined;
    const assetUuid = resolveSelectionAssetUuid(selection) || undefined;
    const primaryResourceId = resolveSelectionPrimaryResourceId(selection) || undefined;
    const primaryResourceUuid = resolveSelectionPrimaryResourceUuid(selection) || undefined;
    const resourceViewId = resolveSelectionResourceViewId(selection) || undefined;
    const resourceViewUuid = resolveSelectionResourceViewUuid(selection) || undefined;

    return normalizeResourceForTimeline({
        id: assetId || resourceViewId || name,
        uuid:
            pickFirst(
                resourceViewUuid,
                primaryResourceUuid,
                assetUuid,
                assetId,
                resourceViewId,
                name
            ) || name,
        assetId,
        primaryResourceId,
        resourceViewId,
        name,
        type: mapContentKeyToMediaResourceType(type),
        url: url || undefined,
        path: reference,
        duration: selection.duration,
        metadata: {
            ...(metadata || {}),
            ...(assetId ? { assetId } : {}),
            ...(assetUuid ? { assetUuid } : {}),
            ...(primaryResourceId ? { primaryResourceId } : {}),
            ...(primaryResourceUuid ? { primaryResourceUuid } : {}),
            ...(resourceViewId ? { resourceViewId } : {}),
            ...(resourceViewUuid ? { resourceViewUuid } : {}),
            primaryType: type,
            scopeDomain: 'magiccut',
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
    } as AnyMediaResource);
};

export const resolveMagicCutGeneratedSelectionResource = async ({
    selection,
    type,
    name,
    metadata = {},
}: ResolveMagicCutGeneratedSelectionResourceInput): Promise<AnyMediaResource> => {
    const assetId = resolveSelectionAssetId(selection);
    const assetUuid = resolveSelectionAssetUuid(selection);
    const primaryResourceId = resolveSelectionPrimaryResourceId(selection);
    const primaryResourceUuid = resolveSelectionPrimaryResourceUuid(selection);
    const resourceViewId = resolveSelectionResourceViewId(selection);
    const resourceViewUuid = resolveSelectionResourceViewUuid(selection);
    const sourceReference = resolveSelectionReference(selection);
    const sourceUrl = resolveSelectionDeliveryUrl(selection);

    if (assetId) {
        await assetCenterService.initialize();
        const existingAsset = await assetCenterService.findById(assetId);
        if (existingAsset) {
            const existingResourceView = buildMagicCutResourceView(existingAsset);
            const existingDuration =
                'duration' in existingResourceView && typeof existingResourceView.duration === 'number'
                    ? existingResourceView.duration
                    : undefined;
            const existingPrimaryResourceId =
                existingResourceView.primaryResourceId || existingResourceView.metadata?.primaryResourceId;
            const existingResourceViewId =
                existingResourceView.resourceViewId || existingResourceView.metadata?.resourceViewId;
            return normalizeResourceForTimeline({
                ...existingResourceView,
                duration: selection.duration ?? existingDuration,
                assetId,
                primaryResourceId: primaryResourceId || existingPrimaryResourceId,
                resourceViewId: resourceViewId || existingResourceViewId,
                metadata: {
                    ...existingResourceView.metadata,
                    ...metadata,
                    assetId,
                    ...(assetUuid || existingResourceView.metadata?.assetUuid
                        ? {
                            assetUuid:
                                assetUuid || existingResourceView.metadata?.assetUuid,
                        }
                        : {}),
                    ...(primaryResourceId || existingPrimaryResourceId
                        ? {
                            primaryResourceId:
                                primaryResourceId || existingPrimaryResourceId,
                        }
                        : {}),
                    ...(primaryResourceUuid || existingResourceView.metadata?.primaryResourceUuid
                        ? {
                            primaryResourceUuid:
                                primaryResourceUuid || existingResourceView.metadata?.primaryResourceUuid,
                        }
                        : {}),
                    ...(resourceViewId || existingResourceViewId
                        ? {
                            resourceViewId:
                                resourceViewId || existingResourceViewId,
                        }
                        : {}),
                    ...(resourceViewUuid || existingResourceView.metadata?.resourceViewUuid
                        ? {
                            resourceViewUuid:
                                resourceViewUuid || existingResourceView.metadata?.resourceViewUuid,
                        }
                        : {}),
                    primaryType: type,
                    scopeDomain: 'magiccut',
                },
            } as AnyMediaResource);
        }

        const resolvedAssetUrl =
            (await resolveAssetPrimaryUrlBySdk(assetId)) ||
            sourceUrl;
        const rebuiltReference = sourceReference || resolvedAssetUrl;
        if (rebuiltReference) {
            return buildSelectionBackedResource({
                selection,
                type,
                name,
                metadata,
                reference: rebuiltReference,
                url:
                    resolvedAssetUrl ||
                    (isRenderableSelectionReference(sourceReference)
                        ? sourceReference
                        : ''),
            });
        }
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
            { domain: 'magiccut' }
        )
        : await importAssetFromUrlBySdk(
            sourceUrl,
            type,
            {
                name,
                domain: 'magiccut',
            }
        );
    const uploadedKey = resolveEntityKey(uploaded);
    const resolvedUrl =
        (uploaded.id ? await resolveAssetPrimaryUrlBySdk(uploaded.id) : '') ||
        uploaded.path ||
        sourceUrl;
    const canonicalReference =
        (isStableSelectionReference(uploaded.path) ? uploaded.path : '') ||
        resolvedUrl ||
        uploaded.path ||
        sourceReference ||
        sourceUrl;
    const deliveryUrl =
        (isRenderableSelectionReference(resolvedUrl) ? resolvedUrl : '') ||
        (isRenderableSelectionReference(uploaded.path) ? uploaded.path : '') ||
        sourceUrl;

    return normalizeResourceForTimeline({
        id: uploaded.id,
        uuid: uploaded.uuid || uploadedKey,
        name: uploaded.name,
        type: mapContentKeyToMediaResourceType(uploaded.type),
        url: deliveryUrl || undefined,
        path: canonicalReference,
        size: Number(uploaded.size || 0),
        origin: uploaded.origin,
        metadata: {
            ...(uploaded.metadata || {}),
            ...(metadata || {}),
            duration: selection.duration ?? metadata.duration,
        },
        duration: selection.duration,
        createdAt: uploaded.createdAt,
        updatedAt: uploaded.updatedAt,
    } as AnyMediaResource);
};
