import { createServiceAdapterController } from '../utils/serviceAdapter.ts';
import {
  isDesktopWindowPlatformRuntime,
  readWindowPlatformRuntime,
  readWindowPlatformRuntimeKind,
  type WindowPlatformRuntimeKind,
} from './runtimeGlobal.ts';

export interface UploadRuntimeSelection {
  data: Uint8Array | File;
  name: string;
  path?: string;
}

interface PlatformRuntimeBridge {
  fileSystem?: {
    convertFileSrc?: (path: string) => string;
  };
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

const getPlatformRuntimeBridge = (): PlatformRuntimeBridge | null =>
  readWindowPlatformRuntime<PlatformRuntimeBridge>();

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
  getRuntimeKind(): WindowPlatformRuntimeKind;
  isDesktopShellRuntime(): boolean;
  convertFileSrc(path: string): string;
  pickFiles(
    multiple: boolean,
    accept: string,
    directory: boolean
  ): Promise<UploadRuntimeSelection[]>;
}

const localUploadRuntimeAdapter: UploadRuntimeServiceAdapter = {
  getRuntimeKind(): WindowPlatformRuntimeKind {
    return readWindowPlatformRuntimeKind();
  },
  isDesktopShellRuntime(): boolean {
    return isDesktopWindowPlatformRuntime();
  },
  convertFileSrc(path: string): string {
    const runtime = getPlatformRuntimeBridge();
    return runtime?.fileSystem?.convertFileSrc?.(path) ?? path;
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
