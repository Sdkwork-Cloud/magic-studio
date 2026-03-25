import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const EXTERNAL_APP_SDK_ENTRY = path.resolve(
  repoRoot,
  '../../spring-ai-plus-app-api/sdkwork-sdk-app/sdkwork-app-sdk-typescript/src/index.ts',
);
const EXTERNAL_SDK_COMMON_ENTRY = path.resolve(
  repoRoot,
  '../../sdk/sdkwork-sdk-commons/sdkwork-sdk-common-typescript/src/index.ts',
);

export function resolveSdkMode() {
  const sdkMode = (process.env.MAGIC_STUDIO_SDK_MODE ?? 'external').trim().toLowerCase();

  if (sdkMode !== 'external' && sdkMode !== 'npm') {
    throw new Error(`Unsupported MAGIC_STUDIO_SDK_MODE: ${sdkMode}`);
  }

  if (sdkMode === 'external') {
    const missingEntries = [EXTERNAL_APP_SDK_ENTRY, EXTERNAL_SDK_COMMON_ENTRY].filter(
      (entry) => !fs.existsSync(entry),
    );

    if (missingEntries.length > 0) {
      throw new Error(
        `MAGIC_STUDIO_SDK_MODE=external requires external SDK source checkouts:\n${missingEntries.join('\n')}`,
      );
    }
  }

  return sdkMode;
}

