export interface NativeCompressionInvokeService {
  decompressBuffer(data: Uint8Array, targetPath: string): Promise<void>;
  decompressFile(sourcePath: string, targetPath: string): Promise<void>;
  compressFiles(sourcePaths: string[]): Promise<Uint8Array>;
}

type TauriInvoke = <TReturn>(
  command: string,
  args?: Record<string, unknown>
) => Promise<TReturn>;

const loadInvoke = async (): Promise<TauriInvoke> => {
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke as TauriInvoke;
};

class NativeCompressionInvokeServiceImpl implements NativeCompressionInvokeService {
  async decompressBuffer(data: Uint8Array, targetPath: string): Promise<void> {
    const invoke = await loadInvoke();
    await invoke<void>('decompress_buffer', { data: Array.from(data), targetPath });
  }

  async decompressFile(sourcePath: string, targetPath: string): Promise<void> {
    const invoke = await loadInvoke();
    await invoke<void>('decompress_file', { sourcePath, targetPath });
  }

  async compressFiles(sourcePaths: string[]): Promise<Uint8Array> {
    const invoke = await loadInvoke();
    const result = await invoke<number[]>('compress_files', { sourcePaths });
    return new Uint8Array(result);
  }
}

const localNativeCompressionInvokeService: NativeCompressionInvokeService =
  new NativeCompressionInvokeServiceImpl();

let currentNativeCompressionInvokeService: NativeCompressionInvokeService =
  localNativeCompressionInvokeService;

export const nativeCompressionInvokeService: NativeCompressionInvokeService = {
  decompressBuffer: (data: Uint8Array, targetPath: string): Promise<void> =>
    currentNativeCompressionInvokeService.decompressBuffer(data, targetPath),
  decompressFile: (sourcePath: string, targetPath: string): Promise<void> =>
    currentNativeCompressionInvokeService.decompressFile(sourcePath, targetPath),
  compressFiles: (sourcePaths: string[]): Promise<Uint8Array> =>
    currentNativeCompressionInvokeService.compressFiles(sourcePaths)
};

export const setNativeCompressionInvokeServiceAdapter = (
  adapter: NativeCompressionInvokeService
): void => {
  currentNativeCompressionInvokeService = adapter;
};

export const getNativeCompressionInvokeServiceAdapter =
  (): NativeCompressionInvokeService => currentNativeCompressionInvokeService;

export const resetNativeCompressionInvokeServiceAdapter = (): void => {
  currentNativeCompressionInvokeService = localNativeCompressionInvokeService;
};
