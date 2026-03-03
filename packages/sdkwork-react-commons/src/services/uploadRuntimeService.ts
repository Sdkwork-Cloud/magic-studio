import { createServiceAdapterController } from '../utils/serviceAdapter';

export type UploadRuntimePlatform = 'web' | 'desktop' | string;

export interface UploadRuntimeSelection {
  data: Uint8Array | File;
  name: string;
  path?: string;
}

interface PlatformBridge {
  getPlatform?: () => UploadRuntimePlatform;
  convertFileSrc?: (path: string) => string;
}

interface UploadHelperBridge {
  pickFiles?: (
    multiple: boolean,
    accept: string,
    directory: boolean
  ) => Promise<unknown>;
}

const toSelection = (value: unknown): UploadRuntimeSelection | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  const name = typeof record.name === 'string' ? record.name : '';
  if (!name) {
    return null;
  }

  const rawData = record.data;
  let data: Uint8Array | File = new Uint8Array(0);
  if (rawData instanceof Uint8Array || rawData instanceof File) {
    data = rawData;
  } else if (rawData instanceof ArrayBuffer) {
    data = new Uint8Array(rawData);
  }

  return {
    data,
    name,
    path: typeof record.path === 'string' ? record.path : undefined
  };
};

const getPlatformBridge = (): PlatformBridge | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const globalWindow = window as Window & { __sdkworkPlatform?: unknown };
  if (!globalWindow.__sdkworkPlatform || typeof globalWindow.__sdkworkPlatform !== 'object') {
    return null;
  }

  return globalWindow.__sdkworkPlatform as PlatformBridge;
};

const getUploadHelperBridge = (): UploadHelperBridge | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const globalWindow = window as Window & { __sdkworkUploadHelper?: unknown };
  if (!globalWindow.__sdkworkUploadHelper || typeof globalWindow.__sdkworkUploadHelper !== 'object') {
    return null;
  }

  return globalWindow.__sdkworkUploadHelper as UploadHelperBridge;
};

export interface UploadRuntimeServiceAdapter {
  getPlatform(): UploadRuntimePlatform;
  convertFileSrc(path: string): string;
  pickFiles(
    multiple: boolean,
    accept: string,
    directory: boolean
  ): Promise<UploadRuntimeSelection[]>;
}

const localUploadRuntimeAdapter: UploadRuntimeServiceAdapter = {
  getPlatform(): UploadRuntimePlatform {
    const platform = getPlatformBridge();
    if (!platform?.getPlatform) {
      return 'web';
    }
    return platform.getPlatform();
  },
  convertFileSrc(path: string): string {
    const platform = getPlatformBridge();
    if (!platform?.convertFileSrc) {
      return path;
    }
    return platform.convertFileSrc(path);
  },
  async pickFiles(
    multiple: boolean,
    accept: string,
    directory: boolean
  ): Promise<UploadRuntimeSelection[]> {
    const uploadHelper = getUploadHelperBridge();
    if (!uploadHelper?.pickFiles) {
      return [];
    }

    const result = await uploadHelper.pickFiles(multiple, accept, directory);
    if (!Array.isArray(result)) {
      return [];
    }

    return result
      .map((item) => toSelection(item))
      .filter((item): item is UploadRuntimeSelection => item !== null);
  }
};

const controller = createServiceAdapterController<UploadRuntimeServiceAdapter>(
  localUploadRuntimeAdapter
);

export const uploadRuntimeService: UploadRuntimeServiceAdapter = controller.service;
export const setUploadRuntimeServiceAdapter = controller.setAdapter;
export const getUploadRuntimeServiceAdapter = controller.getAdapter;
export const resetUploadRuntimeServiceAdapter = controller.resetAdapter;
