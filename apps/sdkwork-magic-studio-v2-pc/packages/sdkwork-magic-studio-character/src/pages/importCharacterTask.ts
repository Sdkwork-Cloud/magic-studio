import { resolveImportDataKey, type ImportData } from '@sdkwork/magic-studio-assets/generation';
import { MediaResourceType } from '@sdkwork/magic-studio-types/vocabulary';

import {
    createCharacter,
    createCharacterAvatarInputResourceRef,
    type CharacterTask,
} from '../entities';

export const mapImportDataToCharacterTask = (data: ImportData): CharacterTask => {
    const importTaskKey = resolveImportDataKey(data);

    const importedCharacter = createCharacter({
        id: data.resource.id ?? data.resource.uuid,
        uuid: data.resource.uuid,
        createdAt: data.createdAt,
        updatedAt: data.createdAt,
        name: data.resource.name || data.title || 'Imported Character',
        description: data.prompt,
        avatarUrl: data.resource.url,
        config: {
            prompt: data.prompt,
            description: data.prompt,
            model: data.model,
            aspectRatio: data.aspectRatio,
            mediaType: 'character',
        },
        url: data.resource.url,
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
            name: data.resource.name || data.title || 'Imported Character',
            mimeType: data.resource.mimeType,
            metadata: data.resource.metadata,
            type: MediaResourceType.IMAGE,
        },
    });
    const importedAvatar = importedCharacter.resource
        ? createCharacterAvatarInputResourceRef({
            assetId: importedCharacter.resource.assetId ?? undefined,
            assetUuid: importedCharacter.resource.assetUuid ?? undefined,
            primaryResourceId: importedCharacter.resource.primaryResourceId ?? undefined,
            primaryResourceUuid: importedCharacter.resource.primaryResourceUuid ?? undefined,
            resourceViewId: importedCharacter.resource.resourceViewId ?? undefined,
            resourceViewUuid: importedCharacter.resource.resourceViewUuid ?? undefined,
            path: importedCharacter.resource.path,
            url: importedCharacter.resource.url,
            name: importedCharacter.resource.name,
            mimeType: importedCharacter.resource.mimeType,
            resource: {
                ...importedCharacter.resource,
            },
        })
        : undefined;

    return {
        id: importTaskKey,
        uuid: importTaskKey,
        createdAt: data.createdAt,
        updatedAt: data.createdAt,
        status: 'completed',
        config: {
            prompt: data.prompt,
            description: data.prompt,
            model: data.model,
            aspectRatio: data.aspectRatio || '9:16',
            mediaType: 'character',
            avatar: importedAvatar,
        },
        results: [importedCharacter],
    };
};
