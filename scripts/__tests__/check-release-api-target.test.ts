import { describe, expect, it } from 'vitest';

import {
  PROD_API_BASE_URL,
  analyzeBuiltBundle,
  analyzeReleaseApiTarget,
  parseDotEnv,
} from '../check-release-api-target.mjs';

describe('parseDotEnv', () => {
  it('parses key value pairs and ignores comments', () => {
    expect(
      parseDotEnv(`
        # comment
        VITE_API_BASE_URL=https://api.sdkwork.com
        SDKWORK_ACCESS_TOKEN=
      `)
    ).toEqual({
      VITE_API_BASE_URL: 'https://api.sdkwork.com',
      SDKWORK_ACCESS_TOKEN: '',
    });
  });
});

describe('analyzeReleaseApiTarget', () => {
  it('accepts production release config that targets api.sdkwork.com', () => {
    const result = analyzeReleaseApiTarget({
      packageJson: {
        scripts: {
          build: 'cross-env MAGIC_STUDIO_VITE_MODE=production node scripts/run-app-build.mjs',
          'build:git-sdk':
            'cross-env MAGIC_STUDIO_SDK_MODE=git MAGIC_STUDIO_VITE_MODE=production node scripts/run-app-build.mjs',
          'tauri:build':
            'cross-env MAGIC_STUDIO_SDK_MODE=git tauri build --no-bundle --config src-tauri/tauri.prod.conf.json',
          'tauri:bundle':
            'cross-env MAGIC_STUDIO_SDK_MODE=git tauri build --config src-tauri/tauri.prod.conf.json',
        },
      },
      envProduction: parseDotEnv(`
        VITE_API_BASE_URL=${PROD_API_BASE_URL}
        VITE_APP_API_BASE_URL=${PROD_API_BASE_URL}
        SDKWORK_API_BASE_URL=${PROD_API_BASE_URL}
      `),
      tauriProdConfig: {
        build: {
          beforeBuildCommand: 'pnpm run build:git-sdk',
        },
      },
    });

    expect(result.errors).toEqual([]);
  });

  it('flags non-production API targets in release config', () => {
    const result = analyzeReleaseApiTarget({
      packageJson: {
        scripts: {
          'build:git-sdk':
            'cross-env MAGIC_STUDIO_SDK_MODE=git MAGIC_STUDIO_VITE_MODE=test node scripts/run-app-build.mjs',
        },
      },
      envProduction: parseDotEnv(`
        VITE_API_BASE_URL=https://api-test.sdkwork.com
      `),
      tauriProdConfig: {
        build: {
          beforeBuildCommand: 'pnpm run build:test',
        },
      },
    });

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          '.env.production VITE_API_BASE_URL must be https://api.sdkwork.com'
        ),
        expect.stringContaining(
          'package.json script "build:git-sdk" must set MAGIC_STUDIO_VITE_MODE=production'
        ),
        expect.stringContaining(
          'src-tauri/tauri.prod.conf.json beforeBuildCommand must call "pnpm run build:git-sdk"'
        ),
      ])
    );
  });
});

describe('analyzeBuiltBundle', () => {
  it('accepts production bundle env payloads that use api.sdkwork.com', () => {
    const result = analyzeBuiltBundle(`
      const env={MODE:"production",VITE_API_BASE_URL:"https://api.sdkwork.com",VITE_APP_ENV:"production"};
    `);

    expect(result.errors).toEqual([]);
  });

  it('flags bundles compiled with the wrong API target', () => {
    const result = analyzeBuiltBundle(`
      const env={MODE:"test",VITE_API_BASE_URL:"https://api-test.sdkwork.com",VITE_APP_ENV:"test"};
    `);

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Built bundle MODE must be "production"'),
        expect.stringContaining(
          'Built bundle VITE_API_BASE_URL must be https://api.sdkwork.com'
        ),
      ])
    );
  });
});
