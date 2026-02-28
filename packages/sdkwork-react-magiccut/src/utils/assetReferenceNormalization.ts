import type { AnyMediaResource } from '@sdkwork/react-commons';
import type { CutLayer, CutProject } from '../entities';
import type { NormalizedState } from '../store/types';

const isLocatorLike = (value: unknown): boolean => {
    if (typeof value !== 'string' || value.length === 0) {
        return false;
    }
    return (
        value.startsWith('http://') ||
        value.startsWith('https://') ||
        value.startsWith('assets://') ||
        value.startsWith('asset:') ||
        value.startsWith('file://') ||
        value.startsWith('blob:') ||
        value.startsWith('data:') ||
        value.startsWith('/') ||
        value.startsWith('./') ||
        value.startsWith('../') ||
        /^[a-zA-Z]:\\/.test(value)
    );
};

const pickCanonicalAssetId = (
    sourceId: string | undefined,
    metadataAssetId: unknown,
    fallbackId: string
): string => {
    if (typeof metadataAssetId === 'string' && metadataAssetId.length > 0 && !isLocatorLike(metadataAssetId)) {
        return metadataAssetId;
    }
    if (typeof sourceId === 'string' && sourceId.length > 0 && !isLocatorLike(sourceId)) {
        return sourceId;
    }
    return fallbackId;
};

export const normalizeResourceForTimeline = (
    resource: AnyMediaResource,
    fallbackId?: string
): AnyMediaResource => {
    const effectiveFallbackId = fallbackId || resource.id;
    const canonicalId = pickCanonicalAssetId(
        resource.id,
        resource.metadata?.assetId,
        effectiveFallbackId
    );
    const metadata = {
        ...(resource.metadata || {}),
        assetId: canonicalId
    };
    return {
        ...resource,
        id: canonicalId,
        uuid: resource.uuid || canonicalId,
        metadata
    };
};

const mergeResource = (current: AnyMediaResource, next: AnyMediaResource): AnyMediaResource => {
    return {
        ...current,
        ...next,
        metadata: {
            ...(current.metadata || {}),
            ...(next.metadata || {})
        },
        path: current.path || next.path,
        url: current.url || next.url,
        uuid: current.uuid || next.uuid
    };
};

const remapLayerResourceRef = (
    layer: CutLayer,
    idAlias: Map<string, string>,
    resources: Record<string, AnyMediaResource>
): CutLayer => {
    if (!layer.resource?.id) {
        return layer;
    }
    const nextId = idAlias.get(layer.resource.id) || layer.resource.id;
    const nextResource = resources[nextId];
    return {
        ...layer,
        resource: {
            ...layer.resource,
            id: nextId,
            uuid: layer.resource.uuid || nextResource?.uuid
        }
    };
};

export const normalizeStateAssetReferences = (input: NormalizedState): NormalizedState => {
    const resources = input.resources || {};
    const idAlias = new Map<string, string>();
    const normalizedResources: Record<string, AnyMediaResource> = {};

    Object.entries(resources).forEach(([resourceKey, rawResource]) => {
        const normalized = normalizeResourceForTimeline(rawResource, resourceKey);
        const canonicalId = normalized.id;

        idAlias.set(resourceKey, canonicalId);
        if (rawResource.id && rawResource.id !== canonicalId) {
            idAlias.set(rawResource.id, canonicalId);
        }

        const existing = normalizedResources[canonicalId];
        normalizedResources[canonicalId] = existing
            ? mergeResource(existing, normalized)
            : normalized;
    });

    const normalizedClips = Object.fromEntries(
        Object.entries(input.clips || {}).map(([clipId, clip]) => {
            const canonicalResourceId = idAlias.get(clip.resource.id) || clip.resource.id;
            const nextResource = normalizedResources[canonicalResourceId];
            return [
                clipId,
                {
                    ...clip,
                    resource: {
                        ...clip.resource,
                        id: canonicalResourceId,
                        uuid: clip.resource.uuid || nextResource?.uuid
                    }
                }
            ];
        })
    );

    const normalizedLayers = Object.fromEntries(
        Object.entries(input.layers || {}).map(([layerId, layer]) => {
            return [layerId, remapLayerResourceRef(layer, idAlias, normalizedResources)];
        })
    );

    return {
        ...input,
        resources: normalizedResources,
        clips: normalizedClips,
        layers: normalizedLayers
    };
};

export const normalizeProjectAssetReferences = (project: CutProject): CutProject => {
    const rawState = project.normalizedState as NormalizedState | undefined;
    if (!rawState) {
        return project;
    }

    const normalizedState = normalizeStateAssetReferences(rawState);
    return {
        ...project,
        normalizedState,
        mediaResources: Object.values(normalizedState.resources).map((resource) => ({
            type: 'MediaResource',
            id: resource.id,
            uuid: resource.uuid
        })),
        timelines: Object.values(normalizedState.timelines).map((timeline) => ({
            type: 'CutTimeline',
            id: timeline.id,
            uuid: timeline.uuid
        }))
    };
};
