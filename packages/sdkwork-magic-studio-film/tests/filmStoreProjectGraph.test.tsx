/** @vitest-environment jsdom */

import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';

import { filmService as realFilmService, normalizeFilmProject } from '../src/services/filmService';

const mocks = vi.hoisted(() => ({
  findAll: vi.fn(),
  save: vi.fn(),
  findById: vi.fn(),
  deleteById: vi.fn(),
  generateImage: vi.fn(),
  generateAudio: vi.fn(),
  generateSpeech: vi.fn(),
  resolveFilmGeneratedOutcomeAsset: vi.fn(),
}));

vi.mock('../src/services', async () => {
  return {
    filmService: {
      ...realFilmService,
      generateImage: mocks.generateImage,
      saveProject: vi.fn(async (project) => {
        await mocks.save(normalizeFilmProject(project));
      }),
    },
    filmProjectService: {
      findAll: mocks.findAll,
      save: mocks.save,
      findById: mocks.findById,
      deleteById: mocks.deleteById,
    },
  };
});

vi.mock('@sdkwork/magic-studio-core', async () => {
  return {
    LocalStorageService: class LocalStorageServiceMock<T> {
      protected readonly storageKey: string;

      constructor(storageKey: string) {
        this.storageKey = storageKey;
      }

      async save(_value: T): Promise<void> {}
      async findAll(): Promise<{ success: boolean; data: { content: T[] } }> {
        return {
          success: true,
          data: {
            content: [],
          },
        };
      }
      async findById(): Promise<{ success: boolean; data: T | null }> {
        return {
          success: true,
          data: null,
        };
      }
      async deleteById(): Promise<void> {}
    },
    genAIService: {
      generateSpeech: mocks.generateSpeech,
    },
    resolveGenerationOutcomePrimaryUrl: vi.fn(),
  };
});

vi.mock('@sdkwork/magic-studio-audio/services', () => {
  return {
    audioService: {
      generateAudio: mocks.generateAudio,
    },
  };
});

vi.mock('@sdkwork/magic-studio-assets', () => {
  return {
    importAssetFromUrlBySdk: vi.fn(),
    resolveAssetPrimaryUrlBySdk: vi.fn(),
  };
});

vi.mock('../src/utils/filmModalAssetImport', () => ({
  resolveFilmGeneratedOutcomeAsset: mocks.resolveFilmGeneratedOutcomeAsset,
  resolveImportedFilmAssetUrl: (imported: {
    resource?: { url?: string | null };
    url?: string | null;
  } | null | undefined) => imported?.resource?.url || imported?.url || '',
}));

import { FilmStoreProvider, useFilmStore } from '../src/store/filmStore';

const StoreProbe = () => {
  const { project } = useFilmStore();
  return <div data-testid="project-state">{`${project.name}:${project.projectGraph ? 'yes' : 'no'}`}</div>;
};

const ShotGenerationProbe = () => {
  const { project } = useFilmStore();
  const assets = project.shots[0]?.generation?.assets || [];
  return (
    <div data-testid="shot-generation-assets">
      {assets.map((asset) => `${asset.uuid}:${asset.assetId || ''}`).join('|')}
    </div>
  );
};

const StoreActionProbe = ({
  onStore,
}: {
  onStore: (store: ReturnType<typeof useFilmStore>) => void;
}) => {
  const store = useFilmStore();
  onStore(store);
  return null;
};

