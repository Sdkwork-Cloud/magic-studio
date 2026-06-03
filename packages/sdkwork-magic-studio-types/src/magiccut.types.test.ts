import { describe, expect, it } from 'vitest';

import {
  CutEditorActionType,
  createAudioEffectConfig,
  createCutClip,
  createCutClipRef,
  createCutEditorAction,
  createCutLayer,
  createCutMediaResourceRef,
  createCutProject,
  createCutTimeline,
  createCutTimelineRef,
  createCutTrack,
  createCutTrackRef,
  createKeyframePoint,
  createTimelineMarker,
  findMagicCutEntityByRef,
} from './magiccut.types';

describe('magiccut identity helpers', () => {
  it('creates timeline markers with nullable persisted ids and stable uuids', () => {
    const marker = createTimelineMarker({
      time: 1.25,
      label: 'Beat',
      color: '#f59e0b',
    });

    expect(marker).toMatchObject({
      id: null,
      time: 1.25,
      label: 'Beat',
      color: '#f59e0b',
    });
    expect(marker.uuid).toEqual(expect.any(String));
  });

  it('creates audio effect configs with nullable persisted ids and stable uuids', () => {
    const effect = createAudioEffectConfig({
      type: 'eq',
      enabled: true,
      params: {
        enabled: true,
        bypass: false,
        lowGain: 1,
      },
    });

    expect(effect).toMatchObject({
      id: null,
      type: 'eq',
      enabled: true,
      params: {
        enabled: true,
        bypass: false,
        lowGain: 1,
      },
    });
    expect(effect.uuid).toEqual(expect.any(String));
  });

  it('creates keyframes and editor actions with nullable persisted ids and stable uuids', () => {
    const keyframe = createKeyframePoint({
      time: 0.5,
      value: 42,
      easing: 'easeInOut',
    });
    const action = createCutEditorAction({
      type: CutEditorActionType.UPDATE_CLIP_PROPS,
      payload: { clipUuid: 'clip-1' },
      timestamp: '2026-04-03T12:00:00.000Z',
    });

    expect(keyframe).toMatchObject({
      id: null,
      time: 0.5,
      value: 42,
      easing: 'easeInOut',
    });
    expect(keyframe.uuid).toEqual(expect.any(String));
    expect(action).toMatchObject({
      id: null,
      type: CutEditorActionType.UPDATE_CLIP_PROPS,
      payload: { clipUuid: 'clip-1' },
      timestamp: '2026-04-03T12:00:00.000Z',
    });
    expect(action.uuid).toEqual(expect.any(String));
  });

  it('finds magiccut entities by uuid-first refs and falls back to id', () => {
    const records = {
      'track-uuid-1': {
        id: 'track-db-1',
        uuid: 'track-uuid-1',
        type: 'CutTrack',
      },
    };

    expect(
      findMagicCutEntityByRef(records, {
        id: 'track-db-1',
        uuid: 'track-uuid-1',
      })
    ).toEqual(records['track-uuid-1']);
    expect(
      findMagicCutEntityByRef(records, {
        id: 'track-db-1',
      })
    ).toEqual(records['track-uuid-1']);
  });

  it('creates core magiccut entities with nullable persisted ids and stable ref uuids', () => {
    const track = createCutTrack({
      trackType: 'video',
      order: 0,
      clips: [],
      visible: true,
      locked: false,
      muted: false,
    });
    const resourceRef = createCutMediaResourceRef({
      uuid: 'resource-view-uuid',
      assetId: 'asset-1',
      resourceViewId: 'resource-view-uuid',
    });
    const clip = createCutClip({
      track: createCutTrackRef(track),
      resource: resourceRef,
      start: 0,
      duration: 3,
      layers: [],
    });
    const layer = createCutLayer({
      clip: createCutClipRef(clip),
      layerType: 'filter',
      enabled: true,
      order: 0,
      params: {},
    });
    const timeline = createCutTimeline({
      name: 'Sequence 1',
      fps: 30,
      duration: 10,
      tracks: [createCutTrackRef(track)],
    });
    const project = createCutProject({
      name: 'Project 1',
      version: 1,
      timelines: [createCutTimelineRef(timeline)],
      mediaResources: [resourceRef],
      settings: {
        resolution: '1920x1080',
        fps: 30,
        aspectRatio: '16:9',
      },
    });

    expect(project.id).toBeNull();
    expect(track.id).toBeNull();
    expect(clip.id).toBeNull();
    expect(layer.id).toBeNull();
    expect(timeline.id).toBeNull();
    expect(project.timelines[0]).toMatchObject({ id: null, uuid: timeline.uuid });
    expect(clip.track).toMatchObject({ id: null, uuid: track.uuid });
    expect(clip.resource).toMatchObject({ id: null, uuid: 'resource-view-uuid' });
    expect(layer.clip).toMatchObject({ id: null, uuid: clip.uuid });
    expect(layer.uuid).toEqual(expect.any(String));
  });
});
