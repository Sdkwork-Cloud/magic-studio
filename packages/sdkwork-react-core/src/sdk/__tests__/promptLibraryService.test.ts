import { afterEach, describe, expect, it, vi } from 'vitest';

const defaultPromptApi = {
  getPromptDetail: vi.fn(async (id: string | number) => ({
    code: '2000',
    data: {
      id,
      title: 'Detailed Storyboard',
      content: 'detailed storyboard prompt',
      type: 'USER',
      bizType: 'VIDEO',
      isFavorite: false,
      favoriteCount: 1,
      usageCount: 12,
      enabled: true,
      parameters: {
        mood: 'cinematic',
      },
      version: 'v2',
    },
  })),
  listPrompts: vi.fn(async () => ({
    code: '2000',
    data: {
      content: [
        {
          id: 3,
          title: 'Storyboard',
          content: 'cinematic storyboard prompt',
          type: 'USER',
          bizType: 'VIDEO',
          isFavorite: true,
          favoriteCount: 8,
          usageCount: 21,
        },
      ],
      totalElements: 1,
      size: 10,
      number: 0,
    },
  })),
  listPromptHistory: vi.fn(async () => ({
    code: '2000',
    data: {
      content: [],
      totalElements: 0,
      size: 10,
      number: 0,
    },
  })),
  getPromptHistoryDetail: vi.fn(async (id: string | number) => ({
    code: '2000',
    data: {
      id,
      promptId: 3,
      promptTitle: 'Storyboard',
      promptContent: 'cinematic storyboard prompt',
      usedContent: 'expanded storyboard prompt',
      model: 'gpt-video',
      duration: 456,
      inputTokens: 128,
      outputTokens: 512,
      success: true,
    },
  })),
  deletePromptHistory: vi.fn(async () => ({
    code: '2000',
  })),
};

const scopedPromptApi = {
  listPrompts: vi.fn(async () => ({
    code: '2000',
    data: {
      content: [],
      totalElements: 0,
      size: 5,
      number: 0,
    },
  })),
  listPromptHistory: vi.fn(async () => ({
    code: '2000',
    data: {
      content: [
        {
          id: 7,
          promptId: 3,
          promptTitle: 'Storyboard',
          promptContent: 'cinematic storyboard prompt',
          usedContent: 'expanded storyboard prompt',
          model: 'gpt-video',
        },
      ],
      totalElements: 1,
      size: 5,
      number: 0,
    },
  })),
};

const createScopedAppSdkClient = vi.fn(() => ({
  prompt: scopedPromptApi,
}));

vi.mock('../useAppSdkClient', () => ({
  createScopedAppSdkClient,
  getAppSdkClientWithSession: vi.fn(() => ({
    prompt: defaultPromptApi,
  })),
}));

describe('promptLibraryService', () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('loads prompt library entries from the official prompt sdk and normalizes them', async () => {
    const { promptLibraryService } = await import('../promptLibraryService');

    const page = await promptLibraryService.listPrompts({
      bizType: 'VIDEO',
      size: 10,
    });

    expect(defaultPromptApi.listPrompts).toHaveBeenCalledWith(
      expect.objectContaining({
        bizType: 'VIDEO',
        pageNum: 1,
        pageSize: 10,
      })
    );
    expect(page.items).toHaveLength(1);
    expect(page.items[0]).toMatchObject({
      id: '3',
      title: 'Storyboard',
      content: 'cinematic storyboard prompt',
      bizType: 'VIDEO',
      type: 'USER',
      isFavorite: true,
      favoriteCount: 8,
      usageCount: 21,
    });
  });

  it('uses a scoped sdk client when loading prompt history for another instance', async () => {
    const { promptLibraryService } = await import('../promptLibraryService');

    const page = await promptLibraryService.listPromptHistory({
      size: 5,
      instance: {
        baseUrl: 'https://tenant-b.example.com',
        tenantId: 'tenant-b',
      },
    });

    expect(createScopedAppSdkClient).toHaveBeenCalledWith(
      expect.objectContaining({
        baseUrl: 'https://tenant-b.example.com',
        tenantId: 'tenant-b',
      })
    );
    expect(scopedPromptApi.listPromptHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        pageNum: 1,
        pageSize: 5,
      })
    );
    expect(page.items[0]).toMatchObject({
      id: '7',
      promptId: '3',
      title: 'Storyboard',
      content: 'expanded storyboard prompt',
      promptContent: 'cinematic storyboard prompt',
      usedContent: 'expanded storyboard prompt',
      model: 'gpt-video',
      success: undefined,
    });
  });

  it('exposes prompt detail and prompt history detail helpers from the wrapped prompt sdk', async () => {
    const { promptLibraryService } = await import('../promptLibraryService');

    const detail = await promptLibraryService.getPromptDetail(5);
    const historyDetail = await promptLibraryService.getPromptHistoryDetail(11);

    expect(defaultPromptApi.getPromptDetail).toHaveBeenCalledWith(5);
    expect(defaultPromptApi.getPromptHistoryDetail).toHaveBeenCalledWith(11);
    expect(detail).toMatchObject({
      id: '5',
      title: 'Detailed Storyboard',
      bizType: 'VIDEO',
      enabled: true,
      version: 'v2',
      parameters: {
        mood: 'cinematic',
      },
    });
    expect(historyDetail).toMatchObject({
      id: '11',
      promptId: '3',
      duration: 456,
      inputTokens: 128,
      outputTokens: 512,
      success: true,
    });
  });

  it('supports deleting prompt history entries through the wrapped prompt sdk', async () => {
    const { promptLibraryService } = await import('../promptLibraryService');

    await promptLibraryService.deletePromptHistory(19);

    expect(defaultPromptApi.deletePromptHistory).toHaveBeenCalledWith(19);
  });
});
