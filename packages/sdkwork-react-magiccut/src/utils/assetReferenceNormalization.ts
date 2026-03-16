import type { AnyMediaResource } from '@sdkwork/react-commons';
import type { CutProject } from '../entities';
import type { NormalizedState } from '../store/types';
import {
    buildMagicCutAssetRef,
    normalizeMagicCutAssetState,
    normalizeMagicCutResourceView
} from '../domain/assets/magicCutAssetState';

export const normalizeResourceForTimeline = (
    resource: AnyMediaResource,
    fallbackId?: string
): AnyMediaResource => {
    return normalizeMagicCutResourceView(resource, fallbackId);
};

export const normalizeStateAssetReferences = (input: NormalizedState): NormalizedState => {
    return normalizeMagicCutAssetState(input) as NormalizedState;
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
        mediaResources: Object.values(normalizedState.resources).map((resource) => buildMagicCutAssetRef(resource)),
        timelines: Object.values(normalizedState.timelines).map((timeline) => ({
            type: 'CutTimeline',
            id: timeline.id,
            uuid: timeline.uuid
        }))
    };
};
