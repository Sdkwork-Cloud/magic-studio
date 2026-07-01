/** @vitest-environment jsdom */

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createGeneratedSfxResult } from '../entities';

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
  generateSfx: vi.fn(async () => mocks.sfxOutcome),
  sfxOutcome: {
    recipe: {
      id: null,
      uuid: 'sfx-recipe-uuid-1',
      product: 'sfx',
      mode: 'text-to-audio',
      prompt: 'short cinematic whoosh',
      inputRefs: [],
      parameters: {},
    },
    execution: {
      id: null,
      uuid: 'sfx-execution-uuid-1',
      provider: 'app-sfx',
      providerModel: 'audioldm-2',
      status: 'succeeded',
    },
    artifactSet: {
      id: null,
      uuid: 'sfx-artifact-set-uuid-1',
      artifacts: [],
    },
    delivery: {
      url: 'https://example.com/generated-sfx.mp3',
      mimeType: 'audio/mpeg',
      duration: 3,
      artifactUuid: 'sfx-artifact-uuid-1',
    },
    primaryArtifact: {
      id: null,
      uuid: 'sfx-artifact-uuid-1',
      type: 'audio',
      resource: {
        id: null,
        uuid: 'sfx-resource-uuid-1',
        url: 'https://example.com/generated-sfx.mp3',
      },
    },
  },
  persistSfxGenerationResult: vi.fn(async () =>
    createGeneratedSfxResult({
      uuid: 'persisted-sfx-result-uuid-1',
      assetId: 'persisted-sfx-asset-1',
      assetUuid: 'persisted-sfx-asset-uuid-1',
      primaryResourceId: 'persisted-sfx-resource-id-1',
      primaryResourceUuid: 'persisted-sfx-resource-uuid-1',
      resourceViewId: 'persisted-sfx-resource-view-id-1',
      resourceViewUuid: 'persisted-sfx-resource-view-uuid-1',
      recipeUuid: 'sfx-recipe-uuid-1',
      executionUuid: 'sfx-execution-uuid-1',
      artifactSetUuid: 'sfx-artifact-set-uuid-1',
      artifactUuid: 'sfx-artifact-uuid-1',
      resource: {
        id: null,
        uuid: 'persisted-sfx-resource-view-uuid-1',
        assetId: 'persisted-sfx-asset-1',
        assetUuid: 'persisted-sfx-asset-uuid-1',
        primaryResourceId: 'persisted-sfx-resource-id-1',
        primaryResourceUuid: 'persisted-sfx-resource-uuid-1',
        resourceViewId: 'persisted-sfx-resource-view-id-1',
        resourceViewUuid: 'persisted-sfx-resource-view-uuid-1',
        url: 'https://storage.example.com/generated-sfx.mp3',
        duration: 3,
        name: 'sfx_gen_sfx-task-uuid-1.mp3',
      },
      duration: 3,
    })
  ),
}));

vi.mock('../services', () => ({
  sfxBusinessService: {
    sfxService: {
      generateSfx: mocks.generateSfx,
    },
    sfxHistoryService: {
      findAll: mocks.findAll,
      save: mocks.save,
      deleteById: mocks.deleteById,
      clear: mocks.clear,
      toggleFavorite: mocks.toggleFavorite,
    },
  },
  persistSfxGenerationResult: mocks.persistSfxGenerationResult,
}));

vi.mock('@sdkwork/magic-studio-assets', () => ({
  persistGenerationOutcomeAsset: mocks.persistGenerationOutcomeAsset,
}));

vi.mock('@sdkwork/magic-studio-commons', () => ({
  generateUUID: vi.fn(() => 'sfx-task-uuid-1'),
}));

import { SfxStoreProvider, useSfxStore } from './sfxStore';

interface SfxStoreTestHandle {
  history: Array<Record<string, unknown>>;
  setConfig: (config: Record<string, unknown>) => void;
  generate: () => Promise<void>;
  importTask: (task: unknown) => void;
}

const StoreActionProbe = ({
  onStore,
}: {
  onStore: (store: SfxStoreTestHandle) => void;
}) => {
  const store = useSfxStore();
  onStore(store as unknown as SfxStoreTestHandle);
  return null;
};

