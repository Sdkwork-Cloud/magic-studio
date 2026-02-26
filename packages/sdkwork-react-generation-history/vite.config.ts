import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ['src/**/*'],
      outDir: 'dist',
      entryRoot: 'src',
      insertTypesEntry: true,
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'SdkworkReactGenerationHistory',
      formats: ['es'],
      fileName: 'index'
    },
    rollupOptions: {
      external: [
        'react', 
        'react-dom', 
        'react/jsx-runtime',
        '@sdkwork/react-commons',
        '@sdkwork/react-core',
        '@sdkwork/react-i18n'
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
          '@sdkwork/react-commons': 'SdkworkReactCommons',
          '@sdkwork/react-core': 'SdkworkReactCore',
          '@sdkwork/react-i18n': 'SdkworkReactI18n'
        }
      }
    },
    outDir: 'dist',
    sourcemap: true
  }
});
