import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

export const EXTERNAL_SDK_COMMON_CHECKOUT = path.resolve(
  repoRoot,
  '../sdkwork-sdk-commons'
);
export const EXTERNAL_SDK_COMMON_ENTRY = path.resolve(
  EXTERNAL_SDK_COMMON_CHECKOUT,
  'sdkwork-sdk-common-typescript/src/index.ts'
);
export const EXTERNAL_CORE_PC_REACT_ENTRY = path.resolve(
  repoRoot,
  '../sdkwork-core/sdkwork-core-pc-react/src/index.ts'
);
export const EXTERNAL_UI_PC_REACT_ENTRY = path.resolve(
  repoRoot,
  '../sdkwork-ui/sdkwork-ui-pc-react/src/index.ts'
);
export const EXTERNAL_APPBASE_PC_REACT_ENTRY = path.resolve(
  repoRoot,
  '../sdkwork-appbase/packages/pc-react/foundation/sdkwork-appbase-pc-react/src/index.ts'
);
export const EXTERNAL_SEARCH_PC_REACT_ENTRY = path.resolve(
  repoRoot,
  '../sdkwork-search/packages/pc-react/foundation/sdkwork-search-pc-react/src/index.ts'
);
export const EXTERNAL_AUTH_PC_REACT_ENTRY = path.resolve(
  repoRoot,
  '../sdkwork-appbase/packages/pc-react/iam/sdkwork-auth-pc-react/src/index.ts'
);
export const EXTERNAL_USER_PC_REACT_ENTRY = path.resolve(
  repoRoot,
  '../sdkwork-appbase/packages/pc-react/iam/sdkwork-user-pc-react/src/index.ts'
);
export const EXTERNAL_USER_CENTER_CORE_PC_REACT_ENTRY = path.resolve(
  repoRoot,
  '../sdkwork-appbase/packages/pc-react/iam/sdkwork-user-center-core-pc-react/src/index.ts'
);
export const EXTERNAL_USER_CENTER_PC_REACT_ENTRY = path.resolve(
  repoRoot,
  '../sdkwork-appbase/packages/pc-react/iam/sdkwork-user-center-pc-react/src/index.ts'
);
export const EXTERNAL_USER_CENTER_VALIDATION_PC_REACT_ENTRY = path.resolve(
  repoRoot,
  '../sdkwork-appbase/packages/pc-react/iam/sdkwork-user-center-validation-pc-react/src/index.ts'
);

export const GIT_SDK_ROOT = path.resolve(repoRoot, '.sdk-git-sources');
export const GIT_CORE_CHECKOUT = path.resolve(GIT_SDK_ROOT, 'sdkwork-core');
export const GIT_SDK_COMMON_CHECKOUT = path.resolve(GIT_SDK_ROOT, 'sdkwork-sdk-commons');
export const GIT_UI_CHECKOUT = path.resolve(GIT_SDK_ROOT, 'sdkwork-ui');
export const GIT_APPBASE_CHECKOUT = path.resolve(GIT_SDK_ROOT, 'sdkwork-appbase');
export const GIT_SEARCH_CHECKOUT = path.resolve(GIT_SDK_ROOT, 'sdkwork-search');

