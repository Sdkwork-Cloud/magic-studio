/** @vitest-environment jsdom */

import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  config: {
    mode: 'smart_reference',
    prompt: 'seed prompt',
    negativePrompt: '',
    model: 'wan2.2-r2v-plus',
    styleId: 'none',
    aspectRatio: '16:9',
    resolution: '720p',
    duration: '5s',
    fps: 30,
    referenceImages: [],
  },
  setConfig: vi.fn(),
  setMode: vi.fn(),
  enhancePrompt: vi.fn(async (text: string) => `enhanced:${text}`),
  generate: vi.fn(),
  legacyEnhancePrompt: vi.fn(async (text: string) => `legacy:${text}`),
  attachmentUrls: [] as string[],
}));

vi.mock('@sdkwork/magic-studio-assets/choose-asset', () => ({
  ChooseAssetModal: () => null,
}));

vi.mock('@sdkwork/magic-studio-assets/creation-chat', () => ({
  createInputAttachment: (input: Record<string, unknown>) => input,
}));

vi.mock('@sdkwork/magic-studio-assets/hooks', () => ({
  useAssetUrl: () => ({ url: null }),
}));

vi.mock('@sdkwork/magic-studio-assets/asset-center', () => ({
  resolveAssetUrlByAssetIdFirst: vi.fn(async () => null),
}));

vi.mock('../store/videoStore', () => ({
  useVideoStore: () => ({
    config: mocks.config,
    setConfig: mocks.setConfig,
    setMode: mocks.setMode,
    enhancePrompt: mocks.enhancePrompt,
    generate: mocks.generate,
    isGenerating: false,
  }),
}));

vi.mock('./modes', () => ({
  ModeTabsBar: () => null,
}));

vi.mock('./panel', () => ({
  canGenerateByPanelSchema: () => true,
  createVideoPanelRuntimeState: () => ({}),
  getModeTransitionPatch: () => null,
  VideoGenerateFooter: () => null,
  VideoModeTabContent: () => null,
  VideoOutputSettingsSection: () => null,
  VideoPanelHeader: () => null,
  VideoPanelLabel: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  VideoPromptStyleSection: ({
    onEnhance,
    attachments = [],
  }: {
    onEnhance: (text: string) => Promise<string>;
    attachments?: Array<{ url?: string }>;
  }) => (
    <>
      <button
        data-testid="enhance-trigger"
        onClick={() => {
          void onEnhance('panel prompt');
        }}
      >
        Enhance
      </button>
      <div data-testid="attachment-urls">
        {attachments.map((item) => item.url || '').join('|')}
      </div>
    </>
  ),
}));

vi.mock('@sdkwork/magic-studio-core', () => ({
  genAIService: {
    enhancePrompt: mocks.legacyEnhancePrompt,
  },
}));

import { VideoLeftGeneratorPanel } from './VideoLeftGeneratorPanel';

describe('VideoLeftGeneratorPanel', () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  beforeEach(() => {
    Object.assign(mocks.config, {
      mode: 'smart_reference',
      prompt: 'seed prompt',
      negativePrompt: '',
      model: 'wan2.2-r2v-plus',
      styleId: 'none',
      aspectRatio: '16:9',
      resolution: '720p',
      duration: '5s',
      fps: 30,
      referenceImages: [],
      image: undefined,
      lastFrame: undefined,
    });
    mocks.setConfig.mockReset();
    mocks.setMode.mockReset();
    mocks.enhancePrompt.mockReset();
    mocks.enhancePrompt.mockResolvedValue('enhanced:panel prompt');
    mocks.generate.mockReset();
    mocks.legacyEnhancePrompt.mockReset();
    mocks.legacyEnhancePrompt.mockResolvedValue('legacy:panel prompt');

    container = document.createElement('div');
    document.body.appendChild(container);
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(async () => {
    if (root) {
      await act(async () => {
        root?.unmount();
      });
    }
    root = null;
    container?.remove();
    container = null;
    document.body.innerHTML = '';
  });

  it('routes prompt enhancement through video store instead of legacy genAIService', async () => {
    await act(async () => {
      root = createRoot(container!);
      root.render(<VideoLeftGeneratorPanel />);
    });

    const button = container?.querySelector('[data-testid="enhance-trigger"]') as HTMLButtonElement;
    expect(button).toBeTruthy();

    await act(async () => {
      button.click();
      await Promise.resolve();
    });

    expect(mocks.enhancePrompt).toHaveBeenCalledWith('panel prompt');
    expect(mocks.legacyEnhancePrompt).not.toHaveBeenCalled();
  });

  it('only forwards renderable attachment urls to prompt style attachments', async () => {
    Object.assign(mocks.config, {
      image: {
        type: 'image',
        path: 'assets://workspaces/ws-6/projects/proj-6/media/originals/image/start-frame.png',
        name: 'Start Frame',
      },
      referenceImages: [
        {
          type: 'image',
          path: 'assets://workspaces/ws-6/projects/proj-6/media/originals/image/reference-frame-a.png',
          name: 'Reference A',
        },
        {
          type: 'image',
          url: 'https://example.com/reference-frame-b.png',
          name: 'Reference B',
        },
      ],
    });

    await act(async () => {
      root = createRoot(container!);
      root.render(<VideoLeftGeneratorPanel />);
      await Promise.resolve();
      await Promise.resolve();
    });

    const attachmentUrls = container?.querySelector('[data-testid="attachment-urls"]')?.textContent || '';
    expect(attachmentUrls).toContain('https://example.com/reference-frame-b.png');
    expect(attachmentUrls).not.toContain('assets://');
  });
});
