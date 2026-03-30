import { describe, expect, it } from 'vitest';
import { createTauriCliInvocation, resolveSpawnExitCode } from '../scripts/tauri-cli-runner.mjs';

describe('tauri cli runner', () => {
  it('uses npm_execpath on Windows instead of spawning pnpm.cmd directly', () => {
    const invocation = createTauriCliInvocation({
      env: {
        npm_execpath: String.raw`C:\nvm4w\nodejs\node_modules\pnpm\bin\pnpm.cjs`,
        npm_node_execpath: String.raw`C:\nvm4w\nodejs\node.exe`,
      },
      platform: 'win32',
      tauriArgs: ['dev'],
    });

    expect(invocation).toEqual({
      command: String.raw`C:\nvm4w\nodejs\node.exe`,
      args: [String.raw`C:\nvm4w\nodejs\node_modules\pnpm\bin\pnpm.cjs`, 'exec', 'tauri', 'dev'],
      shell: false,
    });
  });

  it('treats spawn failures without a child exit status as an error', () => {
    const exitCode = resolveSpawnExitCode({
      status: null,
      error: Object.assign(new Error('spawnSync pnpm.cmd EINVAL'), { code: 'EINVAL' }),
    });

    expect(exitCode).toBe(1);
  });
});
