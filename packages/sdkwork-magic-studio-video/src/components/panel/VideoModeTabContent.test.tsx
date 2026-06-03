/** @vitest-environment jsdom */

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@sdkwork/magic-studio-assets/choose-asset', () => ({
  ChooseAsset: ({ label }: { label?: string }) => <div>{label || 'Choose Asset'}</div>,
}));

import type { VideoConfig } from '../../entities';
import { VideoModeTabContent } from './VideoModeTabContent';

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

const createBaseProps = (config: VideoConfig) => ({
  config,
  isGenerating: false,
  maxAssets: 4,
  resolvedReferenceImages: [],
  onConfigChange: vi.fn(),
  onStartFrameChange: vi.fn(),
  onEndFrameChange: vi.fn(),
  onSubjectReferenceChange: vi.fn(),
  onTargetVideoChange: vi.fn(),
  onTargetImageChange: vi.fn(),
  onDriverAudioChange: vi.fn(),
  onSwapStartEndFrames: vi.fn(),
  onOpenReferenceAssetModal: vi.fn(),
});

describe('VideoModeTabContent', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('renders an image source panel for image-to-video mode', async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div');
    document.body.appendChild(container);
    let root: Root | null = null;

    await act(async () => {
      root = createRoot(container);
      root.render(
        <VideoModeTabContent
          {...createBaseProps(
            createBaseConfig({
              mode: 'image-to-video',
            })
          )}
        />
      );
    });

    expect(container.textContent).toContain('Source Image');

    await act(async () => {
      root?.unmount();
    });
  });

  it('renders a source video panel for video-to-video mode', async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div');
    document.body.appendChild(container);
    let root: Root | null = null;

    await act(async () => {
      root = createRoot(container);
      root.render(
        <VideoModeTabContent
          {...createBaseProps(
            createBaseConfig({
              mode: 'video-to-video',
            })
          )}
        />
      );
    });

    expect(container.textContent).toContain('Source Video');

    await act(async () => {
      root?.unmount();
    });
  });

  it('renders a source video panel for extend mode', async () => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div');
    document.body.appendChild(container);
    let root: Root | null = null;

    await act(async () => {
      root = createRoot(container);
      root.render(
        <VideoModeTabContent
          {...createBaseProps(
            createBaseConfig({
              mode: 'extend',
            })
          )}
        />
      );
    });

    expect(container.textContent).toContain('Video to Extend');

    await act(async () => {
      root?.unmount();
    });
  });
});
