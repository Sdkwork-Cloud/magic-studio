import { resolveImportDataKey, type ImportData } from '@sdkwork/magic-studio-assets/generation';

import {
    createGeneratedSfxResult,
    createSfxTask,
    type SfxTask
} from '../entities';
import { normalizeSfxModel } from '../utils/sfxModel';

export const mapImportDataToSfxTask = (data: ImportData): SfxTask => {
    const importTaskKey = resolveImportDataKey(data);
    const result = createGeneratedSfxResult({
        id: data.resource.id ?? null,
        uuid: data.resource.uuid,
        assetId: data.resource.assetId ?? null,
        assetUuid: data.resource.assetUuid ?? null,
        primaryResourceId: data.resource.primaryResourceId ?? null,
        primaryResourceUuid: data.resource.primaryResourceUuid ?? null,
        resourceViewId: data.resource.resourceViewId ?? null,
        resourceViewUuid: data.resource.resourceViewUuid ?? null,
        resource: {
            id: data.resource.id ?? null,
            uuid:
                data.resource.resourceViewUuid ||
                data.resource.primaryResourceUuid ||
                data.resource.assetUuid ||
                data.resource.uuid,
            assetId: data.resource.assetId ?? null,
            assetUuid: data.resource.assetUuid ?? null,
            primaryResourceId: data.resource.primaryResourceId ?? null,
            primaryResourceUuid: data.resource.primaryResourceUuid ?? null,
            resourceViewId: data.resource.resourceViewId ?? null,
            resourceViewUuid: data.resource.resourceViewUuid ?? null,
            url: data.resource.url,
            name: data.resource.name || 'Imported SFX',
            mimeType: data.resource.mimeType,
            duration: data.duration || 0,
            metadata: data.resource.metadata,
        },
        duration: data.duration || 0,
    });

    return createSfxTask({
        id: null,
        uuid: importTaskKey,
        createdAt: data.createdAt,
        updatedAt: data.createdAt,
        status: 'completed',
        config: {
            prompt: data.prompt,
            duration: data.duration || 0,
            model: normalizeSfxModel(data.model),
            mediaType: 'sfx',
        },
        results: [result],
    });
};
