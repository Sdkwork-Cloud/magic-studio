/** @vitest-environment jsdom */

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createGeneratedMusicResult, createMusicTask } from '../entities';

const mocks = vi.hoisted(() => ({
  persistGenerationOutcomeAsset: vi.fn(),
  findAll: vi.fn(async () => ({
    success: true,
    data: {
      content: [],
    },
  })),
  save: vi.fn(async () => undefined),
  deleteById: vi.fn(async () => undefined),
  clear: vi.fn(async () => undefined),
  toggleFavorite: vi.fn(async () => undefined),
  generateMusic: vi.fn(async () => mocks.musicOutcome),
  generateSimilar: vi.fn(async () => mocks.musicOutcome),
  remixMusic: vi.fn(async () => mocks.musicOutcome),
  extendMusic: vi.fn(async () => mocks.musicOutcome),
  musicOutcome: {
    recipe: {
      id: null,
      uuid: 'music-recipe-uuid-1',
      product: 'music',
      mode: 'text-to-music',
      prompt: 'uplifting synthwave anthem',
      instructions: 'neon lights keep calling us home',
      inputRefs: [],
      parameters: {},
    },
    execution: {
      id: null,
      uuid: 'music-execution-uuid-1',
      provider: 'app-music',
      providerModel: 'suno-v3',
      status: 'succeeded',
    },
    artifactSet: {
      id: null,
      uuid: 'music-artifact-set-uuid-1',
      artifacts: [],
    },
    delivery: {
      url: 'https://example.com/generated-music.mp3',
      posterUrl: 'https://example.com/generated-music-cover.png',
      mimeType: 'audio/mpeg',
      duration: 120,
      artifactUuid: 'music-artifact-uuid-1',
    },
    primaryArtifact: {
      id: null,
      uuid: 'music-artifact-uuid-1',
      type: 'music',
      resource: {
        id: null,
        uuid: 'music-resource-uuid-1',
        url: 'https://example.com/generated-music.mp3',
      },
    },
  },
  persistMusicGenerationResult: vi.fn(async () =>
    createGeneratedMusicResult({
      uuid: 'persisted-music-result-uuid-1',
      assetId: 'persisted-music-asset-1',
      assetUuid: 'persisted-music-asset-uuid-1',
      primaryResourceId: 'persisted-music-resource-id-1',
      primaryResourceUuid: 'persisted-music-resource-uuid-1',
      resourceViewId: 'persisted-music-resource-view-id-1',
      resourceViewUuid: 'persisted-music-resource-view-uuid-1',
      recipeUuid: 'music-recipe-uuid-1',
      executionUuid: 'music-execution-uuid-1',
      artifactSetUuid: 'music-artifact-set-uuid-1',
      artifactUuid: 'music-artifact-uuid-1',
      resource: {
        id: null,
        uuid: 'persisted-music-resource-view-uuid-1',
        assetId: 'persisted-music-asset-1',
        assetUuid: 'persisted-music-asset-uuid-1',
        primaryResourceId: 'persisted-music-resource-id-1',
        primaryResourceUuid: 'persisted-music-resource-uuid-1',
        resourceViewId: 'persisted-music-resource-view-id-1',
        resourceViewUuid: 'persisted-music-resource-view-uuid-1',
        url: 'https://storage.example.com/generated-music.mp3',
        duration: 120,
        name: 'music_gen_music-task-uuid-1.mp3',
      },
      coverResource: {
        id: null,
        uuid: 'persisted-music-cover-uuid-1',
        url: 'https://storage.example.com/generated-music-cover.png',
        name: 'generated-music-cover.png',
      },
      title: 'Night Drive',
      duration: 120,
      lyrics: 'neon lights keep calling us home',
      style: 'electronic',
    })
  ),
}));

vi.mock('../services', () => ({
  musicBusinessService: {
    musicService: {
      generateMusic: mocks.generateMusic,
      generateSimilar: mocks.generateSimilar,
      remixMusic: mocks.remixMusic,
      extendMusic: mocks.extendMusic,
    },
    musicHistoryService: {
      findAll: mocks.findAll,
      save: mocks.save,
      deleteById: mocks.deleteById,
      clear: mocks.clear,
      toggleFavorite: mocks.toggleFavorite,
    },
  },
  persistMusicGenerationResult: mocks.persistMusicGenerationResult,
}));

vi.mock('@sdkwork/magic-studio-assets', () => ({
  persistGenerationOutcomeAsset: mocks.persistGenerationOutcomeAsset,
}));

vi.mock('@sdkwork/magic-studio-commons', () => ({
  generateUUID: vi.fn(() => 'music-task-uuid-1'),
}));

import { MusicStoreProvider, useMusicStore } from './musicStore';

interface MusicStoreTestHandle {
  history: Array<Record<string, unknown>>;
  setConfig: (config: Record<string, unknown>) => void;
  generate: () => Promise<void>;
  importTask: (task: unknown) => void;
}

const StoreActionProbe = ({
  onStore,
}: {
  onStore: (store: MusicStoreTestHandle) => void;
}) => {
  const store = useMusicStore();
  onStore(store as unknown as MusicStoreTestHandle);
  return null;
};

