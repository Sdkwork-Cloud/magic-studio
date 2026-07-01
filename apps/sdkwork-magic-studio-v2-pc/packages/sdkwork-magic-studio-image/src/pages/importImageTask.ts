import { resolveImportDataKey, type ImportData } from '@sdkwork/magic-studio-assets/generation';

import { createGeneratedImageResult, createImageTask, type ImageTask } from '../entities';

export const mapImportDataToImageTask = (data: ImportData): ImageTask => {
    const importTaskKey = resolveImportDataKey(data);

    return createImageTask({
        id: null,
        uuid: importTaskKey,
        status: 'completed',
        config: {
            prompt: data.prompt,
            aspectRatio: (data.aspectRatio as any) || '1:1',
            styleId: 'none',
            batchSize: 1,
            mediaType: (data.type === 'video' ? 'video' : 'image') as any,
            model: data.model,
            negativePrompt: data.negativePrompt
        },
        results: [createGeneratedImageResult({
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
        })],
        createdAt: data.createdAt,
        updatedAt: data.createdAt,
    });
};
