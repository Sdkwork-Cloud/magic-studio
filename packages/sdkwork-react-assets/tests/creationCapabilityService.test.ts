import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetCreationCapabilities = vi.fn();

vi.mock('@sdkwork/react-core', () => ({
  getSdkworkClient: () => ({
    model: {
      getCreationCapabilities: mockGetCreationCapabilities,
    },
  }),
}));

describe('creationCapabilityService', () => {
  beforeEach(() => {
    vi.resetModules();
    mockGetCreationCapabilities.mockReset();
  });

  it('maps creation capabilities into portal-friendly model providers and options', async () => {
    mockGetCreationCapabilities.mockResolvedValue({
      code: '2000',
      msg: 'ok',
      data: {
        target: 'short_drama',
        channels: [
          {
            channel: 'VOLCENGINE',
            name: 'Volcengine',
            models: [
              {
                model: 'film-master',
                name: 'Film Master',
                description: 'Narrative video model',
                capabilities: {
                  durationOptions: [
                    { value: '5s', label: '5s' },
                    { value: '10s', label: '10s' },
                  ],
                  resolutionOptions: [
                    { value: '1080p', label: '1080p' },
                    { value: '4k', label: '4K' },
                  ],
                  aspectRatioOptions: [
                    { value: '16:9', label: '16:9' },
                    { value: '9:16', label: '9:16' },
                  ],
                },
              },
            ],
          },
        ],
        styleOptions: [
          {
            id: 'cinematic',
            label: 'Cinematic',
            description: 'Film look',
            prompt: 'cinematic prompt',
          },
        ],
      },
    });

    const {
      fetchCreationCapabilities,
      toCreationModelProviders,
      getCreationModelDurationOptions,
      getCreationModelResolutionOptions,
      getCreationModelAspectRatioOptions,
    } = await import('../src/services/creationCapabilityService');

    const snapshot = await fetchCreationCapabilities('short_drama');
    const providers = toCreationModelProviders(snapshot);
    const durationOptions = getCreationModelDurationOptions(snapshot, 'film-master');
    const resolutionOptions = getCreationModelResolutionOptions(snapshot, 'film-master');
    const aspectRatioOptions = getCreationModelAspectRatioOptions(snapshot, 'film-master');

    expect(providers).toHaveLength(1);
    expect(providers[0]?.name).toBe('Volcengine');
    expect(providers[0]?.models[0]?.id).toBe('film-master');
    expect(snapshot.styleOptions[0]?.id).toBe('cinematic');
    expect(durationOptions).toEqual([
      { label: '5s', value: '5s' },
      { label: '10s', value: '10s' },
    ]);
    expect(resolutionOptions).toEqual([
      { label: '1080p', value: '1080p' },
      { label: '4K', value: '4k' },
    ]);
    expect(aspectRatioOptions).toEqual([
      { label: '16:9', value: '16:9' },
      { label: '9:16', value: '9:16' },
    ]);
  });

  it('reuses cached creation capability responses per target', async () => {
    mockGetCreationCapabilities.mockResolvedValue({
      code: '2000',
      msg: 'ok',
      data: {
        target: 'video',
        channels: [],
        styleOptions: [],
      },
    });

    const {
      clearCreationCapabilityCache,
      fetchCreationCapabilities,
    } = await import('../src/services/creationCapabilityService');

    clearCreationCapabilityCache();
    await fetchCreationCapabilities('video');
    await fetchCreationCapabilities('video');

    expect(mockGetCreationCapabilities).toHaveBeenCalledTimes(1);
  });

  it('returns an anonymous-safe fallback snapshot when capability loading is unauthorized', async () => {
    mockGetCreationCapabilities.mockRejectedValueOnce(
      Object.assign(new Error('未授权'), {
        name: 'BusinessError',
        code: 'BUSINESS_ERROR',
        businessCode: '401',
      }),
    );

    const {
      clearCreationCapabilityCache,
      fetchCreationCapabilities,
      resolveCreationStyleOptions,
    } = await import('../src/services/creationCapabilityService');

    clearCreationCapabilityCache();
    const snapshot = await fetchCreationCapabilities('short_drama');

    expect(snapshot).toEqual({
      target: 'short_drama',
      channels: [],
      styleOptions: [],
    });
    expect(resolveCreationStyleOptions(snapshot).some((option) => option.id === 'cinematic')).toBe(true);
  });

  it('resolves shared portal defaults when a model has no explicit capability options', async () => {
    const {
      resolveCreationEntryCapabilityOptions,
    } = await import('../src/services/creationCapabilityService');

    const options = resolveCreationEntryCapabilityOptions(
      {
        target: 'short_drama',
        channels: [
          {
            channel: 'VOLCENGINE',
            name: 'Volcengine',
            models: [
              {
                model: 'film-master',
                name: 'Film Master',
                capabilities: {},
              },
            ],
          },
        ],
        styleOptions: [],
      },
      'film-master',
    );

    expect(options.durationOptions).toEqual([
      { label: '5s', value: '5s' },
      { label: '10s', value: '10s' },
      { label: '15s', value: '15s' },
      { label: '60s', value: '60s' },
    ]);
    expect(options.resolutionOptions).toEqual([
      { label: '2K', value: '2k' },
      { label: '4K', value: '4k' },
    ]);
    expect(options.aspectRatioOptions[0]).toEqual({ label: '21:9', value: '21:9' });
    expect(options.aspectRatioOptions[7]).toEqual({ label: '9:16', value: '9:16' });
  });

  it('falls back to shared short-drama styles when the capability snapshot has none', async () => {
    const {
      resolveCreationStyleOptions,
    } = await import('../src/services/creationCapabilityService');

    const options = resolveCreationStyleOptions({
      target: 'short_drama',
      channels: [],
      styleOptions: [],
    });

    expect(options.length).toBeGreaterThan(1);
    expect(options[0]?.id).toBe('cinematic');
    expect(options.some((option) => option.id === 'custom')).toBe(true);
  });

  it('loads model providers from creation capabilities and falls back when loading fails', async () => {
    const fallbackProviders = [
      {
        id: 'fallback',
        name: 'Fallback',
        icon: null,
        models: [{ id: 'fallback-model', name: 'Fallback Model' }],
      },
    ];

    const {
      clearCreationCapabilityCache,
      fetchCreationModelProviders,
    } = await import('../src/services/creationCapabilityService');

    clearCreationCapabilityCache();
    mockGetCreationCapabilities.mockResolvedValueOnce({
      code: '2000',
      msg: 'ok',
      data: {
        target: 'music',
        channels: [
          {
            channel: 'VOLCENGINE',
            name: 'Volcengine',
            models: [
              {
                model: 'music-master',
                name: 'Music Master',
              },
            ],
          },
        ],
        styleOptions: [],
      },
    });

    const liveProviders = await fetchCreationModelProviders('music', fallbackProviders);
    expect(liveProviders).toHaveLength(1);
    expect(liveProviders[0]?.models[0]?.id).toBe('music-master');

    clearCreationCapabilityCache('music');
    mockGetCreationCapabilities.mockRejectedValueOnce(new Error('network'));
    const recoveredProviders = await fetchCreationModelProviders('music', fallbackProviders);
    expect(recoveredProviders).toEqual(fallbackProviders);
  });
});
