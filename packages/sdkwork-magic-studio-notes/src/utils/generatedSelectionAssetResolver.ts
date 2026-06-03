import {
    importAssetFromUrlBySdk,
    resolveAssetPrimaryUrlBySdk
} from '@sdkwork/magic-studio-assets';
import { readAssetRecordMetadataValue } from '@sdkwork/magic-studio-commons/utils/assetIdentity';

export interface NotesGeneratedSelectionLike {
    assetId?: string | null;
    assetUuid?: string | null;
    primaryResourceId?: string | null;
    primaryResourceUuid?: string | null;
    resourceViewId?: string | null;
    resourceViewUuid?: string | null;
    url?: string;
    resource?: {
        url?: string | null;
    };
}

export interface ResolveNotesGeneratedSelectionSourceInput {
    selection: NotesGeneratedSelectionLike;
    type: 'image' | 'video' | 'audio';
    name: string;
}

export interface NotesGeneratedSelectionSource {
    assetId: string | null;
    assetUuid: string | null;
    primaryResourceId: string | null;
    primaryResourceUuid: string | null;
    resourceViewId: string | null;
    resourceViewUuid: string | null;
    url: string;
}

const normalizeOptionalString = (value: string | null | undefined): string | null => {
    if (typeof value !== 'string') {
        return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
};

const resolveSelectionUrl = (selection: NotesGeneratedSelectionLike): string => (
    normalizeOptionalString(selection.resource?.url) ||
    normalizeOptionalString(selection.url) ||
    ''
);

export const resolveNotesGeneratedSelectionSource = async ({
    selection,
    type,
    name,
}: ResolveNotesGeneratedSelectionSourceInput): Promise<NotesGeneratedSelectionSource> => {
    if (selection.assetId) {
        const resolvedUrl = await resolveAssetPrimaryUrlBySdk(selection.assetId);
        if (resolvedUrl) {
            return {
                assetId: selection.assetId,
                assetUuid: normalizeOptionalString(selection.assetUuid),
                primaryResourceId: normalizeOptionalString(selection.primaryResourceId),
                primaryResourceUuid: normalizeOptionalString(selection.primaryResourceUuid),
                resourceViewId: normalizeOptionalString(selection.resourceViewId),
                resourceViewUuid: normalizeOptionalString(selection.resourceViewUuid),
                url: resolvedUrl,
            };
        }

        const selectionUrl = resolveSelectionUrl(selection);
        if (selectionUrl) {
            return {
                assetId: selection.assetId,
                assetUuid: normalizeOptionalString(selection.assetUuid),
                primaryResourceId: normalizeOptionalString(selection.primaryResourceId),
                primaryResourceUuid: normalizeOptionalString(selection.primaryResourceUuid),
                resourceViewId: normalizeOptionalString(selection.resourceViewId),
                resourceViewUuid: normalizeOptionalString(selection.resourceViewUuid),
                url: selectionUrl,
            };
        }
    }

    const sourceUrl = resolveSelectionUrl(selection);
    const uploaded = await importAssetFromUrlBySdk(sourceUrl, type, {
        name,
        domain: 'notes',
    });
    const resolvedUrl =
        (await resolveAssetPrimaryUrlBySdk(uploaded.id)) ||
        uploaded.path ||
        sourceUrl;

    return {
        assetId: uploaded.id,
        assetUuid: normalizeOptionalString(readAssetRecordMetadataValue(uploaded, 'assetUuid')),
        primaryResourceId: normalizeOptionalString(selection.primaryResourceId),
        primaryResourceUuid: normalizeOptionalString(selection.primaryResourceUuid),
        resourceViewId: normalizeOptionalString(selection.resourceViewId),
        resourceViewUuid: normalizeOptionalString(selection.resourceViewUuid),
        url: resolvedUrl,
    };
};
