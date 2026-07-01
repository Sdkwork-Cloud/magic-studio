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
      name: 'SdkworkMagicStudioCommons',
      formats: ['es'],
      fileName: 'index'
    },
    rollupOptions: {
      external: [
        /^@sdkwork\//,
        'react', 
        'react-dom', 
        'react/jsx-runtime',
        'lucide-react',
        '@sdkwork/magic-studio-core',
        '@sdkwork/magic-studio-i18n'
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
          'lucide-react': 'LucideReact',
          '@sdkwork/magic-studio-core': 'SdkworkMagicStudioCore',
          '@sdkwork/magic-studio-i18n': 'SdkworkMagicStudioI18n'
        }
      }
    },
    outDir: 'dist',
    sourcemap: true
  }
});