export const GIT_SDK_COMMON_ENTRY = path.resolve(
  GIT_SDK_COMMON_CHECKOUT,
  'sdkwork-sdk-common-typescript/src/index.ts'
);
export const GIT_CORE_PC_REACT_ENTRY = path.resolve(
  GIT_CORE_CHECKOUT,
  'sdkwork-core-pc-react/src/index.ts'
);
export const GIT_UI_PC_REACT_ENTRY = path.resolve(
  GIT_UI_CHECKOUT,
  'sdkwork-ui-pc-react/src/index.ts'
);
export const GIT_APPBASE_PC_REACT_ENTRY = path.resolve(
  GIT_APPBASE_CHECKOUT,
  'packages/pc-react/foundation/sdkwork-appbase-pc-react/src/index.ts'
);
export const GIT_SEARCH_PC_REACT_ENTRY = path.resolve(
  GIT_SEARCH_CHECKOUT,
  'packages/pc-react/foundation/sdkwork-search-pc-react/src/index.ts'
);
export const GIT_AUTH_PC_REACT_ENTRY = path.resolve(
  GIT_APPBASE_CHECKOUT,
  'packages/pc-react/iam/sdkwork-auth-pc-react/src/index.ts'
);
export const GIT_USER_PC_REACT_ENTRY = path.resolve(
  GIT_APPBASE_CHECKOUT,
  'packages/pc-react/iam/sdkwork-user-pc-react/src/index.ts'
);
export const GIT_USER_CENTER_CORE_PC_REACT_ENTRY = path.resolve(
  GIT_APPBASE_CHECKOUT,
  'packages/pc-react/iam/sdkwork-user-center-core-pc-react/src/index.ts'
);
export const GIT_USER_CENTER_PC_REACT_ENTRY = path.resolve(
  GIT_APPBASE_CHECKOUT,
  'packages/pc-react/iam/sdkwork-user-center-pc-react/src/index.ts'
);
export const GIT_USER_CENTER_VALIDATION_PC_REACT_ENTRY = path.resolve(
  GIT_APPBASE_CHECKOUT,
  'packages/pc-react/iam/sdkwork-user-center-validation-pc-react/src/index.ts'
);

const SUPPORTED_SDK_MODES = new Set(['source', 'git', 'npm']);

const SOURCE_MODE_ENTRIES = [
  EXTERNAL_SDK_COMMON_ENTRY,
  EXTERNAL_CORE_PC_REACT_ENTRY,
  EXTERNAL_UI_PC_REACT_ENTRY,
  EXTERNAL_APPBASE_PC_REACT_ENTRY,
  EXTERNAL_SEARCH_PC_REACT_ENTRY,
  EXTERNAL_AUTH_PC_REACT_ENTRY,
  EXTERNAL_USER_PC_REACT_ENTRY,
  EXTERNAL_USER_CENTER_CORE_PC_REACT_ENTRY,
  EXTERNAL_USER_CENTER_PC_REACT_ENTRY,
  EXTERNAL_USER_CENTER_VALIDATION_PC_REACT_ENTRY,
];

const GIT_MODE_ENTRIES = [
  GIT_SDK_COMMON_ENTRY,
  GIT_CORE_PC_REACT_ENTRY,
  GIT_UI_PC_REACT_ENTRY,
  GIT_APPBASE_PC_REACT_ENTRY,
  GIT_SEARCH_PC_REACT_ENTRY,
  GIT_AUTH_PC_REACT_ENTRY,
  GIT_USER_PC_REACT_ENTRY,
  GIT_USER_CENTER_CORE_PC_REACT_ENTRY,
  GIT_USER_CENTER_PC_REACT_ENTRY,
  GIT_USER_CENTER_VALIDATION_PC_REACT_ENTRY,
];

const SDK_MODE_ENTRIES = {
  source: SOURCE_MODE_ENTRIES,
  git: GIT_MODE_ENTRIES,
  npm: [],
};

export function resolveSdkMode(env = process.env) {
  const sdkMode = (env.MAGIC_STUDIO_SDK_MODE ?? 'source').trim().toLowerCase();

  if (!SUPPORTED_SDK_MODES.has(sdkMode)) {
    throw new Error(`Unsupported MAGIC_STUDIO_SDK_MODE: ${sdkMode}`);
  }

  return sdkMode;
}

export function getSdkEntries(sdkMode) {
  return SDK_MODE_ENTRIES[sdkMode] ?? [];
}

export function validateSdkEntries(sdkMode) {
  const missingEntries = getSdkEntries(sdkMode).filter((entry) => !fs.existsSync(entry));

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
