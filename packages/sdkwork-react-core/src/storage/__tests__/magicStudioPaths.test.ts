import { describe, expect, it } from 'vitest';

import {
  buildMagicStudioRootLayout,
  buildMagicStudioProjectLayout,
  buildMagicStudioUserLayout,
  resolveMagicStudioRoot,
} from '../magicStudioPaths';

describe('magicStudioPaths', () => {
  it('builds project roots under ~/.sdkwork/magicstudio by default', () => {
    const layout = buildMagicStudioProjectLayout({
      rootDir: '/Users/demo/.sdkwork/magicstudio',
      workspaceId: 'ws-1',
      projectId: 'proj-1',
    });

    expect(layout.projectRoot).toContain('/.sdkwork/magicstudio/workspaces/ws-1/projects/proj-1');
    expect(layout.originalVideoDir).toContain('/media/originals/video');
    expect(layout.renderCacheDir).toContain('/cache/render');
    expect(layout.masterExportsDir).toContain('/exports/masters');
  });

  it('supports cache and export root overrides while keeping canonical project ownership', () => {
    const layout = buildMagicStudioProjectLayout({
      rootDir: 'C:\\Users\\demo\\.sdkwork\\magicstudio',
      workspaceId: 'ws-1',
      projectId: 'proj-1',
      cacheRootDir: 'D:\\MagicStudioCache',
      exportsRootDir: 'E:\\MagicStudioExports',
    });

    expect(layout.projectRoot).toBe(
      'C:\\Users\\demo\\.sdkwork\\magicstudio\\workspaces\\ws-1\\projects\\proj-1'
    );
    expect(layout.cacheRoot).toBe('D:\\MagicStudioCache\\ws-1\\proj-1\\cache');
    expect(layout.exportsRoot).toBe('E:\\MagicStudioExports\\ws-1\\proj-1\\exports');
    expect(layout.waveformsCacheDir).toBe('D:\\MagicStudioCache\\ws-1\\proj-1\\cache\\waveforms');
  });

  it('builds canonical system and user directories for the MagicStudio filesystem contract', () => {
    const rootLayout = buildMagicStudioRootLayout({
      rootDir: '/Users/demo/.sdkwork/magicstudio',
    });
    const userLayout = buildMagicStudioUserLayout({
      rootDir: '/Users/demo/.sdkwork/magicstudio',
      userId: 'user-1',
    });

    expect(rootLayout.systemLibraryRoot).toBe('/Users/demo/.sdkwork/magicstudio/system/library');
    expect(rootLayout.systemCacheRoot).toBe('/Users/demo/.sdkwork/magicstudio/system/cache');
    expect(rootLayout.systemIntegrationsRoot).toBe(
      '/Users/demo/.sdkwork/magicstudio/system/integrations'
    );
    expect(rootLayout.systemSkillsRoot).toBe(
      '/Users/demo/.sdkwork/magicstudio/system/integrations/skills'
    );
    expect(rootLayout.systemMcpRoot).toBe(
      '/Users/demo/.sdkwork/magicstudio/system/integrations/mcp'
    );
    expect(rootLayout.systemPluginsRoot).toBe(
      '/Users/demo/.sdkwork/magicstudio/system/integrations/plugins'
    );
    expect(rootLayout.systemThumbnailCacheDir).toBe(
      '/Users/demo/.sdkwork/magicstudio/system/cache/thumbnails'
    );
    expect(userLayout.userRoot).toBe('/Users/demo/.sdkwork/magicstudio/users/user-1');
    expect(userLayout.userPreferencesFile).toBe(
      '/Users/demo/.sdkwork/magicstudio/users/user-1/preferences.json'
    );
    expect(userLayout.templatesDir).toBe('/Users/demo/.sdkwork/magicstudio/users/user-1/templates');
    expect(userLayout.chatsDir).toBe('/Users/demo/.sdkwork/magicstudio/users/user-1/chats');
  });

  it('expands tilde-based roots against the user home directory', () => {
    expect(resolveMagicStudioRoot('~/.sdkwork/magicstudio', '/Users/demo')).toBe(
      '/Users/demo/.sdkwork/magicstudio'
    );
  });
});
