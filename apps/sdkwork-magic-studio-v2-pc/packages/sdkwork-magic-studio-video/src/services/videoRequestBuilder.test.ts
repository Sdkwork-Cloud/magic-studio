import { describe, expect, it } from 'vitest';

import {
  createVideoInputResourceRef,
  type VideoConfig,
} from '../entities';
import { buildUnifiedVideoGenerationRequest } from './videoRequestBuilder';

const createBaseConfig = (
  overrides: Partial<VideoConfig> = {}
): VideoConfig => ({
  mode: 'smart_reference',
  prompt: 'cinematic city fly-through',
  negativePrompt: '',
  model: 'kling-v2',
  styleId: 'none',
  aspectRatio: '16:9',
  resolution: '1080p',
  duration: '5s',
  fps: 30,
  ...overrides,
});

const createImageRef = (suffix: string) =>
  createVideoInputResourceRef({
    type: 'image',
    assetId: `image-asset-${suffix}`,
    assetUuid: `image-asset-uuid-${suffix}`,
    primaryResourceId: `image-resource-${suffix}`,
    primaryResourceUuid: `image-resource-uuid-${suffix}`,
    resourceViewId: `image-view-${suffix}`,
    resourceViewUuid: `image-view-uuid-${suffix}`,
    url: `https://example.com/image-${suffix}.png`,
    name: `Image ${suffix}`,
  });

const createVideoRef = (suffix: string) =>
  createVideoInputResourceRef({
    type: 'video',
    assetId: `video-asset-${suffix}`,
    assetUuid: `video-asset-uuid-${suffix}`,
    primaryResourceId: `video-resource-${suffix}`,
    primaryResourceUuid: `video-resource-uuid-${suffix}`,
    resourceViewId: `video-view-${suffix}`,
    resourceViewUuid: `video-view-uuid-${suffix}`,
    url: `https://example.com/video-${suffix}.mp4`,
    name: `Video ${suffix}`,
  });

const createAudioRef = (suffix: string) =>
  createVideoInputResourceRef({
    type: 'audio',
    assetId: `audio-asset-${suffix}`,
    assetUuid: `audio-asset-uuid-${suffix}`,
    primaryResourceId: `audio-resource-${suffix}`,
    primaryResourceUuid: `audio-resource-uuid-${suffix}`,
    resourceViewId: `audio-view-${suffix}`,
    resourceViewUuid: `audio-view-uuid-${suffix}`,
    url: `https://example.com/audio-${suffix}.wav`,
    name: `Audio ${suffix}`,
  });

