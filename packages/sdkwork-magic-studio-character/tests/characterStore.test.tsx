/** @vitest-environment jsdom */

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, waitFor } from '@/tests/support/reactTesting';

const mocks = vi.hoisted(() => ({
  findAll: vi.fn(async () => ({
    success: true,
    data: {
      content: [
        {
          id: 'history-task-1',
          uuid: 'history-task-1',
          createdAt: '2026-04-05T08:00:00Z',
          updatedAt: '2026-04-05T08:00:30Z',
          status: 'completed',
          config: {
            prompt: 'Loaded from server',
            mediaType: 'character',
          },
          results: [
            {
              id: 'history-result-1',
              uuid: 'history-result-1',
              url: 'https://example.com/history-character.png',
            },
          ],
        },
      ],
    },
  })),
  generate: vi.fn(async (config: Record<string, unknown>) => ({
    id: 'generated-task-1',
    uuid: 'generated-task-1',
    createdAt: '2026-04-05T08:01:00Z',
    updatedAt: '2026-04-05T08:01:10Z',
    status: 'completed',
    config,
    results: [
      {
        id: 'generated-result-1',
        uuid: 'generated-result-1',
        url: 'https://example.com/generated-character.png',
      },
    ],
  })),
  save: vi.fn(async () => undefined),
  deleteById: vi.fn(async () => undefined),
  clear: vi.fn(async () => undefined),
  toggleFavorite: vi.fn(async () => undefined),
}));

vi.mock('../src/services/characterBusinessService', () => ({
  characterBusinessService: {
    characterService: {
      generate: mocks.generate,
    },
    characterHistoryService: {
      findAll: mocks.findAll,
      save: mocks.save,
      deleteById: mocks.deleteById,
      clear: mocks.clear,
      toggleFavorite: mocks.toggleFavorite,
    },
  },
}));

import { CharacterStoreProvider, useCharacterStore } from '../src/store/characterStore';

