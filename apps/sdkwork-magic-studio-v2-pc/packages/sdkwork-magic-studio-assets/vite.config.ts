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
      name: 'SdkworkMagicStudioAssets',
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
        '@sdkwork/magic-studio-drive',
        '@sdkwork/magic-studio-server',
        '@sdkwork/magic-studio-settings',
        '@sdkwork/magic-studio-i18n'
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
          '@sdkwork/magic-studio-commons': 'SdkworkMagicStudioCommons',
          '@sdkwork/magic-studio-core': 'SdkworkMagicStudioCore',
          '@sdkwork/magic-studio-fs': 'SdkworkMagicStudioFs',
          '@sdkwork/magic-studio-drive': 'SdkworkMagicStudioDrive',
          '@sdkwork/magic-studio-server': 'SdkworkMagicStudioServer',
          '@sdkwork/magic-studio-settings': 'SdkworkMagicStudioSettings',
          '@sdkwork/magic-studio-i18n': 'SdkworkMagicStudioI18n'
        }
      }
    },
    outDir: 'dist',
    sourcemap: true
  }
});
