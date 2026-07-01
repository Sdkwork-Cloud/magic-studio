/** @vitest-environment jsdom */

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MediaResourceType } from '@sdkwork/magic-studio-types/vocabulary';

vi.mock('@sdkwork/magic-studio-core', () => ({
  platform: {
    copy: vi.fn(),
  },
}));

import { VideoGenerationItem } from './VideoGenerationItem';

afterEach(() => {
  document.body.innerHTML = '';
  vi.clearAllMocks();
});

describe('VideoGenerationItem', () => {
  it('renders canonical resource-first video results without requiring top-level urls', async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div');
    document.body.appendChild(container);
    let root: Root | null = null;

    await act(async () => {
      root = createRoot(container);
      root.render(
        <VideoGenerationItem
          task={{
            id: null,
            uuid: 'video-task-uuid-1',
            createdAt: 0,
            updatedAt: 0,
            status: 'completed',
            config: {
              mode: 'text',
              prompt: 'Aerial city flyover',
              styleId: 'none',
              aspectRatio: '16:9',
              resolution: '1080p',
              duration: '8s',
              fps: 30,
              model: 'veo-3',
            },
            results: [
              {
                id: null,
                uuid: 'video-result-uuid-1',
                resource: {
                  id: null,
                  uuid: 'video-resource-uuid-1',
                  type: MediaResourceType.VIDEO,
                  name: 'Generated Video',
                  createdAt: 0,
                  updatedAt: 0,
                  url: 'https://example.com/generated-video-resource.mp4',
                },
              },
            ],
          }}
          onDelete={vi.fn()}
          onReuse={vi.fn()}
        />
      );
    });

    const video = container.querySelector(
      'video[src="https://example.com/generated-video-resource.mp4"]'
    );

    expect(video).toBeTruthy();

    await act(async () => {
      root?.unmount();
    });
  });
});