describe('CharacterStoreProvider', () => {
  let latestStore: ReturnType<typeof useCharacterStore> | null = null;

  const Observer = () => {
    const store = useCharacterStore();

    React.useEffect(() => {
      latestStore = store;
    }, [store]);

    return null;
  };

  beforeEach(() => {
    latestStore = null;
    mocks.findAll.mockClear();
    mocks.generate.mockClear();
    mocks.save.mockClear();
    mocks.deleteById.mockClear();
    mocks.clear.mockClear();
    mocks.toggleFavorite.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('loads remote history from characterHistoryService.findAll on mount', async () => {
    render(
      <CharacterStoreProvider>
        <Observer />
      </CharacterStoreProvider>
    );

    await waitFor(() => {
      expect(mocks.findAll).toHaveBeenCalledTimes(1);
      expect(latestStore?.history).toHaveLength(1);
    });
    expect(latestStore?.history[0]?.id).toBe('history-task-1');
  });

  it('routes generate through characterService.generate and prepends the returned remote task', async () => {
    render(
      <CharacterStoreProvider>
        <Observer />
      </CharacterStoreProvider>
    );

    await waitFor(() => {
      expect(mocks.findAll).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      latestStore?.setConfig({
        prompt: 'Generate from store',
        description: 'Generate from store',
      });
    });

    await act(async () => {
      await latestStore?.generate();
    });

    expect(mocks.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: 'Generate from store',
        description: 'Generate from store',
        mediaType: 'character',
      })
    );
    expect(mocks.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'generated-task-1',
        uuid: 'generated-task-1',
      })
    );
    expect(latestStore?.history[0]?.id).toBe('generated-task-1');
  });

  it('replaces an existing history entry when generate returns the same task uuid with a different id', async () => {
    mocks.findAll.mockResolvedValueOnce({
      success: true,
      data: {
        content: [
          {
            id: 'history-task-old-id',
            uuid: 'shared-character-task-uuid',
            createdAt: '2026-04-05T08:00:00Z',
            updatedAt: '2026-04-05T08:00:30Z',
            status: 'completed',
            config: {
              prompt: 'Old task copy',
              mediaType: 'character',
            },
            results: [
              {
                id: 'history-result-old',
                uuid: 'history-result-old',
                url: 'https://example.com/old-character.png',
              },
            ],
          },
        ],
      },
    });
    mocks.generate.mockResolvedValueOnce({
      id: 'generated-task-new-id',
      uuid: 'shared-character-task-uuid',
      createdAt: '2026-04-05T08:03:00Z',
      updatedAt: '2026-04-05T08:03:10Z',
      status: 'completed',
      config: {
        prompt: 'Fresh task copy',
        mediaType: 'character',
      },
      results: [
        {
          id: 'generated-result-new',
          uuid: 'generated-result-new',
          url: 'https://example.com/fresh-character.png',
        },
      ],
    });

    render(
      <CharacterStoreProvider>
        <Observer />
      </CharacterStoreProvider>
    );

    await waitFor(() => {
      expect(latestStore?.history).toHaveLength(1);
    });

    await act(async () => {
      await latestStore?.generate();
    });

    expect(latestStore?.history).toHaveLength(1);
    expect(latestStore?.history[0]).toMatchObject({
      id: 'generated-task-new-id',
      uuid: 'shared-character-task-uuid',
      config: expect.objectContaining({
        prompt: 'Fresh task copy',
      }),
    });
  });

  it('routes deleteTask through characterHistoryService.deleteById and removes the task locally', async () => {
    render(
      <CharacterStoreProvider>
        <Observer />
      </CharacterStoreProvider>
    );

    await waitFor(() => {
      expect(latestStore?.history).toHaveLength(1);
    });

    await act(async () => {
      await latestStore?.deleteTask('history-task-1');
    });

    expect(mocks.deleteById).toHaveBeenCalledWith('history-task-1');
    expect(latestStore?.history).toHaveLength(0);
  });

  it('toggles favorites when the caller passes a task uuid instead of a database id', async () => {
    mocks.findAll.mockResolvedValueOnce({
      success: true,
      data: {
        content: [
          {
            id: null,
            uuid: 'uuid-only-character-task-1',
            createdAt: '2026-04-05T08:04:00Z',
            updatedAt: '2026-04-05T08:04:10Z',
            status: 'completed',
            isFavorite: false,
            config: {
              prompt: 'UUID only character',
              mediaType: 'character',
            },
            results: [
              {
                id: 'uuid-only-character-result-1',
                uuid: 'uuid-only-character-result-1',
                url: 'https://example.com/uuid-only-character.png',
              },
            ],
          },
        ],
      },
    });

    render(
      <CharacterStoreProvider>
        <Observer />
      </CharacterStoreProvider>
    );

    await waitFor(() => {
      expect(latestStore?.history).toHaveLength(1);
    });

    await act(async () => {
      await latestStore?.toggleFavorite('uuid-only-character-task-1');
    });

    expect(mocks.toggleFavorite).toHaveBeenCalledWith('uuid-only-character-task-1');
    expect(latestStore?.history[0]).toMatchObject({
      uuid: 'uuid-only-character-task-1',
      isFavorite: true,
    });
  });

  it('imports character tasks at the top of history and replaces the previous copy with the same key', async () => {
    render(
      <CharacterStoreProvider>
        <Observer />
      </CharacterStoreProvider>
    );

    await waitFor(() => {
      expect(latestStore?.history).toHaveLength(1);
    });

    const firstImportedTask = {
      id: 'imported-character-db-id-1',
      uuid: 'imported-character-task-1',
      createdAt: '2026-04-05T08:02:00Z',
      updatedAt: '2026-04-05T08:02:00Z',
      status: 'completed',
      config: {
        prompt: 'first imported character',
        description: 'first imported character',
        model: 'gemini-2.5-flash-image',
        aspectRatio: '9:16',
        mediaType: 'character',
      },
      results: [
        {
          id: 'imported-character-result-1',
          uuid: 'imported-character-result-1',
          name: 'First Imported Character',
          avatarUrl: 'https://example.com/imported-character-1.png',
          url: 'https://example.com/imported-character-1.png',
        },
      ],
    } as any;

    const updatedImportedTask = {
      id: 'imported-character-db-id-2',
      uuid: 'imported-character-task-1',
      createdAt: '2026-04-05T08:02:30Z',
      updatedAt: '2026-04-05T08:02:30Z',
      status: 'completed',
      config: {
        prompt: 'updated imported character',
        description: 'updated imported character',
        model: 'gemini-2.5-flash-image',
        aspectRatio: '1:1',
        mediaType: 'character',
      },
      results: [
        {
          id: 'imported-character-result-2',
          uuid: 'imported-character-result-2',
          name: 'Updated Imported Character',
          avatarUrl: 'https://example.com/imported-character-2.png',
          url: 'https://example.com/imported-character-2.png',
        },
      ],
    } as any;

    await act(async () => {
      latestStore?.importTask(firstImportedTask);
    });

    expect(mocks.save).toHaveBeenCalledWith(firstImportedTask);
    expect(latestStore?.history).toHaveLength(2);
    expect(latestStore?.history[0]).toMatchObject({
      id: 'imported-character-db-id-1',
      config: expect.objectContaining({
        prompt: 'first imported character',
      }),
    });

    await act(async () => {
      latestStore?.importTask(updatedImportedTask);
    });

    expect(mocks.save).toHaveBeenCalledWith(updatedImportedTask);
    expect(latestStore?.history).toHaveLength(2);
    expect(latestStore?.history[0]).toMatchObject({
      id: 'imported-character-db-id-2',
      uuid: 'imported-character-task-1',
      config: expect.objectContaining({
        prompt: 'updated imported character',
        aspectRatio: '1:1',
      }),
      results: [
        expect.objectContaining({
          uuid: 'imported-character-result-2',
          name: 'Updated Imported Character',
        }),
      ],
    });
  });
});