describe('MusicStoreProvider', () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  beforeEach(() => {
    mocks.persistGenerationOutcomeAsset.mockClear();
    mocks.findAll.mockClear();
    mocks.save.mockClear();
    mocks.deleteById.mockClear();
    mocks.clear.mockClear();
    mocks.toggleFavorite.mockClear();
    mocks.generateMusic.mockClear();
    mocks.generateSimilar.mockClear();
    mocks.remixMusic.mockClear();
    mocks.extendMusic.mockClear();
    mocks.persistMusicGenerationResult.mockClear();
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

    container = document.createElement('div');
    document.body.appendChild(container);
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

  it('uses persistMusicGenerationResult for generated music results', async () => {
    let latestStore: MusicStoreTestHandle | null = null;

    await act(async () => {
      root = createRoot(container!);
      root.render(
        <MusicStoreProvider>
          <StoreActionProbe onStore={(store) => { latestStore = store; }} />
        </MusicStoreProvider>
      );
      await Promise.resolve();
    });

    await act(async () => {
      latestStore?.setConfig({
        prompt: 'uplifting synthwave anthem',
        title: 'Night Drive',
        lyrics: 'neon lights keep calling us home',
        style: 'electronic',
      });
    });

    await act(async () => {
      await latestStore?.generate();
    });

    expect(mocks.generateMusic).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: 'uplifting synthwave anthem',
        title: 'Night Drive',
        lyrics: 'neon lights keep calling us home',
        style: 'electronic',
      })
    );
    expect(mocks.persistMusicGenerationResult).toHaveBeenCalledWith({
      outcome: mocks.musicOutcome,
      name: 'music_gen_music-task-uuid-1.mp3',
      title: 'Night Drive',
      lyrics: 'neon lights keep calling us home',
      style: 'electronic',
      fallbackDuration: 180,
    });
    expect(mocks.persistGenerationOutcomeAsset).not.toHaveBeenCalled();
    expect(mocks.save).toHaveBeenLastCalledWith(
      expect.objectContaining({
        uuid: 'music-task-uuid-1',
        status: 'completed',
        results: [
          expect.objectContaining({
            uuid: 'persisted-music-result-uuid-1',
            assetId: 'persisted-music-asset-1',
          }),
        ],
      })
    );
  });

  it('routes similar mode through musicService.generateSimilar', async () => {
    let latestStore: MusicStoreTestHandle | null = null;

    await act(async () => {
      root = createRoot(container!);
      root.render(
        <MusicStoreProvider>
          <StoreActionProbe onStore={(store) => { latestStore = store; }} />
        </MusicStoreProvider>
      );
      await Promise.resolve();
    });

    await act(async () => {
      latestStore?.setConfig({
        mode: 'similar',
        sourceMusic: createGeneratedMusicResult({
          uuid: 'source-music-uuid-1',
          assetId: 'source-music-asset-1',
          resource: {
            id: null,
            uuid: 'source-music-resource-uuid-1',
            url: 'https://example.com/source-track.mp3',
            duration: 95,
            name: 'source-track.mp3',
          },
          title: 'Source Track',
          duration: 95,
          style: 'electronic',
        }),
        duration: 60,
      } as any);
    });

    await act(async () => {
      await latestStore?.generate();
    });

    expect(mocks.generateSimilar).toHaveBeenCalledWith(
      expect.objectContaining({
        source: expect.objectContaining({
          title: 'Source Track',
        }),
        duration: 60,
      })
    );
    expect(mocks.generateMusic).not.toHaveBeenCalled();
    expect(mocks.remixMusic).not.toHaveBeenCalled();
    expect(mocks.extendMusic).not.toHaveBeenCalled();
    expect(mocks.persistMusicGenerationResult).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'music_similar_music-task-uuid-1.mp3',
        title: 'Source Track Similar',
      })
    );
  });

  it('routes remix mode through musicService.remixMusic', async () => {
    let latestStore: MusicStoreTestHandle | null = null;

    await act(async () => {
      root = createRoot(container!);
      root.render(
        <MusicStoreProvider>
          <StoreActionProbe onStore={(store) => { latestStore = store; }} />
        </MusicStoreProvider>
      );
      await Promise.resolve();
    });

    await act(async () => {
      latestStore?.setConfig({
        mode: 'remix',
        style: 'jazz-funk',
        sourceMusic: createGeneratedMusicResult({
          uuid: 'source-music-uuid-2',
          resource: {
            id: null,
            uuid: 'source-music-resource-uuid-2',
            url: 'https://example.com/remix-source.mp3',
            duration: 120,
            name: 'remix-source.mp3',
          },
          title: 'Remix Source',
          duration: 120,
          style: 'electronic',
        }),
      } as any);
    });

    await act(async () => {
      await latestStore?.generate();
    });

    expect(mocks.remixMusic).toHaveBeenCalledWith(
      expect.objectContaining({
        style: 'jazz-funk',
        source: expect.objectContaining({
          title: 'Remix Source',
        }),
      })
    );
    expect(mocks.generateMusic).not.toHaveBeenCalled();
    expect(mocks.generateSimilar).not.toHaveBeenCalled();
    expect(mocks.extendMusic).not.toHaveBeenCalled();
    expect(mocks.persistMusicGenerationResult).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'music_remix_music-task-uuid-1.mp3',
        title: 'Remix Source Remix',
        style: 'jazz-funk',
      })
    );
  });

  it('routes extend mode through musicService.extendMusic', async () => {
    let latestStore: MusicStoreTestHandle | null = null;

    await act(async () => {
      root = createRoot(container!);
      root.render(
        <MusicStoreProvider>
          <StoreActionProbe onStore={(store) => { latestStore = store; }} />
        </MusicStoreProvider>
      );
      await Promise.resolve();
    });

    await act(async () => {
      latestStore?.setConfig({
        mode: 'extend',
        style: 'cinematic',
        extendDuration: 45,
        sourceMusic: createGeneratedMusicResult({
          uuid: 'source-music-uuid-3',
          resource: {
            id: null,
            uuid: 'source-music-resource-uuid-3',
            url: 'https://example.com/extend-source.mp3',
            duration: 120,
            name: 'extend-source.mp3',
          },
          title: 'Extend Source',
          duration: 120,
          style: 'ambient',
        }),
      } as any);
    });

    await act(async () => {
      await latestStore?.generate();
    });

    expect(mocks.extendMusic).toHaveBeenCalledWith(
      expect.objectContaining({
        extendDuration: 45,
        style: 'cinematic',
        source: expect.objectContaining({
          title: 'Extend Source',
        }),
      })
    );
    expect(mocks.generateMusic).not.toHaveBeenCalled();
    expect(mocks.generateSimilar).not.toHaveBeenCalled();
    expect(mocks.remixMusic).not.toHaveBeenCalled();
    expect(mocks.persistMusicGenerationResult).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'music_extend_music-task-uuid-1.mp3',
        title: 'Extend Source Extend',
        style: 'cinematic',
        fallbackDuration: 165,
      })
    );
  });

  it('imports music tasks at the top of history and replaces the previous copy with the same key', async () => {
    let latestStore: MusicStoreTestHandle | null = null;

    await act(async () => {
      root = createRoot(container!);
      root.render(
        <MusicStoreProvider>
          <StoreActionProbe onStore={(store) => { latestStore = store; }} />
        </MusicStoreProvider>
      );
      await Promise.resolve();
    });
    expect(latestStore).toBeTruthy();
    if (!latestStore) {
      throw new Error('Music store was not captured');
    }
    const getStore = (): MusicStoreTestHandle => latestStore as unknown as MusicStoreTestHandle;

    const firstImportedTask = createMusicTask({
      id: 'imported-music-db-id-1',
      uuid: 'imported-music-task-uuid-1',
      status: 'completed',
      config: {
        mode: 'generate',
        customMode: false,
        prompt: 'first import',
        lyrics: '',
        style: '',
        title: 'First Import',
        instrumental: false,
        model: 'suno-v3',
        duration: 120,
        extendDuration: 30,
        sourceMusic: null,
        mediaType: 'music',
      },
      results: [
        createGeneratedMusicResult({
          uuid: 'imported-result-uuid-1',
          title: 'First Import',
          duration: 120,
          resource: {
            id: null,
            uuid: 'imported-resource-uuid-1',
            url: 'https://example.com/imported-1.mp3',
            name: 'imported-1.mp3',
          },
        }),
      ],
    });

    const updatedImportedTask = createMusicTask({
      id: 'imported-music-db-id-2',
      uuid: 'imported-music-task-uuid-1',
      status: 'completed',
      config: {
        ...firstImportedTask.config,
        title: 'Updated Import',
        prompt: 'updated import',
      },
      results: [
        createGeneratedMusicResult({
          uuid: 'imported-result-uuid-2',
          title: 'Updated Import',
          duration: 180,
          resource: {
            id: null,
            uuid: 'imported-resource-uuid-2',
            url: 'https://example.com/imported-2.mp3',
            name: 'imported-2.mp3',
          },
        }),
      ],
    });

    await act(async () => {
      getStore().importTask(firstImportedTask);
    });

    expect(getStore().history).toHaveLength(1);
    expect(getStore().history[0]).toMatchObject({
      id: 'imported-music-db-id-1',
      uuid: 'imported-music-task-uuid-1',
      config: expect.objectContaining({
        title: 'First Import',
      }),
    });

    await act(async () => {
      getStore().importTask(updatedImportedTask);
    });

    expect(getStore().history).toHaveLength(1);
    expect(getStore().history[0]).toMatchObject({
      uuid: 'imported-music-task-uuid-1',
      config: expect.objectContaining({
        title: 'Updated Import',
        prompt: 'updated import',
      }),
      results: [
        expect.objectContaining({
          uuid: 'imported-result-uuid-2',
          title: 'Updated Import',
        }),
      ],
    });
  });
});
