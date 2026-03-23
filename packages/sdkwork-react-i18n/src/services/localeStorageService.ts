import { createServiceAdapterController } from '../utils/serviceAdapter';

export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export interface LocaleStorageServiceAdapter {
  getStorage(): StorageLike | null;
  read(key: string): string | null;
  write(key: string, value: string): void;
  remove(key: string): void;
}

const resolveStorage = (): StorageLike | null => {
  if (typeof globalThis === 'undefined' || !('localStorage' in globalThis)) {
    return null;
  }

  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
};

const localLocaleStorageAdapter: LocaleStorageServiceAdapter = {
  getStorage(): StorageLike | null {
    return resolveStorage();
  },

  read(key: string): string | null {
    return resolveStorage()?.getItem(key) ?? null;
  },

  write(key: string, value: string): void {
    resolveStorage()?.setItem(key, value);
  },

  remove(key: string): void {
    resolveStorage()?.removeItem(key);
  },
};

const controller = createServiceAdapterController<LocaleStorageServiceAdapter>(
  localLocaleStorageAdapter
);

export const localeStorageService: LocaleStorageServiceAdapter = controller.service;
export const setLocaleStorageServiceAdapter = controller.setAdapter;
export const getLocaleStorageServiceAdapter = controller.getAdapter;
export const resetLocaleStorageServiceAdapter = controller.resetAdapter;
