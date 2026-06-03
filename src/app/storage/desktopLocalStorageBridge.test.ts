import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DESKTOP_LOCAL_STORAGE_SNAPSHOT_KEY,
  applySnapshotToStorage,
  initializeDesktopLocalStorageBridgeInternal,
  parseDesktopLocalStorageSnapshot,
  readStorageEntries,
  resetDesktopLocalStorageBridgeStateForTests,
} from './desktopLocalStorageBridge';

class MemoryStorage implements Storage {
  private data = new Map<string, string>();

  get length(): number {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.has(key) ? this.data.get(key)! : null;
  }

  key(index: number): string | null {
    return Array.from(this.data.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

const flushMicrotasks = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('desktopLocalStorageBridge', () => {
  afterEach(() => {
    resetDesktopLocalStorageBridgeStateForTests();
    vi.restoreAllMocks();
  });

  it('parses only string entries from snapshot payloads', () => {
    expect(
      parseDesktopLocalStorageSnapshot(
        JSON.stringify({
          sdkwork_token: 'auth-token',
          sdkwork_refresh_token: 'refresh-token',
          ignored: 1,
        })
      )
    ).toEqual({
      sdkwork_token: 'auth-token',
      sdkwork_refresh_token: 'refresh-token',
    });
  });

  it('replaces stale local storage entries with the shared desktop snapshot', () => {
    const storage = new MemoryStorage();
    storage.setItem('sdkwork_token', 'stale-token');
    storage.setItem('obsolete', 'value');

    applySnapshotToStorage(storage, {
      sdkwork_token: 'shared-token',
      sdkwork_refresh_token: 'shared-refresh',
    });

    expect(readStorageEntries(storage)).toEqual({
      sdkwork_token: 'shared-token',
      sdkwork_refresh_token: 'shared-refresh',
    });
  });

  it('hydrates local storage from the desktop snapshot when the bundled runtime starts', async () => {
    const storage = new MemoryStorage();
    const store = {
      getItem: vi.fn(async (key: string) =>
        key === DESKTOP_LOCAL_STORAGE_SNAPSHOT_KEY
          ? JSON.stringify({
              sdkwork_token: 'shared-token',
              sdkwork_refresh_token: 'shared-refresh',
            })
          : null
      ),
      setItem: vi.fn(async () => undefined),
    };

    await initializeDesktopLocalStorageBridgeInternal(storage, store);

    expect(readStorageEntries(storage)).toEqual({
      sdkwork_token: 'shared-token',
      sdkwork_refresh_token: 'shared-refresh',
    });
  });

  it('seeds the shared desktop snapshot from existing dev local storage on first run', async () => {
    const storage = new MemoryStorage();
    storage.setItem('sdkwork_token', 'dev-token');
    storage.setItem('sdkwork_refresh_token', 'dev-refresh');

    const store = {
      getItem: vi.fn(async () => null),
      setItem: vi.fn(async () => undefined),
    };

    await initializeDesktopLocalStorageBridgeInternal(storage, store);

    expect(store.setItem).toHaveBeenCalledWith(
      DESKTOP_LOCAL_STORAGE_SNAPSHOT_KEY,
      JSON.stringify({
        sdkwork_token: 'dev-token',
        sdkwork_refresh_token: 'dev-refresh',
      })
    );
  });

  it('mirrors subsequent local storage mutations into the shared desktop snapshot', async () => {
    const storage = new MemoryStorage();
    const store = {
      getItem: vi.fn(async () => null),
      setItem: vi.fn(async () => undefined),
    };

    await initializeDesktopLocalStorageBridgeInternal(storage, store);
    store.setItem.mockClear();

    storage.setItem('sdkwork_token', 'next-token');
    await flushMicrotasks();
    storage.removeItem('sdkwork_token');
    await flushMicrotasks();
    storage.setItem('sdkwork_refresh_token', 'refresh-token');
    await flushMicrotasks();
    storage.clear();
    await flushMicrotasks();

    expect(store.setItem).toHaveBeenNthCalledWith(
      1,
      DESKTOP_LOCAL_STORAGE_SNAPSHOT_KEY,
      JSON.stringify({ sdkwork_token: 'next-token' })
    );
    expect(store.setItem).toHaveBeenNthCalledWith(
      2,
      DESKTOP_LOCAL_STORAGE_SNAPSHOT_KEY,
      JSON.stringify({})
    );
    expect(store.setItem).toHaveBeenNthCalledWith(
      3,
      DESKTOP_LOCAL_STORAGE_SNAPSHOT_KEY,
      JSON.stringify({ sdkwork_refresh_token: 'refresh-token' })
    );
    expect(store.setItem).toHaveBeenNthCalledWith(
      4,
      DESKTOP_LOCAL_STORAGE_SNAPSHOT_KEY,
      JSON.stringify({})
    );
  });
});
