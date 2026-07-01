import { generateUUID } from '@sdkwork/magic-studio-commons/utils/helpers';
import { resolveEntityKey } from '@sdkwork/magic-studio-types/entity';

export type ImportDataType = 'image' | 'video' | 'music' | 'audio' | 'character';

export type ImportDataResourceType = 'image' | 'video' | 'audio' | 'music';

export interface ImportDataResource {
    id: string | null;
    uuid: string;
    assetId?: string | null;
    assetUuid?: string | null;
    primaryResourceId?: string | null;
    primaryResourceUuid?: string | null;
    resourceViewId?: string | null;
    resourceViewUuid?: string | null;
    type: ImportDataResourceType;
    url: string;
    name?: string;
    mimeType?: string;
    metadata?: Record<string, unknown>;
}

export interface ImportData {
    id: string | null;
    uuid: string;
    resource: ImportDataResource;
    coverResource?: ImportDataResource;
    type: ImportDataType;
    createdAt: number;
    
    // Common Metadata
    prompt: string;
    model: string;

    // Image Specific
    aspectRatio?: string;
    negativePrompt?: string;
    style?: string;

    // Video Specific
    duration?: number; // seconds
    resolution?: string;
    fps?: number;

    // Music Specific
    title?: string;
    lyrics?: string;
    isInstrumental?: boolean;
}

export interface ImportDataResourceDraft extends Partial<ImportDataResource> {
    type: ImportDataResourceType;
    url: string;
}

export interface ImportUploadSelection {
    url: string;
    name?: string;
    path?: string;
    mimeType?: string;
}

type ImportDataDraft = Omit<ImportData, 'id' | 'uuid' | 'resource' | 'coverResource'> & {
    id?: string | null;
    uuid?: string;
    resource: Partial<ImportDataResource>;
    coverResource?: Partial<ImportDataResource>;
};

const normalizeIdentityValue = (value?: string | null): string | null => {
    if (typeof value !== 'string') {
        return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
};

const normalizeImportResourceType = (type: ImportDataType): ImportDataResourceType => {
    switch (type) {
        case 'video':
            return 'video';
        case 'music':
            return 'music';
        case 'audio':
            return 'audio';
        case 'character':
            return 'image';
        case 'image':
        default:
            return 'image';
    }
};

const normalizeImportResource = (
    resource: Partial<ImportDataResource> | undefined,
    fallback: {
        type: ImportDataResourceType;
        name: string;
    }
): ImportDataResource => {
    const resolvedUrl = normalizeIdentityValue(resource?.url);
    if (!resolvedUrl) {
        throw new Error('Import resource url is required');
    }

    const resourceUuid = normalizeIdentityValue(resource?.uuid) || generateUUID();
    return {
        id: normalizeIdentityValue(resource?.id) || null,
        uuid: resourceUuid,
        assetId: normalizeIdentityValue(resource?.assetId) || null,
        assetUuid: normalizeIdentityValue(resource?.assetUuid) || undefined,
        primaryResourceId: normalizeIdentityValue(resource?.primaryResourceId) || null,
        primaryResourceUuid: normalizeIdentityValue(resource?.primaryResourceUuid) || undefined,
        resourceViewId: normalizeIdentityValue(resource?.resourceViewId) || null,
        resourceViewUuid: normalizeIdentityValue(resource?.resourceViewUuid) || undefined,
        type: resource?.type || fallback.type,
        url: resolvedUrl,
        name: resource?.name || fallback.name,
        mimeType: normalizeIdentityValue(resource?.mimeType) || undefined,
        metadata: resource?.metadata ? { ...resource.metadata } : undefined,
    };
};

export const createImportDataResource = (
    input: ImportDataResourceDraft
): ImportDataResource => normalizeImportResource(input, {
    type: input.type,
    name: input.name || `${input.type}-${generateUUID()}`,
});

export const createImportDataResourceFromUpload = (
    file: ImportUploadSelection,
    type: ImportDataResourceType,
    overrides: Partial<ImportDataResource> = {}
): ImportDataResource => {
    const metadata: Record<string, unknown> = {
        ...(file.path ? { sourcePath: file.path } : {}),
        ...(overrides.metadata || {}),
    };

    return createImportDataResource({
        ...overrides,
        type,
        url: file.url,
        name: overrides.name || file.name,
        mimeType: overrides.mimeType || file.mimeType,
        ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
    });
};

export const createImportData = (input: ImportDataDraft): ImportData => {
    const importUuid = normalizeIdentityValue(input.uuid) || generateUUID();
    const resource = normalizeImportResource(input.resource, {
        type: normalizeImportResourceType(input.type),
        name: input.title || `${input.type}-${importUuid}`,
    });
    const coverResource = input.coverResource
        ? normalizeImportResource(input.coverResource, {
            type: 'image',
            name: `${input.type}-cover-${importUuid}`,
        })
        : undefined;

    return {
        id: normalizeIdentityValue(input.id) || null,
        uuid: importUuid,
        resource,
        ...(coverResource ? { coverResource } : {}),
        type: input.type,
        createdAt: input.createdAt,
        prompt: input.prompt,
        model: input.model,
        aspectRatio: input.aspectRatio,
        negativePrompt: input.negativePrompt,
        style: input.style,
        duration: input.duration,
        resolution: input.resolution,
        fps: input.fps,
        title: input.title,
        lyrics: input.lyrics,
        isInstrumental: input.isInstrumental,
    };
};

export const resolveImportDataKey = (data: Pick<ImportData, 'id' | 'uuid'>): string => resolveEntityKey(data);
