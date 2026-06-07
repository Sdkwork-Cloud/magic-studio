import { access, readFile } from 'node:fs/promises';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MagicStudioServerClient } from '@sdkwork/magic-studio-server';

const mocks = vi.hoisted(() => {
  const serverClient = {
    createWorkspaceProject: vi.fn(),
    importAssetFile: vi.fn(),
    listWorkspaces: vi.fn(),
    createWorkspace: vi.fn(),
  };

  return {
    createRuntimeMagicStudioServerClient: vi.fn(() => serverClient),
    isMagicStudioServerRuntimeSupported: vi.fn(() => true),
    readDefaultPlatformRuntime: vi.fn(() => 'server'),
    resolveRuntimeMagicStudioRootLayout: vi.fn(),
    serverClient,
    vfsCreateDir: vi.fn(),
    vfsDelete: vi.fn(),
    vfsWriteFileBinary: vi.fn(),
  };
});

vi.mock('@sdkwork/magic-studio-core/sdk', () => ({
  createRuntimeMagicStudioServerClient:
    mocks.createRuntimeMagicStudioServerClient,
  isMagicStudioServerRuntimeSupported: mocks.isMagicStudioServerRuntimeSupported,
  readDefaultPlatformRuntime: mocks.readDefaultPlatformRuntime,
}));

