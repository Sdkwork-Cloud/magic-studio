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

  it('splits heavy third-party families into dedicated vendor chunks', async () => {
    const config = await loadRootConfig();
    const output = Array.isArray(config.build?.rollupOptions?.output)
      ? config.build?.rollupOptions?.output[0]
      : config.build?.rollupOptions?.output;
    const manualChunks = output?.manualChunks;

    expect(typeof manualChunks).toBe('function');

    if (typeof manualChunks !== 'function') {
      return;
    }

    const rollupMeta = {} as Parameters<typeof manualChunks>[1];

    expect(manualChunks('/workspace/node_modules/react/index.js', rollupMeta)).toBe('vendor-react');
    expect(manualChunks('/workspace/node_modules/@monaco-editor/react/dist/index.js', rollupMeta)).toBe('vendor-monaco');
    expect(manualChunks('/workspace/node_modules/@xterm/xterm/lib/xterm.js', rollupMeta)).toBe('vendor-terminal');
    expect(manualChunks('/workspace/node_modules/@aws-sdk/client-s3/dist-es/index.js', rollupMeta)).toBe('vendor-cloud');
    expect(manualChunks('/workspace/node_modules/@google/genai/dist/index.js', rollupMeta)).toBe('vendor-ai');
  });
});
