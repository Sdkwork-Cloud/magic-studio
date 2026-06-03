import { describe, expect, it } from 'vitest';

import { createVideoInputResourceRef, type VideoConfig } from '../../entities';
import {
  canGenerateByPanelSchema,
  createVideoPanelRuntimeState,
  resolveVideoPanelModeViewKey,
} from './schema';

const createBaseConfig = (
  overrides: Partial<VideoConfig> = {}
): VideoConfig => ({
  mode: 'smart_reference',
  prompt: '',
  negativePrompt: '',
  model: 'wan2.2-r2v-plus',
  styleId: 'none',
  aspectRatio: '16:9',
  resolution: '720p',
  duration: '5s',
  fps: 30,
  referenceImages: [],
  ...overrides,
});

const createImageRef = (suffix: string) =>
  createVideoInputResourceRef({
    type: 'image',
    url: `https://example.com/${suffix}.png`,
    assetUuid: `image-${suffix}`,
    resourceViewUuid: `image-view-${suffix}`,
  });

const createVideoRef = (suffix: string) =>
  createVideoInputResourceRef({
    type: 'video',
    url: `https://example.com/${suffix}.mp4`,
    assetUuid: `video-${suffix}`,
    resourceViewUuid: `video-view-${suffix}`,
  });

const createLocatorOnlyVideoRef = (suffix: string, type: 'image' | 'video' | 'audio' = 'image') =>
  createVideoInputResourceRef({
    type,
    path: `assets://workspaces/ws-5/projects/proj-5/media/originals/${type}/${suffix}.${type === 'video' ? 'mp4' : type === 'audio' ? 'wav' : 'png'}`,
    name: suffix,
  });

describe('video panel schema', () => {
  it('resolves image-to-video mode to a dedicated panel view', () => {
    expect(resolveVideoPanelModeViewKey('image-to-video')).toBe('image_to_video');
  });

  it('resolves video-to-video mode to a dedicated panel view', () => {
    expect(resolveVideoPanelModeViewKey('video-to-video')).toBe('video_to_video');
  });

  it('resolves extend mode to a dedicated panel view', () => {
    expect(resolveVideoPanelModeViewKey('extend')).toBe('video_extend');
  });

  it('allows image-to-video generation when prompt and source image are present', () => {
    const state = createVideoPanelRuntimeState(
      createBaseConfig({
        mode: 'image-to-video',
        prompt: 'animate the portrait',
        image: createImageRef('image-to-video'),
      }),
      false
    );

    expect(canGenerateByPanelSchema(state)).toBe(true);
  });

  it('allows video-to-video generation when prompt and source video are present', () => {
    const state = createVideoPanelRuntimeState(
      createBaseConfig({
        mode: 'video-to-video',
        prompt: 'anime cel shading',
        targetVideo: createVideoRef('video-to-video'),
      }),
      false
    );

    expect(canGenerateByPanelSchema(state)).toBe(true);
  });

  it('allows extend generation when a source video is present even without prompt', () => {
    const state = createVideoPanelRuntimeState(
      createBaseConfig({
        mode: 'extend',
        prompt: '',
        targetVideo: createVideoRef('extend-video'),
      }),
      false
    );

    expect(canGenerateByPanelSchema(state)).toBe(true);
  });

  it('counts locator-only references as valid video panel inputs', () => {
    const state = createVideoPanelRuntimeState(
      createBaseConfig({
        mode: 'smart_reference',
        prompt: 'animate this locator frame',
        referenceImages: [createLocatorOnlyVideoRef('locator-frame')],
      }),
      false
    );

    expect(state.referenceCount).toBe(1);
    expect(canGenerateByPanelSchema(state)).toBe(true);
  });
});
