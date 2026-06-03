import { describe, expect, it } from 'vitest';

import { createDefaultMagicCutProject } from '../src/store/defaultProject';
import type { NormalizedState } from '../src/store/types';

describe('createDefaultMagicCutProject', () => {
  it('builds a default project whose local entities use nullable persisted ids and stable local uuids', () => {
    const project = createDefaultMagicCutProject();
    const state = project.normalizedState as NormalizedState;

    expect(project.id).toBeNull();
    expect(project.timelines).toHaveLength(1);

    const timelineRef = project.timelines[0];
    expect(timelineRef.id).toBeNull();
    const timeline = state.timelines[timelineRef.uuid];

    expect(timeline).toBeDefined();
    expect(timeline.id).toBeNull();
    expect(timeline.tracks).toHaveLength(1);

    const trackRef = timeline.tracks[0];
    expect(trackRef.id).toBeNull();
    const track = state.tracks[trackRef.uuid];

    expect(track).toBeDefined();
    expect(track.id).toBeNull();
    expect(track.clips).toEqual([]);
  });

  it('attaches a canonical projectGraph to the default project snapshot', () => {
    const project = createDefaultMagicCutProject();

    expect(project.projectGraph).toBeTruthy();
    expect(project.projectGraph?.project).toMatchObject({
      uuid: project.uuid,
      domain: 'magiccut',
      name: project.name,
    });
    expect(Object.values(project.projectGraph?.timelines || {})).toHaveLength(1);
  });
});
