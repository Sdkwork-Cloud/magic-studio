/** @vitest-environment jsdom */

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  GenerationChatWindow,
  type GenerationChatWindowAdapter,
  type GenerationConfig,
} from '../src/components/generate/GenerationChatWindow';

const PromptHarness: React.FC<{ onGenerate: () => Promise<void> | void }> = ({ onGenerate }) => {
  const [config, setConfig] = React.useState<GenerationConfig>({
    prompt: 'Seed prompt',
  });

  return (
    <div>
      <button type="button" data-testid="reuse-prompt" onClick={() => setConfig({ prompt: 'Reused prompt' })}>
        reuse
      </button>
      <output data-testid="config-prompt">{config.prompt || ''}</output>
      <GenerationChatWindow
        mode="image"
        title="Image Studio Chat"
        onNavigateBack={() => {}}
        history={[]}
        isGenerating={false}
        onDelete={() => {}}
        onReuse={() => {}}
        config={config}
        setConfig={(patch) => setConfig((current) => ({ ...current, ...patch }))}
        onGenerate={onGenerate}
      />
    </div>
  );
};

interface TextPromptConfig {
  text: string;
}

interface TextPromptTask {
  id: string | null;
  uuid: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  config: TextPromptConfig;
}

const TEXT_PROMPT_ADAPTER: GenerationChatWindowAdapter<TextPromptConfig, TextPromptTask> = {
  getConfigPrompt: (config) => config.text,
  getTaskPrompt: (task) => task.config.text,
  createPromptPatch: (text) => ({ text }),
};

const TextHarness: React.FC<{ onGenerate: () => Promise<void> | void }> = ({ onGenerate }) => {
  const [config, setConfig] = React.useState<TextPromptConfig>({
    text: 'Seed text',
  });

  return (
    <div>
      <button type="button" data-testid="reuse-text" onClick={() => setConfig({ text: 'Reused text' })}>
        reuse
      </button>
      <output data-testid="config-text">{config.text}</output>
      <GenerationChatWindow
        mode="voice"
        title="Voice Lab Chat"
        onNavigateBack={() => {}}
        history={[]}
        isGenerating={false}
        onDelete={() => {}}
        onReuse={() => {}}
        config={config}
        setConfig={(patch) => setConfig((current) => ({ ...current, ...patch }))}
        onGenerate={onGenerate}
        adapter={TEXT_PROMPT_ADAPTER}
      />
    </div>
  );
};

describe('GenerationChatWindow prompt control', () => {
  let container: HTMLDivElement;
  let root: Root | null;
  let scrollIntoViewSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
      true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = null;
    scrollIntoViewSpy = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoViewSpy;
  });

  afterEach(async () => {
    await act(async () => {
      root?.unmount();
    });
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('treats config.prompt as the single source of truth and clears it after generate', async () => {
    const onGenerate = vi.fn();

    await act(async () => {
      root = createRoot(container);
      root.render(<PromptHarness onGenerate={onGenerate} />);
    });

    const promptInput = container.querySelector('input[type="text"]') as HTMLInputElement | null;
    expect(promptInput?.value).toBe('Seed prompt');
    expect(container.querySelector('[data-testid="config-prompt"]')?.textContent).toBe('Seed prompt');

    const reuseButton = container.querySelector('[data-testid="reuse-prompt"]') as HTMLButtonElement | null;
    await act(async () => {
      reuseButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(promptInput?.value).toBe('Reused prompt');

    await act(async () => {
      if (promptInput) {
        const valueSetter = Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          'value'
        )?.set;
        valueSetter?.call(promptInput, 'Edited prompt');
        promptInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    expect(promptInput?.value).toBe('Edited prompt');
    expect(container.querySelector('[data-testid="config-prompt"]')?.textContent).toBe('Edited prompt');

    const generateButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Generate')
    );
    expect(generateButton).toBeTruthy();

    await act(async () => {
      generateButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onGenerate).toHaveBeenCalledTimes(1);
    expect(promptInput?.value).toBe('');
    expect(container.querySelector('[data-testid="config-prompt"]')?.textContent).toBe('');
  });

  it('supports adapter-defined prompt fields without prompt-specific casts', async () => {
    const onGenerate = vi.fn();

    await act(async () => {
      root = createRoot(container);
      root.render(<TextHarness onGenerate={onGenerate} />);
    });

    const promptInput = container.querySelector('input[type="text"]') as HTMLInputElement | null;
    expect(promptInput?.value).toBe('Seed text');
    expect(container.querySelector('[data-testid="config-text"]')?.textContent).toBe('Seed text');

    const reuseButton = container.querySelector('[data-testid="reuse-text"]') as HTMLButtonElement | null;
    await act(async () => {
      reuseButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(promptInput?.value).toBe('Reused text');

    await act(async () => {
      if (promptInput) {
        const valueSetter = Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          'value'
        )?.set;
        valueSetter?.call(promptInput, 'Edited text');
        promptInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    expect(promptInput?.value).toBe('Edited text');
    expect(container.querySelector('[data-testid="config-text"]')?.textContent).toBe('Edited text');

    const generateButton = Array.from(container.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Generate')
    );
    expect(generateButton).toBeTruthy();

    await act(async () => {
      generateButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onGenerate).toHaveBeenCalledTimes(1);
    expect(promptInput?.value).toBe('');
    expect(container.querySelector('[data-testid="config-text"]')?.textContent).toBe('');
  });
});
