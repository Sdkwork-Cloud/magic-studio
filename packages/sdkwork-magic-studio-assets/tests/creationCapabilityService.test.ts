import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MagicStudioServerClientError } from '@sdkwork/magic-studio-server';

const mockReadCreationCapabilities = vi.fn();

vi.mock('../src/services/creationServerClient', () => ({
  getCreationServerClient: () => ({
    readCreationCapabilities: mockReadCreationCapabilities,
  }),
}));

describe('creationCapabilityService', () => {
  beforeEach(() => {
    vi.resetModules();
    mockReadCreationCapabilities.mockReset();
  });

  it('maps creation capabilities into portal-friendly model providers and options', async () => {
    mockReadCreationCapabilities.mockResolvedValue({
      requestId: 'req-1',
      timestamp: '2026-04-22T00:00:00.000Z',
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
      meta: {
        version: 'v1',
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
    mockReadCreationCapabilities.mockResolvedValue({
      requestId: 'req-2',
      timestamp: '2026-04-22T00:00:00.000Z',
      data: {
        target: 'video',
        channels: [],
        styleOptions: [],
      },
      meta: {
        version: 'v1',
      },
    });

    const {
      clearCreationCapabilityCache,
      fetchCreationCapabilities,
    } = await import('../src/services/creationCapabilityService');

    clearCreationCapabilityCache();
    await fetchCreationCapabilities('video');
    await fetchCreationCapabilities('video');

    expect(mockReadCreationCapabilities).toHaveBeenCalledTimes(1);
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

  it('loads model providers from creation capabilities and fails closed when loading fails', async () => {
    const legacyProviders = [
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
    mockReadCreationCapabilities.mockResolvedValueOnce({
      requestId: 'req-3',
      timestamp: '2026-04-22T00:00:00.000Z',
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
      meta: {
        version: 'v1',
      },
    });

    const liveProviders = await fetchCreationModelProviders('music', legacyProviders);
    expect(liveProviders).toHaveLength(1);
    expect(liveProviders[0]?.models[0]?.id).toBe('music-master');

    clearCreationCapabilityCache('music');
    mockReadCreationCapabilities.mockRejectedValueOnce(new Error('network'));
    await expect(fetchCreationModelProviders('music', legacyProviders)).rejects.toThrow('network');
  });

  it('throws when the canonical server reports 401 and refetches successfully afterwards', async () => {
    const {
      clearCreationCapabilityCache,
      fetchCreationCapabilities,
    } = await import('../src/services/creationCapabilityService');

    clearCreationCapabilityCache();
    mockReadCreationCapabilities.mockRejectedValueOnce(
      new MagicStudioServerClientError('unauthorized', {
        status: 401,
        code: 'UNAUTHORIZED',
      }),
    );

    await expect(fetchCreationCapabilities('video')).rejects.toThrow('unauthorized');

    mockReadCreationCapabilities.mockResolvedValueOnce({
      requestId: 'req-4',
      timestamp: '2026-04-22T00:00:00.000Z',
      data: {
        target: 'video',
        channels: [
          {
            channel: 'VOLCENGINE',
            name: 'Volcengine',
            models: [
              {
                model: 'film-master',
                name: 'Film Master',
              },
            ],
          },
        ],
        styleOptions: [],
      },
      meta: {
        version: 'v1',
      },
    });

    await expect(fetchCreationCapabilities('video')).resolves.toEqual({
      target: 'video',
      channels: [
        {
          channel: 'VOLCENGINE',
          name: 'Volcengine',
          models: [
            {
              model: 'film-master',
              name: 'Film Master',
            },
          ],
        },
      ],
      styleOptions: [],
    });
    expect(mockReadCreationCapabilities).toHaveBeenCalledTimes(2);
  });

  it('throws the canonical server error when readCreationCapabilities fails', async () => {
    const {
      clearCreationCapabilityCache,
      fetchCreationCapabilities,
    } = await import('../src/services/creationCapabilityService');

    clearCreationCapabilityCache();
    mockReadCreationCapabilities.mockRejectedValueOnce(new Error('creation capabilities failed'));

    await expect(fetchCreationCapabilities('video')).rejects.toThrow(
      'creation capabilities failed',
    );
  });
});
