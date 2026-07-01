import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  listGenerationCatalogModels: vi.fn(),
  listGenerationCatalogProviders: vi.fn(),
  listGenerationCatalogStyles: vi.fn(),
  listGenerationCatalogVoices: vi.fn(),
}));

vi.mock('../src/services/creationServerClient', () => ({
  getCreationServerClient: () => ({
    listGenerationCatalogModels: mocks.listGenerationCatalogModels,
    listGenerationCatalogProviders: mocks.listGenerationCatalogProviders,
    listGenerationCatalogStyles: mocks.listGenerationCatalogStyles,
    listGenerationCatalogVoices: mocks.listGenerationCatalogVoices,
  }),
}));

describe('generationCatalogService', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('maps canonical generation catalog providers into model selector providers', async () => {
    mocks.listGenerationCatalogProviders.mockResolvedValue({
      items: [
        {
          id: 'volcengine',
          name: 'Volcengine',
          models: [
            {
              id: 'seedance-pro',
              name: 'Seedance Pro',
              description: 'Video model',
              capabilities: {
                supportsMultimodal: true,
              },
            },
          ],
        },
      ],
    });

    const {
      fetchGenerationCatalogProviders,
    } = await import('../src/services/generationCatalogService');

    await expect(fetchGenerationCatalogProviders('video')).resolves.toEqual([
      {
        id: 'volcengine',
        name: 'Volcengine',
        icon: null,
        models: [
          {
            id: 'seedance-pro',
            name: 'Seedance Pro',
            description: 'Video model',
            badge: 'Multi',
            badgeColor: 'bg-blue-500',
          },
        ],
      },
    ]);
  });

  it('fails closed instead of returning fallback providers when provider loading fails', async () => {
    const legacyProviders = [
      {
        id: 'fallback',
        name: 'Fallback',
        icon: null,
        models: [{ id: 'fallback-model', name: 'Fallback Model' }],
      },
    ];

    mocks.listGenerationCatalogProviders.mockRejectedValueOnce(new Error('catalog unavailable'));

    const {
      fetchGenerationCatalogProviders,
    } = await import('../src/services/generationCatalogService');

    await expect(
      fetchGenerationCatalogProviders('video', legacyProviders),
    ).rejects.toThrow('catalog unavailable');
  });
});
