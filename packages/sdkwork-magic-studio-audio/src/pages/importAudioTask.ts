import { resolveImportDataKey, type ImportData } from '@sdkwork/magic-studio-assets/generation';

import {
    createAudioTask,
    createAudioTaskResult,
    type AudioTask
} from '../entities';
import { normalizeAudioTtsModel } from '../utils/audioModel';

export const mapImportDataToAudioTask = (data: ImportData): AudioTask => {
    const importTaskKey = resolveImportDataKey(data);

    return createAudioTask({
        id: null,
        uuid: importTaskKey,
        createdAt: data.createdAt,
        updatedAt: data.createdAt,
        status: 'completed',
        prompt: data.prompt,
        config: {
            prompt: data.prompt,
            mode: 'text-to-speech',
            model: normalizeAudioTtsModel(data.model),
            duration: data.duration,
            mediaType: 'speech',
        },
        results: [createAudioTaskResult({
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
                uuid: data.resource.uuid,
                assetId: data.resource.assetId ?? null,
                assetUuid: data.resource.assetUuid ?? null,
                primaryResourceId: data.resource.primaryResourceId ?? null,
                primaryResourceUuid: data.resource.primaryResourceUuid ?? null,
                resourceViewId: data.resource.resourceViewId ?? null,
                resourceViewUuid: data.resource.resourceViewUuid ?? null,
                url: data.resource.url,
                name: data.resource.name,
                mimeType: data.resource.mimeType,
                metadata: data.resource.metadata,
                duration: data.duration
            },
            duration: data.duration
        })]
    });
};
