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
      name: 'sdkwork-magic-studio-notes',
      formats: ['es'],
      fileName: 'index'
    },
    rollupOptions: {
      external: [
        /^@sdkwork\//,
        'react',
        'react-dom',
        'react/jsx-runtime',
        '@sdkwork/magic-studio-commons',
        '@sdkwork/magic-studio-core',
        '@sdkwork/magic-studio-fs',
        '@sdkwork/magic-studio-editor',
        '@sdkwork/magic-studio-image',
        '@sdkwork/magic-studio-video',
        '@sdkwork/magic-studio-assets',
        '@sdkwork/magic-studio-chat',
        '@sdkwork/magic-studio-settings',
        '@sdkwork/magic-studio-auth'
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
          '@sdkwork/magic-studio-commons': 'SdkworkMagicStudioCommons',
          '@sdkwork/magic-studio-core': 'SdkworkMagicStudioCore',
          '@sdkwork/magic-studio-fs': 'SdkworkMagicStudioFs',
          '@sdkwork/magic-studio-editor': 'SdkworkMagicStudioEditor',
          '@sdkwork/magic-studio-image': 'SdkworkMagicStudioImage',
          '@sdkwork/magic-studio-video': 'SdkworkMagicStudioVideo',
          '@sdkwork/magic-studio-assets': 'SdkworkMagicStudioAssets',
          '@sdkwork/magic-studio-chat': 'SdkworkMagicStudioChat',
          '@sdkwork/magic-studio-settings': 'SdkworkMagicStudioSettings',
          '@sdkwork/magic-studio-auth': 'SdkworkMagicStudioAuth'
        }
      }
    },
    sourcemap: true,
  },
});

