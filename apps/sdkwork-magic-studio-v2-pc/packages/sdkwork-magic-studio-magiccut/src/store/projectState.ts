import type { CutProject } from '@sdkwork/magic-studio-types/magiccut';

import {
    createEmptyMagicCutAssetState,
    normalizeMagicCutAssetState
} from '../domain/assets/magicCutAssetState';
import { buildMagicCutProjectGraph } from './projectGraph';
import type { NormalizedState } from './types';

export const normalizeMagicCutProjectState = (project: CutProject): NormalizedState => {
    const rawState = project.normalizedState as Partial<NormalizedState> | undefined;
    const normalized = rawState
        ? normalizeMagicCutAssetState(rawState)
        : normalizeMagicCutAssetState({
            ...createEmptyMagicCutAssetState(),
            projectGraph: project.projectGraph
        });

    const projectGraph =
        normalized.projectGraph ||
        project.projectGraph ||
        buildMagicCutProjectGraph(project, normalized as NormalizedState);

    return {
        ...normalized,
        projectGraph
    } as NormalizedState;
};
