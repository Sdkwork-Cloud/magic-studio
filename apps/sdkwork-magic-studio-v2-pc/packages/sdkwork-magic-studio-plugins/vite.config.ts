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
      name: 'SdkworkMagicStudioPlugins',
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
        '@sdkwork/magic-studio-i18n',
        '@sdkwork/magic-studio-portal-video/portal-header',
        '@sdkwork/magic-studio-portal-video'
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
          '@sdkwork/magic-studio-commons': 'SdkworkMagicStudioCommons',
          '@sdkwork/magic-studio-core': 'SdkworkMagicStudioCore',
          '@sdkwork/magic-studio-i18n': 'SdkworkMagicStudioI18n',
          '@sdkwork/magic-studio-portal-video/portal-header': 'SdkworkMagicStudioPortalVideo',
          '@sdkwork/magic-studio-portal-video': 'SdkworkMagicStudioPortalVideo'
        }
      }
    },
    outDir: 'dist',
    sourcemap: true
  }
});
