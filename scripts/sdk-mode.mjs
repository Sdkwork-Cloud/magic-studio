import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

export const EXTERNAL_APP_SDK_ENTRY = path.resolve(
  repoRoot,
  '../../spring-ai-plus-app-api/sdkwork-sdk-app/sdkwork-app-sdk-typescript/src/index.ts'
);
export const EXTERNAL_SDK_COMMON_ENTRY = path.resolve(
  repoRoot,
  '../../sdk/sdkwork-sdk-commons/sdkwork-sdk-common-typescript/src/index.ts'
);

export const GIT_SDK_ROOT = path.resolve(repoRoot, '.sdk-git-sources');
export const GIT_APP_SDK_CHECKOUT = path.resolve(GIT_SDK_ROOT, 'sdkwork-sdk-app');
export const GIT_SDK_COMMON_CHECKOUT = path.resolve(GIT_SDK_ROOT, 'sdkwork-sdk-commons');
export const GIT_APP_SDK_ENTRY = path.resolve(
  GIT_APP_SDK_CHECKOUT,
  'sdkwork-app-sdk-typescript/src/index.ts'
);
export const GIT_SDK_COMMON_ENTRY = path.resolve(
  GIT_SDK_COMMON_CHECKOUT,
  'sdkwork-sdk-common-typescript/src/index.ts'
);

const SUPPORTED_SDK_MODES = new Set(['external', 'git', 'npm']);

const SDK_MODE_ENTRIES = {
  external: [EXTERNAL_APP_SDK_ENTRY, EXTERNAL_SDK_COMMON_ENTRY],
  git: [GIT_APP_SDK_ENTRY, GIT_SDK_COMMON_ENTRY],
  npm: [],
};

export function resolveSdkMode() {
  const sdkMode = (process.env.MAGIC_STUDIO_SDK_MODE ?? 'external').trim().toLowerCase();

  if (!SUPPORTED_SDK_MODES.has(sdkMode)) {
    throw new Error(`Unsupported MAGIC_STUDIO_SDK_MODE: ${sdkMode}`);
  }

  return sdkMode;
}

export function getSdkEntries(sdkMode) {
  return SDK_MODE_ENTRIES[sdkMode] ?? [];
}

export function validateSdkEntries(sdkMode) {
  const missingEntries = getSdkEntries(sdkMode).filter(entry => !fs.existsSync(entry));

  if (missingEntries.length > 0) {
    throw new Error(
      `MAGIC_STUDIO_SDK_MODE=${sdkMode} requires SDK source checkouts:\n${missingEntries.join('\n')}`
    );
  }
}

export function ensureSdkModeReady(sdkMode) {
  if (sdkMode === 'git') {
    const prepareScript = path.resolve(__dirname, 'prepare-git-sdk-sources.mjs');
    const result = spawnSync(process.execPath, [prepareScript], {
      stdio: 'inherit',
      env: process.env,
    });

    if (result.status !== 0) {
      process.exit(result.status ?? 1);
    }
  }

  if (sdkMode !== 'npm') {
    validateSdkEntries(sdkMode);
  }
}
