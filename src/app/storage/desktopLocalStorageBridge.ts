export const DESKTOP_LOCAL_STORAGE_SNAPSHOT_KEY =
  'magicstudio_desktop_local_storage_snapshot_v1';

export interface LocalStorageSnapshotStore {
  getItem(key: string): Promise<string | null | undefined>;
  setItem(key: string, value: string): Promise<void>;
}

type BridgeState = {
  initialized: boolean;
  restoring: boolean;
  persistScheduled: boolean;
};

type StorageMethodName = 'setItem' | 'removeItem' | 'clear';
type StorageMethod = (this: Storage, ...args: unknown[]) => unknown;

const bridgeState: BridgeState = {
  initialized: false,
  restoring: false,
  persistScheduled: false,
};

let initializePromise: Promise<void> | null = null;

export function resetDesktopLocalStorageBridgeStateForTests(): void {
  bridgeState.initialized = false;
  bridgeState.restoring = false;
  bridgeState.persistScheduled = false;
  initializePromise = null;
}

export function parseDesktopLocalStorageSnapshot(
  raw: string | null | undefined
): Record<string, string> {
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }

    return Object.entries(parsed).reduce<Record<string, string>>((acc, [key, value]) => {
      if (typeof value === 'string') {
        acc[key] = value;
      }
      return acc;
    }, {});
  } catch {
    return {};
  }
}

export function readStorageEntries(storage: Storage): Record<string, string> {
  const entries: Record<string, string> = {};

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key) continue;
    const value = storage.getItem(key);
    if (typeof value === 'string') {
      entries[key] = value;
    }
  }

  return entries;
}

export function applySnapshotToStorage(
  storage: Storage,
  snapshot: Record<string, string>
): void {
  const current = readStorageEntries(storage);

  Object.keys(current).forEach((key) => {
    if (!(key in snapshot)) {
      storage.removeItem(key);
    }
  });

  Object.entries(snapshot).forEach(([key, value]) => {
    if (storage.getItem(key) !== value) {
      storage.setItem(key, value);
    }
  });
}

const readSnapshot = (storage: Storage): Record<string, string> => readStorageEntries(storage);

const schedulePersist = (
  storage: Storage,
  store: LocalStorageSnapshotStore,
  state: BridgeState
): void => {
  if (state.restoring || state.persistScheduled) {
    return;
  }

  state.persistScheduled = true;

  queueMicrotask(() => {
    state.persistScheduled = false;
    const snapshot = readSnapshot(storage);
    void store
      .setItem(DESKTOP_LOCAL_STORAGE_SNAPSHOT_KEY, JSON.stringify(snapshot))
      .catch((error) => {
        console.warn('[desktopLocalStorageBridge] Failed to persist shared desktop storage', error);
      });
  });
};

const patchStorageMethod = (
  storage: Storage,
  methodName: StorageMethodName,
  wrap: (original: StorageMethod) => StorageMethod
): boolean => {
  const target = storage as Storage & Record<string, unknown>;
  const original = target[methodName];
  if (typeof original !== 'function') {
    return false;
  }

  try {
    target[methodName] = wrap(original as StorageMethod) as never;
    return true;
  } catch {
    return false;
  }
};

const installStorageMirror = (
  storage: Storage,
  store: LocalStorageSnapshotStore,
  state: BridgeState
): void => {
  if (state.initialized) {
    return;
  }

  const wrapMethod =
    (original: StorageMethod): StorageMethod =>
    function wrappedStorageMethod(this: Storage, ...args: unknown[]) {
      const result = original.apply(this, args);
      if (this === storage) {
        schedulePersist(storage, store, state);
      }
      return result;
    };

  const patchedOnInstance =
    patchStorageMethod(storage, 'setItem', wrapMethod) &&
    patchStorageMethod(storage, 'removeItem', wrapMethod) &&
    patchStorageMethod(storage, 'clear', wrapMethod);

  if (!patchedOnInstance) {
    const prototype = Object.getPrototypeOf(storage) as Record<string, unknown> | null;
    if (!prototype) {
      return;
    }

    (['setItem', 'removeItem', 'clear'] as const).forEach((methodName) => {
      const original = prototype[methodName];
      if (typeof original !== 'function') {
        return;
      }

      Object.defineProperty(prototype, methodName, {
        configurable: true,
        writable: true,
        value(this: Storage, ...args: unknown[]) {
          const result = (original as StorageMethod).apply(this, args);
          if (this === storage) {
            schedulePersist(storage, store, state);
          }
          return result;
        },
      });
    });
  }

  state.initialized = true;
};

export async function initializeDesktopLocalStorageBridgeInternal(
  storage: Storage,
  store: LocalStorageSnapshotStore
): Promise<void> {
  const persistedSnapshot = parseDesktopLocalStorageSnapshot(
    await store.getItem(DESKTOP_LOCAL_STORAGE_SNAPSHOT_KEY)
  );
  const currentSnapshot = readSnapshot(storage);
  const resolvedSnapshot =
    Object.keys(persistedSnapshot).length > 0 ? persistedSnapshot : currentSnapshot;

  bridgeState.restoring = true;
  try {
    applySnapshotToStorage(storage, resolvedSnapshot);
  } finally {
    bridgeState.restoring = false;
  }

  installStorageMirror(storage, store, bridgeState);

  if (JSON.stringify(resolvedSnapshot) !== JSON.stringify(persistedSnapshot)) {
    await store.setItem(DESKTOP_LOCAL_STORAGE_SNAPSHOT_KEY, JSON.stringify(resolvedSnapshot));
  }
}

export async function initializeDesktopLocalStorageBridge(): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  const {
    getPlatformRuntime,
    isDesktopShellRuntimeKind,
  } = await import('@sdkwork/magic-studio-core');
  const runtime = getPlatformRuntime();

  if (!isDesktopShellRuntimeKind(runtime.system.kind())) {
    return;
  }

  if (initializePromise) {
    return initializePromise;
  }

  initializePromise = initializeDesktopLocalStorageBridgeInternal(window.localStorage, {
    getItem: (key) => runtime.storage.get(key),
    setItem: (key, value) => runtime.storage.set(key, value),
  }).catch((error) => {
    initializePromise = null;
    bridgeState.initialized = false;
    throw error;
  });

  return initializePromise;
}
