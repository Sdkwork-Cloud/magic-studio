/** @vitest-environment jsdom */

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  useImageStore: vi.fn(),
}));

vi.mock('../store/imageStore', () => ({
  useImageStore: mocks.useImageStore,
}));

vi.mock('@sdkwork/magic-studio-core', () => ({
  platform: {
    copy: vi.fn(),
  },
}));

import { GalleryGrid } from './GalleryGrid';

afterEach(() => {
  document.body.innerHTML = '';
  vi.clearAllMocks();
});

describe('GalleryGrid', () => {
  it('renders canonical resource-first image results without requiring top-level urls', async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div');
    document.body.appendChild(container);
    let root: Root | null = null;

    mocks.useImageStore.mockReturnValue({
      history: [
        {
          id: null,
          uuid: 'image-task-uuid-1',
          createdAt: 0,
          updatedAt: 0,
          status: 'completed',
          config: {
            prompt: 'Studio portrait',
            aspectRatio: '1:1',
          },
          results: [
            {
              id: null,
              uuid: 'image-result-uuid-1',
              resource: {
                id: null,
                uuid: 'image-resource-uuid-1',
                type: 'IMAGE',
                url: 'https://example.com/generated-image-resource.png',
              },
            },
          ],
        },
      ],
      deleteTask: vi.fn(),
    });

    await act(async () => {
      root = createRoot(container);
      root.render(<GalleryGrid />);
    });

    const image = container.querySelector(
      'img[src="https://example.com/generated-image-resource.png"]'
    );

    expect(image).toBeTruthy();

    await act(async () => {
      root?.unmount();
    });
  });
});
