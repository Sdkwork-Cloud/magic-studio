import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LocalStorageService } from '../LocalStorageService';

type ExampleEntity = {
  id: string;
  uuid: string;
  createdAt: number;
  updatedAt: number;
  title: string;
};

type StorageCapability = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  getJson<T>(key: string, fallbackValue: T): Promise<T>;
  setJson<T>(key: string, value: T): Promise<void>;
};

class ExampleStorageService extends LocalStorageService<ExampleEntity> {
  constructor(storage: string, legacy: readonly string[] = []) {
    super(storage, legacy);
  }
}

const runtime: { storage: StorageCapability } = {
  storage: {
    get: async () => null as string | null,
    set: async () => {},
    remove: async () => {},
    clear: async () => {},
    getJson: async <T,>(_key: string, fallbackValue: T) => fallbackValue,
    setJson: async <T,>(_key: string, _value: T) => {},
  },
};

vi.mock('../../../platform', () => ({
  getPlatformRuntime: () => runtime,
}));

const createStorageCapability = (
  overrides: Partial<{
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string) => Promise<void>;
    remove: (key: string) => Promise<void>;
    clear: () => Promise<void>;
  }> = {}
): StorageCapability => ({
  get: overrides.get ?? (async () => null),
  set: overrides.set ?? (async () => {}),
  remove: overrides.remove ?? (async () => {}),
  clear: overrides.clear ?? (async () => {}),
  getJson: async <T,>(_key: string, fallbackValue: T) => fallbackValue,
  setJson: async <T,>(_key: string, _value: T) => {},
});

describe('LocalStorageService legacy storage migration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    runtime.storage = createStorageCapability();
  });

  it('loads from a legacy key and migrates the snapshot into the new key', async () => {
    const getStorage = vi.fn(async (key: string) =>
      key === 'open_studio_examples_v1'
        ? JSON.stringify([
            {
              id: 'item-1',
              uuid: 'item-1',
              title: 'Legacy Item',
              createdAt: 1,
              updatedAt: 1,
            },
          ])
        : null
    );
    const setStorage = vi.fn(async () => {});
    const removeStorage = vi.fn(async () => {});

    runtime.storage = createStorageCapability({
      get: getStorage,
      set: setStorage,
      remove: removeStorage,
    });

    const service = new ExampleStorageService('magic_studio_examples_v2', [
      'open_studio_examples_v1',
    ]);
    const page = await service.findAll({ page: 0, size: 10 });

    expect(page.data?.content).toHaveLength(1);
    expect(getStorage).toHaveBeenNthCalledWith(1, 'magic_studio_examples_v2');
    expect(getStorage).toHaveBeenNthCalledWith(2, 'open_studio_examples_v1');
    expect(setStorage).toHaveBeenCalledWith(
      'magic_studio_examples_v2',
      JSON.stringify([
        {
          id: 'item-1',
          uuid: 'item-1',
          title: 'Legacy Item',
          createdAt: 1,
          updatedAt: 1,
        },
      ])
    );
    expect(removeStorage).toHaveBeenCalledWith('open_studio_examples_v1');
  });

  it('keeps loading legacy data when one migration write attempt fails', async () => {
    runtime.storage = createStorageCapability({
      get: async (key: string) =>
        key === 'open_studio_examples_v1'
          ? JSON.stringify([
              {
                id: 'item-legacy',
                uuid: 'item-legacy',
                title: 'Legacy Item',
                createdAt: 1,
                updatedAt: 1,
              },
            ])
          : null,
      set: async () => {
        throw new Error('storage unavailable');
      },
    });

    const service = new ExampleStorageService('magic_studio_examples_v2', [
      'open_studio_examples_v1',
    ]);
    const count = await service.count();

    expect(count).toBe(1);
  });
});
