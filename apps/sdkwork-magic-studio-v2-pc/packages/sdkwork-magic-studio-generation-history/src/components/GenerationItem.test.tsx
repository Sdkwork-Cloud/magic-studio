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
    notify: vi.fn(),
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

import { GenerationItem } from './GenerationItem';

afterEach(() => {
  document.body.innerHTML = '';
  vi.clearAllMocks();
});

describe('GenerationItem', () => {
  it('deletes tasks through the uuid-first task key', async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div');
    document.body.appendChild(container);

    const onDelete = vi.fn();
    const onReuse = vi.fn();
    const onPreview = vi.fn();
    let root: Root | null = null;

    await act(async () => {
      root = createRoot(container);
      root.render(
        <GenerationItem
          task={{
            id: 'task-db-id-1',
            uuid: 'task-uuid-1',
            createdAt: 0,
            updatedAt: 0,
            status: 'completed',
            config: {
              prompt: 'A mountain at sunrise',
              mediaType: 'image',
              aspectRatio: '16:9',
            },
            results: [
              {
                id: 'result-1',
                url: 'https://example.com/mountain.png',
              },
            ],
          }}
          onDelete={onDelete}
          onReuse={onReuse}
          onPreview={onPreview}
        />
      );
    });

    const deleteButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.getAttribute('title') === 'generationHistory.item.delete'
    );

    expect(deleteButton).toBeTruthy();

    await act(async () => {
      deleteButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onDelete).toHaveBeenCalledWith('task-uuid-1');

    await act(async () => {
      root?.unmount();
    });
  });

  it('renders text generation results as transcript cards instead of image or audio thumbnails', async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div');
    document.body.appendChild(container);

    const onDelete = vi.fn();
    const onReuse = vi.fn();
    const onPreview = vi.fn();
    let root: Root | null = null;

    await act(async () => {
      root = createRoot(container);
      root.render(
        <GenerationItem
          task={{
            id: 'task-db-id-text-1',
            uuid: 'task-uuid-text-1',
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
                id: 'result-text-1',
                uuid: 'result-text-uuid-1',
                assetUuid: 'asset-text-uuid-1',
                resource: {
                  uuid: 'resource-text-uuid-1',
                  type: MediaResourceType.TEXT,
                  url: 'data:text/plain;charset=utf-8,Hello%20world%20transcription',
                  mimeType: 'text/plain',
                  metadata: {
                    text: 'Hello world transcription',
                  },
                },
              },
            ],
          }}
          onDelete={onDelete}
          onReuse={onReuse}
          onPreview={onPreview}
        />
      );
    });

    expect(container.textContent).toContain('Hello world transcription');

    await act(async () => {
      root?.unmount();
    });
  });
});
