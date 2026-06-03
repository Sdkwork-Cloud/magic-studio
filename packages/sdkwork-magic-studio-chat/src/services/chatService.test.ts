import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGenAIService } = vi.hoisted(() => ({
  mockGenAIService: {
    isConfigured: vi.fn(),
    streamChat: vi.fn(),
  },
}));

vi.mock('@sdkwork/magic-studio-core/ai', () => ({
  genAIService: mockGenAIService,
}));

vi.mock('@sdkwork/magic-studio-core/sdk', () => ({
  createRuntimeMagicStudioServerClient: vi.fn(),
  isMagicStudioServerRuntimeSupported: vi.fn(() => true),
  readDefaultPlatformRuntime: vi.fn(() => ({
    system: {
      kind: () => 'web',
    },
  })),
}));

describe('ChatService streamResponse', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fails closed when the AI service is not configured', async () => {
    mockGenAIService.isConfigured.mockReturnValue(false);
    const { ChatService } = await import('./chatService');
    const service = new ChatService();
    const chunks: string[] = [];

    await expect(
      service.streamResponse('hello', (chunk) => chunks.push(chunk)),
    ).rejects.toThrow('Chat AI service is not configured');

    expect(chunks).toEqual([]);
    expect(mockGenAIService.streamChat).not.toHaveBeenCalled();
  });

  it('streams through the configured AI service without adding mock content', async () => {
    mockGenAIService.isConfigured.mockReturnValue(true);
    mockGenAIService.streamChat.mockImplementation(
      async (_history: unknown, _context: string, onChunk: (chunk: string) => void) => {
        onChunk('real');
      },
    );
    const { ChatService } = await import('./chatService');
    const service = new ChatService();
    const chunks: string[] = [];

    await service.streamResponse('hello', (chunk) => chunks.push(chunk), 'context');

    expect(chunks).toEqual(['real']);
    expect(mockGenAIService.streamChat).toHaveBeenCalledWith(
      [{ role: 'user', text: 'hello' }],
      'context',
      expect.any(Function),
    );
  });
});
