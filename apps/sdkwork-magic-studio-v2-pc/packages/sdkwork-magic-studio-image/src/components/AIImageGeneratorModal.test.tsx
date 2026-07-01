/** @vitest-environment jsdom */

import { act, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  renderedInitialPrompt: '',
  enhancePrompt: vi.fn(async (text: string) => `enhanced:${text}`),
  legacyGenerateCoverPrompts: vi.fn(async (text: string) => [`legacy:${text}`]),
  onClose: vi.fn(),
  onSuccess: vi.fn(),
  deleteTask: vi.fn(),
  setConfig: vi.fn(),
}));

vi.mock('@sdkwork/magic-studio-commons', () => ({
  Button: ({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" {...props}>
      {children}
    </button>
  ),
  pathUtils: {
    join: (...segments: string[]) => segments.join('/'),
  },
}));

vi.mock('@sdkwork/magic-studio-generation-history', () => ({
  GenerateHistory: () => null,
}));

vi.mock('../store/imageStore', () => ({
  ImageStoreProvider: ({ children }: { children: ReactNode }) => children,
  useImageStore: () => ({
    history: [],
    deleteTask: mocks.deleteTask,
    setConfig: mocks.setConfig,
  }),
}));

vi.mock('../services', () => ({
  imageBusinessService: {
    imageService: {
      enhancePrompt: mocks.enhancePrompt,
    },
  },
}));

vi.mock('./AIImageGeneratorModalContent', () => ({
  AIImageGeneratorModalContent: ({ initialPrompt }: { initialPrompt?: string }) => {
    mocks.renderedInitialPrompt = initialPrompt || '';
    return <div data-testid="initial-prompt">{initialPrompt}</div>;
  },
}));

vi.mock('./ImageGridEditorModal', () => ({
  ImageGridEditorModal: () => null,
}));

vi.mock('./ImageCanvasEditorModal', () => ({
  ImageCanvasEditorModal: () => null,
}));

vi.mock('@sdkwork/magic-studio-assets/services', () => ({
  persistGeneratedSelectionAsset: vi.fn(async () => ({})),
}));

vi.mock('@sdkwork/magic-studio-core', () => ({
  genAIService: {
    generateCoverPrompts: mocks.legacyGenerateCoverPrompts,
  },
}));

import { AIImageGeneratorModal } from './AIImageGeneratorModal';

describe('AIImageGeneratorModal', () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  beforeEach(() => {
    mocks.renderedInitialPrompt = '';
    mocks.enhancePrompt.mockReset();
    mocks.enhancePrompt.mockResolvedValue('enhanced:story context');
    mocks.legacyGenerateCoverPrompts.mockReset();
    mocks.legacyGenerateCoverPrompts.mockResolvedValue(['legacy:story context']);
    mocks.onClose.mockReset();
    mocks.onSuccess.mockReset();
    mocks.deleteTask.mockReset();
    mocks.setConfig.mockReset();

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

  it('uses image service prompt enhancement for context-derived initial prompt', async () => {
    await act(async () => {
      root = createRoot(container!);
      root.render(
        <AIImageGeneratorModal
          contextText="story context"
          onClose={mocks.onClose}
          onSuccess={mocks.onSuccess}
        />
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mocks.enhancePrompt).toHaveBeenCalledWith('story context');
    expect(mocks.legacyGenerateCoverPrompts).not.toHaveBeenCalled();
    expect(mocks.renderedInitialPrompt).toBe('enhanced:story context');
  });

  it('keeps explicit config prompt higher priority than context enhancement', async () => {
    await act(async () => {
      root = createRoot(container!);
      root.render(
        <AIImageGeneratorModal
          contextText="story context"
          config={{ prompt: 'explicit prompt' }}
          onClose={mocks.onClose}
          onSuccess={mocks.onSuccess}
        />
      );
      await Promise.resolve();
    });

    expect(mocks.enhancePrompt).not.toHaveBeenCalled();
    expect(mocks.legacyGenerateCoverPrompts).not.toHaveBeenCalled();
    expect(mocks.renderedInitialPrompt).toBe('explicit prompt');
  });

  it('clears the derived prompt when the modal rerenders without config or context input', async () => {
    await act(async () => {
      root = createRoot(container!);
      root.render(
        <AIImageGeneratorModal
          contextText="story context"
          onClose={mocks.onClose}
          onSuccess={mocks.onSuccess}
        />
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mocks.renderedInitialPrompt).toBe('enhanced:story context');

    await act(async () => {
      root?.render(
        <AIImageGeneratorModal
          onClose={mocks.onClose}
          onSuccess={mocks.onSuccess}
        />
      );
      await Promise.resolve();
    });

    expect(mocks.renderedInitialPrompt).toBe('');
  });
});
