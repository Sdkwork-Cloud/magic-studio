import { access, readFile } from 'node:fs/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockResolveAssetUrl = vi.fn();
const mockReadDriveFileContent = vi.fn();
const mockWriteBinary = vi.fn();
const mockPath = vi.fn();
const mockExists = vi.fn();
const mockRuntimeKind = vi.fn();
const mockFetch = vi.fn();

vi.mock('@sdkwork/magic-studio-assets', () => ({
  assetService: {
    resolveAssetUrl: mockResolveAssetUrl,
  },
}));

vi.mock('@sdkwork/magic-studio-core/platform', () => ({
  getPlatformRuntime: () => ({
    system: {
      kind: mockRuntimeKind,
      path: mockPath,
    },
    fileSystem: {
      exists: mockExists,
      writeBinary: mockWriteBinary,
    },
  }),
  encodeTextToBytes: (content: string) => new TextEncoder().encode(content),
  decodeBytesToText: (content: Uint8Array) => new TextDecoder().decode(content),
  isDesktopShellRuntimeKind: (kind: string) => kind === 'desktop',
}));

vi.mock('@sdkwork/magic-studio-core/sdk', () => ({
  createRuntimeMagicStudioServerClient: () => ({
    readDriveFileContent: mockReadDriveFileContent,
  }),
  isMagicStudioServerRuntimeSupported: () => true,
  readDefaultPlatformRuntime: () => ({
    system: {
      kind: mockRuntimeKind,
      path: mockPath,
    },
    fileSystem: {
      exists: mockExists,
      writeBinary: mockWriteBinary,
    },
  }),
}));

vi.mock('@sdkwork/magic-studio-fs', () => ({
  vfs: {
    readFile: vi.fn(),
    readFileBinary: vi.fn(),
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
    mockResolveAssetUrl.mockReset();
    mockReadDriveFileContent.mockReset();
    mockWriteBinary.mockReset();
    mockPath.mockReset();
    mockExists.mockReset();
    mockRuntimeKind.mockReset();
    mockFetch.mockReset();

    mockRuntimeKind.mockReturnValue('desktop');
    mockPath.mockResolvedValue('/Downloads');
    mockExists.mockResolvedValue(false);
    mockResolveAssetUrl.mockImplementation(async ({ path }: { path: string }) => path);
    vi.stubGlobal('fetch', mockFetch);
  });

  it('downloads desktop files from the canonical server content endpoint into the platform downloads folder', async () => {
    mockReadDriveFileContent.mockResolvedValue({
      requestId: 'request-drive-content',
      timestamp: '2026-04-25T00:00:00.000Z',
      data: {
        itemId: 'file-1',
        mimeType: 'image/png',
        encoding: 'base64',
        content: 'cG9zdGVyLWJ5dGVz',
        updatedAt: '2026-04-25T00:00:00.000Z',
      },
    });

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
    expect(mockResolveAssetUrl).toHaveBeenCalledWith({
      path: 'https://cdn.example.com/poster.png',
    });
    expect(mockReadDriveFileContent).toHaveBeenCalledWith('file-1');
    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockWriteBinary).toHaveBeenCalledTimes(1);

    const [writtenPath, writtenBytes] = mockWriteBinary.mock.calls[0] as [string, Uint8Array];
    expect(writtenPath).toBe('/Downloads/poster.png');
    expect(new TextDecoder().decode(writtenBytes)).toBe('poster-bytes');
    expect(result.data).toEqual(['/Downloads/poster.png']);
  });

  it('downloads browser files through a resolved resource url without pretending server content succeeded', async () => {
    mockRuntimeKind.mockReturnValue('web');
    mockResolveAssetUrl.mockResolvedValue('https://cdn.example.com/poster.png');
    mockFetch.mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new TextEncoder().encode('poster-bytes').buffer,
    });

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
        previewUrl: 'assets://drive/poster.png',
      },
    ]);

    expect(result.success).toBe(true);
    expect(mockResolveAssetUrl).toHaveBeenCalledWith({
      path: 'assets://drive/poster.png',
    });
    expect(mockFetch).toHaveBeenCalledWith('https://cdn.example.com/poster.png');
    expect(mockReadDriveFileContent).not.toHaveBeenCalled();
    expect(mockWriteBinary).not.toHaveBeenCalled();
    expect(result.data).toEqual(['poster.png']);
  });

  it('falls back to canonical server text content when no remote resource url is available', async () => {
    mockReadDriveFileContent.mockResolvedValue({
      requestId: 'request-drive-content',
      timestamp: '2026-04-25T00:00:00.000Z',
      data: {
        itemId: 'file-2',
        mimeType: 'text/markdown',
        encoding: 'utf-8',
        content: '# hello world',
        updatedAt: '2026-04-25T00:00:00.000Z',
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
    expect(mockReadDriveFileContent).toHaveBeenCalledWith('file-2');
    expect(mockWriteBinary).toHaveBeenCalledTimes(1);

    const [writtenPath, writtenBytes] = mockWriteBinary.mock.calls[0] as [string, Uint8Array];
    expect(writtenPath).toBe('/Downloads/notes.md');
    expect(new TextDecoder().decode(writtenBytes)).toBe('# hello world');
    expect(result.data).toEqual(['/Downloads/notes.md']);
  });

  it('ships a drive business contract typecheck guard for generated SDK drift', async () => {
    await expect(
      access(
        new URL('../src/services/driveBusinessService.contract-typecheck.ts', import.meta.url),
      ),
    ).resolves.toBeUndefined();

    const source = await readFile(
      new URL('../src/services/driveBusinessService.contract-typecheck.ts', import.meta.url),
      'utf8',
    );

    expect(source.includes('spring-ai-plus-app-api/sdkwork-sdk-app')).toBe(false);
    expect(source.includes('@sdkwork/magic-studio-server')).toBe(true);
  });

  it('ships a dedicated drive contract tsconfig', async () => {
    await expect(
      access(
        new URL('../tsconfig.contract.json', import.meta.url),
      ),
    ).resolves.toBeUndefined();
  });
});
