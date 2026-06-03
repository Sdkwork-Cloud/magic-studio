import { resolveImportDataKey, type ImportData } from '@sdkwork/magic-studio-assets/generation';

import {
    createGeneratedMusicResult,
    createMusicTask,
    type MusicTask
} from '../entities';
import { normalizeMusicModel } from '../utils/musicModel';

const resolveDuration = (data: ImportData): number => {
    if (typeof data.duration === 'number' && Number.isFinite(data.duration) && data.duration > 0) {
        return data.duration;
    }

    const metadataDuration = data.resource.metadata?.duration;
    if (typeof metadataDuration === 'number' && Number.isFinite(metadataDuration) && metadataDuration > 0) {
        return metadataDuration;
    }

    return 180;
};

export const mapImportDataToMusicTask = (data: ImportData): MusicTask => {
    const importTaskKey = resolveImportDataKey(data);
    const duration = resolveDuration(data);
    const title = data.title || data.resource.name || 'Imported Music';
    const lyrics = data.lyrics || '';
    const style = data.style || '';

    return createMusicTask({
        id: null,
        uuid: importTaskKey,
        createdAt: data.createdAt,
        updatedAt: data.createdAt,
        status: 'completed',
        config: {
            mode: 'generate',
            customMode: Boolean(lyrics || data.title),
            prompt: data.prompt,
            lyrics,
            style,
            title,
            instrumental: Boolean(data.isInstrumental),
            model: normalizeMusicModel(data.model),
            duration,
            extendDuration: 30,
            sourceMusic: null,
            mediaType: 'music',
        },
        results: [
            createGeneratedMusicResult({
                id: data.resource.id ?? null,
                uuid: data.resource.uuid,
                assetId: data.resource.assetId ?? null,
                assetUuid: data.resource.assetUuid ?? null,
                primaryResourceId: data.resource.primaryResourceId ?? null,
                primaryResourceUuid: data.resource.primaryResourceUuid ?? null,
                resourceViewId: data.resource.resourceViewId ?? null,
                resourceViewUuid: data.resource.resourceViewUuid ?? null,
                recipeUuid: importTaskKey,
                executionUuid: importTaskKey,
                artifactSetUuid: importTaskKey,
                artifactUuid: data.resource.uuid,
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
                    name: data.resource.name || title,
                    mimeType: data.resource.mimeType,
                    metadata: data.resource.metadata,
                    duration,
                },
                coverResource: data.coverResource
                    ? {
                        id: data.coverResource.id ?? null,
                        uuid: data.coverResource.uuid,
                        assetId: data.coverResource.assetId ?? null,
                        assetUuid: data.coverResource.assetUuid ?? null,
                        primaryResourceId: data.coverResource.primaryResourceId ?? null,
                        primaryResourceUuid: data.coverResource.primaryResourceUuid ?? null,
                        resourceViewId: data.coverResource.resourceViewId ?? null,
                        resourceViewUuid: data.coverResource.resourceViewUuid ?? null,
                        url: data.coverResource.url,
                        name: data.coverResource.name || `${title} Cover`,
                        mimeType: data.coverResource.mimeType,
                        metadata: data.coverResource.metadata,
                    }
                    : undefined,
                title,
                duration,
                lyrics,
                style,
            }),
        ],
        isFavorite: false,
    });
};
