import {
  createCutTimelineRef,
  type CutClip,
  type CutProject,
  type CutTimeline,
  type CutTrack,
} from '@sdkwork/magic-studio-types/magiccut';
import { resolveEntityKey } from '@sdkwork/magic-studio-types/entity';
import type { AnyMediaResource } from '@sdkwork/magic-studio-types/media';
import type {
  ProjectGraphClip,
  ProjectGraphDocument,
  ProjectGraphEntityType,
  ProjectGraphSequence,
  ProjectGraphSurface,
  ProjectGraphSurfaceBinding,
  ProjectGraphTimeline,
  ProjectGraphTrack,
} from '@sdkwork/magic-studio-types/project-graph';

import {
  buildMagicCutAssetRef,
  buildMagicCutProjectGraphSource,
} from '../domain/assets/magicCutAssetState';
import { findMagicCutClipByRef, findMagicCutResourceByRef, findMagicCutTimelineByKey, findMagicCutTrackByRef } from './stateIdentity';
import type { NormalizedState } from './types';

const normalizeText = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const createGraphIdentity = (uuid: string, timestamp: string | number) => ({
  id: null,
  uuid,
  createdAt: timestamp,
  updatedAt: timestamp,
});

const createSurfaceBindingUuid = (
  surface: ProjectGraphSurface,
  surfaceEntityUuid: string,
  graphEntityUuid: string
): string => `${surface}:${surfaceEntityUuid}:${graphEntityUuid}`;

const createSurfaceBinding = (
  timestamp: string | number,
  surface: ProjectGraphSurface,
  surfaceEntityId: string | null,
  surfaceEntityUuid: string,
  graphEntityType: ProjectGraphEntityType,
  graphEntityUuid: string
): ProjectGraphSurfaceBinding => ({
  ...createGraphIdentity(
    createSurfaceBindingUuid(surface, surfaceEntityUuid, graphEntityUuid),
    timestamp
  ),
  surface,
  surfaceEntityId,
  surfaceEntityUuid,
  graphEntityType,
  graphEntityId: null,
  graphEntityUuid,
});

const resolveOrderedTimelines = (
  project: CutProject,
  state: Pick<NormalizedState, 'timelines'>
): CutTimeline[] => {
  const ordered: CutTimeline[] = [];
  const seen = new Set<string>();

  for (const timelineRef of project.timelines || []) {
    const timeline = findMagicCutTimelineByKey(state, resolveEntityKey(timelineRef));
    if (!timeline) {
      continue;
    }

    const timelineKey = resolveEntityKey(timeline);
    if (seen.has(timelineKey)) {
      continue;
    }

    ordered.push(timeline);
    seen.add(timelineKey);
  }

  for (const timeline of Object.values(state.timelines || {})) {
    const timelineKey = resolveEntityKey(timeline);
    if (seen.has(timelineKey)) {
      continue;
    }

    ordered.push(timeline);
    seen.add(timelineKey);
  }

  return ordered;
};

const resolveOrderedTracks = (
  state: Pick<NormalizedState, 'tracks'>,
  timeline: CutTimeline
): CutTrack[] => {
  const ordered: CutTrack[] = [];
  const seen = new Set<string>();

  for (const trackRef of timeline.tracks || []) {
    const track = findMagicCutTrackByRef(state, trackRef);
    if (!track) {
      continue;
    }

    const trackKey = resolveEntityKey(track);
    if (seen.has(trackKey)) {
      continue;
    }

    ordered.push(track);
    seen.add(trackKey);
  }

  return ordered;
};

const resolveOrderedClips = (
  state: Pick<NormalizedState, 'clips'>,
  track: CutTrack
): CutClip[] => {
  const ordered: CutClip[] = [];
  const seen = new Set<string>();

  for (const clipRef of track.clips || []) {
    const clip = findMagicCutClipByRef(state, clipRef);
    if (!clip) {
      continue;
    }

    const clipKey = resolveEntityKey(clip);
    if (seen.has(clipKey)) {
      continue;
    }

    ordered.push(clip);
    seen.add(clipKey);
  }

  return ordered;
};

const resolveClipSource = (
  state: Pick<NormalizedState, 'resources'>,
  clip: CutClip
): ProjectGraphClip['source'] => {
  const resource = findMagicCutResourceByRef(state, clip.resource);
  if (!resource) {
    return null;
  }

  return buildMagicCutProjectGraphSource(
    resource as Pick<
      AnyMediaResource,
      | 'id'
      | 'assetId'
      | 'primaryResourceId'
      | 'resourceViewId'
      | 'metadata'
      | 'sourceRecipeId'
      | 'sourceRecipeUuid'
      | 'sourceExecutionId'
      | 'sourceExecutionUuid'
      | 'sourceArtifactId'
      | 'sourceArtifactUuid'
    >
  );
};

