import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetItemDetail = vi.fn();
const mockGetItemContent = vi.fn();
const mockDownloadToFile = vi.fn();
const mockWriteBinary = vi.fn();
const mockPath = vi.fn();
const mockExists = vi.fn();

vi.mock('@sdkwork/react-core', () => ({
  getAppSdkClientWithSession: () => ({
    drive: {
      listItems: vi.fn(),
      createFolder: vi.fn(),
      getItemDetail: mockGetItemDetail,
      getItemContent: mockGetItemContent,
      updateItemContent: vi.fn(),
      deleteItem: vi.fn(),
      batchDeleteItems: vi.fn(),
      restoreItem: vi.fn(),
      clearTrash: vi.fn(),
      renameItem: vi.fn(),
      favoriteItem: vi.fn(),
      unfavoriteItem: vi.fn(),
      moveItem: vi.fn(),
    },
    upload: {
      getStorageUsage: vi.fn(),
    },
    filesystem: {
      getPrimaryDisk: vi.fn(),
    },
  }),
  uploadViaPresignedUrl: vi.fn(),
  platform: {
    getPlatform: () => 'desktop',
    getPath: mockPath,
    readFileBinary: vi.fn(),
  },
  getPlatformRuntime: () => ({
    system: {
      kind: () => 'desktop',
      path: mockPath,
    },
    network: {
      downloadToFile: mockDownloadToFile,
    },
    fileSystem: {
      exists: mockExists,
      writeBinary: mockWriteBinary,
    },
  }),
  encodeTextToBytes: (content: string) => new TextEncoder().encode(content),
}));

vi.mock('@sdkwork/react-fs', () => ({
  vfs: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
  },
}));

vi.mock('../src/services/driveService', () => ({
  driveService: {
    getDefaultPath: vi.fn(),
    list: vi.fn(),
    getProvider: vi.fn(() => ({
      getStats: vi.fn(),
      hasCapability: vi.fn(),
      move: vi.fn(),
    })),
    createFolder: vi.fn(),
    uploadFile: vi.fn(),
    importFile: vi.fn(),
    delete: vi.fn(),
    restore: vi.fn(),
    emptyTrash: vi.fn(),
    rename: vi.fn(),
    toggleStar: vi.fn(),
    touch: vi.fn(),
  },
}));

describe('driveBusinessService downloadItems', () => {
  beforeEach(() => {
    vi.resetModules();
    mockGetItemDetail.mockReset();
    mockGetItemContent.mockReset();
    mockDownloadToFile.mockReset();
    mockWriteBinary.mockReset();
    mockPath.mockReset();
    mockExists.mockReset();

    mockPath.mockResolvedValue('/Downloads');
    mockExists.mockResolvedValue(false);
  });

  it('downloads files through an existing resource url into the platform downloads folder', async () => {
    const { driveBusinessService } = await import('../src/services/driveBusinessService');

    const result = await driveBusinessService.downloadItems([
      {
        id: 'file-1',
        parentId: null,
        name: 'poster.png',
        type: 'file',
        size: 1024,
        mimeType: 'image/png',
        updatedAt: 1,
        createdAt: 1,
        previewUrl: 'https://cdn.example.com/poster.png',
      },
    ]);

    expect(result.success).toBe(true);
    expect(mockDownloadToFile).toHaveBeenCalledWith(
      'https://cdn.example.com/poster.png',
      '/Downloads/poster.png'
    );
    expect(result.data).toEqual(['/Downloads/poster.png']);
  });

  it('falls back to drive text content when no remote resource url is available', async () => {
    mockGetItemDetail.mockResolvedValue({
      code: '2000',
      msg: 'ok',
      data: {
        itemId: 'file-2',
        itemName: 'notes.md',
      },
    });
    mockGetItemContent.mockResolvedValue({
      code: '2000',
      msg: 'ok',
      data: {
        text: '# hello world',
      },
    });

    const { driveBusinessService } = await import('../src/services/driveBusinessService');

    const result = await driveBusinessService.downloadItems([
      {
        id: 'file-2',
        parentId: null,
        name: 'notes.md',
        type: 'file',
        size: 12,
        mimeType: 'text/markdown',
        updatedAt: 1,
        createdAt: 1,
      },
    ]);

    expect(result.success).toBe(true);
    expect(mockGetItemDetail).toHaveBeenCalledWith('file-2');
    expect(mockGetItemContent).toHaveBeenCalledWith('file-2');
    expect(mockWriteBinary).toHaveBeenCalledTimes(1);

    const [writtenPath, writtenBytes] = mockWriteBinary.mock.calls[0] as [string, Uint8Array];
    expect(writtenPath).toBe('/Downloads/notes.md');
    expect(new TextDecoder().decode(writtenBytes)).toBe('# hello world');
    expect(result.data).toEqual(['/Downloads/notes.md']);
  });
});
