import { resolveImportDataKey, type ImportData } from '@sdkwork/magic-studio-assets/generation';

import { createGeneratedVideoResult, createVideoTask, type VideoTask } from '../entities';

export const mapImportDataToVideoTask = (data: ImportData): VideoTask => {
    const importTaskKey = resolveImportDataKey(data);

    return createVideoTask({
        id: null,
        uuid: importTaskKey,
        createdAt: data.createdAt,
        updatedAt: data.createdAt,
        status: 'completed',
        taskType: 'generation',
        config: {
            mode: 'text',
            prompt: data.prompt,
            aspectRatio: (data.aspectRatio as any) || '16:9',
            resolution: (data.resolution as any) || '720p',
            duration: (data.duration ? `${data.duration}s` : '5s') as any,
            fps: (data.fps as any) || 30,
            model: data.model,
            styleId: data.style || 'none',
            mediaType: (data.type === 'video' ? 'video' : 'image') as any
        },
        results: [createGeneratedVideoResult({
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
            },
            coverResource: data.coverResource ? {
                id: data.coverResource.id ?? null,
                uuid: data.coverResource.uuid,
                assetId: data.coverResource.assetId ?? null,
                assetUuid: data.coverResource.assetUuid ?? null,
                primaryResourceId: data.coverResource.primaryResourceId ?? null,
                primaryResourceUuid: data.coverResource.primaryResourceUuid ?? null,
                resourceViewId: data.coverResource.resourceViewId ?? null,
                resourceViewUuid: data.coverResource.resourceViewUuid ?? null,
                url: data.coverResource.url,
                name: data.coverResource.name,
                mimeType: data.coverResource.mimeType,
                metadata: data.coverResource.metadata,
            } : undefined,
        })]
    });
};
