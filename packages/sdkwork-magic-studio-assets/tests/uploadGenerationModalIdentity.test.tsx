/** @vitest-environment jsdom */

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  imageProps: null as Record<string, unknown> | null,
  videoProps: null as Record<string, unknown> | null,
  musicProps: null as Record<string, unknown> | null,
  audioProps: null as Record<string, unknown> | null,
  characterProps: null as Record<string, unknown> | null,
}));

vi.mock('../src/components/generate/upload/UploadImageGenerationModal', () => ({
  UploadImageGenerationModal: (props: Record<string, unknown>) => {
    mocks.imageProps = props;
    return <div data-testid="image-modal">image-modal</div>;
  },
}));

vi.mock('../src/components/generate/upload/UploadVideoGenerationModal', () => ({
  UploadVideoGenerationModal: (props: Record<string, unknown>) => {
    mocks.videoProps = props;
    return <div data-testid="video-modal">video-modal</div>;
  },
}));

vi.mock('../src/components/generate/upload/UploadMusicGenerationModal', () => ({
  UploadMusicGenerationModal: (props: Record<string, unknown>) => {
    mocks.musicProps = props;
    return <div data-testid="music-modal">music-modal</div>;
  },
}));

vi.mock('../src/components/generate/upload/UploadAudioGenerationModal', () => ({
  UploadAudioGenerationModal: (props: Record<string, unknown>) => {
    mocks.audioProps = props;
    return <div data-testid="audio-modal">audio-modal</div>;
  },
}));

vi.mock('../src/components/generate/upload/UploadCharacterGenerationModal', () => ({
  UploadCharacterGenerationModal: (props: Record<string, unknown>) => {
    mocks.characterProps = props;
    return <div data-testid="character-modal">character-modal</div>;
  },
}));

import { UploadGenerationModal } from '../src/components/generate/upload/UploadGenerationModal';

describe('UploadGenerationModal identity handling', () => {
  let container: HTMLDivElement;
  let root: Root | null;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = null;
    mocks.imageProps = null;
    mocks.videoProps = null;
    mocks.musicProps = null;
    mocks.audioProps = null;
    mocks.characterProps = null;
  });

  afterEach(async () => {
    await act(async () => {
      root?.unmount();
    });
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('defaults to the canonical image import modal', async () => {
    const onImport = vi.fn();
    const onClose = vi.fn();

    await act(async () => {
      root = createRoot(container);
      root.render(<UploadGenerationModal onImport={onImport} onClose={onClose} />);
    });

    expect(container.querySelector('[data-testid="image-modal"]')).toBeTruthy();
    expect(mocks.imageProps).toMatchObject({
      onImport,
      onClose,
    });
  });

  it('delegates audio imports to the dedicated audio import modal', async () => {
    const onImport = vi.fn();
    const onClose = vi.fn();

    await act(async () => {
      root = createRoot(container);
      root.render(
        <UploadGenerationModal
          onImport={onImport}
          onClose={onClose}
          initialType="audio"
        />
      );
    });

    expect(container.querySelector('[data-testid="audio-modal"]')).toBeTruthy();
    expect(mocks.audioProps).toMatchObject({
      onImport,
      onClose,
    });
    expect(container.querySelector('[data-testid="image-modal"]')).toBeFalsy();
  });

  it('delegates character imports to the dedicated character import modal', async () => {
    const onImport = vi.fn();
    const onClose = vi.fn();

    await act(async () => {
      root = createRoot(container);
      root.render(
        <UploadGenerationModal
          onImport={onImport}
          onClose={onClose}
          initialType="character"
        />
      );
    });

    expect(container.querySelector('[data-testid="character-modal"]')).toBeTruthy();
    expect(mocks.characterProps).toMatchObject({
      onImport,
      onClose,
    });
    expect(container.querySelector('[data-testid="image-modal"]')).toBeFalsy();
  });
});
