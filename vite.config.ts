import path from 'path';
import { existsSync } from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { configDefaults } from 'vitest/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EXTERNAL_APP_SDK_ENTRY = path.resolve(
  __dirname,
  '../../spring-ai-plus-app-api/sdkwork-sdk-app/sdkwork-app-sdk-typescript/src/index.ts'
);
const EXTERNAL_SDK_COMMON_ENTRY = path.resolve(
  __dirname,
  '../../sdk/sdkwork-sdk-commons/sdkwork-sdk-common-typescript/src/index.ts'
);
const GIT_SDK_ROOT = path.resolve(__dirname, '.sdk-git-sources');
const GIT_APP_SDK_ENTRY = path.resolve(
  GIT_SDK_ROOT,
  'sdkwork-sdk-app/sdkwork-app-sdk-typescript/src/index.ts'
);
const GIT_SDK_COMMON_ENTRY = path.resolve(
  GIT_SDK_ROOT,
  'sdkwork-sdk-commons/sdkwork-sdk-common-typescript/src/index.ts'
);

const normalizeModuleId = (id: string): string => id.replace(/\\/g, '/');

const resolveSdkAliases = () => {
  const sdkMode = (process.env.MAGIC_STUDIO_SDK_MODE ?? 'external').trim().toLowerCase();

  if (sdkMode === 'npm') {
    return [];
  }

  const entryMap =
    sdkMode === 'external'
      ? {
          app: EXTERNAL_APP_SDK_ENTRY,
          common: EXTERNAL_SDK_COMMON_ENTRY,
        }
      : sdkMode === 'git'
        ? {
            app: GIT_APP_SDK_ENTRY,
            common: GIT_SDK_COMMON_ENTRY,
          }
        : null;

  if (!entryMap) {
    throw new Error(`Unsupported MAGIC_STUDIO_SDK_MODE: ${sdkMode}`);
  }

  const missingEntries = [entryMap.app, entryMap.common].filter(entry => !existsSync(entry));

  if (missingEntries.length > 0) {
    throw new Error(
      `MAGIC_STUDIO_SDK_MODE=${sdkMode} requires SDK source checkouts:\n${missingEntries.join('\n')}`
    );
  }

  return [
    { find: '@sdkwork/app-sdk', replacement: entryMap.app },
    { find: '@sdkwork/sdk-common', replacement: entryMap.common },
  ];
};