describe('SfxStoreProvider', () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  beforeEach(() => {
    mocks.persistGenerationOutcomeAsset.mockClear();
    mocks.findAll.mockClear();
    mocks.save.mockClear();
    mocks.deleteById.mockClear();
    mocks.clear.mockClear();
    mocks.toggleFavorite.mockClear();
    mocks.generateSfx.mockClear();
    mocks.persistSfxGenerationResult.mockClear();
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

  it('uses persistSfxGenerationResult for generated sfx results', async () => {
    let latestStore: SfxStoreTestHandle | null = null;

    await act(async () => {
      root = createRoot(container!);
      root.render(
        <SfxStoreProvider>
          <StoreActionProbe onStore={(store) => { latestStore = store; }} />
        </SfxStoreProvider>
      );
      await Promise.resolve();
    });

    await act(async () => {
      latestStore?.setConfig({
        prompt: 'short cinematic whoosh',
      });
    });

    await act(async () => {
      await latestStore?.generate();
    });

    expect(mocks.generateSfx).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: 'short cinematic whoosh',
      })
    );
    expect(mocks.persistSfxGenerationResult).toHaveBeenCalledWith({
      outcome: mocks.sfxOutcome,
      name: 'sfx_gen_sfx-task-uuid-1.mp3',
      fallbackDuration: 5,
    });
    expect(mocks.persistGenerationOutcomeAsset).not.toHaveBeenCalled();
    expect(mocks.save).toHaveBeenLastCalledWith(
      expect.objectContaining({
        uuid: 'sfx-task-uuid-1',
        status: 'completed',
        results: [
          expect.objectContaining({
            uuid: 'persisted-sfx-result-uuid-1',
            assetId: 'persisted-sfx-asset-1',
          }),
        ],
      })
    );
  });

  it('replaces existing imported sfx tasks by uuid when importing a refreshed record', async () => {
    let latestStore: SfxStoreTestHandle | null = null;

    await act(async () => {
      root = createRoot(container!);
      root.render(
        <SfxStoreProvider>
          <StoreActionProbe onStore={(store) => { latestStore = store; }} />
        </SfxStoreProvider>
      );
      await Promise.resolve();
    });
    expect(latestStore).toBeTruthy();
    if (!latestStore) {
      throw new Error('Sfx store was not captured');
    }
    const getStore = (): SfxStoreTestHandle => latestStore as unknown as SfxStoreTestHandle;

    const firstImportedTask = {
      id: 'imported-sfx-db-id-1',
      uuid: 'imported-sfx-task-uuid-1',
      status: 'completed',
      config: {
        prompt: 'first imported sfx',
        duration: 3,
        model: 'tango',
        mediaType: 'audio',
      },
      results: [
        {
          uuid: 'imported-sfx-result-uuid-1',
          assetId: 'imported-sfx-asset-1',
        },
      ],
    } as any;

    const updatedImportedTask = {
      id: 'imported-sfx-db-id-2',
      uuid: 'imported-sfx-task-uuid-1',
      status: 'completed',
      config: {
        prompt: 'updated imported sfx',
        duration: 5,
        model: 'audioldm-2',
        mediaType: 'audio',
      },
      results: [
        {
          uuid: 'imported-sfx-result-uuid-2',
          assetId: 'imported-sfx-asset-2',
        },
      ],
    } as any;

    await act(async () => {
      getStore().importTask(firstImportedTask);
    });

    expect(getStore().history).toHaveLength(1);
    expect(getStore().history[0]).toMatchObject({
      id: 'imported-sfx-db-id-1',
      uuid: 'imported-sfx-task-uuid-1',
    });

    await act(async () => {
      getStore().importTask(updatedImportedTask);
    });

    expect(getStore().history).toHaveLength(1);
    expect(getStore().history[0]).toMatchObject({
      id: 'imported-sfx-db-id-2',
      uuid: 'imported-sfx-task-uuid-1',
      config: expect.objectContaining({
        prompt: 'updated imported sfx',
        duration: 5,
      }),
      results: [
        expect.objectContaining({
          uuid: 'imported-sfx-result-uuid-2',
        }),
      ],
    });
  });
});
