import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { existsSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const configDirectory = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(configDirectory, '../..');
const workspaceRequire = createRequire(resolve(workspaceRoot, 'package.json'));
const appSdkEntry = resolve(
  workspaceRoot,
  '../../spring-ai-plus-app-api/sdkwork-sdk-app/sdkwork-app-sdk-typescript/src/index.ts',
);
const appSdkRoot = dirname(appSdkEntry);
const sdkCommonEntry = resolve(
  workspaceRoot,
  '../../sdk/sdkwork-sdk-commons/sdkwork-sdk-common-typescript/src/index.ts',
);
const corePcReactRoot = resolve(
  workspaceRoot,
  '../sdkwork-core/sdkwork-core-pc-react/src',
);

const resolvePnpmDependencySubpath = (packageName: string, subpath: string): string => {
  const specifier = `${packageName}/${subpath}`;

  try {
    return workspaceRequire.resolve(specifier);
  } catch {
    const pnpmRoot = resolve(workspaceRoot, 'node_modules/.pnpm');
    const encodedPackageName = packageName.replace('/', '+');

    if (existsSync(pnpmRoot)) {
      for (const entry of readdirSync(pnpmRoot, { withFileTypes: true })) {
        if (!entry.isDirectory() || !entry.name.startsWith(`${encodedPackageName}@`)) {
          continue;
        }

        const candidate = resolve(
          pnpmRoot,
          entry.name,
          'node_modules',
          packageName,
          subpath,
        );
        if (existsSync(candidate)) {
          return candidate;
        }
      }
    }

    return workspaceRequire.resolve(specifier);
  }
};

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: /^@sdkwork\/app-sdk\/(.+)$/,
        replacement: `${appSdkRoot}/$1`,
      },
      {
        find: '@sdkwork/app-sdk',
        replacement: appSdkEntry,
      },
      {
        find: '@sdkwork/sdk-common',
        replacement: sdkCommonEntry,
      },
      {
        find: '@sdkwork/core-pc-react/app',
        replacement: resolve(corePcReactRoot, 'app/index.ts'),
      },
      {
        find: '@sdkwork/core-pc-react/env',
        replacement: resolve(corePcReactRoot, 'env/index.ts'),
      },
      {
        find: '@sdkwork/core-pc-react/hooks',
        replacement: resolve(corePcReactRoot, 'hooks/index.ts'),
      },
      {
        find: '@sdkwork/core-pc-react/preferences',
        replacement: resolve(corePcReactRoot, 'preferences/index.ts'),
      },
      {
        find: '@sdkwork/core-pc-react/runtime',
        replacement: resolve(corePcReactRoot, 'runtime/index.ts'),
      },
      {
        find: '@sdkwork/core-pc-react',
        replacement: resolve(corePcReactRoot, 'index.ts'),
      },
      {
        find: '@sdkwork/ui-pc-react/components/ui/actions',
        replacement: resolve(configDirectory, '../../../sdkwork-ui/sdkwork-ui-pc-react/src/components/ui/actions/index.ts'),
      },
      {
        find: '@sdkwork/ui-pc-react/components/ui/data-entry',
        replacement: resolve(configDirectory, '../../../sdkwork-ui/sdkwork-ui-pc-react/src/components/ui/data-entry/index.ts'),
      },
      {
        find: '@sdkwork/ui-pc-react/components/ui/feedback',
        replacement: resolve(configDirectory, '../../../sdkwork-ui/sdkwork-ui-pc-react/src/components/ui/feedback/index.ts'),
      },
      {
        find: '@sdkwork/ui-pc-react/theme',
        replacement: resolve(configDirectory, '../../../sdkwork-ui/sdkwork-ui-pc-react/src/theme/index.ts'),
      },
      {
        find: '@sdkwork/appbase-pc-react',
        replacement: resolve(configDirectory, '../../../sdkwork-appbase/packages/pc-react/foundation/sdkwork-appbase-pc-react/src/index.ts'),
      },
      {
        find: '@sdkwork/auth-pc-react',
        replacement: resolve(configDirectory, '../../src/shims/auth-pc-react.ts'),
      },
      {
        find: '@sdkwork/magic-studio-commons/utils/serviceAdapter',
        replacement: resolve(configDirectory, '../sdkwork-magic-studio-commons/src/utils/serviceAdapter.ts'),
      },
      {
        find: '@sdkwork/search-pc-react',
        replacement: resolve(configDirectory, '../../../sdkwork-appbase/packages/pc-react/foundation/sdkwork-search-pc-react/src/index.ts'),
      },
      {
        find: '@sdkwork/ui-pc-react',
        replacement: resolve(configDirectory, '../../../sdkwork-ui/sdkwork-ui-pc-react/src/index.ts'),
      },
      {
        find: /^qrcode\/lib\/browser\.js$/,
        replacement: resolvePnpmDependencySubpath('qrcode', 'lib/browser.js'),
      },
      {
        find: /^qrcode$/,
        replacement: resolve(configDirectory, '../../src/shims/qrcode.ts'),
      },
      {
        find: 'react-router-dom',
        replacement: resolve(configDirectory, '../../src/shims/react-router-dom.tsx'),
      },
    ],
  },
  build: {
    lib: {
      entry: resolve(configDirectory, 'src/index.ts'),
      name: 'sdkwork-magic-studio-auth',
      formats: ['es'],
      fileName: 'index'
    },
    rollupOptions: {
      external: [
        /^@sdkwork\//,
        'react',
        'react-dom',
        'react/jsx-runtime',
        'sdkwork-magic-studio-commons',
        'sdkwork-magic-studio-core',
        'sdkwork-magic-studio-i18n'
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
          'sdkwork-magic-studio-commons': 'SdkworkMagicStudioCommons',
          'sdkwork-magic-studio-core': 'SdkworkMagicStudioCore',
          'sdkwork-magic-studio-i18n': 'SdkworkMagicStudioI18n'
        }
      }
    },
    sourcemap: true,
  },
  test: {
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      'tests/**/*.{test,spec}.{ts,tsx}',
    ],
  },
});

