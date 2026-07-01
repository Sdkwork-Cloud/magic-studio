/** @vitest-environment jsdom */

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  store: {
    history: [],
    config: {
      prompt: '',
      duration: 5,
      model: 'eleven-labs-sfx',
      mediaType: 'audio',
    },
    isGenerating: false,
    setConfig: vi.fn(),
    generate: vi.fn(async () => undefined),
    deleteTask: vi.fn(async () => undefined),
    clearHistory: vi.fn(async () => undefined),
    toggleFavorite: vi.fn(async () => undefined),
  },
  getCategories: vi.fn(async () => [
    {
      id: 'whoosh',
      name: 'Whoosh',
      description: 'Motion and transition effects',
    },
  ]),
}));

vi.mock('@sdkwork/magic-studio-assets/generation', () => ({
  PromptTextInput: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (value: string) => void;
  }) =>
    React.createElement('textarea', {
      value,
      onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value),
    }),
  createPromptTextInputCapabilityProps: () => ({}),
}));

vi.mock('../store/sfxStore', () => ({
  useSfxStore: () => mocks.store,
}));

vi.mock('../services', () => ({
  sfxBusinessService: {
    sfxService: {
      getCategories: mocks.getCategories,
    },
  },
}));

vi.mock('./SfxModelSelector', () => ({
  SfxModelSelector: ({ value }: { value: string }) =>
    React.createElement('div', { 'data-testid': 'sfx-model-selector' }, value),
}));

import { SfxLeftGeneratorPanel } from './SfxLeftGeneratorPanel';

describe('SfxLeftGeneratorPanel', () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  beforeEach(() => {
    mocks.store.config = {
      prompt: '',
      duration: 5,
      model: 'eleven-labs-sfx',
      mediaType: 'audio',
    };
    mocks.store.isGenerating = false;
    mocks.store.setConfig.mockClear();
    mocks.store.generate.mockClear();
    mocks.getCategories.mockClear();

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

  it('loads remote sound-effect categories and renders them as prompt suggestions', async () => {
    await act(async () => {
      root = createRoot(container!);
      root.render(<SfxLeftGeneratorPanel />);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mocks.getCategories).toHaveBeenCalledTimes(1);

    const whooshButton = Array.from(container!.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Whoosh')
    );

    expect(whooshButton).toBeTruthy();
  });

  it('applies the selected category name into the prompt config', async () => {
    await act(async () => {
      root = createRoot(container!);
      root.render(<SfxLeftGeneratorPanel />);
      await Promise.resolve();
      await Promise.resolve();
    });

    const whooshButton = Array.from(container!.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Whoosh')
    );

    expect(whooshButton).toBeTruthy();

    await act(async () => {
      whooshButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(mocks.store.setConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: 'Whoosh',
      })
    );
  });
});
