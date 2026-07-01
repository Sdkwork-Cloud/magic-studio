import { getPlatformRuntime, getPlatformToolKit } from '@sdkwork/magic-studio-core/platform';

export interface RuntimeCompressionService {
  decompressBuffer(data: Uint8Array, targetPath: string): Promise<void>;
  decompressFile(sourcePath: string, targetPath: string): Promise<void>;
  compressFiles(sourcePaths: string[]): Promise<Uint8Array>;
}

const joinPath = (basePath: string, ...segments: string[]): string => {
  const separator = basePath.includes('\\') ? '\\' : '/';
  const trimEdge = (value: string): string => value.replace(/^[\\/]+|[\\/]+$/g, '');
  let output = basePath.replace(/[\\/]+$/g, '');
  segments.forEach((segment) => {
    const value = trimEdge(segment);
    if (!value) {
      return;
    }
    output = `${output}${separator}${value}`;
  });
  return output;
};

const createTempArchivePath = async (): Promise<string> => {
  const runtime = getPlatformRuntime();
  const tempRoot = await runtime.system.path('temp');
  const suffix =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return joinPath(tempRoot, `sdkwork-compression-${suffix}.zip`);
};

class RuntimeCompressionServiceImpl implements RuntimeCompressionService {
  async decompressBuffer(data: Uint8Array, targetPath: string): Promise<void> {
    const runtime = getPlatformRuntime();
    const toolkit = getPlatformToolKit();
    const tempArchivePath = await createTempArchivePath();

    try {
      await runtime.fileSystem.writeBinary(tempArchivePath, data);
      await toolkit.compression.unzipToDirectory(tempArchivePath, targetPath);
    } finally {
      await runtime.fileSystem.remove(tempArchivePath).catch(() => {});
    }
  }

  async decompressFile(sourcePath: string, targetPath: string): Promise<void> {
    await getPlatformToolKit().compression.unzipToDirectory(sourcePath, targetPath);
  }

  async compressFiles(sourcePaths: string[]): Promise<Uint8Array> {
    return getPlatformToolKit().compression.zipLocalPaths(sourcePaths);
  }
}

const localRuntimeCompressionService: RuntimeCompressionService =
  new RuntimeCompressionServiceImpl();

let currentRuntimeCompressionService: RuntimeCompressionService =
  localRuntimeCompressionService;

export const runtimeCompressionService: RuntimeCompressionService = {
  decompressBuffer: (data: Uint8Array, targetPath: string): Promise<void> =>
    currentRuntimeCompressionService.decompressBuffer(data, targetPath),
  decompressFile: (sourcePath: string, targetPath: string): Promise<void> =>
    currentRuntimeCompressionService.decompressFile(sourcePath, targetPath),
  compressFiles: (sourcePaths: string[]): Promise<Uint8Array> =>
    currentRuntimeCompressionService.compressFiles(sourcePaths)
};

export const setRuntimeCompressionServiceAdapter = (
  adapter: RuntimeCompressionService
): void => {
  currentRuntimeCompressionService = adapter;
};

export const getRuntimeCompressionServiceAdapter =
  (): RuntimeCompressionService => currentRuntimeCompressionService;

export const resetRuntimeCompressionServiceAdapter = (): void => {
  currentRuntimeCompressionService = localRuntimeCompressionService;
};
