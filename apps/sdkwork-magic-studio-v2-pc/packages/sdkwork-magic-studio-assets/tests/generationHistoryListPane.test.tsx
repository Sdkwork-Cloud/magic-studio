import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

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
  getAppSdkClientWithSession: vi.fn(() => ({})),
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

vi.mock('../src/components/generate/upload/UploadImageGenerationModal', () => ({
  UploadImageGenerationModal: () => null,
}));

vi.mock('../src/components/generate/upload/UploadVideoGenerationModal', () => ({
  UploadVideoGenerationModal: () => null,
}));

vi.mock('../src/components/generate/upload/UploadMusicGenerationModal', () => ({
  UploadMusicGenerationModal: () => null,
}));

vi.mock('../src/components/generate/upload/UploadAudioGenerationModal', () => ({
  UploadAudioGenerationModal: () => null,
}));

vi.mock('../src/components/generate/upload/UploadCharacterGenerationModal', () => ({
  UploadCharacterGenerationModal: () => null,
}));

describe('GenerationHistoryListPane', () => {
  it('renders generation history content instead of a local stub', async () => {
    const { GenerationHistoryListPane } = await import('../src/components/generate/GenerationHistoryListPane');

    const html = renderToStaticMarkup(
      React.createElement(GenerationHistoryListPane as any, {
        tasks: [
          {
            id: 'task-1',
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
          },
        ],
        onDelete: vi.fn(),
        onReuse: vi.fn(),
        selectionMode: true,
        onSelect: vi.fn(),
        selectedKeys: [],
        minimal: true,
      })
    );

    expect(html).toContain('A mountain at sunrise');
  });
});
