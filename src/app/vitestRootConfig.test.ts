import { describe, expect, it } from 'vitest';

import viteConfig from '../../vite.config';

const loadRootConfig = async () => {
  if (typeof viteConfig === 'function') {
    return viteConfig({
      command: 'serve',
      mode: 'test',
      isSsrBuild: false,
      isPreview: false,
    });
  }

  return viteConfig;
};

describe('root vitest config', () => {
  it('excludes sibling worktrees from test discovery', async () => {
    const config = await loadRootConfig();

    expect(config.test?.exclude).toContain('**/.worktrees/**');
  });
});
