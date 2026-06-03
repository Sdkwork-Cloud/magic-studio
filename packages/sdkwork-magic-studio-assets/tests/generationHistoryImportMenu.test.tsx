/** @vitest-environment jsdom */

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@sdkwork/magic-studio-i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@sdkwork/magic-studio-core', () => ({
  platform: {
    copy: vi.fn(),
    notify: vi.fn(),
  },
  useRouter: () => ({
    navigate: vi.fn(),
  }),
  ROUTES: {},
  remixService: {
    setIntent: vi.fn(),
  },
}));

vi.mock('../src/components/generate/upload/UploadImageGenerationModal', () => ({
  UploadImageGenerationModal: () => <div data-testid="image-modal">image-modal</div>,
}));

vi.mock('../src/components/generate/upload/UploadVideoGenerationModal', () => ({
  UploadVideoGenerationModal: () => <div data-testid="video-modal">video-modal</div>,
}));

vi.mock('../src/components/generate/upload/UploadMusicGenerationModal', () => ({
  UploadMusicGenerationModal: () => <div data-testid="music-modal">music-modal</div>,
}));

vi.mock('../src/components/generate/upload/UploadAudioGenerationModal', () => ({
  UploadAudioGenerationModal: () => <div data-testid="audio-modal">audio-modal</div>,
}));

vi.mock('../src/components/generate/upload/UploadCharacterGenerationModal', () => ({
  UploadCharacterGenerationModal: () => <div data-testid="character-modal">character-modal</div>,
}));

describe('GenerationHistoryListPane import menu', () => {
  let container: HTMLDivElement;
  let root: Root | null;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = null;
  });

  afterEach(async () => {
    await act(async () => {
      root?.unmount();
    });
    document.body.innerHTML = '';
  });

  it('renders only requested import entries and opens the matching modal', async () => {
    const { GenerationHistoryListPane } = await import('../src/components/generate/GenerationHistoryListPane');

    await act(async () => {
      root = createRoot(container);
      root.render(
        <GenerationHistoryListPane
          tasks={[]}
          onDelete={vi.fn()}
          onReuse={vi.fn()}
          onImport={vi.fn()}
          importTypes={['audio', 'character']}
        />
      );
    });

    const importButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Import')
    );
    expect(importButton).toBeTruthy();

    await act(async () => {
      importButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.textContent).toContain('Import Audio');
    expect(container.textContent).toContain('Import Character');
    expect(container.textContent).not.toContain('Import Image');
    expect(container.textContent).not.toContain('Import Video');
    expect(container.textContent).not.toContain('Import Music');

    const audioEntry = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Import Audio')
    );
    expect(audioEntry).toBeTruthy();

    await act(async () => {
      audioEntry?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.querySelector('[data-testid="audio-modal"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="character-modal"]')).toBeFalsy();
  });
});
