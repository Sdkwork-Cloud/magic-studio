import { access } from 'node:fs/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockCreateRuntimeMagicStudioServerClient,
  mockReadDefaultPlatformRuntime,
  mockServerClient,
} = vi.hoisted(() => {
  const mockServerClient = {
    optimizePrompt: vi.fn(),
  };
  return {
    mockCreateRuntimeMagicStudioServerClient: vi.fn(() => mockServerClient),
    mockReadDefaultPlatformRuntime: vi.fn(),
    mockServerClient,
  };
});

vi.mock('@sdkwork/magic-studio-core/sdk', () => ({
  createRuntimeMagicStudioServerClient: mockCreateRuntimeMagicStudioServerClient,
  readDefaultPlatformRuntime: mockReadDefaultPlatformRuntime,
}));

describe('promptBusinessService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReadDefaultPlatformRuntime.mockReturnValue({
      system: {
        kind: () => 'web',
      },
    });
    mockCreateRuntimeMagicStudioServerClient.mockReturnValue(mockServerClient);
  });

  it('routes prompt optimization through the canonical runtime server client', async () => {
    mockServerClient.optimizePrompt.mockResolvedValue({
      data: {
        originalInput: 'a cinematic mountain lake at sunrise',
        optimizedPrompt: 'enhanced mountain lake prompt',
        suggestions: ['Add focal subject details for stronger composition.'],
        keywords: ['cinematic', 'mountain', 'lake'],
      },
    });

    const { promptBusinessService } = await import('./promptBusinessService');

    const result = await promptBusinessService.optimizePrompt({
      type: 'image',
      mode: 'text-to-prompt',
      inputText: 'a cinematic mountain lake at sunrise',
      targetStyle: 'cinematic',
      additionalInstructions: 'add volumetric sunrise light',
    });

    expect(mockReadDefaultPlatformRuntime).toHaveBeenCalledWith('PromptBusinessService');
    expect(mockCreateRuntimeMagicStudioServerClient).toHaveBeenCalledWith({
      system: {
        kind: expect.any(Function),
      },
    });
    expect(mockServerClient.optimizePrompt).toHaveBeenCalledTimes(1);
    expect(mockServerClient.optimizePrompt).toHaveBeenCalledWith({
      prompt: 'a cinematic mountain lake at sunrise',
      type: 'image',
      mode: 'text-to-prompt',
      targetStyle: 'cinematic',
      additionalInstructions: 'add volumetric sunrise light',
      inputImageName: undefined,
      inputImageUrl: undefined,
      inputVideoName: undefined,
      inputVideoUrl: undefined,
      maxWords: 180,
    });
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      id: null,
      uuid: expect.any(String),
      type: 'image',
      mode: 'text-to-prompt',
      originalInput: 'a cinematic mountain lake at sunrise',
      optimizedPrompt: 'enhanced mountain lake prompt',
      suggestions: ['Add focal subject details for stronger composition.'],
    });
  });

  it('fails closed when the canonical prompt optimization endpoint is unavailable', async () => {
    mockServerClient.optimizePrompt.mockRejectedValue(new Error('404 Not Found'));
    const { promptBusinessService } = await import('./promptBusinessService');

    const result = await promptBusinessService.optimizePrompt({
      type: 'image',
      mode: 'text-to-prompt',
      inputText: 'a cinematic mountain lake at sunrise',
    });

    expect(result.success).toBe(false);
    expect(result.message).toBe('404 Not Found');
  });

  it('ships a prompt business contract typecheck guard for Magic Studio server drift', async () => {
    await expect(
      access(
        new URL('./promptBusinessService.contract-typecheck.ts', import.meta.url),
      ),
    ).resolves.toBeUndefined();
  });

  it('ships a dedicated prompt contract tsconfig', async () => {
    await expect(
      access(
        new URL('../../tsconfig.contract.json', import.meta.url),
      ),
    ).resolves.toBeUndefined();
  });
});
