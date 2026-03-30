import { describe, expect, it } from 'vitest';

import viteConfig from '../../vite.config';
import { parseDotEnv } from '../../scripts/check-release-api-target.mjs';
import fs from 'node:fs';
import path from 'node:path';

const envTest = parseDotEnv(
  fs.readFileSync(path.resolve(__dirname, '..', '..', '.env.test'), 'utf8')
) as Record<string, string>;

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

  it('injects SDKWORK compatibility env keys for test mode', async () => {
    const config = await loadRootConfig();

    expect(config.define?.['process.env.SDKWORK_API_BASE_URL']).toBe(
      JSON.stringify('https://api-test.sdkwork.com')
    );
    expect(config.define?.['process.env.SDKWORK_ACCESS_TOKEN']).toBe(
      JSON.stringify(envTest.SDKWORK_ACCESS_TOKEN)
    );
    expect(config.define?.['process.env.SDKWORK_PLATFORM']).toBe(JSON.stringify('web'));
  });
});
