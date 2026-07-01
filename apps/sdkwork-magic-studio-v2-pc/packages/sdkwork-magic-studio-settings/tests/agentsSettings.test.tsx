/** @vitest-environment jsdom */

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  updateSettings: vi.fn(async () => undefined),
  enhanceAgentSystemPrompt: vi.fn(async (text: string) => `enhanced:${text}`),
  legacyEnhancePrompt: vi.fn(async (text: string) => `legacy:${text}`),
}));

vi.mock('../src/store/settingsStore', () => ({
  useSettingsStore: () => ({
    settings: {
      agents: {
        'agent-1': {
          id: 'agent-1',
          name: 'Agent One',
          enabled: true,
          model: 'gpt-4o',
          systemPrompt: 'You are a helpful assistant.',
          temperature: 0.7,
          tools: [],
        },
      },
      mcp: {},
      skills: {},
    },
    updateSettings: mocks.updateSettings,
  }),
}));

vi.mock('../src/services/settingsPromptService', () => ({
  enhanceAgentSystemPrompt: mocks.enhanceAgentSystemPrompt,
}));

vi.mock('@sdkwork/magic-studio-core', () => ({
  genAIService: {
    enhancePrompt: mocks.legacyEnhancePrompt,
  },
}));

vi.mock('@sdkwork/magic-studio-i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../src/components/SettingsWidgets', () => ({
  SettingsSection: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SettingInput: () => null,
  SettingSelect: () => null,
  SettingSlider: () => null,
}));

import { AgentsSettings } from '../src/components/AgentsSettings';

describe('AgentsSettings', () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  beforeEach(() => {
    mocks.updateSettings.mockClear();
    mocks.enhanceAgentSystemPrompt.mockReset();
    mocks.enhanceAgentSystemPrompt.mockResolvedValue('enhanced:You are a helpful assistant.');
    mocks.legacyEnhancePrompt.mockReset();
    mocks.legacyEnhancePrompt.mockResolvedValue('legacy:You are a helpful assistant.');

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

  it('routes system prompt enhancement through settingsPromptService instead of genAIService', async () => {
    await act(async () => {
      root = createRoot(container!);
      root.render(<AgentsSettings />);
    });

    const agentCard = Array.from(container?.querySelectorAll('h3') || []).find(
      (node) => node.textContent === 'Agent One'
    )?.closest('div[class]');
    expect(agentCard).toBeTruthy();

    await act(async () => {
      (agentCard as HTMLDivElement).click();
      await Promise.resolve();
    });

    const button = container?.querySelector('[data-testid="enhance-trigger"]') as HTMLButtonElement;
    expect(button).toBeTruthy();

    await act(async () => {
      button.click();
      await Promise.resolve();
    });

    expect(mocks.enhanceAgentSystemPrompt).toHaveBeenCalledWith('You are a helpful assistant.');
    expect(mocks.legacyEnhancePrompt).not.toHaveBeenCalled();
    expect(mocks.updateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        agents: expect.objectContaining({
          'agent-1': expect.objectContaining({
            systemPrompt: 'enhanced:You are a helpful assistant.',
          }),
        }),
      })
    );
  });

  it('does not save a fallback prompt when enhancement fails', async () => {
    mocks.enhanceAgentSystemPrompt.mockRejectedValue(new Error('enhance failed'));

    await act(async () => {
      root = createRoot(container!);
      root.render(<AgentsSettings />);
    });

    const agentCard = Array.from(container?.querySelectorAll('h3') || []).find(
      (node) => node.textContent === 'Agent One'
    )?.closest('div[class]');
    expect(agentCard).toBeTruthy();

    await act(async () => {
      (agentCard as HTMLDivElement).click();
      await Promise.resolve();
    });

    const button = container?.querySelector('[data-testid="enhance-trigger"]') as HTMLButtonElement;
    expect(button).toBeTruthy();

    await act(async () => {
      button.click();
      await Promise.resolve();
    });

    expect(mocks.enhanceAgentSystemPrompt).toHaveBeenCalledWith('You are a helpful assistant.');
    expect(mocks.updateSettings).not.toHaveBeenCalled();
    expect(container?.textContent).toContain('settings.agents.enhance_failed');
  });
});
