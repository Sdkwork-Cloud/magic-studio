import { describe, expect, it, vi } from 'vitest';

import { MediaResourceType } from '@sdkwork/react-commons';

import { PlayerPreviewCoordinator, type AudioPreviewController } from '../src/services/PlayerPreviewCoordinator';

const createResource = (type: MediaResourceType, id: string) =>
  ({
    id,
    uuid: `${id}-uuid`,
    type,
    name: `${id}-name`,
    path: `${id}.mock`,
    url: `${id}.mock`,
    metadata: {},
    createdAt: 0,
    updatedAt: 0,
  }) as any;

const createPlayer = () => ({
  renderPreview: vi.fn(),
  setPreviewResource: vi.fn(),
  renderNow: vi.fn(),
});

describe('PlayerPreviewService', () => {
  it('routes audio-only resources to the audio preview controller', () => {
    const audioPreview: AudioPreviewController = {
      preview: vi.fn(),
      stop: vi.fn(),
    };
    const service = new PlayerPreviewCoordinator(audioPreview);
    const player = createPlayer();

    service.registerPlayer({ current: player } as any);
    service.previewResource(createResource(MediaResourceType.AUDIO, 'audio-preview'), 1.25);

    expect(audioPreview.preview).toHaveBeenCalledWith(expect.objectContaining({ id: 'audio-preview' }), 1.25);
    expect(player.renderPreview).not.toHaveBeenCalled();
  });

  it('routes visual previews to the player and stops audio preview playback first', () => {
    const audioPreview: AudioPreviewController = {
      preview: vi.fn(),
      stop: vi.fn(),
    };
    const service = new PlayerPreviewCoordinator(audioPreview);
    const player = createPlayer();

    service.registerPlayer({ current: player } as any);
    service.previewResource(createResource(MediaResourceType.VIDEO, 'video-preview'), 4.5);

    expect(audioPreview.stop).toHaveBeenCalledTimes(1);
    expect(player.renderPreview).toHaveBeenCalledWith(expect.objectContaining({ id: 'video-preview' }), 4.5);
  });

  it('clears audio previews and restores the last timeline frame', () => {
    const audioPreview: AudioPreviewController = {
      preview: vi.fn(),
      stop: vi.fn(),
    };
    const service = new PlayerPreviewCoordinator(audioPreview);
    const player = createPlayer();

    service.registerPlayer({ current: player } as any);
    service.renderTime(12);
    service.clearPreview();

    expect(audioPreview.stop).toHaveBeenCalled();
    expect(player.setPreviewResource).toHaveBeenCalledWith(null);
    expect(player.renderNow).toHaveBeenCalledWith(12, false);
  });

  it('replays pending visual previews when the player registers later', () => {
    const audioPreview: AudioPreviewController = {
      preview: vi.fn(),
      stop: vi.fn(),
    };
    const service = new PlayerPreviewCoordinator(audioPreview);
    const player = createPlayer();

    service.previewResource(createResource(MediaResourceType.IMAGE, 'image-preview'), 0);
    service.registerPlayer({ current: player } as any);

    expect(player.renderPreview).toHaveBeenCalledWith(expect.objectContaining({ id: 'image-preview' }), 0);
  });
});
