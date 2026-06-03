import { describe, expect, it } from 'vitest';

import { MediaResourceType } from '@sdkwork/magic-studio-commons';
import {
  createCutClip,
  createCutClipRef,
  createCutMediaResourceRef,
  createCutProject,
  createCutTimeline,
  createCutTimelineRef,
  createCutTrack,
  createCutTrackRef,
} from '@sdkwork/magic-studio-types';

import type { NormalizedState } from '../src/store/types';
import { buildMagicCutPersistedProject } from '../src/store/projectGraph';
import { normalizeMagicCutProjectState } from '../src/store/projectState';

const createGraphFixture = () => {
  const timestamp = 1;
  const track = createCutTrack({
    id: null,
    uuid: 'track-1',
    trackType: 'video',
    order: 0,
    name: 'Main Track',
    clips: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  const timeline = createCutTimeline({
    id: null,
    uuid: 'timeline-1',
    name: 'Main Timeline',
    fps: 30,
    duration: 12,
    tracks: [createCutTrackRef(track)],
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  const clip = createCutClip({
    id: null,
    uuid: 'clip-1',
    track: createCutTrackRef(track),
    resource: createCutMediaResourceRef({
      id: 'asset-1',
      uuid: 'resource-view-uuid-1',
      assetId: 'asset-1',
      resourceViewId: 'resource-view-1',
      primaryResourceId: 'primary-resource-1',
      primaryType: 'video',
      storageMode: 'hybrid',
      scopeDomain: 'magiccut',
    }),
    start: 2,
    duration: 5,
    layers: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  track.clips = [createCutClipRef(clip)];

  const resource = {
    id: 'asset-1',
    uuid: 'resource-view-uuid-1',
    assetId: 'asset-1',
    resourceViewId: 'resource-view-1',
    primaryResourceId: 'primary-resource-1',
    type: MediaResourceType.VIDEO,
    name: 'shot-1.mp4',
    url: 'https://cdn.example.com/shot-1.mp4',
    path: 'assets://workspace-1/shot-1.mp4',
    metadata: {
      assetId: 'asset-1',
      resourceViewId: 'resource-view-1',
      primaryResourceId: 'primary-resource-1',
      primaryType: 'video',
      storageMode: 'hybrid',
      scopeDomain: 'magiccut',
      sourceRecipeUuid: 'recipe-1',
      sourceExecutionUuid: 'execution-1',
      sourceArtifactUuid: 'artifact-1',
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const normalizedState: NormalizedState = {
    assets: {},
    resourceViews: {
      'asset-1': resource,
    },
    resources: {
      'asset-1': resource,
    },
    timelines: {
      [timeline.uuid]: timeline,
    },
    tracks: {
      [track.uuid]: track,
    },
    clips: {
      [clip.uuid]: clip,
    },
    layers: {},
  };

  const project = createCutProject({
    id: null,
    uuid: 'project-1',
    name: 'Trailer Cut',
    version: 1,
    timelines: [createCutTimelineRef(timeline)],
    mediaResources: [createCutMediaResourceRef(resource)],
    settings: {
      resolution: '1920x1080',
      fps: 30,
      aspectRatio: '16:9',
    },
    normalizedState,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  return {
    project,
    normalizedState,
  };
};

describe('magicCut project graph contract', () => {
  it('builds a persisted magiccut project with a canonical projectGraph snapshot', () => {
    const { project, normalizedState } = createGraphFixture();

    const persisted = buildMagicCutPersistedProject(project, normalizedState);
    const timelines = Object.values(persisted.projectGraph?.timelines || {});
    const tracks = Object.values(persisted.projectGraph?.tracks || {});
    const clips = Object.values(persisted.projectGraph?.clips || {});

    expect(persisted.projectGraph).toBeTruthy();
    expect(persisted.projectGraph?.project).toMatchObject({
      uuid: 'project-1',
      domain: 'magiccut',
      name: 'Trailer Cut',
    });
    expect(timelines).toHaveLength(1);
    expect(tracks).toHaveLength(1);
    expect(clips).toHaveLength(1);
    expect(clips[0]).toMatchObject({
      timelineUuid: 'timeline-1',
      trackUuid: 'track-1',
      start: 2,
      duration: 5,
      source: {
        assetId: 'asset-1',
        primaryResourceId: 'primary-resource-1',
        resourceViewId: 'resource-view-1',
        primaryType: 'video',
        storageMode: 'hybrid',
        scopeDomain: 'magiccut',
        sourceRecipeUuid: 'recipe-1',
        sourceExecutionUuid: 'execution-1',
        sourceArtifactUuid: 'artifact-1',
      },
    });
    expect(persisted.normalizedState).toMatchObject({
      projectGraph: persisted.projectGraph,
    });
  });

  it('rebuilds a projectGraph from normalized runtime state when a persisted project is missing it', () => {
    const { project } = createGraphFixture();

    const normalized = normalizeMagicCutProjectState({
      ...project,
      projectGraph: undefined,
    });

    expect(normalized.projectGraph).toBeTruthy();
    expect(normalized.projectGraph?.project.domain).toBe('magiccut');
    expect(Object.values(normalized.projectGraph?.timelines || {})).toHaveLength(1);
  });
});
