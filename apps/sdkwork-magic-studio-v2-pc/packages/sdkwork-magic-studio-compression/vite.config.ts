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
      name: '@sdkwork/magic-studio-compression',
      formats: ['es'],
      fileName: 'index'
    },
    rollupOptions: {
      external: [
        /^@sdkwork\//,
        'react',
        'react-dom',
        'react/jsx-runtime',
        'jszip'
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
          jszip: 'JSZip'
        }
      }
    },
    sourcemap: true,
  },
});

