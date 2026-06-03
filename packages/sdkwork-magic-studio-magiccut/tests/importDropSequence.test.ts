import { describe, expect, it } from 'vitest';

import { MediaResourceType } from '@sdkwork/magic-studio-commons';

import { resolveImportedDropSequence } from '../src/domain/dnd/importDropSequence';
import type { CutTrack } from '../src/entities/magicCut.entity';

const createTrack = (id: string, trackType: CutTrack['trackType'], order: number): CutTrack => ({
  id,
  uuid: `${id}-uuid`,
  type: 'CutTrack',
  trackType,
  order,
  clips: [],
  visible: true,
  locked: false,
  muted: false,
  createdAt: 0,
  updatedAt: 0,
});

const createResource = (
  id: string,
  type: MediaResourceType,
  duration?: number
) =>
  ({
    id,
    uuid: `${id}-uuid`,
    name: id,
    type,
    path: `${id}.mock`,
    url: `${id}.mock`,
    duration,
    metadata: duration ? { duration } : {},
    createdAt: 0,
    updatedAt: 0,
  }) as any;

describe('resolveImportedDropSequence', () => {
  it('uses uuid-first resource and track keys when imported entities are not persisted yet', () => {
    const plans = resolveImportedDropSequence({
      resources: [
        {
          ...createResource(null, MediaResourceType.VIDEO, 4),
          uuid: 'video-runtime-uuid',
          name: 'video-runtime',
        } as any,
      ],
      tracks: [
        {
          ...createTrack('track-runtime', 'video', 0),
          id: null,
          uuid: 'track-runtime-uuid',
        },
      ],
      baseTime: 5,
      basePlacement: {
        trackId: 'track-runtime-uuid',
        insertIndex: null,
      },
    });

    expect(plans).toEqual([
      {
        resourceId: 'video-runtime-uuid',
        start: 5,
        duration: 4,
        target: {
          kind: 'existing-track',
          groupId: 'existing:track-runtime-uuid',
          trackId: 'track-runtime-uuid',
          trackType: 'video',
        },
      },
    ]);
  });

  it('uses metadata duration when imported resources do not expose a top-level duration', () => {
    const metadataOnlyDurationResource = {
      id: 'video-meta',
      uuid: 'video-meta-uuid',
      name: 'video-meta',
      type: MediaResourceType.VIDEO,
      path: 'video-meta.mock',
      url: 'video-meta.mock',
      metadata: { duration: 12.4 },
      createdAt: 0,
      updatedAt: 0,
    } as any;

    const plans = resolveImportedDropSequence({
      resources: [metadataOnlyDurationResource],
      tracks: [createTrack('track-video', 'video', 0)],
      baseTime: 2,
      basePlacement: {
        trackId: 'track-video-uuid',
        insertIndex: null,
      },
    });

    expect(plans).toEqual([
      {
        resourceId: 'video-meta-uuid',
        start: 2,
        duration: 12.4,
        target: {
          kind: 'existing-track',
          groupId: 'existing:track-video-uuid',
          trackId: 'track-video-uuid',
          trackType: 'video',
        },
      },
    ]);
  });

  it('places compatible imported resources sequentially on the resolved existing track', () => {
    const plans = resolveImportedDropSequence({
      resources: [
        createResource('video-a', MediaResourceType.VIDEO, 4),
        createResource('image-b', MediaResourceType.IMAGE),
        createResource('video-c', MediaResourceType.VIDEO, 3),
      ],
      tracks: [createTrack('track-video', 'video', 0)],
      baseTime: 12,
      basePlacement: {
        trackId: 'track-video-uuid',
        insertIndex: null,
      },
    });

    expect(plans).toEqual([
      {
        resourceId: 'video-a-uuid',
        start: 12,
        duration: 4,
        target: { kind: 'existing-track', groupId: 'existing:track-video-uuid', trackId: 'track-video-uuid', trackType: 'video' },
      },
      {
        resourceId: 'image-b-uuid',
        start: 16,
        duration: 5,
        target: { kind: 'existing-track', groupId: 'existing:track-video-uuid', trackId: 'track-video-uuid', trackType: 'video' },
      },
      {
        resourceId: 'video-c-uuid',
        start: 21,
        duration: 3,
        target: { kind: 'existing-track', groupId: 'existing:track-video-uuid', trackId: 'track-video-uuid', trackType: 'video' },
      },
    ]);
  });

  it('creates adjacent typed track groups when imported resources require different track types', () => {
    const plans = resolveImportedDropSequence({
      resources: [
        createResource('video-a', MediaResourceType.VIDEO, 6),
        createResource('audio-b', MediaResourceType.AUDIO, 8),
        createResource('image-c', MediaResourceType.IMAGE),
        createResource('voice-d', MediaResourceType.VOICE, 4),
      ],
      tracks: [
        createTrack('track-1', 'video', 0),
        createTrack('track-2', 'audio', 1),
      ],
      baseTime: 3,
      basePlacement: {
        trackId: null,
        insertIndex: 1,
      },
    });

    expect(plans).toEqual([
      {
        resourceId: 'video-a-uuid',
        start: 3,
        duration: 6,
        target: { kind: 'new-track', groupId: 'new:video:1', trackType: 'video', insertIndex: 1 },
      },
      {
        resourceId: 'audio-b-uuid',
        start: 3,
        duration: 8,
        target: { kind: 'new-track', groupId: 'new:audio:2', trackType: 'audio', insertIndex: 2 },
      },
      {
        resourceId: 'image-c-uuid',
        start: 9,
        duration: 5,
        target: { kind: 'new-track', groupId: 'new:video:1', trackType: 'video', insertIndex: 1 },
      },
      {
        resourceId: 'voice-d-uuid',
        start: 11,
        duration: 4,
        target: { kind: 'new-track', groupId: 'new:audio:2', trackType: 'audio', insertIndex: 2 },
      },
    ]);
  });

  it('inserts incompatible follow-up resource groups after the drop target track', () => {
    const plans = resolveImportedDropSequence({
      resources: [
        createResource('audio-a', MediaResourceType.AUDIO, 5),
        createResource('text-b', MediaResourceType.TEXT),
      ],
      tracks: [
        createTrack('track-video', 'video', 0),
        createTrack('track-audio', 'audio', 1),
      ],
      baseTime: 7,
      basePlacement: {
        trackId: 'track-audio-uuid',
        insertIndex: null,
      },
    });

    expect(plans).toEqual([
      {
        resourceId: 'audio-a-uuid',
        start: 7,
        duration: 5,
        target: { kind: 'existing-track', groupId: 'existing:track-audio-uuid', trackId: 'track-audio-uuid', trackType: 'audio' },
      },
      {
        resourceId: 'text-b-uuid',
        start: 7,
        duration: 5,
        target: { kind: 'new-track', groupId: 'new:text:2', trackType: 'text', insertIndex: 2 },
      },
    ]);
  });
});
