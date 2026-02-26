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
      rollupTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: '@sdkwork/react-fs',
      formats: ['es'],
      fileName: 'index'
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        '@tauri-apps/api',
        '@tauri-apps/plugin-fs',
        '@tauri-apps/plugin-dialog',
        '@sdkwork/react-types',
        '@sdkwork/react-commons'
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
          '@tauri-apps/api': 'TauriApi',
          '@tauri-apps/plugin-fs': 'TauriPluginFs',
          '@tauri-apps/plugin-dialog': 'TauriPluginDialog',
          '@sdkwork/react-types': 'SdkworkReactTypes',
          '@sdkwork/react-commons': 'SdkworkReactCommons'
        }
      }
    },
    sourcemap: true,
  },
});