vi.mock('@sdkwork/magic-studio-core/storage', () => ({
  isCanonicalMagicStudioAssetReference: (value: unknown) =>
    typeof value === 'string' &&
    (value.startsWith('assets://') ||
      value.startsWith('file://') ||
      value.startsWith('desktop://')),
  isRenderableAssetUrl: (value: unknown) =>
    typeof value === 'string' &&
    (value.startsWith('http:') ||
      value.startsWith('https:') ||
      value.startsWith('blob:') ||
      value.startsWith('data:') ||
      (value.startsWith('asset:') && !value.startsWith('assets://'))),
  normalizeMagicStudioAssetReference: (value: unknown) => {
    if (typeof value !== 'string') {
      return null;
    }
    const normalized = value.trim();
    if (!normalized) {
      return null;
    }
    if (
      normalized.startsWith('assets://') ||
      normalized.startsWith('file://') ||
      normalized.startsWith('desktop://') ||
      normalized.startsWith('http:') ||
      normalized.startsWith('https:') ||
      normalized.startsWith('blob:') ||
      normalized.startsWith('data:') ||
      (normalized.startsWith('asset:') && !normalized.startsWith('assets://'))
    ) {
      return normalized;
    }
    if (
      normalized.startsWith('/') ||
      normalized.startsWith('\\\\') ||
      /^[a-zA-Z]:([\\/]|$)/.test(normalized)
    ) {
      return `file://${normalized}`;
    }
    return null;
  },
  resolveMagicStudioAssetReferenceName: (value: string, fallback = 'asset') => {
    const withoutQuery = value.split('?')[0]?.split('#')[0] || value;
    const normalized = withoutQuery
      .replace(/^assets:\/\//, '')
      .replace(/^file:\/\//, '')
      .replace(/^desktop:\/\//, '');
    return normalized.split(/[\\/]/).pop() || fallback;
  },
  resolveRuntimeMagicStudioRootLayout: mocks.resolveRuntimeMagicStudioRootLayout,
}));

vi.mock('@sdkwork/magic-studio-fs', () => ({
  vfs: {
    createDir: mocks.vfsCreateDir,
    delete: mocks.vfsDelete,
    writeFileBinary: mocks.vfsWriteFileBinary,
  },
}));

type WorkspaceServerClient = Pick<
  MagicStudioServerClient,
  'createWorkspaceProject' | 'importAssetFile' | 'listWorkspaces' | 'createWorkspace'
>;

const serverClient = mocks.serverClient as unknown as WorkspaceServerClient;

function envelope<T>(data: T) {
  return {
    requestId: 'request-workspace',
    timestamp: '2026-04-25T00:00:00.000Z',
    data,
    meta: {
      version: '2026-04-25',
    },
  };
}

function listEnvelope<T>(items: T[]) {
  return {
    requestId: 'request-workspace-list',
    timestamp: '2026-04-25T00:00:00.000Z',
    items,
    meta: {
      page: 1,
      pageSize: 20,
      total: items.length,
      version: '2026-04-25',
    },
  };
}

function createImportedCoverAsset(uri?: string) {
  return {
    id: 'asset-db-1',
    uuid: 'asset-uuid-1',
    assetId: 'asset-1',
    key: 'workspace-cover',
    title: 'project-cover.png',
    primaryType: 'image',
    payload: {
      assets: [],
    },
    scope: {
      workspaceId: 'workspace-1',
      domain: 'asset-center',
    },
    storage: {
      mode: 'hybrid',
      primary: uri
        ? {
            protocol: 'assets',
            uri,
          }
        : {
            protocol: 'assets',
          },
      cacheable: true,
    },
    status: 'ready',
    versionInfo: {
      version: 1,
    },
    createdAt: '2026-04-25T00:00:00.000Z',
    updatedAt: '2026-04-25T00:00:00.000Z',
  };
}

import { vfs } from '@sdkwork/magic-studio-fs';
import { WorkspaceService } from '../workspaceService';

describe('WorkspaceService', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('initializes the canonical runtime workspaces root', async () => {
    mocks.resolveRuntimeMagicStudioRootLayout.mockResolvedValue({
      workspacesRoot: '/Volumes/MagicStudio/workspaces',
      systemTempRoot: '/Volumes/MagicStudio/tmp',
    });

    const service = new WorkspaceService();
    await service.initialize();

    expect(mocks.readDefaultPlatformRuntime).toHaveBeenCalledWith(
      'WorkspaceService',
    );
    expect(mocks.resolveRuntimeMagicStudioRootLayout).toHaveBeenCalledWith(
      'server',
    );
    expect(vi.mocked(vfs.createDir)).toHaveBeenCalledWith(
      '/Volumes/MagicStudio/workspaces',
    );
  });

  it('imports project cover images through the runtime server before creating a project', async () => {
    mocks.resolveRuntimeMagicStudioRootLayout.mockResolvedValue({
      workspacesRoot: '/Volumes/MagicStudio/workspaces',
      systemTempRoot: '/Volumes/MagicStudio/tmp',
    });
    vi.mocked(serverClient.importAssetFile).mockResolvedValue(
      envelope(
        createImportedCoverAsset(
          'assets://workspaces/workspace-1/projects/project-1/media/originals/image/project-cover.png',
        ) as never,
      ),
    );
    vi.mocked(serverClient.createWorkspaceProject).mockResolvedValue(
      envelope({
        id: 'project-1',
        workspaceId: 'workspace-1',
        name: 'Demo Project',
        description: 'demo description',
        type: 'APP',
        thumbnailUrl:
          'assets://workspaces/workspace-1/projects/project-1/media/originals/image/project-cover.png',
        createdAt: '2026-04-25T00:00:00.000Z',
        updatedAt: '2026-04-25T00:00:00.000Z',
      } as never),
    );

    const service = new WorkspaceService();
    const result = await service.createProject(
      'workspace-1',
      'Demo Project',
      'APP',
      'demo description',
      {
        data: new Uint8Array([1, 2, 3]),
        name: 'project-cover.png',
      },
    );

    expect(vi.mocked(vfs.writeFileBinary)).toHaveBeenCalledWith(
      expect.stringMatching(/\.png$/),
      new Uint8Array([1, 2, 3]),
    );
    expect(serverClient.importAssetFile).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: {
          workspaceId: 'workspace-1',
          domain: 'asset-center',
        },
        type: 'image',
        name: 'project-cover.png',
        metadata: {
          source: 'workspace-project-cover',
        },
      }),
    );
    expect(serverClient.createWorkspaceProject).toHaveBeenCalledWith(
      'workspace-1',
      expect.objectContaining({
        name: 'Demo Project',
        type: 'APP',
        description: 'demo description',
        thumbnailUrl:
          'assets://workspaces/workspace-1/projects/project-1/media/originals/image/project-cover.png',
      }),
    );
    expect(vi.mocked(vfs.delete)).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
    expect(result.data?.uuid).toBe('client-entity:project-1');
    expect(result.data?.coverImage?.path).toBe(
      'assets://workspaces/workspace-1/projects/project-1/media/originals/image/project-cover.png',
    );
    expect(result.data?.coverImage?.url).toBeUndefined();
  });

  it('rejects cover imports that do not return a canonical or renderable reference', async () => {
    mocks.resolveRuntimeMagicStudioRootLayout.mockResolvedValue({
      workspacesRoot: '/Volumes/MagicStudio/workspaces',
      systemTempRoot: '/Volumes/MagicStudio/tmp',
    });
    vi.mocked(serverClient.importAssetFile).mockResolvedValue(
      envelope(createImportedCoverAsset(undefined) as never),
    );

    const service = new WorkspaceService();
    const result = await service.createProject(
      'workspace-1',
      'Demo Project',
      'APP',
      'demo description',
      {
        data: new Uint8Array([1, 2, 3]),
        name: 'project-cover.png',
      },
    );

    expect(serverClient.createWorkspaceProject).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.message).toContain('canonical project cover reference');
  });

  it('loads workspaces through the runtime server client', async () => {
    vi.mocked(serverClient.listWorkspaces).mockResolvedValue(
      listEnvelope([
        {
          id: 'workspace-1',
          name: 'Creative Lab',
          description: 'Workspace for media projects',
          icon: 'https://cdn.example.com/workspaces/creative-lab.png',
          projects: [],
          createdAt: '2026-04-01T00:00:00.000Z',
          updatedAt: '2026-04-05T00:00:00.000Z',
        },
      ] as never),
    );

    const service = new WorkspaceService({ serverClient: serverClient as never });
    const result = await service.findAll();

    expect(serverClient.listWorkspaces).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
    expect(result.data?.content[0]).toMatchObject({
      id: 'workspace-1',
      uuid: 'client-entity:workspace-1',
      name: 'Creative Lab',
      description: 'Workspace for media projects',
      icon: 'https://cdn.example.com/workspaces/creative-lab.png',
    });
  });

  it('keeps the contract guard on the runtime server workspace boundary', async () => {
    const source = await readFile(
      new URL('../workspaceService.contract-typecheck.ts', import.meta.url),
      'utf8',
    );

    expect(source.includes(`spring-ai-plus-${'app'}-api/sdkwork-sdk-${'app'}`)).toBe(
      false,
    );
    expect(source.includes("from '@sdkwork/magic-studio-server'")).toBe(true);
  });

  it('ships a workspace service contract typecheck guard for server contract drift', async () => {
    await expect(
      access(
        new URL('../workspaceService.contract-typecheck.ts', import.meta.url),
      ),
    ).resolves.toBeUndefined();
  });

  it('ships a dedicated workspace contract tsconfig', async () => {
    await expect(
      access(
        new URL('../../../tsconfig.contract.json', import.meta.url),
      ),
    ).resolves.toBeUndefined();
  });
});
