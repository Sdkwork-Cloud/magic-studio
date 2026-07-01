import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LocalFileSystemProvider } from '../src/providers/local';
import { setRuntimePlatformServiceAdapter, resetRuntimePlatformServiceAdapter } from '../src/services/runtimePlatformService';

describe('LocalFileSystemProvider', () => {
  beforeEach(() => {
    resetRuntimePlatformServiceAdapter();
  });

  it('ensures the parent directory before writing a file', async () => {
    const createDir = vi.fn(async () => {});
    const writeFile = vi.fn(async () => {});

    setRuntimePlatformServiceAdapter({
      getPlatformApi: () => ({
        readDir: async () => [],
        readFile: async () => '',
        writeFile,
        readFileBinary: async () => new Uint8Array(),
        writeFileBinary: async () => {},
        readFileBlob: async () => new Blob(),
        writeFileBlob: async () => {},
        stat: async () => ({ type: 'file', size: 0, lastModified: Date.now() }),
        createDir,
        delete: async () => {},
        rename: async () => {},
        copyFile: async () => {},
        exists: async () => false,
        mkdir: async () => {},
        readdir: async () => [],
        unlink: async () => {},
        rmdir: async () => {},
      }),
    });

    const provider = new LocalFileSystemProvider();

    await provider.writeFile('C:\\Users\\admin\\.sdkwork\\magicstudio\\system\\indexes\\assets-index.json', '[]');

    expect(createDir).toHaveBeenCalledWith('C:\\Users\\admin\\.sdkwork\\magicstudio\\system\\indexes');
    expect(writeFile).toHaveBeenCalledWith(
      'C:\\Users\\admin\\.sdkwork\\magicstudio\\system\\indexes\\assets-index.json',
      '[]'
    );
  });
});
