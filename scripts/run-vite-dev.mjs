import { spawnSync } from 'node:child_process';
import { resolveAppMode } from './app-mode.mjs';
import { ensureSdkModeReady, resolveSdkMode } from './sdk-mode.mjs';

const sdkMode = resolveSdkMode();
const appMode = resolveAppMode({ command: 'dev' });
ensureSdkModeReady(sdkMode);

const env = {
  ...process.env,
  MAGIC_STUDIO_SDK_MODE: sdkMode,
  MAGIC_STUDIO_VITE_MODE: appMode,
};

console.log(`[dev] Using SDK mode: ${sdkMode}`);
console.log(`[dev] Using app mode: ${appMode}`);

const result = spawnSync(`pnpm exec vite --mode ${appMode}`, {
  stdio: 'inherit',
  env,
  shell: true,
});

process.exit(result.status ?? 0);
