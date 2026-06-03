/** @vitest-environment jsdom */

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MediaResourceType } from '@sdkwork/magic-studio-types/vocabulary';

vi.mock('@sdkwork/magic-studio-i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@sdkwork/magic-studio-i18n')>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
    }),
  };
});

vi.mock('@sdkwork/magic-studio-core', () => ({
  platform: {
    copy: vi.fn(),
  },
  useRouter: () => ({
    navigate: vi.fn(),
  }),
  ROUTES: {
    VIDEO: '/video',
    IMAGE: '/image',
  },
  remixService: {
    setIntent: vi.fn(),
  },
}));

vi.mock('@sdkwork/magic-studio-commons', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@sdkwork/magic-studio-commons')>();
  return {
    ...actual,
    PromptText: ({ text }: { text: string }) => React.createElement('div', null, text),
  };
});

vi.mock('@sdkwork/magic-studio-commons/hooks', () => ({
  useRenderableAssetUrl: (url?: string) => ({ url }),
}));

import { GenerationPreview } from './GenerationPreview';

afterEach(() => {
  document.body.innerHTML = '';
  vi.clearAllMocks();
});

describe('GenerationPreview', () => {
  it('renders video results from canonical resource types without relying on url suffixes', async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div');
    document.body.appendChild(container);

    let root: Root | null = null;

    await act(async () => {
      root = createRoot(container);
      root.render(
        <GenerationPreview
          tasks={[
            {
              id: 'task-db-id-1',
              uuid: 'task-uuid-1',
              createdAt: 0,
              updatedAt: 0,
              status: 'completed',
              config: {
                prompt: 'Cinematic city skyline',
                mediaType: 'video',
                aspectRatio: '16:9',
              },
              results: [
                {
                  id: 'result-db-id-1',
                  uuid: 'result-uuid-1',
                  assetUuid: 'asset-uuid-1',
                  primaryResourceUuid: 'resource-uuid-1',
                  resourceViewUuid: 'resource-view-uuid-1',
                  resource: {
                    uuid: 'resource-uuid-1',
                    type: MediaResourceType.VIDEO,
                    url: 'https://example.com/generated/video-delivery',
                  },
                  coverResource: {
                    uuid: 'cover-uuid-1',
                    type: MediaResourceType.IMAGE,
                    url: 'https://example.com/generated/video-poster',
                  },
                },
              ],
            },
          ]}
          onClose={vi.fn()}
        />
      );
    });

    const video = document.body.querySelector('video[src="https://example.com/generated/video-delivery"]');

    expect(video).toBeTruthy();

    await act(async () => {
      root?.unmount();
    });
  });

  it('renders audio-family results as audio players from canonical resource types', async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div');
    document.body.appendChild(container);

    let root: Root | null = null;

    await act(async () => {
      root = createRoot(container);
      root.render(
        <GenerationPreview
          tasks={[
            {
              id: 'task-db-id-2',
              uuid: 'task-uuid-2',
              createdAt: 0,
              updatedAt: 0,
              status: 'completed',
              config: {
                prompt: 'Warm piano loop',
                mediaType: 'music',
                aspectRatio: '1:1',
              },
              results: [
                {
                  id: 'result-db-id-2',
                  uuid: 'result-uuid-2',
                  assetUuid: 'asset-uuid-2',
                  primaryResourceUuid: 'resource-uuid-2',
                  resourceViewUuid: 'resource-view-uuid-2',
                  resource: {
                    uuid: 'resource-uuid-2',
                    type: MediaResourceType.MUSIC,
                    url: 'https://example.com/generated/music-delivery',
                  },
                },
              ],
            },
          ]}
          onClose={vi.fn()}
        />
      );
    });

    const audio = document.body.querySelector('audio[src="https://example.com/generated/music-delivery"]');

    expect(audio).toBeTruthy();

    await act(async () => {
      root?.unmount();
    });
  });

  it('renders text results from canonical TEXT resources without treating them as media players', async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div');
    document.body.appendChild(container);

    let root: Root | null = null;

    await act(async () => {
      root = createRoot(container);
      root.render(
        <GenerationPreview
          tasks={[
            {
              id: 'task-db-id-3',
              uuid: 'task-uuid-3',
              createdAt: 0,
              updatedAt: 0,
              status: 'completed',
              config: {
                prompt: 'meeting-notes.wav',
                mediaType: 'speech',
                aspectRatio: '16:9',
              },
              results: [
                {
                  id: 'result-db-id-3',
                  uuid: 'result-uuid-3',
                  assetUuid: 'asset-uuid-3',
                  primaryResourceUuid: 'resource-uuid-3',
                  resourceViewUuid: 'resource-view-uuid-3',
                  resource: {
                    uuid: 'resource-uuid-3',
                    type: MediaResourceType.TEXT,
                    url: 'data:text/plain;charset=utf-8,Hello%20world%20transcription',
                    mimeType: 'text/plain',
                    metadata: {
                      text: 'Hello world transcription',
                      language: 'en',
                    },
                  },
                },
              ],
            },
          ]}
          onClose={vi.fn()}
        />
      );
    });

    expect(document.body.textContent).toContain('Hello world transcription');
    expect(document.body.querySelector('audio')).toBeNull();
    expect(document.body.querySelector('video')).toBeNull();

    await act(async () => {
      root?.unmount();
    });
  });

  it('renders gallery music items as audio players in view mode', async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div');
    document.body.appendChild(container);

    let root: Root | null = null;

    await act(async () => {
      root = createRoot(container);
      root.render(
        <GenerationPreview
          mode="view"
          galleryItem={{
            id: 'gallery-music-1',
            type: 'music',
            title: 'Night Drive',
            prompt: 'Retro synth groove',
            url: 'https://example.com/generated/gallery-music.mp3',
            aspectRatio: '1:1',
            author: {
              id: 'author-1',
              name: 'Studio DJ',
            },
            stats: {
              views: 12,
              likes: 4,
            },
            model: 'suno-v3',
            createdAt: '2026-04-20 10:00:00',
          }}
          onClose={vi.fn()}
        />
      );
    });

    const audio = document.body.querySelector('audio[src="https://example.com/generated/gallery-music.mp3"]');

    expect(audio).toBeTruthy();

    await act(async () => {
      root?.unmount();
    });
  });
});