afterEach(() => {
  document.body.innerHTML = '';
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe('FilmStoreProvider', () => {
  it('normalizes loaded projects and persists the rebuilt projectGraph through the store save path', async () => {
    vi.useFakeTimers();
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div');
    document.body.appendChild(container);
    let root: Root | null = null;

    const loadedProject = {
      ...realFilmService.createProject('Loaded Film'),
      projectGraph: undefined,
    };

    mocks.findAll.mockResolvedValue({
      success: true,
      data: {
        content: [loadedProject],
      },
    });
    mocks.save.mockResolvedValue(undefined);

    await act(async () => {
      root = createRoot(container);
      root.render(
        <FilmStoreProvider>
          <StoreProbe />
        </FilmStoreProvider>
      );
      await Promise.resolve();
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(container.querySelector('[data-testid="project-state"]')?.textContent).toBe('Loaded Film:yes');

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(mocks.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Loaded Film',
        projectGraph: expect.objectContaining({
          project: expect.objectContaining({
            name: 'Loaded Film',
            domain: 'film',
          }),
        }),
      })
    );

    await act(async () => {
      root?.unmount();
    });
  });

  it('dedupes generated shot assets by uuid-first identity when a persisted asset replaces a transient one', async () => {
    vi.useFakeTimers();
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div');
    document.body.appendChild(container);
    let root: Root | null = null;
    let latestStore: ReturnType<typeof useFilmStore> | null = null;

    const loadedProject = realFilmService.createProject('Loaded Film');
    const shot = realFilmService.createEmptyShot(undefined, 0);
    shot.description = 'Ocean cliff at sunset';
    shot.generation = {
      status: 'PENDING',
      prompt: 'Ocean cliff at sunset',
      base: 'Ocean cliff at sunset',
      assets: [
        {
          id: 'resource-view-1',
          uuid: 'asset-uuid-1',
          type: 'image',
          url: 'https://tmp.example.com/transient-shot.png',
          fileName: 'transient-shot.png',
          createdAt: 0,
          updatedAt: 0,
        },
      ],
    };
    loadedProject.shots = [shot];

    mocks.findAll.mockResolvedValue({
      success: true,
      data: {
        content: [loadedProject],
      },
    });
    mocks.save.mockResolvedValue(undefined);
    mocks.generateImage.mockResolvedValue({
      recipe: {
        product: 'image',
        prompt: 'Ocean cliff at sunset',
      },
      execution: {
        providerModel: 'image-model-1',
      },
    });
    mocks.resolveFilmGeneratedOutcomeAsset.mockResolvedValue({
      id: null,
      assetId: 'asset-db-1',
      assetUuid: 'asset-uuid-1',
      uuid: 'asset-uuid-1',
      resource: {
        id: null,
        uuid: 'asset-uuid-1',
        assetId: 'asset-db-1',
        assetUuid: 'asset-uuid-1',
        type: 'image',
        url: 'https://cdn.example.com/final-shot.png',
      },
    });

    await act(async () => {
      root = createRoot(container);
      root.render(
        <FilmStoreProvider>
          <StoreActionProbe onStore={(store) => { latestStore = store; }} />
          <ShotGenerationProbe />
        </FilmStoreProvider>
      );
      await Promise.resolve();
    });

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      await latestStore?.generateShotImage(undefined, shot.uuid);
    });

    expect(container.querySelector('[data-testid="shot-generation-assets"]')?.textContent).toBe(
      'asset-uuid-1:asset-db-1'
    );

    await act(async () => {
      root?.unmount();
    });
  });

  it('routes shot audio generation through audioService instead of genAIService', async () => {
    vi.useFakeTimers();
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement('div');
    document.body.appendChild(container);
    let root: Root | null = null;
    let latestStore: ReturnType<typeof useFilmStore> | null = null;

    const loadedProject = realFilmService.createProject('Audio Film');
    const shot = realFilmService.createEmptyShot(undefined, 0);
    shot.dialogue = {
      items: [
        { id: 'd1', characterId: 'narrator', text: 'First line' },
        { id: 'd2', characterId: 'narrator', text: 'Second line' },
      ],
    };
    loadedProject.shots = [shot];

    mocks.findAll.mockResolvedValue({
      success: true,
      data: {
        content: [loadedProject],
      },
    });
    mocks.save.mockResolvedValue(undefined);
    mocks.generateSpeech.mockResolvedValue({
      recipe: {
        product: 'speech',
        prompt: 'First line Second line',
      },
      execution: {
        providerModel: 'legacy-speech-model',
      },
    });
    mocks.generateAudio.mockResolvedValue({
      recipe: {
        product: 'speech',
        prompt: 'First line Second line',
      },
      execution: {
        providerModel: 'app-sdk-speech-model',
      },
    });
    mocks.resolveFilmGeneratedOutcomeAsset.mockResolvedValue({
      id: null,
      assetId: 'audio-asset-1',
      assetUuid: 'audio-uuid-1',
      uuid: 'audio-uuid-1',
      resource: {
        id: null,
        uuid: 'audio-uuid-1',
        assetId: 'audio-asset-1',
        assetUuid: 'audio-uuid-1',
        type: 'audio',
        url: 'https://cdn.example.com/dialogue.wav',
      },
    });

    await act(async () => {
      root = createRoot(container);
      root.render(
        <FilmStoreProvider>
          <StoreActionProbe onStore={(store) => { latestStore = store; }} />
          <ShotGenerationProbe />
        </FilmStoreProvider>
      );
      await Promise.resolve();
    });

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      await latestStore?.generateShotAudio(undefined, shot.uuid);
    });

    expect(mocks.generateAudio).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: 'First line Second line',
        voice: 'Kore',
      })
    );
    expect(mocks.generateSpeech).not.toHaveBeenCalled();
    expect(container.querySelector('[data-testid="shot-generation-assets"]')?.textContent).toBe(
      'audio-uuid-1:audio-asset-1'
    );

    await act(async () => {
      root?.unmount();
    });
  });
});
