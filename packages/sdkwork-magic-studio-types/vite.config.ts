import { defineConfig } from 'vite';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const configDirectory = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    lib: {
      entry: resolve(configDirectory, 'src/index.ts'),
      name: '@sdkwork/magic-studio-types',
      formats: ['es'],
      fileName: 'index'
    },
    rollupOptions: {
      external: [/^@sdkwork\//, '@sdkwork/magic-studio-commons'],
    },
    sourcemap: true,
  },
  plugins: [
  ],
});
