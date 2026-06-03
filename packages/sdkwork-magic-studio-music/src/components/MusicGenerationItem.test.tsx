/** @vitest-environment jsdom */

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MediaResourceType } from '@sdkwork/magic-studio-types/vocabulary';

import { MusicGenerationItem } from './MusicGenerationItem';

afterEach(() => {
  document.body.innerHTML = '';
  vi.clearAllMocks();
});

describe('MusicGenerationItem', () => {
  it('renders canonical resource-first music results without requiring top-level urls', async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div');
    document.body.appendChild(container);
    let root: Root | null = null;

    await act(async () => {
      root = createRoot(container);
      root.render(
        <MusicGenerationItem
          task={{
            id: null,
            uuid: 'music-task-uuid-1',
            createdAt: 0,
            updatedAt: 0,
            status: 'completed',
            config: {
              customMode: false,
              prompt: 'Synthwave track',
              lyrics: '',
              style: 'electronic',
              title: 'Night Drive',
              instrumental: true,
              model: 'suno-v3',
              duration: 180,
              mediaType: 'music',
            },
            results: [
              {
                id: null,
                uuid: 'music-result-uuid-1',
                title: 'Night Drive',
                duration: 180,
                resource: {
                  id: null,
                  uuid: 'music-resource-uuid-1',
                  type: MediaResourceType.MUSIC,
                  name: 'Generated Music',
                  createdAt: 0,
                  updatedAt: 0,
                  url: 'https://example.com/generated-music-resource.mp3',
                },
                coverResource: {
                  id: null,
                  uuid: 'music-cover-uuid-1',
                  type: MediaResourceType.IMAGE,
                  name: 'Generated Music Cover',
                  createdAt: 0,
                  updatedAt: 0,
                  url: 'https://example.com/generated-music-cover-resource.png',
                },
              },
            ],
          }}
          onDelete={vi.fn()}
          onReuse={vi.fn()}
          onToggleFavorite={vi.fn()}
        />
      );
    });

    const cover = container.querySelector(
      'img[src="https://example.com/generated-music-cover-resource.png"]'
    );
    const audio = container.querySelector(
      'audio[src="https://example.com/generated-music-resource.mp3"]'
    );

    expect(cover).toBeTruthy();
    expect(audio).toBeTruthy();

    await act(async () => {
      root?.unmount();
    });
  });
});