const resolveManualChunk = (id: string): string | undefined => {
  const normalized = normalizeModuleId(id);

  if (normalized.includes('/node_modules/')) {
    return 'vendor';
  }

  if (normalized.includes('/packages/sdkwork-react-magiccut/')) return 'feature-magiccut';
  if (normalized.includes('/packages/sdkwork-react-film/')) return 'feature-film';
  if (normalized.includes('/packages/sdkwork-react-notes/')) return 'feature-notes';
  if (normalized.includes('/packages/sdkwork-react-editor/')) return 'feature-editor';
  if (normalized.includes('/packages/sdkwork-react-drive/')) return 'feature-drive';
  if (normalized.includes('/packages/sdkwork-react-portal-video/')) return 'feature-portal-video';
  if (normalized.includes('/packages/sdkwork-react-assets/')) return 'feature-assets';
  return undefined;
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 9000,
      host: '0.0.0.0',
      strictPort: true,
    },
    test: {
      exclude: [...configDefaults.exclude, '**/.worktrees/**'],
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    build: {
      chunkSizeWarningLimit: 1200,
      modulePreload: false,
      rollupOptions: {
        output: {
          manualChunks: resolveManualChunk,
        },
      },
    },
    resolve: {
      alias: [
        { find: '@', replacement: path.resolve(__dirname, '.') },

        // Core packages - subpaths first (more specific)
        {
          find: '@sdkwork/react-core/router',
          replacement: path.resolve(__dirname, 'packages/sdkwork-react-core/src/router/index.ts'),
        },
        {
          find: '@sdkwork/react-core/store',
          replacement: path.resolve(__dirname, 'packages/sdkwork-react-core/src/store/index.ts'),
        },
        {
          find: '@sdkwork/react-core/eventBus',
          replacement: path.resolve(__dirname, 'packages/sdkwork-react-core/src/eventBus/index.ts'),
        },
        {
          find: '@sdkwork/react-core/platform',
          replacement: path.resolve(__dirname, 'packages/sdkwork-react-core/src/platform/index.ts'),
        },
        {
          find: '@sdkwork/react-core/ai',
          replacement: path.resolve(__dirname, 'packages/sdkwork-react-core/src/ai/index.ts'),
        },
        {
          find: '@sdkwork/react-core/utils',
          replacement: path.resolve(__dirname, 'packages/sdkwork-react-core/src/utils/index.ts'),
        },
        {
          find: '@sdkwork/react-core',
          replacement: path.resolve(__dirname, 'packages/sdkwork-react-core/src/index.ts'),
        },

        {
          find: '@sdkwork/react-i18n',
          replacement: path.resolve(__dirname, 'packages/sdkwork-react-i18n/src/index.ts'),
        },
        {
          find: '@sdkwork/react-commons/hooks/useAssetUrl',
          replacement: path.resolve(
            __dirname,
            'packages/sdkwork-react-commons/src/hooks/useAssetUrl.ts'
          ),
        },
        {
          find: '@sdkwork/react-commons/ui',
          replacement: path.resolve(
            __dirname,
            'packages/sdkwork-react-commons/src/components/ui/index.tsx'
          ),
        },
        {
          find: '@sdkwork/react-commons',
          replacement: path.resolve(__dirname, 'packages/sdkwork-react-commons/src/index.ts'),
        },

        // @sdkwork/react-assets subpaths
        {
          find: '@sdkwork/react-assets/components/generate/upload/types',
          replacement: path.resolve(
            __dirname,
            'packages/sdkwork-react-assets/src/components/generate/upload/types.ts'
          ),
        },
        {
          find: '@sdkwork/react-assets/components/generate/GenerationHistoryListPane',
          replacement: path.resolve(
            __dirname,
            'packages/sdkwork-react-assets/src/components/generate/GenerationHistoryListPane.tsx'
          ),
        },
        {
          find: '@sdkwork/react-assets/components/generate/GenerationChatWindow',
          replacement: path.resolve(
            __dirname,
            'packages/sdkwork-react-assets/src/components/generate/GenerationChatWindow.tsx'
          ),
        },
        {
          find: '@sdkwork/react-assets/components/generate/GenerationHistory',
          replacement: path.resolve(
            __dirname,
            'packages/sdkwork-react-assets/src/components/generate/GenerationHistory.tsx'
          ),
        },
        {
          find: '@sdkwork/react-assets/components/generate/GenerationItem',
          replacement: path.resolve(
            __dirname,
            'packages/sdkwork-react-assets/src/components/generate/GenerationItem.tsx'
          ),
        },
        {
          find: '@sdkwork/react-assets/components/generate/GenerationPreview',
          replacement: path.resolve(
            __dirname,
            'packages/sdkwork-react-assets/src/components/generate/GenerationPreview.tsx'
          ),
        },
        {
          find: '@sdkwork/react-assets/components/generate/PromptTextInput',
          replacement: path.resolve(
            __dirname,
            'packages/sdkwork-react-assets/src/components/generate/PromptTextInput.tsx'
          ),
        },
        {
          find: '@sdkwork/react-assets/components/generate/PromptText',
          replacement: path.resolve(
            __dirname,
            'packages/sdkwork-react-assets/src/components/generate/PromptText.tsx'
          ),
        },
        {
          find: '@sdkwork/react-assets/components/generate/upload/UploadGenerationModal',
          replacement: path.resolve(
            __dirname,
            'packages/sdkwork-react-assets/src/components/generate/upload/UploadGenerationModal.tsx'
          ),
        },
        {
          find: '@sdkwork/react-assets/components/generate/upload/UploadImageGenerationModal',
          replacement: path.resolve(
            __dirname,
            'packages/sdkwork-react-assets/src/components/generate/upload/UploadImageGenerationModal.tsx'
          ),
        },
        {
          find: '@sdkwork/react-assets/components/generate/upload/UploadMusicGenerationModal',
          replacement: path.resolve(
            __dirname,
            'packages/sdkwork-react-assets/src/components/generate/upload/UploadMusicGenerationModal.tsx'
          ),
        },
        {
          find: '@sdkwork/react-assets/components/generate/upload/UploadVideoGenerationModal',
          replacement: path.resolve(
            __dirname,
            'packages/sdkwork-react-assets/src/components/generate/upload/UploadVideoGenerationModal.tsx'
          ),
        },
        {
          find: '@sdkwork/react-assets/components/generate/upload/PreviewModal',
          replacement: path.resolve(
            __dirname,
            'packages/sdkwork-react-assets/src/components/generate/upload/PreviewModal.tsx'
          ),
        },
        {
          find: '@sdkwork/react-assets/CreationChatInput/StyleSelector',
          replacement: path.resolve(
            __dirname,
            'packages/sdkwork-react-assets/src/components/CreationChatInput/StyleSelector.tsx'
          ),
        },

        // Feature packages
        {
          find: '@sdkwork/react-auth',
          replacement: path.resolve(__dirname, 'packages/sdkwork-react-auth/src/index.ts'),
        },
        {
          find: '@sdkwork/react-settings',
          replacement: path.resolve(__dirname, 'packages/sdkwork-react-settings/src/index.ts'),
        },
        {
          find: '@sdkwork/react-workspace',
          replacement: path.resolve(__dirname, 'packages/sdkwork-react-workspace/src/index.ts'),
        },
        {
          find: '@sdkwork/react-notifications',
          replacement: path.resolve(__dirname, 'packages/sdkwork-react-notifications/src/index.ts'),
        },
        {
          find: '@sdkwork/react-vip',
          replacement: path.resolve(__dirname, 'packages/sdkwork-react-vip/src/index.ts'),
        },
        {
          find: '@sdkwork/react-user',
          replacement: path.resolve(__dirname, 'packages/sdkwork-react-user/src/index.ts'),
        },

        // Media packages
        {
          find: '@sdkwork/react-audio',
          replacement: path.resolve(__dirname, 'packages/sdkwork-react-audio/src/index.ts'),
        },
        {
          find: '@sdkwork/react-music',
          replacement: path.resolve(__dirname, 'packages/sdkwork-react-music/src/index.ts'),
        },
        {
          find: '@sdkwork/react-sfx',
          replacement: path.resolve(__dirname, 'packages/sdkwork-react-sfx/src/index.ts'),
        },
        {
          find: '@sdkwork/react-voicespeaker',
          replacement: path.resolve(__dirname, 'packages/sdkwork-react-voicespeaker/src/index.ts'),
        },
        {
          find: '@sdkwork/react-image',
          replacement: path.resolve(__dirname, 'packages/sdkwork-react-image/src/index.ts'),
        },
        {
          find: '@sdkwork/react-video',
          replacement: path.resolve(__dirname, 'packages/sdkwork-react-video/src/index.ts'),
        },
        {
          find: '@sdkwork/react-character',
          replacement: path.resolve(__dirname, 'packages/sdkwork-react-character/src/index.ts'),
        },

        // Tool packages
        {
          find: '@sdkwork/react-assets',
          replacement: path.resolve(__dirname, 'packages/sdkwork-react-assets/src/index.ts'),
        },
        {
          find: '@sdkwork/react-browser',
          replacement: path.resolve(__dirname, 'packages/sdkwork-react-browser/src/index.ts'),
        },
        {
          find: '@sdkwork/react-chat',
          replacement: path.resolve(__dirname, 'packages/sdkwork-react-chat/src/index.ts'),
        },
        {
          find: '@sdkwork/react-drive',
          replacement: path.resolve(__dirname, 'packages/sdkwork-react-drive/src/index.ts'),
        },
        {
          find: '@sdkwork/react-editor',
          replacement: path.resolve(__dirname, 'packages/sdkwork-react-editor/src/index.ts'),
        },
        {
          find: '@sdkwork/react-canvas',
          replacement: path.resolve(__dirname, 'packages/sdkwork-react-canvas/src/index.ts'),
        },
        {
          find: '@sdkwork/react-chatppt',
          replacement: path.resolve(__dirname, 'packages/sdkwork-react-chatppt/src/index.ts'),
        },
        {
          find: '@sdkwork/react-film',
          replacement: path.resolve(__dirname, 'packages/sdkwork-react-film/src/index.ts'),
        },
        {
          find: '@sdkwork/react-prompt',
          replacement: path.resolve(__dirname, 'packages/sdkwork-react-prompt/src/index.ts'),
        },
        {
          find: '@sdkwork/react-magiccut',
          replacement: path.resolve(__dirname, 'packages/sdkwork-react-magiccut/src/index.ts'),
        },
        {
          find: '@sdkwork/react-notes',
          replacement: path.resolve(__dirname, 'packages/sdkwork-react-notes/src/index.ts'),
        },
        {
          find: '@sdkwork/react-portal-video',
          replacement: path.resolve(__dirname, 'packages/sdkwork-react-portal-video/src/index.ts'),
        },
        {
          find: '@sdkwork/react-trade',
          replacement: path.resolve(__dirname, 'packages/sdkwork-react-trade/src/index.ts'),
        },
        {
          find: '@sdkwork/react-skills',
          replacement: path.resolve(__dirname, 'packages/sdkwork-react-skills/src/index.ts'),
        },
        {
          find: '@sdkwork/react-plugins',
          replacement: path.resolve(__dirname, 'packages/sdkwork-react-plugins/src/index.ts'),
        },
        {
          find: '@sdkwork/react-generation-history',
          replacement: path.resolve(
            __dirname,
            'packages/sdkwork-react-generation-history/src/index.ts'
          ),
        },

        // Infrastructure packages
        {
          find: '@sdkwork/react-types',
          replacement: path.resolve(__dirname, 'packages/sdkwork-react-types/src/index.ts'),
        },
        {
          find: '@sdkwork/react-fs',
          replacement: path.resolve(__dirname, 'packages/sdkwork-react-fs/src/index.ts'),
        },
        {
          find: '@sdkwork/react-compression',
          replacement: path.resolve(__dirname, 'packages/sdkwork-react-compression/src/index.ts'),
        },
        {
          find: '@sdkwork/react-ide-config',
          replacement: path.resolve(__dirname, 'packages/sdkwork-react-ide-config/src/index.ts'),
        },

        // SDK
        ...resolveSdkAliases(),
      ],
    },
  };
});
