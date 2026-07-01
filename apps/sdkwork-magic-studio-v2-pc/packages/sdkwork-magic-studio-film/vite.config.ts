import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const configDirectory = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(configDirectory, 'src/index.ts'),
      name: 'sdkwork-magic-studio-film',
      formats: ['es'],
      fileName: 'index'
    },
    rollupOptions: {
      external: [
        /^@sdkwork\//,
        'react',
        'react-dom',
        'react/jsx-runtime',
        '@sdkwork/magic-studio-assets',
        '@sdkwork/magic-studio-chat',
        '@sdkwork/magic-studio-commons',
        '@sdkwork/magic-studio-core',
        '@sdkwork/magic-studio-image',
        '@sdkwork/magic-studio-notes',
        '@sdkwork/magic-studio-settings',
        '@sdkwork/magic-studio-types',
        '@sdkwork/magic-studio-video',
        '@sdkwork/magic-studio-voicespeaker',
        '@sdkwork/magic-studio-workspace'
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
          '@sdkwork/magic-studio-assets': 'SdkworkMagicStudioAssets',
          '@sdkwork/magic-studio-chat': 'SdkworkMagicStudioChat',
          '@sdkwork/magic-studio-commons': 'SdkworkMagicStudioCommons',
          '@sdkwork/magic-studio-core': 'SdkworkMagicStudioCore',
          '@sdkwork/magic-studio-image': 'SdkworkMagicStudioImage',
          '@sdkwork/magic-studio-notes': 'SdkworkMagicStudioNotes',
          '@sdkwork/magic-studio-settings': 'SdkworkMagicStudioSettings',
          '@sdkwork/magic-studio-types': 'SdkworkMagicStudioTypes',
          '@sdkwork/magic-studio-video': 'SdkworkMagicStudioVideo',
          '@sdkwork/magic-studio-voicespeaker': 'SdkworkMagicStudioVoiceSpeaker',
          '@sdkwork/magic-studio-workspace': 'SdkworkMagicStudioWorkspace'
        }
      }
    },
    sourcemap: true,
  },
});

