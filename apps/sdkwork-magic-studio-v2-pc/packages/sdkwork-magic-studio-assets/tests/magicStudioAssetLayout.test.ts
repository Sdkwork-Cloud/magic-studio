import { describe, expect, it } from 'vitest';

import {
  buildManagedAssetTarget,
  isManagedAssetAbsolutePath,
} from '../src/asset-center/application/magicStudioAssetLayout';

describe('magicStudioAssetLayout', () => {
  it('routes imported project media into media/originals typed directories', () => {
    const layout = buildManagedAssetTarget({
      workspaceId: 'ws-1',
      projectId: 'proj-1',
      type: 'video',
      assetId: 'asset-1',
      extension: '.mp4',
      rootDir: '/Users/demo/.sdkwork/magicstudio',
    });

    expect(layout.absolutePath).toContain(
      '/workspaces/ws-1/projects/proj-1/media/originals/video/asset-1.mp4'
    );
    expect(layout.virtualPath).toContain(
      'assets://workspaces/ws-1/projects/proj-1/media/originals/video/asset-1.mp4'
    );
    expect(layout.storageClass).toBe('original');
  });

  it('routes unscoped assets into the managed system library', () => {
    const layout = buildManagedAssetTarget({
      workspaceId: 'ws-1',
      type: 'image',
      assetId: 'asset-2',
      extension: '.png',
      rootDir: '/Users/demo/.sdkwork/magicstudio',
    });

    expect(layout.absolutePath).toBe('/Users/demo/.sdkwork/magicstudio/system/library/image/asset-2.png');
    expect(layout.virtualPath).toBe('assets://system/library/image/asset-2.png');
  });

  it('keeps canonical virtual paths when workspace storage is redirected to a dedicated root', () => {
    const layout = buildManagedAssetTarget({
      rootDir: '/Users/demo/.sdkwork/magicstudio',
      workspacesRootDir: '/Volumes/Media/MagicStudioWorkspaces',
      workspaceId: 'ws-1',
      projectId: 'proj-1',
      type: 'video',
      assetId: 'asset-3',
      extension: '.mp4',
    } as any);

    expect(layout.absolutePath).toBe(
      '/Volumes/Media/MagicStudioWorkspaces/ws-1/projects/proj-1/media/originals/video/asset-3.mp4'
    );
    expect(layout.virtualPath).toBe(
      'assets://workspaces/ws-1/projects/proj-1/media/originals/video/asset-3.mp4'
    );
  });

  it('treats managed media and override cache roots as deletable asset storage', () => {
    expect(
      isManagedAssetAbsolutePath(
        {
          rootDir: '/Users/demo/.sdkwork/magicstudio',
          cacheRootDir: '/Volumes/Cache/MagicStudioCache',
        },
        '/Users/demo/.sdkwork/magicstudio/workspaces/ws-1/projects/proj-1/media/generated/video/asset-4.mp4'
      )
    ).toBe(true);

    expect(
      isManagedAssetAbsolutePath(
        {
          rootDir: '/Users/demo/.sdkwork/magicstudio',
          cacheRootDir: '/Volumes/Cache/MagicStudioCache',
        },
        '/Volumes/Cache/MagicStudioCache/ws-1/proj-1/cache/temp/video/asset-4.mp4'
      )
    ).toBe(true);
  });

  it('rejects root-level settings and external files as unmanaged delete targets', () => {
    expect(
      isManagedAssetAbsolutePath(
        {
          rootDir: '/Users/demo/.sdkwork/magicstudio',
        },
        '/Users/demo/.sdkwork/magicstudio/system/settings.json'
      )
    ).toBe(false);

    expect(
      isManagedAssetAbsolutePath(
        {
          rootDir: '/Users/demo/.sdkwork/magicstudio',
        },
        '/Users/demo/Desktop/raw-resource.mp4'
      )
    ).toBe(false);
  });
});
