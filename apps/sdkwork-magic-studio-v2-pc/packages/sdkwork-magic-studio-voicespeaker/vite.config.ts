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
      name: '@sdkwork/magic-studio-voicespeaker',
      formats: ['es'],
      fileName: 'index'
    },
    rollupOptions: {
      external: [
        /^@sdkwork\//,
        'react',
        'react-dom',
        'react/jsx-runtime',
        '@sdkwork/magic-studio-audio',
        '@sdkwork/magic-studio-commons',
        '@sdkwork/magic-studio-core',
        '@sdkwork/magic-studio-assets',
        '@sdkwork/magic-studio-i18n',
        '@sdkwork/magic-studio-image',
        '@sdkwork/magic-studio-settings'
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
          '@sdkwork/magic-studio-audio': 'SdkworkMagicStudioAudio',
          '@sdkwork/magic-studio-commons': 'SdkworkMagicStudioCommons',
          '@sdkwork/magic-studio-core': 'SdkworkMagicStudioCore',
          '@sdkwork/magic-studio-assets': 'SdkworkMagicStudioAssets',
          '@sdkwork/magic-studio-i18n': 'SdkworkMagicStudioI18n',
          '@sdkwork/magic-studio-image': 'SdkworkMagicStudioImage',
          '@sdkwork/magic-studio-settings': 'SdkworkMagicStudioSettings'
        }
      }
    },
    sourcemap: true,
  },
});

