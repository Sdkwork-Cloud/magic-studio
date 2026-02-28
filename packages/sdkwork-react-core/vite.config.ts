import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
      rollupTypes: false,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: '@sdkwork/react-core',
      formats: ['es'],
      fileName: 'index'
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'zustand',
        '@google/genai',
        '@tauri-apps/api',
        '@tauri-apps/plugin-*',
        '@sdkwork/react-commons',
        '@sdkwork/react-fs'
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
          zustand: 'zustand',
          '@google/genai': 'GoogleGenAI',
          '@tauri-apps/api': 'TauriApi',
          '@sdkwork/react-commons': 'SdkworkReactCommons',
          '@sdkwork/react-fs': 'SdkworkReactFs'
        }
      }
    },
    sourcemap: true,
    minify: false,
  },
});

