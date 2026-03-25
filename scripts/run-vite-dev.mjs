import { spawnSync } from 'node:child_process';
import { resolveSdkMode } from './sdk-mode.mjs';

const sdkMode = resolveSdkMode();
const env = {
  ...process.env,
  MAGIC_STUDIO_SDK_MODE: sdkMode,
};

console.log(`[dev] Using SDK mode: ${sdkMode}`);

const result = spawnSync('pnpm exec vite', {
  stdio: 'inherit',
  env,
  shell: true,
});

process.exit(result.status ?? 0);
