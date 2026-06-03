/** @vitest-environment jsdom */

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  setConfig: vi.fn(),
  generate: vi.fn(),
  enhancePrompt: vi.fn(async (text: string) => `enhanced:${text}`),
  genAIEnhancePrompt: vi.fn(async (text: string) => `legacy:${text}`),
}));

vi.mock('@sdkwork/magic-studio-assets/choose-asset', () => ({
  ChooseAssetModal: () => null,
}));

vi.mock('@sdkwork/magic-studio-assets/services', () => ({
  importAssetBySdk: vi.fn(),
}));

vi.mock('../store/imageStore', () => ({
  useImageStore: () => ({
    config: {
      prompt: 'seed prompt',
      model: 'gemini-2.5-flash-image',
      referenceImages: [],
      batchSize: 1,
      aspectRatio: '1:1',
    },
    setConfig: mocks.setConfig,
    generate: mocks.generate,
    enhancePrompt: mocks.enhancePrompt,
    isGenerating: false,
  }),
}));

vi.mock('../utils/imageInputResource', () => ({
  toImageInputResourceRefFromAsset: vi.fn(),
}));

vi.mock('./panel', () => ({
  canGenerateByImagePanelSchema: () => true,
  createImagePanelRuntimeState: () => ({}),
  DEFAULT_IMAGE_MODEL: 'gemini-2.5-flash-image',
  getImageOutputConfigPatch: () => null,
  resolveImageOutputPolicy: () => ({
    maxReferenceImages: 4,
    defaultBatchSize: 1,
  }),
  ImageAdvancedSettingsSection: () => null,
  ImageGenerateFooter: () => null,
  ImageOutputSettingsSection: () => null,
  ImagePanelHeader: () => null,
  ImageReferenceSection: () => null,
  ImageStyleSection: () => null,
  ImagePromptSection: ({
    onEnhance,
  }: {
    onEnhance: (text: string) => Promise<string>;
  }) => (
    <button
      data-testid="enhance-trigger"
      onClick={() => {
        void onEnhance('panel prompt');
      }}
    >
      Enhance
    </button>
  ),
}));

vi.mock('@sdkwork/magic-studio-core', () => ({
  LocalStorageService: class LocalStorageService {
    constructor(..._args: unknown[]) {}
  },
  genAIService: {
    enhancePrompt: mocks.genAIEnhancePrompt,
  },
}));

import { ImageLeftGeneratorPanel } from './ImageLeftGeneratorPanel';

describe('ImageLeftGeneratorPanel', () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  beforeEach(() => {
    mocks.setConfig.mockReset();
    mocks.generate.mockReset();
    mocks.enhancePrompt.mockReset();
    mocks.enhancePrompt.mockResolvedValue('enhanced:panel prompt');
    mocks.genAIEnhancePrompt.mockReset();
    mocks.genAIEnhancePrompt.mockResolvedValue('legacy:panel prompt');

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

  it('routes prompt enhancement through image store instead of genAIService', async () => {
    await act(async () => {
      root = createRoot(container!);
      root.render(<ImageLeftGeneratorPanel />);
    });

    const button = container?.querySelector('[data-testid="enhance-trigger"]') as HTMLButtonElement;
    expect(button).toBeTruthy();

    await act(async () => {
      button.click();
      await Promise.resolve();
    });

    expect(mocks.enhancePrompt).toHaveBeenCalledWith('panel prompt');
    expect(mocks.genAIEnhancePrompt).not.toHaveBeenCalled();
  });
});
