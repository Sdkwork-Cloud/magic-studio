import { access, readFile } from 'node:fs/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createRuntimeMagicStudioServerClient: vi.fn(),
  optimizePrompt: vi.fn(),
  readDefaultPlatformRuntime: vi.fn(() => 'server'),
}));

vi.mock('@sdkwork/magic-studio-core/sdk', () => ({
  createRuntimeMagicStudioServerClient:
    mocks.createRuntimeMagicStudioServerClient,
  readDefaultPlatformRuntime: mocks.readDefaultPlatformRuntime,
}));

import { enhanceAgentSystemPrompt } from '../src/services/settingsPromptService';

describe('settingsPromptService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createRuntimeMagicStudioServerClient.mockReturnValue({
      optimizePrompt: mocks.optimizePrompt,
    });
  });

  it('routes agent system prompt enhancement through the runtime server optimizePrompt endpoint', async () => {
    mocks.optimizePrompt.mockResolvedValue({
      requestId: 'request-settings-prompt',
      timestamp: '2026-04-25T00:00:00.000Z',
      data: {
        originalInput: 'You are a careful coding agent.',
        optimizedPrompt: 'enhanced:You are a careful coding agent.',
        suggestions: [],
        keywords: [],
      },
      meta: {
        version: '2026-04-25',
      },
    });

    const enhanced = await enhanceAgentSystemPrompt(
      'You are a careful coding agent.',
    );

    expect(mocks.readDefaultPlatformRuntime).toHaveBeenCalledWith(
      'SettingsPromptService',
    );
    expect(mocks.createRuntimeMagicStudioServerClient).toHaveBeenCalledWith(
      'server',
    );
    expect(mocks.optimizePrompt).toHaveBeenCalledWith({
      prompt: 'You are a careful coding agent.',
      scene: 'agent-system-prompt',
      maxWords: 400,
    });
    expect(enhanced).toBe('enhanced:You are a careful coding agent.');
  });

  it('propagates server enhancement failures instead of returning the original prompt', async () => {
    mocks.optimizePrompt.mockRejectedValue(new Error('enhance failed'));

    await expect(enhanceAgentSystemPrompt('You are a planner.')).rejects.toThrow(
      'enhance failed',
    );
  });

  it('rejects empty server enhancement output instead of silently accepting a fallback', async () => {
    mocks.optimizePrompt.mockResolvedValue({
      requestId: 'request-settings-prompt',
      timestamp: '2026-04-25T00:00:00.000Z',
      data: {
        originalInput: 'You are a planner.',
        optimizedPrompt: '   ',
        suggestions: [],
        keywords: [],
      },
      meta: {
        version: '2026-04-25',
      },
    });

    await expect(enhanceAgentSystemPrompt('You are a planner.')).rejects.toThrow(
      'empty optimized prompt',
    );
  });

  it('skips enhancement when the prompt is blank', async () => {
    const enhanced = await enhanceAgentSystemPrompt('   ');

    expect(mocks.optimizePrompt).not.toHaveBeenCalled();
    expect(enhanced).toBe('   ');
  });

  it('keeps the contract guard on the runtime server prompt boundary', async () => {
    const source = await readFile(
      new URL(
        '../src/services/settingsPromptService.contract-typecheck.ts',
        import.meta.url,
      ),
      'utf8',
    );

    expect(source.includes(`spring-ai-plus-${'app'}-api/sdkwork-sdk-${'app'}`)).toBe(
      false,
    );
    expect(source.includes("from '@sdkwork/magic-studio-server'")).toBe(true);
  });

  it('ships a settings prompt contract typecheck guard for server contract drift', async () => {
    await expect(
      access(
        new URL(
          '../src/services/settingsPromptService.contract-typecheck.ts',
          import.meta.url,
        ),
      ),
    ).resolves.toBeUndefined();
  });

  it('ships a dedicated settings contract tsconfig', async () => {
    await expect(
      access(
        new URL('../tsconfig.contract.json', import.meta.url),
      ),
    ).resolves.toBeUndefined();
  });
});
