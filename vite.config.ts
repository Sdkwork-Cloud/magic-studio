import path from 'path';
import { existsSync, readdirSync } from 'fs';
import { createRequire } from 'node:module';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'url';
import { configDefaults } from 'vitest/config';
import {
  EXTERNAL_APPBASE_PC_REACT_ENTRY,
  EXTERNAL_AUTH_PC_REACT_ENTRY,
  EXTERNAL_CORE_PC_REACT_ENTRY,
  EXTERNAL_SDK_COMMON_ENTRY,
  EXTERNAL_SEARCH_PC_REACT_ENTRY,
  EXTERNAL_UI_PC_REACT_ENTRY,
  EXTERNAL_USER_CENTER_CORE_PC_REACT_ENTRY,
  EXTERNAL_USER_CENTER_PC_REACT_ENTRY,
  EXTERNAL_USER_CENTER_VALIDATION_PC_REACT_ENTRY,
  EXTERNAL_USER_PC_REACT_ENTRY,
  GIT_APPBASE_PC_REACT_ENTRY,
  GIT_AUTH_PC_REACT_ENTRY,
  GIT_CORE_PC_REACT_ENTRY,
  GIT_SDK_COMMON_ENTRY,
  GIT_SEARCH_PC_REACT_ENTRY,
  GIT_UI_PC_REACT_ENTRY,
  GIT_USER_CENTER_CORE_PC_REACT_ENTRY,
  GIT_USER_CENTER_PC_REACT_ENTRY,
  GIT_USER_CENTER_VALIDATION_PC_REACT_ENTRY,
  GIT_USER_PC_REACT_ENTRY,
} from './scripts/sdk-mode.mjs';
import { resolveViteCacheDir } from './scripts/vite-path.mjs';
import { resolveManualChunk } from './scripts/vite-manual-chunks.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRequire = createRequire(import.meta.url);
const HOST_SHARED_UI_RUNTIME_PACKAGES = [
  '@radix-ui/react-avatar',
  '@radix-ui/react-checkbox',
  '@radix-ui/react-context-menu',
  '@radix-ui/react-dialog',
  '@radix-ui/react-dropdown-menu',
  '@radix-ui/react-hover-card',
  '@radix-ui/react-label',
  '@radix-ui/react-menubar',
  '@radix-ui/react-popover',
  '@radix-ui/react-radio-group',
  '@radix-ui/react-scroll-area',
  '@radix-ui/react-select',
  '@radix-ui/react-separator',
  '@radix-ui/react-slider',
  '@radix-ui/react-slot',
  '@radix-ui/react-switch',
  '@radix-ui/react-tabs',
  '@radix-ui/react-tooltip',
  '@tanstack/react-table',
  'class-variance-authority',
  'clsx',
  'cmdk',
  'lucide-react',
  'react-day-picker',
  'react-hook-form',
  'react-resizable-panels',
  'sonner',
  'tailwind-merge',
];
const HOST_DEDUPE_PACKAGES = [
  'react',
  'react-dom',
  'react-router-dom',
  ...HOST_SHARED_UI_RUNTIME_PACKAGES,
];

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const resolveAppDependency = (specifier: string): string => appRequire.resolve(specifier);
const resolvePnpmDependencySubpath = (packageName: string, subpath: string): string => {
  const specifier = `${packageName}/${subpath}`;

  try {
    return appRequire.resolve(specifier);
  } catch {
    const pnpmRoot = path.resolve(__dirname, 'node_modules/.pnpm');
    const encodedPackageName = packageName.replace('/', '+');

    if (existsSync(pnpmRoot)) {
      for (const entry of readdirSync(pnpmRoot, { withFileTypes: true })) {
        if (!entry.isDirectory() || !entry.name.startsWith(`${encodedPackageName}@`)) {
          continue;
        }

        const candidate = path.join(
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

    return appRequire.resolve(specifier);
  }
};
const createHostDependencyAliases = (specifiers: string[]) =>
  specifiers.map((specifier) => ({
    find: new RegExp(`^${escapeRegex(specifier)}$`),
    replacement: resolveAppDependency(specifier),
  }));
const firstNonEmptyValue = (...values: Array<string | undefined>): string | undefined => {
  for (const value of values) {
    if (typeof value === 'string') {
      const normalized = value.trim();
      if (normalized) {
        return normalized;
      }
    }
  }
  return undefined;
};
const resolveEntryRoot = (entry: string): string => path.dirname(entry);

const resolveSdkAliases = () => {
  const sdkMode = (process.env.MAGIC_STUDIO_SDK_MODE ?? 'source').trim().toLowerCase();

  if (sdkMode === 'npm') {
    return [];
  }

  const entryMap =
    sdkMode === 'source'
      ? {
          common: EXTERNAL_SDK_COMMON_ENTRY,
          core: EXTERNAL_CORE_PC_REACT_ENTRY,
          ui: EXTERNAL_UI_PC_REACT_ENTRY,
          appbase: EXTERNAL_APPBASE_PC_REACT_ENTRY,
          search: EXTERNAL_SEARCH_PC_REACT_ENTRY,
          auth: EXTERNAL_AUTH_PC_REACT_ENTRY,
          user: EXTERNAL_USER_PC_REACT_ENTRY,
          userCenterCore: EXTERNAL_USER_CENTER_CORE_PC_REACT_ENTRY,
          userCenter: EXTERNAL_USER_CENTER_PC_REACT_ENTRY,
          userCenterValidation: EXTERNAL_USER_CENTER_VALIDATION_PC_REACT_ENTRY,
        }
      : sdkMode === 'git'
        ? {
            common: GIT_SDK_COMMON_ENTRY,
            core: GIT_CORE_PC_REACT_ENTRY,
            ui: GIT_UI_PC_REACT_ENTRY,
            appbase: GIT_APPBASE_PC_REACT_ENTRY,
            search: GIT_SEARCH_PC_REACT_ENTRY,
            auth: GIT_AUTH_PC_REACT_ENTRY,
            user: GIT_USER_PC_REACT_ENTRY,
            userCenterCore: GIT_USER_CENTER_CORE_PC_REACT_ENTRY,
            userCenter: GIT_USER_CENTER_PC_REACT_ENTRY,
            userCenterValidation: GIT_USER_CENTER_VALIDATION_PC_REACT_ENTRY,
          }
        : null;

  if (!entryMap) {
    throw new Error(`Unsupported MAGIC_STUDIO_SDK_MODE: ${sdkMode}`);
  }

  const missingEntries = Object.values(entryMap).filter((entry) => !existsSync(entry));

  if (missingEntries.length > 0) {
    throw new Error(
      `MAGIC_STUDIO_SDK_MODE=${sdkMode} requires SDK source checkouts:\n${missingEntries.join('\n')}`
    );
  }

  const coreRoot = resolveEntryRoot(entryMap.core);
  const uiRoot = resolveEntryRoot(entryMap.ui);

  return [
    { find: '@sdkwork/sdk-common', replacement: entryMap.common },
    { find: '@sdkwork/core-pc-react/app', replacement: path.resolve(coreRoot, 'app/index.ts') },
    { find: '@sdkwork/core-pc-react/env', replacement: path.resolve(coreRoot, 'env/index.ts') },
    { find: '@sdkwork/core-pc-react/hooks', replacement: path.resolve(coreRoot, 'hooks/index.ts') },
    {
      find: '@sdkwork/core-pc-react/preferences',
      replacement: path.resolve(coreRoot, 'preferences/index.ts'),
    },
    { find: '@sdkwork/core-pc-react/runtime', replacement: path.resolve(coreRoot, 'runtime/index.ts') },
    { find: '@sdkwork/core-pc-react', replacement: entryMap.core },
    { find: '@sdkwork/auth-pc-react', replacement: entryMap.auth },
    { find: '@sdkwork/user-pc-react', replacement: entryMap.user },
    { find: '@sdkwork/appbase-pc-react', replacement: entryMap.appbase },
    { find: '@sdkwork/search-pc-react', replacement: entryMap.search },
    {
      find: '@sdkwork/ui-pc-react/components/ui/actions',
      replacement: path.resolve(uiRoot, 'components/ui/actions/index.ts'),
    },
    {
      find: '@sdkwork/ui-pc-react/components/ui/data-entry',
      replacement: path.resolve(uiRoot, 'components/ui/data-entry/index.ts'),
    },
    {
      find: '@sdkwork/ui-pc-react/components/ui/feedback',
      replacement: path.resolve(uiRoot, 'components/ui/feedback/index.ts'),
    },
    {
      find: '@sdkwork/ui-pc-react/components/ui/form',
      replacement: path.resolve(uiRoot, 'components/ui/form/index.ts'),
    },
    {
      find: '@sdkwork/ui-pc-react/components/patterns/settings',
      replacement: path.resolve(__dirname, 'src/shims/sdkwork-ui-settings.tsx'),
    },
    {
      find: '@sdkwork/ui-pc-react/components/patterns/workspace',
      replacement: path.resolve(uiRoot, 'components/patterns/workspace/index.ts'),
    },
    { find: '@sdkwork/ui-pc-react/theme', replacement: path.resolve(uiRoot, 'theme/index.ts') },
    { find: '@sdkwork/ui-pc-react', replacement: entryMap.ui },
    { find: '@sdkwork/user-center-core-pc-react', replacement: entryMap.userCenterCore },
    { find: '@sdkwork/user-center-pc-react', replacement: entryMap.userCenter },
    {
      find: '@sdkwork/user-center-validation-pc-react',
      replacement: entryMap.userCenterValidation,
    },
  ];
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const compatibilityApiBaseUrl = firstNonEmptyValue(
    env.SDKWORK_API_BASE_URL,
    env.VITE_API_BASE_URL,
    env.VITE_APP_API_BASE_URL
  );
  const compatibilityAccessToken = firstNonEmptyValue(
    env.SDKWORK_ACCESS_TOKEN,
    env.VITE_ACCESS_TOKEN
  );
  const compatibilityTimeout = firstNonEmptyValue(env.SDKWORK_TIMEOUT, env.VITE_TIMEOUT);
  const compatibilityPlatform = firstNonEmptyValue(env.SDKWORK_PLATFORM, env.VITE_PLATFORM);
  return {
    server: {
      port: 9000,
      host: '0.0.0.0',
      strictPort: true,
    },
    test: {
      exclude: [
        ...configDefaults.exclude,
        '**/.worktrees/**',
        '**/*.node.test.mjs',
        'scripts/*.test.mjs',
        'scripts/*.test.ts',
      ],
      setupFiles: ['tests/vitest.setup.ts'],
    },
    cacheDir: resolveViteCacheDir({ env: process.env }),
    plugins: [tailwindcss(), react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.SDKWORK_API_BASE_URL': JSON.stringify(compatibilityApiBaseUrl),
      'process.env.SDKWORK_ACCESS_TOKEN': JSON.stringify(compatibilityAccessToken),
      'process.env.SDKWORK_TIMEOUT': JSON.stringify(compatibilityTimeout),
      'process.env.SDKWORK_PLATFORM': JSON.stringify(compatibilityPlatform),
    },
    build: {
      chunkSizeWarningLimit: 1200,
      modulePreload: false,
      rolldownOptions: {
        output: {
          strictExecutionOrder: true,
          codeSplitting: {
            includeDependenciesRecursively: false,
            groups: [
              {
                name: (moduleId) => resolveManualChunk(moduleId) ?? null,
              },
            ],
          },
        },
      },
    },
    resolve: {
      dedupe: [...HOST_DEDUPE_PACKAGES],
      alias: [
        { find: '@', replacement: path.resolve(__dirname, '.') },

        // Core packages - subpaths first (more specific)
        {
          find: '@sdkwork/magic-studio-core/router',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-core/src/router/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-core/services',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-core/src/services/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-core/storage',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-core/src/storage/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-core/store',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-core/src/store/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-core/eventBus',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-core/src/eventBus/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-core/platform',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-core/src/platform/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-core/ai',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-core/src/ai/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-core/utils',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-core/src/utils/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-core/sdk',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-core/src/sdk/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-core',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-core/src/index.ts'),
        },

        {
          find: '@sdkwork/magic-studio-i18n',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-i18n/src/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-commons/hooks/useAssetUrl',
          replacement: path.resolve(
            __dirname,
            'packages/sdkwork-magic-studio-commons/src/hooks/useAssetUrl.ts'
          ),
        },
        {
          find: '@sdkwork/magic-studio-commons/hooks',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-commons/src/hooks/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-commons/framework/tokens',
          replacement: path.resolve(
            __dirname,
            'packages/sdkwork-magic-studio-commons/src/components/framework/tokens.ts'
          ),
        },
        {
          find: '@sdkwork/magic-studio-commons/algorithms',
          replacement: path.resolve(
            __dirname,
            'packages/sdkwork-magic-studio-commons/src/algorithms/index.ts'
          ),
        },
        {
          find: '@sdkwork/magic-studio-commons/components',
          replacement: path.resolve(
            __dirname,
            'packages/sdkwork-magic-studio-commons/src/components/index.ts'
          ),
        },
        {
          find: '@sdkwork/magic-studio-commons/constants',
          replacement: path.resolve(
            __dirname,
            'packages/sdkwork-magic-studio-commons/src/constants/index.ts'
          ),
        },
        {
          find: '@sdkwork/magic-studio-commons/utils/serviceAdapter',
          replacement: path.resolve(
            __dirname,
            'packages/sdkwork-magic-studio-commons/src/utils/serviceAdapter.ts'
          ),
        },
        {
          find: '@sdkwork/magic-studio-commons/utils/helpers',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-commons/src/utils/helpers.ts'),
        },
        {
          find: '@sdkwork/magic-studio-commons/utils/logger',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-commons/src/utils/logger.ts'),
        },
        {
          find: '@sdkwork/magic-studio-commons/utils/assetIdentity',
          replacement: path.resolve(
            __dirname,
            'packages/sdkwork-magic-studio-commons/src/utils/assetIdentity.ts'
          ),
        },
        {
          find: '@sdkwork/magic-studio-commons/utils',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-commons/src/utils/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-commons/types',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-commons/src/types.ts'),
        },
        {
          find: '@sdkwork/magic-studio-commons/services',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-commons/src/services/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-commons/ui',
          replacement: path.resolve(
            __dirname,
            'packages/sdkwork-magic-studio-commons/src/components/ui/index.tsx'
          ),
        },
        {
          find: '@sdkwork/magic-studio-commons',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-commons/src/index.ts'),
        },

        // @sdkwork/magic-studio-assets subpaths
        {
          find: '@sdkwork/magic-studio-assets/components/generate/upload/types',
          replacement: path.resolve(
            __dirname,
            'packages/sdkwork-magic-studio-assets/src/components/generate/upload/types.ts'
          ),
        },
        {
          find: '@sdkwork/magic-studio-assets/components/generate/GenerationHistoryListPane',
          replacement: path.resolve(
            __dirname,
            'packages/sdkwork-magic-studio-assets/src/components/generate/GenerationHistoryListPane.tsx'
          ),
        },
        {
          find: '@sdkwork/magic-studio-assets/components/generate/GenerationChatWindow',
          replacement: path.resolve(
            __dirname,
            'packages/sdkwork-magic-studio-assets/src/components/generate/GenerationChatWindow.tsx'
          ),
        },
        {
          find: '@sdkwork/magic-studio-assets/components/generate/GenerationHistory',
          replacement: path.resolve(
            __dirname,
            'packages/sdkwork-magic-studio-assets/src/components/generate/GenerationHistory.tsx'
          ),
        },
        {
          find: '@sdkwork/magic-studio-assets/components/generate/GenerationItem',
          replacement: path.resolve(
            __dirname,
            'packages/sdkwork-magic-studio-assets/src/components/generate/GenerationItem.tsx'
          ),
        },
        {
          find: '@sdkwork/magic-studio-assets/components/generate/GenerationPreview',
          replacement: path.resolve(
            __dirname,
            'packages/sdkwork-magic-studio-assets/src/components/generate/GenerationPreview.tsx'
          ),
        },
        {
          find: '@sdkwork/magic-studio-assets/components/generate/PromptTextInput',
          replacement: path.resolve(
            __dirname,
            'packages/sdkwork-magic-studio-assets/src/components/generate/PromptTextInput.tsx'
          ),
        },
        {
          find: '@sdkwork/magic-studio-assets/components/generate/PromptText',
          replacement: path.resolve(
            __dirname,
            'packages/sdkwork-magic-studio-assets/src/components/generate/PromptText.tsx'
          ),
        },
        {
          find: '@sdkwork/magic-studio-assets/components/generate/upload/UploadGenerationModal',
          replacement: path.resolve(
            __dirname,
            'packages/sdkwork-magic-studio-assets/src/components/generate/upload/UploadGenerationModal.tsx'
          ),
        },
        {
          find: '@sdkwork/magic-studio-assets/components/generate/upload/UploadImageGenerationModal',
          replacement: path.resolve(
            __dirname,
            'packages/sdkwork-magic-studio-assets/src/components/generate/upload/UploadImageGenerationModal.tsx'
          ),
        },
        {
          find: '@sdkwork/magic-studio-assets/components/generate/upload/UploadMusicGenerationModal',
          replacement: path.resolve(
            __dirname,
            'packages/sdkwork-magic-studio-assets/src/components/generate/upload/UploadMusicGenerationModal.tsx'
          ),
        },
        {
          find: '@sdkwork/magic-studio-assets/components/generate/upload/UploadVideoGenerationModal',
          replacement: path.resolve(
            __dirname,
            'packages/sdkwork-magic-studio-assets/src/components/generate/upload/UploadVideoGenerationModal.tsx'
          ),
        },
        {
          find: '@sdkwork/magic-studio-assets/components/generate/upload/PreviewModal',
          replacement: path.resolve(
            __dirname,
            'packages/sdkwork-magic-studio-assets/src/components/generate/upload/PreviewModal.tsx'
          ),
        },
        {
          find: '@sdkwork/magic-studio-assets/CreationChatInput/StyleSelector',
          replacement: path.resolve(
            __dirname,
            'packages/sdkwork-magic-studio-assets/src/components/CreationChatInput/StyleSelector.tsx'
          ),
        },

        // Feature packages
        {
          find: '@sdkwork/magic-studio-prompt/i18n',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-prompt/src/i18n/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-auth/store',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-auth/src/store/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-auth/i18n',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-auth/src/i18n/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-auth',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-auth/src/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-settings/store',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-settings/src/store/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-settings/services',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-settings/src/services/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-settings/entities',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-settings/src/entities/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-settings/constants',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-settings/src/constants.ts'),
        },
        {
          find: '@sdkwork/magic-studio-settings',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-settings/src/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-workspace/store',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-workspace/src/store/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-workspace/components',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-workspace/src/components/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-workspace',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-workspace/src/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-notifications/store',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-notifications/src/store/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-notifications',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-notifications/src/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-user/i18n',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-user/src/i18n/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-vip/pages',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-vip/src/pages/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-vip/store',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-vip/src/store/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-vip/pricing-modal',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-vip/src/pricing-modal/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-vip',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-vip/src/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-user',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-user/src/index.ts'),
        },
        {
          find: 'react-router-dom',
          replacement: path.resolve(__dirname, 'src/shims/react-router-dom.tsx'),
        },
        {
          find: /^qrcode\/lib\/browser\.js$/,
          replacement: resolvePnpmDependencySubpath('qrcode', 'lib/browser.js'),
        },
        {
          find: /^qrcode$/,
          replacement: path.resolve(__dirname, 'src/shims/qrcode.ts'),
        },
        ...createHostDependencyAliases(HOST_SHARED_UI_RUNTIME_PACKAGES),
        {
          find: /^react\/jsx-dev-runtime$/,
          replacement: resolveAppDependency('react/jsx-dev-runtime'),
        },
        {
          find: /^react\/jsx-runtime$/,
          replacement: resolveAppDependency('react/jsx-runtime'),
        },
        {
          find: /^react-dom$/,
          replacement: resolveAppDependency('react-dom'),
        },
        {
          find: /^react-dom\/client$/,
          replacement: resolveAppDependency('react-dom/client'),
        },
        {
          find: /^react$/,
          replacement: resolveAppDependency('react'),
        },

        // Media packages
        {
          find: '@sdkwork/magic-studio-audio/services',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-audio/src/services/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-audio/modals',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-audio/src/modals/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-audio/recorder',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-audio/src/recorder/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-audio/pages',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-audio/src/pages/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-audio/store',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-audio/src/store/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-audio/panels',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-audio/src/panels/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-audio/i18n',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-audio/src/i18n/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-audio',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-audio/src/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-music/pages',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-music/src/pages/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-music/store',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-music/src/store/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-music/panels',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-music/src/panels/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-music/i18n',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-music/src/i18n/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-music/modals',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-music/src/modals/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-music',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-music/src/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-sfx/modals',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-sfx/src/modals/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-sfx/pages',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-sfx/src/pages/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-sfx/store',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-sfx/src/store/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-sfx/panels',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-sfx/src/panels/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-sfx/i18n',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-sfx/src/i18n/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-sfx',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-sfx/src/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-voicespeaker/entities',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-voicespeaker/src/entities/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-voicespeaker/services',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-voicespeaker/src/services/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-voicespeaker/constants',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-voicespeaker/src/constants.ts'),
        },
        {
          find: '@sdkwork/magic-studio-voicespeaker/picker',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-voicespeaker/src/picker/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-voicespeaker/pages',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-voicespeaker/src/pages/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-voicespeaker/store',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-voicespeaker/src/store/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-voicespeaker/panels',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-voicespeaker/src/panels/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-voicespeaker/i18n',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-voicespeaker/src/i18n/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-voicespeaker',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-voicespeaker/src/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-image/entities',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-image/src/entities/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-image/services',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-image/src/services/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-image/constants',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-image/src/constants.ts'),
        },
        {
          find: '@sdkwork/magic-studio-image/modals',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-image/src/modals/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-image/selectors',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-image/src/selectors/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-image/pages',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-image/src/pages/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-image/store',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-image/src/store/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-image/panels',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-image/src/panels/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-image/i18n',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-image/src/i18n/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-image',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-image/src/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-video/entities',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-video/src/entities/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-video/services',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-video/src/services/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-video/modals',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-video/src/modals/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-video/selectors',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-video/src/selectors/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-video/pages',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-video/src/pages/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-video/store',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-video/src/store/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-video/panels',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-video/src/panels/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-video/i18n',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-video/src/i18n/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-video',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-video/src/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-character/pages',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-character/src/pages/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-character/store',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-character/src/store/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-character/panels',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-character/src/panels/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-character/i18n',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-character/src/i18n/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-character',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-character/src/index.ts'),
        },

        // Tool packages
        {
          find: '@sdkwork/magic-studio-assets/pages',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-assets/src/pages/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-assets/store',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-assets/src/store/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-assets/i18n',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-assets/src/i18n/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-assets/generation',
          replacement: path.resolve(
            __dirname,
            'packages/sdkwork-magic-studio-assets/src/generation/index.ts'
          ),
        },
        {
          find: '@sdkwork/magic-studio-assets/creation-chat',
          replacement: path.resolve(
            __dirname,
            'packages/sdkwork-magic-studio-assets/src/creation-chat/index.ts'
          ),
        },
        {
          find: '@sdkwork/magic-studio-assets/choose-asset',
          replacement: path.resolve(
            __dirname,
            'packages/sdkwork-magic-studio-assets/src/choose-asset/index.ts'
          ),
        },
        {
          find: '@sdkwork/magic-studio-assets/style-selector',
          replacement: path.resolve(
            __dirname,
            'packages/sdkwork-magic-studio-assets/src/style-selector/index.ts'
          ),
        },
        {
          find: '@sdkwork/magic-studio-assets/asset-service',
          replacement: path.resolve(
            __dirname,
            'packages/sdkwork-magic-studio-assets/src/asset-service/index.ts'
          ),
        },
        {
          find: '@sdkwork/magic-studio-assets/hooks',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-assets/src/hooks/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-assets/entities',
          replacement: path.resolve(
            __dirname,
            'packages/sdkwork-magic-studio-assets/src/entities/index.ts'
          ),
        },
        {
          find: '@sdkwork/magic-studio-assets/services',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-assets/src/services/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-assets/asset-center',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-assets/src/asset-center/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-assets',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-assets/src/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-browser/pages',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-browser/src/pages/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-browser',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-browser/src/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-chat/pages',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-chat/src/pages/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-chat/store',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-chat/src/store/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-chat/embedded-pane',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-chat/src/embedded-pane/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-chat/i18n',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-chat/src/i18n/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-chat',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-chat/src/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-drive/pages',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-drive/src/pages/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-drive',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-drive/src/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-editor/pages',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-editor/src/pages/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-editor/store',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-editor/src/store/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-editor/project-actions',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-editor/src/project-actions/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-editor/file-icon',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-editor/src/file-icon/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-editor/file-picker',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-editor/src/file-picker/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-editor',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-editor/src/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-notes/pages',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-notes/src/pages/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-canvas/pages',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-canvas/src/pages/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-chatppt/pages',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-chatppt/src/pages/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-chatppt/store',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-chatppt/src/store/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-chatppt/panels',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-chatppt/src/panels/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-chatppt',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-chatppt/src/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-film/pages',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-film/src/pages/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-film/i18n',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-film/src/i18n/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-film',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-film/src/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-prompt/pages',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-prompt/src/pages/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-prompt',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-prompt/src/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-magiccut/pages',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-magiccut/src/pages/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-magiccut/store',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-magiccut/src/store/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-magiccut',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-magiccut/src/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-notes',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-notes/src/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-portal-video/pages',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-portal-video/src/pages/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-portal-video/portal-header',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-portal-video/src/portal-header/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-portal-video',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-portal-video/src/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-trade/pages',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-trade/src/pages/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-trade',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-trade/src/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-skills/pages',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-skills/src/pages/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-skills',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-skills/src/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-plugins/pages',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-plugins/src/pages/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-plugins',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-plugins/src/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-canvas',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-canvas/src/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-generation-history',
          replacement: path.resolve(
            __dirname,
            'packages/sdkwork-magic-studio-generation-history/src/index.ts'
          ),
        },
        {
          find: '@sdkwork/magic-studio-server',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-server/src/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-host-core',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-host-core/src/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-host-types',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-host-types/src/index.ts'),
        },

        // Infrastructure packages
        {
          find: '@sdkwork/magic-studio-types/asset-reference',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-types/src/asset-reference.ts'),
        },
        {
          find: '@sdkwork/magic-studio-types/entity',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-types/src/entity.types.ts'),
        },
        {
          find: '@sdkwork/magic-studio-types/service',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-types/src/service.types.ts'),
        },
        {
          find: '@sdkwork/magic-studio-types/pagination',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-types/src/pagination.types.ts'),
        },
        {
          find: '@sdkwork/magic-studio-types/storage',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-types/src/storage.types.ts'),
        },
        {
          find: '@sdkwork/magic-studio-types/media',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-types/src/media.types.ts'),
        },
        {
          find: '@sdkwork/magic-studio-types/assets',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-types/src/assets.types.ts'),
        },
        {
          find: '@sdkwork/magic-studio-types/asset-center',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-types/src/asset-center.types.ts'),
        },
        {
          find: '@sdkwork/magic-studio-types/drive',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-types/src/drive.types.ts'),
        },
        {
          find: '@sdkwork/magic-studio-types/image',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-types/src/image.types.ts'),
        },
        {
          find: '@sdkwork/magic-studio-types/canvas',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-types/src/canvas.types.ts'),
        },
        {
          find: '@sdkwork/magic-studio-types/video',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-types/src/video.types.ts'),
        },
        {
          find: '@sdkwork/magic-studio-types/audio',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-types/src/audio.types.ts'),
        },
        {
          find: '@sdkwork/magic-studio-types/music',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-types/src/music.types.ts'),
        },
        {
          find: '@sdkwork/magic-studio-types/film',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-types/src/film.types.ts'),
        },
        {
          find: '@sdkwork/magic-studio-types/character',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-types/src/character.types.ts'),
        },
        {
          find: '@sdkwork/magic-studio-types/voice',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-types/src/voice.types.ts'),
        },
        {
          find: '@sdkwork/magic-studio-types/sfx',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-types/src/sfx.types.ts'),
        },
        {
          find: '@sdkwork/magic-studio-types/chat',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-types/src/chat.types.ts'),
        },
        {
          find: '@sdkwork/magic-studio-types/chatppt',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-types/src/chatppt.types.ts'),
        },
        {
          find: '@sdkwork/magic-studio-types/agi',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-types/src/agi.types.ts'),
        },
        {
          find: '@sdkwork/magic-studio-types/input-resource',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-types/src/input-resource.utils.ts'),
        },
        {
          find: '@sdkwork/magic-studio-types/vocabulary',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-types/src/vocabulary.types.ts'),
        },
        {
          find: '@sdkwork/magic-studio-types/catalog',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-types/src/catalog.types.ts'),
        },
        {
          find: '@sdkwork/magic-studio-types/content',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-types/src/content.types.ts'),
        },
        {
          find: '@sdkwork/magic-studio-types/auth',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-types/src/auth.types.ts'),
        },
        {
          find: '@sdkwork/magic-studio-types/notes',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-types/src/notes.types.ts'),
        },
        {
          find: '@sdkwork/magic-studio-types/user',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-types/src/user.types.ts'),
        },
        {
          find: '@sdkwork/magic-studio-types/workspace',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-types/src/workspace.types.ts'),
        },
        {
          find: '@sdkwork/magic-studio-types/runtime',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-types/src/runtime.types.ts'),
        },
        {
          find: '@sdkwork/magic-studio-types/theme-mode',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-types/src/theme-mode.ts'),
        },
        {
          find: '@sdkwork/magic-studio-types/infrastructure',
          replacement: path.resolve(
            __dirname,
            'packages/sdkwork-magic-studio-types/src/infrastructure.types.ts'
          ),
        },
        {
          find: '@sdkwork/magic-studio-types/magiccut',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-types/src/magiccut.types.ts'),
        },
        {
          find: '@sdkwork/magic-studio-types/project-graph',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-types/src/project-graph.types.ts'),
        },
        {
          find: '@sdkwork/magic-studio-types',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-types/src/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-fs/services',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-fs/src/services/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-fs',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-fs/src/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-compression',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-compression/src/index.ts'),
        },
        {
          find: '@sdkwork/magic-studio-ide-config',
          replacement: path.resolve(__dirname, 'packages/sdkwork-magic-studio-ide-config/src/index.ts'),
        },

        // SDK
        ...resolveSdkAliases(),
      ],
    },
  };
});
