/** @vitest-environment jsdom */

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  setConfig: vi.fn(),
  generate: vi.fn(),
  enhancePrompt: vi.fn(async (text: string) => `enhanced:${text}`),
  legacyEnhancePrompt: vi.fn(async (text: string) => `legacy:${text}`),
}));

vi.mock('../src/store/characterStore', () => ({
  useCharacterStore: () => ({
    config: {
      name: 'Astra',
      description: 'seed prompt',
      model: 'gemini-2.5-flash-image',
      voiceId: 'Puck',
      avatarMode: 'full-body',
    },
    setConfig: mocks.setConfig,
    generate: mocks.generate,
    isGenerating: false,
  }),
}));

vi.mock('@sdkwork/magic-studio-i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@sdkwork/magic-studio-assets/choose-asset', () => ({
  ChooseAsset: () => null,
}));

vi.mock('@sdkwork/magic-studio-assets/generation', () => ({
  PromptTextInput: ({
    onEnhance,
  }: {
    onEnhance?: (text: string) => Promise<string>;
  }) => (
    <button
      data-testid="enhance-trigger"
      onClick={() => {
        void onEnhance?.('character prompt');
      }}
    >
      Enhance
    </button>
  ),
  createPromptTextInputCapabilityProps: () => ({}),
}));

vi.mock('@sdkwork/magic-studio-assets/services', () => ({
  fetchGenerationCatalogProviders: vi.fn(async () => [
    {
      id: 'image-provider',
      models: [{ id: 'gemini-2.5-flash-image', name: 'Gemini Image' }],
    },
  ]),
}));

vi.mock('@sdkwork/magic-studio-image/modals', () => ({
  AIImageGeneratorModal: () => null,
}));

vi.mock('@sdkwork/magic-studio-image/constants', () => ({
  IMAGE_PROVIDERS: [
    {
      id: 'image-provider',
      models: [{ id: 'gemini-2.5-flash-image', name: 'Gemini Image' }],
    },
  ],
}));

vi.mock('@sdkwork/magic-studio-image/selectors', () => ({
  ImageModelSelector: () => null,
}));

vi.mock('@sdkwork/magic-studio-image/services', () => ({
  imageService: {
    enhancePrompt: mocks.enhancePrompt,
  },
}));

vi.mock('@sdkwork/magic-studio-core', () => ({
  genAIService: {
    enhancePrompt: mocks.legacyEnhancePrompt,
  },
}));

vi.mock('@sdkwork/magic-studio-core/platform', () => ({
  useRuntimeMagicStudioExecutionOperationCapability: () => ({
    disabledReason: null,
    ready: true,
  }),
}));

vi.mock('@sdkwork/magic-studio-voicespeaker/picker', () => ({
  ChooseVoiceSpeaker: () => null,
}));

vi.mock('@sdkwork/magic-studio-voicespeaker/constants', () => ({
  PRESET_VOICES: [
    {
      id: 'Puck',
      name: 'Puck',
      gender: 'male',
      language: 'en',
      style: 'neutral',
      previewUrl: '',
    },
  ],
}));

vi.mock('../src/utils/characterAvatarAsset', () => ({
  toCharacterAvatarAssetFields: vi.fn(() => ({})),
  toCharacterAvatarChooseAssetValue: vi.fn(() => null),
}));

import { CharacterLeftGeneratorPanel } from '../src/components/CharacterLeftGeneratorPanel';

describe('CharacterLeftGeneratorPanel', () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  beforeEach(() => {
    mocks.setConfig.mockReset();
    mocks.generate.mockReset();
    mocks.enhancePrompt.mockReset();
    mocks.enhancePrompt.mockResolvedValue('enhanced:character prompt');
    mocks.legacyEnhancePrompt.mockReset();
    mocks.legacyEnhancePrompt.mockResolvedValue('legacy:character prompt');

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

  it('routes prompt enhancement through imageService instead of genAIService', async () => {
    await act(async () => {
      root = createRoot(container!);
      root.render(<CharacterLeftGeneratorPanel />);
    });

    const button = container?.querySelector('[data-testid="enhance-trigger"]') as HTMLButtonElement;
    expect(button).toBeTruthy();

    await act(async () => {
      button.click();
      await Promise.resolve();
    });

    expect(mocks.enhancePrompt).toHaveBeenCalledWith('character prompt');
    expect(mocks.legacyEnhancePrompt).not.toHaveBeenCalled();
  });
});