export const buildMagicCutProjectGraph = (
  project: CutProject,
  state: Pick<NormalizedState, 'timelines' | 'tracks' | 'clips' | 'resources'>
): ProjectGraphDocument => {
  const timestamp = project.updatedAt ?? project.createdAt ?? Date.now();
  const sequences: Record<string, ProjectGraphSequence> = {};
  const timelines: Record<string, ProjectGraphTimeline> = {};
  const tracks: Record<string, ProjectGraphTrack> = {};
  const clips: Record<string, ProjectGraphClip> = {};
  const surfaceBindings: ProjectGraphSurfaceBinding[] = [
    createSurfaceBinding(
      timestamp,
      'magiccut-project',
      project.id,
      project.uuid,
      'project',
      project.uuid
    ),
  ];

  const orderedTimelines = resolveOrderedTimelines(project, state);

  orderedTimelines.forEach((timeline, timelineOrder) => {
    const sequenceUuid = `${project.uuid}:sequence:${timeline.uuid}`;
    const orderedTracks = resolveOrderedTracks(state, timeline);

    sequences[sequenceUuid] = {
      ...createGraphIdentity(sequenceUuid, timeline.updatedAt ?? timeline.createdAt ?? timestamp),
      projectUuid: project.uuid,
      name: normalizeText(timeline.name) || `Timeline ${timelineOrder + 1}`,
      order: timelineOrder,
      timelineUuid: timeline.uuid,
      sceneUuids: [],
      shotUuids: [],
      metadata: {
        sourceSurface: 'magiccut',
        sourceTimelineId: timeline.id,
      },
    };

    timelines[timeline.uuid] = {
      ...createGraphIdentity(timeline.uuid, timeline.updatedAt ?? timeline.createdAt ?? timestamp),
      projectUuid: project.uuid,
      sequenceUuid,
      name: normalizeText(timeline.name) || `Timeline ${timelineOrder + 1}`,
      fps: timeline.fps,
      duration: timeline.duration,
      trackUuids: orderedTracks.map((track) => track.uuid),
      metadata: {
        sourceSurface: 'magiccut',
        sourceTimelineId: timeline.id,
      },
    };

    surfaceBindings.push(
      createSurfaceBinding(
        timestamp,
        'magiccut-timeline',
        timeline.id,
        timeline.uuid,
        'timeline',
        timeline.uuid
      )
    );

    orderedTracks.forEach((track, trackOrder) => {
      const orderedClips = resolveOrderedClips(state, track);

      tracks[track.uuid] = {
        ...createGraphIdentity(track.uuid, track.updatedAt ?? track.createdAt ?? timestamp),
        projectUuid: project.uuid,
        timelineUuid: timeline.uuid,
        order: typeof track.order === 'number' ? track.order : trackOrder,
        trackType: track.trackType,
        name: normalizeText(track.name),
        clipUuids: orderedClips.map((clip) => clip.uuid),
        metadata: {
          sourceSurface: 'magiccut',
          sourceTrackId: track.id,
          isMain: track.isMain,
          muted: track.muted,
          locked: track.locked,
          visible: track.visible,
        },
      };

      surfaceBindings.push(
        createSurfaceBinding(
          timestamp,
          'magiccut-track',
          track.id,
          track.uuid,
          'track',
          track.uuid
        )
      );

      orderedClips.forEach((clip) => {
        const source = resolveClipSource(state, clip);
        const resource = findMagicCutResourceByRef(state, clip.resource);

        clips[clip.uuid] = {
          ...createGraphIdentity(clip.uuid, clip.updatedAt ?? clip.createdAt ?? timestamp),
          projectUuid: project.uuid,
          timelineUuid: timeline.uuid,
          trackUuid: track.uuid,
          sequenceUuid,
          start: clip.start,
          duration: clip.duration,
          offset: clip.offset,
          speed: clip.speed,
          clipType: normalizeText(track.trackType) || normalizeText(resource?.type),
          source,
          metadata: {
            sourceSurface: 'magiccut',
            sourceClipId: clip.id,
            linkedClipId: clip.linkedClipId,
            linkGroupId: clip.linkGroupId,
            layerCount: clip.layers?.length || 0,
            hasTextContent: Boolean(normalizeText(clip.content)),
            primaryType: clip.resource.primaryType,
          },
        };

        surfaceBindings.push(
          createSurfaceBinding(
            timestamp,
            'magiccut-clip',
            clip.id,
            clip.uuid,
            'clip',
            clip.uuid
          )
        );
      });
    });
  });

  return {
    version: 1,
    project: {
      ...createGraphIdentity(project.uuid, timestamp),
      domain: 'magiccut',
      name: project.name,
      description: project.description,
      workspaceUuid: null,
      sequenceUuids: Object.keys(sequences),
      timelineUuids: Object.keys(timelines),
      publishTargetUuids: [],
      metadata: {
        sourceSurface: 'magiccut',
        version: project.version,
        settings: project.settings,
      },
    },
    sequences,
    scenes: {},
    shots: {},
    timelines,
    tracks,
    clips,
    publishTargets: {},
    surfaceBindings,
    metadata: {
      sourceSurface: 'magiccut',
      timelineCount: Object.keys(timelines).length,
      trackCount: Object.keys(tracks).length,
      clipCount: Object.keys(clips).length,
    },
  };
};

export const buildMagicCutPersistedProject = (
  project: CutProject,
  normalizedState: NormalizedState
): CutProject => {
  const projectGraph = buildMagicCutProjectGraph(project, normalizedState);
  const orderedTimelines = resolveOrderedTimelines(project, normalizedState);
  const resources = Object.values(normalizedState.resources || {});

  return {
    ...project,
    timelines: orderedTimelines.map((timeline) => createCutTimelineRef(timeline)),
    mediaResources: resources.map((resource) => buildMagicCutAssetRef(resource)),
    normalizedState: {
      ...normalizedState,
      projectGraph,
    },
    projectGraph,
  };
};
