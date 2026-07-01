import { describe, expect, it } from 'vitest';

import { MediaResourceType, type AnyMediaResource } from '@sdkwork/magic-studio-commons';
import type { CutClip } from '../src/entities/magicCut.entity';
import {
  createMagicCutPreviewClip,
  createMagicCutPreviewLayer,
} from '../src/domain/preview/previewIdentity';

const createVisualClip = (): CutClip => ({
  id: null,
  uuid: 'clip-uuid-1',
  type: 'CutClip',
  track: { id: null, uuid: 'track-uuid-1', type: 'CutTrack' },
  resource: { id: 'asset-1', uuid: 'resource-view-1', type: 'MediaResource' },
  start: 0,
  duration: 4,
  offset: 0,
  speed: 1,
  volume: 1,
  layers: [],
  createdAt: 0,
  updatedAt: 0,
});

describe('preview identity helpers', () => {
  it('creates preview layers with null persisted ids and uuid-first clip refs', () => {
    const targetClip = createVisualClip();
    const previewLayer = createMagicCutPreviewLayer({
      previewEffectId: 'effect-demo',
      targetClip,
      order: 0,
      now: 123,
    });

    expect(previewLayer.id).toBeNull();
    expect(previewLayer.uuid).toBe('preview-layer-effect-demo');
    expect(previewLayer.clip.id).toBeNull();
    expect(previewLayer.clip.uuid).toBe(targetClip.uuid);
    expect(previewLayer.params.definitionId).toBe('effect-demo');
  });

  it('creates preview clips with null persisted ids and stable preview uuids', () => {
    const previewClip = createMagicCutPreviewClip({
      resource: {
        id: 'asset-preview-1',
        uuid: 'resource-view-preview-1',
        type: MediaResourceType.VIDEO,
        name: 'preview.mp4',
        path: 'preview.mp4',
        createdAt: 0,
        updatedAt: 0,
      } as AnyMediaResource,
      time: 3,
      projectWidth: 1920,
      projectHeight: 1080,
    });

    expect(previewClip.id).toBeNull();
    expect(previewClip.uuid).toBe('preview-clip-resource-view-preview-1');
    expect(previewClip.resource.id).toBe('asset-preview-1');
    expect(previewClip.resource.uuid).toBe('resource-view-preview-1');
    expect(previewClip.track.id).toBeNull();
    expect(previewClip.track.uuid).toBe('preview-track');
    expect(previewClip.offset).toBe(3);
  });

  it('uses text payload metadata for subtitle preview clip content', () => {
    const previewClip = createMagicCutPreviewClip({
      resource: {
        id: 'asset-preview-subtitle-1',
        uuid: 'resource-view-subtitle-1',
        type: MediaResourceType.SUBTITLE,
        name: 'Subtitle',
        metadata: {
          text: 'Hello Preview',
        },
        createdAt: 0,
        updatedAt: 0,
      } as AnyMediaResource,
      time: 0,
      projectWidth: 1080,
      projectHeight: 1920,
    });

    expect(previewClip.content).toBe('Hello Preview');
  });
});
