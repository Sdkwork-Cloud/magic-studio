import { spawnSync } from 'node:child_process';
import { resolveAppMode } from './app-mode.mjs';
import { ensureSdkModeReady, resolveSdkMode } from './sdk-mode.mjs';

const sdkMode = resolveSdkMode();
const appMode = resolveAppMode({ command: 'build' });
ensureSdkModeReady(sdkMode);

const env = {
  ...process.env,
  MAGIC_STUDIO_SDK_MODE: sdkMode,
  MAGIC_STUDIO_VITE_MODE: appMode,
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
console.log(`[build] Using app mode: ${appMode}`);
run(`pnpm exec tsc -p "${tsconfig}"`);
run(`pnpm exec vite build --mode ${appMode}`);
