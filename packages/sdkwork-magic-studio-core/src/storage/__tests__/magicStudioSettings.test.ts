import { describe, expect, it } from 'vitest';

import { resolveMagicStudioStorageConfigFromSettings } from '../magicStudioSettings';

describe('magicStudioSettings', () => {
  it('resolves relative desktop override paths against the resolved MagicStudio root', () => {
    expect(
      resolveMagicStudioStorageConfigFromSettings(
        {
          materialStorage: {
            desktop: {
              rootDir: '~/.sdkwork/magicstudio',
              workspacesRootDir: 'workspaces-ssd',
              cacheRootDir: 'cache-ssd',
              exportsRootDir: 'exports-ssd',
            },
          },
        },
        '/Users/demo'
      )
    ).toEqual({
      rootDir: '/Users/demo/.sdkwork/magicstudio',
      workspacesRootDir: '/Users/demo/.sdkwork/magicstudio/workspaces-ssd',
      cacheRootDir: '/Users/demo/.sdkwork/magicstudio/cache-ssd',
      exportsRootDir: '/Users/demo/.sdkwork/magicstudio/exports-ssd',
    });
  });
});
