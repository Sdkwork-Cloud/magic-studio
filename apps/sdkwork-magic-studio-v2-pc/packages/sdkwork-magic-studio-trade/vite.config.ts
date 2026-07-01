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
      name: '@sdkwork/magic-studio-trade',
      formats: ['es'],
      fileName: () => 'index.js',
    },
    outDir: 'dist',
    rollupOptions: {
      external: [
        /^@sdkwork\//,
        'react',
        'react-dom',
        'lucide-react',
        'classnames',
        'zustand',
        '@sdkwork/magic-studio-core',
        '@sdkwork/magic-studio-commons',
        '@sdkwork/magic-studio-auth',
        '@sdkwork/magic-studio-workspace',
        '@sdkwork/magic-studio-notifications',
        '@sdkwork/magic-studio-vip',
        '@sdkwork/magic-studio-i18n',
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'lucide-react': 'lucide-react',
          classnames: 'classnames',
          zustand: 'zustand',
          '@sdkwork/magic-studio-core': 'SdkworkMagicStudioCore',
          '@sdkwork/magic-studio-commons': 'SdkworkMagicStudioCommons',
          '@sdkwork/magic-studio-auth': 'SdkworkMagicStudioAuth',
          '@sdkwork/magic-studio-workspace': 'SdkworkMagicStudioWorkspace',
          '@sdkwork/magic-studio-notifications': 'SdkworkMagicStudioNotifications',
          '@sdkwork/magic-studio-vip': 'SdkworkMagicStudioVip',
          '@sdkwork/magic-studio-i18n': 'SdkworkMagicStudioI18n',
        },
      },
    },
  },
});