describe('buildUnifiedVideoGenerationRequest', () => {
  it('builds smart reference requests from canonical image refs instead of raw urls', () => {
    const image = createImageRef('smart-reference');

    const request = buildUnifiedVideoGenerationRequest(
      createBaseConfig({
        mode: 'smart_reference',
        image,
      })
    );

    expect(request.assets).toEqual([
      expect.objectContaining({
        role: 'reference_1',
        type: 'image',
        value: 'image-view-uuid-smart-reference',
        assetId: 'image-asset-smart-reference',
        resourceViewId: 'image-view-smart-reference',
        resourceViewUuid: 'image-view-uuid-smart-reference',
        ref: expect.objectContaining({
          uuid: 'image-view-uuid-smart-reference',
          role: 'reference',
        }),
      }),
    ]);

    const providerPayloads = request.options?.providerPayloads as Record<
      string,
      Record<string, any>
    >;

    expect(providerPayloads.aliyun.input.img_url).toBe(
      'https://example.com/image-smart-reference.png'
    );
    expect(providerPayloads.kling.input.image_url).toBe(
      'https://example.com/image-smart-reference.png'
    );
    expect(providerPayloads.aliyun.operation).toBe('image-to-video');
    expect(providerPayloads.volcengine.operation).toBe('generation-task-create');
    expect(providerPayloads.kling.operation).toBe('videos:image-to-video');
    expect(providerPayloads.aliyun.endpoint).toBeUndefined();
    expect(providerPayloads.volcengine.endpoint).toBeUndefined();
    expect(providerPayloads.kling.endpoint).toBeUndefined();
  });

  it('builds smart multi payloads from canonical image and video refs', () => {
    const firstFrame = createImageRef('frame-1');
    const secondFrame = createImageRef('frame-2');
    const referenceVideo = createVideoRef('ref-video-1');

    const request = buildUnifiedVideoGenerationRequest(
      createBaseConfig({
        mode: 'smart_multi',
        referenceImages: [firstFrame, secondFrame],
        referenceVideos: [referenceVideo],
      })
    );

    const providerPayloads = request.options?.providerPayloads as Record<
      string,
      Record<string, any>
    >;

    expect(request.assets).toEqual([
      expect.objectContaining({
        role: 'keyframe_1',
        value: 'image-view-uuid-frame-1',
      }),
      expect.objectContaining({
        role: 'keyframe_2',
        value: 'image-view-uuid-frame-2',
      }),
      expect.objectContaining({
        role: 'reference_video_1',
        type: 'video',
        value: 'video-view-uuid-ref-video-1',
      }),
    ]);
    expect(providerPayloads.aliyun.input.reference_urls).toEqual([
      'https://example.com/image-frame-1.png',
      'https://example.com/image-frame-2.png',
      'https://example.com/video-ref-video-1.mp4',
    ]);
  });

  it('builds lip-sync image-source payloads from canonical refs', () => {
    const targetImage = createImageRef('lip-image');
    const driverAudio = createAudioRef('lip-audio');
    const audioTrack = createAudioRef('soundtrack');

    const request = buildUnifiedVideoGenerationRequest(
      createBaseConfig({
        mode: 'lip-sync',
        lipSyncSourceType: 'image',
        lipSyncDriverType: 'audio',
        targetImage,
        driverAudio,
        audioTrack,
      })
    );

    const providerPayloads = request.options?.providerPayloads as Record<
      string,
      Record<string, any>
    >;

    expect(request.assets).toEqual([
      expect.objectContaining({
        role: 'source_image',
        type: 'image',
        value: 'image-view-uuid-lip-image',
      }),
      expect.objectContaining({
        role: 'driver_audio',
        type: 'audio',
        value: 'audio-view-uuid-lip-audio',
      }),
      expect.objectContaining({
        role: 'audio_track',
        type: 'audio',
        value: 'audio-view-uuid-soundtrack',
      }),
    ]);
    expect(providerPayloads.aliyun.input.image_url).toBe(
      'https://example.com/image-lip-image.png'
    );
    expect(providerPayloads.aliyun.input.audio_url).toBe(
      'https://example.com/audio-lip-audio.wav'
    );
    expect(providerPayloads.aliyun.parameters.audio_url).toBe(
      'https://example.com/audio-soundtrack.wav'
    );
  });

  it('builds lip-sync video-source payloads from canonical refs', () => {
    const targetVideo = createVideoRef('lip-video');
    const driverAudio = createAudioRef('driver-video-mode');

    const request = buildUnifiedVideoGenerationRequest(
      createBaseConfig({
        mode: 'lip-sync',
        lipSyncSourceType: 'video',
        lipSyncDriverType: 'audio',
        targetVideo,
        driverAudio,
      })
    );

    const providerPayloads = request.options?.providerPayloads as Record<
      string,
      Record<string, any>
    >;

    expect(request.assets).toEqual([
      expect.objectContaining({
        role: 'source_video',
        type: 'video',
        value: 'video-view-uuid-lip-video',
      }),
      expect.objectContaining({
        role: 'driver_audio',
        type: 'audio',
        value: 'audio-view-uuid-driver-video-mode',
      }),
    ]);
    expect(providerPayloads.kling.input.video_url).toBe(
      'https://example.com/video-lip-video.mp4'
    );
    expect(providerPayloads.kling.input.audio_url).toBe(
      'https://example.com/audio-driver-video-mode.wav'
    );
    expect(providerPayloads.kling.operation).toBe('videos:lip-sync');
  });

  it('builds image-to-video requests from canonical image refs', () => {
    const image = createImageRef('image-to-video');

    const request = buildUnifiedVideoGenerationRequest(
      createBaseConfig({
        mode: 'image-to-video',
        image,
      })
    );

    expect(request.generationType).toBe('image-to-video');
    expect(request.assets).toEqual([
      expect.objectContaining({
        role: 'input_image',
        type: 'image',
        value: 'image-view-uuid-image-to-video',
      }),
    ]);
  });

  it('builds canonical style-transfer requests from video-to-video UI mode', () => {
    const targetVideo = createVideoRef('video-to-video');

    const request = buildUnifiedVideoGenerationRequest(
      createBaseConfig({
        mode: 'video-to-video',
        prompt: 'anime cel shading',
        targetVideo,
      })
    );

    expect(request.generationType).toBe('style-transfer');
    expect(request.assets).toEqual([
      expect.objectContaining({
        role: 'source_video',
        type: 'video',
        value: 'video-view-uuid-video-to-video',
      }),
    ]);
  });

  it('builds extend requests from canonical video refs', () => {
    const targetVideo = createVideoRef('extend-video');

    const request = buildUnifiedVideoGenerationRequest(
      createBaseConfig({
        mode: 'extend',
        prompt: '',
        targetVideo,
      })
    );

    expect(request.generationType).toBe('extend');
    expect(request.assets).toEqual([
      expect.objectContaining({
        role: 'source_video',
        type: 'video',
        value: 'video-view-uuid-extend-video',
      }),
    ]);
  });

  it('does not serialize canonical locators into provider payload urls', () => {
    const locatorOnlyImage = createVideoInputResourceRef({
      type: 'image',
      path: 'assets://workspaces/ws-7/projects/proj-7/media/originals/image/reference-locator.png',
      name: 'Locator Reference',
    });

    const request = buildUnifiedVideoGenerationRequest(
      createBaseConfig({
        mode: 'smart_reference',
        image: locatorOnlyImage,
      })
    );

    const providerPayloads = request.options?.providerPayloads as Record<
      string,
      Record<string, any>
    >;

    expect(request.assets).toEqual([
      expect.objectContaining({
        role: 'reference_1',
        type: 'image',
        value: locatorOnlyImage.uuid,
      }),
    ]);
    expect(providerPayloads.aliyun.operation).toBe('image-to-video');
    expect(providerPayloads.aliyun.input.img_url).toBeUndefined();
    expect(providerPayloads.kling.operation).toBe('videos:image-to-video');
    expect(providerPayloads.kling.input.image_url).toBeUndefined();
  });
});
