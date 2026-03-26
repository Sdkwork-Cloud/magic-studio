import { spawnSync } from 'node:child_process';
import { ensureSdkModeReady, resolveSdkMode } from './sdk-mode.mjs';

const sdkMode = resolveSdkMode();
ensureSdkModeReady(sdkMode);

const env = {
  ...process.env,
  MAGIC_STUDIO_SDK_MODE: sdkMode,
};
const tsconfig =
  sdkMode === 'git'
    ? 'tsconfig.git-sdk.json'
    : sdkMode === 'npm'
      ? 'tsconfig.npm-sdk.json'
      : 'tsconfig.json';

const run = command => {
  const result = spawnSync(command, {
    stdio: 'inherit',
    env,
    shell: true,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

console.log(`[build] Using SDK mode: ${sdkMode}`);
run(`pnpm exec tsc -p "${tsconfig}"`);
run('pnpm exec vite build');
