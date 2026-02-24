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
      name: 'SdkworkReactImage',
      formats: ['es'],
      fileName: 'index'
    },
    rollupOptions: {
      external: [
        'react', 
        'react-dom', 
        'react/jsx-runtime',
        'sdkwork-react-commons',
        'sdkwork-react-core',
        'sdkwork-react-assets',
        'sdkwork-react-settings',
        'sdkwork-react-i18n',
        'sdkwork-react-generation-history'
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
          'sdkwork-react-commons': 'SdkworkReactCommons',
          'sdkwork-react-core': 'SdkworkReactCore',
          'sdkwork-react-assets': 'SdkworkReactAssets',
          'sdkwork-react-settings': 'SdkworkReactSettings',
          'sdkwork-react-i18n': 'SdkworkReactI18n',
          'sdkwork-react-generation-history': 'SdkworkReactGenerationHistory'
        }
      }
    },
    outDir: 'dist',
    sourcemap: true
  }
});
