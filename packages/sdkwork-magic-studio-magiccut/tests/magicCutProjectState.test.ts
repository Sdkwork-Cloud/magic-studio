import { describe, expect, it } from 'vitest';

import type { CutProject, ProjectGraphDocument } from '@sdkwork/magic-studio-types';

import { normalizeMagicCutProjectState } from '../src/store/projectState';

const createProjectGraph = (): ProjectGraphDocument => ({
  version: 1,
  project: {
    id: null,
    uuid: 'project-graph-uuid',
    domain: 'magiccut',
    name: 'Trailer Cut',
    sequenceUuids: [],
    timelineUuids: [],
    publishTargetUuids: [],
    createdAt: 1,
    updatedAt: 1,
  },
  sequences: {},
  scenes: {},
  shots: {},
  timelines: {},
  tracks: {},
  clips: {},
  publishTargets: {},
  surfaceBindings: [],
});

describe('normalizeMagicCutProjectState', () => {
  it('preserves the top-level projectGraph inside normalized runtime state', () => {
    const projectGraph = createProjectGraph();
    const state = normalizeMagicCutProjectState({
      id: 'cut-project-1',
      uuid: 'cut-project-1',
      type: 'CUT_PROJECT',
      name: 'Trailer Cut',
      version: 1,
      timelines: [],
      mediaResources: [],
      settings: {
        resolution: '1920x1080',
        fps: 30,
        aspectRatio: '16:9',
      },
      projectGraph,
      createdAt: 1,
      updatedAt: 1,
    } satisfies CutProject);

    expect(state.projectGraph).toEqual(projectGraph);
  });
});
